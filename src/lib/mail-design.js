export const MAIL_CODE_LIMIT = 30000;
export const DEFAULT_MAIL_CODE = '<div style="padding:16px; background-color:#fff8fb;">\n  {{content}}\n</div>';

export const FRAME_COLORS = {
  background: ["Nền ngoài thư", "#f9f3f6"],
  surface: ["Nền nội dung", "#ffffff"],
  header: ["Nền đầu thư", "#3a1526"],
  footer: ["Nền chân thư", "#fdf8fa"],
  button: ["Nền nút hành động", "#b53c77"],
  buttonText: ["Chữ trên nút", "#ffffff"],
  text: ["Chữ nội dung thư", "#3f2732"],
  border: ["Màu viền khung", "#efe0e7"],
};
export const FRAME_SIZES = {
  fontSize: ["Cỡ chữ nội dung", 15, 12, 24],
  width: ["Chiều rộng tối đa", 600, 320, 800],
  radius: ["Bo góc", 18, 0, 48],
  thickness: ["Độ dày viền", 1, 0, 8],
};

export const MAIL_COPY = {
  brand: ["Tên thương hiệu", "ORORA", 60],
  tagline: ["Dòng dưới tên thương hiệu", "Luxury Skincare · Vietnam", 100],
  preheader: ["Dòng xem trước trong hộp thư", "", 140],
  buttonLabel: ["Chữ trên nút", "", 80],
  buttonUrl: ["Đường dẫn nút (HTTPS)", "", 1000],
};
export const MAIL_OPTIONS = {
  font: ["Phông chữ nội dung", { system: "Hệ thống", arial: "Arial", georgia: "Georgia" }],
  align: ["Căn nội dung", { left: "Trái", center: "Giữa", right: "Phải" }],
  weight: ["Độ đậm", { normal: "Thường", bold: "Đậm" }],
};

export function mailDesign(input) {
  const result = {};
  for (const [key, [, fallback]] of Object.entries(FRAME_COLORS)) {
    const color = input?.[key];
    result[key] = typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
  }
  for (const [key, [, fallback, min, max]] of Object.entries(FRAME_SIZES)) {
    const size = input?.[key];
    result[key] = Number.isInteger(size) && size >= min && size <= max ? size : fallback;
  }
  for (const [key, [, fallback, limit]] of Object.entries(MAIL_COPY)) {
    result[key] = typeof input?.[key] === "string" ? input[key].slice(0, limit) : fallback;
  }
  for (const [key, [, options]] of Object.entries(MAIL_OPTIONS)) {
    result[key] = Object.hasOwn(options, input?.[key]) ? input[key] : Object.keys(options)[0];
  }
  result.useHtml = input?.useHtml === true;
  result.htmlSource = typeof input?.htmlSource === "string" ? input.htmlSource.slice(0, MAIL_CODE_LIMIT) : DEFAULT_MAIL_CODE;
  return result;
}

export function sameMailDesign(left, right) {
  return JSON.stringify(mailDesign(left)) === JSON.stringify(mailDesign(right));
}
