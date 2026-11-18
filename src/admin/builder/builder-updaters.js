import { getSelectedData } from "./AboutPanels.helpers";
import { getHeroSelectedData } from "./HeroPanels.helpers";
import { getCollectionSelectedData } from "./CollectionPanels.helpers";
import { getProductDetailSelectedData } from "./ProductDetailPanels.helpers";
import { getFeaturesSelectedData } from "./FeaturesPanels.helpers";
import { getReviewsSelectedData } from "./ReviewsPanels.helpers";
import { getFooterSelectedData } from "./FooterPanels.helpers";
import { getNewsletterSelectedData } from "./NewsletterPanels.helpers";
import { getTickerSelectedData } from "./TickerPanels.helpers";
import {
  COLLECTION_FIELD_MAP,
  PRODUCT_DETAIL_FIELD_MAP,
  FEATURES_TEXT_MAP,
  REVIEWS_TEXT_MAP,
  FOOTER_FIELD_MAP,
  NEWSLETTER_FIELD_MAP,
} from "./registry";

export function resolveSelectedData({
  activeSection,
  selected,
  about,
  hero,
  collection,
  productDetail,
  detailProduct,
  features,
  reviews,
  newsletter,
  footer,
  ticker,
  navbar,
  philosophy,
}) {
  if (activeSection === "navbar") return { type: "navbar", data: navbar };
  if (activeSection === "philosophy") return { type: "philosophy", data: philosophy };
  if (activeSection === "hero") return getHeroSelectedData(hero, selected);
  if (activeSection === "collection") return getCollectionSelectedData(collection, selected);
  if (activeSection === "productdetail") {
    return getProductDetailSelectedData(productDetail, selected, detailProduct);
  }
  if (activeSection === "features") return getFeaturesSelectedData(features, selected);
  if (activeSection === "reviews") return getReviewsSelectedData(reviews, selected);
  if (activeSection === "newsletter") return getNewsletterSelectedData(newsletter, selected);
  if (activeSection === "footer") return getFooterSelectedData(footer, selected);
  if (activeSection === "ticker") return getTickerSelectedData(ticker, selected);
  return getSelectedData(about, selected);
}

export function applySelectedPatch(
  { activeSection, selected, setters },
  patch,
) {
  const {
    setAbout,
    setHero,
    setCollection,
    setProductDetail,
    setFeatures,
    setReviews,
    setNewsletter,
    setFooter,
    setTicker,
    setNavbar,
    setPhilosophy,
  } = setters;

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
    if (patch.informationTabs || patch.mobileLayout) {
      setProductDetail((c) => ({ ...c, ...patch }));
      return;
    }
    if (patch.loadError) {
      setProductDetail((current) => ({
        ...current,
        loadError: { ...current.loadError, ...patch.loadError },
      }));
      return;
    }
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
      if (
        patch.collectionLabel !== undefined ||
        patch.collectionTitle !== undefined ||
        patch.collectionHighlight !== undefined
      ) {
        return { ...current, ...patch };
      }
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
}

export function applySelectedStylePatch(
  { activeSection, selected, setters },
  patch,
) {
  const {
    setAbout,
    setCollection,
    setProductDetail,
    setFeatures,
    setReviews,
    setNewsletter,
    setFooter,
    setTicker,
    setNavbar,
    setPhilosophy,
  } = setters;

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

    if (selected === "section" || selected === "image" || selected === "stats") {
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
}
