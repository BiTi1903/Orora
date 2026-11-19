export { DEFAULT_ABOUT, DEFAULT_STYLE } from "./defaults";

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
  cardImage: {
    type: "cardImage",
    group: "productCardStyles",
    styleKey: "imageLayout",
    label: "Khung ảnh sản phẩm",
  },
};


const PRODUCT_DETAIL_FIELD_MAP = {
  pdWebsiteText: {type:"pdPurchaseOptions",styleKey:"purchaseOptions",label:"Website · Chữ nút đặt hàng"},
  pdAddToCart: { type: "pdPurchaseOptions", styleKey: "purchaseOptions", label: "Nút Thêm vào giỏ" },
  pdTabDescription: {styleKey:"navigation",label:"Tab Mô tả"},
  pdTabSpecifications: {styleKey:"navigation",label:"Tab Thông số"},
  pdTabUsage: {styleKey:"navigation",label:"Tab Hướng dẫn sử dụng"},
  pdFacebookText: { type: "pdPurchaseOptions", styleKey: "purchaseOptions", label: "Chữ nút Facebook" },
  pdTiktokText: { type: "pdPurchaseOptions", styleKey: "purchaseOptions", label: "Chữ nút TikTok" },
  pdSelectionLabel: { styleKey: "selectionLabel", label: "Dung tích / số lượng — Nhãn", sample: "Dung tích" },
  pdSelectionValue: { styleKey: "selectionValue", label: "Dung tích — Lựa chọn", sample: "100 ml" },
  pdNavigation: { styleKey: "navigation", label: "Kiểu chữ chung các tab thông tin", sample: "Nút Mô tả / Thông số / Hướng dẫn sử dụng" },
  pdSubheading: { styleKey: "subheading", label: "Tên mục trong nội dung", sample: "Tên mục trong nội dung" },
  pdPurchaseHeading: { styleKey: "purchaseHeading", label: "Chữ Chọn cách mua hàng", sample: "Chữ Chọn cách mua hàng" },
  pdAssuranceTitle: { styleKey: "assuranceTitle", label: "Cam kết — Tiêu đề", sample: "Cam kết — Tiêu đề" },
  pdAssuranceBody: { styleKey: "assuranceBody", label: "Cam kết — Nội dung", sample: "Cam kết — Nội dung" },
  pdSloganTitle: { styleKey: "sloganTitle", label: "Card Slogan — Tiêu đề", sample: "Slogan" },
  pdSloganBody: { styleKey: "sloganBody", label: "Card Slogan — Nội dung", sample: "Slogan do admin nhập" },
  pdSloganCard: { styleKey: "sloganCard", label: "Card Slogan — Khung và biểu tượng" },
  pdReviewTitle: { styleKey: "reviewTitle", label: "Đánh giá — Tiêu đề", sample: "Đánh giá — Tiêu đề" },
  pdReviewName: { styleKey: "reviewName", label: "Đánh giá — Tên hiển thị", sample: "Đánh giá — Tên hiển thị" },
  pdReviewBody: { styleKey: "reviewBody", label: "Đánh giá — Nội dung", sample: "Đánh giá — Nội dung" },
  pdPurchaseOptions: { type: "pdPurchaseOptions", styleKey: "purchaseOptions", label: "Khung chọn cách mua" },
  pdContactActions: { type: "pdContactActions", styleKey: "contactActions", label: "Thiết lập liên hệ" },
  pdImage: {
    type: "pdImage",
    styleKey: "imageLayout",
    label: "Ảnh chính",
  },
  pdThumbs: {
    type: "pdThumbs",
    styleKey: "thumbsLayout",
    label: "Ảnh phụ",
  },
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
    label: "Tiêu đề nội dung sản phẩm",
    sample: "Mô tả",
  },
  pdAboutTitle: {
    styleKey: "aboutTitle",
    label: "Tiêu đề nội dung",
    sample: "Mô tả",
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

  /* ---- Mục "Sản phẩm khác" cuối trang chi tiết ---- */
  relLabel: {
    styleKey: "relLabel",
    textKey: "text",
    label: "Sản phẩm khác — Nhãn nhỏ",
    sample: "SẢN PHẨM KHÁC",
  },
  relTitle: {
    styleKey: "relTitle",
    textKey: "text",
    label: "Sản phẩm khác — Tiêu đề",
    sample: "Khám phá\nthêm nữa",
  },
  relHeader: {
    styleKey: "relHeader",
    label: "Sản phẩm khác — Khối tiêu đề",
  },
  relSection: {
    styleKey: "relSection",
    label: "Sản phẩm khác — Cả khu vực",
  },
  relNumber: {
    styleKey: "relNumber",
    label: "Sản phẩm khác — Số thứ tự thẻ",
    sample: "01",
  },
  relName: {
    styleKey: "relName",
    label: "Sản phẩm khác — Tên sản phẩm",
    sample: "First Story",
  },
  relDescription: {
    styleKey: "relDescription",
    label: "Sản phẩm khác — Mô tả ngắn",
    sample: "A beautiful piece created for your everyday moments.",
  },
  relPrice: {
    styleKey: "relPrice",
    label: "Sản phẩm khác — Giá",
    sample: "1.290.000đ",
  },
  relButton: {
    styleKey: "relButton",
    label: "Sản phẩm khác — Nút Xem chi tiết",
    sample: "Xem chi tiết ↗",
  },
  relImage: {
    type: "pdRelImage",
    styleKey: "relImage",
    label: "Sản phẩm khác — Khung thẻ / ảnh",
  },
};


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


