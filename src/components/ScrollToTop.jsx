import { useLayoutEffect,useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

export default function ScrollToTop(){
 const {pathname,hash,search,key}=useLocation(),lastPath=useRef(null);
 const navigationType = useNavigationType();
 const positions = useRef(new Map());
 useLayoutEffect(() => {
  if (pathname !== '/') return;
  const record = () => {
   if (positions.current.size > 40) positions.current.delete(positions.current.keys().next().value);
   positions.current.set(key, window.scrollY);
  };
  window.addEventListener('scroll', record, { passive: true });
  return () => window.removeEventListener('scroll', record);
 }, [key, pathname]);
 useLayoutEffect(()=>{
  const previous=window.history.scrollRestoration;
  window.history.scrollRestoration='manual';
  return()=>{window.history.scrollRestoration=previous;};
 },[]);
 useLayoutEffect(()=>{
  const pathChanged=lastPath.current!==pathname;lastPath.current=pathname;
  const saved = pathname === '/' && navigationType === 'POP' ? positions.current.get(key) : undefined;
  if (saved !== undefined) {
   const restore = () => window.scrollTo({ top: saved, behavior: 'instant' });
   const observer = new ResizeObserver(() => {
    restore();
    if (Math.abs(window.scrollY - saved) < 2) stop();
   });
   const stop = () => {
    observer.disconnect();
    clearTimeout(timer);
    window.removeEventListener('wheel', stop);
    window.removeEventListener('touchstart', stop);
   };
   const timer = setTimeout(stop, 2500);
   window.addEventListener('wheel', stop, { passive: true });
   window.addEventListener('touchstart', stop, { passive: true });
   observer.observe(document.body);
   restore();
   if (Math.abs(window.scrollY - saved) < 2) stop();
   return stop;
  }
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
 },[pathname,hash,search,key,navigationType]);
 return null;
}
