import MobileImageSettings from "./MobileImageSettings";
import { ColorField, SettingGroup, SelectField } from "./ui";
import { SPACE_OPTIONS } from "./options";
import { PRODUCT_DETAIL_COLOR_DEFAULTS } from "../controls/color-defaults";

/** Bộ chỉnh khối ảnh chính và hàng ảnh phụ ở trang chi tiết sản phẩm. */
export default function ProductImageSettings({ selected, data, productDetail, onStyleChange }) {
  if (data.type === "pdImage" || selected === "pdImage") {
    const layout = productDetail.imageLayout || {};
    const space = (label, key) => (
      <SelectField
        label={label}
        value={layout[key] ?? 0}
        options={SPACE_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <SettingGroup title="Khối ảnh (chính + phụ)">
          <small className="builder-help">
            Ngang / margin áp dụng cả khối (ảnh chính + ảnh phụ đi cùng). Chiều dọc / padding / viền chỉ khung
            ảnh chính. Click hàng ảnh phụ để chỉnh riêng.
          </small>
        </SettingGroup>

        <MobileImageSettings layout={layout} onChange={onStyleChange} />
        <SettingGroup title="Kích thước desktop">
          <SelectField
            label="Chiều ngang cả khối"
            value={layout.widthPercent ?? 100}
            options={[40, 50, 60, 70, 75, 80, 85, 90, 95, 100]}
            suffix="%"
            onChange={(value) => onStyleChange({ widthPercent: Number(value) })}
          />
          <SelectField
            label="Chiều ngang tối đa"
            value={layout.maxWidth ?? 420}
            options={[280, 320, 360, 400, 420, 460, 500, 560, 620, 700, 0]}
            suffix="px"
            onChange={(value) => onStyleChange({ maxWidth: Number(value) })}
          />
          <small className="builder-help" data-spacing="tight">
            Tối đa = 0 → không giới hạn px (chỉ theo %).
          </small>
          <SelectField
            label="Chiều dọc khung ảnh chính"
            value={layout.height ?? 0}
            options={[0, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 720]}
            suffix="px"
            onChange={(value) => onStyleChange({ height: Number(value) })}
          />
          <small className="builder-help" data-spacing="tight">
            Chiều dọc = 0 → dùng tỷ lệ khung. Ảnh phụ nằm dưới, đi theo khối.
          </small>
          <SelectField
            label="Tỷ lệ khung ảnh chính"
            value={layout.aspectRatio ?? "3 / 4"}
            options={["1 / 1", "3 / 4", "4 / 5", "2 / 3", "3 / 5", "16 / 9"]}
            onChange={(value) => onStyleChange({ aspectRatio: value })}
          />
          <SelectField
            label="Cách cắt ảnh"
            value={layout.objectFit ?? "cover"}
            options={["cover", "contain", "fill"]}
            onChange={(value) => onStyleChange({ objectFit: value })}
          />
          <SelectField
            label="Khoảng cách ảnh chính / ảnh phụ"
            value={layout.gap ?? 14}
            options={[0, 6, 8, 10, 12, 14, 16, 20, 24, 32]}
            suffix="px"
            onChange={(value) => onStyleChange({ gap: Number(value) })}
          />
        </SettingGroup>

        <SettingGroup title="Bo góc & viền">
          <SelectField
            label="Bo góc"
            value={layout.radius ?? 28}
            options={[0, 8, 12, 16, 20, 24, 28, 32, 40, 48, 60]}
            suffix="px"
            onChange={(value) => onStyleChange({ radius: Number(value) })}
          />
          <SelectField
            label="Độ dày viền"
            value={layout.borderWidth ?? 6}
            options={[0, 2, 4, 5, 6, 8, 10, 12, 16]}
            suffix="px"
            onChange={(value) => onStyleChange({ borderWidth: Number(value) })}
          />
          <ColorField
            label="Màu viền"
            value={layout.borderColor}
            fallback={PRODUCT_DETAIL_COLOR_DEFAULTS.borderColor}
            onChange={(borderColor) => onStyleChange({ borderColor })}
          />
        </SettingGroup>

        <SettingGroup title="Padding khung ảnh">
          <div className="builder-field-row">
            {space("Trên", "paddingTop")}
            {space("Phải", "paddingRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "paddingBottom")}
            {space("Trái", "paddingLeft")}
          </div>
        </SettingGroup>

        <SettingGroup title="Margin cả khối (chính + phụ)">
          <div className="builder-field-row">
            {space("Trên", "marginTop")}
            {space("Phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "marginBottom")}
            {space("Trái", "marginLeft")}
          </div>
        </SettingGroup>
      </>
    );
  }

  if (data.type === "pdThumbs" || selected === "pdThumbs") {
    const layout = productDetail.thumbsLayout || {};
    const space = (label, key) => (
      <SelectField
        label={label}
        value={layout[key] ?? 0}
        options={SPACE_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <SettingGroup title="Ảnh phụ">
          <small className="builder-help">
            Khung riêng cho hàng ảnh phụ (thumbnail). Bấm từng ảnh vẫn đổi ảnh chính.
          </small>
        </SettingGroup>

        <SettingGroup title="Kích thước & khoảng cách">
          <SelectField
            label="Chiều cao mỗi ảnh"
            value={layout.height ?? 0}
            options={[0, 44, 48, 56, 64, 72, 80, 96, 110, 120, 140, 160]}
            suffix="px"
            onChange={(value) => onStyleChange({ height: Number(value) })}
          />
          <small className="builder-help" data-spacing="tight">
            0 = ảnh vuông 56 px, hoặc 48 px trên màn hình nhỏ.
          </small>
          <SelectField
            label="Khoảng cách giữa 2 ảnh"
            value={layout.gap ?? 10}
            options={[0, 4, 6, 8, 10, 12, 14, 16, 20, 24]}
            suffix="px"
            onChange={(value) => onStyleChange({ gap: Number(value) })}
          />
        </SettingGroup>

        <SettingGroup title="Bo góc & viền">
          <SelectField
            label="Bo góc"
            value={layout.radius ?? 14}
            options={[0, 6, 8, 10, 12, 14, 16, 20, 24, 28]}
            suffix="px"
            onChange={(value) => onStyleChange({ radius: Number(value) })}
          />
          <SelectField
            label="Độ dày viền"
            value={layout.borderWidth ?? 2}
            options={[0, 1, 2, 3, 4, 5, 6, 8]}
            suffix="px"
            onChange={(value) => onStyleChange({ borderWidth: Number(value) })}
          />
          <ColorField
            label="Màu viền"
            value={layout.borderColor}
            fallback={PRODUCT_DETAIL_COLOR_DEFAULTS.borderColor}
            onChange={(borderColor) => onStyleChange({ borderColor })}
          />
          <ColorField
            label="Màu viền khi chọn"
            value={layout.activeBorderColor}
            fallback={PRODUCT_DETAIL_COLOR_DEFAULTS.activeBorderColor}
            onChange={(activeBorderColor) => onStyleChange({ activeBorderColor })}
          />
        </SettingGroup>

        <SettingGroup title="Padding hàng ảnh phụ">
          <div className="builder-field-row">
            {space("Trên", "paddingTop")}
            {space("Phải", "paddingRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "paddingBottom")}
            {space("Trái", "paddingLeft")}
          </div>
        </SettingGroup>

        <SettingGroup title="Margin hàng ảnh phụ">
          <div className="builder-field-row">
            {space("Trên", "marginTop")}
            {space("Phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {space("Dưới", "marginBottom")}
            {space("Trái", "marginLeft")}
          </div>
        </SettingGroup>
      </>
    );
  }
  return null;
}
