import MobileImageSettings from "./MobileImageSettings";
import { SettingGroup, SelectField, StyleTypographyBlock, SpacingControls, ColorField } from "./ui";
import { BUILDER_COLOR_DEFAULTS } from "../controls/color-defaults";

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

  // Khung ảnh product card
  if (meta.type === "cardImage" || selected === "cardImage") {
    const layout =
      collection.productCardStyles?.imageLayout || {};
    return (
      <>
        <SettingGroup title="Thẻ sản phẩm (ảnh + thông tin)">
          <small className="builder-help">
            Ngang / margin / padding áp dụng cả thẻ — ảnh và thông tin đi cùng.
            Chiều dọc chỉ đổi khung ảnh phía trên.
          </small>
        </SettingGroup>

        <MobileImageSettings layout={layout} onChange={onStyleChange} />
        <SettingGroup title="Kích thước desktop">
          <SelectField
            label="Chiều ngang cả thẻ"
            value={layout.widthPercent ?? 100}
            options={[60, 70, 75, 80, 85, 90, 95, 100]}
            suffix="%"
            onChange={(value) =>
              onStyleChange({ widthPercent: Number(value) })
            }
          />
          <SelectField
            label="Chiều dọc khung ảnh"
            value={layout.height ?? 0}
            options={[0, 220, 260, 280, 300, 320, 360, 400, 440, 480, 520]}
            suffix="px"
            onChange={(value) => onStyleChange({ height: Number(value) })}
          />
          <small className="builder-help" style={{ display: "block", marginTop: -6 }}>
            Chiều dọc = 0 → dùng tỷ lệ khung. Thông tin sản phẩm luôn nằm dưới ảnh.
          </small>
          <SelectField
            label="Tỷ lệ khung ảnh"
            value={layout.aspectRatio ?? "4 / 5"}
            options={["1 / 1", "3 / 4", "4 / 5", "2 / 3", "3 / 5", "16 / 9"]}
            onChange={(value) => onStyleChange({ aspectRatio: value })}
          />
          <SelectField
            label="Cách cắt ảnh"
            value={layout.objectFit ?? "cover"}
            options={["cover", "contain", "fill"]}
            onChange={(value) => onStyleChange({ objectFit: value })}
          />
        </SettingGroup>

        <SettingGroup title="Bo góc & viền">
          <SelectField
            label="Bo góc"
            value={layout.radius ?? 20}
            options={[0, 8, 12, 16, 20, 24, 28, 32, 40, 48]}
            suffix="px"
            onChange={(value) => onStyleChange({ radius: Number(value) })}
          />
          <SelectField
            label="Độ dày viền"
            value={layout.borderWidth ?? 0}
            options={[0, 1, 2, 3, 4, 5, 6, 8]}
            suffix="px"
            onChange={(value) =>
              onStyleChange({ borderWidth: Number(value) })
            }
          />
          <ColorField
            label="Màu viền"
            value={layout.borderColor}
            fallback={BUILDER_COLOR_DEFAULTS.collectionBorder}
            onChange={(borderColor) => onStyleChange({ borderColor })}
          />
        </SettingGroup>

        <SpacingControls style={layout} onChange={onStyleChange} kinds={["padding","margin"]}/>

      </>
    );
  }

  const style =
    collection[meta.group]?.[meta.styleKey] || {};

  return (
    <>
      {meta.textKey && (
        <SettingGroup title="Nội dung">
          {meta.group === "collectionStyles" && meta.styleKey === "label" && (
            <label className="admin-check">
              <input
                type="checkbox"
                role="switch"
                checked={style.enabled === true}
                onChange={(e) => onStyleChange({ enabled: e.target.checked })}
              />
              Hiển thị nhãn nhỏ trên website
            </label>
          )}
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

      {meta.styleKey === "button" && <SettingGroup title="Nội dung nút"><div className="builder-field"><label>Chữ trên nút</label><input value={style.text ?? ""} placeholder="Xem chi tiết" onChange={event=>onStyleChange({text:event.target.value})}/></div></SettingGroup>}
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
