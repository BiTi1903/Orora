import { SettingGroup, StyleTypographyBlock } from "./ui";
export default function PurchaseOptionsSettings({ value = {}, onChange }) {
  return <>
    <SettingGroup title="Nút chọn kênh mua hàng">
      <small className="builder-help">Gán link TikTok/Facebook và chọn phương thức thanh toán ở Admin → Sản phẩm → Kênh mua hàng dùng chung.</small>
      {[["heading", "Tiêu đề", "Chọn cách mua hàng"], ["websiteLabel", "Nút đặt trên web", "Đặt hàng ngay"], ["tiktokLabel", "Nút TikTok", "Đặt tại TikTok"], ["facebookLabel", "Nút Facebook", "Đặt tại Facebook"]].map(([key, label, placeholder]) => <div className="builder-field" key={key}><label>{label}</label><input maxLength={80} value={value[key] ?? ""} placeholder={placeholder} onChange={(event) => onChange({ [key]: event.target.value })} /></div>)}
    </SettingGroup>
    <SettingGroup title="Màu nền nút mua hàng">
      {[["websiteBackground", "Website", "#b8446d"], ["tiktokBackground", "TikTok", "#171717"], ["facebookBackground", "Facebook", "#0866ff"]].map(([key, label, fallback]) => <div className="builder-field" key={key}><label>{label}</label><input type="color" value={value[key] || fallback} onChange={(event) => onChange({ [key]: event.target.value })} /></div>)}
    </SettingGroup>
    <StyleTypographyBlock style={value} onStyleChange={onChange} title="Kiểu chữ nút mua hàng" />
  </>;
}
