export const MAIL_CODE_LIMIT = 30000;
export const DEFAULT_MAIL_CODE = '<div style="padding:16px; background-color:#fff8fb;">\n  {{content}}\n</div>';

export const FRAME_COLORS = {
  background: ["Nền ngoài thư", "#f9f3f6"],
  surface: ["Nền nội dung", "#ffffff"],
  header: ["Nền đầu thư", "#3a1526"],
  headerText: ["Chữ thương hiệu", "#fff8fb"],
  taglineColor: ["Chữ dòng dưới thương hiệu", "#f3c4d6"],
  headerBorder: ["Viền dưới đầu thư", "#d98ca7"],
  headingColor: ["Màu tiêu đề trong thư", "#3a1526"],
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
  fontSize: ["Cỡ chữ nội dung", 15, 12, 24],
  mobileFontSize: ["Cỡ chữ nội dung (điện thoại)", 15, 12, 22],
  brandSize: ["Cỡ chữ thương hiệu", 30, 18, 44],
  logoWidth: ["Chiều rộng logo", 140, 48, 260],
  headingSize: ["Cỡ chữ tiêu đề", 25, 18, 36],
  headingMobileSize: ["Cỡ chữ tiêu đề (điện thoại)", 21, 16, 30],
  buttonFontSize: ["Cỡ chữ nút", 14, 12, 20],
  buttonRadius: ["Bo góc nút", 999, 0, 999],
  width: ["Chiều rộng tối đa", 600, 320, 800],
  radius: ["Bo góc", 18, 0, 48],
  thickness: ["Độ dày viền", 1, 0, 8],
};

export const MAIL_COPY = {
  brand: ["Tên thương hiệu", "ORORA", 60],
  tagline: ["Dòng dưới tên thương hiệu", "Luxury Skincare · Vietnam", 100],
  logoUrl: ["Link ảnh logo (HTTPS, để trống dùng chữ)", "", 1000],
  eyebrow: ["Nhãn huy hiệu đầu thư (để trống dùng mặc định)", "", 80],
  preheader: ["Dòng xem trước trong hộp thư", "", 140],
  heading: ["Tiêu đề lớn trong thư (để trống lấy theo Tiêu đề thư)", "", 160],
  bannerUrl: ["Ảnh banner đầu nội dung (HTTPS, tùy chọn)", "", 1000],
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
  orderStep1: ["Bước 1 đơn hàng", "1. Đã tiếp nhận", 40],
  orderStep2: ["Bước 2 đơn hàng", "2. Xác nhận & đóng gói", 40],
  orderStep3: ["Bước 3 đơn hàng", "3. Giao hàng tận nơi", 40],
  orderItemsHeading: ["Tiêu đề bảng sản phẩm", "Chi tiết đơn hàng", 60],
  orderDeliveryHeading: ["Tiêu đề khối giao nhận", "Thông tin giao nhận", 60],
  footerNote: ["Ghi chú chân thư (để trống dùng mặc định)", "", 260],
  footerSiteLabel: ["Tên link website", "Website ORORA", 60],
  footerPolicyLabel: ["Tên link chính sách", "Chính sách mua hàng", 60],
  footerAddress: ["Địa chỉ / Hotline chân thư (tùy chọn)", "", 180],
  footerCopyright: ["Dòng bản quyền (để trống dùng mặc định)", "", 120],
};

export const MAIL_OPTIONS = {
  font: [
    "Phông chữ nội dung",
    {
      system: "Hệ thống",
      arial: "Arial",
      georgia: "Georgia",
      times: "Times New Roman",
      trebuchet: "Trebuchet MS",
      verdana: "Verdana",
    },
  ],
  headerFont: [
    "Phông chữ thương hiệu",
    {
      georgia: "Georgia (Serif)",
      system: "Hệ thống (Sans)",
      arial: "Arial",
      times: "Times New Roman",
    },
  ],
  headingFont: [
    "Phông chữ tiêu đề",
    {
      georgia: "Georgia (Serif)",
      system: "Hệ thống (Sans)",
      arial: "Arial",
      times: "Times New Roman",
      trebuchet: "Trebuchet MS",
    },
  ],
  align: ["Căn nội dung", { left: "Trái", center: "Giữa", right: "Phải" }],
  headingAlign: ["Căn tiêu đề", { auto: "Theo mẫu", left: "Trái", center: "Giữa", right: "Phải" }],
  buttonAlign: ["Căn nút hành động", { center: "Giữa", left: "Trái", right: "Phải" }],
  weight: ["Độ đậm", { normal: "Thường", bold: "Đậm" }],
  headingWeight: ["Độ đậm tiêu đề", { "600": "Vừa đậm (600)", "400": "Thường (400)", "700": "Đậm (700)" }],
  orderLayout: [
    "Thứ tự khối đơn hàng",
    {
      "hero-first": "Thẻ mã đơn trước lời nhắn",
      "message-first": "Lời nhắn trước thẻ mã đơn",
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
