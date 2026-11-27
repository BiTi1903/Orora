import { useState } from "react";
import { FRAME_COLORS, FRAME_SIZES, MAIL_COPY, MAIL_OPTIONS, mailDesign } from "../lib/mail-design";

const sections = {
  "Khung thư": ["background", "surface", "border", "width", "radius", "thickness", "footer"],
  "Đầu thư": ["brand", "tagline", "header", "preheader"],
  "Nội dung": ["font", "fontSize", "weight", "align", "text"],
  "Nút hành động": ["buttonLabel", "buttonUrl", "button", "buttonText"],
};

export default function MailDesignFields({ value, onChange, disabled, kind }) {
  const [section, setSection] = useState("Khung thư");
  const design = mailDesign(value);
  const change = (key, next) => onChange({ ...design, [key]: next });

  function field(key) {
    if (key === "buttonUrl" && kind === "order_auto") return <p key={key} className="admin-muted">Đích của nút lấy theo cấu hình tra cứu đơn hàng.</p>;
    if (FRAME_COLORS[key]) return <label key={key} className="admin-field">{FRAME_COLORS[key][0]}
      <input type="color" value={design[key]} onChange={event => change(key, event.target.value)} />
    </label>;
    if (FRAME_SIZES[key]) {
      const [label,, min, max] = FRAME_SIZES[key];
      return <label key={key} className="admin-field">{label} · {design[key]} px
        <input type="range" min={min} max={max} value={design[key]} onChange={event => change(key, Number(event.target.value))} />
      </label>;
    }
    if (MAIL_OPTIONS[key]) {
      const [label, options] = MAIL_OPTIONS[key];
      return <label key={key} className="admin-field">{label}
        <select value={design[key]} onChange={event => change(key, event.target.value)}>
          {Object.entries(options).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>;
    }
    const [label,, limit] = MAIL_COPY[key];
    return <label key={key} className="admin-field">{label}
      <input type={key === "buttonUrl" ? "url" : "text"} maxLength={limit} value={design[key]} onChange={event => change(key, event.target.value)} />
    </label>;
  }
  return <details className="admin-filter-panel">
    <summary>Khung và màu email</summary>
    <fieldset className="writer-fields" disabled={disabled}>
      <div className="mail-preview-toolbar" role="group" aria-label="Phần thư cần chỉnh">
        {Object.keys(sections).map(name => <button key={name} type="button" aria-pressed={name === section}
          className={name === section ? "admin-btn primary" : "admin-btn"} onClick={() => setSection(name)}>{name}</button>)}
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%, 180px),1fr))", gap:12}}>
        {sections[section].map(field)}
      </div>
      <button type="button" className="admin-btn" onClick={() => {
        const defaults = mailDesign();
        onChange({ ...design, ...Object.fromEntries(sections[section].map(key => [key, defaults[key]])) });
      }}>Khôi phục mặc định phần này</button>
    </fieldset>
  </details>;
}
