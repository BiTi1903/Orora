import { SettingGroup, StyleTypographyBlock } from "./ui";

export function FooterSettings({ data, footer, onChange, onStyleChange }) {
  if (!data || data.type === "ftEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const { key, label, rows, styleKey } = data.meta;
  const style = footer.footerStyles?.[styleKey] || {};

  return (
    <>
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Nội dung</label>
          {rows ? (
            <textarea
              rows={rows}
              value={footer[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          ) : (
            <input
              value={footer[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          )}
        </div>
      </SettingGroup>
      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
    </>
  );
}
