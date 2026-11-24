import { useState } from "react";
import { createPortal } from "react-dom";
import ModalDialog from "../components/ModalDialog";
import ProductContent from "../components/ProductContent";
import { toCss } from "../lib/typography";
import "../styles/product-detail.css";
import ImageField from "./ImageField";
import ProductContentEditor from "./ProductContentEditor";
import { useConfirm } from "./confirm-context";
import { StyleTypographyBlock } from "./builder/ui";
import { normalizeProductBlockText, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";

export default function ProductInformationEditor({ sections, visibility, onChange, onVisibility, onUpload, newBlock, disabled, uploading }) {
  const confirm = useConfirm();
  const [openGroup, setOpenGroup] = useState("description");
  const [previewId, setPreviewId] = useState(null);
  const preview = sections.find((item) => item.id === previewId);
  const update = (id, patch) => onChange((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));

  return <section className="product-editor-block" aria-label="Nội dung chi tiết sản phẩm">
    <h3>Nội dung chi tiết</h3>
    <p className="admin-muted">Ảnh đề xuất 1920 × 1280 px. Bạn có thể thêm chữ ngay sau từng ảnh.</p>
    {Object.entries(PRODUCT_CONTENT_GROUPS).map(([group, label]) => {
      const blocks = sections.filter((item) => item.group === group);
      return <details className="product-content-section" key={group} open={openGroup === group}>
        <summary onClick={(event) => { event.preventDefault(); setOpenGroup(openGroup === group ? "" : group); }}><strong>{label}</strong></summary>
        <label className="admin-check">
          <input type="checkbox" role="switch" checked={visibility?.[group] !== false} disabled={disabled} onChange={(event) => onVisibility(group, event.target.checked)} />
          Hiển thị {label}
        </label>
        {blocks.map((item, index) => <div className="product-content-section" key={item.id}>
          <div className="product-editor-heading"><strong>Mục {index + 1}</strong>
            <div className="admin-actions">
            <button type="button" className="admin-btn" disabled={!item.image?.trim() && !item.title?.trim() && !item.content?.trim()} onClick={() => setPreviewId(item.id)}>Xem mục</button>
            <button type="button" className="admin-btn danger" disabled={disabled || uploading} onClick={async () => {
              if ((item.image || item.title || item.content) && !await confirm("Bỏ ảnh và chữ trong khối này? Thay đổi áp dụng khi lưu sản phẩm.", { title: "Xóa mục nội dung", confirmLabel: "Xóa mục", danger: true })) return;
              onChange((items) => blocks.length === 1
                ? items.map((entry) => entry.id === item.id ? newBlock(group) : entry)
                : items.filter((entry) => entry.id !== item.id));
            }}>Xóa mục</button>
            </div>
          </div>
          <ImageField label={`${label} · Ảnh ${index + 1}`} value={item.image || ""} width={1920} disabled={disabled}
            onChange={(image) => update(item.id, { image })} onBusyChange={(busy) => onUpload(item.id, busy)} />
          <div className="admin-field">
            <label>Văn bản thay thế cho ảnh<input value={item.imageAlt || ""} disabled={disabled} onChange={(event) => update(item.id, { imageAlt: event.target.value })} /></label>
          </div>
          <details>
            <summary>{item.title || item.content ? "Chỉnh chữ sau ảnh" : "Thêm chữ sau ảnh (tùy chọn)"}</summary>
            <fieldset className="product-media-text-controls" disabled={disabled}>
              <div className="admin-field"><label>Tiêu đề<input value={item.title || ""} onChange={(event) => update(item.id, { title: event.target.value })} /></label></div>
              <ProductContentEditor label={`${label} · Nội dung khối ${index + 1}`} value={item.content || ""} escapedLineBreaks disabled={disabled} onChange={(content) => update(item.id, { content })} />
              <div className="admin-field"><label>Hiệu ứng chữ<select value={item.effect || "fade"} onChange={(event) => update(item.id, { effect: event.target.value })}>
                <option value="fade">Hiện dần</option><option value="rise">Trượt nhẹ lên</option><option value="none">Tắt hiệu ứng</option>
              </select></label></div>
              <StyleTypographyBlock style={item.textStyle} onStyleChange={(patch) => update(item.id, { textStyle: { ...item.textStyle, ...patch } })} />
            </fieldset>
          </details>
        </div>)}
        <button type="button" className="admin-btn" disabled={disabled || uploading} onClick={() => onChange((items) => [...items, newBlock(group)])}>+ Thêm mục · {label}</button>
      </details>;
    })}
    {preview && createPortal(
      <ModalDialog title={`Xem mục · ${PRODUCT_CONTENT_GROUPS[preview.group]}`} onClose={() => setPreviewId(null)}>
        {preview.image?.trim() && <div className="product-information-image">
          <img src={preview.image.trim()} alt={preview.imageAlt || ""} width={1920} height={1280} />
        </div>}
        {(preview.title?.trim() || preview.content?.trim()) && <div className="product-information-media-text" style={toCss(preview.textStyle)}>
          {preview.title?.trim() && <h3>{preview.title}</h3>}
          {preview.content?.trim() && <ProductContent text={normalizeProductBlockText(preview.content)} />}
        </div>}
      </ModalDialog>, document.body
    )}
  </section>;
}
