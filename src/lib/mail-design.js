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
  return result;
}

export function sameMailDesign(left, right) {
  return JSON.stringify(mailDesign(left)) === JSON.stringify(mailDesign(right));
}
