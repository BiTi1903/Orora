import { FRAME_COLORS, FRAME_SIZES, mailDesign } from "../lib/mail-design";

export default function MailDesignFields({ value, onChange, disabled }) {
  const design = mailDesign(value);
  const change = (key, next) => onChange({ ...design, [key]: next });
  return <details className="admin-filter-panel">
    <summary>Khung và màu email</summary>
    <fieldset className="writer-fields" disabled={disabled}>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%, 150px),1fr))", gap:12}}>
        {Object.entries(FRAME_COLORS).map(([key, [label]]) => <label key={key} className="admin-field">{label}
          <input type="color" value={design[key]} onChange={event => change(key, event.target.value)} />
        </label>)}
        {Object.entries(FRAME_SIZES).map(([key, [label,, min, max]]) => <label key={key} className="admin-field">{label} · {design[key]} px
          <input type="range" min={min} max={max} value={design[key]} onChange={event => change(key, Number(event.target.value))} />
        </label>)}
      </div>
      <button type="button" className="admin-btn" onClick={() => onChange(mailDesign())}>Khôi phục khung và màu mặc định</button>
    </fieldset>
  </details>;
}
