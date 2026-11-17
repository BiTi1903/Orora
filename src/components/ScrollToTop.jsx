import { useLayoutEffect,useRef } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop(){
 const {pathname,hash,search,key}=useLocation(),lastPath=useRef(null);
 useLayoutEffect(()=>{
  const previous=window.history.scrollRestoration;
  window.history.scrollRestoration='manual';
  return()=>{window.history.scrollRestoration=previous;};
 },[]);
 useLayoutEffect(()=>{
  const pathChanged=lastPath.current!==pathname;lastPath.current=pathname;
  let id=(hash||'').slice(1);
  try{id=decodeURIComponent(id);}catch{/* An invalid fragment must not crash the page. */}
  if(!id){
   if(!pathChanged&&pathname!=='/tra-cuu-don-hang')return;
   const top=()=>window.scrollTo({top:0,left:0,behavior:'instant'});
   top();
   // Safari may finish unlocking the drawer / restoring layout after this effect.
   const frame=requestAnimationFrame(()=>{if(window.scrollY!==0)top();});
   return()=>cancelAnimationFrame(frame);
  }
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const behavior=pathChanged||reduced?'instant':'smooth';
  const go=()=>{const target=document.getElementById(id);if(!target)return false;target.scrollIntoView({behavior,block:'start'});return true;};
  if(go())return;
  // Firebase can resolve after several seconds; observe the target appearing
  // rather than retry only during the first 700ms. Stop if the user takes over.
  const observer=new MutationObserver(()=>{if(go())stop();});
  const interrupt=event=>{if(event.type!=='keydown'||['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(event.key))stop();};
  const stop=()=>{observer.disconnect();clearTimeout(timer);window.removeEventListener('wheel',interrupt);window.removeEventListener('touchstart',interrupt);window.removeEventListener('keydown',interrupt);};
  const timer=setTimeout(stop,10000);
  observer.observe(document.body,{childList:true,subtree:true});
  window.addEventListener('wheel',interrupt,{passive:true});window.addEventListener('touchstart',interrupt,{passive:true});window.addEventListener('keydown',interrupt);
  return stop;
 },[pathname,hash,search,key]);
 return null;
}
