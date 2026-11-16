import { FONT_NAMES, toFullFontFamily, toBareFontFamily } from "../../lib/typography.js";

const FONT_OPTIONS = ["", ...FONT_NAMES];

const SIZE_OPTIONS = [
  12, 13, 14, 16, 18, 20, 24, 28, 32, 36, 40,
  48, 56, 64, 72, 80, 96, 100, 120, 130,
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
  -3,
  -2,
  -1,
  -.5,
  0,
  0.5,
  1,
  2,
  3,
  4,
  6,
];

const LINE_OPTIONS = [
  0.9, 0.92, 0.95,
  1,
  1.1,
  1.2,
  1.3,
  1.4,
  1.5,
  1.6,
  1.7,
  1.8,
  1.9,
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
