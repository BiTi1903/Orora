import { toCss } from "./typography.js";

export const SLOGAN_SYMBOLS = [
  ["sparkle", "Lấp lánh"], ["star", "Ngôi sao"], ["heart", "Trái tim"],
  ["flower", "Bông hoa"], ["leaf", "Chiếc lá"], ["sun", "Mặt trời"],
  ["moon", "Mặt trăng"], ["diamond", "Kim cương"], ["quote", "Dấu trích dẫn"],
  ["crown", "Vương miện"], ["butterfly", "Bươm bướm"], ["bow", "Nơ"],
  ["smile", "Nụ cười"], ["infinity", "Vô cực"], ["custom", "Ký tự riêng"], ["none", "Không biểu tượng"],
];

const number = (value, fallback, min, max) => value === "" || value == null || !Number.isFinite(Number(value)) ? fallback : Math.min(max, Math.max(min, Number(value)));
const choice = (value, options, fallback) => options.includes(value) ? value : fallback;
const color = (value, fallback) => typeof value === "string" && /^(?:#[\da-f]{3,8}|(?:rgb|hsl)a?\([\d.,%+\-\s/deg]+\)|[a-z]{1,24})$/i.test(value.trim()) ? value.trim() : fallback;
const shadows = { none: "none", soft: "0 4px 18px #3a152609", medium: "0 10px 30px #b8446d19", lifted: "0 18px 42px #3a152626" };

export function sloganAppearance(value = {}) {
  const s = value || {};
  const align = choice(s.textAlign, ["left", "center", "right"], "left");
  const symbol = choice(s.symbol, SLOGAN_SYMBOLS.map(([id]) => id), "none");
  const symbolColor = color(s.symbolColor, "var(--rose-deep)");
  const style = { textAlign: align, "--slogan-justify": { left: "flex-start", center: "center", right: "flex-end" }[align] };
  if (s.backgroundType === "solid") style.background = color(s.backgroundColor, "#fffafb");
  if (s.backgroundType === "gradient") style.background = `linear-gradient(${number(s.gradientAngle, 145, 0, 360)}deg, ${color(s.backgroundColor, "#fffafb")}, ${color(s.gradientColor, "#fff0f6")})`;
  if (s.backgroundType === "transparent") style.background = "transparent";
  for (const [key, fallback, max] of [["borderWidth", 1, 8], ["borderRadius", 16, 64], ["paddingTop", 22, 80], ["paddingRight", 18, 80], ["paddingBottom", 22, 80], ["paddingLeft", 18, 80]]) {
    if (s[key] !== "" && s[key] != null) style[key] = `${number(s[key], fallback, 0, max)}px`;
  }
  if (s.borderColor) style.borderColor = color(s.borderColor, "var(--line)");
  if (s.borderStyle) style.borderStyle = choice(s.borderStyle, ["solid", "dashed", "dotted", "none"], "solid");
  if (Object.hasOwn(shadows, s.shadow)) style.boxShadow = shadows[s.shadow];
  if (s.gap !== "" && s.gap != null) style["--slogan-gap"] = `${number(s.gap, 12, 0, 48)}px`;
  if (s.mobilePadding !== "" && s.mobilePadding != null) style["--slogan-mobile-padding"] = `${number(s.mobilePadding, 18, 0, 40)}px`;
  const symbolStyle = {
    color: symbolColor,
    "--slogan-symbol-size": `${number(s.symbolSize, 23, 8, 120)}px`,
    "--slogan-symbol-rotation": `${number(s.symbolRotation, 0, -180, 180)}deg`,
  };
  if (number(s.symbolMobileSize, 0, 0, 96) > 0) symbolStyle["--slogan-symbol-mobile-size"] = `${number(s.symbolMobileSize, 23, 8, 96)}px`;
  if (["circle", "rounded", "square"].includes(s.symbolBadge)) {
    symbolStyle.background = color(s.symbolBackground, "#fce3ed");
    symbolStyle.padding = "10px";
    symbolStyle.borderRadius = { circle: "50%", rounded: "14px", square: "0" }[s.symbolBadge];
  }
  return {
    style, symbolStyle, symbol,
    customSymbol: typeof s.customSymbol === "string" ? Array.from(s.customSymbol).slice(0, 12).join("") : "",
    solid: s.symbolFill !== "outline",
    symbolPosition: choice(s.symbolPosition, ["top", "heading", "bottom"], "top"),
    symbolEffect: choice(s.symbolEffect, ["none", "float", "pulse", "twinkle"], "none"),
    showTitle: s.showTitle !== false,
    decorations: choice(s.decorations, ["none", "corners", "scattered"], "none"),
    decorationStyle: { color: color(s.decorationColor, symbolColor), opacity: number(s.decorationOpacity, 12, 0, 35) / 100, "--slogan-decoration-size": `${number(s.decorationSize, 64, 16, 140)}px` },
    divider: choice(s.divider, ["none", "solid", "dashed", "dotted"], "none"),
    dividerColor: color(s.dividerColor, "var(--line)"),
  };
}

export function sloganTextStyle(value = {}) {
  const style = toCss(value);
  if (["none", "underline", "line-through", "underline line-through"].includes(value?.textDecoration)) style.textDecoration = value.textDecoration;
  return style;
}
