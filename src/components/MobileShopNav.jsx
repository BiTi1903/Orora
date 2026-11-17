import useMobileSafari from "../hooks/useMobileSafari";
import {useEffect,useState,useLayoutEffect,useRef,useId} from 'react';
import {Link,useLocation} from 'react-router-dom';
import useSafariToolbar from '../hooks/useSafariToolbar';
import useHomeContent from '../hooks/useHomeContent';
import {sectionIsEnabled} from '../lib/page-sections';
import {mobileNavSettings,mobileNavTheme,mobileNavItems} from '../lib/mobile-shop-nav';
import {toCss} from '../lib/typography';
import '../styles/mobile-shop-nav.css';
function Icon({kind}){
 const paths={home:'m3 10 9-7 9 7v11h-6v-7H9v7H3Z',story:'M12 5C8 2 4 3 2 4v16c3-2 7-2 10 0 3-2 7-2 10 0V4c-2-1-6-2-10 1Zm0 0v15',products:'M5 7h14l1 14H4ZM8 8V6a4 4 0 0 1 8 0v2',email:'M3 5h18v14H3ZM3 5l9 7 9-7',heart:'M12 21 3 12C-3 3 9 0 12 7c3-7 15-4 9 5Z',star:'m12 2 3 6 7 1-5 5 1 8-6-4-6 4 1-8-5-5 7-1Z',link:'m9 15 6-6M8 17l-2 2a4 4 0 0 1-5-5l5-5M16 7l2-2a4 4 0 0 1 5 5l-5 5',tracking:'M6 3h12v18l-3-2-3 2-3-2-3 2ZM9 8h6M9 12h6'};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]}/></svg>;
}
export default function MobileShopNav({preview=false,previewData,previewSafari=false}){
 const live=useHomeContent(),home=preview&&previewData?previewData:live;
 const s=mobileNavSettings(home.navStyles?.mobile),location=useLocation();
 const safari=useMobileSafari(),sideMode=(preview?previewSafari:safari)&&s.safariLayout!=='bar';
 const [expanded,setExpanded]=useState(false);
 const shell=useRef(null),toggle=useRef(null),navId=useId();
 const [cartCount,setCartCount]=useState(()=>{try{const rows=JSON.parse(localStorage.getItem('orora-cart-v1'));return Array.isArray(rows)?rows.reduce((n,r)=>n+(Number.isInteger(r?.quantity)&&r.quantity>0&&r.quantity<=20?r.quantity:0),0):0;}catch{return 0;}});
 useEffect(()=>{const update=e=>setCartCount(Number(e.detail)||0);window.addEventListener('orora-cart-count',update);return()=>window.removeEventListener('orora-cart-count',update);},[]);
 const nav=useRef(null),gesture=useRef(null),suppressClick=useRef(0);
 const items=mobileNavItems(s);
 if(home.navStyles?.cart?.enabled!==false)items.push({id:'cart',icon:'products',to:'/#cart',label:home.navStyles?.cart?.copy?.label||'Giỏ hàng'});
 const [passedTicker,setPassedTicker]=useState(false);
 const gated=!sideMode&&!preview&&location.pathname==='/'&&s.afterTicker!==false;
 const safariToolbar=useSafariToolbar(preview,sideMode);
 const waiting=(gated&&!passedTicker)||safariToolbar;
 const contextKey=`${location.pathname}${location.hash}:${waiting}:${sideMode}`;
 const [lastContext,setLastContext]=useState(contextKey);
 if(lastContext!==contextKey){setLastContext(contextKey);if(expanded)setExpanded(false);}
 useEffect(()=>{
  if(!gated)return;
  let frame;const observed=new WeakSet();const sizes=new ResizeObserver(()=>schedule());
  const measure=()=>{const boundary=document.querySelector('.marquee')||document.querySelector('.hero');for(const target of [boundary,document.querySelector('.hero'),nav.current])if(target&&!observed.has(target)){observed.add(target);sizes.observe(target);}const room=window.innerHeight-(nav.current?.offsetHeight||s.height)-Math.max(0,Math.min(48,Number(s.revealGap??12)));setPassedTicker(window.scrollY>8&&(boundary?boundary.getBoundingClientRect().bottom<=room:!home.loading));};
  const schedule=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(measure);};
  schedule();window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);const content=new MutationObserver(schedule);content.observe(document.getElementById('root')||document.body,{subtree:true,childList:true});
  return()=>{cancelAnimationFrame(frame);sizes.disconnect();content.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
 },[gated,home.loading,s.height,s.revealGap]);
 const enabled=s.enabled!==false&&sectionIsEnabled(home,'navbar')&&!location.pathname.startsWith('/admin')&&(!home.loading||home.shellReady)&&items.length>0;
 useLayoutEffect(()=>{
  if(preview)return;
  const root=document.documentElement,media=window.matchMedia('(max-width: 768px)'),previous=root.style.getPropertyValue('--mobile-shop-nav-height');
  const update=()=>{root.classList.toggle('has-mobile-shop-nav',Boolean(enabled&&!sideMode&&!waiting&&media.matches));root.style.setProperty('--mobile-shop-nav-height',`${nav.current?.getBoundingClientRect().height||s.height}px`);};
  update();const observer=new ResizeObserver(update);if(nav.current)observer.observe(nav.current);media.addEventListener('change',update);return()=>{observer.disconnect();media.removeEventListener('change',update);root.classList.remove('has-mobile-shop-nav');if(previous)root.style.setProperty('--mobile-shop-nav-height',previous);else root.style.removeProperty('--mobile-shop-nav-height');};
 },[enabled,s.height,preview,waiting,sideMode]);
 const signature=JSON.stringify(items);
 useLayoutEffect(()=>{
  const bar=nav.current;if(!bar)return;
  const place=()=>{if(sideMode)bar.style.setProperty('--safari-menu-height',`${bar.scrollHeight+bar.offsetHeight-bar.clientHeight}px`);if(gesture.current?.moved)return;const link=bar.querySelector('[aria-current="page"]');if(!link){bar.style.setProperty('--lens-opacity','0');return;}bar.style.setProperty('--lens-opacity','1');bar.style.setProperty('--lens-x',`${link.offsetLeft}px`);bar.style.setProperty('--lens-width',`${link.offsetWidth}px`);bar.style.setProperty('--lens-y',`${link.offsetTop}px`);bar.style.setProperty('--lens-height',`${link.offsetHeight}px`);};
  place();const observer=new ResizeObserver(place);observer.observe(bar);return()=>observer.disconnect();
 },[location.pathname,location.hash,signature,enabled,expanded,sideMode]);
 const reset=(target)=>{
  cancelAnimationFrame(gesture.current?.frame);gesture.current=null;const bar=nav.current;if(!bar)return;
  bar.classList.remove('is-sliding');['--lens-stretch','--lens-squash','--lens-radius-left','--lens-radius-right'].forEach(key=>bar.style.removeProperty(key));
  bar.querySelectorAll('a').forEach(link=>{['--icon-scale','--icon-lift','--icon-shift','--icon-glow'].forEach(key=>link.style.removeProperty(key));link.removeAttribute('data-glass-hover');});
  const link=target?.nodeType===1?target:bar.querySelector('[aria-current="page"]');bar.style.setProperty('--lens-opacity',link?'1':'0');if(link){bar.style.setProperty('--lens-x',`${link.offsetLeft}px`);bar.style.setProperty('--lens-width',`${link.offsetWidth}px`);bar.style.setProperty('--lens-y',`${link.offsetTop}px`);bar.style.setProperty('--lens-height',`${link.offsetHeight}px`);}
 };
 useEffect(()=>()=>cancelAnimationFrame(gesture.current?.frame),[]);
 const pointerDown=e=>{
  if(sideMode||s.swipe===false||e.button!==0||!e.isPrimary)return;
  suppressClick.current=0;const bar=nav.current,bounds=bar.getBoundingClientRect();
  gesture.current={id:e.pointerId,x:e.clientX,y:e.clientY,lastX:e.clientX,direction:1,moved:false,left:bounds.left,width:bar.clientWidth,links:[...bar.querySelectorAll('a')].map(link=>({link,left:link.offsetLeft,width:link.offsetWidth}))};
 };
 const paintDrag=(point)=>{
  const g=gesture.current,bar=nav.current;if(!g||!bar)return;
  const dx=point.x-g.x,dy=point.y-g.y;
  if(!g.moved){if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>8){reset();return;}if(Math.abs(dx)<8)return;g.moved=true;bar.setPointerCapture(g.id);}
  const first=g.links[0];if(!first)return;
  const width=first.width,strength=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.max(0,Math.min(2,Number(s.liquidStretch??1))),stretch=1+Math.min(Math.abs(dx)/Math.max(width,1),1)*.55*strength,extra=width*(stretch-1)/2;
  const x=Math.max(first.left+extra,Math.min(g.width-width-first.left-extra,point.x-g.left-width/2));
  const delta=point.x-g.lastX;if(Math.abs(delta)>.5)g.direction=Math.sign(delta);g.lastX=point.x;
  bar.style.setProperty('--lens-stretch',String(stretch));bar.style.setProperty('--lens-squash',String(1-(stretch-1)*.2));
  bar.style.setProperty('--lens-radius-left',strength===0?'26px':g.direction>0?'18px':'32px');bar.style.setProperty('--lens-radius-right',strength===0?'26px':g.direction>0?'32px':'18px');
  g.links.forEach(({link,left,width:linkWidth})=>{const center=left+linkWidth/2,delta=point.x-g.left-center,influence=Math.max(0,1-Math.abs(delta)/(width*.85))*Math.max(0,Math.min(2,Number(s.iconEffect??1)));link.style.setProperty('--icon-scale',String(1+influence*.22));link.style.setProperty('--icon-lift',`${-influence*4}px`);link.style.setProperty('--icon-shift',`${delta*influence*.12}px`);link.style.setProperty('--icon-glow',String(influence*.4));if(influence>.5)link.setAttribute('data-glass-hover','');else link.removeAttribute('data-glass-hover');});
  bar.classList.add('is-sliding');bar.style.setProperty('--lens-opacity','1');bar.style.setProperty('--lens-width',`${width}px`);bar.style.setProperty('--lens-x',`${x}px`);
 };
 const pointerMove=e=>{const g=gesture.current;if(!g||g.id!==e.pointerId)return;g.pending={x:e.clientX,y:e.clientY};if(g.frame!=null)return;g.frame=requestAnimationFrame(()=>{g.frame=null;if(gesture.current===g)paintDrag(g.pending);});};
 const pointerUp=e=>{
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;cancelAnimationFrame(g.frame);paintDrag({x:e.clientX,y:e.clientY});if(gesture.current!==g)return;
  const moved=g.moved,bar=nav.current,bounds=bar.getBoundingClientRect();let target=null;
  if(moved&&e.clientY>=bounds.top-30&&e.clientY<=bounds.bottom+30){const x=e.clientX-g.left;target=g.links.reduce((best,row)=>Math.abs(row.left+row.width/2-x)<Math.abs(best.left+best.width/2-x)?row:best,g.links[0])?.link;}
  reset(target);if(moved){e.preventDefault();target?.click();suppressClick.current=Date.now()+400;}
 };
 useEffect(()=>{
  if(!expanded||!sideMode)return;
  const close=()=>{setExpanded(false);requestAnimationFrame(()=>toggle.current?.focus({preventScroll:true}));};
  const outside=event=>{if(!shell.current?.contains(event.target)&&!document.querySelector('.shop-cart[open]'))setExpanded(false);};
  const escape=event=>{if(event.key==='Escape'&&!document.querySelector('dialog[open]')){event.preventDefault();close();}};
  document.addEventListener('pointerdown',outside);document.addEventListener('keydown',escape);
  return()=>{document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);};
 },[expanded,sideMode]);
 if(!enabled&&!preview)return null;
 if(s.enabled===false||!items.length)return null;
 return <div ref={shell} className={sideMode?`safari-side-nav${preview?' is-preview':''}${expanded?' is-expanded':''}${waiting?' is-waiting':''}`:'mobile-shop-nav-shell'} style={sideMode?{...mobileNavTheme(s),'--safari-side-offset':`${Math.max(-180,Math.min(180,Number(s.safariOffset)||0))}px`,'--safari-drop-size':`${Math.max(44,Math.min(64,Number(s.safariSize)||52))}px`,'--safari-expand-duration':`${Math.max(200,Math.min(600,Number(s.safariDuration)||340))}ms`}:undefined} inert={sideMode&&waiting} aria-hidden={sideMode&&waiting||undefined}>
  {sideMode&&<button ref={toggle} type="button" className="safari-nav-toggle" aria-label={expanded?s.safariCloseLabel:s.safariOpenLabel} aria-expanded={expanded} aria-controls={navId} onClick={()=>setExpanded(v=>!v)}><svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d={expanded?'m6 9 6 6 6-6':'M12 2C9 7 4 10 4 15a8 8 0 0 0 16 0c0-5-5-8-8-13ZM8 15a4 4 0 0 0 4 4'}/></svg></button>}
  <nav id={navId} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={reset} onClickCapture={e=>{if(e.nativeEvent.isTrusted&&e.detail!==0&&Date.now()<suppressClick.current){e.preventDefault();e.stopPropagation();}}} ref={nav} className={`mobile-shop-nav${preview?' is-preview':''}${waiting?' is-waiting':''}${sideMode?' is-side':''}`} inert={waiting||(sideMode&&!expanded)} aria-hidden={waiting||(sideMode&&!expanded)||undefined} aria-label={s.title} style={{...mobileNavTheme(s),'--safari-menu-height':`${Math.max(s.height,Math.min(420,items.length*52+10))}px`,gridTemplateColumns:sideMode?'minmax(0,1fr)':`repeat(${items.length},minmax(0,1fr))`}}>
   <span className="mobile-nav-lens" aria-hidden="true"/>
   {items.map(item=>{
    const internal=item.to.startsWith('/'),Tag=internal?Link:'a';
    return <Tag key={item.id} data-cart-target={item.id==='cart'?'':undefined} {...(internal?{to:preview?'#':item.to}:{href:preview?'#':item.to})} onClick={event=>{if(preview){event.preventDefault();return;}if(s.spin!==false&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)event.currentTarget.querySelector('svg')?.animate([{transform:'rotate(0deg) scale(1)'},{transform:'rotate(180deg) scale(.8)',offset:.45},{transform:'rotate(360deg) scale(1)'}],{duration:460,easing:'cubic-bezier(.2,.8,.2,1)'});if(item.id==='cart'){event.preventDefault();window.dispatchEvent(new CustomEvent('orora-cart-open',{detail:{toggle:true,source:event.currentTarget.getBoundingClientRect().toJSON()}}));return;}if(sideMode)setExpanded(false);if(item.to==='/')window.scrollTo({top:0,left:0,behavior:'instant'});if(internal&&item.to.startsWith('/#')&&location.pathname==='/')document.getElementById(item.to.slice(2))?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}} aria-current={location.pathname+location.hash===item.to?'page':undefined}><Icon kind={item.icon}/>{item.id==='cart'&&cartCount>0&&<sup className="cart-count">{cartCount}</sup>}<span style={toCss(s.textStyle)}>{item.label}</span></Tag>;
   })}
  </nav>

 </div>;
}
