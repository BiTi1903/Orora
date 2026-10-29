import { useEffect, useRef, useState } from "react";
import { clampFloatingPosition } from "../lib/floating-position";
import "../styles/chat-button.css";
import useHomeContent from "../hooks/useHomeContent";
import { contactLinks } from "../lib/contact";

function ChatButton() {
  const home = useHomeContent();
  const { zalo } = contactLinks(home);
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
  if (!zalo) return null;
  return (
    <a
      ref={button}
      className={`chat-button${position ? " is-positioned" : ""}${dragging ? " is-dragging" : ""}`}
      style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (!window.matchMedia("(max-width: 768px)").matches || event.button !== 0 || !event.isPrimary) return;
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
          event.preventDefault(); event.stopPropagation(); suppressClick.current = false;
        }
      }}
      href={zalo}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat với chúng tôi"
    >
      <span className="chat-icon">💬</span>
      <span className="chat-text">Chat với chúng tôi</span>
    </a>
  );
}

export default ChatButton;