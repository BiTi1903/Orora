import {useLayoutEffect,useState} from 'react';

// Safari exposes viewport geometry, but no toolbar visibility event.
export default function useSafariToolbar(preview=false){
 const [hidden,setHidden]=useState(false);
 useLayoutEffect(()=>{
  const safari=/iPhone|iPad|iPod/.test(navigator.userAgent)&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  if(preview||!safari||navigator.standalone||window.matchMedia('(display-mode: standalone)').matches)return;
  const viewport=window.visualViewport;
  const probe=document.createElement('div');
  probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;width:0;height:100lvh;top:0;left:0;';
  document.body.append(probe);
  let frame,lastY=window.scrollY,up=false;
  const measure=()=>{
   const y=Math.max(0,window.scrollY),delta=y-lastY;
   if(delta < -3)up=true;else if(delta > 3)up=false;
   lastY=y;
   const focused=document.activeElement?.matches('input,textarea,select,[contenteditable="true"]');
   const full=probe.getBoundingClientRect().height;
   const height=viewport?.height||window.innerHeight;
   setHidden(Boolean(up||y<8||focused||(viewport&&viewport.scale!==1)||full-height>24));
  };
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  measure();
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
  document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);
  return()=>{cancelAnimationFrame(frame);probe.remove();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);};
 },[preview]);
 return hidden;
}
