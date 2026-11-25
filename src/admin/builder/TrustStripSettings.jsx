import { ColorField, SelectField, SettingGroup, StyleTypographyBlock } from "./ui";

const LIMIT_OPTIONS = [
  { value: 1, label: "1 chip" },
  { value: 2, label: "2 chip" },
  { value: 3, label: "3 chip" },
  { value: 4, label: "4 chip" },
];

const ALIGN_OPTIONS = [
  { value: "flex-start", label: "Căn trái" },
  { value: "center", label: "Căn giữa" },
  { value: "flex-end", label: "Căn phải" },
];

const RADIUS_OPTIONS = [0, 4, 6, 8, 10, 12, 16, 20, 999];
const PAD_Y_OPTIONS = [2, 4, 6, 8, 10, 12];
const PAD_X_OPTIONS = [6, 8, 10, 12, 14, 16, 20];
const GAP_OPTIONS = [4, 6, 8, 10, 12, 16];

export default function TrustStripSettings({ value = {}, onChange }) {
  const s = value || {};
  const set = (patch) => onChange(patch);

  return (
    <>
      <SettingGroup title="Hiển thị & Nội dung — Dải chip Cam kết">
        <label className="admin-check">
          <input
            type="checkbox"
            role="switch"
            checked={s.enabled !== false}
            onChange={(e) => set({ enabled: e.target.checked })}
          />
          Hiển thị dải chip Cam kết dưới nút mua
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            role="switch"
            checked={s.showIcon !== false}
            onChange={(e) => set({ showIcon: e.target.checked })}
          />
          Hiện biểu tượng dấu tích ✓
        </label>
        <label className="admin-check">
          <input
            type="checkbox"
            role="switch"
            checked={s.showDivider !== false}
            onChange={(e) => set({ showDivider: e.target.checked })}
          />
          Hiện đường kẻ ngăn phía trên
        </label>
        <SelectField
          label="Số chip hiển thị tối đa"
          value={Number(s.limit) || 3}
          options={LIMIT_OPTIONS}
          onChange={(val) => set({ limit: Number(val) })}
        />
        <label className="builder-field">
          Nội dung chip tùy chỉnh (mỗi dòng 1 mục)
          <textarea
            rows={3}
            maxLength={400}
            value={s.customText ?? ""}
            placeholder={"Để trống để lấy tự động từ Cam kết & chính sách\nVD:\nFREESHIP\n100% CHÍNH HÃNG\nĐỔI TRẢ"}
            onChange={(e) => set({ customText: e.target.value })}
          />
        </label>
      </SettingGroup>

      <SettingGroup title="Khung & màu sắc chip">
        <SelectField
          label="Căn lề dải chip"
          value={s.align || "flex-start"}
          options={ALIGN_OPTIONS}
          onChange={(val) => set({ align: val })}
        />
        <ColorField
          label="Màu nền chip"
          value={s.chipBackground}
          fallback="#fdf7f9"
          onChange={(color) => set({ chipBackground: color })}
        />
        <ColorField
          label="Màu viền chip"
          value={s.chipBorderColor}
          fallback="#ecd8e1"
          onChange={(color) => set({ chipBorderColor: color })}
        />
        <ColorField
          label="Màu dấu tích ✓"
          value={s.iconColor}
          fallback="#b8446d"
          onChange={(color) => set({ iconColor: color })}
        />
        {s.showDivider !== false && (
          <ColorField
            label="Màu đường kẻ ngăn"
            value={s.dividerColor}
            fallback="#ecd8e1"
            onChange={(color) => set({ dividerColor: color })}
          />
        )}
        <div className="builder-field-row">
          <SelectField
            label="Bo góc chip"
            value={s.chipRadius ?? 999}
            options={RADIUS_OPTIONS}
            suffix="px"
            onChange={(val) => set({ chipRadius: Number(val) })}
          />
          <SelectField
            label="Khoảng cách chip"
            value={s.gap ?? 8}
            options={GAP_OPTIONS}
            suffix="px"
            onChange={(val) => set({ gap: Number(val) })}
          />
        </div>
        <div className="builder-field-row">
          <SelectField
            label="Đệm dọc chip"
            value={s.paddingY ?? 6}
            options={PAD_Y_OPTIONS}
            suffix="px"
            onChange={(val) => set({ paddingY: Number(val) })}
          />
          <SelectField
            label="Đệm ngang chip"
            value={s.paddingX ?? 12}
            options={PAD_X_OPTIONS}
            suffix="px"
            onChange={(val) => set({ paddingX: Number(val) })}
          />
        </div>
      </SettingGroup>

      <StyleTypographyBlock
        title="Kiểu chữ chip Cam kết"
        style={s.textStyle || {}}
        onStyleChange={(patch) => set({ textStyle: { ...(s.textStyle || {}), ...patch } })}
      />
    </>
  );
}
