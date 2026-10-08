import { SettingGroup, SelectField, StyleTypographyBlock, TypographyControls } from "./ui";
import { SPACE_OPTIONS, FONT_OPTIONS, SIZE_OPTIONS, toFullFontFamily, toBareFontFamily } from "./options";
import { DEFAULT_ABOUT, DEFAULT_STYLE, HERO_FIELD_MAP, COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP } from "./registry";

export function getFooterSelectedData(footer, selected) {
  const meta = FOOTER_FIELD_MAP[selected];
  if (!meta) return { type: "ftEmpty", data: null };
  return { type: "ftText", data: footer, meta };
}


export function FooterSettings({ data, footer, onChange, onStyleChange }) {
  if (!data || data.type === "ftEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const { key, label, rows, styleKey } = data.meta;
  const style = footer.footerStyles?.[styleKey] || {};

  return (
    <>
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Nội dung</label>
          {rows ? (
            <textarea
              rows={rows}
              value={footer[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          ) : (
            <input
              value={footer[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          )}
        </div>
      </SettingGroup>
      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
    </>
  );
}
