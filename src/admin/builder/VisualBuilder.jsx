import { useEffect, useMemo, useState } from "react";
import { getHomeContent, saveHomeContent } from "../../lib/api";
import About from "../../components/About";
import Hero from "../../components/Hero";
import Collection from "../../components/Collection";
import ProductDetail from "../../components/ProductDetail";
import { Testimonials, Features } from "../../components/Extras";
import { toCss } from "../../lib/typography";
import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ScrollText from "../../components/ScrollText";
import { defaultProducts } from "../../data/content";
import "./VisualBuilder.css";


const FONT_OPTIONS = [
  "Mulish",
  "Noto Sans",
  "Noto Serif",
  "Playfair Display",
  "Cormorant Garamond",
  "Montserrat",
  "Poppins",
  "Inter",
  "DM Sans",
  "Lora",
  "Roboto",
  "Arial",
  "Georgia",
  "Times New Roman",
];

const SIZE_OPTIONS = [
  12, 14, 16, 18, 20, 24, 28, 32, 36, 40,
  48, 56, 64, 72, 80, 96, 100,
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
  -2,
  -1,
  0,
  0.5,
  1,
  2,
  3,
  4,
  6,
];

const LINE_OPTIONS = [
  0.9,
  1,
  1.1,
  1.2,
  1.3,
  1.4,
  1.5,
  1.6,
  1.7,
  1.8,
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

const DEFAULT_HERO = {
  heroEyebrow: "WELCOME TO",
  heroTitle: "ORORA",
  heroDescription: "Create something beautiful.",
  heroRotator: ["dịu nhẹ", "rạng rỡ", "tự tin", "tỏa sáng"],
  heroButtonText: "Khám phá",
  heroButtonLink: "#about",
  shopButtonText: "Xem sản phẩm",
  shopButtonLink: "#shop",
  heroImage: "/hero.jpg",
  heroChip1: "Dịu nhẹ cho da",
  heroChip2: "Thành phần thuần khiết",
  heroChip3: "Cấp ẩm sâu",
  heroRingText: "ORORA ✦ SẢN PHẨM ✦ ORORA ✦",
  heroScrollText: "CUỘN",
};

const DEFAULT_COLLECTION = {
  collectionLabel: "COLLECTION",
  collectionTitle: "Explore",
  collectionHighlight: "the details.",
  collectionStyles: {
    label: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: 3,
      color: "#b8446d",
    },
    title: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 72,
      fontWeight: 600,
      letterSpacing: -3,
      lineHeight: 0.92,
      color: "#3a1526",
    },
    highlight: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 72,
      fontWeight: 400,
      letterSpacing: -3,
      lineHeight: 0.92,
      color: "#e2678f",
      fontStyle: "italic",
    },
  },
  productCardStyles: {
    number: {
      fontSize: 12,
      letterSpacing: 1,
      color: "#e2678f",
    },
    name: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 22,
      fontWeight: 600,
      color: "#3a1526",
    },
    description: {
      fontSize: 13,
      lineHeight: 1.7,
      color: "#7d656f",
    },
    price: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 22,
      fontWeight: 600,
      color: "#b8446d",
    },
    button: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: 1,
      color: "#ffffff",
    },
  },
};

const DEFAULT_PRODUCT_DETAIL = {
  number: {
    fontSize: 12,
    fontWeight: 500,
    letterSpacing: 2,
    color: "#b8446d",
  },
  name: {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: 64,
    fontWeight: 600,
    letterSpacing: -2,
    lineHeight: 0.95,
    color: "#3a1526",
  },
  price: {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: 34,
    fontWeight: 600,
    color: "#b8446d",
  },
  description: {
    fontSize: 16,
    fontWeight: 300,
    lineHeight: 1.85,
    color: "#7d656f",
  },
  sectionTitle: {
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: 26,
    fontWeight: 600,
    color: "#3a1526",
  },
  aboutTitle: {
    text: "About the product",
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: 26,
    fontWeight: 600,
    color: "#3a1526",
    marginTop: 0,
    marginRight: 0,
    marginBottom: 20,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  },
  detailsTitle: {
    text: "Details",
    fontFamily: '"Cormorant Garamond", serif',
    fontSize: 26,
    fontWeight: 600,
    color: "#3a1526",
    marginTop: 0,
    marginRight: 0,
    marginBottom: 20,
    marginLeft: 0,
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 1.9,
    color: "#7d656f",
  },
  rowLabel: {
    fontSize: 13,
    fontWeight: 500,
    color: "#b8446d",
  },
  materialLabel: { text: "Material" },
  sizeLabel: { text: "Size" },
  colorLabel: { text: "Color" },
  originLabel: { text: "Origin" },
  detailLabels: {
    material: "Material",
    size: "Size",
    color: "Color",
    origin: "Origin",
  },
  rowValue: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#7d656f",
  },
};

const DEFAULT_FEATURES = {
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
  featuresStyles: {
    label: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: 4,
      color: "#b8446d",
    },
    title: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 600,
      color: "#3a1526",
    },
    icon: {
      fontSize: 24,
      color: "#b8446d",
    },
    cardTitle: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 25,
      fontWeight: 600,
      color: "#3a1526",
    },
    cardText: {
      fontSize: 14,
      lineHeight: 1.75,
      color: "#7d656f",
    },
  },
};

const DEFAULT_REVIEWS = {
  testimonialsLabel: "CẢM NHẬN",
  testimonialsTitle: "Được",
  testimonialsHighlight: "yêu thích",
  testimonialsTitleEnd: "bởi những cô nàng như bạn",
  reviews: [
    {
      name: "Khách hàng A",
      text: "Da mình mềm và dịu hơn hẳn sau vài tuần dùng. Mùi hương rất dễ chịu.",
      image: "",
    },
    {
      name: "Khách hàng B",
      text: "Bao bì xinh, dùng lên không bết dính. Mình đã mua tặng bạn thân.",
      image: "",
    },
    {
      name: "Khách hàng C",
      text: "Sản phẩm nhẹ nhàng, phù hợp da nhạy cảm như mình.",
      image: "",
    },
  ],
  testimonialsStyles: {
    label: {
      fontSize: 12,
      fontWeight: 500,
      letterSpacing: 4,
      color: "#b8446d",
    },
    title: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 600,
      color: "#3a1526",
    },
    highlight: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 400,
      color: "#e2678f",
      fontStyle: "italic",
    },
    titleEnd: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 600,
      color: "#3a1526",
    },
    reviewText: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 22,
      lineHeight: 1.45,
      color: "#3a1526",
    },
    reviewName: {
      fontSize: 13,
      letterSpacing: 1,
      color: "#b8446d",
    },
  },
};

const DEFAULT_FOOTER = {
  footerLogo: "ORORA",
  footerDescription: "Chăm sóc làn da, nuôi dưỡng sự tự tin.",
  footerInfoTitle: "Information",
  footerAboutText: "About us",
  footerShopText: "Shop",
  footerTermsText: "Terms & Conditions",
  footerPrivacyText: "Privacy Policy",
  footerContactTitle: "Contact",
  footerPhone: "0822.466.800",
  footerEmail: "sales@ororavn.com",
  footerAddress: "207A Nguyễn Văn Thủ, Tân Định, HCM",
  footerSocialTitle: "Follow us",
  footerInstagram: "#",
  footerFacebook: "#",
  footerTikTok: "#",
  footerYouTube: "#",
  footerCopyright: "© 2026 ORORA. All rights reserved.",
  footerCompanyNumber: "CTY TNHH ORORA No. 0123456789",
  footerStyles: {
    logo: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 34,
      fontWeight: 600,
      letterSpacing: 2,
      color: "#3a1526",
    },
    description: {
      fontSize: 14,
      lineHeight: 1.7,
      color: "#7d656f",
    },
    columnTitle: {
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 1,
      color: "#3a1526",
    },
    link: {
      fontSize: 14,
      lineHeight: 1.8,
      color: "#7d656f",
    },
    copyright: {
      fontSize: 12,
      color: "#9a7a88",
    },
  },
};

const DEFAULT_NAV = {
  navLogo: "ORORA",
  navLinks: [
    { label: "Về Chúng Tôi", href: "/#about" },
    { label: "Sản phẩm", href: "/#shop" },
    { label: "Liên Hệ", href: "/#contact" },
  ],
  navStyles: {
    logo: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: 2,
      color: "#3a1526",
    },
    link: {
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 1,
      color: "#3a1526",
    },
  },
};

function createNav(data = {}) {
  return {
    navLogo: data.navLogo || DEFAULT_NAV.navLogo,
    navLinks: Array.isArray(data.navLinks) && data.navLinks.length
      ? data.navLinks.map((item) => ({
          label: item.label || "",
          href: item.href || "/",
        }))
      : DEFAULT_NAV.navLinks.map((item) => ({ ...item })),
    navStyles: {
      logo: { ...DEFAULT_NAV.navStyles.logo, ...(data.navStyles?.logo || {}) },
      link: { ...DEFAULT_NAV.navStyles.link, ...(data.navStyles?.link || {}) },
    },
  };
}

const SECTION_LIST = [
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
  {
    key: "steps",
    label: "Quy trình",
    icon: "03",
    disabled: true,
  },
  {
    key: "reviews",
    label: "Cảm nhận",
    icon: "❝",
  },
  {
    key: "newsletter",
    label: "Nhận tin",
    icon: "✉",
    disabled: true,
  },
  {
    key: "footer",
    label: "Footer",
    icon: "⌄",
  },
];

function mergeStyle(base, custom) {
  return {
    ...base,
    ...(custom || {}),
  };
}

function createAbout(data = {}) {
  const builder = data.aboutBuilder || {};

  return {
    ...DEFAULT_ABOUT,

    ...builder,

    section: {
      ...DEFAULT_ABOUT.section,
      ...(builder.section || {}),
    },

    label: {
      ...DEFAULT_ABOUT.label,
      text:
        builder.label?.text ??
        data.storyLabel ??
        DEFAULT_ABOUT.label.text,
      style: mergeStyle(
        DEFAULT_ABOUT.label.style,
        builder.label?.style || data.aboutStyles?.label
      ),
    },

    title: {
      ...DEFAULT_ABOUT.title,
      text:
        builder.title?.text ??
        data.storyTitle ??
        DEFAULT_ABOUT.title.text,
      style: mergeStyle(
        DEFAULT_ABOUT.title.style,
        builder.title?.style || data.aboutStyles?.title
      ),
    },

    highlight: {
      ...DEFAULT_ABOUT.highlight,
      text:
        builder.highlight?.text ??
        data.storyHighlight ??
        DEFAULT_ABOUT.highlight.text,
      style: mergeStyle(
        DEFAULT_ABOUT.highlight.style,
        builder.highlight?.style || data.aboutStyles?.highlight
      ),
    },

    text: {
      ...DEFAULT_ABOUT.text,
      text:
        builder.text?.text ??
        data.storyText ??
        DEFAULT_ABOUT.text.text,
      style: mergeStyle(
        DEFAULT_ABOUT.text.style,
        builder.text?.style || data.aboutStyles?.text
      ),
    },

    image: {
      ...DEFAULT_ABOUT.image,
      ...(builder.image || {}),
      src:
        builder.image?.src ??
        data.storyImage ??
        DEFAULT_ABOUT.image.src,
      extras: Array.isArray(builder.image?.extras)
        ? builder.image.extras
        : Array.isArray(data.storyImages)
        ? data.storyImages
        : ["", "", ""],
    },

    stats: Array.isArray(builder.stats)
      ? builder.stats
      : Array.isArray(data.storyStats)
      ? data.storyStats
      : DEFAULT_ABOUT.stats,

    statValue: mergeStyle(
      DEFAULT_ABOUT.statValue,
      builder.statValue || data.aboutStyles?.statValue
    ),

    statLabel: mergeStyle(
      DEFAULT_ABOUT.statLabel,
      builder.statLabel || data.aboutStyles?.statLabel
    ),
  };
}

