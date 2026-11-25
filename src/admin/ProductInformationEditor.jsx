import { useState } from "react";
import { createPortal } from "react-dom";
import ModalDialog from "../components/ModalDialog";
import ProductContent from "../components/ProductContent";
import "../styles/product-detail.css";
import ImageField from "./ImageField";
import ProductContentEditor from "./ProductContentEditor";
import { useConfirm } from "./confirm-context";
import { isProductContentGroupVisible, normalizeProductBlockText, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";

const hasBlockData = (item) => Boolean(item?.image?.trim() || item?.title?.trim() || item?.content?.trim());

export default function ProductInformationEditor({
  sections,
  visibility,
  onChange,
  onVisibility,
  onUpload,
  newBlock,
  disabled,
  uploading,
}) {
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
      !(await confirm(
        "Xóa toàn bộ ảnh và chú thích trong cả 3 mục (Mô tả, Thông số, Hướng dẫn sử dụng)? Thay đổi áp dụng khi lưu sản phẩm.",
        {
          title: "Xóa toàn bộ nội dung",
          confirmLabel: "Xóa toàn bộ",
          danger: true,
        },
      ))
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
            Ảnh tỷ lệ 3:2 (1920 × 1280 px). Ở đây chỉ nhập Đầu mục & Nội dung; font, màu và hiệu ứng dùng chung chỉnh
            tại Visual Builder.
          </p>
        </div>
        {hasAnyData && (
          <button type="button" className="admin-btn danger" disabled={disabled || uploading} onClick={clearAllGroups}>
            Xóa toàn bộ nội dung
          </button>
        )}
      </div>

      {Object.entries(PRODUCT_CONTENT_GROUPS).map(([group, label]) => {
        const blocks = sections.filter((item) => item.group === group);
        const tabVisible = isProductContentGroupVisible(visibility, group);
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
              <span className="admin-muted" style={{ marginLeft: 8, fontSize: 12, fontWeight: 500 }}>
                {tabVisible ? "· Đang hiện" : "· Đang ẩn"}
              </span>
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
                    label={`${label} · Ảnh ${index + 1} (3:2 · 1920 × 1280)`}
                    value={item.image || ""}
                    width={1920}
                    disabled={disabled}
                    onChange={(image) => update(item.id, { image })}
                    onBusyChange={(busy) => onUpload(item.id, busy)}
                  />

                  <label className="admin-check">
                    <input
                      type="checkbox"
                      role="switch"
                      checked={captionVisible}
                      disabled={disabled}
                      onChange={(event) => update(item.id, { showText: event.target.checked })}
                    />
                    Hiển thị chú thích khối {index + 1}
                  </label>

                  {captionVisible && (
                    <fieldset className="product-media-text-controls" disabled={disabled}>
                      <div className="admin-field">
                        <label>
                          Đầu mục
                          <input
                            value={item.title || ""}
                            placeholder="Nhập đầu mục (tùy chọn)"
                            onChange={(event) => update(item.id, { title: event.target.value })}
                          />
                        </label>
                      </div>
                      <ProductContentEditor
                        label={`${label} · Nội dung khối ${index + 1}`}
                        value={item.content || ""}
                        escapedLineBreaks
                        showPreview={false}
                        disabled={disabled}
                        onChange={(content) => update(item.id, { content })}
                      />
                    </fieldset>
                  )}
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
                <img src={preview.image.trim()} alt={preview.title?.trim() || ""} width={1920} height={1280} />
              </div>
            )}
            {preview.showText !== false && (preview.title?.trim() || preview.content?.trim()) && (
              <div className="product-information-media-text">
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
