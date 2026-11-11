import {useLayoutEffect,useRef,useState} from 'react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import useHomeContent from '../hooks/useHomeContent';
import useCategories from '../hooks/useCategories';
import {sectionIsEnabled} from '../lib/page-sections';
import {mobileNavSettings,mobileNavTheme} from '../lib/mobile-shop-nav';
import {toCss} from '../lib/typography';
import ModalDialog from './ModalDialog';
import '../styles/mobile-shop-nav.css';
function Icon({kind}){
 const paths={home:'m3 10 9-7 9 7v11h-6v-7H9v7H3Z',category:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',products:'M5 7h14l1 14H4ZM8 8V6a4 4 0 0 1 8 0v2',tracking:'M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
export default function MobileShopNav({preview=false,previewData}){
 const live=useHomeContent(),home=preview&&previewData?previewData:live;
 const s=mobileNavSettings(home.navStyles?.mobile),{categories,error,retry}=useCategories(),location=useLocation(),navigate=useNavigate();
 const nav=useRef(null);
 const [open,setOpen]=useState(false),[previousKey,setPreviousKey]=useState(location.key);
 if(previousKey!==location.key){setPreviousKey(location.key);setOpen(false);}
 const shop=sectionIsEnabled(home,'collection');
 const items=[s.showHome!==false&&{id:'home',label:s.homeLabel,to:'/'},shop&&s.showCategories!==false&&{id:'category',label:s.categoryLabel},shop&&s.showProducts!==false&&{id:'products',label:s.productsLabel,to:'/#shop'},s.showTracking!==false&&{id:'tracking',label:s.trackingLabel,to:'/tra-cuu-don-hang'}].filter(Boolean);
 const enabled=s.enabled!==false&&sectionIsEnabled(home,'navbar')&&!location.pathname.startsWith('/admin')&&(!home.loading||home.shellReady)&&items.length>0;
 useLayoutEffect(()=>{
  if(preview)return;
  const root=document.documentElement,media=window.matchMedia('(max-width: 768px)'),previous=root.style.getPropertyValue('--mobile-shop-nav-height');
  const update=()=>{root.classList.toggle('has-mobile-shop-nav',Boolean(enabled&&media.matches));root.style.setProperty('--mobile-shop-nav-height',`${nav.current?.getBoundingClientRect().height||s.height}px`);};
  update();const observer=new ResizeObserver(update);if(nav.current)observer.observe(nav.current);media.addEventListener('change',update);return()=>{observer.disconnect();media.removeEventListener('change',update);root.classList.remove('has-mobile-shop-nav');if(previous)root.style.setProperty('--mobile-shop-nav-height',previous);else root.style.removeProperty('--mobile-shop-nav-height');};
 },[enabled,s.height,preview]);
 if(!enabled&&!preview)return null;
 if(s.enabled===false||!items.length)return null;
 const active=open?'category':location.pathname==='/tra-cuu-don-hang'?'tracking':location.pathname.startsWith('/product/')||location.hash==='#shop'?'products':'home';
 const choose=id=>{
  if(preview){setOpen(false);return;}
  const params=new URLSearchParams(location.search);params.delete('page');if(id)params.set('category',id);else params.delete('category');
  navigate({pathname:'/',search:params.toString(),hash:'#shop'});setOpen(false);
 };
 return <>
  <nav ref={nav} className={`mobile-shop-nav${preview?' is-preview':''}`} aria-label={s.title} style={{...mobileNavTheme(s),gridTemplateColumns:`repeat(${items.length},minmax(0,1fr))`}}>
   {items.map(item=>item.id==='category'?<button key={item.id} type="button" aria-expanded={open} aria-current={active===item.id?'page':undefined} onClick={()=>setOpen(true)}><Icon kind={item.id}/><span style={toCss(s.textStyle)}>{item.label}</span></button>:<Link key={item.id} to={preview?'#':item.to} onClick={preview?event=>event.preventDefault():undefined} aria-current={active===item.id?'page':undefined}><Icon kind={item.id}/><span style={toCss(s.textStyle)}>{item.label}</span></Link>)}
  </nav>
  {open&&<ModalDialog title={s.title} closeLabel={s.closeLabel} headingStyle={toCss(s.headingStyle)} className="mobile-category-sheet" style={mobileNavTheme(s)} onClose={()=>setOpen(false)}>
   <div className="mobile-category-list" style={toCss(s.textStyle)}><button type="button" onClick={()=>choose('')}>{s.allLabel}<span aria-hidden="true">↗</span></button>
    {error?<div role="alert"><p>{s.errorLabel}</p><button type="button" onClick={retry}>{s.retryLabel}</button></div>:categories.length?categories.map(category=><button key={category.id} type="button" onClick={()=>choose(category.id)}>{category.name}<span aria-hidden="true">›</span></button>):<p>{s.emptyLabel}</p>}
   </div>
  </ModalDialog>}
 </>;
}
