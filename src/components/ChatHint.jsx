import { toCss } from "../lib/typography";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
export default function ChatHint({ open, dismissed, settings, anchor, onOpen }) {
 const [visible,setVisible]=useState(false);
 const used=useRef(false);
 const hint=useRef(null);
 useLayoutEffect(()=>{
  if(!visible||open||dismissed||settings.hintEnabled===false)return;
  let frame;
  const place=()=>{
   const node=hint.current,button=anchor.current;
   if(node&&button){
    const rect=button.getBoundingClientRect(),view=window.visualViewport;
    const left=view?.offsetLeft||0,top=view?.offsetTop||0;
    const width=view?.width||innerWidth,height=view?.height||innerHeight;
    const box=node.getBoundingClientRect();
    const above=rect.top-box.height-18;
    const y=above>=top+12?above:rect.bottom+18;
    node.style.left=`${Math.max(left+12,Math.min(rect.right-box.width,left+width-box.width-12))}px`;
    node.style.top=`${Math.max(top+12,Math.min(y,top+height-box.height-12))}px`;
   }
   frame=requestAnimationFrame(place);
  };
  place();return()=>cancelAnimationFrame(frame);
 },[visible,open,dismissed,settings.hintEnabled,anchor]);
 useEffect(()=>{
  if(open){used.current=true;return;}
  if(used.current||settings.hintEnabled===false)return;
  let hide;
  const timer=setTimeout(()=>{used.current=true;setVisible(true);hide=setTimeout(()=>setVisible(false),10000);},settings.hintDelay*1000);
  return ()=>{clearTimeout(timer);clearTimeout(hide);};
 },[open,settings.hintEnabled,settings.hintDelay]);
 if(!visible||open||dismissed||settings.hintEnabled===false)return null;
 return <div ref={hint} className="orora-chat-hint" style={{right:"auto",bottom:"auto",transform:"none"}} role="status"><button type="button" className="orora-chat-hint-message" style={{ fontFamily: settings.fontFamily || undefined, ...toCss(settings.textStyles?.hint), textDecoration: settings.textStyles?.hint?.textDecoration }} onClick={onOpen}>{settings.hintText}</button><button type="button" className="orora-chat-hint-close" aria-label="Đóng lời nhắc chat" onClick={()=>setVisible(false)}>×</button></div>;
}
