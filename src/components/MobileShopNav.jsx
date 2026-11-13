import {useLayoutEffect,useRef} from 'react';
import {Link,useLocation} from 'react-router-dom';
import useHomeContent from '../hooks/useHomeContent';
import {sectionIsEnabled} from '../lib/page-sections';
import {mobileNavSettings,mobileNavTheme,mobileNavItems} from '../lib/mobile-shop-nav';
import {toCss} from '../lib/typography';
import '../styles/mobile-shop-nav.css';
function Icon({kind}){
 const paths={home:'m3 10 9-7 9 7v11h-6v-7H9v7H3Z',story:'M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-6-2-10 1Zm0 0v15',products:'M5 7h14l1 14H4ZM8 8V6a4 4 0 0 1 8 0v2',email:'M3 5h18v14H3ZM3 5l9 7 9-7',heart:'M12 21 3 12C-3 3 9 0 12 7c3-7 15-4 9 5Z',star:'m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z',link:'m9 15 6-6M8 17l-2 2a4 4 0 0 1-5-5l5-5M16 7l2-2a4 4 0 0 1 5 5l-5 5',tracking:'M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
export default function MobileShopNav({preview=false,previewData}){
 const live=useHomeContent(),home=preview&&previewData?previewData:live;
 const s=mobileNavSettings(home.navStyles?.mobile),location=useLocation();
 const nav=useRef(null);
 const items=mobileNavItems(s);
 const enabled=s.enabled!==false&&sectionIsEnabled(home,'navbar')&&!location.pathname.startsWith('/admin')&&(!home.loading||home.shellReady)&&items.length>0;
 useLayoutEffect(()=>{
  if(preview)return;
  const root=document.documentElement,media=window.matchMedia('(max-width: 768px)'),previous=root.style.getPropertyValue('--mobile-shop-nav-height');
  const update=()=>{root.classList.toggle('has-mobile-shop-nav',Boolean(enabled&&media.matches));root.style.setProperty('--mobile-shop-nav-height',`${nav.current?.getBoundingClientRect().height||s.height}px`);};
  update();const observer=new ResizeObserver(update);if(nav.current)observer.observe(nav.current);media.addEventListener('change',update);return()=>{observer.disconnect();media.removeEventListener('change',update);root.classList.remove('has-mobile-shop-nav');if(previous)root.style.setProperty('--mobile-shop-nav-height',previous);else root.style.removeProperty('--mobile-shop-nav-height');};
 },[enabled,s.height,preview]);
 if(!enabled&&!preview)return null;
 if(s.enabled===false||!items.length)return null;
 return <>
  <nav ref={nav} className={`mobile-shop-nav${preview?' is-preview':''}`} aria-label={s.title} style={{...mobileNavTheme(s),gridTemplateColumns:`repeat(${items.length},minmax(0,1fr))`}}>
   {items.map(item=>{
    const internal=item.to.startsWith('/'),Tag=internal?Link:'a';
    return <Tag key={item.id} {...(internal?{to:preview?'#':item.to}:{href:preview?'#':item.to})} onClick={event=>{if(preview){event.preventDefault();return;}if(item.to==='/')window.scrollTo({top:0,left:0,behavior:'instant'});if(internal&&item.to.startsWith('/#')&&location.pathname==='/')document.getElementById(item.to.slice(2))?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}} aria-current={location.pathname+location.hash===item.to?'page':undefined}><Icon kind={item.icon}/><span style={toCss(s.textStyle)}>{item.label}</span></Tag>;
   })}
  </nav>

 </>;
}
