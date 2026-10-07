import { useEffect, useMemo, useState } from "react";
import { getHomeContent, saveHomeContent } from "../../lib/api";
import About from "../../components/About";
import Hero from "../../components/Hero";
import Collection from "../../components/Collection";
import ProductDetail from "../../components/ProductDetail";
import { Testimonials } from "../../components/Extras";
import Footer from "../../components/Footer";
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
    width: 52,
    height: 620,
    radius: 200,
    borderWidth: 8,
  },

  stats: [
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
  rowValue: {
    fontSize: 14,
    lineHeight: 1.7,
    color: "#7d656f",
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
};

const SECTION_LIST = [
  {
    key: "hero",
    label: "Hero",
    icon: "✦",
  },
  {
    key: "ticker",
    label: "Dải chữ chạy",
    icon: "↔",
    disabled: true,
  },
  {
    key: "about",
    label: "Câu chuyện",
    icon: "♡",
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
    label: "Lý do chọn",
    icon: "✧",
    disabled: true,
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
    },

    stats:
      builder.stats?.length
        ? builder.stats
        : data.storyStats?.length
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
  };
}

function createFooter(data = {}) {
  const result = { ...DEFAULT_FOOTER };
  for (const key of Object.keys(DEFAULT_FOOTER)) {
    if (data[key] != null && data[key] !== "") {
      result[key] = data[key];
    }
  }
  return result;
}

const SECTION_DEFAULT_SELECTED = {
  hero: "title",
  about: "title",
  collection: "colTitle",
  productdetail: "pdName",
  reviews: "revTitle",
  footer: "ftLogo",
};

