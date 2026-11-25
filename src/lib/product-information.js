import { PRODUCT_CONTENT_GROUPS } from "./product-content.js";

const IMAGE_FITS = ["cover", "contain"];
const IMAGE_SHADOWS = {
  none: "none",
  soft: "0 10px 28px rgba(102, 56, 76, 0.08)",
  medium: "0 16px 38px rgba(102, 56, 76, 0.14)",
  elevated: "0 22px 48px rgba(102, 56, 76, 0.2)",
};
const SKELETON_EFFECTS = ["shimmer", "shimmer-rose", "pulse", "wave", "static"];
const TAB_TRANSITIONS = ["slide-up", "slide-left", "fade", "blur-in", "zoom", "none"];
const REVEAL_EFFECTS = ["rise", "fade", "zoom", "blur-in", "curtain", "slide-left", "none"];
const CAPTION_EFFECTS = ["fade", "rise", "blur-in", "zoom", "slide-left", "stagger", "none"];
const CAPTION_ALIGNS = ["left", "center", "right"];

const clamp = (raw, min, max, fallback) => {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const pick = (raw, allowed, fallback) => (allowed.includes(raw) ? raw : fallback);
const color = (raw, fallback) => (typeof raw === "string" && raw.trim() ? raw.trim() : fallback);

export function informationMediaShadow(preset) {
  return IMAGE_SHADOWS[preset] || IMAGE_SHADOWS.soft;
}

export function informationTabSettings(value = {}) {
  value = value && typeof value === "object" ? value : {};
  const text = (raw, fallback) => (typeof raw === "string" && raw.trim() ? raw.trim() : fallback);
  const labels = Object.fromEntries(
    Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, fallback]) => [key, text(value.labels?.[key], fallback)]),
  );

  return {
    specColumns: value.specColumns === 1 ? 1 : 2,
    cardRadius: clamp(value.cardRadius ?? 16, 0, 28, 16),
    labels,
    defaultTab: Object.hasOwn(PRODUCT_CONTENT_GROUPS, value.defaultTab) ? value.defaultTab : "description",
    emptyText: text(value.emptyText, "Thông tin đang được cập nhật."),

    imageRatio: "3 / 2",
    imageFit: pick(value.imageFit, IMAGE_FITS, "cover"),
    imageRadius: clamp(value.imageRadius ?? 14, 0, 36, 14),
    imageBorderWidth: clamp(value.imageBorderWidth ?? 1, 0, 6, 1),
    imageBorderColor: color(value.imageBorderColor, "#f3dce5"),
    imageBg: color(value.imageBg, "#fff5f8"),
    imageShadow: pick(value.imageShadow, Object.keys(IMAGE_SHADOWS), "soft"),
    blockGap: clamp(value.blockGap ?? 24, 0, 64, 24),

    captionBg: color(value.captionBg, "transparent"),
    captionBorderWidth: clamp(value.captionBorderWidth ?? 0, 0, 4, 0),
    captionBorderColor: color(value.captionBorderColor, "#f3dce5"),
    captionRadius: clamp(value.captionRadius ?? 12, 0, 28, 12),
    captionPaddingX: clamp(value.captionPaddingX ?? 4, 0, 36, 4),
    captionPaddingY: clamp(value.captionPaddingY ?? 14, 0, 36, 14),
    captionAlign: pick(value.captionAlign, CAPTION_ALIGNS, "left"),
    captionTitleStyle: value.captionTitleStyle && typeof value.captionTitleStyle === "object" ? value.captionTitleStyle : {},
    captionStyle: value.captionStyle && typeof value.captionStyle === "object" ? value.captionStyle : {},
    captionEffect: pick(value.captionEffect, CAPTION_EFFECTS, "fade"),

    skeletonEffect: pick(value.skeletonEffect, SKELETON_EFFECTS, "shimmer"),
    skeletonBaseColor: color(value.skeletonBaseColor, "#fcebf1"),
    skeletonHighlightColor: color(value.skeletonHighlightColor, "#fff8fb"),

    tabTransition: pick(value.tabTransition, TAB_TRANSITIONS, "slide-up"),
    revealEffect: pick(value.revealEffect, REVEAL_EFFECTS, "rise"),
    motionDuration: clamp(value.motionDuration ?? 450, 150, 1000, 450),
  };
}

export function isLongSpecification(section) {
  const text = String(section.content || " ");
  return (
    section.legacyKey === "material" ||
    /thành phần|chất liệu/i.test(section.title || "") ||
    text.length > 180 ||
    text.split(/\r?\n/).length > 3
  );
}
