import { SettingGroup, SelectField, StyleTypographyBlock, TypographyControls } from "./ui";
import { SPACE_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE, HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function getReviewsSelectedData(reviews, selected) {
  if (selected?.startsWith("revCard-")) {
    const index = Number(selected.replace("revCard-", ""));
    return {
      type: "revCard",
      data: reviews,
      meta: { index, label: `Đánh giá ${index + 1}` },
    };
  }
  const meta = REVIEWS_TEXT_MAP[selected];
  if (!meta) return { type: "revEmpty", data: null };
  return { type: "revText", data: reviews, meta };
}


export function ReviewsSettings({
  selected,
  data,
  reviews,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "revEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const styles = reviews.testimonialsStyles || {};

  if (data.type === "revText") {
    const { key, label, styleKey } = data.meta;
    return (
      <>
        <SettingGroup title={label}>
          <div className="builder-field">
            <label>Nội dung</label>
            <input
              value={reviews[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </div>
        </SettingGroup>
        <StyleTypographyBlock
          style={styles[styleKey] || {}}
          onStyleChange={onStyleChange}
        />
      </>
    );
  }

  if (data.type === "revCard") {
    const index = data.meta.index;
    const item = reviews.reviews?.[index] || {
      name: "",
      text: "",
      image: "",
    };

    return (
      <>
        <SettingGroup title={`Đánh giá ${index + 1}`}>
          <div className="builder-field">
            <label>Tên khách hàng</label>
            <input
              value={item.name || ""}
              onChange={(e) =>
                onChange({
                  _reviewIndex: index,
                  _reviewItem: { name: e.target.value },
                })
              }
            />
          </div>

          <div className="builder-field">
            <label>Nội dung</label>
            <textarea
              rows={4}
              value={item.text || ""}
              onChange={(e) =>
                onChange({
                  _reviewIndex: index,
                  _reviewItem: { text: e.target.value },
                })
              }
            />
          </div>

          <div className="builder-field">
            <label>Ảnh khách hàng (URL)</label>
            <input
              value={item.image || ""}
              onChange={(e) =>
                onChange({
                  _reviewIndex: index,
                  _reviewItem: { image: e.target.value },
                })
              }
              placeholder="Dán link ảnh hoặc /avatar.jpg"
            />
            <small className="builder-help">
              Ảnh tròn nhỏ cạnh tên. Có thể tải lên ở Form cũ → Cảm nhận.
            </small>
          </div>

          {item.image && (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #f5d6e0",
                backgroundImage: `url("${item.image}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
        </SettingGroup>

        <StyleTypographyBlock
          style={styles.reviewText || {}}
          onStyleChange={(patch) =>
            onStyleChange({ ...patch, _styleKey: "reviewText" })
          }
        />

        <SettingGroup title="Typography — Tên khách">
          <TypographyControls
            style={{
              fontFamily: toBareFontFamily(styles.reviewName?.fontFamily),
              fontSize: styles.reviewName?.fontSize ?? "",
              fontWeight: styles.reviewName?.fontWeight ?? "",
              color: styles.reviewName?.color || "",
              letterSpacing: styles.reviewName?.letterSpacing ?? "",
              lineHeight: styles.reviewName?.lineHeight ?? "",
              italic:
                styles.reviewName?.italic ||
                styles.reviewName?.fontStyle === "italic",
              textAlign: styles.reviewName?.textAlign || "left",
              marginTop: styles.reviewName?.marginTop ?? 0,
              marginBottom: styles.reviewName?.marginBottom ?? 0,
            }}
            onChange={(patch) => {
              const next = { ...patch, _styleKey: "reviewName" };
              if ("fontFamily" in patch) {
                next.fontFamily = toFullFontFamily(patch.fontFamily);
              }
              if ("italic" in patch) {
                next.fontStyle = patch.italic ? "italic" : "normal";
              }
              onStyleChange(next);
            }}
          />
        </SettingGroup>

        <SettingGroup title="Danh sách">
          <button
            type="button"
            className="admin-btn"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={() =>
              onChange({
                _reviewsList: [
                  ...(reviews.reviews || []),
                  { name: "", text: "", image: "" },
                ],
              })
            }
          >
            + Thêm đánh giá
          </button>

          {(reviews.reviews || []).length > 1 && (
            <button
              type="button"
              className="admin-btn danger"
              style={{ width: "100%" }}
              onClick={() => {
                const next = (reviews.reviews || []).filter(
                  (_, i) => i !== index
                );
                onChange({ _reviewsList: next });
              }}
            >
              Xóa đánh giá này
            </button>
          )}
        </SettingGroup>
      </>
    );
  }

  return null;
}
