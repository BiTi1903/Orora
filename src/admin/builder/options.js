
const FONT_OPTIONS = [
  "Mulish",
  "Noto Sans",
  "Noto Serif",
  "Playfair Display",
  "Cormorant Garamond",
  "Montserrat",
  "Poppins",
  "Inter",
  "DM Sans",
  "Lora",
  "Roboto",
  "Arial",
  "Georgia",
  "Times New Roman",
];

const SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40,
  48, 56, 64, 72, 80, 96, 100,
];

const WEIGHT_OPTIONS = [
  300,
  400,
  500,
  600,
  700,
  800,
];

const LETTER_OPTIONS = [
  -2,
  -1,
  0,
  0.5,
  1,
  2,
  3,
  4,
  6,
];

const LINE_OPTIONS = [
  0.9,
  1,
  1.1,
  1.2,
  1.3,
  1.4,
  1.5,
  1.6,
  1.7,
  1.8,
  2,
];

const SPACE_OPTIONS = [
  0,
  4,
  8,
  12,
  16,
  20,
  24,
  32,
  40,
  48,
  60,
  80,
  100,
  120,
  140,
];


const SERIF_FONTS = new Set([
  "Cormorant Garamond",
  "Playfair Display",
  "Lora",
  "Noto Serif",
  "Georgia",
  "Times New Roman",
]);

function toFullFontFamily(name) {
  if (!name) return name;
  if (String(name).includes(",")) return name;
  const stack = SERIF_FONTS.has(name) ? "serif" : "sans-serif";
  return `"${name}", ${stack}`;
}

/** '"Cormorant Garamond", serif' → "Cormorant Garamond" (for select) */
function toBareFontFamily(value) {
  if (!value) return "";
  const m = String(value).match(/"([^"]+)"/);
  if (m) return m[1];
  return String(value).split(",")[0].trim().replace(/"/g, "");
}

export {
  FONT_OPTIONS,
  SIZE_OPTIONS,
  WEIGHT_OPTIONS,
  LETTER_OPTIONS,
  LINE_OPTIONS,
  SPACE_OPTIONS,
  toFullFontFamily,
  toBareFontFamily,
};
