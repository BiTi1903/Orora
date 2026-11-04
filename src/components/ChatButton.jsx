import ChatHint from "./ChatHint";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { clampFloatingPosition } from "../lib/floating-position";
import "../styles/chat-button.css";
import useHomeContent from "../hooks/useHomeContent";
import { contactLinks } from "../lib/contact";
import { chatSettings } from "../lib/chat";
import { useLocation } from "react-router-dom";
import useChatConversation from "../hooks/useChatConversation";
import ChatPanel from "./ChatPanel";

function ChatButton() {
  const home = useHomeContent();
  const { zalo } = contactLinks(home, "", home.productDetailStyles?.contactActions || {});
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const panelId = useId();
  const conversation = useChatConversation(open, location.pathname);
  const settings = chatSettings({ ...conversation.metadata?.settings, ...home.chatSettings });
  const button = useRef(null);
  const drag = useRef(null);
  const suppressClick = useRef(false);
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const clamp = (next) => {
    const rect = button.current.getBoundingClientRect();
    const view = window.visualViewport;
    return clampFloatingPosition(next, { width: view?.width || window.innerWidth, height: view?.height || window.innerHeight, offsetLeft: view?.offsetLeft || 0, offsetTop: view?.offsetTop || 0 }, rect);
  };
  useEffect(() => {
    const onResize = () => {
      if (button.current) setPosition((current) => current ? clamp(current) : null);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); window.visualViewport?.removeEventListener("resize", onResize); };
  }, []);
  const finishDrag = (event) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    suppressClick.current = drag.current.moved;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const close = useCallback(() => { setOpen(false); requestAnimationFrame(() => button.current?.focus({ preventScroll: true })); }, []);
  if (home.loading || !settings.enabled) return null;
  return (
    <><button type="button"
      ref={button}
      className={`chat-button${position ? " is-positioned" : ""}${dragging ? " is-dragging" : ""}`}
      style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return;
        const rect = event.currentTarget.getBoundingClientRect();
        suppressClick.current = false;
        drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, x: rect.left, y: rect.top, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        if (!current || event.pointerId !== current.pointerId) return;
        const dx = event.clientX - current.startX;
        const dy = event.clientY - current.startY;
        if (!current.moved && Math.hypot(dx, dy) < 8) return;
        current.moved = true;
        setDragging(true);
        setPosition(clamp({ x: current.x + dx, y: current.y + dy }));
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onClick={(event) => {
        if (event.detail !== 0 && suppressClick.current) {
          event.preventDefault(); event.stopPropagation(); suppressClick.current = false; return;
        }
        setHintDismissed(true);
        setOpen((current) => !current);
      }}
      aria-label={open ? "Đóng chat với ORORA" : "Chat với ORORA"}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      title="Trò chuyện với ORORA, kéo để di chuyển"
    >
      <span className="chat-icon" aria-hidden="true">{open ? "×" : "✦"}</span>
      <span className="chat-text">Trò chuyện cùng ORORA</span>
    </button><ChatHint open={open} dismissed={hintDismissed} settings={settings} anchor={button} onOpen={() => { setHintDismissed(true); setOpen(true); }} />{open && <ChatPanel id={panelId} settings={settings} conversation={conversation} onClose={close} contactLinks={zalo ? [{ href: zalo }] : conversation.metadata?.links?.filter((link) => ["phone", "facebook", "contact"].includes(link.id)) || []} />}</>
  );
}

export default ChatButton;
