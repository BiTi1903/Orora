import { SettingGroup, StyleTypographyBlock } from "./ui";

export function PhilosophySettings({ selected, philosophy, onChange, onStyleChange }) {
  const styles = philosophy.philosophyStyles || {};
  const styleKey = selected === "philLabel" ? "label" : selected === "philAccent" ? "accent" : "text";
  const style = styles[styleKey] || {};
  return (
    <>
      <SettingGroup title="Nội dung">
        <div className="builder-field">
          <label>Nhãn — Triết lý của chúng tôi</label>
          <textarea
            rows={2}
            value={philosophy.philosophyLabel || ""}
            onChange={(e) => onChange({ philosophyLabel: e.target.value })}
          />
        </div>
        <div className="builder-field">
          <label>Nội dung (Enter để xuống dòng)</label>
          <textarea
            rows={6}
            value={philosophy.philosophyBody || ""}
            onChange={(e) => onChange({ philosophyBody: e.target.value })}
          />
        </div>
        <div className="builder-field">
          <label>Số chữ cuối đổi màu (0 = tắt)</label>
          <input
            type="number"
            min="0"
            value={philosophy.philosophyAccentCount ?? 4}
            onChange={(e) => onChange({ philosophyAccentCount: Number(e.target.value) || 0 })}
          />
        </div>
        <small className="builder-help">
          Hiệu ứng sáng dần khi cuộn giữ nguyên. Những chữ cuối dùng màu nhấn.
        </small>
      </SettingGroup>
      <StyleTypographyBlock
        title={styleKey === "label" ? "Kiểu nhãn" : styleKey === "accent" ? "Màu chữ nổi bật" : "Kiểu câu chữ"}
        style={style}
        onStyleChange={(patch) => onStyleChange({ _styleKey: styleKey, ...patch })}
      />
    </>
  );
}
