const textField = /(?:title|description|label|text|body|name|caption|highlight|eyebrow|prefix|suffix|placeholder|consent|copyright|heading|question|answer|content|imageAlt|shoppingGuide|details|story|hint|note|button|greeting|address|headline|cta|material|origin|category|marqueeWords|heroRotator|heroChip\d+|testimonialsTitleEnd)$/i;
const skip = /^(translations|phraseOverrides|translationSheet|slugAliases|productReviews|reviews)$/;
export const translationHeaders = ["Mã nội dung", "Vị trí", "Tiếng Việt", "English", "日本語"];

const SEGMENT_LABELS = {
  navLinks: "Thanh điều hướng",
  heroEyebrow: "Hero › Dòng nhỏ trên tiêu đề",
  heroTitle: "Hero › Tiêu đề chính",
  heroDescription: "Hero › Mô tả ngắn",
  heroRotator: "Hero › Chữ xoay vòng",
  heroRotatorPrefix: "Hero › Chữ trước từ xoay",
  heroRotatorSuffix: "Hero › Chữ sau từ xoay",
  heroButtonText: "Hero › Nút chính",
  shopButtonText: "Hero › Nút phụ",
  heroRingText: "Hero › Chữ vòng tròn",
  heroScrollText: "Hero › Chữ cuộn xuống",
  heroChip1: "Hero › Nhãn nổi 1",
  heroChip2: "Hero › Nhãn nổi 2",
  heroChip3: "Hero › Nhãn nổi 3",
  heroGlassCards: "Hero › Thẻ nổi bật",
  marqueeWords: "Dải chữ chạy ngang",
  storyLabel: "Câu chuyện › Nhãn",
  storyTitle: "Câu chuyện › Tiêu đề",
  storyHighlight: "Câu chuyện › Chữ nổi bật",
  storyText: "Câu chuyện › Nội dung",
  philosophyLabel: "Triết lý › Nhãn",
  philosophyBody: "Triết lý › Nội dung",
  collectionLabel: "Bộ sưu tập › Nhãn",
  collectionTitle: "Bộ sưu tập › Tiêu đề",
  collectionHighlight: "Bộ sưu tập › Chữ nổi bật",
  featuresLabel: "Ưu điểm › Nhãn",
  featuresTitle: "Ưu điểm › Tiêu đề",
  features: "Ưu điểm",
  testimonialsLabel: "Cảm nhận › Nhãn",
  testimonialsTitle: "Cảm nhận › Tiêu đề đầu",
  testimonialsHighlight: "Cảm nhận › Chữ nổi bật",
  testimonialsTitleEnd: "Cảm nhận › Tiêu đề cuối",
  testimonials: "Cảm nhận khách hàng",
  newsletterTitle: "Nhận tin › Tiêu đề",
  newsletterHighlight: "Nhận tin › Chữ nổi bật",
  newsletterText: "Nhận tin › Mô tả",
  newsletterPlaceholder: "Nhận tin › Gợi ý ô email",
  newsletterButton: "Nhận tin › Nút đăng ký",
  newsletterConsent: "Nhận tin › Dòng đồng ý",
  footerDescription: "Chân trang › Mô tả",
  footerInfoTitle: "Chân trang › Cột Thông tin",
  footerAboutText: "Chân trang › Link Về ORORA",
  footerShopText: "Chân trang › Link Sản phẩm",
  footerTrackingText: "Chân trang › Link Tra cứu đơn",
  footerTermsText: "Chân trang › Link Điều khoản",
  footerPrivacyText: "Chân trang › Link Bảo mật",
  footerContactTitle: "Chân trang › Cột Liên hệ",
  footerSocialTitle: "Chân trang › Cột Mạng xã hội",
  footerCopyright: "Chân trang › Bản quyền",
  productDetailStyles: "Trang sản phẩm",
  purchaseOptions: "Tùy chọn mua hàng",
  formLabels: "Form đặt hàng",
  informationTabs: "Tab thông tin",
  labels: "Nhãn",
  productPolicies: "Cam kết mua hàng",
  productNeeds: "Chọn theo nhu cầu",
  productFaq: "FAQ sản phẩm",
  productSlogan: "Khẩu hiệu sản phẩm",
  policyPageContent: "Trang Chính sách",
  orderTrackingText: "Trang Tra cứu đơn",
  shopLinks: "Liên kết gian hàng",
  addressPlaceholder: "Gợi ý địa chỉ",
  namePlaceholder: "Gợi ý họ tên",
  phonePlaceholder: "Gợi ý số điện thoại",
  emailPlaceholder: "Gợi ý email",
  notePlaceholder: "Gợi ý ghi chú",
  submitLabel: "Nút gửi đơn",
  variants: "Phân loại",
  specs: "Thông số",
  specifications: "Thông số",
  title: "Tiêu đề",
  subtitle: "Tiêu đề phụ",
  description: "Mô tả",
  label: "Nhãn",
  text: "Nội dung",
  body: "Nội dung",
  name: "Tên",
  question: "Câu hỏi",
  answer: "Câu trả lời",
  heading: "Tiêu đề",
  caption: "Chú thích",
  highlight: "Chữ nổi bật",
  button: "Nút bấm",
  buttonText: "Nút bấm",
  placeholder: "Gợi ý nhập",
  consent: "Cam kết",
  copyright: "Bản quyền",
  details: "Chi tiết",
  usage: "Hướng dẫn sử dụng",
  shoppingGuide: "Hướng dẫn mua hàng",
  material: "Chất liệu",
  origin: "Xuất xứ",
  category: "Danh mục",
  size: "Kích thước",
  color: "Màu sắc",
  t: "Tiêu đề",
  d: "Mô tả",
  greeting: "Lời chào",
  hint: "Gợi ý",
  note: "Ghi chú",
  cta: "Nút hành động",
  headline: "Tiêu đề chính",
  imageAlt: "Mô tả ảnh",
  address: "Địa chỉ",
  content: "Nội dung",
  eyebrow: "Dòng nhỏ trên tiêu đề",
  prefix: "Tiền tố",
  suffix: "Hậu tố",
  story: "Câu chuyện",
};