function createHero(data = {}) {
  return {
    ...DEFAULT_HERO,
    heroEyebrow: data.heroEyebrow ?? DEFAULT_HERO.heroEyebrow,
    heroTitle: data.heroTitle ?? DEFAULT_HERO.heroTitle,
    heroDescription: data.heroDescription ?? DEFAULT_HERO.heroDescription,
    heroRotator:
      data.heroRotator?.length > 0
        ? data.heroRotator
        : DEFAULT_HERO.heroRotator,
    heroButtonText: data.heroButtonText ?? DEFAULT_HERO.heroButtonText,
    heroButtonLink: data.heroButtonLink ?? DEFAULT_HERO.heroButtonLink,
    shopButtonText: data.shopButtonText ?? DEFAULT_HERO.shopButtonText,
    shopButtonLink: data.shopButtonLink ?? DEFAULT_HERO.shopButtonLink,
    heroImage: data.heroImage ?? DEFAULT_HERO.heroImage,
    heroChip1: data.heroChip1 ?? DEFAULT_HERO.heroChip1,
    heroChip2: data.heroChip2 ?? DEFAULT_HERO.heroChip2,
    heroChip3: data.heroChip3 ?? DEFAULT_HERO.heroChip3,
    heroRingText: data.heroRingText ?? DEFAULT_HERO.heroRingText,
    heroScrollText: data.heroScrollText ?? DEFAULT_HERO.heroScrollText,
  };
}

function mergeNestedStyle(base, custom) {
  const result = { ...base };
  if (!custom) return result;
  for (const key of Object.keys(base)) {
    result[key] = { ...(base[key] || {}), ...(custom[key] || {}) };
  }
  // keep any extra keys from custom
  for (const key of Object.keys(custom)) {
    if (!result[key]) result[key] = { ...custom[key] };
  }
  return result;
}

const SERIF_FONTS = new Set([
  "Cormorant Garamond",
  "Playfair Display",
  "Lora",
  "Noto Serif",
  "Georgia",
  "Times New Roman",
]);

/** "Cormorant Garamond" → '"Cormorant Garamond", serif' (for toCss) */
function toFullFontFamily(name) {
  if (!name) return name;
  if (String(name).includes(",")) return name;
  const stack = SERIF_FONTS.has(name) ? "serif" : "sans-serif";
  return `"${name}", ${stack}`;
}

/** '"Cormorant Garamond", serif' → "Cormorant Garamond" (for select) */
function toBareFontFamily(value) {
  if (!value) return "";
  const m = String(value).match(/"([^"]+)"/);
  if (m) return m[1];
  return String(value).split(",")[0].trim().replace(/"/g, "");
}

function createCollection(data = {}) {
  return {
    collectionLabel:
      data.collectionLabel ?? DEFAULT_COLLECTION.collectionLabel,
    collectionTitle:
      data.collectionTitle ?? DEFAULT_COLLECTION.collectionTitle,
    collectionHighlight:
      data.collectionHighlight ?? DEFAULT_COLLECTION.collectionHighlight,
    collectionStyles: mergeNestedStyle(
      DEFAULT_COLLECTION.collectionStyles,
      data.collectionStyles
    ),
    productCardStyles: mergeNestedStyle(
      DEFAULT_COLLECTION.productCardStyles,
      data.productCardStyles
    ),
  };
}

function createProductDetail(data = {}) {
  return mergeNestedStyle(
    DEFAULT_PRODUCT_DETAIL,
    data.productDetailStyles
  );
}

function createFeatures(data = {}) {
  return {
    featuresLabel: data.featuresLabel ?? DEFAULT_FEATURES.featuresLabel,
    featuresTitle: data.featuresTitle ?? DEFAULT_FEATURES.featuresTitle,
    features:
      data.features?.length > 0
        ? data.features.map((f) => ({
            icon: f.icon || "✦",
            title: f.title || "",
            text: f.text || "",
          }))
        : DEFAULT_FEATURES.features.map((f) => ({ ...f })),
    featuresStyles: mergeNestedStyle(
      DEFAULT_FEATURES.featuresStyles,
      data.featuresStyles
    ),
  };
}

function createReviews(data = {}) {
  return {
    testimonialsLabel:
      data.testimonialsLabel ?? DEFAULT_REVIEWS.testimonialsLabel,
    testimonialsTitle:
      data.testimonialsTitle ?? DEFAULT_REVIEWS.testimonialsTitle,
    testimonialsHighlight:
      data.testimonialsHighlight ?? DEFAULT_REVIEWS.testimonialsHighlight,
    testimonialsTitleEnd:
      data.testimonialsTitleEnd ?? DEFAULT_REVIEWS.testimonialsTitleEnd,
    reviews:
      data.reviews?.length > 0
        ? data.reviews.map((r) => ({
            name: r.name || "",
            text: r.text || "",
            image: r.image || "",
          }))
        : DEFAULT_REVIEWS.reviews.map((r) => ({ ...r })),
    testimonialsStyles: mergeNestedStyle(
      DEFAULT_REVIEWS.testimonialsStyles,
      data.testimonialsStyles
    ),
  };
}

function createFooter(data = {}) {
  const result = { ...DEFAULT_FOOTER };
  for (const key of Object.keys(DEFAULT_FOOTER)) {
    if (key === "footerStyles") continue;
    if (data[key] != null && data[key] !== "") {
      result[key] = data[key];
    }
  }
  result.footerStyles = mergeNestedStyle(
    DEFAULT_FOOTER.footerStyles,
    data.footerStyles
  );
  return result;
}

const DEFAULT_TICKER = {
  marqueeWords: [
    "Dịu nhẹ cho da",
    "Thành phần thuần khiết",
    "Không paraben",
    "Cấp ẩm sâu",
    "Rạng rỡ mỗi ngày",
  ],
  marqueeStyles: {
    text: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 28,
      fontWeight: 400,
      fontStyle: "italic",
      color: "#3a1526",
    },
    star: {
      fontSize: 14,
      fontWeight: 400,
      color: "#e2678f",
    },
    band: {
      color: "#fffafc",
    },
  },
};

function createTicker(data = {}) {
  const styles = data.marqueeStyles || {};
  const bandColor =
    (styles.band && typeof styles.band === "object" && styles.band.color) ||
    (typeof styles.background === "string" ? styles.background : "") ||
    DEFAULT_TICKER.marqueeStyles.band.color;

  return {
    marqueeWords: data.marqueeWords?.length
      ? [...data.marqueeWords]
      : [...DEFAULT_TICKER.marqueeWords],
    marqueeStyles: {
      text: { ...DEFAULT_TICKER.marqueeStyles.text, ...(styles.text || {}) },
      star: { ...DEFAULT_TICKER.marqueeStyles.star, ...(styles.star || {}) },
      band: { color: bandColor },
    },
  };
}

const SECTION_DEFAULT_SELECTED = {
  navbar: "navLogo",
  hero: "title",
  about: "title",
  philosophy: "philosophy",
  collection: "colTitle",
  productdetail: "pdName",
  features: "featTitle",
  reviews: "revTitle",
  footer: "ftLogo",
  ticker: "text",
};

