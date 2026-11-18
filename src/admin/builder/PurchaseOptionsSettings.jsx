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
      <InspectorGroup title="Khối Mua ngay kính lỏng" open={initialGroup === "subtotal"}>
        <SettingGroup title="Hiệu ứng kính lỏng và hiển thị giá">
          <small className="builder-help">
            Mặc định đồng bộ chất liệu kính lỏng với thanh điều hướng dưới (MobileShopNav). Có thể tùy chỉnh riêng độ trong suốt, độ mờ nền, bo góc và màu khung bên dưới.
          </small>
          {[
            ["quickBuyOpacity", "Độ đục nền kính (%)", 74, 45, 95],
            ["quickBuyBlur", "Độ mờ kính sau nền (px)", 20, 6, 32],
            ["subtotalRadius", "Bo góc khung kính (px)", 22, 12, 32],
          ].map(([key, label, fallback, min, max]) => (
            <label className="builder-field" key={key}>
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
            label="Màu nền kính Mua ngay"
            value={value.subtotalBackground || "#fffafc"}
            onChange={(color) => onChange({ subtotalBackground: color })}
          />
          <ColorField
            label="Màu ánh viền kính"
            value={value.subtotalBorderColor || "#ffffff"}
            onChange={(color) => onChange({ subtotalBorderColor: color })}
          />
          <StyleTypographyBlock
            title="Kiểu chữ dòng dung tích & số lượng"
            style={value.subtotalLabelStyle || {}}
            onStyleChange={(patch) =>
              onChange({ subtotalLabelStyle: { ...value.subtotalLabelStyle, ...patch } })
            }
          />
          <StyleTypographyBlock
            title="Kiểu chữ tổng giá trên thanh Mua ngay"
            style={value.subtotalValueStyle || {}}
            onStyleChange={(patch) =>
              onChange({ subtotalValueStyle: { ...value.subtotalValueStyle, ...patch } })
            }
          />
        </SettingGroup>
      </InspectorGroup>
      <InspectorGroup title="Nội dung các kênh mua hàng">
        <SettingGroup title="Nút chọn kênh mua hàng">
          <small className="builder-help">
            Gán link TikTok/Facebook và chọn phương thức thanh toán ở Cửa hàng → Kênh mua và thanh toán.
          </small>
          {[
            ["heading", "Tiêu đề", "Chọn cách mua hàng"],
            ["mobileBuyLabel", "Nút Mua ngay (kính lỏng)", "Mua ngay"],
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
                    ...(key === "mobileBuyLabel" ? { websiteLabel: event.target.value } : {}),
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
