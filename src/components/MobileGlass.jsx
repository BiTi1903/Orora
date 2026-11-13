import {useLayoutEffect} from 'react';
import useHomeContent from '../hooks/useHomeContent';
import '../styles/mobile-glass.css';
export default function MobileGlass(){
 const home=useHomeContent(),s=home.navStyles?.surfaces||{},key=JSON.stringify(s);
 useLayoutEffect(()=>{
  const settings=JSON.parse(key),root=document.documentElement;
  for(const name of ['header','chat','top','tabs','close','buttons','frames','headings'])root.toggleAttribute(`data-glass-${name}`,settings[name]!==false);
  root.style.setProperty('--surface-blur',`${Math.max(0,Math.min(30,Number(settings.blur??18)))}px`);
  root.style.setProperty('--surface-frame-blur',`${Math.max(0,Math.min(10,Number(settings.frameBlur??6)))}px`);
  root.style.setProperty('--surface-opacity',`${Math.max(45,Math.min(100,Number(settings.opacity??78)))}%`);
  const measure=()=>{document.querySelectorAll('.product-information-nav').forEach(nav=>{const active=nav.querySelector('[aria-current="location"]');if(!active)return;nav.style.setProperty('--tab-x',`${active.offsetLeft}px`);nav.style.setProperty('--tab-y',`${active.offsetTop}px`);nav.style.setProperty('--tab-w',`${active.offsetWidth}px`);nav.style.setProperty('--tab-h',`${active.offsetHeight}px`);});};
  let frame;const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  const observer=new MutationObserver(update);observer.observe(document.getElementById('root')||document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['aria-current']});window.addEventListener('resize',update);measure();
  return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('resize',update);for(const name of ['header','chat','top','tabs','close','buttons','frames','headings'])root.removeAttribute(`data-glass-${name}`);root.style.removeProperty('--surface-frame-blur');root.style.removeProperty('--surface-blur');root.style.removeProperty('--surface-opacity');};
 },[key]);
 return null;
}
