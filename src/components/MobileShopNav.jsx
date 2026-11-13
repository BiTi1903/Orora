import {useLayoutEffect,useRef} from 'react';
import {Link,useLocation} from 'react-router-dom';
import useHomeContent from '../hooks/useHomeContent';
import {sectionIsEnabled} from '../lib/page-sections';
import {mobileNavSettings,mobileNavTheme} from '../lib/mobile-shop-nav';
import {toCss} from '../lib/typography';
import '../styles/mobile-shop-nav.css';
function Icon({kind}){
 const paths={home:'m3 10 9-7 9 7v11h-6v-7H9v7H3Z',story:'M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-6-2-10 1Zm0 0v15',products:'M5 7h14l1 14H4ZM8 8V6a4 4 0 0 1 8 0v2',tracking:'M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
export default function MobileShopNav({preview=false,previewData}){
 const live=useHomeContent(),home=preview&&previewData?previewData:live;
 const s=mobileNavSettings(home.navStyles?.mobile),location=useLocation();
 const nav=useRef(null);
 const shop=sectionIsEnabled(home,'collection');
 const items=[s.showHome!==false&&{id:'home',label:s.homeLabel,to:'/'},sectionIsEnabled(home,'about')&&s.showStory!==false&&{id:'story',label:s.storyLabel,to:'/#about'},shop&&s.showProducts!==false&&{id:'products',label:s.productsLabel,to:'/#shop'},s.showTracking!==false&&{id:'tracking',label:s.trackingLabel,to:'/tra-cuu-don-hang'}].filter(Boolean);
 const enabled=s.enabled!==false&&sectionIsEnabled(home,'navbar')&&!location.pathname.startsWith('/admin')&&(!home.loading||home.shellReady)&&items.length>0;
 useLayoutEffect(()=>{
  if(preview)return;
  const root=document.documentElement,media=window.matchMedia('(max-width: 768px)'),previous=root.style.getPropertyValue('--mobile-shop-nav-height');
  const update=()=>{root.classList.toggle('has-mobile-shop-nav',Boolean(enabled&&media.matches));root.style.setProperty('--mobile-shop-nav-height',`${nav.current?.getBoundingClientRect().height||s.height}px`);};
  update();const observer=new ResizeObserver(update);if(nav.current)observer.observe(nav.current);media.addEventListener('change',update);return()=>{observer.disconnect();media.removeEventListener('change',update);root.classList.remove('has-mobile-shop-nav');if(previous)root.style.setProperty('--mobile-shop-nav-height',previous);else root.style.removeProperty('--mobile-shop-nav-height');};
 },[enabled,s.height,preview]);
 if(!enabled&&!preview)return null;
 if(s.enabled===false||!items.length)return null;
 const active=location.hash==='#about'?'story':location.pathname==='/tra-cuu-don-hang'?'tracking':location.pathname.startsWith('/product/')||location.hash==='#shop'?'products':'home';
 return <>
  <nav ref={nav} className={`mobile-shop-nav${preview?' is-preview':''}`} aria-label={s.title} style={{...mobileNavTheme(s),gridTemplateColumns:`repeat(${items.length},minmax(0,1fr))`}}>
   {items.map(item=><Link key={item.id} to={preview?'#':item.to} onClick={event=>{if(preview){event.preventDefault();return;}if(item.id==='home')window.scrollTo({top:0,left:0,behavior:'instant'});if(item.id==='story'&&location.pathname==='/')document.getElementById('about')?.scrollIntoView({behavior:'smooth'});}} aria-current={active===item.id?'page':undefined}><Icon kind={item.id}/><span style={toCss(s.textStyle)}>{item.label}</span></Link>)}
  </nav>

 </>;
}
