const DEFAULT_STYLE = {
  fontFamily: "Mulish",
  fontSize: 16,
  fontWeight: 400,
  color: "#3a1526",
  italic: false,
  letterSpacing: 0,
  lineHeight: 1.5,
  textAlign: "left",
  marginTop: 0,
  marginBottom: 0,
  paddingTop: 0,
  paddingBottom: 0,
  maxWidth: 100,
};

const DEFAULT_ABOUT = {
  section: {
    background: "#fffafc",
    paddingTop: 140,
    paddingBottom: 140,
    gap: 7,
  },

  label: {
    text: "CÂU CHUYỆN CỦA CHÚNG TÔI",
    style: {
      ...DEFAULT_STYLE,
      fontSize: 12,
      fontWeight: 500,
      color: "#b8446d",
      letterSpacing: 4,
      lineHeight: 1.2,
      textAlign: "left",
    },
  },

  title: {
    text: "Đẹp từ những điều",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Cormorant Garamond",
      fontSize: 80,
      fontWeight: 600,
      color: "#3a1526",
      letterSpacing: -2,
      lineHeight: 0.95,
      textAlign: "left",
    },
  },

  highlight: {
    text: "giản dị",
    style: {
      ...DEFAULT_STYLE,
      fontFamily: "Cormorant Garamond",
      fontSize: 80,
      fontWeight: 400,
      color: "#e2678f",
      italic: true,
      letterSpacing: -2,
      lineHeight: 0.95,
      textAlign: "left",
    },
  },

  text: {
    text:
      "Chúng tôi bắt đầu từ mong muốn nhỏ: chọn lọc vài sản phẩm chăm sóc da thật sự hiệu quả, an toàn và dễ dùng mỗi ngày. Không quá nhiều bước, chỉ những điều cần thiết để bạn tự tin với làn da của mình.",
    style: {
      ...DEFAULT_STYLE,
      fontSize: 16,
      fontWeight: 300,
      color: "#755968",
      lineHeight: 1.85,
      textAlign: "left",
      maxWidth: 440,
    },
  },

  image: {
    src: "/about.jpg",
    extras: ["", "", ""],
    width: 52,
    height: 620,
    radius: 200,
    borderWidth: 8,
  },

  stats: [
    {
      value: "test",
      suffix: "",
      label: "Sản phẩm chọn lọc",
    },
    {
      value: "test",
      suffix: "",
      label: "Khách hàng yêu thích",
    },
    {
      value: "test",
      suffix: "",
      label: "Hài lòng",
    },
  ],

  statValue: {
    ...DEFAULT_STYLE,
    fontFamily: "Cormorant Garamond",
    fontSize: 50,
    fontWeight: 600,
    color: "#b8446d",
    lineHeight: 1,
  },

  statLabel: {
    ...DEFAULT_STYLE,
    fontSize: 13,
    fontWeight: 400,
    color: "#755968",
    lineHeight: 1.4,
  },
};


export { DEFAULT_STYLE, DEFAULT_ABOUT };