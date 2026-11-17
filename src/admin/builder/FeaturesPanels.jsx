import { SettingGroup, StyleTypographyBlock, TypographyControls } from "./ui";
import { toFullFontFamily, toBareFontFamily } from "./options";

export function FeaturesSettings({
  data,
  features,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "featEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const styles = features.featuresStyles || {};

  if (data.type === "featText") {
    const { key, label, styleKey } = data.meta;
    return (
      <>
        <SettingGroup title={label}>
          <div className="builder-field">
            <label>Nội dung</label>
            <input
              value={features[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </div>
        </SettingGroup>
        <StyleTypographyBlock
          style={styles[styleKey] || {}}
          onStyleChange={onStyleChange}
        />
      </>
    );
  }

  if (data.type === "featCard") {
    const index = data.meta.index;
    const item = features.features?.[index] || {
      icon: "✦",
      title: "",
      text: "",
    };

    return (
      <>
        <SettingGroup title={`Ô ${index + 1}`}>
          <div className="builder-field">
            <label>Icon (emoji / ký tự)</label>
            <input
              value={item.icon || ""}
              onChange={(e) =>
                onChange({
                  _featureIndex: index,
                  _featureItem: { icon: e.target.value },
                })
              }
            />
          </div>
          <div className="builder-field">
            <label>Tiêu đề ô</label>
            <input
              value={item.title || ""}
              onChange={(e) =>
                onChange({
                  _featureIndex: index,
                  _featureItem: { title: e.target.value },
                })
              }
            />
          </div>
          <div className="builder-field">
            <label>Nội dung</label>
            <textarea
              rows={3}
              value={item.text || ""}
              onChange={(e) =>
                onChange({
                  _featureIndex: index,
                  _featureItem: { text: e.target.value },
                })
              }
            />
          </div>
        </SettingGroup>

        <StyleTypographyBlock
          style={styles.cardTitle || {}}
          onStyleChange={(patch) =>
            onStyleChange({ ...patch, _styleKey: "cardTitle" })
          }
        />

        <SettingGroup title="Typography — Nội dung ô">
          <TypographyControls
            style={{
              ...styles.cardText,
              fontFamily: toBareFontFamily(styles.cardText?.fontFamily),
              fontSize: styles.cardText?.fontSize ?? "",
              fontWeight: styles.cardText?.fontWeight ?? "",
              color: styles.cardText?.color || "",
              letterSpacing: styles.cardText?.letterSpacing ?? "",
              lineHeight: styles.cardText?.lineHeight ?? "",
              italic:
                styles.cardText?.italic ||
                styles.cardText?.fontStyle === "italic",
              textAlign: styles.cardText?.textAlign || "left",
              marginTop: styles.cardText?.marginTop ?? 0,
              marginBottom: styles.cardText?.marginBottom ?? 0,
            }}
            onChange={(patch) => {
              const next = { ...patch, _styleKey: "cardText" };
              if ("fontFamily" in patch) {
                next.fontFamily = toFullFontFamily(patch.fontFamily);
              }
              if ("italic" in patch) {
                next.fontStyle = patch.italic ? "italic" : "normal";
              }
              onStyleChange(next);
            }}
          />
        </SettingGroup>

        <SettingGroup title="Typography — Icon">
          <TypographyControls
            style={{
              ...styles.icon,
              fontFamily: toBareFontFamily(styles.icon?.fontFamily),
              fontSize: styles.icon?.fontSize ?? "",
              fontWeight: styles.icon?.fontWeight ?? "",
              color: styles.icon?.color || "",
              letterSpacing: styles.icon?.letterSpacing ?? "",
              lineHeight: styles.icon?.lineHeight ?? "",
              italic: styles.icon?.italic || false,
              textAlign: styles.icon?.textAlign || "center",
              marginTop: styles.icon?.marginTop ?? "",
              marginBottom: styles.icon?.marginBottom ?? "",
            }}
            onChange={(patch) => {
              const next = { ...patch, _styleKey: "icon" };
              if ("fontFamily" in patch) {
                next.fontFamily = toFullFontFamily(patch.fontFamily);
              }
              onStyleChange(next);
            }}
          />
        </SettingGroup>

        <SettingGroup title="Danh sách">
          <button
            type="button"
            className="admin-btn"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={() =>
              onChange({
                _featuresList: [
                  ...(features.features || []),
                  { icon: "✦", title: "", text: "" },
                ],
              })
            }
          >
            + Thêm ô
          </button>
          {(features.features || []).length > 1 && (
            <button
              type="button"
              className="admin-btn danger"
              style={{ width: "100%" }}
              onClick={() => {
                const next = (features.features || []).filter(
                  (_, i) => i !== index
                );
                onChange({ _featuresList: next });
              }}
            >
              Xóa ô này
            </button>
          )}
        </SettingGroup>
      </>
    );
  }

  return null;
}
