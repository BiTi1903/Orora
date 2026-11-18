import CheckoutSettings from "./CheckoutSettings";
import { InspectorGroup } from "./Inspector";
import { useId } from "react";
import { purchaseChannelLabels } from "../../lib/commerce";
import { SettingGroup, StyleTypographyBlock, ColorField } from "./ui";
import { PURCHASE_BUTTON_COLOR_DEFAULTS } from "../controls/color-defaults";
export default function PurchaseOptionsSettings({ value = {}, onChange, initialGroup = "subtotal" }) {
  const id = useId();
  const labels = purchaseChannelLabels(value);
  return (
    <>
      <InspectorGroup title="Giá và tạm tính" open={initialGroup === "subtotal"}>
        <SettingGroup title="Giá theo dung tích và số lượng">
          <label>
            <input
              type="checkbox"
              role="switch"
              checked={value.subtotalEnabled !== false}
              onChange={(e) => onChange({ subtotalEnabled: e.target.checked })}
            />
            Hiện tạm tính sau khi chọn dung tích
          </label>
          <details>
            <summary>Nội dung và kiểu chữ tạm tính</summary>
            {[
              ["subtotalLabel", "Tiêu đề", "Tạm tính"],
              ["subtotalNote", "Ghi chú", "Chưa gồm phí giao hàng"],
              ["subtotalQuantityLabel", "Khi số lượng chưa hợp lệ", "Chọn số lượng hợp lệ"],
              ["subtotalContactLabel", "Khi chưa có giá", "Liên hệ để báo giá"],
            ].map(([key, label, fallback]) => (
              <label key={key}>
                {label}
                <input
                  value={value[key] ?? ""}
                  placeholder={fallback}
                  onChange={(e) => onChange({ [key]: e.target.value })}
                />
              </label>
            ))}
            {[
              ["subtotalPadding", "Đệm khung tạm tính (px)", 10, 6, 24],
              ["subtotalRadius", "Bo góc khung tạm tính (px)", 12, 0, 28],
            ].map(([key, label, fallback, min, max]) => (
              <label key={key}>
                {label}
                <input
                  type="number"
                  min={min}
                  max={max}
                  value={value[key] ?? fallback}
                  onChange={(event) => onChange({ [key]: Number(event.target.value) })}
                />
              </label>
            ))}
            <ColorField
              label="Nền khung tạm tính"
              value={value.subtotalBackground || "#fff7fa"}
              onChange={(color) => onChange({ subtotalBackground: color })}
            />
            <ColorField
              label="Viền khung tạm tính"
              value={value.subtotalBorderColor || "#efd7e1"}
              onChange={(color) => onChange({ subtotalBorderColor: color })}
            />
            <StyleTypographyBlock
              title="Nhãn và ghi chú"
              style={value.subtotalLabelStyle || {}}
              onStyleChange={(patch) =>
                onChange({ subtotalLabelStyle: { ...value.subtotalLabelStyle, ...patch } })
              }
            />
            <StyleTypographyBlock
              title="Số tiền tạm tính"
              style={value.subtotalValueStyle || {}}
              onStyleChange={(patch) =>
                onChange({ subtotalValueStyle: { ...value.subtotalValueStyle, ...patch } })
              }
            />
          </details>
        </SettingGroup>
      </InspectorGroup>
      <InspectorGroup title="Nội dung các kênh mua hàng">
        <SettingGroup title="Nút chọn kênh mua hàng">
          <small className="builder-help">
            Gán link TikTok/Facebook và chọn phương thức thanh toán ở Cửa hàng → Kênh mua và thanh toán.
          </small>
          {[
            ["heading", "Tiêu đề", "Chọn cách mua hàng"],
            ["websiteLabel", "Nút đặt trên web", "Đặt hàng ngay"],
            ["dividerLabel", "Dòng phân cách", "hoặc đặt hàng tại"],
            ["tiktokLabel", "Nút TikTok", "Tiktok"],
            ["facebookLabel", "Nút Facebook", "Fb"],
          ].map(([key, label, placeholder]) => (
            <div className="builder-field" key={key}>
              <label htmlFor={`${id}-${key}`}>{label}</label>
              <input
                id={`${id}-${key}`}
                maxLength={80}
                value={value[key] ? (labels[key] ?? value[key]) : ""}
                placeholder={placeholder}
                onChange={(event) =>
                  onChange({
                    [key]: event.target.value,
                    ...(["facebookLabel", "tiktokLabel"].includes(key)
                      ? { [key === "facebookLabel" ? "customFacebookLabel" : "customTiktokLabel"]: true }
                      : {}),
                  })
                }
              />
            </div>
          ))}
        </SettingGroup>
      </InspectorGroup>
      <InspectorGroup title="Form đặt hàng trên website" open={initialGroup === "checkout"}>
        <SettingGroup title="Thanh toán và giao hàng cạnh nút mua">
          <label className="builder-field">Thời gian giao dự kiến<input value={value.deliveryEstimateLabel || ""} onChange={event => onChange({ deliveryEstimateLabel: event.target.value })} /></label>
          <label className="builder-field">Chính sách đổi trả<textarea value={value.returnPolicyLabel || ""} onChange={event => onChange({ returnPolicyLabel: event.target.value })} /></label>
        </SettingGroup>
        <CheckoutSettings value={value} onChange={onChange} />
        <SettingGroup title="Nút xác nhận trong form đặt hàng">
          {[
            ["orderSubmitLabel", "Chữ nút gửi đơn", "Đặt hàng ngay"],
            ["orderBusyLabel", "Chữ khi đang gửi đơn", "Đang gửi đơn hàng…"],
            [
              "orderTimeoutLabel",
              "Thông báo khi chờ quá lâu",
              "Chưa nhận được phản hồi. Bạn có thể thử gửi lại với cùng thông tin hoặc tra cứu đơn hàng để kiểm tra.",
            ],
          ].map(([key, label, placeholder]) => (
            <div className="builder-field" key={key}>
              <label htmlFor={`${id}-${key}`}>{label}</label>
              <input
                id={`${id}-${key}`}
                maxLength={key === "orderTimeoutLabel" ? 240 : 100}
                value={value[key] || ""}
                placeholder={placeholder}
                onChange={(event) => onChange({ [key]: event.target.value })}
              />
            </div>
          ))}
          <small className="builder-help">
            Khi gửi sẽ hiện ba chấm nhỏ cùng màu chữ, giữ đơn không bị gửi lặp. Chỉ báo thành công sau khi máy
            chủ xác nhận.
          </small>
        </SettingGroup>
        <StyleTypographyBlock
          style={value.orderSubmitStyle || {}}
          onStyleChange={(patch) => onChange({ orderSubmitStyle: { ...value.orderSubmitStyle, ...patch } })}
          title="Chữ nút gửi đơn"
        />
        <StyleTypographyBlock
          style={value.loadingStyle || {}}
          onStyleChange={(patch) => onChange({ loadingStyle: { ...value.loadingStyle, ...patch } })}
          title="Chữ khi đang gửi đơn"
        />
      </InspectorGroup>
      <InspectorGroup title="Màu và kiểu chữ các nút">
        <SettingGroup title="Màu nền nút mua hàng">
          {[
            ["websiteBackground", "Website"],
            ["tiktokBackground", "TikTok"],
            ["facebookBackground", "Facebook"],
          ].map(([key, label]) => (
            <ColorField
              key={key}
              label={label}
              value={value[key]}
              fallback={PURCHASE_BUTTON_COLOR_DEFAULTS[key]}
              onChange={(next) => onChange({ [key]: next })}
            />
          ))}
        </SettingGroup>
        <StyleTypographyBlock style={value} onStyleChange={onChange} title="Kiểu chữ chung nút mua hàng" />
        <StyleTypographyBlock
          style={value.facebookStyle || {}}
          onStyleChange={(patch) => onChange({ facebookStyle: { ...value.facebookStyle, ...patch } })}
          title="Chữ riêng nút Facebook"
        />
        <StyleTypographyBlock
          style={value.tiktokStyle || {}}
          onStyleChange={(patch) => onChange({ tiktokStyle: { ...value.tiktokStyle, ...patch } })}
          title="Chữ riêng nút TikTok"
        />
      </InspectorGroup>
    </>
  );
}
