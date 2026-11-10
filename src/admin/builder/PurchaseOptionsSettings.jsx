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
    <SettingGroup title="Nút xác nhận trong form đặt hàng">
      {[["orderSubmitLabel","Chữ nút gửi đơn","Đặt hàng ngay"],["orderBusyLabel","Chữ khi đang gửi đơn","Đang gửi đơn hàng…"],["orderTimeoutLabel","Thông báo khi chờ quá lâu","Chưa nhận được phản hồi. Bạn có thể thử gửi lại với cùng thông tin hoặc tra cứu đơn hàng để kiểm tra."]].map(([key,label,placeholder])=><div className="builder-field" key={key}><label htmlFor={`${id}-${key}`}>{label}</label><input id={`${id}-${key}`} maxLength={key==="orderTimeoutLabel"?240:100} value={value[key]||""} placeholder={placeholder} onChange={event=>onChange({[key]:event.target.value})}/></div>)}
      <small className="builder-help">Khi gửi sẽ hiện ba chấm nhỏ cùng màu chữ, giữ đơn không bị gửi lặp. Chỉ báo thành công sau khi máy chủ xác nhận.</small>
    </SettingGroup>
    <StyleTypographyBlock style={value.orderSubmitStyle || {}} onStyleChange={patch=>onChange({orderSubmitStyle:{...value.orderSubmitStyle,...patch}})} title="Chữ nút gửi đơn" />
    <StyleTypographyBlock style={value.loadingStyle || {}} onStyleChange={patch=>onChange({loadingStyle:{...value.loadingStyle,...patch}})} title="Chữ khi đang gửi đơn" />
    <SettingGroup title="Màu nền nút mua hàng">
      {[["websiteBackground", "Website", "#b8446d"], ["tiktokBackground", "TikTok", "#171717"], ["facebookBackground", "Facebook", "#0866ff"]].map(([key, label, fallback]) => <div className="builder-field" key={key}><label>{label}</label><input type="color" value={value[key] || fallback} onChange={(event) => onChange({ [key]: event.target.value, ...(["facebookLabel", "tiktokLabel"].includes(key) ? { [key === "facebookLabel" ? "customFacebookLabel" : "customTiktokLabel"]: true } : {}) })} /></div>)}
    </SettingGroup>
    <StyleTypographyBlock style={value} onStyleChange={onChange} title="Kiểu chữ chung nút mua hàng" />
    <StyleTypographyBlock style={value.facebookStyle || {}} onStyleChange={(patch) => onChange({ facebookStyle: { ...value.facebookStyle, ...patch } })} title="Chữ riêng nút Facebook" />
    <StyleTypographyBlock style={value.tiktokStyle || {}} onStyleChange={(patch) => onChange({ tiktokStyle: { ...value.tiktokStyle, ...patch } })} title="Chữ riêng nút TikTok" />
  </>;
}
