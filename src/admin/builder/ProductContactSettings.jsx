import { SettingGroup, StyleTypographyBlock, ColorField } from "./ui";
import { PRODUCT_CONTACT_COLOR_DEFAULTS } from "../controls/color-defaults";
import { contactLinks } from "../../lib/contact";

export default function ProductContactSettings({ value = {}, onChange }) {
  return (
    <>
      <SettingGroup title="Nút tư vấn sản phẩm">
        <label className="builder-field">
          <input
            type="checkbox"
            role="switch"
            checked={value.showTrigger === true}
            onChange={(event) => onChange({ showTrigger: event.target.checked })}
          />{" "}
          Hiện nút Tư vấn trên trang sản phẩm
        </label>
        <div className="builder-field">
          <label>Tên nút tư vấn</label>
          <input
            maxLength={80}
            value={value.triggerLabel ?? ""}
            placeholder="Tư vấn"
            onChange={(event) => onChange({ triggerLabel: event.target.value })}
          />
        </div>
        <small className="builder-help">
          Để trống số gọi hoặc link Zalo để dùng số liên hệ ở chân trang. Chỉ ghi cấu hình khi bạn bấm Lưu.
        </small>
        <label className="builder-field">
          <input
            type="checkbox"
            role="switch"
            checked={value.showZalo !== false}
            onChange={(event) => onChange({ showZalo: event.target.checked })}
          />{" "}
          Hiện nút Zalo
        </label>
        <div className="builder-field">
          <label>Tên nút Zalo</label>
          <input
            maxLength={80}
            value={value.zaloLabel ?? ""}
            placeholder="Tư vấn qua Zalo"
            onChange={(event) => onChange({ zaloLabel: event.target.value })}
          />
        </div>
        <div className="builder-field">
          <label>Link Zalo riêng (không bắt buộc)</label>
          <input
            type="url"
            value={value.zaloUrl ?? ""}
            placeholder="https://zalo.me/..."
            onChange={(event) => onChange({ zaloUrl: event.target.value })}
          />
          {value.zaloUrl?.trim() && !contactLinks({}, "", value).zalo && (
            <small className="builder-help">Dùng link HTTPS có tên miền zalo.me.</small>
          )}
        </div>
        <label className="builder-field">
          <input
            type="checkbox"
            role="switch"
            checked={value.showCall !== false}
            onChange={(event) => onChange({ showCall: event.target.checked })}
          />{" "}
          Hiện nút gọi
        </label>
        <div className="builder-field">
          <label>Tên nút gọi</label>
          <input
            maxLength={80}
            value={value.callLabel ?? ""}
            placeholder="Gọi tư vấn"
            onChange={(event) => onChange({ callLabel: event.target.value })}
          />
        </div>
        <div className="builder-field">
          <label>Số điện thoại riêng (không bắt buộc)</label>
          <input
            type="tel"
            value={value.phone ?? ""}
            placeholder="Dùng số ở chân trang"
            onChange={(event) => onChange({ phone: event.target.value })}
          />
        </div>
      </SettingGroup>
      <SettingGroup title="Màu nút tư vấn">
        {[
          ["primaryBackground", "Nền nút Zalo"],
          ["primaryColor", "Chữ nút Zalo"],
          ["secondaryBackground", "Nền nút gọi"],
          ["secondaryColor", "Chữ nút gọi"],
        ].map(([key, label]) => (
          <ColorField
            key={key}
            label={label}
            value={value[key]}
            fallback={PRODUCT_CONTACT_COLOR_DEFAULTS[key]}
            onChange={(next) => onChange({ [key]: next })}
          />
        ))}
      </SettingGroup>
      <StyleTypographyBlock style={value} onStyleChange={onChange} title="Kiểu chữ nút tư vấn" />
    </>
  );
}
