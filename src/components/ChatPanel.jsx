import useChatEntrance from "../hooks/useChatEntrance";
import { chatAppearanceVars, CHAT_LABELS } from "../lib/chat-appearance";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CHAT_MESSAGE_LIMIT, safeChatHref } from "../lib/chat";
import { cdnSrc, THUMB } from "../lib/image-cdn";

function ChatArrow() {
  return <svg className="orora-chat-arrow" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true"><path d="m4 12 8-8M4 4h8v8" /></svg>;
}

function ChoiceSymbol({ index }) {
  const paths = ["m3 8 4-5h10l4 5-9 13ZM3 8h18", "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z", "M4 4h7v16H4Zm9 0h7v16h-7Z", "M5 8h14l1 13H4ZM8 9V6a4 4 0 0 1 8 0v3", "M12 2 15 9 22 12 15 15 12 22 9 15 2 12 9 9Z", "M6 3 3 6c0 8 7 15 15 15l3-3-6-4-2 2-5-5 2-2Z"];
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true"><path d={paths[index % paths.length]} /></svg>;
}

function ChatLink({ href, children, className, onNavigate }) {
  const safe = safeChatHref(href);
  if (!safe) return null;
  return safe.startsWith("/") ? <Link to={safe} className={className} onClick={onNavigate}>{children}</Link> : <a href={safe} className={className} target={safe.startsWith("https:") ? "_blank" : undefined} rel="noopener noreferrer">{children}</a>;
}

