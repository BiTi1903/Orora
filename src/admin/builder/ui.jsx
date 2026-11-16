import {TRANSFORM_OPTIONS} from "../../lib/typography";
import {useContext,useId,useLayoutEffect,useMemo,useRef} from "react";
import {CompactInspectorContext} from "./inspector-context";
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

export function StyleTypographyBlock({ style = {}, onStyleChange, title = "Kiểu chữ" }) {
  return (
    <SettingGroup title={title} collapsible={false}>
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
          textTransform: style.textTransform || "",
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
      <ColorField label="Màu chữ" value={s.color} onChange={color=>onChange({color})}/>
      <details className="builder-advanced-controls"><summary>Nâng cao · Kiểu chữ và khoảng cách</summary>
      <label className="builder-field">Chữ hoa / thường<select value={s.textTransform||''} onChange={e=>onChange({textTransform:e.target.value})}>{TRANSFORM_OPTIONS.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
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
          label="Cỡ chữ desktop"
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
          label="Độ đậm"
          value={s.fontWeight}
          options={WEIGHT_OPTIONS}
          onChange={(value) =>
            onChange({
              fontWeight: Number(value),
            })
          }
        />
      </div>

      <details className="builder-advanced-controls"><summary>Giãn chữ và giãn dòng</summary>
      <div className="builder-field-row">
        <SelectField
          label="Giãn chữ"
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
          label="Giãn dòng"
          value={s.lineHeight}
          options={LINE_OPTIONS}
          onChange={(value) =>
            onChange({
              lineHeight: Number(value),
            })
          }
        />
      </div>

      </details>

      <div className="builder-field">
        <label>Căn lề</label>

        <div className="builder-align">
          {[
            ["left", "≡", "Căn trái"],
            ["center", "≡", "Căn giữa"],
            ["right", "≡", "Căn phải"],
            ["justify", "☰", "Căn đều"],
          ].map(([value, icon, label]) => (
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
              title={label}
              aria-label={label}
              aria-pressed={s.textAlign === value}
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
          aria-pressed={Boolean(s.italic)}
          className={`builder-toggle ${
            s.italic ? "active" : ""
          }`}
          onClick={() =>
            onChange({
              italic: !s.italic,
            })
          }
        >
          <i>I</i> In nghiêng
        </button>
      </div>

      <details className="builder-advanced-controls"><summary>Khoảng cách và độ rộng</summary><SettingGroup title="Khoảng cách" collapsible={false}>
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
          label="Chiều rộng tối đa"
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
      </SettingGroup></details>
      </details>
    </>
  );
}


export function SettingGroup({title,children,collapsible=true}){
  const scope=useContext(CompactInspectorContext),ref=useRef(null);
  const compact=Boolean(scope&&!scope.nested&&collapsible);
  const advanced=/khung|padding|margin|khoảng cách|bố cục|tỷ lệ|hiệu ứng/i.test(title);
  const nestedScope=useMemo(()=>scope?{...scope,nested:true}:null,[scope]);
  const content=<CompactInspectorContext.Provider value={nestedScope}>{children}</CompactInspectorContext.Provider>;
  useLayoutEffect(()=>{
    if(!compact||!ref.current)return;
    ref.current.open=!advanced&&scope.root.current?.querySelector('[data-compact-setting]')===ref.current;
  },[scope,title,compact,advanced]);
  if(compact)return <details name={scope.groupName} ref={ref} className="builder-setting-group compact-setting-group" data-compact-setting>
    <summary><h3>{advanced?`Nâng cao · ${title}`:title}</h3></summary><div className="builder-setting-content">{content}</div>
  </details>;
  return <div className="builder-setting-group"><h3>{title}</h3><div className="builder-setting-content">{content}</div></div>;
}


export function SelectField({
  label,
  value,
  options,
  suffix = "",
  onChange,
}) {
  const id = useId();
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
      <label htmlFor={id}>{label}</label>

      <select
        id={id}
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {raw === "" && !hasValue && (
          <option value="">—</option>
        )}
        {extra}
        {list.map((option) => (
          <option key={String(option)} value={option}>
            {option === "" ? "Mặc định" : option}
            {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}





export function ColorField({ label, value, onChange }) {
  const id = useId();
  const hex = toSafeHexColor(value);
  return (
    <div className="builder-color-field">
      <div>
        <label htmlFor={id}>{label}</label>
        <span>{value || hex}</span>
      </div>

      <input
        id={id}
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
