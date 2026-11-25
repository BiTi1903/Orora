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

const hasBlockData = (item) => Boolean(item?.image?.trim() || item?.title?.trim() || item?.content?.trim());

export default function ProductInformationEditor({ sections, visibility, onChange, onVisibility, onUpload, newBlock, disabled, uploading }) {
  const confirm = useConfirm();
  const [openGroup, setOpenGroup] = useState("description");
  const [previewId, setPreviewId] = useState(null);
  const preview = sections.find((item) => item.id === previewId);
  const update = (id, patch) => onChange((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  const hasAnyData = sections.some(hasBlockData);

  const moveBlock = (group, id, direction) => {
    onChange((items) => {
      const groupIndices = [];
      items.forEach((entry, idx) => {
        if (entry.group === group) groupIndices.push(idx);
      });
      const pos = groupIndices.findIndex((idx) => items[idx].id === id);
      const targetPos = pos + direction;
      if (pos < 0 || targetPos < 0 || targetPos >= groupIndices.length) return items;
      const next = [...items];
      const a = groupIndices[pos];
      const b = groupIndices[targetPos];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  };

  const clearGroup = async (group, label) => {
    if (
      !(await confirm(`Xóa toàn bộ ảnh và chú thích trong mục ${label}? Thay đổi áp dụng khi lưu sản phẩm.`, {
        title: `Xóa sạch ${label}`,
        confirmLabel: "Xóa sạch",
        danger: true,
      }))
    ) {
      return;
    }
    onChange((items) => [...items.filter((entry) => entry.group !== group), newBlock(group)]);
  };

  const clearAllGroups = async () => {
    if (
      !(await confirm("Xóa toàn bộ ảnh và chú thích trong cả 3 mục (Mô tả, Thông số, Hướng dẫn sử dụng)? Thay đổi áp dụng khi lưu sản phẩm.", {
        title: "Xóa toàn bộ nội dung",
        confirmLabel: "Xóa toàn bộ",
        danger: true,
      }))
    ) {
      return;
    }
    onChange(() => Object.keys(PRODUCT_CONTENT_GROUPS).map((group) => newBlock(group)));
  };

  return (
    <section className="product-editor-block" aria-label="Nội dung chi tiết sản phẩm">
      <div className="product-editor-heading">
        <div>
          <h3>Nội dung chi tiết</h3>
          <p className="admin-muted">
            Bật/tắt riêng từng mục và thêm nhiều khối Ảnh + Chú thích. Ảnh đề xuất 1920 × 1280 px.
          </p>
        </div>
        {hasAnyData && (
          <button
            type="button"
            className="admin-btn danger"
            disabled={disabled || uploading}
            onClick={clearAllGroups}
          >
            Xóa toàn bộ nội dung
          </button>
        )}
      </div>

      {Object.entries(PRODUCT_CONTENT_GROUPS).map(([group, label]) => {
        const blocks = sections.filter((item) => item.group === group);
        const tabVisible = visibility?.[group] !== false;
        const groupHasData = blocks.some(hasBlockData);

        return (
          <details
            className={`product-content-section${tabVisible ? "" : " is-tab-hidden"}`}
            key={group}
            open={openGroup === group}
          >
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenGroup(openGroup === group ? "" : group);
              }}
            >
              <strong>{label}</strong>
            </summary>

            <div className="product-editor-heading">
              <label className="admin-check">
                <input
                  type="checkbox"
                  role="switch"
                  checked={tabVisible}
                  disabled={disabled}
                  onChange={(event) => onVisibility(group, event.target.checked)}
                />
                Hiển thị {label}
              </label>
              {groupHasData && (
                <button
                  type="button"
                  className="admin-btn danger"
                  disabled={disabled || uploading}
                  onClick={() => clearGroup(group, label)}
                >
                  Xóa sạch {label}
                </button>
              )}
            </div>

            {blocks.map((item, index) => {
              const blockEnabled = item.enabled !== false;
              const captionVisible = item.showText !== false;
              return (
                <div
                  className={`product-content-section product-info-block${blockEnabled ? "" : " is-block-disabled"}`}
                  key={item.id}
                >
                  <div className="product-editor-heading">
                    <div className="product-info-block-title">
                      <strong>Mục {index + 1}</strong>
                      <label className="admin-check product-info-switch">
                        <input
                          type="checkbox"
                          role="switch"
                          checked={blockEnabled}
                          disabled={disabled}
                          onChange={(event) => update(item.id, { enabled: event.target.checked })}
                        />
                        Hiển thị mục {index + 1}
                      </label>
                    </div>
                    <div className="admin-actions">
                      {blocks.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="admin-btn"
                            aria-label={`Di chuyển mục ${index + 1} lên`}
                            title="Đưa lên"
                            disabled={disabled || uploading || index === 0}
                            onClick={() => moveBlock(group, item.id, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="admin-btn"
                            aria-label={`Di chuyển mục ${index + 1} xuống`}
                            title="Đưa xuống"
                            disabled={disabled || uploading || index === blocks.length - 1}
                            onClick={() => moveBlock(group, item.id, 1)}
                          >
                            ↓
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={!hasBlockData(item)}
                        onClick={() => setPreviewId(item.id)}
                      >
                        Xem mục
                      </button>
                      <button
                        type="button"
                        className="admin-btn danger"
                        disabled={disabled || uploading}
                        onClick={async () => {
                          if (
                            hasBlockData(item) &&
                            !(await confirm("Bỏ ảnh và chữ trong khối này? Thay đổi áp dụng khi lưu sản phẩm.", {
                              title: "Xóa mục nội dung",
                              confirmLabel: "Xóa mục",
                              danger: true,
                            }))
                          ) {
                            return;
                          }
                          onChange((items) =>
                            blocks.length === 1
                              ? items.map((entry) => (entry.id === item.id ? newBlock(group) : entry))
                              : items.filter((entry) => entry.id !== item.id),
                          );
                        }}
                      >
                        Xóa mục
                      </button>
                    </div>
                  </div>

                  <ImageField
                    label={`${label} · Ảnh ${index + 1}`}
                    value={item.image || ""}
                    width={1920}
                    disabled={disabled}
                    onChange={(image) => update(item.id, { image })}
                    onBusyChange={(busy) => onUpload(item.id, busy)}
                  />
                  <div className="admin-field">
                    <label>
                      Văn bản thay thế cho ảnh
                      <input
                        value={item.imageAlt || ""}
                        disabled={disabled}
                        onChange={(event) => update(item.id, { imageAlt: event.target.value })}
                      />
                    </label>
                  </div>

                  <details>
                    <summary>
                      {item.title || item.content ? "Chỉnh chữ sau ảnh" : "Thêm chữ sau ảnh (tùy chọn)"}
                    </summary>
                    <fieldset className="product-media-text-controls" disabled={disabled}>
                      <label className="admin-check" style={{ marginBottom: 12 }}>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={captionVisible}
                          disabled={disabled}
                          onChange={(event) => update(item.id, { showText: event.target.checked })}
                        />
                        Hiển thị chú thích khối {index + 1}
                      </label>
                      <div className="admin-field">
                        <label>
                          Tiêu đề
                          <input
                            value={item.title || ""}
                            onChange={(event) => update(item.id, { title: event.target.value })}
                          />
                        </label>
                      </div>
                      <ProductContentEditor
                        label={`${label} · Nội dung khối ${index + 1}`}
                        value={item.content || ""}
                        escapedLineBreaks
                        disabled={disabled}
                        onChange={(content) => update(item.id, { content })}
                      />
                      <div className="admin-field">
                        <label>
                          Hiệu ứng chữ
                          <select
                            value={item.effect || "fade"}
                            onChange={(event) => update(item.id, { effect: event.target.value })}
                          >
                            <option value="fade">Hiện dần</option>
                            <option value="rise">Trượt nhẹ lên</option>
                            <option value="none">Tắt hiệu ứng</option>
                          </select>
                        </label>
                      </div>
                      <StyleTypographyBlock
                        style={item.textStyle}
                        onStyleChange={(patch) => update(item.id, { textStyle: { ...item.textStyle, ...patch } })}
                      />
                    </fieldset>
                  </details>
                </div>
              );
            })}

            <button
              type="button"
              className="admin-btn"
              disabled={disabled || uploading}
              onClick={() => onChange((items) => [...items, newBlock(group)])}
            >
              + Thêm mục · {label}
            </button>
          </details>
        );
      })}

      {preview &&
        createPortal(
          <ModalDialog
            title={`Xem mục · ${PRODUCT_CONTENT_GROUPS[preview.group]}`}
            onClose={() => setPreviewId(null)}
          >
            {preview.enabled === false && (
              <p className="admin-muted" style={{ marginBottom: 12 }}>
                Mục này đang tắt hiển thị trên website.
              </p>
            )}
            {preview.image?.trim() && (
              <div className="product-information-image" data-image-state="ready" data-revealed="true">
                <img src={preview.image.trim()} alt={preview.imageAlt || ""} width={1920} height={1280} />
              </div>
            )}
            {preview.showText !== false && (preview.title?.trim() || preview.content?.trim()) && (
              <div className="product-information-media-text" style={toCss(preview.textStyle)}>
                {preview.title?.trim() && <h3>{preview.title}</h3>}
                {preview.content?.trim() && <ProductContent text={normalizeProductBlockText(preview.content)} />}
              </div>
            )}
          </ModalDialog>,
          document.body,
        )}
    </section>
  );
}
