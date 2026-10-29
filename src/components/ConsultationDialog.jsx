import { useEffect, useId, useRef } from "react";

export default function ConsultationDialog({ children, onClose }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => { dialog.close(); document.body.style.overflow = overflow; };
  }, []);
  return <dialog ref={ref} className="product-consultation-dialog" aria-labelledby={titleId} onClose={onClose} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const box = event.currentTarget.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) ref.current.close();
  }}>
    <div className="consultation-dialog-heading"><h2 id={titleId}>Tư vấn cùng ORORA</h2><button type="button" aria-label="Đóng tư vấn" onClick={() => ref.current.close()}>×</button></div>
    <p>Bạn muốn được hỗ trợ qua hình thức nào?</p>
    <div className="product-consultation-options" aria-label="Chọn hình thức tư vấn">{children}</div>
  </dialog>;
}
