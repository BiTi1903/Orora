import { SettingGroup, StyleTypographyBlock } from "./ui";
import { contactLinks } from "../../lib/contact";

export default function ProductContactSettings({ value = {}, onChange }) {
  return <>
    <SettingGroup title="Nút tư vấn sản phẩm">
      <div className="builder-field"><label>Tên nút tư vấn</label><input maxLength={80} value={value.triggerLabel ?? ""} placeholder="Tư vấn" onChange={(event) => onChange({ triggerLabel: event.target.value })} /></div>
      <small className="builder-help">Để trống số gọi hoặc link Zalo để dùng số liên hệ ở chân trang. Chỉ ghi cấu hình khi bạn bấm Lưu.</small>
      <label className="builder-field"><span><input style={{ width: 18, height: 18, padding: 0, marginRight: 8, verticalAlign: "middle" }} type="checkbox" checked={value.showZalo !== false} onChange={(event) => onChange({ showZalo: event.target.checked })} /> Hiện nút Zalo</span></label>
      <div className="builder-field"><label>Tên nút Zalo</label><input maxLength={80} value={value.zaloLabel ?? ""} placeholder="Tư vấn qua Zalo" onChange={(event) => onChange({ zaloLabel: event.target.value })} /></div>
      <div className="builder-field"><label>Link Zalo riêng (không bắt buộc)</label><input type="url" value={value.zaloUrl ?? ""} placeholder="https://zalo.me/..." onChange={(event) => onChange({ zaloUrl: event.target.value })} />
        {value.zaloUrl?.trim() && !contactLinks({}, "", value).zalo && <small className="builder-help">Dùng link HTTPS có tên miền zalo.me.</small>}
      </div>
      <label className="builder-field"><span><input style={{ width: 18, height: 18, padding: 0, marginRight: 8, verticalAlign: "middle" }} type="checkbox" checked={value.showCall !== false} onChange={(event) => onChange({ showCall: event.target.checked })} /> Hiện nút gọi</span></label>
      <div className="builder-field"><label>Tên nút gọi</label><input maxLength={80} value={value.callLabel ?? ""} placeholder="Gọi tư vấn" onChange={(event) => onChange({ callLabel: event.target.value })} /></div>
      <div className="builder-field"><label>Số điện thoại riêng (không bắt buộc)</label><input type="tel" value={value.phone ?? ""} placeholder="Dùng số ở chân trang" onChange={(event) => onChange({ phone: event.target.value })} /></div>
    </SettingGroup>
    <SettingGroup title="Màu nút tư vấn">
      {[["primaryBackground", "Nền nút Zalo", "#b8446d"], ["primaryColor", "Chữ nút Zalo", "#ffffff"], ["secondaryBackground", "Nền nút gọi", "#ffffff"], ["secondaryColor", "Chữ nút gọi", "#b8446d"]].map(([key, label, fallback]) => <div className="builder-field" key={key}><label>{label}</label><input type="color" value={value[key] || fallback} onChange={(event) => onChange({ [key]: event.target.value })} /></div>)}
    </SettingGroup>
    <StyleTypographyBlock style={value} onStyleChange={onChange} title="Kiểu chữ nút tư vấn" />
  </>;
}
