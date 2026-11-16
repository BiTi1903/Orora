import { useLayoutEffect, useId, useRef } from "react";
import {popupMotionKeyframes} from "../lib/popup-motion";
const locks = new WeakMap();
export default function ModalDialog({ title, children, onClose, className = "", closeDisabled = false, closeLabel="Đóng cửa sổ", style, headingStyle, allowBackgroundScroll=false, outsideClickIgnoreSelector, motionSource, motionDuration=650, motionClosing=false, onMotionClosed }) {
  const closeRef=useRef(onClose);useLayoutEffect(()=>{closeRef.current=()=>{if(!closeDisabled)onClose();};});
  const motionRef=useRef(null),motionClosedRef=useRef(onMotionClosed);
  useLayoutEffect(()=>{motionClosedRef.current=onMotionClosed;});
  const ref = useRef(null); const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current; const body = dialog.ownerDocument.body;
    if(allowBackgroundScroll){dialog.show();const ignored=event=>outsideClickIgnoreSelector&&event.target.closest?.(outsideClickIgnoreSelector);let start=null;const down=event=>{start=!ignored(event)&&!dialog.contains(event.target)?{x:event.clientX,y:event.clientY,id:event.pointerId}:null;};const up=event=>{if(!ignored(event)&&start&&start.id===event.pointerId&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<8&&!dialog.contains(event.target)&&!body.querySelector('dialog:modal'))closeRef.current();start=null;};const escape=event=>{if(event.key==='Escape'&&!body.querySelector('dialog:modal'))closeRef.current();};body.addEventListener('pointerdown',down);body.addEventListener('pointerup',up);body.addEventListener('keydown',escape);return()=>{body.removeEventListener('pointerdown',down);body.removeEventListener('pointerup',up);body.removeEventListener('keydown',escape);dialog.close();};}
    const lock = locks.get(body) || { count: 0, overflow: body.style.overflow };
    lock.count++; locks.set(body, lock); body.style.overflow = "hidden"; dialog.showModal();
    return () => { dialog.close(); lock.count--; if (!lock.count) { body.style.overflow = lock.overflow; locks.delete(body); } };
  }, [allowBackgroundScroll,outsideClickIgnoreSelector]);
  useLayoutEffect(() => {
    const dialog = ref.current, viewport = window.visualViewport;
    let frame = null;
    const measure = () => {
      const zoomed = viewport && Math.abs(viewport.scale - 1) > .01;
      dialog.style.setProperty('--modal-viewport-height', `${zoomed ? window.innerHeight : viewport?.height || window.innerHeight}px`);
      dialog.style.setProperty('--modal-viewport-top', `${zoomed ? 0 : viewport?.offsetTop || 0}px`);
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
      duration: motionDuration, easing: 'linear', fill: 'both'
    });
    motionRef.current=animation;
    return () => { animation.cancel(); motionRef.current=null; };
  }, [motionSource, motionDuration]);
  useLayoutEffect(()=>{
    if(!motionClosing)return;
    const animation=motionRef.current;
    if(!animation){motionClosedRef.current?.();return;}
    // A keyboard/viewport change may have moved the settled dialog. Rebase at
    // identity before reversing so the flight still ends at the captured trigger.
    if(animation.playState==='finished'&&motionSource){
      animation.effect.setKeyframes(popupMotionKeyframes(motionSource,ref.current.getBoundingClientRect()));
    }
    animation.onfinish=()=>{
      // WebKit can deliver the forward finish event after reverse was requested.
      if(animation.playbackRate<0&&animation.currentTime<=0){
        // Keep the final invisible frame while React removes the dialog.
        ref.current.style.visibility='hidden';
        motionClosedRef.current?.();
      }
    };
    // reverse() can stay pending on a finished, filled WebKit animation.
    // Setting the rate explicitly preserves its current point and starts it back.
    animation.playbackRate=-Math.abs(animation.playbackRate||1);
    animation.play();
    return()=>{animation.onfinish=null;};
  },[motionClosing,motionSource]);
  return <>{allowBackgroundScroll&&<div className="orora-modeless-backdrop" aria-hidden="true"/>}<dialog ref={ref} className={`orora-modal ${className}${allowBackgroundScroll?' is-modeless':''}`} aria-labelledby={titleId} style={style} onClose={event=>{event.stopPropagation();if(!ref.current?.open)onClose();}} onCancel={(event) => {event.stopPropagation();event.preventDefault();if(!closeDisabled)onClose();}} onClick={(event) => {
    if (closeDisabled || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}><div className="orora-modal-heading"><h2 id={titleId} style={headingStyle}>{title}</h2><button type="button" aria-label={closeLabel} disabled={closeDisabled} onClick={onClose}>×</button></div><div className="orora-modal-content">{children}</div></dialog></>;
}
