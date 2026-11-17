import {useEffect,useRef} from 'react';

export default function useSideNavDrag({enabled,preview,root,size,draggable,onCollapse}) {
 const drag=useRef(null),manual=useRef(null),suppress=useRef(0),frame=useRef(null);
 const clamp=y=>{const view=window.visualViewport,top=view?.offsetTop||0,height=view?.height||innerHeight;return Math.max(top+size/2+12,Math.min(top+height-size/2-12,y));};
 const apply=y=>{manual.current=clamp(y);root.current?.style.setProperty('--safari-dock-center',`${manual.current}px`);};
 useEffect(()=>{
  if(!enabled)return;
  const resize=()=>{if(manual.current!=null)apply(manual.current);};
  window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);
  return()=>{cancelAnimationFrame(frame.current);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);root.current?.style.removeProperty('--safari-dock-center');manual.current=null;};
 // Event handlers read the current dimensions; reposition only on a real resize.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[enabled,size]);
 const finish=event=>{
  const state=drag.current;if(!state||state.id!==event.pointerId)return;
  cancelAnimationFrame(frame.current);if(state.moved){apply(state.next);suppress.current=Date.now()+500;}
  root.current?.classList.remove('is-dragging');drag.current=null;
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
 };
 return {
  onPointerDown:event=>{if(!enabled||preview||!draggable||event.button!==0||!event.isPrimary||document.querySelector('.shop-cart[open]'))return;const rect=event.currentTarget.getBoundingClientRect();drag.current={id:event.pointerId,start:event.clientY,center:rect.y+rect.height/2,next:rect.y+rect.height/2,moved:false};event.currentTarget.setPointerCapture(event.pointerId);},
  onPointerMove:event=>{const state=drag.current;if(!state||state.id!==event.pointerId)return;const dy=event.clientY-state.start;if(!state.moved&&Math.abs(dy)<7)return;if(!state.moved){state.moved=true;onCollapse();root.current?.classList.add('is-dragging');}state.next=state.center+dy;cancelAnimationFrame(frame.current);frame.current=requestAnimationFrame(()=>apply(state.next));},
  onPointerUp:finish,onPointerCancel:finish,onLostPointerCapture:finish,
  onClickCapture:event=>{if(event.detail!==0&&Date.now()<suppress.current){event.preventDefault();event.stopPropagation();}},
 };
}
