import { useId } from "react";
import { purchaseChannelLabels } from "../../lib/commerce";
import { SettingGroup, StyleTypographyBlock } from "./ui";
export default function PurchaseOptionsSettings({ value = {}, onChange }) {
  const id = useId();
  const labels = purchaseChannelLabels(value);
  return <>
    <SettingGroup title="Nút chọn kênh mua hàng">
      <small className="builder-help">Gán link TikTok/Facebook và chọn phương thức thanh toán ở Admin → Sản phẩm → Kênh mua hàng dùng chung.</small>
      {[["heading", "Tiêu đề", "Chọn cách mua hàng"], ["websiteLabel", "Nút đặt trên web", "Đặt hàng ngay"], ["dividerLabel", "Dòng phân cách", "hoặc đặt hàng tại"], ["tiktokLabel", "Nút TikTok", "Tiktok"], ["facebookLabel", "Nút Facebook", "Fb"]].map(([key, label, placeholder]) => <div className="builder-field" key={key}><label htmlFor={`${id}-${key}`}>{label}</label><input id={`${id}-${key}`} maxLength={80} value={value[key] ? labels[key] ?? value[key] : ""} placeholder={placeholder} onChange={(event) => onChange({ [key]: event.target.value, ...(["facebookLabel", "tiktokLabel"].includes(key) ? { [key === "facebookLabel" ? "customFacebookLabel" : "customTiktokLabel"]: true } : {}) })} /></div>)}
    </SettingGroup>
    <SettingGroup title="Màu nền nút mua hàng">
      {[["websiteBackground", "Website", "#b8446d"], ["tiktokBackground", "TikTok", "#171717"], ["facebookBackground", "Facebook", "#0866ff"]].map(([key, label, fallback]) => <div className="builder-field" key={key}><label>{label}</label><input type="color" value={value[key] || fallback} onChange={(event) => onChange({ [key]: event.target.value, ...(["facebookLabel", "tiktokLabel"].includes(key) ? { [key === "facebookLabel" ? "customFacebookLabel" : "customTiktokLabel"]: true } : {}) })} /></div>)}
    </SettingGroup>
    <StyleTypographyBlock style={value} onStyleChange={onChange} title="Kiểu chữ chung nút mua hàng" />
    <StyleTypographyBlock style={value.facebookStyle || {}} onStyleChange={(patch) => onChange({ facebookStyle: { ...value.facebookStyle, ...patch } })} title="Chữ riêng nút Facebook" />
    <StyleTypographyBlock style={value.tiktokStyle || {}} onStyleChange={(patch) => onChange({ tiktokStyle: { ...value.tiktokStyle, ...patch } })} title="Chữ riêng nút TikTok" />
  </>;
}
