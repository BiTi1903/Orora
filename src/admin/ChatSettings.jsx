import useDraftGuard from "../hooks/useDraftGuard";
import ChatChannelSettings from "./ChatChannelSettings";
import ChatTypography from "./ChatTypography";
import TranslationHelp from "./TranslationHelp";
import { useEffect, useRef, useState } from "react";
import { chatSettings, DEFAULT_CHAT_STARTERS } from "../lib/chat";
import { getHomeContent, saveHomeContent, explainError } from "../lib/api";
import { changedValues, mergeSavedValues } from "./builder/save-sections";
import { FONT_OPTIONS } from "../lib/typography";

export default function ChatSettings() {
  const [form, setForm] = useState(() => chatSettings());
  const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null), [status, setStatus] = useState(null);
  const baseline = useRef({});
  const [panel, setPanel] = useState("general");
  const readStatus = () => fetch("/api/chat").then((response) => response.ok ? response.json() : null).then(setStatus).catch(() => setStatus(null));
  useEffect(() => {
    let alive = true;
    getHomeContent().then((home) => {
      if (!alive) return;
      const raw = home?.chatSettings || {};
      const loaded = { ...raw, ...chatSettings(raw), starters: Array.isArray(raw.starters) ? raw.starters.map((item) => ({ ...item })) : DEFAULT_CHAT_STARTERS.map((item) => ({ ...item })) };
      baseline.current = loaded; setForm(loaded);
    }).catch((error) => { if (alive) { setFailed(true); setNotice({ error: true, text: explainError(error) }); } }).finally(() => { if (alive) setLoading(false); });
    fetch("/api/chat").then((response) => response.ok ? response.json() : null).then((data) => { if (alive) setStatus(data); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const markSaved=useDraftGuard(form,{enabled:!loading&&!failed,busy});
  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const patchStarter = (index, changes) => setForm((current) => ({ ...current, starters: current.starters.map((item, at) => at === index ? { ...item, ...changes } : item) }));
  return <section className="chat-settings-admin"><div className="admin-top"><div><h1>Chat AI</h1><p className="admin-muted">Trợ lý tư vấn dùng thông tin sản phẩm, chính sách và kiến thức cửa hàng.</p></div></div>
    <details className="admin-card"><summary>Kết nối OpenAI và trạng thái cấu hình</summary><div className="chat-connection-card"><div><h2>Kết nối OpenAI</h2><p>{status ? status.aiConfigured ? "Máy chủ đã có cấu hình khóa OpenAI." : "Chưa có khóa OpenAI trên máy chủ." : "Chưa đọc được trạng thái kết nối máy chủ."}</p><p className="admin-muted">Đặt OPENAI_API_KEY trong Environment Variables của Vercel rồi redeploy để bật AI. Khi chưa có khóa hoặc AI tạm lỗi, chat vẫn gợi ý từ thông tin đã đăng.</p></div><button type="button" className="admin-btn" onClick={readStatus}>Kiểm tra trạng thái</button></div></details>
    <form aria-busy={busy} className="admin-card admin-form" onInvalidCapture={(event) => { const target = event.target; const nextPanel = target.closest("[data-chat-panel]")?.dataset.chatPanel; if(nextPanel) { setPanel(nextPanel); requestAnimationFrame(() => target.focus()); } }} onSubmit={async (event) => {
      event.preventDefault(); if (loading || failed || busy) return;
      if (form.starters.length > 6 || form.starters.some((item) => !String(item.label || "").trim() || !String(item.prompt || "").trim())) { setPanel("starters"); return setNotice({ error: true, text: "Điền tên và câu hỏi cho từng lựa chọn gợi ý (tối đa 6 lựa chọn)." }); }
      setBusy(true); setNotice(null);
      try {
        const next = { ...form, title: form.title.trim(), greeting: form.greeting.trim(), placeholder: form.placeholder.trim(), knowledge: form.knowledge.trim(), starters: form.starters.map((s) => ({ ...s, label: s.label.trim(), prompt: s.prompt.trim() })) };
        const changes = changedValues(baseline.current, next);
        if (Object.keys(changes).length) { await saveHomeContent({ chatSettings: changes }); baseline.current = mergeSavedValues(baseline.current, changes); }
        setForm(next);markSaved(next);setNotice({ text: "Đã lưu thiết lập Chat AI." });
      } catch (error) { setNotice({ error: true, text: explainError(error) }); } finally { setBusy(false); }
    }}>
      <div className="product-editor-toolbar-top chat-settings-toolbar"><h2>Nội dung khung chat <TranslationHelp label="thiết lập chat AI">Chỉnh xong từng tab (Hiển thị, Zalo / AI, Kiểu chữ, Câu hỏi gợi ý, Kiến thức AI) rồi bấm Lưu Chat AI một lần để áp dụng lên website.</TranslationHelp></h2><button type="submit" className="admin-btn primary" aria-busy={busy} disabled={loading || failed || busy}>{busy ? "Đang lưu…" : "Lưu Chat AI"}</button></div>
      {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
      <fieldset className="writer-fields" disabled={loading || failed || busy}>
        <nav className="admin-section-tabs" aria-label="Các phần thiết lập Chat AI">{[["general","Hiển thị"],["channels","Chọn Zalo / AI"],["typography","Kiểu chữ"],["starters","Câu hỏi gợi ý"],["knowledge","Kiến thức AI"]].map(([key,label]) => <button type="button" key={key} aria-current={panel===key?"page":undefined} onClick={() => setPanel(key)}>{label}</button>)}</nav>
        {panel === "channels" && <div data-chat-panel="channels" className="chat-settings-panel"><ChatChannelSettings value={form} onChange={patch}/></div>}
        {panel === "typography" && <div data-chat-panel="typography" className="chat-settings-panel">
        <ChatTypography value={form} onChange={patch} />
        </div>}
        {panel === "general" && <div data-chat-panel="general" className="chat-settings-panel"><h3>Hiển thị và lời chào</h3>
        <label className="admin-check"><input type="checkbox" role="switch" checked={form.hintEnabled !== false} onChange={(event) => patch("hintEnabled", event.target.checked)} />Hiện lời nhắc cạnh nút chat</label>
        <div className="admin-form-grid"><div className="admin-field"><label htmlFor="chat-hint-text">Nội dung lời nhắc</label><input id="chat-hint-text" maxLength={160} value={form.hintText || ""} onChange={(event) => patch("hintText", event.target.value)} /></div><div className="admin-field"><label htmlFor="chat-hint-delay">Hiện lần đầu sau (giây)</label><input id="chat-hint-delay" type="number" min={1} max={60} value={form.hintDelay ?? 5} onChange={(event) => patch("hintDelay", Number(event.target.value))} /></div></div>
        <div className="admin-form-grid">{[["hintDuration","Thời gian hiển thị (giây)",3],["hintRepeatDelay","Hiện lại sau khi ẩn (giây)",10]].map(([key,label,fallback])=><div className="admin-field" key={key}><label htmlFor={`chat-${key}`}>{label}</label><input id={`chat-${key}`} type="number" min={1} max={60} value={form[key]??fallback} onChange={event=>patch(key,Number(event.target.value))}/></div>)}</div>
        <div className="admin-field"><label htmlFor="chat-font">Font chữ trợ lý AI</label><select id="chat-font" value={form.fontFamily || ""} onChange={(event) => patch("fontFamily", event.target.value)}>{FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}</select><small className="admin-muted">Áp dụng cho tiêu đề, lời chào, tin nhắn, gợi ý và ô nhập trong khung chat.</small></div>
        <div className="admin-detail-box" style={{ fontFamily: form.fontFamily || "var(--font-body)", overflowWrap: "anywhere" }} aria-label="Xem trước font chữ trợ lý"><strong>{form.title}</strong><p style={{ marginTop: 8 }}>{form.greeting}</p><small>ORORA có thể giúp bạn tìm sản phẩm phù hợp.</small></div>
        <label className="admin-check"><input type="checkbox" role="switch" checked={form.enabled} onChange={(event) => patch("enabled", event.target.checked)} />Hiển thị chat trên website và chi tiết sản phẩm</label>
        <div className="admin-form-grid"><div className="admin-field"><label htmlFor="chat-title">Tên trợ lý</label><input id="chat-title" maxLength={60} value={form.title} onChange={(event) => patch("title", event.target.value)} /></div><div className="admin-field"><label htmlFor="chat-placeholder">Chữ gợi ý ô nhập</label><input id="chat-placeholder" maxLength={100} value={form.placeholder} onChange={(event) => patch("placeholder", event.target.value)} /></div></div>
        <div className="admin-field"><label htmlFor="chat-greeting">Lời chào khi mở chat</label><textarea id="chat-greeting" rows={3} maxLength={600} value={form.greeting} onChange={(event) => patch("greeting", event.target.value)} /></div>
        </div>}
        {panel === "starters" && <div data-chat-panel="starters" className="chat-settings-panel"><div><h3>Lựa chọn gợi ý ban đầu</h3><p className="admin-muted">Khách bấm một lựa chọn để gửi câu hỏi sẵn. Có thể để trống danh sách và chỉ dùng ô chat.</p></div>
        {form.starters.map((item, index) => <div className="product-content-section" key={item.id || index}><div className="product-editor-heading"><strong>Gợi ý {index + 1}</strong><button type="button" className="admin-btn danger" aria-label={`Xóa gợi ý ${index + 1}`} onClick={() => patch("starters", form.starters.filter((_, at) => at !== index))}>Xóa</button></div><div className="admin-form-grid"><div className="admin-field"><label htmlFor={`chat-label-${index}`}>Tên lựa chọn {index + 1}</label><input id={`chat-label-${index}`} maxLength={60} value={item.label || ""} onChange={(event) => patchStarter(index, { label: event.target.value })} /></div><div className="admin-field"><label htmlFor={`chat-prompt-${index}`}>Câu hỏi gửi AI {index + 1}</label><textarea id={`chat-prompt-${index}`} rows={2} maxLength={400} value={item.prompt || ""} onChange={(event) => patchStarter(index, { prompt: event.target.value })} /></div></div></div>)}
        <div><button type="button" className="admin-btn" disabled={form.starters.length >= 6} onClick={() => patch("starters", [...form.starters, { id: crypto.randomUUID(), label: "", prompt: "" }])}>+ Thêm lựa chọn gợi ý</button></div>
        </div>}
        {panel === "knowledge" && <div data-chat-panel="knowledge" className="chat-settings-panel"><h3>Kiến thức và cách trả lời <TranslationHelp label="kiến thức AI">AI tự đọc danh sách sản phẩm, giá và dung tích đang hiển thị. Dùng ô dưới để bổ sung thêm chính sách đổi trả, thời gian giao hàng hoặc câu hỏi thường gặp.</TranslationHelp></h3>        <div className="admin-field"><label htmlFor="chat-tone">Cách trả lời của AI</label><select id="chat-tone" value={form.tone} onChange={(event) => patch("tone", event.target.value)}><option value="warm">Thân thiện, dễ hiểu</option><option value="concise">Ngắn gọn</option><option value="detailed">Giải thích kỹ</option></select></div><div className="admin-field"><label htmlFor="chat-knowledge">Kiến thức bổ sung cho trợ lý</label><textarea id="chat-knowledge" rows={8} maxLength={8000} value={form.knowledge} placeholder="Thông tin về thương hiệu, chính sách, câu hỏi thường gặp và câu trả lời chính xác của cửa hàng…" onChange={(event) => patch("knowledge", event.target.value)} /><small className="admin-muted">Sản phẩm, giá, dung tích và cam kết được đọc tự động. Chỉ nhập thông tin được phép công khai; không nhập khóa API hoặc dữ liệu riêng của khách hàng.</small></div>
        </div>}
      </fieldset>
    </form>
  </section>;
}
