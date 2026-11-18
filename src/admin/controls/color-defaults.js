// Màu mặc định hiển thị trong bộ chỉnh admin (gợi ý/placeholder khi chưa lưu giá trị).
// Chỉ là giá trị dự phòng của giao diện chỉnh — không ghi vào cấu hình nếu admin không đổi.
export const ADMIN_COLOR_DEFAULTS = {
  primary: "#b8446d",
  ink: "#3a1526",
  white: "#ffffff",
  surfaceTint: "#fffafc",
  softBorder: "#efd7e1",
  cardBorder: "#edd5df",
  cardBackground: "#fffafb",
  gradientTo: "#fff0f6",
  dark: "#171717",
};

export const CHAT_CHANNEL_COLOR_DEFAULTS = {
  backgroundColor: ADMIN_COLOR_DEFAULTS.surfaceTint,
  borderColor: ADMIN_COLOR_DEFAULTS.softBorder,
};

export const ORDER_TRACKING_COLOR_DEFAULTS = {
  accent: ADMIN_COLOR_DEFAULTS.primary,
  background: ADMIN_COLOR_DEFAULTS.white,
  border: ADMIN_COLOR_DEFAULTS.softBorder,
};

export const PRODUCT_CONTACT_COLOR_DEFAULTS = {
  primaryBackground: ADMIN_COLOR_DEFAULTS.primary,
  primaryColor: ADMIN_COLOR_DEFAULTS.white,
  secondaryBackground: ADMIN_COLOR_DEFAULTS.white,
  secondaryColor: ADMIN_COLOR_DEFAULTS.primary,
};

export const PURCHASE_BUTTON_COLOR_DEFAULTS = {
  websiteBackground: ADMIN_COLOR_DEFAULTS.primary,
  tiktokBackground: ADMIN_COLOR_DEFAULTS.dark,
  facebookBackground: "#0866ff",
};

export const BUILDER_COLOR_DEFAULTS = {
  collectionBorder: ADMIN_COLOR_DEFAULTS.white,
  navDrawerBackground: ADMIN_COLOR_DEFAULTS.surfaceTint,
  tickerBand: ADMIN_COLOR_DEFAULTS.surfaceTint,
};

export const PRODUCT_DETAIL_COLOR_DEFAULTS = {
  accentColor: "#e2678f",
  borderColor: ADMIN_COLOR_DEFAULTS.white,
  activeBorderColor: ADMIN_COLOR_DEFAULTS.primary,
  buttonBackground: ADMIN_COLOR_DEFAULTS.primary,
};
