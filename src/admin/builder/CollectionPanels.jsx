import { SettingGroup, SelectField, StyleTypographyBlock, TypographyControls } from "./ui";
import { SPACE_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE, HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function getCollectionSelectedData(collection, selected) {
  const meta = COLLECTION_FIELD_MAP[selected];
  if (!meta) {
    return { type: "colEmpty", data: null };
  }
  return { type: meta.type, data: collection, meta };
}


export function CollectionSettings({
  selected,
  data,
  collection,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "colEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const meta = data.meta;
  const style =
    collection[meta.group]?.[meta.styleKey] || {};

  return (
    <>
      {meta.textKey && (
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>{meta.label}</label>
            <input
              value={collection[meta.textKey] || ""}
              onChange={(e) =>
                onChange({ [meta.textKey]: e.target.value })
              }
            />
          </div>
        </SettingGroup>
      )}

      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />

      <SettingGroup title="Gợi ý">
        <p className="builder-help" style={{ margin: 0 }}>
          {meta.group === "productCardStyles"
            ? "Kiểu chữ này áp dụng cho TẤT CẢ thẻ sản phẩm. Nội dung từng sản phẩm sửa ở mục Sản phẩm."
            : "Chỉnh chữ và kiểu cho tiêu đề khu vực Collection."}
        </p>
        {meta.sample && (
          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 10,
              border: "1px dashed #ead9e0",
              background:
                meta.styleKey === "button" ? "#d9628a" : "#fffafd",
              color: meta.styleKey === "button" ? "#fff" : undefined,
              fontFamily: style.fontFamily
                ? `"${style.fontFamily}", serif`
                : undefined,
              fontSize: style.fontSize
                ? `${style.fontSize}px`
                : undefined,
              fontWeight: style.fontWeight,
              fontStyle:
                style.italic || style.fontStyle === "italic"
                  ? "italic"
                  : "normal",
              letterSpacing:
                style.letterSpacing != null
                  ? `${style.letterSpacing}px`
                  : undefined,
              lineHeight: style.lineHeight,
              color:
                meta.styleKey === "button"
                  ? style.color || "#fff"
                  : style.color,
            }}
          >
            {meta.sample}
          </div>
        )}
      </SettingGroup>
    </>
  );
}
