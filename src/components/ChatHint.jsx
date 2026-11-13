import { toCss } from "../lib/typography";
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
export default function ChatHint({ open, dismissed, settings, anchor, position, startedAt, onOpen }) {
 const [visible,setVisible]=useState(false);
 const used=useRef(false);
 const hint=useRef(null);
 useLayoutEffect(()=>{
  if(!visible||open||dismissed||settings.hintEnabled===false)return;
  const place=()=>{
   const node=hint.current,button=anchor.current;
   if(!node||!button)return;
   const rect=button.getBoundingClientRect(),box=node.getBoundingClientRect();
   const view=window.visualViewport,left=view?.offsetLeft||0,width=view?.width||innerWidth;
   const x=Math.max(left+12,Math.min(rect.right-box.width,left+width-box.width-12));
   node.style.left=`${x-rect.left}px`;
   const below=rect.top-box.height-18<(view?.offsetTop||0)+12;
   node.style.top=below?'calc(100% + 18px)':'auto';
   node.style.bottom=below?'auto':'calc(100% + 18px)';
   const placed=node.getBoundingClientRect();
   const collision=innerWidth<=768&&[...document.querySelectorAll('.product-price,.product-card-actions,.hero-actions,.catalog-toolbar')].some(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.left<placed.right&&r.right>placed.left&&r.top<placed.bottom&&r.bottom>placed.top;});
   node.style.visibility=collision?'hidden':'visible';node.inert=collision;
  };
  place();
  let frame;const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(place);};
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',place);window.visualViewport?.addEventListener('resize',place);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',place);window.visualViewport?.removeEventListener('resize',place);};
 },[visible,open,dismissed,settings.hintEnabled,anchor,position]);
 useEffect(()=>{
  if(open||settings.hintEnabled===false)return;
  const delay=visible?(settings.hintDuration??3):(used.current?(settings.hintRepeatDelay??10):settings.hintDelay);
  const wait=delay*1000-(!visible&&!used.current&&startedAt ? Math.max(0,Date.now()-startedAt) : 0);
  const timer=setTimeout(()=>{used.current=true;setVisible(current=>!current);},Math.max(0,wait));
  return ()=>clearTimeout(timer);
 },[open,visible,settings.hintEnabled,settings.hintDelay,settings.hintDuration,settings.hintRepeatDelay,startedAt]);
 if(!visible||open||dismissed||settings.hintEnabled===false)return null;
 return <div ref={hint} className="orora-chat-hint is-anchored" role="status"><button type="button" className="orora-chat-hint-message" style={{ fontFamily: settings.fontFamily || undefined, ...toCss(settings.textStyles?.hint), textDecoration: settings.textStyles?.hint?.textDecoration }} onClick={onOpen}>{settings.hintText}</button><button type="button" className="orora-chat-hint-close" aria-label="Đóng lời nhắc chat" onClick={()=>setVisible(false)}>×</button></div>;
}
