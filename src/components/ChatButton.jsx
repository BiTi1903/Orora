import {animateButtonPress, cancelButtonPress} from "../lib/button-press";
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
  const dockSide=useRef('left');
  const [popupSide,setPopupSide]=useState('left');
  const suppressClick = useRef(false);
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const clamp = useCallback((next) => {
    const rect = {width:button.current.offsetWidth,height:button.current.offsetHeight};
    const view = window.visualViewport;
    return clampFloatingPosition(next, { width: view?.width || window.innerWidth, height: view?.height||window.innerHeight, offsetLeft: view?.offsetLeft || 0, offsetTop: view?.offsetTop || 0 }, rect);
  }, []);
  const chatDockGap=home.navStyles?.surfaces?.chatDockGap;
  const dock=useCallback(()=>{
    const node=button.current;if(!node)return null;
    const back=document.querySelector('.back-to-top'),reserved=document.documentElement.classList.contains('has-mobile-shop-nav')?(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mobile-shop-nav-height'))||64):0;
    const size=back?.offsetHeight||(window.innerWidth<=600?46:52),bottom=back?(parseFloat(getComputedStyle(back).bottom)||0):reserved?reserved+24:window.innerWidth<=600?82:96;
    const top=window.innerHeight-bottom-size,gap=Math.max(8,Math.min(32,Number(chatDockGap??14)));
    const buyBar = document.querySelector('.product-mobile-buy');
    const buyRect = buyBar?.getBoundingClientRect();
    const buyTop = buyRect?.height
      ? Math.min(buyRect.top, window.innerHeight - reserved - buyRect.height)
      : Infinity;
    const aboveBuy = buyTop - node.offsetHeight - gap;
    const dockTop = dockSide.current === 'left' ? top + (size - node.offsetHeight) / 2 : top - node.offsetHeight - gap;
    return clamp({x:dockSide.current==='left'?-10000:10000,y:Math.min(dockTop, aboveBuy)});
  }, [clamp,chatDockGap]);
  useEffect(() => {
    let frame;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!button.current||drag.current?.moved)return;const next=dock();setPosition(current=>current&&Math.abs(current.x-next.x)<.5&&Math.abs(current.y-next.y)<.5?current:next);});};
    update();window.addEventListener('resize',update);window.visualViewport?.addEventListener('resize',update);
    const observer=new MutationObserver(update);observer.observe(document.documentElement,{attributes:true,attributeFilter:['class','style']});
    return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('resize',update);window.visualViewport?.removeEventListener('resize',update);};
  },[home.loading,settings.enabled,location.pathname,dock]);
  const finishDrag = (event) => {
    if (!drag.current || event.pointerId !== drag.current.pointerId) return;
    suppressClick.current = drag.current.moved;
    if(drag.current.moved){const dx=event.clientX-drag.current.startX;dockSide.current=event.type==='pointerup'&&Math.abs(dx)>60?(dx>0?'right':'left'):dockSide.current;setPopupSide(dockSide.current);setPosition(dock());}
    button.current?.style.removeProperty('--chat-stretch');
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const close = useCallback(() => { setHintEpoch(Date.now());setOpen(false); requestAnimationFrame(() => button.current?.focus({ preventScroll: true })); }, []);
  if (home.loading || !settings.enabled) return null;
  return (
    <><div className={`orora-chat-launcher${dragging?' is-dragging':''}`} style={position ? { left: position.x, top: position.y, right: "auto", bottom: "auto" } : {visibility:"hidden"}}><button type="button"
      ref={button}
      className={`chat-button${position ? " is-positioned" : ""}${dragging ? " is-dragging" : ""}`}
      onDragStart={(event) => event.preventDefault()}
      onPointerDown={(event) => {
        if (event.button !== 0 || !event.isPrimary) return;
        cancelButtonPress(event.currentTarget, "orora-chat-press");
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
        button.current.style.setProperty('--chat-stretch',String((window.innerWidth>768||home.navStyles?.surfaces?.chatStretch===false)?1:1+Math.min(Math.abs(dx)/180,.45)));
        setPosition(clamp({ x: current.x + dx*.6, y: current.y + dy }));
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
      onClick={(event) => {
        if (event.detail !== 0 && suppressClick.current) {
          event.preventDefault(); event.stopPropagation(); suppressClick.current = false; return;
        }
        animateButtonPress(event.currentTarget,true);
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
    </button>{!open && <ChatHint open={false} dismissed={false} settings={settings} anchor={button} position={position} startedAt={hintEpoch} onOpen={() => { setChannel("choose");setOpen(true); }} />}</div>{open && (channel === "choose" ? <ChatChannelChooser anchor={button} motion={home.navStyles?.surfaces} dockSide={popupSide} settings={settings} id={panelId} zalo={zalo} onAI={() => setChannel("ai")} onClose={close} /> : <ChatPanel anchor={button} motion={home.navStyles?.surfaces} anchorY={position?.y} panelWidth={home.navStyles?.surfaces?.chatPanelWidth} panelHeight={home.navStyles?.surfaces?.chatPanelHeight} dockSide={popupSide} id={panelId} settings={settings} conversation={conversation} onClose={close} contactLinks={zalo ? [{ href: zalo }] : conversation.metadata?.links?.filter((link) => ["phone", "facebook", "contact"].includes(link.id)) || []} />)}</>
  );
}

export default ChatButton;
