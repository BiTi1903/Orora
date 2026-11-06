import { useId } from "react";
import { FONT_OPTIONS, WEIGHT_OPTIONS } from "../lib/typography";

function NumberField({ label, value, onChange, fallback, min = 0, max = 80, step = 1 }) {
  const id = useId();
  return <div className="admin-field"><label htmlFor={id}>{label}</label><input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={value ?? ""} placeholder={String(fallback ?? "Tự động")} onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))} /></div>;
}

function ChoiceField({ label, value, onChange, options }) {
  const id = useId();
  return <div className="admin-field"><label htmlFor={id}>{label}</label><select id={id} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></div>;
}

function ColorField({ label, value, onChange, fallback = "#b8446d" }) {
  const id = useId();
  return <div className="admin-field"><label htmlFor={id}>{label}</label><div className="slogan-color-field"><input type="color" aria-label={`Chọn ${label.toLocaleLowerCase("vi-VN")}`} value={/^#[\da-f]{6}$/i.test(value || "") ? value : fallback} onChange={(event) => onChange(event.target.value)} /><input id={id} value={value || ""} placeholder={fallback} maxLength={80} onChange={(event) => onChange(event.target.value)} /><button type="button" className="slogan-clear-color" aria-label={`Mặc định ${label.toLocaleLowerCase("vi-VN")}`} title="Dùng màu mặc định" onClick={() => onChange("")}>↺</button></div></div>;
}

export function SloganTypographyEditor({ value = {}, onChange, title = "Kiểu chữ", body = false }) {
  const s = value || {};
  const set = (key) => (next) => onChange({ [key]: next });
  return <fieldset className="slogan-design-editor"><legend>{title}</legend><div className="slogan-design-grid">
    <ChoiceField label="Phông chữ" value={s.fontFamily || ""} onChange={set("fontFamily")} options={FONT_OPTIONS.map(({ value, label }) => [value, label])} />
    <NumberField label="Cỡ chữ máy tính (px)" value={s.fontSize} fallback={body ? 14 : 19} max={160} onChange={set("fontSize")} />
    <NumberField label="Cỡ chữ điện thoại (px)" value={s.mobileFontSize} fallback={body ? 15 : 19} max={96} onChange={set("mobileFontSize")} />
    <ChoiceField label="Độ đậm" value={s.fontWeight ?? ""} onChange={(next) => set("fontWeight")(next === "" ? "" : Number(next))} options={WEIGHT_OPTIONS.map(({ value, label }) => [value, label])} />
    <ColorField label="Màu chữ" value={s.color} fallback={body ? "#3a1526" : "#b8446d"} onChange={set("color")} />
    <ChoiceField label="Căn chữ" value={s.textAlign || ""} onChange={set("textAlign")} options={[["", "Theo khung thẻ"], ["left", "Trái"], ["center", "Giữa"], ["right", "Phải"], ["justify", "Căn đều"]]} />
    <ChoiceField label="Kiểu chữ" value={s.fontStyle || (s.italic ? "italic" : "")} onChange={set("fontStyle")} options={[["", "Mặc định"], ["normal", "Bình thường"], ["italic", "In nghiêng"]]} />
    <ChoiceField label="Hoa / thường" value={s.textTransform || ""} onChange={set("textTransform")} options={[["", "Mặc định"], ["none", "Giữ nguyên"], ["uppercase", "IN HOA"], ["lowercase", "chữ thường"], ["capitalize", "Viết Hoa Đầu"]]} />
    <ChoiceField label="Trang trí chữ" value={s.textDecoration || "none"} onChange={set("textDecoration")} options={[["none", "Không"], ["underline", "Gạch chân"], ["line-through", "Gạch ngang"], ["underline line-through", "Gạch chân và gạch ngang"]]} />
    <NumberField label="Giãn chữ (px)" value={s.letterSpacing} fallback={0} min={-3} max={12} step={0.1} onChange={set("letterSpacing")} />
    <NumberField label="Giãn dòng" value={s.lineHeight} fallback={body ? 1.8 : 1.4} min={0.8} max={3} step={0.05} onChange={set("lineHeight")} />
    <NumberField label="Khoảng trống trên chữ (px)" value={s.marginTop} fallback={0} max={64} onChange={set("marginTop")} />
    <NumberField label="Khoảng trống dưới chữ (px)" value={s.marginBottom} fallback={0} max={64} onChange={set("marginBottom")} />
  </div><small className="admin-muted">Để trống kích thước/khoảng cách để dùng mặc định. Cỡ chữ 0 = tự động. Màu có thể chọn hoặc nhập mã màu.</small></fieldset>;
}

export function SloganAppearanceEditor({ value = {}, onChange }) {
  const s = value || {};
  const set = (key) => (next) => onChange({ [key]: next });
  return <div className="slogan-design-editor"><h3>Khung và nền thẻ</h3><div className="slogan-design-grid">
    <ChoiceField label="Căn nội dung thẻ" value={s.textAlign || "left"} onChange={set("textAlign")} options={[["left", "Trái"], ["center", "Giữa"], ["right", "Phải"]]} />
    <ChoiceField label="Kiểu nền" value={s.backgroundType || "default"} onChange={set("backgroundType")} options={[["default", "Mặc định của website"], ["solid", "Một màu"], ["gradient", "Chuyển màu"], ["transparent", "Trong suốt"]]} />
    {["solid", "gradient"].includes(s.backgroundType) && <ColorField label="Màu nền thẻ" value={s.backgroundColor} fallback="#fffafb" onChange={set("backgroundColor")} />}
    {s.backgroundType === "gradient" && <><ColorField label="Màu chuyển tới" value={s.gradientColor} fallback="#fff0f6" onChange={set("gradientColor")} /><NumberField label="Hướng chuyển màu (độ)" value={s.gradientAngle} fallback={145} max={360} onChange={set("gradientAngle")} /></>}
    <NumberField label="Bo góc thẻ (px)" value={s.borderRadius} fallback={16} max={64} onChange={set("borderRadius")} />
    <NumberField label="Độ dày viền (px)" value={s.borderWidth} fallback={1} max={8} onChange={set("borderWidth")} />
    <ChoiceField label="Kiểu viền" value={s.borderStyle || "solid"} onChange={set("borderStyle")} options={[["solid", "Liền"], ["dashed", "Nét đứt"], ["dotted", "Chấm"], ["none", "Không viền"]]} />
    <ColorField label="Màu viền thẻ" value={s.borderColor} fallback="#edd5df" onChange={set("borderColor")} />
    <ChoiceField label="Đổ bóng" value={s.shadow || "default"} onChange={set("shadow")} options={[["default", "Mặc định"], ["none", "Không bóng"], ["soft", "Nhẹ"], ["medium", "Vừa"], ["lifted", "Nổi bật"]]} />
    <NumberField label="Khoảng cách các phần (px)" value={s.gap} fallback={12} max={48} onChange={set("gap")} />
    <ChoiceField label="Đường phân cách" value={s.divider || "none"} onChange={set("divider")} options={[["none", "Không"], ["solid", "Đường liền"], ["dashed", "Nét đứt"], ["dotted", "Chấm"]]} />
    <ColorField label="Màu đường phân cách" value={s.dividerColor} fallback="#edd5df" onChange={set("dividerColor")} />
  </div><h3>Khoảng đệm trong thẻ</h3><div className="slogan-design-grid">
    {[["paddingTop", "Đệm trên (px)", 22], ["paddingRight", "Đệm phải (px)", 18], ["paddingBottom", "Đệm dưới (px)", 22], ["paddingLeft", "Đệm trái (px)", 18]].map(([key, label, fallback]) => <NumberField key={key} label={label} value={s[key]} fallback={fallback} onChange={set(key)} />)}
    <NumberField label="Đệm trên điện thoại (px)" value={s.mobilePadding} fallback="Theo máy tính" max={40} onChange={set("mobilePadding")} />
  </div><label className="admin-check"><input type="checkbox" checked={s.showTitle !== false} onChange={(event) => onChange({ showTitle: event.target.checked })} />Hiển thị tiêu đề Slogan</label></div>;
}
