import ChatChannelChooser from "./ChatChannelChooser";
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
  const [hintEpoch,setHintEpoch]=useState(()=>window.__ororaEnteredAt || Date.now());
  const [channel,setChannel] = useState("choose");
  const panelId = useId();
  const conversation = useChatConversation(open && channel === "ai", location.pathname);
  const settings = chatSettings({ ...conversation.metadata?.settings, ...home.chatSettings });
  const button = useRef(null);
  const drag = useRef(null);
  const dockSide=useRef('right');
  const suppressClick = useRef(false);
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const clamp = (next) => {
    const rect = {width:button.current.offsetWidth,height:button.current.offsetHeight};
    const view = window.visualViewport;
    const top=view?.offsetTop||0;
    const back=document.querySelector('.back-to-top');
    const navHeight=document.documentElement.classList.contains('has-mobile-shop-nav')?parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mobile-shop-nav-height'))||64:0;
    const bottomLimit=(back?window.innerHeight-(parseFloat(getComputedStyle(back).bottom)||0)-back.offsetHeight:0) || top+(view?.height||window.innerHeight)-navHeight-84;
    return clampFloatingPosition(next, { width: view?.width || window.innerWidth, height: Math.max(rect.height+24,Math.min(view?.height||window.innerHeight,bottomLimit-top-12)), offsetLeft: view?.offsetLeft || 0, offsetTop: view?.offsetTop || 0 }, rect);
  };
  useEffect(() => {
    const onResize = () => {
      if (button.current) setPosition((current) => current ? clamp({...current,x:dockSide.current==='left'?-10000:10000}) : null);
    };
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); window.visualViewport?.removeEventListener("resize", onResize); };
  }, []);
  const finishDrag = (event) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    suppressClick.current = drag.current.moved;
    if(drag.current.moved)setPosition(current=>{if(!current)return current;dockSide.current=current.x+button.current.offsetWidth/2<(window.visualViewport?.width||window.innerWidth)/2?'left':'right';return clamp({...current,x:dockSide.current==='left'?-10000:10000});});
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const close = useCallback(() => { setHintEpoch(Date.now());setOpen(false); requestAnimationFrame(() => button.current?.focus({ preventScroll: true })); }, []);
  if (home.loading || !settings.enabled) return null;
  return (
    <><div className={`orora-chat-launcher${dragging?' is-dragging':''}`} style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : undefined}><button type="button"
      ref={button}
      className={`chat-button${position ? " is-positioned" : ""}${dragging ? " is-dragging" : ""}`}
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
        if (open) setHintEpoch(Date.now());
        if (!open) setChannel("choose");
        setOpen((current) => !current);
      }}
      aria-label={open ? "Đóng chat với ORORA" : "Chat với ORORA"}
      aria-expanded={open}
      aria-controls={open ? panelId : undefined}
      title="Trò chuyện với ORORA, kéo để di chuyển"
    >
      <span className="chat-icon" aria-hidden="true">{open ? "×" : "✦"}</span>
      <span className="chat-text">Trò chuyện cùng ORORA</span>
    </button>{!open && <ChatHint open={false} dismissed={false} settings={settings} anchor={button} position={position} startedAt={hintEpoch} onOpen={() => { setChannel("choose");setOpen(true); }} />}</div>{open && (channel === "choose" ? <ChatChannelChooser settings={settings} id={panelId} zalo={zalo} onAI={() => setChannel("ai")} onClose={close} /> : <ChatPanel id={panelId} settings={settings} conversation={conversation} onClose={close} contactLinks={zalo ? [{ href: zalo }] : conversation.metadata?.links?.filter((link) => ["phone", "facebook", "contact"].includes(link.id)) || []} />)}</>
  );
}

export default ChatButton;
