import { auth } from "../../lib/firebaseAuth";
import { builderDraftKey, saveBuilderDraft, readBuilderDraft } from "./drafts";
import PreviewFrame from "./PreviewFrame";
import { PREVIEW_PRODUCTS } from "./preview-products";
import { DEFAULT_TICKER } from "./defaults";
import { useEffect, useMemo, useState } from "react";
import { getHomeContent, saveHomeContent } from "../../lib/api";
import About from "../../components/About";
import Hero from "../../components/Hero";
import Collection from "../../components/Collection";
import ProductDetail from "../../components/ProductDetail";
import { Testimonials, Features, Newsletter } from "../../components/Extras";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ScrollText from "../../components/ScrollText";
import "./VisualBuilder.css";

import { StylePanel } from "./StylePanels";
import { getSelectedData } from "./AboutPanels.helpers";
import { getHeroSelectedData } from "./HeroPanels.helpers";
import { getCollectionSelectedData } from "./CollectionPanels.helpers";
import { getProductDetailSelectedData } from "./ProductDetailPanels.helpers";
import { getFeaturesSelectedData } from "./FeaturesPanels.helpers";
import { getReviewsSelectedData } from "./ReviewsPanels.helpers";
import { getFooterSelectedData } from "./FooterPanels.helpers";
import { getNewsletterSelectedData } from "./NewsletterPanels.helpers";
import { TickerPreview } from "./TickerPanels";
import { getTickerSelectedData } from "./TickerPanels.helpers";
import { COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP, NEWSLETTER_FIELD_MAP } from "./registry";
import { DEFAULT_ABOUT } from "./defaults";

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
    heroImageMobile: "",
  heroMobileImage: "",
  heroChip1: "Dịu nhẹ cho da",
  heroChip2: "Thành phần thuần khiết",
  heroChip3: "Cấp ẩm sâu",  
  heroRingText: "ORORA ✦ SẢN PHẨM ✦ ORORA ✦",
  heroScrollText: "CUỘN",
};

