import { useId } from "react";

/**
 * Bộ điều khiển dùng chung cho toàn bộ admin (trang cài đặt và Visual Builder).
 * Tất cả field dùng cùng khung `admin-field` (label phía trên, ô nhập phía dưới).
 * Các component chỉ gọi onChange(giá trị) — không tự đổi tên khóa cấu hình.
 */

const HEX_COLOR = /^#[\da-f]{6}$/i;

function toPickerHex(value, fallback = "#b8446d") {
  if (HEX_COLOR.test(value || "")) return value;
  if (/^#[\da-f]{3}$/i.test(value || "")) {
    return `#${value.slice(1).split("").map((c) => c + c).join("")}`;
  }
  return HEX_COLOR.test(fallback || "") ? fallback : "#000000";
}

/** Chọn màu: bảng màu + ô nhập mã + nút trả về mặc định (giá trị rỗng). */
export function ColorField({ label, value, onChange, fallback = "#b8446d", allowReset = true, className = "" }) {
  const id = useId();
  const lower = String(label || "").toLocaleLowerCase("vi-VN");
  return (
    <div className={`admin-field admin-color-field ${className}`.trim()}>
      <label htmlFor={id}>{label}</label>
      <div className="admin-color-control">
        <input
          type="color"
          aria-label={`Chọn ${lower}`}
          value={toPickerHex(value, fallback)}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          id={id}
          value={value || ""}
          placeholder={fallback}
          maxLength={80}
          onChange={(event) => onChange(event.target.value)}
        />
        {allowReset && (
          <button
            type="button"
            className="admin-color-reset"
            aria-label={`Mặc định ${lower}`}
            title="Dùng màu mặc định"
            onClick={() => onChange("")}
          >
            ↺
          </button>
        )}
      </div>
    </div>
  );
}

/** Ô số; để trống trả về "" để dùng mặc định. */
export function NumberField({ label, value, onChange, fallback, min = 0, max = 80, step = 1 }) {
  const id = useId();
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        placeholder={String(fallback ?? "Tự động")}
        onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))}
      />
    </div>
  );
}

/** Danh sách chọn; options dạng [[giá trị, nhãn], ...]. */
export function ChoiceField({ label, value, onChange, options }) {
  const id = useId();
  return (
    <div className="admin-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