export default function VisualBuilder() {
  const [home, setHome] = useState(null);
  const [about, setAbout] = useState(DEFAULT_ABOUT);
  const [hero, setHero] = useState(DEFAULT_HERO);
  const [collection, setCollection] = useState(DEFAULT_COLLECTION);
  const [productDetail, setProductDetail] = useState(DEFAULT_PRODUCT_DETAIL);
  const [reviews, setReviews] = useState(DEFAULT_REVIEWS);
  const [footer, setFooter] = useState(DEFAULT_FOOTER);
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
        setReviews(createReviews(data || {}));
        setFooter(createFooter(data || {}));
      })
      .catch((err) => {
        console.error(err);
        if (alive) {
          setHome({});
          setAbout(DEFAULT_ABOUT);
          setHero(DEFAULT_HERO);
          setCollection(DEFAULT_COLLECTION);
          setProductDetail(DEFAULT_PRODUCT_DETAIL);
          setReviews(DEFAULT_REVIEWS);
          setFooter(DEFAULT_FOOTER);
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
    if (activeSection === "hero") {
      return getHeroSelectedData(hero, selected);
    }
    if (activeSection === "collection") {
      return getCollectionSelectedData(collection, selected);
    }
    if (activeSection === "productdetail") {
      return getProductDetailSelectedData(productDetail, selected);
    }
    if (activeSection === "reviews") {
      return getReviewsSelectedData(reviews, selected);
    }
    if (activeSection === "footer") {
      return getFooterSelectedData(footer, selected);
    }
    return getSelectedData(about, selected);
  }, [
    activeSection,
    about,
    hero,
    collection,
    productDetail,
    reviews,
    footer,
    selected,
  ]);

  const updateSelected = (patch) => {
    if (activeSection === "hero") {
      setHero((current) => ({ ...current, ...patch }));
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
      // style-only section — updates go through updateSelectedStyle
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
        return {
          ...current,
          stats: patch,
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
    if (activeSection === "hero") return;

    if (activeSection === "productdetail") {
      const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
      if (!meta) return;
      setProductDetail((current) => ({
        ...current,
        [meta.styleKey]: {
          ...(current[meta.styleKey] || {}),
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

    setAbout((current) => {
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
        storyStats: about.stats,

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

        // Reviews / Cảm nhận
        testimonialsLabel: reviews.testimonialsLabel,
        testimonialsTitle: reviews.testimonialsTitle,
        testimonialsHighlight: reviews.testimonialsHighlight,
        testimonialsTitleEnd: reviews.testimonialsTitleEnd,
        reviews: reviews.reviews,

        // Footer
        ...footer,
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
            <span>Preview</span>

            <span className="builder-device">
              Desktop
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
              activeSection === "reviews"
                ? "builder-preview--reviews"
                : "",
              activeSection === "footer"
                ? "builder-preview--footer"
                : "",
            ].join(" ")}
          >
            {activeSection === "hero" ? (
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
                previewProduct={defaultProducts[0]}
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
            reviews={reviews}
            footer={footer}
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
      data: about.stats,
    };
  }

  return {
    type: "text",
    data: about[selected],
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
    label: "Giá trị thông tin",
    sample: "Premium material with a soft finish.",
  },
};

function getProductDetailSelectedData(productDetail, selected) {
  const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
  if (!meta) {
    return { type: "pdEmpty", data: null };
  }
  return { type: "pdStyle", data: productDetail, meta };
}

const REVIEWS_TEXT_MAP = {
  revLabel: { key: "testimonialsLabel", label: "Nhãn nhỏ" },
  revTitle: { key: "testimonialsTitle", label: "Tiêu đề (trước)" },
  revHighlight: { key: "testimonialsHighlight", label: "Chữ nổi bật" },
  revTitleEnd: { key: "testimonialsTitleEnd", label: "Tiêu đề (sau)" },
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
  ftLogo: { key: "footerLogo", label: "Tên thương hiệu" },
  ftDesc: { key: "footerDescription", label: "Mô tả", rows: 3 },
  ftInfoTitle: { key: "footerInfoTitle", label: "Tiêu đề Information" },
  ftAbout: { key: "footerAboutText", label: "About us" },
  ftShop: { key: "footerShopText", label: "Shop" },
  ftTerms: { key: "footerTermsText", label: "Terms & Conditions" },
  ftPrivacy: { key: "footerPrivacyText", label: "Privacy Policy" },
  ftContactTitle: { key: "footerContactTitle", label: "Tiêu đề Contact" },
  ftPhone: { key: "footerPhone", label: "Số điện thoại" },
  ftEmail: { key: "footerEmail", label: "Email" },
  ftAddress: { key: "footerAddress", label: "Địa chỉ", rows: 2 },
  ftSocialTitle: { key: "footerSocialTitle", label: "Tiêu đề mạng xã hội" },
  ftInstagram: { key: "footerInstagram", label: "Link Instagram" },
  ftFacebook: { key: "footerFacebook", label: "Link Facebook" },
  ftTikTok: { key: "footerTikTok", label: "Link TikTok" },
  ftYouTube: { key: "footerYouTube", label: "Link YouTube" },
  ftCopyright: { key: "footerCopyright", label: "Copyright" },
  ftCompany: { key: "footerCompanyNumber", label: "Thông tin công ty" },
};

function getFooterSelectedData(footer, selected) {
  const meta = FOOTER_FIELD_MAP[selected];
  if (!meta) return { type: "ftEmpty", data: null };
  return { type: "ftText", data: footer, meta };
}

function StylePanel({
  section,
  selected,
  data,
  about,
  hero,
  collection,
  productDetail,
  reviews,
  footer,
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

  const sideLabel =
    section === "hero"
      ? data.meta?.label || HERO_FIELD_MAP[selected]?.label || selected
      : section === "collection"
      ? data.meta?.label || COLLECTION_FIELD_MAP[selected]?.label || selected
      : section === "productdetail"
      ? data.meta?.label ||
        PRODUCT_DETAIL_FIELD_MAP[selected]?.label ||
        selected
      : section === "reviews"
      ? data.meta?.label || REVIEWS_TEXT_MAP[selected]?.label || selected
      : section === "footer"
      ? data.meta?.label || FOOTER_FIELD_MAP[selected]?.label || selected
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
          onStyleChange={onStyleChange}
        />
      )}

      {section === "reviews" && (
        <ReviewsSettings
          selected={selected}
          data={data}
          reviews={reviews}
          onChange={onChange}
        />
      )}

      {section === "footer" && (
        <FooterSettings
          selected={selected}
          data={data}
          footer={footer}
          onChange={onChange}
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

function ReviewsSettings({ selected, data, reviews, onChange }) {
  if (!data || data.type === "revEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  if (data.type === "revText") {
    const { key, label } = data.meta;
    return (
      <SettingGroup title={label}>
        <div className="builder-field">
          <label>Nội dung</label>
          <input
            value={reviews[key] || ""}
            onChange={(e) => onChange({ [key]: e.target.value })}
          />
        </div>
      </SettingGroup>
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

function FooterSettings({ data, footer, onChange }) {
  if (!data || data.type === "ftEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const { key, label, rows } = data.meta;

  return (
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
  );
}

function ProductDetailSettings({
  selected,
  data,
  productDetail,
  onStyleChange,
}) {
  if (!data || data.type === "pdEmpty") {
    return (
      <div className="builder-empty">
        Chọn một thành phần trên preview.
      </div>
    );
  }

  const meta = data.meta;
  const style = productDetail[meta.styleKey] || {};

  return (
    <>
      <SettingGroup title="Typography">
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

      <SettingGroup title="Typography">
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
          <label>URL hình ảnh</label>
          <input
            value={data.src || ""}
            onChange={(e) =>
              onChange({ src: e.target.value })
            }
            placeholder="/about.jpg"
          />
        </div>
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

function StatsSettings({ stats, about, onChange }) {
  return (
    <>
      <SettingGroup title="Kiểu số">
        <TypographyControls
          style={about.statValue}
          onChange={(patch) =>
            onChange({
              ...about.statValue,
              ...patch,
            })
          }
        />
      </SettingGroup>

      <SettingGroup title="Kiểu mô tả">
        <TypographyControls
          style={about.statLabel}
          onChange={(patch) =>
            onChange({
              ...about.statLabel,
              ...patch,
            })
          }
        />
      </SettingGroup>

      <SettingGroup title="Nội dung">
        {stats.map((item, index) => (
          <div className="builder-stat-edit" key={index}>
            <div className="builder-stat-number">
              #{index + 1}
            </div>

            <div className="builder-field-row">
              <div className="builder-field">
                <label>Số</label>
                <input
                  type="number"
                  value={item.value ?? ""}
                  onChange={(e) => {
                    const next = [...stats];
                    next[index] = {
                      ...next[index],
                      value:
                        Number(e.target.value) || 0,
                    };
                    onChange(next);
                  }}
                />
              </div>

              <div className="builder-field">
                <label>Ký hiệu</label>
                <input
                  value={item.suffix || ""}
                  onChange={(e) => {
                    const next = [...stats];
                    next[index] = {
                      ...next[index],
                      suffix: e.target.value,
                    };
                    onChange(next);
                  }}
                />
              </div>
            </div>

            <div className="builder-field">
              <label>Mô tả</label>
              <input
                value={item.label || ""}
                onChange={(e) => {
                  const next = [...stats];
                  next[index] = {
                    ...next[index],
                    label: e.target.value,
                  };
                  onChange(next);
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
            value={data.text || ""}
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
          style={data.style}
          onChange={onStyleChange}
        />
      </SettingGroup>
    </>
  );
}

function TypographyControls({ style, onChange }) {
  return (
    <>
      <SelectField
        label="Font"
        value={style.fontFamily}
        options={FONT_OPTIONS}
        onChange={(value) =>
          onChange({ fontFamily: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Size"
          value={style.fontSize}
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
          value={style.fontWeight}
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
        value={style.color}
        onChange={(value) =>
          onChange({ color: value })
        }
      />

      <div className="builder-field-row">
        <SelectField
          label="Letter spacing"
          value={style.letterSpacing}
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
          value={style.lineHeight}
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
                style.textAlign === value
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
            style.italic ? "active" : ""
          }`}
          onClick={() =>
            onChange({
              italic: !style.italic,
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
            value={style.marginTop}
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
            value={style.marginBottom}
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
            value={style.paddingTop}
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
            value={style.paddingBottom}
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
          value={style.maxWidth}
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
  return (
    <div className="builder-field">
      <label>{label}</label>

      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={String(option)} value={option}>
            {option}
            {suffix}
          </option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div className="builder-color-field">
      <div>
        <label>{label}</label>
        <span>{value}</span>
      </div>

      <input
        type="color"
        value={value || "#000000"}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}