const DEFAULT_COLLECTION = {
  collectionLabel: "",
  collectionTitle: "",
  collectionHighlight: "",
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
      color: "#e2678f",
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
    imageLayout: {
      widthPercent: 100,
      height: 0,
      aspectRatio: "3 / 4",
      radius: 20,
      borderWidth: 0,
      borderColor: "#ffffff",
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      marginTop: 0,
      marginRight: 0,
      marginBottom: 0,
      marginLeft: 0,
      objectFit: "cover",
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
  // Layout khối gallery — ngang/margin cả khối; dọc chỉ ảnh chính
  imageLayout: {
    widthPercent: 100,
    maxWidth: 420,
    height: 0,
    aspectRatio: "3 / 4",
    objectFit: "cover",
    radius: 28,
    borderWidth: 6,
    borderColor: "#ffffff",
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    gap: 14,
  },
  // Layout riêng hàng ảnh phụ
  thumbsLayout: {
    gap: 10,
    radius: 14,
    borderWidth: 2,
    borderColor: "#ffffff",
    activeBorderColor: "#b8446d",
    paddingTop: 0,
    paddingRight: 0,
    paddingBottom: 0,
    paddingLeft: 0,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
    marginLeft: 0,
    height: 0,
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

const DEFAULT_NEWSLETTER = {
  newsletterTitle: "Nhận ưu đãi",
  newsletterHighlight: "ngay",
  newsletterText:
    "Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn.",
  newsletterPlaceholder: "Email của bạn",
  newsletterButton: "Đăng ký",
  newsletterStyles: {
    title: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 600,
      color: "#3a1526",
    },
    highlight: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 500,
      fontStyle: "italic",
      color: "#b8446d",
    },
    text: {
      fontSize: 15,
      lineHeight: 1.7,
      color: "#7d656f",
    },
    input: {
      fontSize: 14,
      color: "#3a1526",
    },
    button: {
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 1,
      color: "#ffffff",
    },
  },
};

function createNewsletter(data = {}) {
  return {
    newsletterTitle:
      data.newsletterTitle ?? DEFAULT_NEWSLETTER.newsletterTitle,
    newsletterHighlight:
      data.newsletterHighlight ?? DEFAULT_NEWSLETTER.newsletterHighlight,
    newsletterText: data.newsletterText ?? DEFAULT_NEWSLETTER.newsletterText,
    newsletterPlaceholder:
      data.newsletterPlaceholder ?? DEFAULT_NEWSLETTER.newsletterPlaceholder,
    newsletterButton:
      data.newsletterButton ?? DEFAULT_NEWSLETTER.newsletterButton,
    newsletterStyles: mergeNestedStyle(
      DEFAULT_NEWSLETTER.newsletterStyles,
      data.newsletterStyles
    ),
  };
}

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
      ? data.navLinks.map((item, index) => ({
          label: item.label || "",
          href:
            item.href && item.href !== "/"
              ? item.href
              : DEFAULT_NAV.navLinks[index]?.href || "/",
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
      // Đồng nhất với form cũ: ưu tiên storyImage/storyImages nếu có
      src:
        (data.storyImage && String(data.storyImage).trim()) ||
        builder.image?.src ||
        DEFAULT_ABOUT.image.src,
      extras: (() => {
        const fromForm = Array.isArray(data.storyImages)
          ? data.storyImages
          : null;
        const fromBuilder = Array.isArray(builder.image?.extras)
          ? builder.image.extras
          : null;
        if (fromForm && fromForm.some((x) => x && String(x).trim())) {
          return fromForm;
        }
        if (fromBuilder) return fromBuilder;
        return ["", "", ""];
      })(),
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
    heroMobileImage: data.heroMobileImage ?? DEFAULT_HERO.heroMobileImage,
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
  newsletter: "nlTitle",
  footer: "ftLogo",
  ticker: "text",
};

export default function VisualBuilder() {
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [productDetail, setProductDetail] = useState(DEFAULT_PRODUCT_DETAIL);
  const sampleProducts = PREVIEW_PRODUCTS;
  const detailProduct = PREVIEW_PRODUCTS[0];
  const [features, setFeatures] = useState(DEFAULT_FEATURES);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [newsletter, setNewsletter] = useState(DEFAULT_NEWSLETTER);
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
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;

    getHomeContent()
      .then((data) => {
        if (!alive) return;

        setAbout(createAbout(data || {}));
        setHero(createHero(data || {}));
        setCollection(createCollection(data || {}));
        setProductDetail(createProductDetail(data || {}));
        setFeatures(createFeatures(data || {}));
        setReviews(createReviews(data || {}));
        setNewsletter(createNewsletter(data || {}));
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
          setAbout(DEFAULT_ABOUT);
          setHero(DEFAULT_HERO);
          setCollection(DEFAULT_COLLECTION);
          setProductDetail(DEFAULT_PRODUCT_DETAIL);
          setFeatures(DEFAULT_FEATURES);
          setReviews(DEFAULT_REVIEWS);
          setNewsletter(DEFAULT_NEWSLETTER);
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
    if (activeSection === "newsletter") {
      return getNewsletterSelectedData(newsletter, selected);
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
    newsletter,
    footer,
    ticker,
    navbar,
    philosophy,
    selected,
    detailProduct,
  ]);

  const updateSelected = (patch) => {
    setDirty(true);
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

    if (activeSection === "newsletter") {
      setNewsletter((current) => ({ ...current, ...patch }));
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
    setDirty(true);
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
      if (!meta || (meta.type !== "colStyle" && meta.type !== "cardImage")) return;
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

    if (activeSection === "newsletter") {
      const styleKey = NEWSLETTER_FIELD_MAP[selected]?.styleKey;
      if (!styleKey) return;
      setNewsletter((current) => ({
        ...current,
        newsletterStyles: {
          ...(current.newsletterStyles || {}),
          [styleKey]: {
            ...(current.newsletterStyles?.[styleKey] || {}),
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

  const draftKey = builderDraftKey(auth?.currentUser?.uid || "local");
  const saveDraft = () => {
    try {
      saveBuilderDraft(localStorage, draftKey, { about, hero, collection, productDetail, features, reviews, newsletter, footer, ticker, navbar, philosophy });
      setMessage({ type: "success", text: "Đã lưu bản nháp trên trình duyệt này. Website chưa thay đổi." });
    } catch { setMessage({ type: "error", text: "Không lưu được bản nháp. Kiểm tra dung lượng lưu trữ của trình duyệt." }); }
  };
  const restoreDraft = () => {
    try {
      const draft = readBuilderDraft(localStorage, draftKey);
      if (!draft) return setMessage({ type: "error", text: "Chưa có bản nháp trên trình duyệt này." });
      const data = draft.sections;
      setAbout(data.about); setHero(data.hero); setCollection(data.collection); setProductDetail(data.productDetail);
      setFeatures(data.features); setReviews(data.reviews); setNewsletter(data.newsletter); setFooter(data.footer);
      setTicker(data.ticker); setNavbar(data.navbar); setPhilosophy(data.philosophy);
      setDirty(true);
      setMessage({ type: "success", text: "Đã mở bản nháp để xem trước. Chưa áp dụng lên website." });
    } catch { setMessage({ type: "error", text: "Không mở được bản nháp đã lưu." }); }
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
        heroMobileImage: hero.heroMobileImage,
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

        // Newsletter / Nhận tin
        newsletterTitle: newsletter.newsletterTitle,
        newsletterHighlight: newsletter.newsletterHighlight,
        newsletterText: newsletter.newsletterText,
        newsletterPlaceholder: newsletter.newsletterPlaceholder,
        newsletterButton: newsletter.newsletterButton,
        newsletterStyles: newsletter.newsletterStyles,

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
      setDirty(false);

      setMessage({
        type: "success",
        text: "Đã áp dụng giao diện lên website.",
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
            {dirty ? "Có thay đổi chưa áp dụng lên website." : "Chọn thành phần để chỉnh. Website chỉ đổi khi bấm Áp dụng."}
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

          <button type="button" className="admin-btn" disabled={saving} onClick={restoreDraft}>Mở bản nháp</button>
          <button type="button" className="admin-btn" disabled={saving} onClick={saveDraft}>Lưu bản nháp</button>
          <button
            type="button"
            className="admin-btn primary"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Đang áp dụng…" : "Áp dụng lên website"}
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
            <span>Sản phẩm mẫu · Xem trước tĩnh · Không thay đổi dữ liệu</span>

            <div className="builder-device" role="group" aria-label="Thiết bị xem trước">
              <button type="button" aria-pressed={previewDevice === "desktop"} onClick={() => setPreviewDevice("desktop")}>Desktop</button>
              <button type="button" aria-pressed={previewDevice === "mobile"} onClick={() => setPreviewDevice("mobile")}>Mobile</button>
            </div>
          </div>

          <PreviewFrame device={previewDevice}>
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
                sampleProducts={sampleProducts.slice(0, 3)}
              />
            ) : activeSection === "productdetail" ? (
              <ProductDetail
                preview
                previewStyles={productDetail}
                previewProduct={detailProduct}
                previewProducts={sampleProducts}
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
            ) : activeSection === "newsletter" ? (
              <Newsletter
                preview
                previewData={newsletter}
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
          </PreviewFrame>
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
            newsletter={newsletter}
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