export default function ChatPanel({ id, settings, conversation, onClose, contactLinks = [], dockSide='right', anchorY, panelWidth=340, panelHeight=520, anchor, motion }) {
  const { messages, sending, error, send, retry, reset, metadata } = conversation;
  const [input, setInput] = useState("");
  const root = useRef(null), heading = useRef(null), log = useRef(null), followLatest = useRef(true);
  const titleId = useId();
  const label = (key) => typeof settings.labels?.[key] === "string" && settings.labels[key].trim() ? settings.labels[key].trim().slice(0, 120) : CHAT_LABELS[key];
  const last = messages.at(-1);
  const mode = [...messages].reverse().find((m) => m.role === "assistant")?.mode || metadata?.mode;
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    const escape = (event) => { if (event.key === "Escape" && !document.querySelector("dialog:modal")) { event.preventDefault(); onClose(); } };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [onClose]);
  useLayoutEffect(() => {
    const viewport = window.visualViewport;
    const measure = () => {
      const viewportHeight=viewport?.height || innerHeight, viewportTop=viewport?.offsetTop || 0;
      const height=Math.min(Math.max(280,Math.min(680,Number(panelHeight)||520)),Math.max(0,viewportHeight-24));
      const top=Math.max(viewportTop+12,Math.min(viewportTop+viewportHeight-height-12,(anchorY ?? viewportTop+viewportHeight)-height-12));
      root.current?.style.setProperty("--chat-panel-height",`${height}px`);
      root.current?.style.setProperty("--chat-panel-top",`${top}px`);
      root.current?.style.setProperty("--chat-viewport-height", `${viewport?.height || innerHeight}px`); root.current?.style.setProperty("--chat-viewport-top", `${viewport?.offsetTop || 0}px`); root.current?.classList.toggle("is-compact", (viewport?.height || innerHeight) < 500); };
    measure(); viewport?.addEventListener("resize", measure); viewport?.addEventListener("scroll", measure); window.addEventListener("resize", measure);
    return () => { viewport?.removeEventListener("resize", measure); viewport?.removeEventListener("scroll", measure); window.removeEventListener("resize", measure); };
  }, [anchorY,panelHeight]);
  useLayoutEffect(() => { if (log.current && followLatest.current) log.current.scrollTop = log.current.scrollHeight; }, [messages, sending, error]);
  useChatEntrance(root,anchor,motion);
  const submit = (text, quick = false) => { if (send(text)) { followLatest.current = true; setInput(""); if (quick) log.current?.focus({ preventScroll: true }); } };
  return <section ref={root} id={id} data-dock-side={dockSide} className="orora-chat-panel" role="dialog" aria-labelledby={titleId} style={{...chatAppearanceVars(settings),"--chat-panel-width":`${Math.max(280,Math.min(440,Number(panelWidth)||340))}px`}}>
    <header className="orora-chat-heading"><span className="orora-chat-avatar" aria-hidden="true">✦</span><div><h2 ref={heading} id={titleId} tabIndex={-1}>{settings.title}</h2><p><span className="orora-chat-status-dot" />{mode === "ai" ? label("statusAi") : label("statusGuided")}</p></div><button type="button" className="orora-chat-icon-button" onClick={() => { followLatest.current = true; reset(); setInput(""); }} aria-label="Bắt đầu cuộc trò chuyện mới" title="Cuộc trò chuyện mới" disabled={!messages.length && !input}>↺</button><button type="button" className="orora-chat-icon-button" onClick={onClose} aria-label="Đóng chat">×</button></header>
    <div ref={log} onScroll={event=>{const viewport=event.currentTarget;followLatest.current=viewport.scrollHeight-viewport.scrollTop-viewport.clientHeight<56;}} className="orora-chat-log" role="log" tabIndex={-1} aria-label="Cuộc trò chuyện với ORORA" aria-live="polite" aria-relevant="additions">
      <div className="orora-chat-welcome"><span className="orora-chat-welcome-icon" aria-hidden="true">✧</span><h3>{label("welcomeTitle")}</h3><p>{settings.greeting}</p></div>
      {!messages.length && <div className="orora-chat-starters" aria-label="Chọn nhu cầu tư vấn">{settings.starters.map((item, index) => <button type="button" key={item.id} onClick={() => submit(item.prompt, true)} disabled={sending}><ChoiceSymbol index={index} /><span>{item.label}</span><ChatArrow /></button>)}</div>}
      {messages.map((message) => <article key={message.id} className={`orora-chat-message is-${message.role}`} aria-label={message.role === "user" ? label("user") : label("assistant")}>
        {message.role !== "user" && <span className="orora-chat-message-author">{label("assistant")}{message.mode === "ai" && <small>AI</small>}</span>}<p>{message.content}</p>
        {message.products?.length > 0 && <div className="orora-chat-products">{message.products.map((product) => <ChatLink key={product.id} href={product.url} className="orora-chat-product" onNavigate={onClose}>{product.image && (/^https?:\/\//.test(product.image) || /^\/(?!\/)/.test(product.image)) ? <img src={cdnSrc(product.image, THUMB)} alt="" width="52" height="64" loading="lazy" /> : <span className="orora-chat-product-placeholder" aria-hidden="true">◇</span>}<span><small>#{product.number}</small><strong>{product.name}</strong><b>{product.price}</b></span><ChatArrow /></ChatLink>)}</div>}
        {message.links?.length > 0 && <div className="orora-chat-links">{message.links.map((link) => <ChatLink key={link.id} href={link.href} onNavigate={onClose}><span>{link.label}</span><ChatArrow /></ChatLink>)}</div>}
        {message.notice && <small className="orora-chat-notice">{message.notice}</small>}
      </article>)}
      {sending && <div className="orora-chat-typing" role="status"><span /><span /><span /><small>{label("typing")}</small></div>}
      {error && <div className="orora-chat-error" role="alert"><p>{error.message}</p><button type="button" onClick={()=>{followLatest.current=true;retry();}} disabled={sending}>{label("retry")}</button></div>}
      {!sending && last?.role === "assistant" && last.suggestions?.length > 0 && <div className="orora-chat-followups" aria-label="Câu hỏi gợi ý">{last.suggestions.map((suggestion) => <button type="button" key={suggestion} onClick={() => submit(suggestion, true)}><span>{suggestion}</span><ChatArrow /></button>)}</div>}
    </div>
    <footer className="orora-chat-footer"><form className="orora-chat-composer" onSubmit={(event) => { event.preventDefault(); submit(input); }}><textarea aria-label="Tin nhắn của bạn" rows={2} maxLength={CHAT_MESSAGE_LIMIT} placeholder={settings.placeholder} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); submit(input); } }} /><button type="submit" aria-label="Gửi tin nhắn" disabled={sending || !input.trim()}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 20V4m-6 6 6-6 6 6" /></svg></button></form><div className="orora-chat-footer-note"><small>{mode === "ai" ? label("footerAi") : label("footerGuided")}</small>{contactLinks[0] && <ChatLink href={contactLinks[0].href} onNavigate={onClose}>{label("handoff")} <ChatArrow /></ChatLink>}</div></footer>
  </section>;
}
