import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { analyticsPath } from '../lib/analytics';
let memoryVisitor,previousPage;
function send(type,path){
  try{
    if(navigator.doNotTrack==='1'||navigator.globalPrivacyControl===true)return;
    const safe=analyticsPath(path);if(!safe)return;
    let visitor=memoryVisitor;
    if(!visitor){try{visitor=localStorage.getItem('orora.analytics.visitor');if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(visitor||'')){visitor=crypto.randomUUID();localStorage.setItem('orora.analytics.visitor',visitor);}}catch{visitor=crypto.randomUUID();}memoryVisitor=visitor;}
    const body=JSON.stringify({visitorId:visitor,eventId:crypto.randomUUID(),type,path:safe});
    fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
  }catch{/* Metrics must never interrupt shopping. */}
}
export default function SiteAnalytics(){
  const location=useLocation();
  const currentPath=useRef(location.pathname);
  useEffect(()=>{
    currentPath.current=location.pathname;
    if(location.pathname.startsWith('/admin')){previousPage=undefined;return;}
    const pageKey=`${location.key}:${location.pathname}`;
    const timer=setTimeout(()=>{if(previousPage!==pageKey){previousPage=pageKey;send('page_view',location.pathname);}},150);
    return()=>clearTimeout(timer);
  },[location.pathname,location.key]);
  useEffect(()=>{
    // Bubble after React's carousel capture handler: cancelled drags never reach here.
    const click=event=>{if(currentPath.current.startsWith('/admin')||event.button!==0)return;const link=event.target?.closest?.('a[href]');if(!link)return;try{const url=new URL(link.href,window.location.origin);if(url.origin===window.location.origin&&url.pathname.startsWith('/product/'))send('product_click',url.pathname);}catch{/* Ignore invalid links. */}};
    document.addEventListener('click',click);return()=>document.removeEventListener('click',click);
  },[]);
  return null;
}
