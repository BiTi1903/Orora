import { useEffect,useState } from 'react';

// Start a fresh autoplay countdown only while the actual carousel is visible.
export default function useVisiblePlayback(ref,enabled=true){
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  const element=ref.current;
  if(!element||!enabled)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let inView=false,frame=0;
  const update=()=>setVisible(inView&&!document.hidden&&!motion.matches);
  const measure=()=>{
   frame=0;const rect=element.getBoundingClientRect();
   const width=Math.max(0,Math.min(rect.right,innerWidth)-Math.max(rect.left,0));
   const height=Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0));
   inView=rect.width>0&&rect.height>0&&width*height/(rect.width*rect.height)>=.15;
   update();
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  let observer;
  if(window.IntersectionObserver){
   observer=new IntersectionObserver(entries=>{for(const entry of entries){inView=entry.isIntersecting&&entry.intersectionRatio>=.15;update();}},{threshold:[0,.15]});
   observer.observe(element);
  }else{
   measure();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  }
  document.addEventListener('visibilitychange',update);
  motion.addEventListener('change',update);
  return()=>{observer?.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);document.removeEventListener('visibilitychange',update);motion.removeEventListener('change',update);};
 },[ref,enabled]);
 return enabled&&visible;
}
