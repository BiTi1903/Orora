const FONT_OPTIONS = [
  { label: "Mulish", value: '"Mulish", sans-serif' },
  { label: "Noto Sans", value: '"Noto Sans", sans-serif' },
  { label: "Noto Serif", value: '"Noto Serif", serif' },
  { label: "Playfair Display", value: '"Playfair Display", serif' },
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", serif' },
  { label: "Montserrat", value: '"Montserrat", sans-serif' },
  { label: "Poppins", value: '"Poppins", sans-serif' },
  { label: "Inter", value: '"Inter", sans-serif' },
  { label: "DM Sans", value: '"DM Sans", sans-serif' },
  { label: "Lora", value: '"Lora", serif' },
  { label: "Roboto", value: '"Roboto", sans-serif' },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
];

const SIZE_OPTIONS = [
  12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96, 100, 120, 130,
];

const WEIGHT_OPTIONS = [
  { label: "300 - Light", value: 300 },
  { label: "400 - Regular", value: 400 },
  { label: "500 - Medium", value: 500 },
  { label: "600 - Semi Bold", value: 600 },
  { label: "700 - Bold", value: 700 },
  { label: "800 - Extra Bold", value: 800 },
];

const LETTER_SPACING_OPTIONS = [-3, -2, -1, -0.5, 0, 0.5, 1, 2, 3, 4, 6];
const LINE_HEIGHT_OPTIONS = [0.9, 0.92, 0.95, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8, 2];

const ALL_FIELDS = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "color",
  "letterSpacing",
  "lineHeight",
  "fontStyle",
  "textTransform",
];

function SelectControl({ label, value, onChange, children }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

function ColorControl({ label, value, onChange }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={/^#([0-9a-f]{6})$/i.test(value || "") ? value : "#b8446d"}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: 42,
            height: 42,
            padding: 0,
            border: "1px solid #ead9e0",
            borderRadius: 10,
            background: "#fff",
            cursor: "pointer",
          }}
        />
        <input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#b8446d"
        />
      </div>
    </div>
  );
}

function StyleFields({ style, fields, onChange }) {
  const show = (key) => !fields || fields.includes(key);
  const update = (key, nextValue) => onChange({ ...style, [key]: nextValue });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 12,
      }}
    >
      {show("fontFamily") && (
        <SelectControl
          label="Font"
          value={style.fontFamily || ""}
          onChange={(v) => update("fontFamily", v)}
        >
          <option value="">Mặc định</option>
          {FONT_OPTIONS.map((font) => (
            <option key={font.value} value={font.value}>
              {font.label}
            </option>
          ))}
        </SelectControl>
      )}

      {show("fontSize") && (
        <SelectControl
          label="Size"
          value={style.fontSize ?? ""}
          onChange={(v) => update("fontSize", Number(v))}
        >
          {SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </SelectControl>
      )}

      {show("fontSize") && <SelectControl label="Cỡ chữ mobile (0 = tự động)" value={style.mobileFontSize ?? 0} onChange={(v) => update("mobileFontSize", Number(v))}>
        {[0, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48, 56, 64].map((size) => <option key={size} value={size}>{size === 0 ? "Tự động" : `${size}px`}</option>)}
      </SelectControl>}

      {show("fontWeight") && (
        <SelectControl
          label="Độ đậm"
          value={style.fontWeight ?? ""}
          onChange={(v) => update("fontWeight", Number(v))}
        >
          {WEIGHT_OPTIONS.map((weight) => (
            <option key={weight.value} value={weight.value}>
              {weight.label}
            </option>
          ))}
        </SelectControl>
      )}

      {show("color") && (
        <ColorControl
          label="Màu chữ"
          value={style.color}
          onChange={(v) => update("color", v)}
        />
      )}

      {show("letterSpacing") && (
        <SelectControl
          label="Khoảng cách chữ"
          value={style.letterSpacing ?? ""}
          onChange={(v) => update("letterSpacing", Number(v))}
        >
          {LETTER_SPACING_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}px
            </option>
          ))}
        </SelectControl>
      )}

      {show("lineHeight") && (
        <SelectControl
          label="Chiều cao dòng"
          value={style.lineHeight ?? ""}
          onChange={(v) => update("lineHeight", Number(v))}
        >
          {LINE_HEIGHT_OPTIONS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </SelectControl>
      )}

      {show("fontStyle") && (
        <SelectControl
          label="Kiểu chữ"
          value={style.fontStyle || "normal"}
          onChange={(v) => update("fontStyle", v)}
        >
          <option value="normal">Bình thường</option>
          <option value="italic">Nghiêng</option>
        </SelectControl>
      )}

      {show("textTransform") && (
        <SelectControl
          label="Hoa / thường"
          value={style.textTransform || "none"}
          onChange={(v) => update("textTransform", v)}
        >
          <option value="none">Giữ nguyên</option>
          <option value="uppercase">IN HOA</option>
          <option value="lowercase">chữ thường</option>
          <option value="capitalize">Viết Hoa Đầu</option>
        </SelectControl>
      )}
    </div>
  );
}

export function StyleList({ elements = [], value, onChange }) {
  const styles = value && typeof value === "object" ? value : {};

  const updateKey = (key, nextStyle) => {
    onChange?.({
      ...styles,
      [key]: nextStyle,
    });
  };

  return (
    <div style={{ display: "grid", gap: 14, marginTop: 8 }}>
      {elements.map((element) => {
        const style = {
          ...(element.defaults || {}),
          ...(styles[element.key] || {}),
        };
        const fields = element.fields || ALL_FIELDS;

        return (
          <div
            key={element.key}
            style={{
              padding: 18,
              border: "1px solid #ead9e0",
              borderRadius: 14,
              background: "#fffafd",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: "#321525", marginBottom: 6 }}>
              {element.title || element.key}
            </div>
            {element.sample && (
              <div
                style={{
                  marginBottom: 14,
                  fontFamily: style.fontFamily || "inherit",
                  fontSize: Math.min(Number(style.fontSize) || 18, 36),
                  fontWeight: style.fontWeight,
                  fontStyle: style.fontStyle,
                  letterSpacing: style.letterSpacing != null ? `${style.letterSpacing}px` : undefined,
                  lineHeight: style.lineHeight,
                  color: style.color,
                  textTransform: style.textTransform,
                }}
              >
                {element.sample}
              </div>
            )}
            <StyleFields
              style={style}
              fields={fields}
              onChange={(next) => updateKey(element.key, next)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default StyleList;