export default function VisualBuilder() {
  const [home, setHome] = useState(null);
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [productDetail, setProductDetail] = useState(DEFAULT_PRODUCT_DETAIL);
  const [detailProduct, setDetailProduct] = useState(defaultProducts[0]);
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
  const [ticker, setTicker] = useState(DEFAULT_TICKER);
  const [navbar, setNavbar] = useState(DEFAULT_NAV);
  const [philosophy, setPhilosophy] = useState({
    philosophyBody: "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦\nTRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.",
    philosophyStyle: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 42,
      fontWeight: 500,
      lineHeight: 1.35,
      textAlign: "center",
      color: "#3a1526",
    },
  });
  const [activeSection, setActiveSection] = useState("about");
  const [selected, setSelected] = useState("title");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;

    getHomeContent()
      .then((data) => {
        if (!alive) return;

        setHome(data || {});
        setAbout(createAbout(data || {}));
        setHero(createHero(data || {}));
        setCollection(createCollection(data || {}));
        setProductDetail(createProductDetail(data || {}));
        setFeatures(createFeatures(data || {}));
        setReviews(createReviews(data || {}));
        setFooter(createFooter(data || {}));
        setTicker(createTicker(data || {}));
        setNavbar(createNav(data || {}));
        setPhilosophy({
          philosophyLabel: data?.philosophyLabel || "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦",
          philosophyBody:
            data?.philosophyBody ||
            data?.philosophyText ||
            "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.",
          philosophyAccentCount: data?.philosophyAccentCount ?? 4,
          philosophyStyles: data?.philosophyStyles || {},
        });
      })
      .catch((err) => {
        console.error(err);
        if (alive) {
          setHome({});
          setAbout(DEFAULT_ABOUT);
          setHero(DEFAULT_HERO);
          setCollection(DEFAULT_COLLECTION);
          setProductDetail(DEFAULT_PRODUCT_DETAIL);
          setFeatures(DEFAULT_FEATURES);
          setReviews(DEFAULT_REVIEWS);
          setFooter(DEFAULT_FOOTER);
          setTicker(DEFAULT_TICKER);
          setNavbar(DEFAULT_NAV);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const switchSection = (key) => {
    setActiveSection(key);
    setSelected(SECTION_DEFAULT_SELECTED[key] || "title");
  };

  const selectedData = useMemo(() => {
    if (activeSection === "navbar") {
      return { type: "navbar", data: navbar };
    }
    if (activeSection === "philosophy") {
      return { type: "philosophy", data: philosophy };
    }
    if (activeSection === "hero") {
      return getHeroSelectedData(hero, selected);
    }
    if (activeSection === "collection") {
      return getCollectionSelectedData(collection, selected);
    }
    if (activeSection === "productdetail") {
      return getProductDetailSelectedData(productDetail, selected, detailProduct);
    }
    if (activeSection === "features") {
      return getFeaturesSelectedData(features, selected);
    }
    if (activeSection === "reviews") {
      return getReviewsSelectedData(reviews, selected);
    }
    if (activeSection === "footer") {
      return getFooterSelectedData(footer, selected);
    }
    if (activeSection === "ticker") {
      return getTickerSelectedData(ticker, selected);
    }
    return getSelectedData(about, selected);
  }, [
    activeSection,
    about,
    hero,
    collection,
    productDetail,
    features,
    reviews,
    footer,
    ticker,
    navbar,
    philosophy,
    selected,
    detailProduct,
  ]);

  const updateSelected = (patch) => {
    if (activeSection === "philosophy") {
      setPhilosophy((current) => ({ ...current, ...patch }));
      return;
    }
    if (activeSection === "navbar") {
      setNavbar((current) => {
        if (patch.navLogo != null) return { ...current, navLogo: patch.navLogo };
        if (patch._linkIndex != null) {
          const links = [...(current.navLinks || [])];
          links[patch._linkIndex] = {
            ...(links[patch._linkIndex] || {}),
            ...patch._link,
          };
          return { ...current, navLinks: links };
        }
        return { ...current, ...patch };
      });
      return;
    }
    if (activeSection === "ticker") {
      setTicker((current) => {
        if (patch.marqueeWords) {
          return { ...current, marqueeWords: patch.marqueeWords };
        }
        if (patch.bandColor != null) {
          return {
            ...current,
            marqueeStyles: {
              ...current.marqueeStyles,
              band: { ...current.marqueeStyles.band, color: patch.bandColor },
            },
          };
        }
        return current;
      });
      return;
    }

    if (activeSection === "hero") {
      setHero((current) => ({ ...current, ...patch }));
      return;
    }

    if (activeSection === "features") {
      setFeatures((current) => {
        if (patch._featuresList) {
          return { ...current, features: patch._featuresList };
        }
        if (patch._featureIndex != null) {
          const next = [...(current.features || [])];
          next[patch._featureIndex] = {
            ...next[patch._featureIndex],
            ...patch._featureItem,
          };
          return { ...current, features: next };
        }
        return { ...current, ...patch };
      });
      return;
    }

    if (activeSection === "reviews") {
      setReviews((current) => {
        if (patch._reviewsList) {
          return { ...current, reviews: patch._reviewsList };
        }
        if (patch._reviewIndex != null) {
          const next = [...(current.reviews || [])];
          next[patch._reviewIndex] = {
            ...next[patch._reviewIndex],
            ...patch._reviewItem,
          };
          return { ...current, reviews: next };
        }
        return { ...current, ...patch };
      });
      return;
    }

    if (activeSection === "footer") {
      setFooter((current) => ({ ...current, ...patch }));
      return;
    }

    if (activeSection === "productdetail") {
      if (patch.__labelKey && patch.text != null) {
        const key = `${patch.__labelKey}Label`;
        setProductDetail((current) => ({
          ...current,
          detailLabels: {
            ...(current.detailLabels || {}),
            [patch.__labelKey]: patch.text,
          },
          [key]: {
            ...(current[key] || {}),
            text: patch.text,
          },
        }));
        return;
      }
      if (typeof selected === "string" && selected.startsWith("pdLabel:") && patch.text != null) {
        const key = `${selected.split(":")[1]}Label`;
        setProductDetail((current) => ({
          ...current,
          [key]: {
            ...(current[key] || {}),
            text: patch.text,
          },
        }));
        return;
      }
      const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
      if (meta?.textKey && patch.text != null) {
        setProductDetail((current) => ({
          ...current,
          [meta.styleKey]: {
            ...(current[meta.styleKey] || {}),
            text: patch.text,
          },
        }));
      }
      return;
    }

    if (activeSection === "collection") {
      setCollection((current) => {
        // text fields
        if (patch.collectionLabel !== undefined ||
            patch.collectionTitle !== undefined ||
            patch.collectionHighlight !== undefined) {
          return { ...current, ...patch };
        }
        // style patches: { styleKey: 'name', style: {...} } or direct nested
        if (patch._styleKey) {
          const group = patch._styleGroup || "productCardStyles";
          return {
            ...current,
            [group]: {
              ...current[group],
              [patch._styleKey]: {
                ...(current[group]?.[patch._styleKey] || {}),
                ...patch.style,
              },
            },
          };
        }
        return { ...current, ...patch };
      });
      return;
    }

    setAbout((current) => {
      if (selected === "section") {
        return {
          ...current,
          section: {
            ...current.section,
            ...patch,
          },
        };
      }

      if (selected === "image") {
        return {
          ...current,
          image: {
            ...current.image,
            ...patch,
          },
        };
      }

      if (selected === "stats") {
        if (Array.isArray(patch)) {
          return { ...current, stats: patch };
        }
        if (patch._statsList) {
          return { ...current, stats: patch._statsList };
        }
        if (patch._statValue) {
          return {
            ...current,
            statValue: {
              ...(current.statValue || {}),
              ...patch._statValue,
            },
          };
        }
        if (patch._statLabel) {
          return {
            ...current,
            statLabel: {
              ...(current.statLabel || {}),
              ...patch._statLabel,
            },
          };
        }
        return current;
      }

      if (
        typeof selected === "string" &&
        (selected.startsWith("statValue:") || selected.startsWith("statLabel:"))
      ) {
        const [kind, indexRaw] = selected.split(":");
        const index = Number(indexRaw);
        const field = kind === "statValue" ? "value" : "label";
        const stats = Array.isArray(current.stats) ? current.stats : [];
        return {
          ...current,
          stats: stats.map((item, i) => {
            if (i !== index) return item;
            const next = { ...item, [field]: patch.text ?? item?.[field] ?? "" };
            if (patch.suffix != null) next.suffix = patch.suffix;
            return next;
          }),
        };
      }

      return {
        ...current,
        [selected]: {
          ...current[selected],
          ...patch,
        },
      };
    });
  };

  const updateSelectedStyle = (patch) => {
    if (activeSection === "philosophy") {
      const styleKey = patch._styleKey || (selected === "philLabel" ? "label" : "text");
      const nextPatch = { ...patch };
      delete nextPatch._styleKey;
      setPhilosophy((current) => ({
        ...current,
        philosophyStyles: {
          ...(current.philosophyStyles || {}),
          [styleKey]: {
            ...(current.philosophyStyles?.[styleKey] || {}),
            ...nextPatch,
          },
        },
      }));
      return;
    }
    if (activeSection === "navbar") {
      const styleKey = selected === "navLogo" ? "logo" : "link";
      setNavbar((current) => ({
        ...current,
        navStyles: {
          ...(current.navStyles || {}),
          [styleKey]: {
            ...(current.navStyles?.[styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }
    if (activeSection === "ticker") {
      const key = selected === "star" ? "star" : selected === "text" ? "text" : null;
      if (!key) return;
      setTicker((current) => ({
        ...current,
        marqueeStyles: {
          ...current.marqueeStyles,
          [key]: {
            ...(current.marqueeStyles?.[key] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    if (activeSection === "hero") return;

    if (activeSection === "productdetail") {
      const styleKey =
        typeof selected === "string" && selected.startsWith("pdLabel:")
          ? "rowLabel"
          : PRODUCT_DETAIL_FIELD_MAP[selected]?.styleKey;
      if (!styleKey) return;
      setProductDetail((current) => ({
        ...current,
        [styleKey]: {
          ...(current[styleKey] || {}),
          ...patch,
        },
      }));
      return;
    }

    if (activeSection === "collection") {
      const meta = COLLECTION_FIELD_MAP[selected];
      if (!meta || meta.type !== "colStyle") return;
      setCollection((current) => ({
        ...current,
        [meta.group]: {
          ...current[meta.group],
          [meta.styleKey]: {
            ...(current[meta.group]?.[meta.styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    if (activeSection === "features") {
      let styleKey = FEATURES_TEXT_MAP[selected]?.styleKey;
      const stylePatch = { ...patch };
      if (selected?.startsWith("featCard-")) {
        styleKey = stylePatch._styleKey || "cardTitle";
        delete stylePatch._styleKey;
      }
      if (!styleKey) return;
      setFeatures((current) => ({
        ...current,
        featuresStyles: {
          ...(current.featuresStyles || {}),
          [styleKey]: {
            ...(current.featuresStyles?.[styleKey] || {}),
            ...stylePatch,
          },
        },
      }));
      return;
    }

    if (activeSection === "reviews") {
      let styleKey = REVIEWS_TEXT_MAP[selected]?.styleKey;
      const stylePatch = { ...patch };
      if (selected?.startsWith("revCard-")) {
        styleKey = stylePatch._styleKey || "reviewText";
        delete stylePatch._styleKey;
      }
      if (!styleKey) return;
      setReviews((current) => ({
        ...current,
        testimonialsStyles: {
          ...(current.testimonialsStyles || {}),
          [styleKey]: {
            ...(current.testimonialsStyles?.[styleKey] || {}),
            ...stylePatch,
          },
        },
      }));
      return;
    }

    if (activeSection === "footer") {
      const styleKey = FOOTER_FIELD_MAP[selected]?.styleKey;
      if (!styleKey) return;
      setFooter((current) => ({
        ...current,
        footerStyles: {
          ...(current.footerStyles || {}),
          [styleKey]: {
            ...(current.footerStyles?.[styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    setAbout((current) => {
      if (
        typeof selected === "string" &&
        (selected.startsWith("statValue:") || selected.startsWith("statLabel:"))
      ) {
        const styleKey = selected.startsWith("statValue:") ? "statValue" : "statLabel";
        return {
          ...current,
          [styleKey]: {
            ...(current[styleKey] || {}),
            ...patch,
          },
        };
      }

      if (
        selected === "section" ||
        selected === "image" ||
        selected === "stats"
      ) {
        return current;
      }

      return {
        ...current,
        [selected]: {
          ...current[selected],
          style: {
            ...current[selected].style,
            ...patch,
          },
        },
      };
    });
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        // About / Story
        storyLabel: about.label.text,
        storyTitle: about.title.text,
        storyHighlight: about.highlight.text,
        storyText: about.text.text,
        storyImage: about.image.src,
        storyImages: Array.isArray(about.image.extras) ? about.image.extras : ["", "", ""],
        storyStats: Array.isArray(about.stats) ? about.stats : DEFAULT_ABOUT.stats,

        aboutBuilder: about,

        aboutStyles: {
          label: about.label.style,
          title: about.title.style,
          highlight: about.highlight.style,
          text: about.text.style,
          statValue: about.statValue,
          statLabel: about.statLabel,
        },

        // Hero
        navLogo: navbar.navLogo,
        navLinks: navbar.navLinks,
        navStyles: navbar.navStyles,
        philosophyLabel: philosophy.philosophyLabel,
        philosophyBody: philosophy.philosophyBody,
        philosophyAccentCount: philosophy.philosophyAccentCount,
        philosophyStyles: philosophy.philosophyStyles,

        heroEyebrow: hero.heroEyebrow,
        heroTitle: hero.heroTitle,
        heroDescription: hero.heroDescription,
        heroRotator: hero.heroRotator,
        heroButtonText: hero.heroButtonText,
        heroButtonLink: hero.heroButtonLink,
        shopButtonText: hero.shopButtonText,
        shopButtonLink: hero.shopButtonLink,
        heroImage: hero.heroImage,
        heroChip1: hero.heroChip1,
        heroChip2: hero.heroChip2,
        heroChip3: hero.heroChip3,
        heroRingText: hero.heroRingText,
        heroScrollText: hero.heroScrollText,

        // Collection + Product Card
        collectionLabel: collection.collectionLabel,
        collectionTitle: collection.collectionTitle,
        collectionHighlight: collection.collectionHighlight,
        collectionStyles: collection.collectionStyles,
        productCardStyles: collection.productCardStyles,

        // Product Detail page styles
        productDetailStyles: productDetail,
        detailLabels: productDetail.detailLabels || {},

        // Features / Nâng cấp bản thân
        featuresLabel: features.featuresLabel,
        featuresTitle: features.featuresTitle,
        features: features.features,
        featuresStyles: features.featuresStyles,

        // Reviews / Cảm nhận
        testimonialsLabel: reviews.testimonialsLabel,
        testimonialsTitle: reviews.testimonialsTitle,
        testimonialsHighlight: reviews.testimonialsHighlight,
        testimonialsTitleEnd: reviews.testimonialsTitleEnd,
        reviews: reviews.reviews,
        testimonialsStyles: reviews.testimonialsStyles,

        // Footer
        footerLogo: footer.footerLogo,
        footerDescription: footer.footerDescription,
        footerInfoTitle: footer.footerInfoTitle,
        footerAboutText: footer.footerAboutText,
        footerShopText: footer.footerShopText,
        footerTermsText: footer.footerTermsText,
        footerPrivacyText: footer.footerPrivacyText,
        footerContactTitle: footer.footerContactTitle,
        footerPhone: footer.footerPhone,
        footerEmail: footer.footerEmail,
        footerAddress: footer.footerAddress,
        footerSocialTitle: footer.footerSocialTitle,
        footerInstagram: footer.footerInstagram,
        footerFacebook: footer.footerFacebook,
        footerTikTok: footer.footerTikTok,
        footerYouTube: footer.footerYouTube,
        footerCopyright: footer.footerCopyright,
        footerCompanyNumber: footer.footerCompanyNumber,
        footerStyles: footer.footerStyles,
        marqueeWords: ticker.marqueeWords,
        marqueeStyles: {
          ...ticker.marqueeStyles,
          background: ticker.marqueeStyles?.band?.color || "",
        },
      };

      await saveHomeContent(payload);

      setHome((current) => ({
        ...(current || {}),
        ...payload,
      }));

      setMessage({
        type: "success",
        text: "Đã lưu toàn bộ thay đổi.",
      });
    } catch (err) {
      console.error(err);

      setMessage({
        type: "error",
        text:
          err?.code === "permission-denied"
            ? "Tài khoản này chưa có quyền chỉnh sửa."
            : err?.message || "Không thể lưu thay đổi.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="builder-loading">
        Đang tải Visual Builder...
      </div>
    );
  }

  return (
    <div className="visual-builder">
      <div className="builder-toolbar">
        <div>
          <strong>Visual Page Builder</strong>
          <span>
            Chọn một phần trên preview để chỉnh sửa.
          </span>
        </div>

        <div className="builder-toolbar-actions">
          {message && (
            <span
              className={
                message.type === "success"
                  ? "builder-message success"
                  : "builder-message error"
              }
            >
              {message.text}
            </span>
          )}

          <button
            type="button"
            className="admin-btn primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Đang lưu..." : "💾 Lưu tất cả"}
          </button>
        </div>
      </div>

      <div className="builder-layout">
        <aside className="builder-sections">
          <div className="builder-panel-title">
            <span>Sections</span>
            <small>Trang chủ</small>
          </div>

          <div className="builder-section-list">
            {SECTION_LIST.map((section) => (
              <button
                key={section.key}
                type="button"
                disabled={section.disabled}
                className={[
                  "builder-section-item",
                  activeSection === section.key ? "active" : "",
                  section.disabled ? "disabled" : "",
                ].join(" ")}
                onClick={() => {
                  if (!section.disabled) {
                    switchSection(section.key);
                  }
                }}
              >
                <span className="builder-section-icon">
                  {section.icon}
                </span>

                <span className="builder-section-text">
                  <strong>{section.label}</strong>
                  <small>
                    {section.disabled
                      ? "Sắp có"
                      : activeSection === section.key
                      ? "Đang chỉnh sửa"
                      : "Sẵn sàng"}
                  </small>
                </span>

                {activeSection === section.key && (
                  <span className="builder-dot" />
                )}
              </button>
            ))}
          </div>
        </aside>

        <main className="builder-canvas">
          <div className="builder-canvas-head">
            <span>Preview — kích thước thật (full width cột giữa)</span>

            <span className="builder-device">
              Desktop 1:1
            </span>
          </div>

          <div
            className={[
              "builder-preview",
              activeSection === "hero" ? "builder-preview--hero" : "",
              activeSection === "collection"
                ? "builder-preview--collection"
                : "",
              activeSection === "productdetail"
                ? "builder-preview--productdetail"
                : "",
              activeSection === "features"
                ? "builder-preview--features"
                : "",
              activeSection === "reviews"
                ? "builder-preview--reviews"
                : "",
              activeSection === "footer"
                ? "builder-preview--footer"
                : "",
              activeSection === "ticker"
                ? "builder-preview--ticker"
                : "",
            ].join(" ")}
          >
            {activeSection === "ticker" ? (
              <TickerPreview
                ticker={ticker}
                selected={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "navbar" ? (
              <Navbar
                preview
                previewData={navbar}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "philosophy" ? (
              <ScrollText
                preview
                previewData={philosophy}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "hero" ? (
              <Hero
                preview
                previewData={hero}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "collection" ? (
              <Collection
                preview
                previewData={collection}
                selectedElement={selected}
                onSelect={setSelected}
                sampleProducts={defaultProducts.slice(0, 3)}
              />
            ) : activeSection === "productdetail" ? (
              <ProductDetail
                preview
                previewStyles={productDetail}
                previewProduct={detailProduct}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "features" ? (
              <Features
                preview
                previewData={features}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "reviews" ? (
              <Testimonials
                preview
                previewData={reviews}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : activeSection === "footer" ? (
              <Footer
                preview
                previewData={footer}
                selectedElement={selected}
                onSelect={setSelected}
              />
            ) : (
              <About
                preview
                previewData={about}
                selectedElement={selected}
                onSelect={setSelected}
              />
            )}
          </div>
        </main>

        <aside className="builder-settings">
          <StylePanel
            section={activeSection}
            selected={selected}
            data={selectedData}
            about={about}
            hero={hero}
            collection={collection}
            productDetail={productDetail}
            detailProduct={detailProduct}
            features={features}
            reviews={reviews}
            footer={footer}
            ticker={ticker}
            navbar={navbar}
            philosophy={philosophy}
            onChange={updateSelected}
            onStyleChange={updateSelectedStyle}
          />
        </aside>
      </div>
    </div>
  );
}

function getSelectedData(about, selected) {
  if (selected === "section") {
    return {
      type: "section",
      data: about.section,
    };
  }

  if (selected === "image") {
    return {
      type: "image",
      data: about.image,
    };
  }

  if (selected === "stats") {
    return {
      type: "stats",
      data: Array.isArray(about.stats) ? about.stats : DEFAULT_ABOUT.stats,
    };
  }

  if (
    typeof selected === "string" &&
    (selected.startsWith("statValue:") || selected.startsWith("statLabel:"))
  ) {
    const [kind, indexRaw] = selected.split(":");
    const index = Number(indexRaw);
    const item = (Array.isArray(about.stats) ? about.stats : [])[index] || {};
    const base = kind === "statValue"
      ? about.statValue || DEFAULT_ABOUT.statValue
      : about.statLabel || DEFAULT_ABOUT.statLabel;
    return {
      type: "statText",
      data: {
        kind,
        index,
        text: kind === "statValue" ? item.value ?? "" : item.label ?? "",
        suffix: item.suffix || "",
        style: { ...(base || {}) },
      },
    };
  }

  const block = about[selected];
  if (!block || typeof block !== "object") {
    return {
      type: "text",
      data: { text: "", style: { ...DEFAULT_STYLE } },
    };
  }

  return {
    type: "text",
    data: {
      text: block.text || "",
      style: block.style || { ...DEFAULT_STYLE },
    },
  };
}

const HERO_FIELD_MAP = {
  image: { type: "heroImage", label: "Ảnh nền" },
  eyebrow: { type: "heroText", key: "heroEyebrow", label: "Dòng nhỏ phía trên" },
  title: { type: "heroText", key: "heroTitle", label: "Tiêu đề lớn" },
  description: {
    type: "heroText",
    key: "heroDescription",
    label: "Mô tả ngắn",
    rows: 3,
  },
  rotator: { type: "heroRotator", label: "Các từ đổi liên tục" },
  btnPrimary: {
    type: "heroButton",
    textKey: "heroButtonText",
    linkKey: "heroButtonLink",
    label: "Nút chính",
  },
  btnSecondary: {
    type: "heroButton",
    textKey: "shopButtonText",
    linkKey: "shopButtonLink",
    label: "Nút phụ",
  },
  chip1: { type: "heroText", key: "heroChip1", label: "Thẻ nổi 1" },
  chip2: { type: "heroText", key: "heroChip2", label: "Thẻ nổi 2" },
  chip3: { type: "heroText", key: "heroChip3", label: "Thẻ nổi 3" },
  ring: { type: "heroText", key: "heroRingText", label: "Chữ vòng tròn" },
  scroll: { type: "heroText", key: "heroScrollText", label: "Chữ cuộn" },
};

function getHeroSelectedData(hero, selected) {
  const meta = HERO_FIELD_MAP[selected];
  if (!meta) {
    return { type: "heroEmpty", data: null };
  }
  return { type: meta.type, data: hero, meta };
}

const COLLECTION_FIELD_MAP = {
  colLabel: {
    type: "colStyle",
    group: "collectionStyles",
    styleKey: "label",
    textKey: "collectionLabel",
    label: "Nhãn nhỏ",
    sample: "COLLECTION",
  },
  colTitle: {
    type: "colStyle",
    group: "collectionStyles",
    styleKey: "title",
    textKey: "collectionTitle",
    label: "Tiêu đề dòng 1",
    sample: "Explore",
  },
  colHighlight: {
    type: "colStyle",
    group: "collectionStyles",
    styleKey: "highlight",
    textKey: "collectionHighlight",
    label: "Tiêu đề dòng 2",
    sample: "the details.",
  },
  cardNumber: {
    type: "colStyle",
    group: "productCardStyles",
    styleKey: "number",
    label: "Số thứ tự thẻ",
    sample: "01",
    textOnly: false,
  },
  cardName: {
    type: "colStyle",
    group: "productCardStyles",
    styleKey: "name",
    label: "Tên sản phẩm",
    sample: "First Story",
  },
  cardDescription: {
    type: "colStyle",
    group: "productCardStyles",
    styleKey: "description",
    label: "Mô tả ngắn",
    sample: "A beautiful piece created for your everyday moments.",
  },
  cardPrice: {
    type: "colStyle",
    group: "productCardStyles",
    styleKey: "price",
    label: "Giá",
    sample: "1.290.000đ",
  },
  cardButton: {
    type: "colStyle",
    group: "productCardStyles",
    styleKey: "button",
    label: "Nút Xem chi tiết",
    sample: "Xem chi tiết ↗",
  },
};

function getCollectionSelectedData(collection, selected) {
  const meta = COLLECTION_FIELD_MAP[selected];
  if (!meta) {
    return { type: "colEmpty", data: null };
  }
  return { type: meta.type, data: collection, meta };
}

const PRODUCT_DETAIL_FIELD_MAP = {
  pdNumber: {
    styleKey: "number",
    label: "Số thứ tự",
    sample: "01",
  },
  pdName: {
    styleKey: "name",
    label: "Tên sản phẩm",
    sample: "First Story",
  },
  pdPrice: {
    styleKey: "price",
    label: "Giá",
    sample: "1.290.000đ",
  },
  pdDescription: {
    styleKey: "description",
    label: "Mô tả ngắn",
    sample: "A beautiful piece created for your everyday moments.",
  },
  pdSectionTitle: {
    styleKey: "sectionTitle",
    label: "Tiêu đề mục (About / Details)",
    sample: "About the product",
  },
  pdAboutTitle: {
    styleKey: "aboutTitle",
    textKey: "text",
    label: "Tiêu đề About the product",
    sample: "About the product",
  },
  pdDetailsTitle: {
    styleKey: "detailsTitle",
    textKey: "text",
    label: "Tiêu đề Details",
    sample: "Details",
  },
  pdBody: {
    styleKey: "body",
    label: "Đoạn câu chuyện sản phẩm",
    sample: "First Story is created with a simple idea in mind.",
  },
  pdRowLabel: {
    styleKey: "rowLabel",
    label: "Tên thông tin (Material, Size…)",
    sample: "Material",
  },
  pdRowValue: {
    styleKey: "rowValue",
    label: "Nội dung Material / Size / Color / Origin",
    sample: "Nội dung dùng chung font và size",
  },
};

function getProductDetailSelectedData(productDetail, selected, detailProduct) {
  if (typeof selected === "string" && selected.startsWith("pdValue:")) {
    const key = selected.split(":")[1];
    return {
      type: "pdValue",
      data: productDetail,
      meta: {
        key,
        label: `Nội dung ${key}`,
        text: detailProduct?.[key] || "",
      },
    };
  }
  if (typeof selected === "string" && selected.startsWith("pdLabel:")) {
    const key = selected.split(":")[1];
    const styleKey = `${key}Label`;
    return {
      type: "pdFieldLabel",
      data: productDetail,
      meta: {
        key,
        styleKey,
        label: `Tên mục ${key}`,
        sample: key[0].toUpperCase() + key.slice(1),
      },
    };
  }
  const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
  if (!meta) {
    return { type: "pdEmpty", data: null };
  }
  return { type: "pdStyle", data: productDetail, meta };
}

const FEATURES_TEXT_MAP = {
  featLabel: {
    key: "featuresLabel",
    label: "Nhãn nhỏ",
    styleKey: "label",
  },
  featTitle: {
    key: "featuresTitle",
    label: "Tiêu đề",
    styleKey: "title",
  },
};

function getFeaturesSelectedData(features, selected) {
  if (selected?.startsWith("featCard-")) {
    const index = Number(selected.replace("featCard-", ""));
    return {
      type: "featCard",
      data: features,
      meta: { index, label: `Ô ${index + 1}` },
    };
  }
  const meta = FEATURES_TEXT_MAP[selected];
  if (!meta) return { type: "featEmpty", data: null };
  return { type: "featText", data: features, meta };
}

const REVIEWS_TEXT_MAP = {
  revLabel: {
    key: "testimonialsLabel",
    label: "Nhãn nhỏ",
    styleKey: "label",
  },
  revTitle: {
    key: "testimonialsTitle",
    label: "Tiêu đề (trước)",
    styleKey: "title",
  },
  revHighlight: {
    key: "testimonialsHighlight",
    label: "Chữ nổi bật",
    styleKey: "highlight",
  },
  revTitleEnd: {
    key: "testimonialsTitleEnd",
    label: "Tiêu đề (sau)",
    styleKey: "titleEnd",
  },
};

function getReviewsSelectedData(reviews, selected) {
  if (selected?.startsWith("revCard-")) {
    const index = Number(selected.replace("revCard-", ""));
    return {
      type: "revCard",
      data: reviews,
      meta: { index, label: `Đánh giá ${index + 1}` },
    };
  }
  const meta = REVIEWS_TEXT_MAP[selected];
  if (!meta) return { type: "revEmpty", data: null };
  return { type: "revText", data: reviews, meta };
}

const FOOTER_FIELD_MAP = {
  ftLogo: {
    key: "footerLogo",
    label: "Tên thương hiệu",
    styleKey: "logo",
  },
  ftDesc: {
    key: "footerDescription",
    label: "Mô tả",
    rows: 3,
    styleKey: "description",
  },
  ftInfoTitle: {
    key: "footerInfoTitle",
    label: "Tiêu đề Information",
    styleKey: "columnTitle",
  },
  ftAbout: {
    key: "footerAboutText",
    label: "About us",
    styleKey: "link",
  },
  ftShop: { key: "footerShopText", label: "Shop", styleKey: "link" },
  ftTerms: {
    key: "footerTermsText",
    label: "Terms & Conditions",
    styleKey: "link",
  },
  ftPrivacy: {
    key: "footerPrivacyText",
    label: "Privacy Policy",
    styleKey: "link",
  },
  ftContactTitle: {
    key: "footerContactTitle",
    label: "Tiêu đề Contact",
    styleKey: "columnTitle",
  },
  ftPhone: { key: "footerPhone", label: "Số điện thoại", styleKey: "link" },
  ftEmail: { key: "footerEmail", label: "Email", styleKey: "link" },
  ftAddress: {
    key: "footerAddress",
    label: "Địa chỉ",
    rows: 2,
    styleKey: "link",
  },
  ftSocialTitle: {
    key: "footerSocialTitle",
    label: "Tiêu đề mạng xã hội",
    styleKey: "columnTitle",
  },
  ftInstagram: {
    key: "footerInstagram",
    label: "Link Instagram",
    styleKey: "link",
  },
  ftFacebook: {
    key: "footerFacebook",
    label: "Link Facebook",
    styleKey: "link",
  },
  ftTikTok: {
    key: "footerTikTok",
    label: "Link TikTok",
    styleKey: "link",
  },
  ftYouTube: {
    key: "footerYouTube",
    label: "Link YouTube",
    styleKey: "link",
  },
  ftCopyright: {
    key: "footerCopyright",
    label: "Copyright",
    styleKey: "copyright",
  },
  ftCompany: {
    key: "footerCompanyNumber",
    label: "Thông tin công ty",
    styleKey: "copyright",
  },
};

function getFooterSelectedData(footer, selected) {
  const meta = FOOTER_FIELD_MAP[selected];
  if (!meta) return { type: "ftEmpty", data: null };
  return { type: "ftText", data: footer, meta };
}

function getTickerSelectedData(ticker, selected) {
  const map = {
    text: { label: "Câu chạy" },
    star: { label: "Dấu ✦" },
    band: { label: "Nền dải" },
  };
  const meta = map[selected] || map.text;
  return { type: selected === "band" ? "tickerBand" : "tickerText", data: ticker, meta };
}

function TickerPreview({ ticker, selected, onSelect }) {
  const words = ticker.marqueeWords?.length ? ticker.marqueeWords : DEFAULT_TICKER.marqueeWords;
  const textStyle = toCss(ticker.marqueeStyles?.text, { responsive: false });
  const starStyle = toCss(ticker.marqueeStyles?.star, { responsive: false });
  const bg = ticker.marqueeStyles?.band?.color;
  const pick = (key) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const row = words.map((word, i) => (
    <span
      key={`${word}-${i}`}
      className={selected === "text" ? "builder-selected" : ""}
      data-builder-key="text"
      style={textStyle}
      onClick={pick("text")}
    >
      {word}
      <b
        className={selected === "star" ? "builder-selected" : ""}
        data-builder-key="star"
        style={starStyle}
        onClick={pick("star")}
      >
        ✦
      </b>
    </span>
  ));

  return (
    <div
      className={`marquee${selected === "band" ? " builder-selected" : ""}`}
      style={bg ? { background: bg } : undefined}
      onClick={pick("band")}
    >
      <div className="marquee-track">
        {row}
        {row}
      </div>
    </div>
  );
}

function StylePanel({
  section,
  selected,
  data,
  about,
  hero,
  collection,
  productDetail,
  detailProduct,
  features,
  reviews,
  footer,
  ticker,
  navbar,
  philosophy,
  onChange,
  onStyleChange,
}) {
  if (!data) {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const aboutTitleMap = {
    section: "Phần Câu chuyện",
    label: "Nhãn nhỏ",
    title: "Tiêu đề",
    highlight: "Chữ nổi bật",
    text: "Nội dung",
    image: "Hình ảnh",
    stats: "Số liệu",
  };

  const statMatch =
    section === "about" &&
    typeof selected === "string" &&
    selected.match(/^(statValue|statLabel):(\d+)$/);

  const sideLabel =
    section === "hero"
      ? data.meta?.label || HERO_FIELD_MAP[selected]?.label || selected
      : section === "collection"
      ? data.meta?.label || COLLECTION_FIELD_MAP[selected]?.label || selected
      : section === "productdetail"
      ? data.meta?.label ||
        PRODUCT_DETAIL_FIELD_MAP[selected]?.label ||
        selected
      : section === "features"
      ? data.meta?.label || FEATURES_TEXT_MAP[selected]?.label || selected
      : section === "reviews"
      ? data.meta?.label || REVIEWS_TEXT_MAP[selected]?.label || selected
      : section === "footer"
      ? data.meta?.label || FOOTER_FIELD_MAP[selected]?.label || selected
      : section === "ticker"
      ? data.meta?.label || selected
      : statMatch
      ? `${statMatch[1] === "statValue" ? "Chữ lớn (đồng bộ)" : "Chữ nhỏ (đồng bộ)"} #${Number(statMatch[2]) + 1}`
      : aboutTitleMap[selected] || selected;

  return (
    <div className="builder-settings-inner">
      <div className="builder-panel-title">
        <span>Properties</span>
        <small>{sideLabel}</small>
      </div>

      {section === "hero" && (
        <HeroSettings
          selected={selected}
          data={data}
          hero={hero}
          onChange={onChange}
        />
      )}

      {section === "collection" && (
        <CollectionSettings
          selected={selected}
          data={data}
          collection={collection}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "productdetail" && (
        <ProductDetailSettings
          selected={selected}
          data={data}
          productDetail={productDetail}
          detailProduct={detailProduct}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "features" && (
        <FeaturesSettings
          selected={selected}
          data={data}
          features={features}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "reviews" && (
        <ReviewsSettings
          selected={selected}
          data={data}
          reviews={reviews}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "footer" && (
        <FooterSettings
          selected={selected}
          data={data}
          footer={footer}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "navbar" && (
        <NavbarSettings
          selected={selected}
          navbar={navbar}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "philosophy" && (
        <PhilosophySettings
          selected={selected}
          philosophy={philosophy}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "ticker" && (
        <TickerSettings
          selected={selected}
          data={data}
          ticker={ticker}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "about" && data.type === "section" && (
        <SectionSettings
          data={data.data}
          onChange={onChange}
        />
      )}

      {section === "about" && data.type === "image" && (
        <ImageSettings
          data={data.data}
          onChange={onChange}
        />
      )}

      {section === "about" && data.type === "stats" && (
        <StatsSettings
          stats={about.stats}
          about={about}
          onChange={onChange}
        />
      )}

      {section === "about" && data.type === "statText" && (
        <StatTextSettings
          data={data.data}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}

      {section === "about" && data.type === "text" && (
        <TextSettings
          selected={selected}
          data={data.data}
          onChange={onChange}
          onStyleChange={onStyleChange}
        />
      )}
    </div>
  );
}

function FeaturesSettings({
  selected,
  data,
  features,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "featEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const styles = features.featuresStyles || {};

  if (data.type === "featText") {
    const { key, label, styleKey } = data.meta;
    return (
      <>
        <SettingGroup title={label}>
          <div className="builder-field">
            <label>Nội dung</label>
            <input
              value={features[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </div>
        </SettingGroup>
        <StyleTypographyBlock
          style={styles[styleKey] || {}}
          onStyleChange={onStyleChange}
        />
      </>
    );
  }

  if (data.type === "featCard") {
    const index = data.meta.index;
    const item = features.features?.[index] || {
      icon: "✦",
      title: "",
      text: "",
    };

    return (
      <>
        <SettingGroup title={`Ô ${index + 1}`}>
          <div className="builder-field">
            <label>Icon (emoji / ký tự)</label>
            <input
              value={item.icon || ""}
              onChange={(e) =>
                onChange({
                  _featureIndex: index,
                  _featureItem: { icon: e.target.value },
                })
              }
            />
          </div>
          <div className="builder-field">
            <label>Tiêu đề ô</label>
            <input
              value={item.title || ""}
              onChange={(e) =>
                onChange({
                  _featureIndex: index,
                  _featureItem: { title: e.target.value },
                })
              }
            />
          </div>
          <div className="builder-field">
            <label>Nội dung</label>
            <textarea
              rows={3}
              value={item.text || ""}
              onChange={(e) =>
                onChange({
                  _featureIndex: index,
                  _featureItem: { text: e.target.value },
                })
              }
            />
          </div>
        </SettingGroup>

        <StyleTypographyBlock
          style={styles.cardTitle || {}}
          onStyleChange={(patch) =>
            onStyleChange({ ...patch, _styleKey: "cardTitle" })
          }
        />

        <SettingGroup title="Typography — Nội dung ô">
          <TypographyControls
            style={{
              fontFamily: toBareFontFamily(styles.cardText?.fontFamily),
              fontSize: styles.cardText?.fontSize ?? "",
              fontWeight: styles.cardText?.fontWeight ?? "",
              color: styles.cardText?.color || "",
              letterSpacing: styles.cardText?.letterSpacing ?? "",
              lineHeight: styles.cardText?.lineHeight ?? "",
              italic:
                styles.cardText?.italic ||
                styles.cardText?.fontStyle === "italic",
              textAlign: styles.cardText?.textAlign || "left",
              marginTop: styles.cardText?.marginTop ?? 0,
              marginBottom: styles.cardText?.marginBottom ?? 0,
            }}
            onChange={(patch) => {
              const next = { ...patch, _styleKey: "cardText" };
              if ("fontFamily" in patch) {
                next.fontFamily = toFullFontFamily(patch.fontFamily);
              }
              if ("italic" in patch) {
                next.fontStyle = patch.italic ? "italic" : "normal";
              }
              onStyleChange(next);
            }}
          />
        </SettingGroup>

        <SettingGroup title="Typography — Icon">
          <TypographyControls
            style={{
              fontFamily: toBareFontFamily(styles.icon?.fontFamily),
              fontSize: styles.icon?.fontSize ?? "",
              fontWeight: styles.icon?.fontWeight ?? "",
              color: styles.icon?.color || "",
              letterSpacing: styles.icon?.letterSpacing ?? "",
              lineHeight: styles.icon?.lineHeight ?? "",
              italic: false,
              textAlign: "center",
              marginTop: 0,
              marginBottom: 0,
            }}
            onChange={(patch) => {
              const next = { ...patch, _styleKey: "icon" };
              if ("fontFamily" in patch) {
                next.fontFamily = toFullFontFamily(patch.fontFamily);
              }
              onStyleChange(next);
            }}
          />
        </SettingGroup>

        <SettingGroup title="Danh sách">
          <button
            type="button"
            className="admin-btn"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={() =>
              onChange({
                _featuresList: [
                  ...(features.features || []),
                  { icon: "✦", title: "", text: "" },
                ],
              })
            }
          >
            + Thêm ô
          </button>
          {(features.features || []).length > 1 && (
            <button
              type="button"
              className="admin-btn danger"
              style={{ width: "100%" }}
              onClick={() => {
                const next = (features.features || []).filter(
                  (_, i) => i !== index
                );
                onChange({ _featuresList: next });
              }}
            >
              Xóa ô này
            </button>
          )}
        </SettingGroup>
      </>
    );
  }

  return null;
}

function StyleTypographyBlock({ style = {}, onStyleChange, title = "Typography" }) {
  return (
    <SettingGroup title={title}>
      <TypographyControls
        style={{
          fontFamily: toBareFontFamily(style.fontFamily),
          fontSize: style.fontSize ?? "",
          fontWeight: style.fontWeight ?? "",
          color: style.color || "",
          letterSpacing: style.letterSpacing ?? "",
          lineHeight: style.lineHeight ?? "",
          italic: style.italic || style.fontStyle === "italic",
          textAlign: style.textAlign || "left",
          marginTop: style.marginTop ?? 0,
          marginBottom: style.marginBottom ?? 0,
          paddingTop: style.paddingTop ?? 0,
          paddingBottom: style.paddingBottom ?? 0,
          maxWidth: style.maxWidth ?? 100,
        }}
        onChange={(patch) => {
          const next = { ...patch };
          if ("fontFamily" in patch) {
            next.fontFamily = toFullFontFamily(patch.fontFamily);
          }
          if ("italic" in patch) {
            next.fontStyle = patch.italic ? "italic" : "normal";
          }
          onStyleChange(next);
        }}
      />
    </SettingGroup>
  );
}

function ReviewsSettings({
  selected,
  data,
  reviews,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "revEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const styles = reviews.testimonialsStyles || {};

  if (data.type === "revText") {
    const { key, label, styleKey } = data.meta;
    return (
      <>
        <SettingGroup title={label}>
          <div className="builder-field">
            <label>Nội dung</label>
            <input
              value={reviews[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          </div>
        </SettingGroup>
        <StyleTypographyBlock
          style={styles[styleKey] || {}}
          onStyleChange={onStyleChange}
        />
      </>
    );
  }

  if (data.type === "revCard") {
    const index = data.meta.index;
    const item = reviews.reviews?.[index] || {
      name: "",
      text: "",
      image: "",
    };

    return (
      <>
        <SettingGroup title={`Đánh giá ${index + 1}`}>
          <div className="builder-field">
            <label>Tên khách hàng</label>
            <input
              value={item.name || ""}
              onChange={(e) =>
                onChange({
                  _reviewIndex: index,
                  _reviewItem: { name: e.target.value },
                })
              }
            />
          </div>

          <div className="builder-field">
            <label>Nội dung</label>
            <textarea
              rows={4}
              value={item.text || ""}
              onChange={(e) =>
                onChange({
                  _reviewIndex: index,
                  _reviewItem: { text: e.target.value },
                })
              }
            />
          </div>

          <div className="builder-field">
            <label>Ảnh khách hàng (URL)</label>
            <input
              value={item.image || ""}
              onChange={(e) =>
                onChange({
                  _reviewIndex: index,
                  _reviewItem: { image: e.target.value },
                })
              }
              placeholder="Dán link ảnh hoặc /avatar.jpg"
            />
            <small className="builder-help">
              Ảnh tròn nhỏ cạnh tên. Có thể tải lên ở Form cũ → Cảm nhận.
            </small>
          </div>

          {item.image && (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #f5d6e0",
                backgroundImage: `url("${item.image}")`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          )}
        </SettingGroup>

        <StyleTypographyBlock
          style={styles.reviewText || {}}
          onStyleChange={(patch) =>
            onStyleChange({ ...patch, _styleKey: "reviewText" })
          }
        />

        <SettingGroup title="Typography — Tên khách">
          <TypographyControls
            style={{
              fontFamily: toBareFontFamily(styles.reviewName?.fontFamily),
              fontSize: styles.reviewName?.fontSize ?? "",
              fontWeight: styles.reviewName?.fontWeight ?? "",
              color: styles.reviewName?.color || "",
              letterSpacing: styles.reviewName?.letterSpacing ?? "",
              lineHeight: styles.reviewName?.lineHeight ?? "",
              italic:
                styles.reviewName?.italic ||
                styles.reviewName?.fontStyle === "italic",
              textAlign: styles.reviewName?.textAlign || "left",
              marginTop: styles.reviewName?.marginTop ?? 0,
              marginBottom: styles.reviewName?.marginBottom ?? 0,
            }}
            onChange={(patch) => {
              const next = { ...patch, _styleKey: "reviewName" };
              if ("fontFamily" in patch) {
                next.fontFamily = toFullFontFamily(patch.fontFamily);
              }
              if ("italic" in patch) {
                next.fontStyle = patch.italic ? "italic" : "normal";
              }
              onStyleChange(next);
            }}
          />
        </SettingGroup>

        <SettingGroup title="Danh sách">
          <button
            type="button"
            className="admin-btn"
            style={{ width: "100%", marginBottom: 8 }}
            onClick={() =>
              onChange({
                _reviewsList: [
                  ...(reviews.reviews || []),
                  { name: "", text: "", image: "" },
                ],
              })
            }
          >
            + Thêm đánh giá
          </button>

          {(reviews.reviews || []).length > 1 && (
            <button
              type="button"
              className="admin-btn danger"
              style={{ width: "100%" }}
              onClick={() => {
                const next = (reviews.reviews || []).filter(
                  (_, i) => i !== index
                );
                onChange({ _reviewsList: next });
              }}
            >
              Xóa đánh giá này
            </button>
          )}
        </SettingGroup>
      </>
    );
  }

  return null;
}

function FooterSettings({ data, footer, onChange, onStyleChange }) {
  if (!data || data.type === "ftEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const { key, label, rows, styleKey } = data.meta;
  const style = footer.footerStyles?.[styleKey] || {};

  return (
    <>
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Nội dung</label>
          {rows ? (
            <textarea
              rows={rows}
              value={footer[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          ) : (
            <input
              value={footer[key] || ""}
              onChange={(e) => onChange({ [key]: e.target.value })}
            />
          )}
        </div>
      </SettingGroup>
      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
    </>
  );
}

function PhilosophySettings({ selected, philosophy, onChange, onStyleChange }) {
  const styles = philosophy.philosophyStyles || {};
  const styleKey = selected === "philLabel" ? "label" : selected === "philAccent" ? "accent" : "text";
  const style = styles[styleKey] || {};
  return (
    <>
      <SettingGroup title="Nội dung">
        <div className="builder-field">
          <label>Nhãn — Triết lý của chúng tôi</label>
          <textarea
            rows={2}
            value={philosophy.philosophyLabel || ""}
            onChange={(e) => onChange({ philosophyLabel: e.target.value })}
          />
        </div>
        <div className="builder-field">
          <label>Nội dung (Enter để xuống dòng)</label>
          <textarea
            rows={6}
            value={philosophy.philosophyBody || ""}
            onChange={(e) => onChange({ philosophyBody: e.target.value })}
          />
        </div>
        <div className="builder-field">
          <label>Số chữ cuối đổi màu (0 = tắt)</label>
          <input
            type="number"
            min="0"
            value={philosophy.philosophyAccentCount ?? 4}
            onChange={(e) => onChange({ philosophyAccentCount: Number(e.target.value) || 0 })}
          />
        </div>
        <small className="builder-help">
          Hiệu ứng sáng dần khi cuộn giữ nguyên. Những chữ cuối dùng màu nhấn.
        </small>
      </SettingGroup>
      <StyleTypographyBlock
        title={styleKey === "label" ? "Kiểu nhãn" : styleKey === "accent" ? "Màu chữ nổi bật" : "Kiểu câu chữ"}
        style={style}
        onStyleChange={(patch) => onStyleChange({ _styleKey: styleKey, ...patch })}
      />
    </>
  );
}

function NavbarSettings({ selected, navbar, onChange, onStyleChange }) {
  const isLogo = selected === "navLogo";
  const linkIndex = String(selected || "").startsWith("navLink:")
    ? Number(selected.split(":")[1])
    : 0;
  const link = (navbar.navLinks || [])[linkIndex] || { label: "", href: "/" };
  const style = isLogo ? navbar.navStyles?.logo : navbar.navStyles?.link;
  const space = (label, key) => (
    <SelectField
      label={label}
      value={style?.[key] ?? 0}
      options={SPACE_OPTIONS}
      suffix="px"
      onChange={(value) => onStyleChange({ [key]: Number(value) })}
    />
  );

  return (
    <>
      <SettingGroup title={isLogo ? "Logo" : `Link ${linkIndex + 1}`}>
        {isLogo ? (
          <div className="builder-field">
            <label>Chữ logo</label>
            <input
              value={navbar.navLogo || ""}
              onChange={(e) => onChange({ navLogo: e.target.value })}
            />
          </div>
        ) : (
          <>
            <div className="builder-field">
              <label>Chữ link</label>
              <input
                value={link.label || ""}
                onChange={(e) => onChange({ _linkIndex: linkIndex, _link: { label: e.target.value } })}
              />
            </div>
            <div className="builder-field">
              <label>Đường dẫn</label>
              <input
                value={link.href || ""}
                onChange={(e) => onChange({ _linkIndex: linkIndex, _link: { href: e.target.value } })}
              />
            </div>
            <small className="builder-help">Font, căn lề, margin và padding dùng chung cho mọi link.</small>
          </>
        )}
      </SettingGroup>
      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
      <SettingGroup title="Padding / margin">
        <div className="builder-field-row">
          {space("Margin trên", "marginTop")}
          {space("Margin phải", "marginRight")}
        </div>
        <div className="builder-field-row">
          {space("Margin dưới", "marginBottom")}
          {space("Margin trái", "marginLeft")}
        </div>
        <div className="builder-field-row">
          {space("Padding trên", "paddingTop")}
          {space("Padding phải", "paddingRight")}
        </div>
        <div className="builder-field-row">
          {space("Padding dưới", "paddingBottom")}
          {space("Padding trái", "paddingLeft")}
        </div>
      </SettingGroup>
    </>
  );
}

function ProductDetailSettings({
  selected,
  data,
  productDetail,
  detailProduct,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "pdEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  if (selected === "pdRowValue" || data.type === "pdValue") {
    const style = productDetail.rowValue || {};
    const space = (label, key) => (
      <SelectField
        label={label}
        value={style[key] ?? 0}
        options={SPACE_OPTIONS}
        suffix="px"
        onChange={(value) => onStyleChange({ [key]: Number(value) })}
      />
    );
    return (
      <>
        <small className="builder-help">
          Chữ sửa ở từng sản phẩm. Font, size, căn lề, margin và padding dùng chung cho nội dung Material, Size, Color, Origin.
        </small>
        <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
        <SettingGroup title="Padding / margin">
          <div className="builder-field-row">
            {space("Margin trên", "marginTop")}
            {space("Margin phải", "marginRight")}
          </div>
          <div className="builder-field-row">
            {space("Margin dưới", "marginBottom")}
            {space("Margin trái", "marginLeft")}
          </div>
          <div className="builder-field-row">
            {space("Padding trên", "paddingTop")}
            {space("Padding phải", "paddingRight")}
          </div>
          <div className="builder-field-row">
            {space("Padding dưới", "paddingBottom")}
            {space("Padding trái", "paddingLeft")}
          </div>
        </SettingGroup>
      </>
    );
  }

  if (data.type === "pdFieldLabel") {
    const meta = data.meta;
    const labelStyle = productDetail.rowLabel || {};
    const fields = [
      ["material", "Material"],
      ["size", "Size"],
      ["color", "Color"],
      ["origin", "Origin"],
    ];
    return (
      <>
        <SettingGroup title="Nội dung">
          {fields.map(([key, fallback]) => (
            <div className="builder-field" key={key}>
              <label>{fallback}</label>
              <input
                value={productDetail.detailLabels?.[key] ?? productDetail[`${key}Label`]?.text ?? fallback}
                onChange={(e) => onChange({ __labelKey: key, text: e.target.value })}
              />
            </div>
          ))}
          <small className="builder-help">
            Đây là chữ hiển thị của 4 mục. Font bên dưới dùng chung.
          </small>
        </SettingGroup>
        <StyleTypographyBlock style={labelStyle} onStyleChange={onStyleChange} />
      </>
    );
  }

  const meta = data.meta;
  const style = productDetail[meta.styleKey] || {};
  const showDetailNames = meta.styleKey === "rowLabel" || selected === "pdDetailsTitle";
  const valueStyleOnly = meta.styleKey === "rowValue";

  return (
    <>
      {showDetailNames && (
        <SettingGroup title="Nội dung">
          {[
            ["material", "Material"],
            ["size", "Size"],
            ["color", "Color"],
            ["origin", "Origin"],
          ].map(([key, fallback]) => (
            <div className="builder-field" key={key}>
              <label>{fallback}</label>
              <input
                value={productDetail.detailLabels?.[key] ?? productDetail[`${key}Label`]?.text ?? fallback}
                onChange={(e) => onChange({ __labelKey: key, text: e.target.value })}
              />
            </div>
          ))}
        </SettingGroup>
      )}
      {meta.textKey && (
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>Tiêu đề</label>
            <input
              value={style.text ?? meta.sample ?? ""}
              onChange={(e) => onChange({ text: e.target.value })}
            />
          </div>
        </SettingGroup>
      )}

      {(selected === "pdDetailsTitle" || String(selected || "").startsWith("pdLabel:")) && (
        <SettingGroup title="Tên 4 mục">
          {[
            ["material", "Material"],
            ["size", "Size"],
            ["color", "Color"],
            ["origin", "Origin"],
          ].map(([key, fallback]) => (
            <div className="builder-field" key={key}>
              <label>{fallback}</label>
              <input
                value={productDetail.detailLabels?.[key] ?? productDetail[`${key}Label`]?.text ?? fallback}
                onChange={(e) => {
                  const prev = selected;
                  onChange({
                    __labelKey: key,
                    text: e.target.value,
                    __restore: prev,
                  });
                }}
              />
            </div>
          ))}
        </SettingGroup>
      )}

      {valueStyleOnly ? (
        <SettingGroup title="Font / size dùng chung">
          <small className="builder-help">
            Áp dụng cho nội dung Material, Size, Color và Origin. Không sửa chữ ở đây.
          </small>
          <SelectField
            label="Font"
            value={toBareFontFamily(style.fontFamily)}
            options={FONT_OPTIONS}
            onChange={(value) => onStyleChange({ fontFamily: toFullFontFamily(value) })}
          />
          <SelectField
            label="Size"
            value={style.fontSize ?? 14}
            options={SIZE_OPTIONS}
            suffix="px"
            onChange={(value) => onStyleChange({ fontSize: Number(value) })}
          />
        </SettingGroup>
      ) : (
        <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />
      )}

      {meta.textKey && (
        <SettingGroup title="Padding / margin">
          <div className="builder-field-row">
            <SelectField label="Margin trên" value={style.marginTop ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginTop: Number(value) })} />
            <SelectField label="Margin phải" value={style.marginRight ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginRight: Number(value) })} />
          </div>
          <div className="builder-field-row">
            <SelectField label="Margin dưới" value={style.marginBottom ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginBottom: Number(value) })} />
            <SelectField label="Margin trái" value={style.marginLeft ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ marginLeft: Number(value) })} />
          </div>
          <div className="builder-field-row">
            <SelectField label="Padding trên" value={style.paddingTop ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingTop: Number(value) })} />
            <SelectField label="Padding phải" value={style.paddingRight ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingRight: Number(value) })} />
          </div>
          <div className="builder-field-row">
            <SelectField label="Padding dưới" value={style.paddingBottom ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingBottom: Number(value) })} />
            <SelectField label="Padding trái" value={style.paddingLeft ?? 0} options={SPACE_OPTIONS} suffix="px" onChange={(value) => onStyleChange({ paddingLeft: Number(value) })} />
          </div>
        </SettingGroup>
      )}

      <SettingGroup title="Gợi ý">
        <p className="builder-help" style={{ margin: 0 }}>
          Kiểu chữ này áp dụng cho trang chi tiết của{" "}
          <strong>mọi sản phẩm</strong>. Nội dung từng SP sửa ở mục
          Sản phẩm.
        </p>
        {meta.sample && (
          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 10,
              border: "1px dashed #ead9e0",
              background: "#fffafd",
              fontFamily: style.fontFamily || undefined,
              fontSize: style.fontSize
                ? `${style.fontSize}px`
                : undefined,
              fontWeight: style.fontWeight,
              fontStyle:
                style.italic || style.fontStyle === "italic"
                  ? "italic"
                  : "normal",
              letterSpacing:
                style.letterSpacing != null
                  ? typeof style.letterSpacing === "number"
                    ? `${style.letterSpacing}px`
                    : style.letterSpacing
                  : undefined,
              lineHeight: style.lineHeight,
              color: style.color,
            }}
          >
            {meta.sample}
          </div>
        )}
      </SettingGroup>
    </>
  );
}

function TickerSettings({ selected, data, ticker, onChange, onStyleChange }) {
  if (!data) {
    return <div className="builder-empty">Chọn một thành phần trên preview.</div>;
  }

  const styles = ticker.marqueeStyles || {};

  if (selected === "band" || data.type === "tickerBand") {
    return (
      <SettingGroup title="Nền dải">
        <div className="builder-field">
          <label>Màu nền</label>
          <input
            type="color"
            value={styles.band?.color || "#fffafc"}
            onChange={(e) => onChange({ bandColor: e.target.value })}
          />
        </div>
      </SettingGroup>
    );
  }

  if (selected === "text") {
    return (
      <>
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>Mỗi dòng một câu</label>
            <textarea
              rows={7}
              value={(ticker.marqueeWords || []).join("\n")}
              onChange={(e) =>
                onChange({
                  marqueeWords: e.target.value
                    .split("\n")
                    .map((line) => line.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </SettingGroup>
        <StyleTypographyBlock style={styles.text || {}} onStyleChange={onStyleChange} />
      </>
    );
  }

  return <StyleTypographyBlock style={styles.star || {}} onStyleChange={onStyleChange} />;
}

function CollectionSettings({
  selected,
  data,
  collection,
  onChange,
  onStyleChange,
}) {
  if (!data || data.type === "colEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const meta = data.meta;
  const style =
    collection[meta.group]?.[meta.styleKey] || {};

  return (
    <>
      {meta.textKey && (
        <SettingGroup title="Nội dung">
          <div className="builder-field">
            <label>{meta.label}</label>
            <input
              value={collection[meta.textKey] || ""}
              onChange={(e) =>
                onChange({ [meta.textKey]: e.target.value })
              }
            />
          </div>
        </SettingGroup>
      )}

      <StyleTypographyBlock style={style} onStyleChange={onStyleChange} />

      <SettingGroup title="Gợi ý">
        <p className="builder-help" style={{ margin: 0 }}>
          {meta.group === "productCardStyles"
            ? "Kiểu chữ này áp dụng cho TẤT CẢ thẻ sản phẩm. Nội dung từng sản phẩm sửa ở mục Sản phẩm."
            : "Chỉnh chữ và kiểu cho tiêu đề khu vực Collection."}
        </p>
        {meta.sample && (
          <div
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 10,
              border: "1px dashed #ead9e0",
              background:
                meta.styleKey === "button" ? "#d9628a" : "#fffafd",
              color: meta.styleKey === "button" ? "#fff" : undefined,
              fontFamily: style.fontFamily
                ? `"${style.fontFamily}", serif`
                : undefined,
              fontSize: style.fontSize
                ? `${style.fontSize}px`
                : undefined,
              fontWeight: style.fontWeight,
              fontStyle:
                style.italic || style.fontStyle === "italic"
                  ? "italic"
                  : "normal",
              letterSpacing:
                style.letterSpacing != null
                  ? `${style.letterSpacing}px`
                  : undefined,
              lineHeight: style.lineHeight,
              color:
                meta.styleKey === "button"
                  ? style.color || "#fff"
                  : style.color,
            }}
          >
            {meta.sample}
          </div>
        )}
      </SettingGroup>
    </>
  );
}

function HeroSettings({ selected, data, hero, onChange }) {
  if (!data || data.type === "heroEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  if (data.type === "heroImage") {
    return (
      <SettingGroup title="Ảnh nền">
        <div className="builder-field">
          <label>URL ảnh nền</label>
          <input
            value={hero.heroImage || ""}
            onChange={(e) =>
              onChange({ heroImage: e.target.value })
            }
            placeholder="/hero.jpg"
          />
          <small className="builder-help">
            Dán URL ảnh (Cloudinary hoặc đường dẫn local).
          </small>
        </div>

        {hero.heroImage && (
          <div
            style={{
              marginTop: 8,
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid #ead9e0",
              height: 120,
              backgroundImage: `url("${hero.heroImage}")`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
      </SettingGroup>
    );
  }

  if (data.type === "heroRotator") {
    const text = (hero.heroRotator || []).join("\n");
    return (
      <SettingGroup title="Các từ đổi liên tục">
        <div className="builder-field">
          <label>Mỗi dòng một từ</label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) =>
              onChange({
                heroRotator: e.target.value
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder={"dịu nhẹ\nrạng rỡ\ntự tin"}
          />
          <small className="builder-help">
            Preview hiển thị từ đầu tiên. Trên trang thật sẽ xoay lần lượt.
          </small>
        </div>
      </SettingGroup>
    );
  }

  if (data.type === "heroButton") {
    const { textKey, linkKey, label } = data.meta;
    return (
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Chữ nút</label>
          <input
            value={hero[textKey] || ""}
            onChange={(e) =>
              onChange({ [textKey]: e.target.value })
            }
          />
        </div>
        <div className="builder-field">
          <label>Liên kết</label>
          <input
            value={hero[linkKey] || ""}
            onChange={(e) =>
              onChange({ [linkKey]: e.target.value })
            }
            placeholder="#about"
          />
        </div>
      </SettingGroup>
    );
  }

  if (data.type === "heroText") {
    const { key, label, rows } = data.meta;
    return (
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Nội dung</label>
          {rows ? (
            <textarea
              rows={rows}
              value={hero[key] || ""}
              onChange={(e) =>
                onChange({ [key]: e.target.value })
              }
            />
          ) : (
            <input
              value={hero[key] || ""}
              onChange={(e) =>
                onChange({ [key]: e.target.value })
              }
            />
          )}
        </div>
      </SettingGroup>
    );
  }

  return null;
}

function SectionSettings({ data, onChange }) {
  return (
    <>
      <SettingGroup title="Nền">
        <ColorField
          label="Màu nền"
          value={data.background}
          onChange={(value) =>
            onChange({ background: value })
          }
        />
      </SettingGroup>

      <SettingGroup title="Khoảng cách">
        <SelectField
          label="Padding trên"
          value={data.paddingTop}
          options={SPACE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({ paddingTop: Number(value) })
          }
        />

        <SelectField
          label="Padding dưới"
          value={data.paddingBottom}
          options={SPACE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({ paddingBottom: Number(value) })
          }
        />

        <SelectField
          label="Khoảng cách cột"
          value={data.gap}
          options={[2, 4, 5, 6, 7, 8, 10, 12]}
          suffix="%"
          onChange={(value) =>
            onChange({ gap: Number(value) })
          }
        />
      </SettingGroup>
    </>
  );
}

function ImageSettings({ data, onChange }) {
  return (
    <>
      <SettingGroup title="Ảnh">
        <div className="builder-field">
          <label>Ảnh chính</label>
          <input
            value={data.src || ""}
            onChange={(e) =>
              onChange({ src: e.target.value })
            }
            placeholder="/about.jpg"
          />
        </div>
        {[0, 1, 2].map((index) => (
          <div className="builder-field" key={index}>
            <label>Ảnh phụ {index + 1}</label>
            <input
              value={(data.extras || [])[index] || ""}
              onChange={(e) => {
                const extras = [...(data.extras || ["", "", ""])];
                extras[index] = e.target.value;
                onChange({ extras });
              }}
              placeholder="/about.jpg"
            />
          </div>
        ))}
      </SettingGroup>

      <SettingGroup title="Kích thước">
        <SelectField
          label="Chiều rộng"
          value={data.width}
          options={[40, 45, 48, 50, 52, 55, 60]}
          suffix="%"
          onChange={(value) =>
            onChange({ width: Number(value) })
          }
        />

        <SelectField
          label="Chiều cao"
          value={data.height}
          options={[400, 450, 500, 550, 600, 620, 650, 700, 750, 800]}
          suffix="px"
          onChange={(value) =>
            onChange({ height: Number(value) })
          }
        />

        <SelectField
          label="Bo góc"
          value={data.radius}
          options={[0, 20, 28, 40, 60, 100, 140, 180, 200]}
          suffix="px"
          onChange={(value) =>
            onChange({ radius: Number(value) })
          }
        />

        <SelectField
          label="Viền"
          value={data.borderWidth}
          options={[0, 2, 4, 6, 8, 10]}
          suffix="px"
          onChange={(value) =>
            onChange({ borderWidth: Number(value) })
          }
        />
      </SettingGroup>
    </>
  );
}

function StatTextSettings({ data, onChange, onStyleChange }) {
  const safe = data || { text: "", suffix: "", style: {}, kind: "statValue", index: 0 };
  const style = safe.style || {};
  const isValue = safe.kind === "statValue";

  const space = (label, key) => (
    <SelectField
      label={label}
      value={style[key] ?? 0}
      options={SPACE_OPTIONS}
      suffix="px"
      onChange={(value) => onStyleChange({ [key]: Number(value) })}
    />
  );

  return (
    <>
      <SettingGroup title={isValue ? "Nội dung chữ lớn" : "Nội dung chữ nhỏ"}>
        <small className="builder-help">
          {isValue
            ? "Font, size, margin và padding áp dụng cho mọi chữ lớn."
            : "Font, size, margin và padding áp dụng cho mọi chữ nhỏ."}
        </small>
        <div className="builder-field">
          <label>{isValue ? "Chữ / số của ô này" : "Mô tả của ô này"}</label>
          <input
            value={safe.text ?? ""}
            onChange={(e) => onChange({ text: e.target.value })}
          />
        </div>
        {isValue && (
          <div className="builder-field">
            <label>Ký hiệu phía sau (+, %)</label>
            <input
              value={safe.suffix || ""}
              onChange={(e) => onChange({ text: safe.text ?? "", suffix: e.target.value })}
            />
          </div>
        )}
      </SettingGroup>

      <SettingGroup title="Typography">
        <TypographyControls style={style} onChange={onStyleChange} />
      </SettingGroup>

      <SettingGroup title="Padding / margin">
        <div className="builder-field-row">
          {space("Margin trên", "marginTop")}
          {space("Margin phải", "marginRight")}
        </div>
        <div className="builder-field-row">
          {space("Margin dưới", "marginBottom")}
          {space("Margin trái", "marginLeft")}
        </div>
        <div className="builder-field-row">
          {space("Padding trên", "paddingTop")}
          {space("Padding phải", "paddingRight")}
        </div>
        <div className="builder-field-row">
          {space("Padding dưới", "paddingBottom")}
          {space("Padding trái", "paddingLeft")}
        </div>
      </SettingGroup>
    </>
  );
}

function StatsSettings({ stats, about, onChange }) {
  const list = Array.isArray(stats)
    ? stats.map((item) => ({
        value: item?.value ?? 0,
        suffix: item?.suffix || "",
        label: item?.label || "",
      }))
    : DEFAULT_ABOUT.stats;

  const valueStyle = about?.statValue || DEFAULT_ABOUT.statValue;
  const labelStyle = about?.statLabel || DEFAULT_ABOUT.statLabel;

  const patchList = (next) => onChange({ _statsList: next });

  return (
    <>
      <StyleTypographyBlock
        title="Kiểu số"
        style={valueStyle}
        onStyleChange={(patch) => onChange({ _statValue: patch })}
      />

      <SettingGroup title="Kiểu mô tả">
        <TypographyControls
          style={{
            fontFamily: toBareFontFamily(labelStyle.fontFamily),
            fontSize: labelStyle.fontSize ?? "",
            fontWeight: labelStyle.fontWeight ?? "",
            color: labelStyle.color || "",
            letterSpacing: labelStyle.letterSpacing ?? "",
            lineHeight: labelStyle.lineHeight ?? "",
            italic:
              labelStyle.italic || labelStyle.fontStyle === "italic",
            textAlign: labelStyle.textAlign || "left",
            marginTop: labelStyle.marginTop ?? 0,
            marginBottom: labelStyle.marginBottom ?? 0,
            paddingTop: labelStyle.paddingTop ?? 0,
            paddingBottom: labelStyle.paddingBottom ?? 0,
            maxWidth: labelStyle.maxWidth ?? 100,
          }}
          onChange={(patch) => {
            const next = { ...patch };
            if ("fontFamily" in patch) {
              next.fontFamily = toFullFontFamily(patch.fontFamily);
            }
            if ("italic" in patch) {
              next.fontStyle = patch.italic ? "italic" : "normal";
            }
            onChange({ _statLabel: next });
          }}
        />
      </SettingGroup>

      <SettingGroup title="Nội dung">
        {list.map((item, index) => (
          <div className="builder-stat-edit" key={index}>
            <div className="builder-stat-number">#{index + 1}</div>

            <div className="builder-field-row">
              <div className="builder-field">
                <label>Chữ / số hiển thị</label>
                <input
                  type="text"
                  value={item.value ?? ""}
                  onChange={(e) => {
                    const next = [...list];
                    next[index] = {
                      ...next[index],
                      value: e.target.value,
                    };
                    patchList(next);
                  }}
                />
              </div>

              <div className="builder-field">
                <label>Ký hiệu</label>
                <input
                  value={item.suffix || ""}
                  onChange={(e) => {
                    const next = [...list];
                    next[index] = {
                      ...next[index],
                      suffix: e.target.value,
                    };
                    patchList(next);
                  }}
                />
              </div>
            </div>

            <div className="builder-field">
              <label>Mô tả</label>
              <input
                value={item.label || ""}
                onChange={(e) => {
                  const next = [...list];
                  next[index] = {
                    ...next[index],
                    label: e.target.value,
                  };
                  patchList(next);
                }}
              />
            </div>
          </div>
        ))}
      </SettingGroup>
    </>
  );
}

function TextSettings({
  selected,
  data,
  onChange,
  onStyleChange,
}) {
  const safe = data || { text: "", style: { ...DEFAULT_STYLE } };
  const style = safe.style || { ...DEFAULT_STYLE };

  return (
    <>
      <SettingGroup title="Nội dung">
        <div className="builder-field">
          <label>
            {selected === "text"
              ? "Nội dung"
              : "Văn bản"}
          </label>

          <textarea
            rows={selected === "text" ? 7 : 4}
            value={safe.text || ""}
            onChange={(e) =>
              onChange({
                text: e.target.value,
              })
            }
            placeholder="Nhập nội dung..."
          />

          <small className="builder-help">
            Nhấn Enter để xuống dòng.
          </small>
        </div>
      </SettingGroup>

      <SettingGroup title="Typography">
        <TypographyControls
          style={style}
          onChange={onStyleChange}
        />
      </SettingGroup>
    </>
  );
}

function TypographyControls({ style, onChange }) {
  const s = style || {};
  return (
    <>
      <SelectField
        label="Font"
        value={s.fontFamily}
        options={FONT_OPTIONS}
        onChange={(value) =>
          onChange({ fontFamily: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Size"
          value={s.fontSize}
          options={SIZE_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({
              fontSize: Number(value),
            })
          }
        />

        <SelectField
          label="Weight"
          value={s.fontWeight}
          options={WEIGHT_OPTIONS}
          onChange={(value) =>
            onChange({
              fontWeight: Number(value),
            })
          }
        />
      </div>

      <ColorField
        label="Màu chữ"
        value={s.color}
        onChange={(value) =>
          onChange({ color: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Letter spacing"
          value={s.letterSpacing}
          options={LETTER_OPTIONS}
          suffix="px"
          onChange={(value) =>
            onChange({
              letterSpacing: Number(value),
            })
          }
        />

        <SelectField
          label="Line height"
          value={s.lineHeight}
          options={LINE_OPTIONS}
          onChange={(value) =>
            onChange({
              lineHeight: Number(value),
            })
          }
        />
      </div>

      <div className="builder-field">
        <label>Căn lề</label>

        <div className="builder-align">
          {[
            ["left", "≡"],
            ["center", "≡"],
            ["right", "≡"],
            ["justify", "☰"],
          ].map(([value, icon]) => (
            <button
              key={value}
              type="button"
              className={
                s.textAlign === value
                  ? "active"
                  : ""
              }
              onClick={() =>
                onChange({
                  textAlign: value,
                })
              }
              title={value}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div className="builder-field">
        <label>Kiểu chữ</label>

        <button
          type="button"
          className={`builder-toggle ${
            s.italic ? "active" : ""
          }`}
          onClick={() =>
            onChange({
              italic: !s.italic,
            })
          }
        >
          <i>I</i> Italic
        </button>
      </div>

      <SettingGroup title="Spacing">
        <div className="builder-field-row">
          <SelectField
            label="Margin trên"
            value={s.marginTop}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                marginTop: Number(value),
              })
            }
          />

          <SelectField
            label="Margin dưới"
            value={s.marginBottom}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                marginBottom: Number(value),
              })
            }
          />
        </div>

        <div className="builder-field-row">
          <SelectField
            label="Padding trên"
            value={s.paddingTop}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                paddingTop: Number(value),
              })
            }
          />

          <SelectField
            label="Padding dưới"
            value={s.paddingBottom}
            options={SPACE_OPTIONS}
            suffix="px"
            onChange={(value) =>
              onChange({
                paddingBottom: Number(value),
              })
            }
          />
        </div>

        <SelectField
          label="Max width"
          value={s.maxWidth}
          options={[
            30,
            40,
            50,
            60,
            70,
            80,
            90,
            100,
          ]}
          suffix="%"
          onChange={(value) =>
            onChange({
              maxWidth: Number(value),
            })
          }
        />
      </SettingGroup>
    </>
  );
}

function SettingGroup({ title, children }) {
  return (
    <div className="builder-setting-group">
      <h3>{title}</h3>
      <div className="builder-setting-content">
        {children}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  suffix = "",
  onChange,
}) {
  const list = Array.isArray(options) ? options : [];
  const raw = value ?? "";
  const hasValue = list.some((option) => String(option) === String(raw));
  const selectValue = raw === "" || hasValue ? raw : String(raw);
  const extra =
    raw !== "" && !hasValue ? (
      <option value={selectValue}>
        {selectValue}
        {suffix}
      </option>
    ) : null;

  return (
    <div className="builder-field">
      <label>{label}</label>

      <select
        value={selectValue}
        onChange={(e) => onChange(e.target.value)}
      >
        {raw === "" && !hasValue && (
          <option value="">—</option>
        )}
        {extra}
        {list.map((option) => (
          <option key={String(option)} value={option}>
            {option}
            {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}

function toSafeHexColor(value) {
  if (typeof value !== "string") return "#000000";
  const v = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v;
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  }
  return "#000000";
}

function ColorField({ label, value, onChange }) {
  const hex = toSafeHexColor(value);
  return (
    <div className="builder-color-field">
      <div>
        <label>{label}</label>
        <span>{value || hex}</span>
      </div>

      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}