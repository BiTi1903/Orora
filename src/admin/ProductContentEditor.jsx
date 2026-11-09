import ProductContent from "../components/ProductContent";
import { useId, useRef } from "react";
import { continueProductList, formatProductList, formatProductInline } from "../lib/product-content";

export default function ProductContentEditor({ value, onChange, label, disabled }) {
  const id = useId(); const ref = useRef(null);
  const restore = (start, end = start) => requestAnimationFrame(() => { ref.current?.focus(); ref.current?.setSelectionRange(start, end); });
  const format = (kind) => {
    const input = ref.current;
    const result = formatProductList(value, input.selectionStart, input.selectionEnd, kind);
    onChange(result.text); restore(result.start, result.end);
  };
  const inlineFormat=mark=>{const input=ref.current;const result=formatProductInline(value,input.selectionStart,input.selectionEnd,mark);onChange(result.text);restore(result.start,result.end);};
  return <div className="admin-field product-content-editor"><label htmlFor={id}>{label}</label><div className="product-content-toolbar" role="group" aria-label={`Định dạng ${label}`}>
    {[["b","In đậm"],["i","In nghiêng"],["u","Gạch chân"],["s","Gạch ngang chữ"]].map(([mark,name])=><button key={mark} type="button" className="admin-btn product-format-icon" aria-label={name} title={name} disabled={disabled} onMouseDown={event=>event.preventDefault()} onClick={()=>inlineFormat(mark)}><span aria-hidden="true">{mark==="b"?<strong>B</strong>:mark==="i"?<em>I</em>:mark==="u"?<u>U</u>:<s>S</s>}</span></button>)}
    {[["dash", "− Gạch ngang"], ["bullet", "• Dấu chấm"], ["number", "1. Đánh số"], ["none", "Bỏ danh sách"]].map(([kind, name]) => <button key={kind} type="button" className="admin-btn" disabled={disabled} onMouseDown={(event) => event.preventDefault()} onClick={() => format(kind)}>{name}</button>)}
  </div><textarea ref={ref} id={id} rows={6} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => {
    if((event.ctrlKey||event.metaKey)&&!event.altKey&&["b","i","u"].includes(event.key.toLowerCase())){event.preventDefault();inlineFormat(event.key.toLowerCase());return;}
    if (event.key !== "Enter" || event.shiftKey || event.ctrlKey || event.metaKey || event.nativeEvent.isComposing || event.currentTarget.selectionStart !== event.currentTarget.selectionEnd) return;
    const result = continueProductList(value, event.currentTarget.selectionStart);
    if (result) { event.preventDefault(); onChange(result.text); restore(result.cursor); }
  }} /><small className="admin-muted">Bôi chọn chữ rồi bấm In đậm / In nghiêng / Gạch chân; bấm lại để bỏ. Phím tắt Ctrl/⌘ + B, I, U. Enter để xuống dòng; chọn các dòng để tạo danh sách.</small><div className="product-content-preview"><strong>Xem trước nội dung</strong><ProductContent text={value}/></div></div>;
}
