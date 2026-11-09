import { toCss } from "../lib/typography";
import { useEffect, useRef, useState } from 'react';
export default function ChatHint({ open, dismissed, settings, anchor, onOpen }) {
 const [visible,setVisible]=useState(false);
 const used=useRef(false);
 useEffect(()=>{
  if(open){used.current=true;return;}
  if(used.current||settings.hintEnabled===false)return;
  let hide;
  const timer=setTimeout(()=>{used.current=true;setVisible(true);hide=setTimeout(()=>setVisible(false),10000);},settings.hintDelay*1000);
  return ()=>{clearTimeout(timer);clearTimeout(hide);};
 },[open,settings.hintEnabled,settings.hintDelay]);
 if(!visible||open||dismissed||settings.hintEnabled===false)return null;
 const rect=anchor.current?.getBoundingClientRect();
 const style=rect?{left:Math.max(12,Math.min(rect.right-220,window.innerWidth-232)),top:rect.top>144?rect.top-10:rect.bottom+10,right:"auto",bottom:"auto",transform:rect.top>144?"translateY(-100%)":undefined}:undefined;
 return <div className="orora-chat-hint" style={style} role="status"><button type="button" className="orora-chat-hint-message" style={{ fontFamily: settings.fontFamily || undefined, ...toCss(settings.textStyles?.hint), textDecoration: settings.textStyles?.hint?.textDecoration }} onClick={onOpen}>{settings.hintText}</button><button type="button" className="orora-chat-hint-close" aria-label="Đóng lời nhắc chat" onClick={()=>setVisible(false)}>×</button></div>;
}
