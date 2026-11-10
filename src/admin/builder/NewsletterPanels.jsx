import { SettingGroup, StyleTypographyBlock, ColorField } from "./ui";
import { NEWSLETTER_FIELD_MAP } from "./registry";

export function NewsletterSettings({
  selected,
  data,
  newsletter,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "nlEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const meta = data.meta || NEWSLETTER_FIELD_MAP[selected];
  if (!meta) {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const styles = newsletter.newsletterStyles || {};
  const style = styles[meta.styleKey] || {};
  const textValue = newsletter[meta.key] ?? "";

  return (
    <>
      <SettingGroup title={meta.label}>
        <div className="builder-field">
          <label>Nội dung</label>
          {meta.multiline ? (
            <textarea
              rows={3}
              value={textValue}
              onChange={(e) => onChange({ [meta.key]: e.target.value })}
            />
          ) : (
            <input
              value={textValue}
              onChange={(e) => onChange({ [meta.key]: e.target.value })}
            />
          )}
        </div>
        {meta.hint && (
          <small className="builder-help">{meta.hint}</small>
        )}
      </SettingGroup>

      {["input", "button"].includes(meta.styleKey) && <SettingGroup title="Khung hiển thị">
        <ColorField label="Màu nền" value={style.background || ""} onChange={background => onStyleChange({background})} />
        <ColorField label="Màu viền" value={style.borderColor || ""} onChange={borderColor => onStyleChange({borderColor})} />
        <div className="builder-field"><label>Bo góc (px)</label><input type="number" min="0" max="100" value={style.borderRadius ?? ""} placeholder="Mặc định" onChange={event => onStyleChange({borderRadius:event.target.value === "" ? "" : Number(event.target.value)})}/></div>
      </SettingGroup>}
      {meta.styleKey && (
        <StyleTypographyBlock
          style={style}
          onStyleChange={onStyleChange}
        />
      )}
    </>
  );
}
