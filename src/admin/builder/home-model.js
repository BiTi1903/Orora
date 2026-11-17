import {footerCopy,FOOTER_LABELS} from "../../lib/footer-copy";
import {DEFAULT_ABOUT,DEFAULT_TICKER} from "./defaults";

const DEFAULT_HERO = {
  heroEyebrow: "WELCOME TO",
  heroTitle: "ORORA",
  heroDescription: "Create something beautiful.",
  heroGlassCards: [],
  heroRotatorPrefix: "Làn da",
  heroRotatorSuffix: "mỗi ngày",
  heroRotator: ["dịu nhẹ", "rạng rỡ", "tự tin", "tỏa sáng"],
  heroButtonText: "Khám phá",
  heroButtonLink: "#about",
  shopButtonText: "Xem sản phẩm",
  shopButtonLink: "#shop",
  heroImage: "/hero.jpg",
    heroImageMobile: "",
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
      fontSize: "",
      fontWeight: 600,
      letterSpacing: -3,
      lineHeight: 0.92,
      color: "#e2678f",
    },
    highlight: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: "",
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
      color: "#b8446d",
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
      fontSize: "",
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
      fontSize: "",
      fontWeight: 600,
      color: "#3a1526",
    },
    highlight: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: "",
      fontWeight: 400,
      color: "#e2678f",
      fontStyle: "italic",
    },
    titleEnd: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: "",
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
  ...FOOTER_LABELS,
  footerLogo: "ORORA",
  footerDescription: "Chăm sóc làn da, nuôi dưỡng sự tự tin.",
  footerTrackingText: "Tra cứu đơn hàng",
  footerZaloText: "Zalo",
  footerPhone: "0822.466.800",
  footerEmail: "sales@ororavn.com",
  footerAddress: "207A Nguyễn Văn Thủ, Tân Định, HCM",
  footerInstagram: "#",
  footerFacebook: "#",
  footerTikTok: "#",
  footerYouTube: "#",
  footerCopyright: "© 2026 ORORA. Bảo lưu mọi quyền.",
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
  newsletterConsent: "Tôi đồng ý nhận email về sản phẩm và ưu đãi từ ORORA. Có thể hủy đăng ký bất cứ lúc nào.",
  newsletterStyles: {
    title: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: "",
      fontWeight: 600,
      color: "#3a1526",
    },
    highlight: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: "",
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
    newsletterConsent: data.newsletterConsent ?? DEFAULT_NEWSLETTER.newsletterConsent,
    newsletterStyles: mergeNestedStyle(
      DEFAULT_NEWSLETTER.newsletterStyles,
      data.newsletterStyles
    ),
  };
}


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
    heroGlassCards: Array.isArray(data.heroGlassCards) ? data.heroGlassCards : [],
    heroRotatorPrefix: data.heroRotatorPrefix ?? DEFAULT_HERO.heroRotatorPrefix,
    heroRotatorSuffix: data.heroRotatorSuffix ?? DEFAULT_HERO.heroRotatorSuffix,
    heroStyles: data.heroStyles || {},
    heroRotator:
      Array.isArray(data.heroRotator)
        ? data.heroRotator
        : DEFAULT_HERO.heroRotator,
    heroButtonText: data.heroButtonText ?? DEFAULT_HERO.heroButtonText,
    heroButtonLink: data.heroButtonLink ?? DEFAULT_HERO.heroButtonLink,
    shopButtonText: data.shopButtonText ?? DEFAULT_HERO.shopButtonText,
    shopButtonLink: data.shopButtonLink ?? DEFAULT_HERO.shopButtonLink,
    heroImage: data.heroImage ?? DEFAULT_HERO.heroImage,
    heroImageMobile: data.heroImageMobile ?? data.heroMobileImage ?? DEFAULT_HERO.heroImageMobile,
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
  const styles = mergeNestedStyle(DEFAULT_PRODUCT_DETAIL, data.productDetailStyles);
  return { ...styles, detailLabels: { ...(DEFAULT_PRODUCT_DETAIL.detailLabels || {}), ...(data.detailLabels || {}), ...(data.productDetailStyles?.detailLabels || {}) } };
}

function createFeatures(data = {}) {
  return {
    featuresLabel: data.featuresLabel ?? DEFAULT_FEATURES.featuresLabel,
    featuresTitle: data.featuresTitle ?? DEFAULT_FEATURES.featuresTitle,
    features:
      Array.isArray(data.features)
        ? data.features.map((f) => ({
            ...f,
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
      Array.isArray(data.reviews)
        ? data.reviews.map((r) => ({
            ...r,
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
  data=footerCopy(data);
  const result = { ...DEFAULT_FOOTER };
  for (const key of Object.keys(DEFAULT_FOOTER)) {
    if (key === "footerStyles") continue;
    if (data[key] != null) {
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
    marqueeWords: Array.isArray(data.marqueeWords)
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

function buildHomePayload({ about, hero, collection, productDetail, features, reviews, newsletter, footer, ticker, navbar, philosophy }) {
  return {
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
    heroRotatorPrefix: hero.heroRotatorPrefix,
    heroRotatorSuffix: hero.heroRotatorSuffix,
    heroStyles: hero.heroStyles || {},
    heroButtonText: hero.heroButtonText,
    heroButtonLink: hero.heroButtonLink,
    shopButtonText: hero.shopButtonText,
    shopButtonLink: hero.shopButtonLink,
    heroImage: hero.heroImage,
    heroImageMobile: hero.heroImageMobile,
    heroChip1: hero.heroChip1,
    heroChip2: hero.heroChip2,
    heroChip3: hero.heroChip3,
    heroGlassCards: hero.heroGlassCards,
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
    newsletterConsent: newsletter.newsletterConsent,
    newsletterStyles: newsletter.newsletterStyles,

    // Footer
    footerLogo: footer.footerLogo,
    footerDescription: footer.footerDescription,
    footerInfoTitle: footer.footerInfoTitle,
    footerAboutText: footer.footerAboutText,
    footerShopText: footer.footerShopText,
    footerTrackingText: footer.footerTrackingText,
    footerTermsText: footer.footerTermsText,
    footerPrivacyText: footer.footerPrivacyText,
    footerContactTitle: footer.footerContactTitle,
    footerZaloText: footer.footerZaloText,
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
}


export function createPhilosophy(data={}){
 return {philosophyLabel:data.philosophyLabel||'✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦',philosophyBody:data.philosophyBody||data.philosophyText||'TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.',philosophyAccentCount:data.philosophyAccentCount??4,philosophyStyles:data.philosophyStyles||{}};
}

export { DEFAULT_HERO, DEFAULT_COLLECTION, DEFAULT_PRODUCT_DETAIL, DEFAULT_FEATURES, DEFAULT_REVIEWS, DEFAULT_FOOTER, DEFAULT_NEWSLETTER, createNewsletter, createAbout, createHero, createCollection, createProductDetail, createFeatures, createReviews, createFooter, createTicker, SECTION_DEFAULT_SELECTED, buildHomePayload };
