import { toSafeHexColor } from "./ui.helpers";
import {
  FONT_OPTIONS,
  SIZE_OPTIONS,
  WEIGHT_OPTIONS,
  LETTER_OPTIONS,
  LINE_OPTIONS,
  SPACE_OPTIONS,
  toFullFontFamily,
  toBareFontFamily,
} from "./options";

export function StyleTypographyBlock({ style = {}, onStyleChange, title = "Typography" }) {
  return (
    <SettingGroup title={title}>
      <TypographyControls
        style={{
          fontFamily: toBareFontFamily(style.fontFamily),
          fontSize: style.fontSize ?? "",
          mobileFontSize: style.mobileFontSize ?? 0,
          fontWeight: style.fontWeight ?? "",
          color: style.color || "",
          letterSpacing: style.letterSpacing ?? "",
          lineHeight: style.lineHeight ?? "",
          italic: style.italic || style.fontStyle === "italic",
          textAlign: style.textAlign || "left",
          marginTop: style.marginTop ?? 0,
          marginBottom: style.marginBottom ?? 0,
          paddingTop: style.paddingTop ?? 0,
          paddingBottom: style.paddingBottom ?? 0,
          maxWidth: style.maxWidth ?? 100,
        }}
        onChange={(patch) => {
          const next = { ...patch };
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
  );
}


export function TypographyControls({ style, onChange }) {
  const s = style || {};
  return (
    <>
      <SelectField
        label="Font"
        value={s.fontFamily}
        options={FONT_OPTIONS}
        onChange={(value) =>
          onChange({ fontFamily: value })
        }
      />

      <SelectField label="Cỡ chữ mobile (0 = tự động)" value={s.mobileFontSize ?? 0} options={[0, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 56, 64]} suffix="px" onChange={(value) => onChange({ mobileFontSize: Number(value) })} />
      <div className="builder-field-row">
        <SelectField
          label="Size"
          value={s.fontSize}
          options={SIZE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({
              fontSize: Number(value),
            })
          }
        />

        <SelectField
          label="Weight"
          value={s.fontWeight}
          options={WEIGHT_OPTIONS}
          onChange={(value) =>
            onChange({
              fontWeight: Number(value),
            })
          }
        />
      </div>

      <ColorField
        label="Màu chữ"
        value={s.color}
        onChange={(value) =>
          onChange({ color: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Letter spacing"
          value={s.letterSpacing}
          options={LETTER_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({
              letterSpacing: Number(value),
            })
          }
        />

        <SelectField
          label="Line height"
          value={s.lineHeight}
          options={LINE_OPTIONS}
          onChange={(value) =>
            onChange({
              lineHeight: Number(value),
            })
          }
        />
      </div>

      <div className="builder-field">
        <label>Căn lề</label>

        <div className="builder-align">
          {[
            ["left", "≡"],
            ["center", "≡"],
            ["right", "≡"],
            ["justify", "☰"],
          ].map(([value, icon]) => (
            <button
              key={value}
              type="button"
              className={
                s.textAlign === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChange({
                  textAlign: value,
                })
              }
              title={value}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-field">
        <label>Kiểu chữ</label>

        <button
          type="button"
          className={`builder-toggle ${
            s.italic ? "active" : ""
          }`}
          onClick={() =>
            onChange({
              italic: !s.italic,
            })
          }
        >
          <i>I</i> Italic
        </button>
      </div>

      <SettingGroup title="Spacing">
        <div className="builder-field-row">
          <SelectField
            label="Margin trên"
            value={s.marginTop}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                marginTop: Number(value),
              })
            }
          />

          <SelectField
            label="Margin dưới"
            value={s.marginBottom}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                marginBottom: Number(value),
              })
            }
          />
        </div>

        <div className="builder-field-row">
          <SelectField
            label="Padding trên"
            value={s.paddingTop}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                paddingTop: Number(value),
              })
            }
          />

          <SelectField
            label="Padding dưới"
            value={s.paddingBottom}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                paddingBottom: Number(value),
              })
            }
          />
        </div>

        <SelectField
          label="Max width"
          value={s.maxWidth}
          options={[
            30,
            40,
            50,
            60,
            70,
            80,
            90,
            100,
          ]}
          suffix="%"
          onChange={(value) =>
            onChange({
              maxWidth: Number(value),
            })
          }
        />
      </SettingGroup>
    </>
  );
}


export function SettingGroup({ title, children }) {
  return (
    <div className="builder-setting-group">
      <h3>{title}</h3>
      <div className="builder-setting-content">
        {children}
      </div>
    </div>
  );
}


export function SelectField({
  label,
  value,
  options,
  suffix = "",
  onChange,
}) {
  const list = Array.isArray(options) ? options : [];
  const raw = value ?? "";
  const hasValue = list.some((option) => String(option) === String(raw));
  const selectValue = raw === "" || hasValue ? raw : String(raw);
  const extra =
    raw !== "" && !hasValue ? (
      <option value={selectValue}>
        {selectValue}
        {suffix}
      </option>
    ) : null;

  return (
    <div className="builder-field">
      <label>{label}</label>

      <select
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {raw === "" && !hasValue && (
          <option value="">—</option>
        )}
        {extra}
        {list.map((option) => (
          <option key={String(option)} value={option}>
            {option}
            {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}





export function ColorField({ label, value, onChange }) {
  const hex = toSafeHexColor(value);
  return (
    <div className="builder-color-field">
      <div>
        <label>{label}</label>
        <span>{value || hex}</span>
      </div>

      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
