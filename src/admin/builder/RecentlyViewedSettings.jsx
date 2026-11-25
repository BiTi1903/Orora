import { ColorField, SelectField, SettingGroup, StyleTypographyBlock } from "./ui";

const LIMIT_OPTIONS = [
  { value: 2, label: "2 sản phẩm" },
  { value: 3, label: "3 sản phẩm" },
  { value: 4, label: "4 sản phẩm" },
];

const RADIUS_OPTIONS = [0, 6, 8, 10, 12, 14, 16, 20, 24];
const PAD_OPTIONS = [0, 8, 12, 16, 20, 24, 28, 32];
const GAP_OPTIONS = [8, 10, 12, 14, 16, 20, 24];

export default function RecentlyViewedSettings({ value = {}, onChange }) {
  const s = value || {};
  const set = (patch) => onChange(patch);
  const setStyle = (key) => (patch) => set({ [key]: { ...(s[key] || {}), ...patch } });

  return (
    <>
      <SettingGroup title="Hiển thị & Nội dung — Sản phẩm vừa xem">
        <label className="admin-check">
          <input
            type="checkbox"
            role="switch"
            checked={s.enabled !== false}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          Hiển thị mục Sản phẩm vừa xem
        </label>
        <label className="builder-field">
          Nhãn nhỏ phía trên
          <input
            maxLength={80}
            value={s.eyebrow ?? ""}
            placeholder="GỢI Ý CHO BẠN"
            onChange={(e) => set({ eyebrow: e.target.value })}
          />
        </label>
        <label className="builder-field">
          Tiêu đề mục
          <input
            maxLength={120}
            value={s.title ?? ""}
            placeholder="Sản phẩm vừa xem"
            onChange={(e) => set({ title: e.target.value })}
          />
        </label>
        <SelectField
          label="Số sản phẩm hiển thị tối đa"
          value={Number(s.limit) || 4}
          options={LIMIT_OPTIONS}
          onChange={(val) => set({ limit: Number(val) })}
        />
      </SettingGroup>

      <SettingGroup title="Khung & thẻ sản phẩm">
        <ColorField
          label="Màu nền khung lớn"
          value={s.background}
          fallback="#ffffff"
          onChange={(color) => set({ background: color })}
        />
        <ColorField
          label="Màu viền khung lớn"
          value={s.borderColor}
          fallback="#ecd8e1"
          onChange={(color) => set({ borderColor: color })}
        />
        <div className="builder-field-row">
          <SelectField
            label="Bo góc khung"
            value={s.borderRadius ?? 16}
            options={RADIUS_OPTIONS}
            suffix="px"
            onChange={(val) => set({ borderRadius: Number(val) })}
          />
          <SelectField
            label="Đệm trong khung"
            value={s.padding ?? 24}
            options={PAD_OPTIONS}
            suffix="px"
            onChange={(val) => set({ padding: Number(val) })}
          />
        </div>
        <SelectField
          label="Khoảng cách giữa các thẻ"
          value={s.gap ?? 14}
          options={GAP_OPTIONS}
          suffix="px"
          onChange={(val) => set({ gap: Number(val) })}
        />
        <ColorField
          label="Màu nền từng thẻ"
          value={s.cardBackground}
          fallback="#ffffff"
          onChange={(color) => set({ cardBackground: color })}
        />
        <ColorField
          label="Màu viền từng thẻ"
          value={s.cardBorderColor}
          fallback="#ecd8e1"
          onChange={(color) => set({ cardBorderColor: color })}
        />
        <div className="builder-field-row">
          <SelectField
            label="Bo góc thẻ"
            value={s.cardRadius ?? 14}
            options={RADIUS_OPTIONS}
            suffix="px"
            onChange={(val) => set({ cardRadius: Number(val) })}
          />
          <SelectField
            label="Bo góc ảnh nhỏ"
            value={s.thumbRadius ?? 10}
            options={RADIUS_OPTIONS}
            suffix="px"
            onChange={(val) => set({ thumbRadius: Number(val) })}
          />
        </div>
      </SettingGroup>

      <StyleTypographyBlock
        title="Kiểu chữ nhãn nhỏ"
        style={s.eyebrowStyle || {}}
        onStyleChange={setStyle("eyebrowStyle")}
      />
      <StyleTypographyBlock
        title="Kiểu chữ tiêu đề mục"
        style={s.titleStyle || {}}
        onStyleChange={setStyle("titleStyle")}
      />
      <StyleTypographyBlock
        title="Kiểu chữ tên sản phẩm"
        style={s.nameStyle || {}}
        onStyleChange={setStyle("nameStyle")}
      />
      <StyleTypographyBlock
        title="Kiểu chữ giá sản phẩm"
        style={s.priceStyle || {}}
        onStyleChange={setStyle("priceStyle")}
      />
    </>
  );
}
