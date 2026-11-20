import { useLayoutEffect, useId, useRef } from "react";
import { POPUP_OPEN_EASING, POPUP_CLOSE_EASING, popupCloseDuration, popupMotionKeyframes } from "../lib/popup-motion";
const locks = new WeakMap();
export default function ModalDialog({ title, children, onClose, className = "", closeDisabled = false, closeLabel="Đóng cửa sổ", style, headingStyle, headerStyle, closeButtonStyle, initialFocusRef, allowBackgroundScroll=false, outsideClickIgnoreSelector, motionSource, motionDuration=420, motionClosing=false, onMotionClosed }) {
  const closeRef=useRef(onClose);useLayoutEffect(()=>{closeRef.current=()=>{if(!closeDisabled)onClose();};});
  const motionRef=useRef(null),motionClosedRef=useRef(onMotionClosed);
  useLayoutEffect(()=>{motionClosedRef.current=onMotionClosed;});
  const ref = useRef(null); const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current; const body = dialog.ownerDocument.body;
    if(allowBackgroundScroll){dialog.show();const ignored=event=>outsideClickIgnoreSelector&&event.target.closest?.(outsideClickIgnoreSelector);let start=null;const down=event=>{start=!ignored(event)&&!dialog.contains(event.target)?{x:event.clientX,y:event.clientY,id:event.pointerId}:null;};const up=event=>{if(!ignored(event)&&start&&start.id===event.pointerId&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<8&&!dialog.contains(event.target)&&!body.querySelector('dialog:modal'))closeRef.current();start=null;};const escape=event=>{if(event.key==='Escape'&&!body.querySelector('dialog:modal'))closeRef.current();};body.addEventListener('pointerdown',down);body.addEventListener('pointerup',up);body.addEventListener('keydown',escape);return()=>{body.removeEventListener('pointerdown',down);body.removeEventListener('pointerup',up);body.removeEventListener('keydown',escape);dialog.close();};}
    const lock = locks.get(body) || { count: 0, overflow: body.style.overflow };
    lock.count++; locks.set(body, lock); body.style.overflow = "hidden"; dialog.showModal();
    initialFocusRef?.current?.focus({ preventScroll: true });
    return () => { dialog.close(); lock.count--; if (!lock.count) { body.style.overflow = lock.overflow; locks.delete(body); } };
  }, [allowBackgroundScroll,outsideClickIgnoreSelector,initialFocusRef]);
  useLayoutEffect(() => {
    const dialog = ref.current, viewport = window.visualViewport;
    let frame = null, lastHeight = null, lastTop = null;
    const measure = () => {
      const zoomed = viewport && Math.abs(viewport.scale - 1) > .01;
      const nextHeight = zoomed ? window.innerHeight : viewport?.height || window.innerHeight;
      const nextTop = zoomed ? 0 : viewport?.offsetTop || 0;
      if (nextHeight !== lastHeight) { lastHeight = nextHeight; dialog.style.setProperty('--modal-viewport-height', `${nextHeight}px`); }
      if (nextTop !== lastTop) { lastTop = nextTop; dialog.style.setProperty('--modal-viewport-top', `${nextTop}px`); }
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(() => { frame = null; measure(); });
    };
    measure();
    viewport?.addEventListener('resize', schedule);
    viewport?.addEventListener('scroll', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener('resize', schedule);
      viewport?.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!motionSource || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = dialog.getBoundingClientRect();
    const animation = dialog.animate(popupMotionKeyframes(motionSource, box), {
      duration: motionDuration, easing: POPUP_OPEN_EASING, fill: 'both'
    });
    motionRef.current=animation;
    return () => { animation.cancel(); motionRef.current=null; };
  }, [motionSource, motionDuration]);
  useLayoutEffect(()=>{
    if(!motionClosing)return;
    const animation=motionRef.current;
    if(!animation){motionClosedRef.current?.();return;}
    const dialog=ref.current;
    const current=getComputedStyle(dialog);
    const frame={transform:current.transform,opacity:current.opacity,offset:1};
    const elapsed=Number(animation.currentTime)||0;
    if(elapsed<=0){dialog.style.visibility='hidden';motionClosedRef.current?.();return;}
    const origin=animation.playState==='finished'&&motionSource
      ?popupMotionKeyframes(motionSource,dialog.getBoundingClientRect())[0]
      :animation.effect.getKeyframes()[0];
    animation.pause();
    animation.effect.setKeyframes([
      {transform:origin.transform,opacity:origin.opacity,offset:0},
      frame,
    ]);
    const closeDuration=popupCloseDuration(motionDuration);
    const duration=Math.max(120,Math.min(closeDuration,elapsed));
    animation.effect.updateTiming({duration,easing:POPUP_CLOSE_EASING});
    animation.currentTime=duration;
    animation.onfinish=()=>{
      if(animation.playbackRate<0&&animation.currentTime<=0){
        if(ref.current)ref.current.style.visibility='hidden';
        motionClosedRef.current?.();
      }
    };
    animation.playbackRate=-Math.abs(animation.playbackRate||1);
    animation.play();
    return()=>{animation.onfinish=null;};
  },[motionClosing,motionSource,motionDuration]);
  const pointerDownOutsideRef=useRef(false);
  return <>{allowBackgroundScroll&&<div className="orora-modeless-backdrop" aria-hidden="true"/>}<dialog ref={ref} className={`orora-modal ${className}${allowBackgroundScroll?' is-modeless':''}`} aria-labelledby={titleId} style={style} onClose={event=>{event.stopPropagation();if(!ref.current?.open)onClose();}} onCancel={(event) => {event.stopPropagation();event.preventDefault();if(!closeDisabled)onClose();}} onPointerDown={(event) => {
    if (closeDisabled || event.target !== event.currentTarget) { pointerDownOutsideRef.current = false; return; }
    const box = event.currentTarget.getBoundingClientRect();
    pointerDownOutsideRef.current = event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom;
  }} onClick={(event) => {
    const startedOutside = pointerDownOutsideRef.current;
    pointerDownOutsideRef.current = false;
    if (!startedOutside || closeDisabled || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}><div className="orora-modal-heading" style={headerStyle}><h2 id={titleId} style={headingStyle}>{title}</h2><button type="button" aria-label={closeLabel} disabled={closeDisabled} style={closeButtonStyle} onClick={onClose}>×</button></div><div className="orora-modal-content">{children}</div></dialog></>;
}