function humanizeSegment(segment) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  const spaced = String(segment)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : String(segment);
}

export function formatTranslationWhere(docKey, data, humanSegments) {
  const root = docKey === "home" ? "Trang chủ" : docKey === "categories" ? "Danh mục sản phẩm" : (data?.name || docKey);
  const parts = [root];
  for (let i = 0; i < humanSegments.length; i++) {
    const seg = humanSegments[i];
    if (seg && typeof seg === "object" && seg.type === "index") {
      const prevRaw = humanSegments[i - 1];
      if (prevRaw === "items") {
        const parentRaw = humanSegments[i - 2];
        const prefix = docKey === "categories" ? "Danh mục" : parentRaw === "productFaq" ? "Câu hỏi" : "Mục";
        parts[parts.length - 1] = `${prefix} #${seg.index + 1}`;
      } else {
        parts.push(`Mục #${seg.index + 1}`);
      }
      continue;
    }
    if (seg === "items" && humanSegments[i + 1]?.type === "index") {
      parts.push("Mục");
      continue;
    }
    if (docKey === "categories" && seg === "name") {
      parts.push("Tên danh mục");
      continue;
    }
    parts.push(humanizeSegment(seg));
  }
  return parts.join(" › ");
}

export function translationRows(docKey, data) {
  const rows = [];
  function visit(value, path, humanSegments, field, legacy, japanese) {
    if (typeof value === "string") {
      const tabLabel = path.includes("informationTabs") && path.at(-2) === "labels" && ["description", "specifications", "usage"].includes(field);
      const exactText = tabLabel || ["size","color","t","d"].includes(field) && !/^#[0-9a-f]+$/i.test(value);
      if ((!exactText && !textField.test(field)) || !value.trim() || /^(https?:|\/|#)/.test(value)) return;
      const key = JSON.stringify([docKey, ...path]);
      const saved = data.translationSheet?.[key];
      rows.push({
        key,
        where: formatTranslationWhere(docKey, data, humanSegments),
        vi: value,
        en: saved?.vi === value ? (saved.en ?? legacy ?? "") : typeof legacy === "string" ? legacy : "",
        ja: (saved?.vi === value ? saved.ja : null) ?? (typeof japanese === "string" ? japanese : ""),
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, i) =>
        visit(item, [...path, item?.id ? "@" + item.id : i], [...humanSegments, { type: "index", index: i }], field, legacy?.[i], japanese?.[i])
      );
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        if (!skip.test(key)) visit(item, [...path, key], [...humanSegments, key], key, legacy?.[key], japanese?.[key]);
      }
    }
  }
  visit(data, [], [], "", data.translations?.en, data.translations?.ja);
  return rows;
}

export function applySheet(base, original, docKey, locale) {
  if (!["en","ja"].includes(locale) || !original.translationSheet) return base;
  function visit(value, source, path) {
    if (typeof source === "string") {
      const entry = original.translationSheet[JSON.stringify([docKey, ...path])];
      return entry?.vi === source && entry[locale] ? entry[locale] : value;
    }
    if (Array.isArray(source)) return source.map((item, i) => visit(value?.[i], item, [...path, item?.id ? '@' + item.id : i]));
    if (!source || typeof source !== "object") return value;
    const result = {...value};
    for (const key of Object.keys(source)) {
      if (!skip.test(key)) result[key] = visit(value?.[key], source[key], [...path, key]);
    }
    return result;
  }
  return visit(base, original, []);
}
