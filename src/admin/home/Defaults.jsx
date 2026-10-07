export const defaultExtras = {
  marqueeWords: [
    "Dịu nhẹ cho da",
    "Thành phần thuần khiết",
    "Không paraben",
    "Cấp ẩm sâu",
    "Rạng rỡ mỗi ngày",
  ],

  featuresLabel: "ORORA",
  featuresTitle: "Nâng cấp bản thân",

  features: [
    {
      icon: "❀",
      title: "Thành phần lành tính",
      text: "Công thức ưu tiên chiết xuất thiên nhiên, phù hợp cả làn da nhạy cảm.",
    },
    {
      icon: "☾",
      title: "Cấp ẩm suốt ngày dài",
      text: "Thấm nhanh, không bết dính, để da mềm mượt từ sáng đến tối.",
    },
    {
      icon: "✧",
      title: "Hương thơm thanh tao",
      text: "Mùi hương nhẹ nhàng như một khoảnh khắc thư giãn cho riêng bạn.",
    },
    {
      icon: "♡",
      title: "Đóng gói tinh tế",
      text: "Thiết kế xinh xắn, làm quà tặng cho chính mình hay người thương đều đẹp.",
    },
  ],

  collectionLabel: "COLLECTION",
  collectionTitle: "Explore",
  collectionHighlight: "the details.",

  philosophyLabel: "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦",
  philosophyText:
    "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.",
  philosophyAccentCount: 4,

  storyLabel: "CÂU CHUYỆN CỦA CHÚNG TÔI",
  storyTitle: "Đẹp từ những điều",
  storyHighlight: "giản dị",

  storyText:
    "Chúng tôi bắt đầu từ mong muốn nhỏ: chọn lọc vài sản phẩm chăm sóc da thật sự hiệu quả, an toàn và dễ dùng mỗi ngày. Không quá nhiều bước, chỉ những điều cần thiết để bạn tự tin với làn da của mình.",

  storyStats: [
    {
      value: 5,
      suffix: "+",
      label: "Sản phẩm chọn lọc",
    },
    {
      value: 1000,
      suffix: "+",
      label: "Khách hàng yêu thích",
    },
    {
      value: 98,
      suffix: "%",
      label: "Hài lòng",
    },
  ],
aboutStyles: {
  label: {
    fontFamily: '"Mulish", sans-serif',
    fontSize: 12,
    fontWeight: 500,
    color: "#B8446D",
    letterSpacing: "4px",
    lineHeight: 1.2,
    fontStyle: "normal",
  },

  title: {
    fontFamily: '"Playfair Display", serif',
    fontSize: 80,
    fontWeight: 600,
    color: "#321525",
    letterSpacing: "-2px",
    lineHeight: 0.95,
    fontStyle: "normal",
  },

  highlight: {
    fontFamily: '"Playfair Display", serif',
    fontSize: 80,
    fontWeight: 400,
    color: "#D96B92",
    letterSpacing: "-2px",
    lineHeight: 0.95,
    fontStyle: "italic",
  },

  text: {
    fontFamily: '"Mulish", sans-serif',
    fontSize: 16,
    fontWeight: 300,
    color: "#6F5A66",
    letterSpacing: "0px",
    lineHeight: 1.85,
    fontStyle: "normal",
  },

  statValue: {
    fontFamily: '"Playfair Display", serif',
    fontSize: 50,
    fontWeight: 600,
    color: "#B8446D",
    letterSpacing: "0px",
    lineHeight: 1,
    fontStyle: "normal",
  },

  statLabel: {
    fontFamily: '"Mulish", sans-serif',
    fontSize: 13,
    fontWeight: 400,
    color: "#6F5A66",
    letterSpacing: "0px",
    lineHeight: 1.3,
    fontStyle: "normal",
  },
},
  ritualLabel: "QUY TRÌNH ĐƠN GIẢN",
  ritualTitle: "3 bước cho làn da",
  ritualHighlight: "rạng rỡ",

  steps: [
    {
      n: "01",
      t: "Làm sạch",
      d: "Loại bỏ bụi bẩn và dầu thừa nhẹ nhàng.",
    },
    {
      n: "02",
      t: "Dưỡng ẩm",
      d: "Nuôi dưỡng da căng mọng, mềm mại.",
    },
    {
      n: "03",
      t: "Bảo vệ",
      d: "Giữ làn da khỏe trước tác động môi trường.",
    },
  ],

  testimonialsLabel: "CẢM NHẬN",
  testimonialsTitle: "Được",
  testimonialsHighlight: "yêu thích",
  testimonialsTitleEnd: "bởi những cô nàng như bạn",

  reviews: [
    {
      name: "Khách hàng A",
      text: "Da mình mềm và dịu hơn hẳn sau vài tuần dùng. Mùi hương rất dễ chịu.",
    },
    {
      name: "Khách hàng B",
      text: "Bao bì xinh, dùng lên không bết dính. Mình đã mua tặng bạn thân.",
    },
    {
      name: "Khách hàng C",
      text: "Sản phẩm nhẹ nhàng, phù hợp da nhạy cảm như mình.",
    },
  ],

  newsletterTitle: "Nhận ưu đãi",
  newsletterHighlight: "ngay",

  newsletterText:
    "Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn.",

  footerLogo: "ORORA",
  footerDescription:
    "Chăm sóc làn da, nuôi dưỡng sự tự tin.",

  footerInstagram: "#",
  footerFacebook: "#",
  footerTikTok: "#",

  footerCopyright:
    "© 2026 ORORA. All rights reserved.",
};

const pick = (data, key) =>
  data?.[key]?.length
    ? data[key]
    : defaultExtras[key];

/* Các danh sách rỗng thì quay về mặc định */
export const mergeExtras = (data = {}) => ({
  features: pick(data, "features"),
  storyStats: pick(data, "storyStats"),
  steps: pick(data, "steps"),
  reviews: pick(data, "reviews"),
  marqueeWords: pick(data, "marqueeWords"),
});

/* Văn bản nhiều dòng → mảng */
export const toLines = (text = "") =>
  text
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);