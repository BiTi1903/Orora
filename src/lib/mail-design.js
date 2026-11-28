export const MAIL_CODE_LIMIT = 30000;
export const DEFAULT_MAIL_CODE = '<div style="padding:16px; background-color:#fff8fb;">\n  {{content}}\n</div>';

export const MAIL_COLOR_THEMES = [
  {
    id: "orora-plum",
    name: "ORORA Signature",
    swatch: ["#3a1526", "#b53c77", "#fff8fb"],
    colors: {
      background: "#f9f3f6",
      surface: "#ffffff",
      header: "#3a1526",
      headerText: "#fff8fb",
      taglineColor: "#f3c4d6",
      headerBorder: "#d98ca7",
      headingColor: "#3a1526",
      accent: "#b8446d",
      cardBg: "#fff8fb",
      cardBorder: "#f2d8e3",
      footer: "#fdf8fa",
      footerText: "#6c515e",
      button: "#b53c77",
      buttonText: "#ffffff",
      text: "#3f2732",
      border: "#efe0e7",
    },
  },
  {
    id: "rose-editorial",
    name: "Rose Editorial",
    swatch: ["#fcebf1", "#9a3358", "#ffffff"],
    colors: {
      background: "#fdf6f9",
      surface: "#ffffff",
      header: "#fcebf1",
      headerText: "#4a192f",
      taglineColor: "#9a3358",
      headerBorder: "#f0c2d3",
      headingColor: "#4a192f",
      accent: "#9a3358",
      cardBg: "#fff9fb",
      cardBorder: "#f3d5e1",
      footer: "#fcf4f7",
      footerText: "#6e4f5d",
      button: "#9a3358",
      buttonText: "#ffffff",
      text: "#3d2530",
      border: "#f0dce4",
    },
  },
  {
    id: "minimal-ivory",
    name: "Minimal Ivory",
    swatch: ["#2c221e", "#8c5a44", "#faf6f0"],
    colors: {
      background: "#f5f0e8",
      surface: "#ffffff",
      header: "#faf6f0",
      headerText: "#2c221e",
      taglineColor: "#8c6d5e",
      headerBorder: "#e4d8ca",
      headingColor: "#2c221e",
      accent: "#8c5a44",
      cardBg: "#fbf8f4",
      cardBorder: "#e8ded2",
      footer: "#faf6f0",
      footerText: "#6b5b52",
      button: "#2c221e",
      buttonText: "#ffffff",
      text: "#382e29",
      border: "#e6dcd0",
    },
  },
  {
    id: "midnight-luxe",
    name: "Midnight Luxe",
    swatch: ["#1d1420", "#c95b82", "#f6f0f4"],
    colors: {
      background: "#f3eef2",
      surface: "#ffffff",
      header: "#1d1420",
      headerText: "#fff7fb",
      taglineColor: "#e6b8c9",
      headerBorder: "#c95b82",
      headingColor: "#241628",
      accent: "#b5426c",
      cardBg: "#fcf7fa",
      cardBorder: "#ead6e0",
      footer: "#f8f3f6",
      footerText: "#63505c",
      button: "#241628",
      buttonText: "#fff7fb",
      text: "#332430",
      border: "#e5dae2",
    },
  },
];

export const FRAME_COLORS = {
  background: ["Nền ngoài thư", "#f9f3f6"],
  surface: ["Nền nội dung", "#ffffff"],
  header: ["Nền đầu thư", "#3a1526"],
  headerText: ["Chữ thương hiệu", "#fff8fb"],
  taglineColor: ["Chữ dòng phụ thương hiệu", "#f3c4d6"],
  headerBorder: ["Viền dưới đầu thư", "#d98ca7"],
  headingColor: ["Màu tiêu đề", "#3a1526"],
  accent: ["Màu nhấn & liên kết", "#b8446d"],
  cardBg: ["Nền thẻ nổi bật", "#fff8fb"],
  cardBorder: ["Viền thẻ nổi bật", "#f2d8e3"],
  footer: ["Nền chân thư", "#fdf8fa"],
  footerText: ["Màu chữ chân thư", "#6c515e"],
  button: ["Nền nút hành động", "#b53c77"],
  buttonText: ["Chữ trên nút", "#ffffff"],
  text: ["Chữ nội dung thư", "#3f2732"],
  border: ["Màu viền khung", "#efe0e7"],
};

