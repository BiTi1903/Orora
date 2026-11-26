// Register every public home block here so Visual Builder always exposes its visibility switch.
// settingsKey binds newer blocks to the same enabled flag used by their content editor.
export const PAGE_SECTIONS = [
  {
    key: "navbar",
    label: "Navbar",
    icon: "≡",
  },
  {
    key: "hero",
    label: "Hero",
    icon: "✦",
  },
  {
    key: "ticker",
    label: "Dải chữ chạy",
    icon: "↔",
  },
  {
    key: "about",
    label: "Câu chuyện",
    icon: "♡",
  },
  {
    key: "philosophy",
    label: "Triết lý",
    icon: "✦",
  },
  { key: "productneeds", label: "Chọn theo nhu cầu", icon: "◇", settingsKey: "productNeeds" },
  { key: "productfaq", label: "FAQ sản phẩm", icon: "?", settingsKey: "productFaq" },
  { key: "productcare", label: "Cách chăm sóc", icon: "♡", settingsKey: "productCareGuide" },
  {
    key: "collection",
    label: "Sản phẩm",
    icon: "◇",
  },
  {
    key: "productdetail",
    label: "Chi tiết SP",
    icon: "▣",
  },
  {
    key: "features",
    label: "Nâng cấp BT",
    icon: "✧",
  },
  // {
  //   key: "steps",
  //   label: "Quy trình",
  //   icon: "03",
  //   disabled: true,
  // },
  {
    key: "reviews",
    label: "Cảm nhận",
    icon: "❝",
  },
  {
    key: "newsletter",
    label: "Nhận tin",
    icon: "✉",
  },
  {
    key: "footer",
    label: "Footer",
    icon: "⌄",
  },
  {
    key: "cartform",
    label: "Form giỏ hàng",
    icon: "🛒",
    hideVisibilityToggle: true,
  },
  {
    key: "orderform",
    label: "Form đặt hàng",
    icon: "📝",
    hideVisibilityToggle: true,
  },
  {
    key: "ordersuccess",
    label: "Form đã đặt hàng",
    icon: "✓",
    hideVisibilityToggle: true,
  },
  {
    key: "productslogan",
    label: "Slogan sản phẩm",
    icon: "✦",
    settingsKey: "productSlogan",
  },
  {
    key: "policies",
    label: "Cam kết & chính sách",
    icon: "✓",
    hideVisibilityToggle: true,
  },
  {
    key: "categories",
    label: "Danh mục sản phẩm",
    icon: "▤",
    hideVisibilityToggle: true,
  },
  {
    key: "shoplinks",
    label: "Kênh mua & thanh toán",
    icon: "🔗",
    hideVisibilityToggle: true,
  },
  {
    key: "ordertracking",
    label: "Tra cứu đơn hàng",
    icon: "⌕",
    hideVisibilityToggle: true,
  },
];

export function sectionIsEnabled(settings, key) {
  const field = PAGE_SECTIONS.find(section => section.key === key)?.settingsKey;
  return field ? settings?.[field]?.enabled !== false : settings?.sectionVisibility?.[key] !== false;
}
