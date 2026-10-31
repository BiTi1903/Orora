import { useId, useRef } from "react";
import { continueProductList, formatProductList } from "../lib/product-content";

export default function ProductContentEditor({ value, onChange, label, disabled }) {
  const id = useId(); const ref = useRef(null);
  const restore = (start, end = start) => requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(start, end); });
  const format = (kind) => {
    const input = ref.current;
    const result = formatProductList(value, input.selectionStart, input.selectionEnd, kind);
    onChange(result.text); restore(result.start, result.end);
  };
  return <div className="admin-field product-content-editor"><label htmlFor={id}>{label}</label><div className="product-content-toolbar" role="group" aria-label={`Định dạng ${label}`}>
    {[["dash", "− Gạch ngang"], ["bullet", "• Dấu chấm"], ["number", "1. Đánh số"], ["none", "Bỏ danh sách"]].map(([kind, name]) => <button key={kind} type="button" className="admin-btn" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => format(kind)}>{name}</button>)}
  </div><textarea ref={ref} id={id} rows={6} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => {
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || event.currentTarget.selectionStart !== event.currentTarget.selectionEnd) return;
    const result = continueProductList(value, event.currentTarget.selectionStart);
    if (result) { event.preventDefault(); onChange(result.text); restore(result.cursor); }
  }} /><small className="admin-muted">Enter để xuống dòng. Chọn các dòng rồi bấm kiểu danh sách; Enter lần nữa ở dòng danh sách trống để kết thúc.</small></div>;
}