export const FRAME_SIZES = {
  codeLabelSize: ["Cỡ chữ nhãn mã đơn", 11, 10, 24],
  orderCodeSize: ["Cỡ chữ mã đơn", 22, 12, 36],
  orderCodeMobileSize: ["Cỡ mã đơn trên điện thoại", 22, 12, 32],
  deliverySize: ["Cỡ chữ giao nhận", 14, 12, 24],
  deliveryMobileSize: ["Cỡ giao nhận trên điện thoại", 14, 12, 24],
  detailSize: ["Cỡ chữ bảng chi tiết", 14, 12, 24],
  detailMobileSize: ["Cỡ bảng trên điện thoại", 14, 12, 24],
  fontSize: ["Cỡ chữ nội dung", 15, 12, 24],
  mobileFontSize: ["Cỡ chữ điện thoại", 15, 12, 22],
  brandSize: ["Cỡ chữ thương hiệu", 30, 18, 44],
  logoWidth: ["Chiều rộng logo", 140, 48, 260],
  headingSize: ["Cỡ chữ tiêu đề", 25, 18, 36],
  headingMobileSize: ["Cỡ tiêu đề điện thoại", 21, 16, 30],
  buttonFontSize: ["Cỡ chữ nút", 14, 12, 20],
  buttonRadius: ["Bo góc nút", 999, 0, 999],
  width: ["Chiều rộng tối đa", 600, 320, 800],
  radius: ["Bo góc", 18, 0, 48],
  thickness: ["Độ dày viền", 1, 0, 8],
};

export const MAIL_COPY = {
  deliveryRecipientLabel: ["Nhãn người nhận", "Người nhận", 80],
  deliveryPhoneLabel: ["Nhãn số điện thoại", "Số điện thoại", 80],
  deliveryEmailLabel: ["Nhãn email", "Email", 80],
  deliveryAddressLabel: ["Nhãn địa chỉ", "Địa chỉ", 80],
  deliveryPaymentLabel: ["Nhãn thanh toán", "Thanh toán", 80],
  deliveryTrackingLabel: ["Nhãn mã vận đơn", "Mã vận đơn", 80],
  deliveryNoteLabel: ["Nhãn ghi chú", "Ghi chú", 80],
  codeLabel: ["Nhãn mã đơn", "Mã đơn hàng", 80],
  placedLabel: ["Nhãn thời gian đặt", "Đặt lúc:", 80],
  paidLabel: ["Nhãn đã thanh toán", "Đã thanh toán", 80],
  unpaidLabel: ["Nhãn chưa thanh toán", "Chưa thanh toán", 80],
  productLabel: ["Tên cột sản phẩm", "Sản phẩm", 80],
  qtyLabel: ["Tên cột số lượng", "SL", 80],
  amountLabel: ["Tên cột thành tiền", "Thành tiền", 80],
  variantLabel: ["Nhãn phân loại", "Phân loại:", 80],
  subtotalLabel: ["Nhãn tạm tính", "Tạm tính", 80],
  shippingLabel: ["Nhãn phí giao hàng", "Phí giao hàng", 80],
  totalLabel: ["Nhãn tổng thanh toán", "Tổng thanh toán", 80],
  brand: ["Tên thương hiệu", "ORORA", 60],
  tagline: ["Dòng dưới tên thương hiệu", "Luxury Skincare · Vietnam", 100],
  logoUrl: ["Link ảnh logo (HTTPS)", "", 1000],
  eyebrow: ["Nhãn huy hiệu đầu thư", "", 80],
  preheader: ["Dòng xem trước trong hộp thư", "", 140],
  heading: ["Tiêu đề lớn trong thư", "", 160],
  bannerUrl: ["Ảnh banner đầu thư (HTTPS)", "", 1000],
  bannerAlt: ["Mô tả ảnh banner", "", 120],
  buttonLabel: ["Chữ trên nút", "", 80],
  buttonUrl: ["Đường dẫn nút (HTTPS)", "", 1000],
  couponTitle: ["Tiêu đề hộp ưu đãi", "Quà tặng thành viên mới", 80],
  couponCode: ["Mã ưu đãi", "", 40],
  couponNote: ["Ghi chú ưu đãi", "Áp dụng cho đơn hàng đầu tiên tại ORORA", 180],
  pillar1Title: ["Ô giá trị 1 · Tiêu đề", "Dịu nhẹ", 40],
  pillar1Desc: ["Ô giá trị 1 · Mô tả", "Tuyển chọn công thức lành tính cho làn da", 120],
  pillar2Title: ["Ô giá trị 2 · Tiêu đề", "Đặc quyền", 40],
  pillar2Desc: ["Ô giá trị 2 · Mô tả", "Nhận sớm thông tin ra mắt & ưu đãi riêng", 120],
  pillar3Title: ["Ô giá trị 3 · Tiêu đề", "Tận tâm", 40],
  pillar3Desc: ["Ô giá trị 3 · Mô tả", "Tư vấn 1-1 phù hợp với chu trình của bạn", 120],
  orderStep1: ["Nhãn bước 1", "1. Đã tiếp nhận", 40],
  orderStep2: ["Nhãn bước 2", "2. Xác nhận & đóng gói", 40],
  orderStep3: ["Nhãn bước 3", "3. Giao hàng tận nơi", 40],
  orderItemsHeading: ["Tiêu đề bảng sản phẩm", "Chi tiết đơn hàng", 60],
  orderDeliveryHeading: ["Tiêu đề khối giao nhận", "Thông tin giao nhận", 60],
  footerNote: ["Ghi chú chân thư", "", 260],
  footerSiteLabel: ["Tên link website", "Website ORORA", 60],
  footerPolicyLabel: ["Tên link chính sách", "Chính sách mua hàng", 60],
  footerAddress: ["Địa chỉ / Hotline chân thư", "", 180],
  footerCopyright: ["Dòng bản quyền", "", 120],
};

