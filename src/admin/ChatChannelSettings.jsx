import { useId, useState } from "react";
import { CHANNEL_FIELDS, channelText } from "../lib/chat-channel";
import ChatChannelChooser from "../components/ChatChannelChooser";
import { ColorField, NumberField, TypographyEditor as SloganTypographyEditor } from "./controls";
import { CHAT_CHANNEL_COLOR_DEFAULTS } from "./controls/color-defaults";
import "../styles/chat-button.css";
export default function ChatChannelSettings({ value, onChange }) {
  const [field, setField] = useState("title"),
    id = useId();
  const config = value.channel || {},
    style = config.textStyles?.[field] || {};
  const patch = (changes) => onChange("channel", { ...config, ...changes });
  return (
    <div className="chat-channel-settings">
      <h3>Khung chọn Zalo / Trợ lý AI</h3>
      <p className="admin-muted">
        Chỉnh từng dòng chữ, kiểu chữ và khung. Xóa nội dung nếu muốn để trống dòng đó.
      </p>
      <div className="admin-field">
        <label htmlFor={`${id}-field`}>Phần cần chỉnh</label>
        <select id={`${id}-field`} value={field} onChange={(event) => setField(event.target.value)}>
          {CHANNEL_FIELDS.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="admin-field">
        <label htmlFor={`${id}-content`}>Nội dung hiển thị</label>
        <textarea
          id={`${id}-content`}
          rows={2}
          maxLength={240}
          value={channelText(config, field)}
          onChange={(event) => patch({ [field]: event.target.value })}
        />
      </div>
      <SloganTypographyEditor
        title="Kiểu chữ của dòng đã chọn"
        body
        value={style}
        onChange={(changes) =>
          patch({ textStyles: { ...config.textStyles, [field]: { ...style, ...changes } } })
        }
      />
      {[
        ["appearance", "Khung ngoài"],
        ["optionAppearance", "Hai lựa chọn"],
      ].map(([key, label]) => (
        <fieldset className="slogan-design-editor" key={key}>
          <legend>{label}</legend>
          <div className="admin-form-grid">
            {[
              ["backgroundColor", "Màu nền"],
              ["borderColor", "Màu viền"],
            ].map(([property, title]) => (
              <ColorField
                key={property}
                label={title}
                value={config[key]?.[property]}
                fallback={CHAT_CHANNEL_COLOR_DEFAULTS[property]}
                onChange={(next) => patch({ [key]: { ...config[key], [property]: next } })}
              />
            ))}
            {[
              ["borderRadius", "Bo góc (px)", key === "appearance" ? 20 : 14, 64],
              ["padding", "Khoảng đệm (px)", key === "appearance" ? 20 : 14, 60],
              ["borderWidth", "Độ dày viền (px)", 1, 8],
            ].map(([property, title, fallback, max]) => (
              <NumberField
                key={property}
                label={title}
                max={max}
                fallback={fallback}
                value={config[key]?.[property]}
                onChange={(next) => patch({ [key]: { ...config[key], [property]: next } })}
              />
            ))}
          </div>
          <button type="button" className="admin-btn" onClick={() => patch({ [key]: {} })}>
            Đặt lại {label.toLocaleLowerCase("vi-VN")}
          </button>
        </fieldset>
      ))}
      <h3>Xem trước</h3>
      <div
        data-admin-preview
        className="chat-channel-preview"
        onClickCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        <ChatChannelChooser settings={value} zalo="#" preview onAI={() => {}} onClose={() => {}} />
      </div>
    </div>
  );
}
