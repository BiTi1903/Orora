import {
  FONT_OPTIONS,
  FONT_STYLE_OPTIONS,
  TRANSFORM_OPTIONS,
  WEIGHT_OPTIONS,
  toCss,
} from "../../lib/typography";

const LABEL = { fontSize: 12, fontWeight: 600, color: "#6f5361" };

const CONTROL = {
  width: "100%",
  height: 42,
  padding: "0 12px",
  border: "1px solid #ead9e0",
  borderRadius: 10,
  background: "#fff",
  color: "#321525",
  fontSize: 13,
  outline: "none",
};

function Box({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, minWidth: 0 }}>
      <label style={LABEL}>{label}</label>
      {children}
    </div>
  );
}

function SelectBox({ label, value, options, onChange }) {
  return (
    <Box label={label}>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        style={{ ...CONTROL, cursor: "pointer" }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Box>
  );
}

function NumberBox({ label, value, placeholder, step = 1, onChange }) {
  return (
    <Box label={label}>
      <input
        type="number"
        step={step}
        value={value ?? ""}
        placeholder={placeholder !== undefined ? String(placeholder) : "Mặc định"}
        onChange={(e) => {
          const raw = e.target.value;
          onChange(raw === "" ? "" : Number(raw));
        }}
        style={CONTROL}
      />
    </Box>
  );
}

function ColorBox({ label, value, fallback, onChange }) {
  return (
    <Box label={label}>
      <div style={{ ...CONTROL, padding: "4px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <input
          type="color"
          value={value || fallback || "#000000"}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: 32, height: 32, padding: 0, border: 0, background: "transparent", cursor: "pointer" }}
        />
        <span style={{ fontSize: 12, color: "#6f5361", textTransform: "uppercase", flex: 1 }}>
          {value || "Mặc định"}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Về màu mặc định"
            style={{ border: 0, background: "transparent", color: "#b8446d", cursor: "pointer", fontSize: 12 }}
          >
            ↺
          </button>
        )}
      </div>
    </Box>
  );
}

/* fields: các ô được hiện. Mặc định hiện đủ. */
const ALL_FIELDS = ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "lineHeight", "fontStyle", "textTransform"];

export default function StyleEditor({
  title,
  value,
  defaults = {},
  onChange,
  sample = "Chữ mẫu Aa",
  fields = ALL_FIELDS,
  previewBg = "#fffafd",
}) {
  const saved = value || {};
  const eff = { ...defaults, ...saved };
  const show = (k) => fields.includes(k);

  const set = (key, v) => {
    const next = { ...saved };
    if (v === "" || v === undefined || (typeof v === "number" && Number.isNaN(v))) delete next[key];
    else next[key] = v;
    onChange(next);
  };

  const changed = Object.keys(saved).length > 0;

  return (
    <details
      style={{
        marginTop: 14,
        border: "1px solid #ead9e0",
        borderRadius: 14,
        background: "#fffafd",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          padding: "14px 18px",
          fontSize: 14,
          fontWeight: 700,
          color: "#321525",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span>{title}</span>
        {changed && <span style={{ fontSize: 11, color: "#b8446d", fontWeight: 600 }}>● đã chỉnh</span>}
      </summary>

      <div style={{ padding: "0 18px 18px" }}>
        {/* XEM TRƯỚC NGAY */}
        <div
          style={{
            marginBottom: 14,
            padding: 16,
            borderRadius: 10,
            background: previewBg,
            border: "1px dashed #ead9e0",
            overflow: "hidden",
          }}
        >
          <div style={toCss(eff, { responsive: false })}>{sample}</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          {show("fontFamily") && (
            <SelectBox label="Font" value={saved.fontFamily} options={FONT_OPTIONS} onChange={(v) => set("fontFamily", v)} />
          )}
          {show("fontSize") && (
            <NumberBox label="Cỡ chữ (px)" value={saved.fontSize} placeholder={defaults.fontSize} onChange={(v) => set("fontSize", v)} />
          )}
          {show("fontWeight") && (
            <SelectBox label="Độ đậm" value={saved.fontWeight} options={WEIGHT_OPTIONS} onChange={(v) => set("fontWeight", v === "" ? "" : Number(v))} />
          )}
          {show("color") && (
            <ColorBox label="Màu chữ" value={saved.color} fallback={defaults.color} onChange={(v) => set("color", v)} />
          )}
          {show("letterSpacing") && (
            <NumberBox label="Khoảng cách chữ (px)" step={0.5} value={saved.letterSpacing} placeholder={defaults.letterSpacing} onChange={(v) => set("letterSpacing", v)} />
          )}
          {show("lineHeight") && (
            <NumberBox label="Chiều cao dòng" step={0.05} value={saved.lineHeight} placeholder={defaults.lineHeight} onChange={(v) => set("lineHeight", v)} />
          )}
          {show("fontStyle") && (
            <SelectBox label="Kiểu chữ" value={saved.fontStyle} options={FONT_STYLE_OPTIONS} onChange={(v) => set("fontStyle", v)} />
          )}
          {show("textTransform") && (
            <SelectBox label="Hoa / thường" value={saved.textTransform} options={TRANSFORM_OPTIONS} onChange={(v) => set("textTransform", v)} />
          )}
        </div>

        {changed && (
          <button
            type="button"
            className="admin-btn"
            style={{ marginTop: 14 }}
            onClick={() => onChange({})}
          >
            ↺ Đặt lại mặc định
          </button>
        )}
      </div>
    </details>
  );
}

/* Hiện nhiều StyleEditor từ một danh sách khai báo.
   elements: [{ key, title, sample, defaults, fields?, previewBg? }]
   value: object { [key]: kiểu chữ }  ·  onChange: nhận object mới */
export function StyleList({ elements, value, onChange }) {
  const all = value || {};

  return elements.map((el) => (
    <StyleEditor
      key={el.key}
      title={el.title}
      sample={el.sample}
      defaults={el.defaults}
      fields={el.fields}
      previewBg={el.previewBg}
      value={all[el.key]}
      onChange={(v) => onChange({ ...all, [el.key]: v })}
    />
  ));
}
