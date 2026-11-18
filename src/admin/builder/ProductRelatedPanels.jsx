import { ColorField, SettingGroup, SelectField, StyleTypographyBlock } from "./ui";
import { CollectionSettings } from "./CollectionPanels";
import { SPACE_OPTIONS } from "./options";
import { PRODUCT_DETAIL_COLOR_DEFAULTS } from "../controls/color-defaults";

/** Bộ chỉnh mục "Sản phẩm khác" ở trang chi tiết (tiêu đề, khoảng cách, khung thẻ). */
export default function ProductRelatedSettings({ selected, data, productDetail, onChange, onStyleChange }) {
  /* Tiêu đề "Sản phẩm khác": 1 ô, Enter xuống dòng, đổi màu N chữ cuối */
  if (selected === "relTitle") {
    const style = productDetail.relTitle || {};
    const total = Array.from(style.text || "").filter((ch) => ch !== "\n").length;
    const side = (label, key) => (
      <SelectField
        label={label}
        value={style[key] ?? 0}
        options={SPACE_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>Tiêu đề (nhấn Enter để xuống dòng)</label>
            <textarea
              rows={3}
              value={style.text ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
            />
          </div>
        </SettingGroup>

        <SettingGroup title="Đổi màu chữ cuối">
          <div className="builder-field">
            <label>Số chữ cuối cùng đổi màu (0 = không đổi)</label>
            <input
              type="number"
              min={0}
              max={total}
              value={style.accentCount ?? 0}
              onChange={(e) =>
                onStyleChange({
                  accentCount: Math.min(total, Math.max(0, Number(e.target.value) || 0)),
                })
              }
            />
            <small className="builder-help">
              Tiêu đề hiện có {total} ký tự (tính cả dấu cách, không tính xuống dòng).
            </small>
          </div>
          <ColorField
            label="Màu của các chữ đó"
            value={style.accentColor}
            fallback={PRODUCT_DETAIL_COLOR_DEFAULTS.accentColor}
            onChange={(accentColor) => onStyleChange({ accentColor })}
          />
        </SettingGroup>

        <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />

        <SettingGroup title="Margin / padding trái - phải">
          <div className="builder-field-row">
            {side("Margin trái", "marginLeft")}
            {side("Margin phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {side("Padding trái", "paddingLeft")}
            {side("Padding phải", "paddingRight")}
          </div>
        </SettingGroup>
      </>
    );
  }

  /* Khối tiêu đề / cả khu vực "Sản phẩm khác": chỉnh khoảng cách */
  if (selected === "relHeader" || selected === "relSection") {
    const style = productDetail[selected] || {};
    const GAP_OPTIONS = [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 60, 80, 100, 120, 140, 180, 220];
    const sp = (label, key) => (
      <SelectField
        label={label}
        value={style[key] ?? ""}
        options={GAP_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <SettingGroup title={selected === "relHeader" ? "Khối tiêu đề" : "Cả khu vực Sản phẩm khác"}>
          <small className="builder-help">
            {selected === "relHeader"
              ? "Margin dưới = khoảng cách giữa tiêu đề và các thẻ sản phẩm. Để trống (—) là dùng mặc định."
              : "Margin / padding của cả khu vực Sản phẩm khác. Để trống (—) là dùng mặc định."}
          </small>
        </SettingGroup>
        <SettingGroup title="Margin">
          <div className="builder-field-row">
            {sp("Trên", "marginTop")}
            {sp("Dưới", "marginBottom")}
          </div>
          <div className="builder-field-row">
            {sp("Trái", "marginLeft")}
            {sp("Phải", "marginRight")}
          </div>
        </SettingGroup>
        <SettingGroup title="Padding">
          <div className="builder-field-row">
            {sp("Trên", "paddingTop")}
            {sp("Dưới", "paddingBottom")}
          </div>
          <div className="builder-field-row">
            {sp("Trái", "paddingLeft")}
            {sp("Phải", "paddingRight")}
          </div>
        </SettingGroup>
      </>
    );
  }
  /* Khung thẻ "Sản phẩm khác": dùng lại đúng bảng chỉnh thẻ của Collection */
  if (data.type === "pdRelImage" || selected === "relImage") {
    return (
      <>
        <small className="builder-help" data-spacing="after">
          Chỉ áp dụng cho các thẻ trong mục "Sản phẩm khác" ở trang chi tiết. Thẻ ở trang chủ không bị ảnh
          hưởng.
        </small>
        <CollectionSettings
          selected="cardImage"
          data={{ type: "cardImage", meta: { type: "cardImage" } }}
          collection={{ productCardStyles: { imageLayout: productDetail.relImage || {} } }}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      </>
    );
  }
  return null;
}
