import { MAX_VOLUME_OPTIONS } from "../lib/product-options";
export default function ProductVolumeEditor({ options, onChange, disabled }) {
  const patch = (id, changes) => onChange(options.map((option) => option.id === id ? { ...option, ...changes } : option));
  return <section className="product-editor-block" aria-label="Dung tích sản phẩm">
    <div className="product-editor-heading"><div><h3>Dung tích / lựa chọn ml</h3><p className="admin-muted">Tự nhập, ví dụ 40 ml, 100 ml, 200 ml. Một lựa chọn sẽ được tự chọn; nhiều lựa chọn để khách chọn. Không có dung tích thì bỏ trống phần này.</p></div></div>
    {options.map((option, index) => <div className="product-content-section" key={option.id}>
      <div className="product-editor-heading"><strong>Dung tích {index + 1}</strong><button type="button" className="admin-btn danger" disabled={disabled} aria-label={`Xóa dung tích ${index + 1}`} onClick={() => onChange(options.filter((item) => item.id !== option.id))}>Xóa</button></div>
      <div className="admin-form-grid"><div className="admin-field"><label htmlFor={`volume-label-${option.id}`}>Tên dung tích {index + 1}</label><input id={`volume-label-${option.id}`} required maxLength={60} value={option.label} placeholder="100 ml" disabled={disabled} onChange={(event) => patch(option.id, { label: event.target.value })} /></div>
      <div className="admin-field"><label htmlFor={`volume-price-${option.id}`}>Giá dung tích {index + 1} (không bắt buộc)</label><input id={`volume-price-${option.id}`} value={option.price || ""} placeholder="Để trống để dùng giá chung" disabled={disabled} onChange={(event) => patch(option.id, { price: event.target.value })} /></div></div>
    </div>)}
    <button type="button" className="admin-btn" disabled={disabled || options.length >= MAX_VOLUME_OPTIONS} onClick={() => onChange([...options, { id: crypto.randomUUID(), label: "", price: "" }])}>+ Thêm dung tích</button>
    <p className="admin-muted">Tồn kho vẫn tính theo tổng số lượng sản phẩm trong mục Kiểm Hàng.</p>
  </section>;
}