const FOOTER_FIELD_MAP = {
  ftZalo: { key: "footerZaloText", label: "Chữ liên hệ Zalo", styleKey: "link" },
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
  ftTracking: { key: "footerTrackingText", label: "Tra cứu đơn hàng", styleKey: "link" },
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

const NEWSLETTER_FIELD_MAP = {
  nlConsent: { key: "newsletterConsent", label: "Nội dung đồng ý nhận tin", styleKey: "consent", multiline: true },
  nlTitle: {
    key: "newsletterTitle",
    label: "Tiêu đề",
    styleKey: "title",
  },
  nlHighlight: {
    key: "newsletterHighlight",
    label: "Chữ nổi bật",
    styleKey: "highlight",
  },
  nlText: {
    key: "newsletterText",
    label: "Mô tả",
    styleKey: "text",
    multiline: true,
  },
  nlPlaceholder: {
    key: "newsletterPlaceholder",
    label: "Placeholder email",
    styleKey: "input",
    hint: "Gợi ý trong ô nhập email",
  },
  nlButton: {
    key: "newsletterButton",
    label: "Nút đăng ký",
    styleKey: "button",
  },
};

// Context is part of every public picker label, including labels reused by sections.
for(const [map,prefix] of [[HERO_FIELD_MAP,'Hero'],[COLLECTION_FIELD_MAP,'Sản phẩm'],[PRODUCT_DETAIL_FIELD_MAP,'Chi tiết sản phẩm'],[FEATURES_TEXT_MAP,'Ưu điểm'],[REVIEWS_TEXT_MAP,'Đánh giá'],[FOOTER_FIELD_MAP,'Chân trang'],[NEWSLETTER_FIELD_MAP,'Nhận tin']]){
 for(const [key,meta] of Object.entries(map))meta.label=`${map===COLLECTION_FIELD_MAP&&key.startsWith('card')?'Thẻ sản phẩm':prefix} · ${meta.label}`;
}

export {
  HERO_FIELD_MAP,
  COLLECTION_FIELD_MAP,
  PRODUCT_DETAIL_FIELD_MAP,
  FEATURES_TEXT_MAP,
  REVIEWS_TEXT_MAP,
  FOOTER_FIELD_MAP,
  NEWSLETTER_FIELD_MAP,
};
