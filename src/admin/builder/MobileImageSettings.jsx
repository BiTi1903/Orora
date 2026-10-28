import { SettingGroup, SelectField } from "./ui";

export default function MobileImageSettings({ layout, onChange }) {
  return (
    <SettingGroup title="Khung ảnh riêng trên mobile">
      <small className="builder-help">Chỉ áp dụng màn hình ≤768px. Desktop giữ thiết lập ở phần Kích thước desktop. Chuyển preview sang Mobile để xem.</small>
      <SelectField label="Tỷ lệ ảnh mobile" value={layout.mobileAspectRatio ?? "1 / 1"} options={["1 / 1", "3 / 4", "4 / 5", "2 / 3", "16 / 9"]} onChange={(value) => onChange({ mobileAspectRatio: value })} />
      <SelectField label="Chiều cao ảnh mobile" value={layout.mobileHeight ?? 0} options={[0, 120, 160, 180, 200, 240, 280, 320, 360, 400, 480]} suffix="px" onChange={(value) => onChange({ mobileHeight: Number(value) })} />
      <small className="builder-help">Chiều cao = 0 dùng tỷ lệ. Chiều cao cố định sẽ ưu tiên hơn tỷ lệ.</small>
      <SelectField label="Bo góc mobile" value={layout.mobileRadius ?? layout.radius ?? 16} options={[0, 8, 12, 16, 20, 24, 32, 40]} suffix="px" onChange={(value) => onChange({ mobileRadius: Number(value) })} />
      <SelectField label="Cách hiển thị ảnh mobile" value={layout.mobileObjectFit ?? layout.objectFit ?? "cover"} options={["cover", "contain", "fill"]} onChange={(value) => onChange({ mobileObjectFit: value })} />
    </SettingGroup>
  );
}
