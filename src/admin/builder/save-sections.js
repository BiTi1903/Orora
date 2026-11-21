const FIELDS = {
  productneeds: ["productNeeds"],
  productfaq: ["productFaq"],
  visibility: ["sectionVisibility"],
  navbar: ["navLogo", "navLinks", "navStyles", "translations"],
  hero: ["heroEyebrow", "heroTitle", "heroDescription", "heroRotator", "heroRotatorPrefix", "heroRotatorSuffix", "heroStyles", "heroButtonText", "heroButtonLink", "shopButtonText", "shopButtonLink", "heroImage", "heroImageMobile", "heroChip1", "heroChip2", "heroChip3", "heroGlassCards", "heroRingText", "heroScrollText"],
  about: ["storyLabel", "storyTitle", "storyHighlight", "storyText", "storyImage", "storyImages", "storyStats", "aboutBuilder", "aboutStyles"],
  philosophy: ["philosophyLabel", "philosophyBody", "philosophyAccentCount", "philosophyStyles"],
  collection: ["collectionLabel", "collectionTitle", "collectionHighlight", "collectionStyles", "productCardStyles"],
  productdetail: ["productDetailStyles", "detailLabels"],
  features: ["featuresLabel", "featuresTitle", "features", "featuresStyles"],
  reviews: ["testimonialsLabel", "testimonialsTitle", "testimonialsHighlight", "testimonialsTitleEnd", "reviews", "testimonialsStyles"],
  newsletter: ["newsletterTitle", "newsletterHighlight", "newsletterText", "newsletterPlaceholder", "newsletterButton", "newsletterConsent", "newsletterStyles"],
  footer: ["footerLogo", "footerDescription", "footerInfoTitle", "footerAboutText", "footerShopText", "footerTrackingText", "footerTermsText", "footerPrivacyText", "footerContactTitle", "footerZaloText", "footerPhone", "footerEmail", "footerAddress", "footerSocialTitle", "footerInstagram", "footerFacebook", "footerTikTok", "footerYouTube", "footerCopyright", "footerCompanyNumber", "footerStyles"],
  ticker: ["marqueeWords", "marqueeStyles"],
  cartform: ["navStyles"],
  orderform: ["productDetailStyles"],
  ordersuccess: ["productDetailStyles"],
};

export function editedSectionPayload(payload, sections) {
  const keys = new Set([...sections].flatMap((section) => FIELDS[section] || []));
  return Object.fromEntries(Object.entries(payload).filter(([key, value]) => keys.has(key) && value !== undefined));
}

const isMap = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
export function changedValues(before = {}, after = {}, { includeRemovals = false } = {}) {
  const patch = {};
  for (const [key, value] of Object.entries(after)) {
    if (value === undefined) continue;
    if (isMap(value) && isMap(before[key])) {
      const nested = changedValues(before[key], value, { includeRemovals });
      if (Object.keys(nested).length) patch[key] = nested;
    } else if (JSON.stringify(value) !== JSON.stringify(before[key])) patch[key] = value;
  }
  if (includeRemovals && isMap(before)) {
    for (const key of Object.keys(before)) {
      if (!(key in after) && before[key] !== null && before[key] !== undefined) {
        if (isMap(before[key])) {
          const nested = changedValues(before[key], {}, { includeRemovals: true });
          if (Object.keys(nested).length) patch[key] = nested;
        } else {
          patch[key] = null;
        }
      }
    }
  }
  return patch;
}
export function mergeSavedValues(base, patch) {
  const result = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    result[key] = isMap(value) && isMap(result[key]) ? mergeSavedValues(result[key], value) : value;
  }
  return result;
}
