import {useLayoutEffect,useState} from 'react';

const textInputTypes=new Set(['text','search','email','url','tel','password','number']);
function acceptsKeyboard(element){
 if(!element||element.readOnly||element.disabled)return false;
 return element.isContentEditable||element.tagName==='TEXTAREA'||element.tagName==='INPUT'&&textInputTypes.has(element.type);
}

// All mobile browsers need keyboard/zoom protection; only Safari's browser
// toolbar additionally controls when the shopping navigation is revealed.
export default function useSafariToolbar(preview=false){
 const [hidden,setHidden]=useState(false);
 useLayoutEffect(()=>{
  if(preview)return;
  const media=window.matchMedia('(max-width: 768px)');
  let disconnect=()=>{};
  const connect=()=>{
   disconnect();
   if(!media.matches){setHidden(false);disconnect=()=>{};return;}
   const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
   const safari=ios&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
   const toolbar=safari&&!navigator.standalone&&!window.matchMedia('(display-mode: standalone)').matches;
   const viewport=window.visualViewport;
   const probe=toolbar&&window.CSS?.supports('height','100lvh')?document.createElement('div'):null;
   if(probe){
    probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;width:0;height:100lvh;top:0;left:0;';
    probe.setAttribute('aria-hidden','true');document.body.append(probe);
   }
   let frame=null,directionY=Math.max(0,window.scrollY),up=false,layoutWidth=window.innerWidth,largestHeight=window.innerHeight;
   const measure=()=>{
    const y=Math.max(0,window.scrollY),delta=y-directionY;
    // Keep the direction anchor until enough movement accumulates, including
    // slow momentum scrolling that advances less than three pixels per frame.
    if(delta < -3){up=true;directionY=y;}else if(delta > 3){up=false;directionY=y;}
    if(Math.abs(window.innerWidth-layoutWidth)>50){layoutWidth=window.innerWidth;largestHeight=window.innerHeight;}
    const height=viewport?.height||window.innerHeight;
    largestHeight=Math.max(largestHeight,window.innerHeight,height);
    const keyboard=acceptsKeyboard(document.activeElement)||largestHeight-height>Math.max(120,largestHeight*.2);
    const zoomed=viewport&&Math.abs(viewport.scale-1)>.01;
    const expandedToolbar=toolbar&&(up||y<8||(probe&&probe.getBoundingClientRect().height-height>24));
    setHidden(Boolean(keyboard||zoomed||expandedToolbar));
   };
   const schedule=()=>{if(frame===null)frame=requestAnimationFrame(()=>{frame=null;measure();});};
   measure();
   window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
   viewport?.addEventListener('resize',schedule);viewport?.addEventListener('scroll',schedule);
   document.addEventListener('focusin',schedule);document.addEventListener('focusout',schedule);
   disconnect=()=>{cancelAnimationFrame(frame);probe?.remove();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);viewport?.removeEventListener('resize',schedule);viewport?.removeEventListener('scroll',schedule);document.removeEventListener('focusin',schedule);document.removeEventListener('focusout',schedule);};
  };
  connect();media.addEventListener('change',connect);
  return()=>{disconnect();media.removeEventListener('change',connect);};
 },[preview]);
 return preview?false:hidden;
}
