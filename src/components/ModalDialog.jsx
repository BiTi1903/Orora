import { useLayoutEffect, useId, useRef } from "react";
const locks = new WeakMap();
export default function ModalDialog({ title, children, onClose, className = "", closeDisabled = false, closeLabel="Đóng cửa sổ", style, headingStyle, allowBackgroundScroll=false, motionSource, motionDuration=650, motionClosing=false, onMotionClosed }) {
  const closeRef=useRef(onClose);useLayoutEffect(()=>{closeRef.current=()=>{if(!closeDisabled)onClose();};});
  const motionRef=useRef(null),motionClosedRef=useRef(onMotionClosed);
  useLayoutEffect(()=>{motionClosedRef.current=onMotionClosed;});
  const ref = useRef(null); const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current; const body = dialog.ownerDocument.body;
    if(allowBackgroundScroll){dialog.show();let start=null;const down=event=>{start=!dialog.contains(event.target)?{x:event.clientX,y:event.clientY,id:event.pointerId}:null;};const up=event=>{if(start&&start.id===event.pointerId&&Math.hypot(event.clientX-start.x,event.clientY-start.y)<8&&!dialog.contains(event.target)&&!body.querySelector('dialog:modal'))closeRef.current();start=null;};const escape=event=>{if(event.key==='Escape'&&!body.querySelector('dialog:modal'))closeRef.current();};body.addEventListener('pointerdown',down);body.addEventListener('pointerup',up);body.addEventListener('keydown',escape);return()=>{body.removeEventListener('pointerdown',down);body.removeEventListener('pointerup',up);body.removeEventListener('keydown',escape);dialog.close();};}
    const lock = locks.get(body) || { count: 0, overflow: body.style.overflow };
    lock.count++; locks.set(body, lock); body.style.overflow = "hidden"; dialog.showModal();
    return () => { dialog.close(); lock.count--; if (!lock.count) { body.style.overflow = lock.overflow; locks.delete(body); } };
  }, [allowBackgroundScroll]);
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!motionSource || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = dialog.getBoundingClientRect();
    const x = motionSource.x + (motionSource.width || 0) / 2 - box.left - box.width / 2;
    const y = motionSource.y + (motionSource.height || 0) / 2 - box.top - box.height / 2;
    const animation = dialog.animate([
      { transform: `translate(${x}px, ${y}px) scale(.12)`, opacity: 0 },
      { transform: 'translate(0, 0) scale(1.035)', opacity: 1, offset: .78 },
      { transform: 'translate(0, 0) scale(1)', opacity: 1 }
    ], { duration: motionDuration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
    motionRef.current=animation;
    return () => { animation.cancel(); motionRef.current=null; };
  }, [motionSource, motionDuration]);
  useLayoutEffect(()=>{
    if(!motionClosing)return;
    const animation=motionRef.current;
    if(!animation){motionClosedRef.current?.();return;}
    animation.onfinish=()=>motionClosedRef.current?.();
    animation.reverse();
    return()=>{animation.onfinish=null;};
  },[motionClosing]);
  return <>{allowBackgroundScroll&&<div className="orora-modeless-backdrop" aria-hidden="true"/>}<dialog ref={ref} className={`orora-modal ${className}${allowBackgroundScroll?' is-modeless':''}`} aria-labelledby={titleId} style={style} onClose={event=>{event.stopPropagation();if(!ref.current?.open)onClose();}} onCancel={(event) => {event.stopPropagation();event.preventDefault();if(!closeDisabled)onClose();}} onClick={(event) => {
    if (closeDisabled || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}><div className="orora-modal-heading"><h2 id={titleId} style={headingStyle}>{title}</h2><button type="button" aria-label={closeLabel} disabled={closeDisabled} onClick={onClose}>×</button></div><div className="orora-modal-content">{children}</div></dialog></>;
}
