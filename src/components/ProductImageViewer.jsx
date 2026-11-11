import {useCallback,useEffect,useRef,useState} from 'react';
import ModalDialog from './ModalDialog';
import {cdnSrc,THUMB} from '../lib/image-cdn';
import {toCss} from '../lib/typography';
import {imageViewerSettings,constrainImageView,zoomImageAt} from '../lib/image-viewer';
import '../styles/image-viewer.css';
export default function ProductImageViewer({images,name='',initialIndex=0,settings={},onClose}){
 const s=imageViewerSettings(settings),list=[...new Set(images.filter(Boolean))];
 const [index,setIndex]=useState(Math.max(0,Math.min(list.length-1,initialIndex))),[view,setView]=useState({scale:1,x:0,y:0});
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0);
 const stage=useRef(null),photo=useRef(null),current=useRef(view),box=useRef({width:1,height:1,imageWidth:1,imageHeight:1});
 const pointers=useRef(new Map()),gesture=useRef(null),lastTap=useRef(null),pinched=useRef(false),lastTouch=useRef(0);
 const apply=useCallback(next=>{current.current=next;setView(next);},[]);
 const measure=useCallback(()=>{
  const node=stage.current,img=photo.current;if(!node||!img)return;
  const width=node.clientWidth,height=node.clientHeight,ratio=Math.min(width/(img.naturalWidth||width),height/(img.naturalHeight||height));
  box.current={width,height,imageWidth:(img.naturalWidth||width)*ratio,imageHeight:(img.naturalHeight||height)*ratio};
  apply(constrainImageView(current.current,box.current,s.maxZoom));
 },[apply,s.maxZoom]);
 useEffect(()=>{if(!stage.current)return;const observer=new ResizeObserver(measure);observer.observe(stage.current);return()=>observer.disconnect();},[measure]);
 const move=useCallback(direction=>{
  if(list.length<2||direction%list.length===0)return;
  setIndex(previous=>(previous+direction+list.length)%list.length);setLoaded(false);setFailed(false);pointers.current.clear();gesture.current=null;lastTap.current=null;apply({scale:1,x:0,y:0});
 },[list.length,apply]);
 const zoom=useCallback((scale,point={x:0,y:0})=>apply(zoomImageAt(current.current,scale,point,box.current,s.maxZoom)),[apply,s.maxZoom]);
 useEffect(()=>{
  const node=stage.current;
  const wheel=event=>{event.preventDefault();const rect=node.getBoundingClientRect();zoom(current.current.scale*(event.deltaY<0?1.15:1/1.15),{x:event.clientX-rect.left-rect.width/2,y:event.clientY-rect.top-rect.height/2});};
  node.addEventListener('wheel',wheel,{passive:false});return()=>node.removeEventListener('wheel',wheel);
 },[zoom]);
 const point=event=>({x:event.clientX,y:event.clientY});
 const startGesture=()=>{
  const points=[...pointers.current.values()];
  if(points.length===2){pinched.current=true;lastTap.current=null;gesture.current={view:{...current.current},distance:Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y),middle:{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}};}
  else if(points.length===1)gesture.current={view:{...current.current},start:points[0]};
 };
 const pointerDown=event=>{
  if(event.pointerType==='mouse'&&event.button!==0)return;
  if(event.pointerType==='touch')lastTouch.current=Date.now();
  if(!pointers.current.size)pinched.current=false;
  pointers.current.set(event.pointerId,point(event));event.currentTarget.setPointerCapture(event.pointerId);startGesture();
 };
 const pointerMove=event=>{
  if(!pointers.current.has(event.pointerId))return;
  pointers.current.set(event.pointerId,point(event));const g=gesture.current;if(!g)return;
  const points=[...pointers.current.values()];
  if(points.length===2&&g.distance){
   const middle={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2},rect=stage.current.getBoundingClientRect();
   const scale=Math.max(1,Math.min(s.maxZoom,g.view.scale*Math.hypot(points[1].x-points[0].x,points[1].y-points[0].y)/Math.max(1,g.distance))),ratio=scale/g.view.scale;
   apply(constrainImageView({scale,x:middle.x-rect.left-rect.width/2-(g.middle.x-rect.left-rect.width/2-g.view.x)*ratio,y:middle.y-rect.top-rect.height/2-(g.middle.y-rect.top-rect.height/2-g.view.y)*ratio},box.current,s.maxZoom));
  }else if(points.length===1&&g.start&&current.current.scale>1)apply(constrainImageView({...g.view,x:g.view.x+event.clientX-g.start.x,y:g.view.y+event.clientY-g.start.y},box.current,s.maxZoom));
 };
 const pointerEnd=event=>{
  if(!pointers.current.has(event.pointerId))return;
  const g=gesture.current; pointers.current.delete(event.pointerId);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(event.type!=='pointercancel'&&!pinched.current&&g?.start){
   const dx=event.clientX-g.start.x,dy=event.clientY-g.start.y;
   if(current.current.scale===1&&Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.3){move(dx<0?1:-1);return;}
   if(event.pointerType==='touch'&&Math.hypot(dx,dy)<12){
    const now=Date.now(),previous=lastTap.current;
    if(previous&&now-previous.at<320&&Math.hypot(previous.x-event.clientX,previous.y-event.clientY)<24){zoom(current.current.scale>1?1:2.5);lastTap.current=null;}
    else lastTap.current={at:now,x:event.clientX,y:event.clientY};
   }
  }
  if(pointers.current.size)startGesture();else gesture.current=null;
 };
 const css=key=>toCss(s[key],{responsive:true});
 const theme={'--viewer-bg':s.background||'#fffafc','--viewer-color':s.color||'#3a1526','--viewer-accent':s.accent||'#b8446d','--viewer-control-color':s.controls?.color||s.accent||'#b8446d','--viewer-line':s.borderColor||'#efd7e1','--viewer-radius':`${Math.max(0,Math.min(32,(s.radius === undefined || s.radius === "" ? 12 : Number(s.radius))))}px`,fontFamily:s.controls?.fontFamily};
 if(!list.length)return null;
 return <ModalDialog title={s.title.replaceAll('{product}',name)} closeLabel={s.closeLabel} headingStyle={css('heading')} className="product-image-viewer" style={theme} onClose={onClose} onKeyDown={event=>{
  if(event.target.tagName==='INPUT'||event.target.tagName==='TEXTAREA')return;
  if(['ArrowLeft','ArrowRight','+','=','-','0'].includes(event.key))event.preventDefault();
  if(event.key==='ArrowLeft')move(-1);if(event.key==='ArrowRight')move(1);
  if(event.key==='+'||event.key==='=')zoom(current.current.scale+.5);if(event.key==='-')zoom(current.current.scale-.5);if(event.key==='0')zoom(1);
 }}>
  <div className="image-viewer-stage" ref={stage} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={pointerEnd} onLostPointerCapture={pointerEnd} onDoubleClick={()=>{if(Date.now()-lastTouch.current>600)zoom(current.current.scale>1?1:2.5);}}>
   <img key={`${index}:${retry}`} ref={photo} src={cdnSrc(list[index],{w:2200,q:'auto:good'})} alt={name} draggable={false} decoding="async" onLoad={()=>{setLoaded(true);setFailed(false);measure();}} onError={()=>{setLoaded(false);setFailed(true);}} style={{transform:`translate3d(${view.x}px,${view.y}px,0) scale(${view.scale})`,opacity:loaded?1:0}}/>
   {!loaded&&<p className="image-viewer-status" role="status" style={css('info')}>{failed?s.errorLabel:s.loadingLabel}{failed&&<button type="button" onPointerDown={event=>event.stopPropagation()} onClick={()=>{setFailed(false);setRetry(value=>value+1);}}>{s.retryLabel}</button>}</p>}
  </div>
  <div className="image-viewer-controls" style={css('controls')}>
   <button type="button" disabled={list.length<2} aria-label={s.previousLabel} onClick={()=>move(-1)}>‹</button><span role="status" aria-label={`${index+1} / ${list.length}`}>{index+1} / {list.length}</span><button type="button" disabled={list.length<2} aria-label={s.nextLabel} onClick={()=>move(1)}>›</button>
   <button type="button" aria-label={s.zoomOutLabel} disabled={view.scale<=1} onClick={()=>zoom(view.scale-.5)}>−</button><button type="button" aria-label={s.resetLabel} onClick={()=>zoom(1)}>{Math.round(view.scale*100)}%</button><button type="button" aria-label={s.zoomInLabel} disabled={view.scale>=s.maxZoom} onClick={()=>zoom(view.scale+.5)}>+</button>
  </div>
  {s.showThumbnails&&list.length>1&&<div className="image-viewer-thumbnails" role="group" aria-label={s.imageLabel}>{list.map((src,i)=><button key={src} type="button" aria-label={`${s.imageLabel} ${i+1}`} aria-pressed={i===index} onClick={()=>move(i-index)}><img src={cdnSrc(src,{...THUMB,w:120})} alt="" loading="lazy"/></button>)}</div>}
  {s.showHint&&<p className="image-viewer-hint" style={css('info')}>{s.hint}</p>}
 </ModalDialog>;
}
