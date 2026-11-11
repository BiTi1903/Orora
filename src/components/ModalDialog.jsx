import { useLayoutEffect, useId, useRef } from "react";
const locks = new WeakMap();
export default function ModalDialog({ title, children, onClose, className = "", closeDisabled = false }) {
  const ref = useRef(null); const titleId = useId();
  useLayoutEffect(() => {
    const dialog = ref.current; const body = dialog.ownerDocument.body;
    const lock = locks.get(body) || { count: 0, overflow: body.style.overflow };
    lock.count++; locks.set(body, lock); body.style.overflow = "hidden"; dialog.showModal();
    return () => { dialog.close(); lock.count--; if (!lock.count) { body.style.overflow = lock.overflow; locks.delete(body); } };
  }, []);
  return <dialog ref={ref} className={`orora-modal ${className}`} aria-labelledby={titleId} onClose={event=>{event.stopPropagation();if(!ref.current?.open)onClose();}} onCancel={(event) => {event.stopPropagation();event.preventDefault();if(!closeDisabled)onClose();}} onClick={(event) => {
    if (closeDisabled || event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose();
  }}><div className="orora-modal-heading"><h2 id={titleId}>{title}</h2><button type="button" aria-label="Đóng cửa sổ" disabled={closeDisabled} onClick={onClose}>×</button></div><div className="orora-modal-content">{children}</div></dialog>;
}