export const MAIL_PLACEHOLDERS = {
  logoUrl: "https://... (để trống sẽ hiển thị chữ thương hiệu)",
  eyebrow: "Mặc định tự động theo loại thư",
  preheader: "Tóm tắt ngắn hiện cạnh tiêu đề trong Gmail / Outlook…",
  heading: "Để trống sẽ tự dùng Tiêu đề thư",
  bannerUrl: "https://... (tùy chọn ảnh ngang đầu nội dung)",
  bannerAlt: "Mô tả ngắn cho ảnh banner",
  buttonLabel: "Để trống dùng nhãn mặc định theo loại thư",
  buttonUrl: "https://ororavn.com/...",
  couponCode: "Ví dụ: ORORA10, THANKYOU15",
  footerNote: "Để trống sẽ dùng câu hỗ trợ mặc định theo loại thư",
  footerAddress: "Ví dụ: Hotline 090... · TP. Hồ Chí Minh",
  footerCopyright: "Để trống tự hiện © Năm ORORA Vietnam",
};

const mailFonts = {
  notoSerif: "Noto Serif",
  system: "Hệ thống",
  arial: "Arial",
  georgia: "Georgia",
  times: "Times New Roman",
  trebuchet: "Trebuchet MS",
  verdana: "Verdana",
  tahoma: "Tahoma",
  palatino: "Palatino",
  garamond: "Garamond",
  cambria: "Cambria",
  calibri: "Calibri",
};

export const MAIL_OPTIONS = {
  orderCodeWeight: ["Độ đậm mã đơn", {bold:"Đậm", normal:"Thường"}],
  orderCodeFont: ["Phông chữ mã đơn", {mono:"Đơn cách", ...mailFonts}],
  deliveryFont: ["Phông chữ giao nhận", {inherit:"Theo nội dung thư", ...mailFonts}],
  detailFont: ["Phông chữ bảng chi tiết", {inherit:"Theo nội dung thư", ...mailFonts}],
  font: ["Phông chữ nội dung", mailFonts],
  headerFont: ["Phông chữ thương hiệu", mailFonts],
  headingFont: ["Phông chữ tiêu đề", mailFonts],
  align: ["Căn nội dung", { left: "Trái", center: "Giữa", right: "Phải" }],
  headingAlign: ["Căn tiêu đề", { auto: "Theo mẫu", left: "Trái", center: "Giữa", right: "Phải" }],
  buttonAlign: ["Căn nút hành động", { center: "Giữa", left: "Trái", right: "Phải" }],
  weight: ["Độ đậm", { normal: "Thường", bold: "Đậm" }],
  headingWeight: ["Độ đậm tiêu đề", { "600": "Vừa đậm (600)", "400": "Thường (400)", "700": "Đậm (700)" }],
  orderLayout: [
    "Thứ tự bố cục đơn hàng",
    {
      "hero-first": "Thẻ mã đơn trước lời nhắn",
      "message-first": "Lời nhắn trước thẻ mã đơn",
    },
  ],
  orderActiveStep: [
    "Bước đơn hàng đang sáng",
    {
      "1": "Bước 1 (Mới nhận đơn)",
      "2": "Bước 2 (Đã xác nhận / Đóng gói)",
      "3": "Bước 3 (Đang giao / Hoàn tất)",
    },
  ],
};

export const MAIL_TOGGLES = {
  showHeader: ["Hiển thị đầu thư (Header)", true],
  showEyebrow: ["Hiển thị nhãn huy hiệu đầu thư", true],
  showHeading: ["Hiển thị tiêu đề lớn trong thư", true],
  showDivider: ["Hiển thị gạch trang trí dưới tiêu đề", true],
  showPillars: ["Hiển thị 3 ô giá trị thương hiệu", true],
  showCoupon: ["Hiển thị hộp mã ưu đãi / quà tặng", false],
  showButton: ["Hiển thị nút hành động (CTA)", true],
  showOrderHero: ["Hiển thị thẻ Mã đơn hàng", true],
  showOrderSteps: ["Hiển thị thanh tiến trình 3 bước", true],
  showOrderItems: ["Hiển thị bảng sản phẩm & tổng tiền", true],
  showOrderDelivery: ["Hiển thị khối thông tin giao nhận", true],
  showOrderBank: ["Hiển thị khối chuyển khoản & VietQR", true],
  showFooter: ["Hiển thị chân thư (Footer)", true],
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
  for (const [key, [, fallback]] of Object.entries(MAIL_TOGGLES)) {
    result[key] = typeof input?.[key] === "boolean" ? input[key] : fallback;
  }
  result.useHtml = input?.useHtml === true;
  result.htmlSource = typeof input?.htmlSource === "string" ? input.htmlSource.slice(0, MAIL_CODE_LIMIT) : DEFAULT_MAIL_CODE;
  return result;
}

export function sameMailDesign(left, right) {
  return JSON.stringify(mailDesign(left)) === JSON.stringify(mailDesign(right));
}
