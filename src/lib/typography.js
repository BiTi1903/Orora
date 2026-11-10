/* Dùng chung cho admin (chọn kiểu chữ) và trang thật (áp kiểu chữ).
   Quy ước: kiểu chữ chỉ lưu những thuộc tính admin ĐÃ chỉnh.
   Thuộc tính nào thiếu thì trang giữ nguyên giá trị trong file CSS. */

export const FONT_OPTIONS = [
  { label: "Mặc định của web", value: "" },
  { label: "Cormorant Garamond", value: '"Cormorant Garamond", serif' },
  { label: "Playfair Display", value: '"Playfair Display", serif' },
  { label: "Lora", value: '"Lora", serif' },
  { label: "Noto Serif", value: '"Noto Serif", serif' },
  { label: "Jost", value: '"Jost", sans-serif' },
  { label: "Mulish", value: '"Mulish", sans-serif' },
  { label: "Montserrat", value: '"Montserrat", sans-serif' },
  { label: "Poppins", value: '"Poppins", sans-serif' },
  { label: "Inter", value: '"Inter", sans-serif' },
  { label: "DM Sans", value: '"DM Sans", sans-serif' },
  { label: "Noto Sans", value: '"Noto Sans", sans-serif' },
  { label: "Roboto", value: '"Roboto", sans-serif' },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Arial", value: "Arial, sans-serif" },
  { label: "Times New Roman", value: '"Times New Roman", serif' },
];

// All editors share one catalog; builder stores the same CSS families as forms.
export function toBareFontFamily(value) {
  if (!value) return "";
  const text = String(value).trim();
  const quoted = /^(["'])(.*?)\1/.exec(text);
  return quoted ? quoted[2] : text.split(",")[0].trim();
}
export const FONT_NAMES = FONT_OPTIONS.filter(font => font.value).map(font => toBareFontFamily(font.value));
export function toFullFontFamily(value) {
  if (!value) return value;
  const text = String(value).trim();
  // Saved stacks/custom variables are already CSS and must not be rewritten.
  if (text.includes(",") || /^var\(/.test(text)) return value;
  return FONT_OPTIONS.find(font => font.label === text)?.value || `"${text}", sans-serif`;
}

export const WEIGHT_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "300 - Mảnh", value: 300 },
  { label: "400 - Thường", value: 400 },
  { label: "500 - Vừa", value: 500 },
  { label: "600 - Đậm vừa", value: 600 },
  { label: "700 - Đậm", value: 700 },
  { label: "800 - Rất đậm", value: 800 },
];

export const FONT_STYLE_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Bình thường", value: "normal" },
  { label: "Nghiêng", value: "italic" },
];

export const TRANSFORM_OPTIONS = [
  { label: "Mặc định", value: "" },
  { label: "Như đã nhập", value: "none" },
  { label: "CHỮ HOA", value: "uppercase" },
  { label: "Viết Hoa Chữ Đầu", value: "capitalize" },
];

/* Cỡ chữ lớn tự thu nhỏ theo bề rộng màn hình để không tràn trên điện thoại.
   Ở màn hình 1440px thì đúng bằng số admin nhập. */
function responsiveSize(n, responsive) {
  if (!responsive || n <= 28) return `${n}px`;
  return `clamp(${Math.round(n * 0.55)}px, ${(n / 14.4).toFixed(2)}vw, ${n}px)`;
}

const has = (v) => v !== undefined && v !== null && v !== "";

export function toCss(style, { responsive = true } = {}) {
  const s = style || {};
  const css = {};
  if (Number(s.mobileFontSize) > 0) css["--mobile-font-size"] = `${Number(s.mobileFontSize)}px`;

  if (has(s.fontFamily)) css.fontFamily = s.fontFamily;
  if (has(s.fontSize) && Number(s.fontSize) > 0) {
    css.fontSize = responsiveSize(Number(s.fontSize), responsive);
  }
  if (has(s.fontWeight)) css.fontWeight = Number(s.fontWeight);
  if (has(s.color)) css.color = s.color;
  if (has(s.letterSpacing)) {
    css.letterSpacing =
      typeof s.letterSpacing === "number" ? `${s.letterSpacing}px` : s.letterSpacing;
  }
  if (has(s.lineHeight)) css.lineHeight = Number(s.lineHeight);
  if (has(s.fontStyle)) {
    css.fontStyle = s.fontStyle;
  } else if (s.italic === true) {
    css.fontStyle = "italic";
  } else if (s.italic === false) {
    css.fontStyle = "normal";
  }
  if (has(s.textTransform)) css.textTransform = s.textTransform;
  if (has(s.textAlign)) css.textAlign = s.textAlign;

  /* Spacing — đồng bộ với About (createTextStyle) để mọi section chỉnh được */
  if (s.marginTop != null && s.marginTop !== "") {
    css.marginTop = `${Number(s.marginTop)}px`;
  }
  if (s.marginRight != null && s.marginRight !== "") {
    css.marginRight = `${Number(s.marginRight)}px`;
  }
  if (s.marginBottom != null && s.marginBottom !== "") {
    css.marginBottom = `${Number(s.marginBottom)}px`;
  }
  if (s.marginLeft != null && s.marginLeft !== "") {
    css.marginLeft = `${Number(s.marginLeft)}px`;
  }
  if (s.paddingTop != null && s.paddingTop !== "") {
    css.paddingTop = `${Number(s.paddingTop)}px`;
  }
  if (s.paddingRight != null && s.paddingRight !== "") {
    css.paddingRight = `${Number(s.paddingRight)}px`;
  }
  if (s.paddingBottom != null && s.paddingBottom !== "") {
    css.paddingBottom = `${Number(s.paddingBottom)}px`;
  }
  if (s.paddingLeft != null && s.paddingLeft !== "") {
    css.paddingLeft = `${Number(s.paddingLeft)}px`;
  }
  if (s.maxWidth != null && s.maxWidth !== "") {
    const n = Number(s.maxWidth);
    if (!Number.isNaN(n) && n > 0) {
      /* ≤100 coi là %, >100 coi là px (giống About) */
      css.maxWidth = n <= 100 ? `${n}%` : `${n}px`;
    }
  }

  return css;
}

/* Tách màu ra khỏi style để gán qua biến CSS (giữ được hiệu ứng hover) */
export function splitColor(style) {
  const { color, ...rest } = toCss(style);
  return { color, rest };
}