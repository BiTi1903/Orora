import { useEffect, useId, useRef } from "react";
export default function MailPreviewDialog({ title, message, onClose, children, metadata }) {
  const ref = useRef(null); const titleId = useId();
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => { dialog.close(); }; }, []);
  return <dialog ref={ref} className="admin-mail-dialog" aria-labelledby={titleId} onClose={onClose} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const box = ref.current.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) ref.current.close();
  }}>
    <div className="mail-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="admin-btn" onClick={() => ref.current.close()}>Đóng</button></div>
    <div className="mail-dialog-content">{metadata}{message && <><h3>{message.subject}</h3><pre>{message.text}</pre></>}</div>
    {children && <div className="admin-actions mail-dialog-actions">{children}</div>}
  </dialog>;
}
