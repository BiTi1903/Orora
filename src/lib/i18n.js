import { applySheet } from "./translation-rows.js";
import { useSyncExternalStore } from "react";

export const STOREFRONT_LANGUAGES_ENABLED = true;

export const SUPPORTED_LOCALES = [
  { code: "vi", short: "VI", label: "Tiếng Việt" },
  { code: "en", short: "EN", label: "English" },
  { code: "ja", short: "JP", label: "日本語" },
];

export const LOCALE_STORAGE_KEY = "orora_locale";

let currentLocale = "vi";
if (STOREFRONT_LANGUAGES_ENABLED && typeof window !== "undefined") {
  try {
    const saved = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === "en" || saved === "ja" || saved === "vi") currentLocale = saved;
    document.documentElement.lang = currentLocale;
  } catch {
    // Storage unavailable
  }
}

const listeners = new Set();

export function getLocale() {
  return currentLocale;
}

export function setLocale(next) {
  if (!STOREFRONT_LANGUAGES_ENABLED) return;
  const normalized = next === "en" || next === "ja" ? next : "vi";
  if (normalized === currentLocale) return;
  currentLocale = normalized;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalized);
    } catch {
      // Storage unavailable
    }
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.lang = normalized;
    }
    window.dispatchEvent(new CustomEvent("orora-locale-change", { detail: normalized }));
  }
  listeners.forEach((fn) => fn());
}

export function subscribeLocale(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useLocale() {
  return useSyncExternalStore(subscribeLocale, getLocale, () => "vi");
}

// Built-in dictionary of storefront phrases & default CMS copy -> { en, ja }
export const PHRASE_DICTIONARY = {
  "Phí giao hàng được tính tự động theo Tỉnh/Thành phố và Phường/Xã trước khi quý khách xác nhận đặt đơn.": {"en": "Shipping is calculated automatically from your delivery address before you confirm your order.", "ja": "ご注文の確定前に、配送先住所に基づいて送料が自動で計算されます。"},
  "Phí giao hàng sẽ được xác nhận sau.": {"en": "Shipping costs will be confirmed later.", "ja": "送料は後ほどご案内します。"},
  "Đơn đã đạt ngưỡng miễn phí vận chuyển.": {"en": "Your order qualifies for free shipping.", "ja": "送料無料の条件を満たしています。"},
  "Chưa có phí giao hàng cho địa chỉ này. Vui lòng liên hệ ORORA.": {"en": "Shipping is unavailable for this address. Please contact ORORA.", "ja": "この住所の送料を計算できません。ORORAへお問い合わせください。"},
  "Lưu ảnh": {"en": "Save image", "ja": "画像を保存"},
  "Chia sẻ": {"en": "Share", "ja": "共有"},
  "Mở ảnh gốc": {"en": "Open original image", "ja": "元の画像を開く"},
  "Ảnh trước": {"en": "Previous image", "ja": "前の画像"},
  "Ảnh sau": {"en": "Next image", "ja": "次の画像"},
  "Đóng ảnh": {"en": "Close image", "ja": "画像を閉じる"},
  "Thu nhỏ ảnh": {"en": "Zoom out", "ja": "縮小"},
  "Phóng to ảnh": {"en": "Zoom in", "ja": "拡大"},
  "Đóng cửa sổ": {"en": "Close dialog", "ja": "閉じる"},
  "Hãy mở ảnh gốc để lưu bằng trình duyệt.": {"en": "Open the original image to save it in your browser.", "ja": "元の画像を開き、ブラウザーで保存してください。"},
  "Đã sao chép liên kết ảnh.": {"en": "Image link copied.", "ja": "画像のリンクをコピーしました。"},
  "Hãy mở ảnh gốc để sao chép liên kết.": {"en": "Open the original image to copy its link.", "ja": "元の画像を開いてリンクをコピーしてください。"},
  "← Về trang chủ": {"en": "← Back to home", "ja": "← ホームに戻る"},
  "ORORA · CHÍNH SÁCH & BẢO MẬT": {"en": "ORORA · POLICIES & PRIVACY", "ja": "ORORA · 規約とプライバシー"},
  "Điều khoản, Chính sách đổi trả & Bảo mật": {"en": "Terms, Returns & Privacy", "ja": "利用規約・返品・プライバシーポリシー"},
  "ORORA cam kết minh bạch thông tin sản phẩm, phí giao hàng và bảo mật dữ liệu khách hàng trong suốt quá trình đặt hàng và chăm sóc sau bán.": {"en": "ORORA is committed to clear product and shipping information and to protecting your data from checkout through after-sales support.", "ja": "ORORAは、ご注文からアフターサポートまで、商品情報と送料を明確にお伝えし、お客様の情報を保護します。"},
  "Cam kết từ ORORA": {"en": "Our commitments", "ja": "ORORAのお約束"},
  "1. Chính sách kiểm hàng & đổi trả": {"en": "1. Inspection and returns", "ja": "1. 商品の確認・返品"},
  "2. Đặt hàng, thanh toán & vận chuyển": {"en": "2. Ordering, payment and delivery", "ja": "2. ご注文・お支払い・配送"},
  "3. Chính sách bảo mật thông tin": {"en": "3. Privacy policy", "ja": "3. プライバシーポリシー"},
  "Liên hệ hỗ trợ": {"en": "Contact support", "ja": "サポートへのお問い合わせ"},
  "Mã QR chuyển khoản được tạo trên thiết bị từ thông tin tài khoản nhận, số tiền và nội dung thanh toán.": {"en": "The bank transfer QR code is generated on your device from the destination account, amount and payment reference.", "ja": "振込用QRコードは、振込先口座、金額、お支払い内容に基づき、お使いの端末で生成されます。"},
  // Navbar & Mobile Nav
  "Về Chúng Tôi": { en: "About Us", ja: "ブランド紹介" },
  "Về chúng tôi": { en: "About Us", ja: "ブランド紹介" },
  "Về ORORA": { en: "About ORORA", ja: "ORORAについて" },
  "Sản phẩm": { en: "Products", ja: "商品一覧" },
  "Tất cả sản phẩm": { en: "All Products", ja: "すべての商品" },
  "Liên Hệ": { en: "Contact", ja: "お問い合わせ" },
  "Liên hệ": { en: "Contact", ja: "お問い合わせ" },
  "Tra cứu đơn": { en: "Track Order", ja: "注文照会" },
  "Tra cứu đơn hàng": { en: "Track Order", ja: "注文照会" },
  "Trang chủ": { en: "Home", ja: "ホーム" },
  "Câu chuyện": { en: "Our Story", ja: "ストーリー" },
  "Nhận tin": { en: "Newsletter", ja: "ニュースレター" },
  "Đánh giá": { en: "Reviews", ja: "レビュー" },
  "Giỏ hàng": { en: "Cart", ja: "カート" },

  // Hero
  "WELCOME TO": { en: "WELCOME TO", ja: "WELCOME TO" },
  "Làn da": { en: "Your skin,", ja: "毎日、素肌を" },
  "mỗi ngày": { en: "every day", ja: "もっと美しく" },
  "dịu nhẹ": { en: "gentle", ja: "やさしく" },
  "rạng rỡ": { en: "radiant", ja: "輝かしく" },
  "tự tin": { en: "confident", ja: "自信に満ちて" },
  "tỏa sáng": { en: "glowing", ja: "きらめく" },
  "Khám phá": { en: "Discover", ja: "詳しく見る" },
  "Xem sản phẩm": { en: "Shop Now", ja: "商品を見る" },
  "Dịu nhẹ cho da": { en: "Gentle on Skin", ja: "肌にやさしい処方" },
  "Thành phần thuần khiết": { en: "Pure Ingredients", ja: "厳選された純粋成分" },
  "Cấp ẩm sâu": { en: "Deep Hydration", ja: "深い潤いケア" },
  "ORORA ✦ SẢN PHẨM ✦ ORORA ✦": { en: "ORORA ✦ COLLECTION ✦ ORORA ✦", ja: "ORORA ✦ コレクション ✦ ORORA ✦" },
  "CUỘN": { en: "SCROLL", ja: "SCROLL" },

  // Ticker / Marquee
  "CHĂM SÓC DỊU NHẸ": { en: "GENTLE CARE", ja: "やさしいスキンケア" },
  "THÀNH PHẦN LÀNH TÍNH": { en: "CLEAN INGREDIENTS", ja: "厳選されたクリーン成分" },
  "TỎA SÁNG TỰ NHIÊN": { en: "NATURAL GLOW", ja: "自然な輝き" },
  "NUÔI DƯỠNG LÀN DA": { en: "SKIN NOURISHMENT", ja: "素肌へのうるおい" },

  // About / Story
  "CÂU CHUYỆN": { en: "OUR STORY", ja: "ブランドストーリー" },
  "Vẻ đẹp từ sự": { en: "Beauty born from", ja: "やさしさから生まれる" },
  "dịu dàng": { en: "gentleness", ja: "本来の美しさ" },
  "ORORA ra đời từ mong muốn mang đến những sản phẩm chăm sóc cơ thể lành tính, tinh tế và nâng niu làn da nhạy cảm mỗi ngày.": {
    en: "ORORA was born from a desire to craft gentle, refined body care that nurtures sensitive skin every single day.",
    ja: "ORORAは、敏感な素肌に毎日寄り添う、やさしく洗練されたボディケアをお届けしたいという想いから誕生しました。",
  },
  "Khách hàng tin dùng": { en: "Happy Customers", ja: "ご愛用のお客様" },
  "Thành phần chọn lọc": { en: "Curated Ingredients", ja: "厳選成分" },
  "Dịu nhẹ mỗi ngày": { en: "Gentle Daily Care", ja: "毎日のやさしいケア" },

  // Philosophy
  "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦": { en: "✦ OUR PHILOSOPHY ✦", ja: "✦ 私たちの哲学 ✦" },
  "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.": {
    en: "CHERISH EVERY GENTLE MOMENT OF SELF-LOVE.",
    ja: "自分自身を慈しむ、すべての瞬間を大切に。",
  },

  // Collection & Catalog Filters
  "BỘ SƯU TẬP": { en: "COLLECTION", ja: "コレクション" },
  "Bộ sưu tập": { en: "Collection", ja: "コレクション" },
  "Chăm sóc": { en: "Daily", ja: "毎日の" },
  "Tìm kiếm sản phẩm": { en: "Search products", ja: "商品を検索" },
  "Tìm theo tên hoặc mô tả…": { en: "Search by name or description…", ja: "商品名や説明で検索…" },
  "Danh mục": { en: "Category", ja: "カテゴリー" },
  "Tất cả": { en: "All", ja: "すべて" },
  "Giá tăng dần": { en: "Price: low to high", ja: "価格が安い順" },
  "Giá giảm dần": { en: "Price: high to low", ja: "価格が高い順" },
  "Chờ phí giao hàng": { en: "Shipping pending", ja: "送料確認中" },
  "Ghi nhớ thông tin trên thiết bị này": { en: "Remember my details on this device", ja: "この端末に入力情報を保存する" },
  "Bỏ chọn để xóa thông tin đã ghi nhớ trên thiết bị.": { en: "Uncheck to remove saved details from this device.", ja: "チェックを外すと、この端末に保存した情報を削除します。" },
  "Sắp xếp": { en: "Sort by", ja: "並び替え" },
  "Mặc định": { en: "Featured", ja: "おすすめ順" },
  "Giá thấp đến cao": { en: "Price: Low to High", ja: "価格が安い順" },
  "Giá cao đến thấp": { en: "Price: High to Low", ja: "価格が高い順" },
  "Giá thấp": { en: "Low Price", ja: "安い順" },
  "Giá cao": { en: "High Price", ja: "高い順" },
  "Lọc & sắp xếp": { en: "Filter & Sort", ja: "絞り込み・並び替え" },
  "Lưới": { en: "Grid", ja: "グリッド" },
  "Trượt": { en: "Carousel", ja: "スライド" },
  "Tên A → Z": { en: "Name: A → Z", ja: "名前順 (A → Z)" },
  "Xem chi tiết": { en: "View Details", ja: "詳細を見る" },
  "Xem": { en: "View", ja: "詳細" },
  "Cách dùng": { en: "How to Use", ja: "ご使用方法" },
  "Thêm vào giỏ": { en: "Add to Cart", ja: "カートに追加" },
  "Mua ngay": { en: "Buy Now", ja: "今すぐ購入" },
  "Hết hàng": { en: "Sold Out", ja: "在庫切れ" },
  "Còn ít": { en: "Low Stock", ja: "残りわずか" },

  // Product Discovery (Needs & FAQ)
  "Chọn sản phẩm theo nhu cầu": { en: "Shop by Skin Need", ja: "お悩みから選ぶ" },
  "Chọn nhu cầu của bạn để xem gợi ý phù hợp từ ORORA.": {
    en: "Select your care need to discover our tailored recommendations.",
    ja: "気になるお悩みを選んで、あなたにぴったりのアイテムを見つけましょう。",
  },
  "Xem tất cả sản phẩm": { en: "View All Products", ja: "すべての商品を見る" },
  "Câu hỏi thường gặp": { en: "Frequently Asked Questions", ja: "よくあるご質問" },

  // Features
  "Nâng cấp bản thân": { en: "Elevate Your Daily Ritual", ja: "毎日のケアを特別な時間に" },
  "Thành phần lành tính": { en: "Gentle Formula", ja: "肌にやさしい処方" },
  "Công thức ưu tiên chiết xuất thiên nhiên, phù hợp cả làn da nhạy cảm.": {
    en: "Formulated with nature-derived extracts, safe even for delicate skin.",
    ja: "植物由来成分を中心に処方し、敏感肌の方にも心地よくお使いいただけます。",
  },
  "Cấp ẩm suốt ngày dài": { en: "All-Day Comfort", ja: "一日中続くうるおい" },
  "Thấm nhanh, không bết dính, để da mềm mượt từ sáng đến tối.": {
    en: "Fast-absorbing and non-sticky, keeping skin silky smooth from morning to night.",
    ja: "すっと馴染んでベタつかず、朝から夜までなめらかな素肌を保ちます。",
  },
  "Hương thơm thanh tao": { en: "Subtle Elegance", ja: "上品でやさしい香り" },
  "Mùi hương nhẹ nhàng như một khoảnh khắc thư giãn cho riêng bạn.": {
    en: "A delicate scent that turns daily care into a calming private ritual.",
    ja: "ふわりと広がる心地よい香りが、リラックスタイムを彩ります。",
  },
  "Đóng gói tinh tế": { en: "Thoughtful Packaging", ja: "洗練されたパッケージ" },
  "Thiết kế xinh xắn, làm quà tặng cho chính mình hay người thương đều đẹp.": {
    en: "Minimalist beauty—lovely as a treat for yourself or a gift for someone special.",
    ja: "自分へのご褒美にも、大切な方へのギフトにもぴったりな上品なデザイン。",
  },

  // Reviews
  "CẢM NHẬN": { en: "TESTIMONIALS", ja: "お客様の声" },
  "Được": { en: "Loved", ja: "多くのお客様に" },
  "yêu thích": { en: "by women", ja: "愛されて" },
  "bởi những cô nàng như bạn": { en: "just like you", ja: "います" },
  "Da mình mềm và dịu hơn hẳn sau vài tuần dùng. Mùi hương rất dễ chịu.": {
    en: "My skin feels noticeably softer and calmer after a few weeks. The scent is so pleasant.",
    ja: "数週間使って肌がしっとり落ち着きました。香りもとても心地よいです。",
  },
  "Bao bì xinh, dùng lên không bết dính. Mình đã mua tặng bạn thân.": {
    en: "Lovely packaging and zero stickiness. I already bought another one as a gift for my best friend.",
    ja: "パッケージも可愛くてベタつかないので、友人へのプレゼントにも購入しました。",
  },
  "Sản phẩm nhẹ nhàng, phù hợp da nhạy cảm như mình.": {
    en: "Super gentle and soothing—perfect for sensitive skin like mine.",
    ja: "とてもマイルドな使い心地で、敏感肌の私にもぴったりでした。",
  },

  // Newsletter
  "Nhận ưu đãi": { en: "Exclusive", ja: "最新情報と" },
  "ngay": { en: "Offers", ja: "限定特典" },
  "Đăng ký email để biết sớm sản phẩm mới và quà tặng dành riêng cho bạn.": {
    en: "Subscribe to be the first to hear about new launches and subscriber-only gifts.",
    ja: "メールアドレスを登録して、新作情報や限定特典をいち早く受け取りましょう。",
  },
  "Email của bạn": { en: "Your email address", ja: "メールアドレスを入力" },
  "Đăng ký": { en: "Subscribe", ja: "登録する" },
  "Tôi đồng ý nhận email về sản phẩm và ưu đãi từ ORORA. Có thể hủy đăng ký bất cứ lúc nào.": {
    en: "I agree to receive product updates and offers from ORORA. You can unsubscribe anytime.",
    ja: "ORORAからの最新情報や特典メールの受信に同意します（いつでも配信停止可能です）。",
  },

  // Footer
  "Chăm sóc làn da, nuôi dưỡng sự tự tin.": {
    en: "Gentle body care that nurtures your everyday confidence.",
    ja: "素肌をいたわり、毎日の自信を育むボディケア。",
  },
  "Thông tin": { en: "Information", ja: "インフォメーション" },
  "Điều khoản sử dụng": { en: "Terms & Conditions", ja: "利用規約" },
  "Chính sách bảo mật": { en: "Privacy Policy", ja: "プライバシーポリシー" },
  "Kết nối với ORORA": { en: "Follow ORORA", ja: "公式SNS" },
  "© 2026 ORORA. Bảo lưu mọi quyền.": {
    en: "© 2026 ORORA. All rights reserved.",
    ja: "© 2026 ORORA. All rights reserved.",
  },

  // Product Detail
  "← Về danh sách sản phẩm": { en: "← Back to Products", ja: "← 商品一覧へ戻る" },
  "Dung tích": { en: "Volume", ja: "容量" },
  "Số lượng": { en: "Quantity", ja: "数量" },
  "Hoặc mua qua": { en: "Or order via", ja: "その他の購入方法" },
  "Chọn cách mua hàng": { en: "Order Channels", ja: "購入方法を選ぶ" },
  "Tư vấn": { en: "Consult", ja: "相談する" },
  "Tư vấn qua Zalo": { en: "Chat on Zalo", ja: "Zaloで相談する" },
  "Tư vấn cùng AI": { en: "Ask AI Assistant", ja: "AIアシスタントに質問" },
  "Gọi tư vấn": { en: "Call Us", ja: "電話で相談" },
  "Giới thiệu": { en: "Overview", ja: "商品説明" },
  "Thành phần": { en: "Ingredients", ja: "成分" },
  "Hướng dẫn sử dụng": { en: "How to Use", ja: "ご使用方法" },
  "Thông số": { en: "Specifications", ja: "仕様・詳細" },
  "Thông tin đang được cập nhật.": { en: "Information is being updated.", ja: "情報は現在準備中です。" },
  "Sản phẩm gợi ý": { en: "You May Also Like", ja: "おすすめ商品" },
  "Đánh giá từ khách hàng": { en: "Customer Reviews", ja: "カスタマーレビュー" },
  "sản phẩm": { en: "item(s)", ja: "点" },

  // Cart
  "Giỏ hàng của bạn": { en: "Your Cart", ja: "ショッピングカート" },
  "Giỏ hàng chưa có sản phẩm nào.": { en: "Your cart is currently empty.", ja: "カートに商品がありません。" },
  "Giỏ hàng đang trống.": { en: "Your cart is currently empty.", ja: "カートに商品がありません。" },
  "Đã thêm vào giỏ hàng": { en: "Added to cart", ja: "カートに追加しました" },
  "Đã thêm vào giỏ": { en: "Added to cart", ja: "カートに追加しました" },
  "Tạm tính": { en: "Subtotal", ja: "小計" },
  "Chưa gồm phí giao hàng": { en: "Excludes shipping fee", ja: "送料別" },
  "Chọn dung tích": { en: "Select Volume", ja: "容量を選択" },
  "Chọn dung tích muốn đặt.": { en: "Choose your preferred volume.", ja: "ご希望の容量を選択してください。" },
  "Tăng số lượng": { en: "Increase quantity", ja: "数量を増やす" },
  "Giảm số lượng": { en: "Decrease quantity", ja: "数量を減らす" },
  "Phí giao hàng sẽ được tính ở bước đặt hàng": {
    en: "Shipping fee will be calculated at checkout",
    ja: "送料はご注文手続き画面で計算されます",
  },
  "Xóa": { en: "Remove", ja: "削除" },
  "Chi tiết": { en: "Details", ja: "詳細" },
  "Gợi ý dành cho bạn": { en: "Recommended for You", ja: "おすすめの商品" },
  "Hoàn tác": { en: "Undo", ja: "元に戻す" },
  "Mới nhận": { en: "Received", ja: "受付済み" },
  "Đã xác nhận": { en: "Confirmed", ja: "確認済み" },
  "Đang giao": { en: "Shipping", ja: "配送中" },
  "Hoàn tất": { en: "Completed", ja: "完了" },
  "Đã hủy": { en: "Cancelled", ja: "キャンセル" },
  "Đang cập nhật": { en: "Updating", ja: "更新中" },

  // Checkout / Order Form
  "Đặt hàng trên website": { en: "Direct Checkout", ja: "ご注文手続き" },
  "Kiểm tra sản phẩm và nhập thông tin nhận hàng.": {
    en: "Review your items and enter your delivery details.",
    ja: "ご注文内容をご確認のうえ、お届け先情報をご入力ください。",
  },
  "Thông tin người nhận": { en: "Recipient Information", ja: "お届け先のお客様情報" },
  "Họ và tên": { en: "Full Name", ja: "お名前" },
  "Nguyễn Văn A": { en: "Your full name", ja: "山田 花子" },
  "Số điện thoại": { en: "Phone Number", ja: "電話番号" },
  "Email nhận xác nhận đơn": { en: "Email for Order Confirmation", ja: "確認メール送信用アドレス" },
  "Địa chỉ giao hàng": { en: "Delivery Address", ja: "配送先ご住所" },
  "Tỉnh / Thành phố": { en: "Province / City", ja: "都道府県・都市" },
  "Chọn tỉnh/thành": { en: "Select province/city", ja: "都市を選択" },
  "Phường / Xã": { en: "Ward / District", ja: "区・町・村" },
  "Chọn phường/xã": { en: "Select ward", ja: "地区を選択" },
  "Số nhà, tên đường": { en: "Street Address", ja: "番地・建物名" },
  "Số nhà, tên đường, tòa nhà, hẻm…": { en: "House number, street, building…", ja: "番地、マンション名、部屋番号など…" },
  "Chọn địa chỉ để tính phí giao hàng.": {
    en: "Select your address to calculate shipping.",
    ja: "送料を計算するには配送先を選択してください。",
  },
  "Thanh toán": { en: "Payment", ja: "お支払い方法" },
  "Phương thức thanh toán": { en: "Payment Method", ja: "お支払い方法" },
  "Thanh toán khi nhận hàng (COD)": { en: "Cash on Delivery (COD)", ja: "代金引換 (COD)" },
  "Chuyển khoản ngân hàng": { en: "Bank Transfer", ja: "銀行振込" },
  "Thêm ghi chú cho đơn hàng": { en: "Add an order note", ja: "注文メモを追加する" },
  "Ghi chú (không bắt buộc)": { en: "Order Note (optional)", ja: "備考・ご要望（任意）" },
  "Lời nhắn giao hàng hoặc khung giờ nhận thuận tiện…": {
    en: "Delivery instructions or preferred time window…",
    ja: "配達時間帯のご希望やメモをご記入ください…",
  },
  "Tóm tắt đơn hàng": { en: "Order Summary", ja: "ご注文内容" },
  "Phí giao hàng": { en: "Shipping Fee", ja: "送料" },
  "Chọn tỉnh và phường để tính phí": { en: "Select province and ward to calculate", ja: "都道府県と地区を選択してください" },
  "Tạm tính (chưa gồm phí giao)": { en: "Subtotal (excl. shipping)", ja: "小計（送料別）" },
  "Tổng thanh toán": { en: "Total", ja: "合計金額" },
  "Bạn thanh toán khi nhận hàng.": { en: "Pay in cash upon delivery.", ja: "商品受け取り時にお支払いください。" },
  "ORORA sẽ hiển thị thông tin chuyển khoản sau khi bạn đặt đơn và xác nhận cùng bạn.": {
    en: "Bank transfer details will be shown right after you place the order.",
    ja: "ご注文完了後にお振込先口座をご案内いたします。",
  },
  "Tôi đồng ý để ORORA liên hệ, gửi email xác nhận và xử lý đơn hàng theo thông tin đã cung cấp.": {
    en: "I agree for ORORA to contact me, send confirmation emails, and process my order.",
    ja: "入力した情報に基づき、ORORAからの連絡・確認メール送信および注文処理に同意します。",
  },
  "Đặt hàng ngay": { en: "Place Order", ja: "注文を確定する" },
  "Đang gửi đơn hàng…": { en: "Placing order…", ja: "注文を送信中…" },

  // Order Received / Success
  "Đã nhận đơn hàng": { en: "Order Received", ja: "ご注文ありがとうございます" },
  "Mã đơn hàng": { en: "Order Code", ja: "注文番号" },
  "Bước tiếp theo": { en: "Next Steps", ja: "今後の流れ" },
  "ORORA sẽ liên hệ xác nhận đơn và giao hàng trong thời gian sớm nhất. Bạn có thể bấm Zalo bên trên hoặc lưu ảnh đơn hàng để tiện tra cứu.": {
    en: "ORORA will contact you shortly to confirm and ship your order. You can save the receipt image or track your order anytime.",
    ja: "ORORAよりまもなくご注文確認のご連絡を差し上げます。注文画像の保存や注文照会もご利用いただけます。",
  },
  "Thông tin chuyển khoản": { en: "Bank Transfer Details", ja: "お振込先情報" },
  "Chi tiết đơn hàng": { en: "Order Details", ja: "ご注文明細" },
  "Tiền sản phẩm": { en: "Items Subtotal", ja: "商品合計" },
  "Xác nhận đơn nhanh": { en: "Quick Confirmation", ja: "スピード確認" },
  "Gửi ảnh đơn hàng trực tiếp qua Zalo cho ORORA": {
    en: "Send your order receipt directly to ORORA via Zalo",
    ja: "Zaloで注文画像をORORAへ直接送信できます",
  },
  "Xác nhận qua Zalo": { en: "Confirm via Zalo", ja: "Zaloで確認" },
  "Xác nhận qua Facebook": { en: "Confirm via Facebook", ja: "Facebookで確認" },
  "Lưu ảnh đơn hàng": { en: "Save Receipt Image", ja: "注文画像を保存" },
  "Giữ lại thông tin để tiện tra cứu": { en: "Keep a copy for easy reference", ja: "控えとして画像を保存できます" },
  "ORORA sẽ gửi email xác nhận trong ít phút; nếu không thấy hãy kiểm tra thư rác hoặc tra cứu đơn.": {
    en: "A confirmation email will arrive in a few minutes; please check your spam folder or use Order Tracking.",
    ja: "数分以内に確認メールをお送りします。届かない場合は迷惑メールフォルダをご確認いただくか、注文照会をご利用ください。",
  },
  "Tiếp tục mua sắm": { en: "Continue Shopping", ja: "お買い物を続ける" },
  "Đóng": { en: "Close", ja: "閉じる" },

  // Order Tracking Page
  "Trở về trang chủ": { en: "Back to Home", ja: "ホームへ戻る" },
  "ORORA · ĐƠN HÀNG CỦA BẠN": { en: "ORORA · YOUR ORDER", ja: "ORORA · ご注文照会" },
  "Nhập số điện thoại hoặc mã đơn.": {
    en: "Enter your phone number or order code to check delivery status.",
    ja: "電話番号または注文番号を入力して、配送状況をご確認いただけます。",
  },
  "Mã đơn": { en: "Order Code", ja: "注文番号" },
  "Xem danh sách rút gọn các đơn đã đặt bằng số này": {
    en: "View a summary list of orders placed with this phone number",
    ja: "この電話番号で注文された履歴一覧を表示します",
  },
  "Nhập mã đơn kèm số điện thoại (hoặc 4 số cuối) để xem chi tiết": {
    en: "Enter your order code with your phone number (or last 4 digits) to view full details",
    ja: "注文番号と電話番号（または下4桁）を入力して詳細を表示します",
  },
  "Số điện thoại đặt hàng": { en: "Order Phone Number", ja: "ご注文時の電話番号" },
  "Nhập số điện thoại khi đặt hàng": { en: "Enter phone number used at checkout", ja: "電話番号を入力してください" },
  "Ví dụ: OW_1234C": { en: "e.g. OW_1234C", ja: "例: OW_1234C" },
  "Số điện thoại hoặc 4 số cuối": { en: "Phone number or last 4 digits", ja: "電話番号または下4桁" },
  "Ví dụ: 0901234567 hoặc 4567": { en: "e.g. 0901234567 or 4567", ja: "例: 0901234567 または 4567" },
  "Tra cứu": { en: "Track Order", ja: "照会する" },
  "Đang tra cứu…": { en: "Looking up…", ja: "照会中…" },
  "Tra bằng mã đơn cần kèm số điện thoại hoặc 4 số cuối để bảo vệ thông tin đơn hàng.": {
    en: "Looking up by order code requires your phone number or last 4 digits to protect your privacy.",
    ja: "個人情報保護のため、注文番号での照会には電話番号（または下4桁）が必要です。",
  },
  "Hướng dẫn & hỗ trợ": { en: "How It Works & Support", ja: "ご利用案内・サポート" },
  "Chọn cách tra cứu": { en: "Choose Lookup Mode", ja: "照会方法を選択" },
  "Dùng số điện thoại để tìm các đơn của bạn, hoặc mã đơn để xem một đơn cụ thể.": {
    en: "Use your phone number to list your orders, or an order code for a specific receipt.",
    ja: "電話番号で注文一覧を検索するか、注文番号で特定の注文詳細を確認できます。",
  },
  "Nhập thông tin đặt hàng": { en: "Enter Order Info", ja: "注文情報を入力" },
  "Mã đơn có trong email xác nhận hoặc màn hình đặt hàng thành công.": {
    en: "Your order code is in your confirmation email or order receipt screen.",
    ja: "注文番号は確認メールまたは注文完了画面に記載されています。",
  },
  "Xem tình trạng đơn": { en: "Check Order Status", ja: "ステータスを確認" },
  "Lọc theo tình trạng và chọn Xem chi tiết để kiểm tra sản phẩm, thanh toán và tổng tiền.": {
    en: "Filter by status and click View Details to see items, payment status, and total.",
    ja: "状況別に絞り込み、「詳細を見る」から商品・お支払い・合計金額を確認できます。",
  },
  "Áp dụng cho đơn đặt trực tiếp trên website ORORA.": {
    en: "Applies to orders placed directly on the ORORA website.",
    ja: "ORORA公式サイトでのご注文が対象です。",
  },
  "Cần hỗ trợ? Liên hệ ORORA": { en: "Need help? Contact ORORA", ja: "お困りですか？ ORORAへ連絡" },
  "Đơn hàng của bạn": { en: "Your Orders", ja: "ご注文一覧" },
  "Tìm thấy {count} đơn hàng.": { en: "Found {count} order(s).", ja: "{count}件の注文が見つかりました。" },
  "Đã thanh toán": { en: "Paid", ja: "支払い済み" },
  "Chưa thanh toán": { en: "Unpaid", ja: "未払い" },
  "Đã hoàn tiền": { en: "Refunded", ja: "返金済み" },
  "Chờ xác nhận tổng tiền": { en: "Total pending confirmation", ja: "合計金額確認中" },
  "Trang trước": { en: "Previous", ja: "前へ" },
  "Trang sau": { en: "Next", ja: "次へ" },
  "Trang {page}/{pages}": { en: "Page {page}/{pages}", ja: "{page} / {pages} ページ" },
  "Xem thêm đơn hàng": { en: "Load More Orders", ja: "さらに読み込む" },
  "Đang tải…": { en: "Loading…", ja: "読み込み中…" },
  "Tình trạng đơn hàng": { en: "Order Progress", ja: "配送状況" },
  "Đặt lúc": { en: "Placed at", ja: "注文日時" },
  "Cập nhật": { en: "Updated", ja: "更新日時" },
  "Sản phẩm đã đặt": { en: "Ordered Items", ja: "ご注文商品" },
  "Thông tin thanh toán": { en: "Payment Details", ja: "お支払い情報" },
  "Chi tiết số tiền": { en: "Cost Breakdown", ja: "金額内訳" },
  "Tổng tiền": { en: "Total Amount", ja: "合計金額" },

  // Common categories & catalog items
  "Chăm sóc cơ thể": { en: "Body Care", ja: "ボディケア" },
  "Chăm sóc da": { en: "Skin Care", ja: "スキンケア" },
  "Xịt khử mùi": { en: "Deodorant Mist", ja: "デオドラントミスト" },
  "Sữa tắm hương hoa hồng ORORA": { en: "ORORA Rose Petal Body Wash", ja: "ORORA ローズペタル ボディウォッシュ" },
  "Làm sạch dịu nhẹ và lưu hương thanh thoát suốt ngày dài.": {
    en: "Gently cleanses while leaving a delicate floral scent all day long.",
    ja: "やさしく洗い上げ、上品なフローラルの香りが一日中続きます。",
  },
};

// Product description/text smart fallback translations for common ORORA catalog items
const PRODUCT_PHRASES = [
  [
    "Xịt khử mùi dịu nhẹ, chăm sóc vùng da nhạy cảm – cho cảm giác khô thoáng, dễ chịu suốt ngày",
    {
      en: "Gentle deodorant mist crafted for sensitive skin — keeping you fresh, dry, and comfortable all day.",
      ja: "デリケートな肌をやさしくケアするデオドラントミスト。一日中さらりと快適な素肌へ。",
    },
  ],
  [
    "Gel dưỡng sáng và làm dịu vùng da nhạy cảm",
    {
      en: "Brightening and soothing gel formulated for delicate skin.",
      ja: "デリケートな肌をやさしく整え、透明感を与えるブライトニングジェル。",
    },
  ],
];

export function navigationLabel(value, locale = currentLocale) {
  return locale === "vi" ? value : translatePhrase(value, locale);
}

export function translatePhrase(value, locale = currentLocale) {
  if (locale === "vi" || typeof value !== "string" || !value.trim()) return value;
  const trimmed = value.trim();
  const hit = PHRASE_DICTIONARY[trimmed];
  if (hit && hit[locale]) return hit[locale];
  for (const [vn, map] of PRODUCT_PHRASES) {
    if (trimmed.includes(vn) && map[locale]) {
      return trimmed.replace(vn, map[locale]);
    }
  }
  return value;
}

const NON_TRANSLATABLE_KEYS = new Set([
  "id",
  "slug",
  "canonicalSlug",
  "code",
  "href",
  "to",
  "src",
  "image",
  "heroImage",
  "heroImageMobile",
  "storyImage",
  "footerPhone",
  "footerEmail",
  "footerInstagram",
  "footerFacebook",
  "footerTikTok",
  "footerYouTube",
  "facebookUrl",
  "tiktokUrl",
  "zaloUrl",
]);

function applyTranslationsDeep(base, overrideMap, locale) {
  if (locale === "vi" || !base || typeof base !== "object") return base;
  if (Array.isArray(base)) {
    return base.map((item, idx) => {
      const ov = Array.isArray(overrideMap) ? overrideMap[idx] : undefined;
      if (typeof item === "string") {
        return typeof ov === "string" && ov.trim() ? ov : translatePhrase(item, locale);
      }
      if (item && typeof item === "object") {
        return applyTranslationsDeep(item, ov, locale);
      }
      return item;
    });
  }

  const result = { ...base };
  for (const [key, val] of Object.entries(base)) {
    if (
      key === "phraseOverrides" || key === "translationSheet" || key === "translations" ||
      key.endsWith("Styles") ||
      key === "styles" ||
      key === "style" ||
      key === "sectionVisibility" ||
      NON_TRANSLATABLE_KEYS.has(key)
    ) {
      continue;
    }
    const ov =
      overrideMap && typeof overrideMap === "object"
        ? overrideMap[key] !== undefined
          ? overrideMap[key]
          : key === "label"
            ? overrideMap.text
            : key === "text"
              ? overrideMap.label
              : undefined
        : undefined;
    if (typeof val === "string") {
      if (typeof ov === "string" && ov.trim()) {
        result[key] = ov;
      } else {
        result[key] = translatePhrase(val, locale);
      }
    } else if (Array.isArray(val) || (val && typeof val === "object")) {
      result[key] = applyTranslationsDeep(val, ov, locale);
    }
  }
  return result;
}

export function localizeHomeContent(home, locale = currentLocale) {
  if (!home || typeof home !== "object" || locale === "vi") return home;
  const custom = home.translations?.[locale] || {};
  return applySheet(applyTranslationsDeep(home, custom, locale), home, "home", locale);
}

export function localizeProduct(product, locale = currentLocale, productTranslations = {}) {
  if (!product || typeof product !== "object" || locale === "vi") return product;
  const pid = product.id || product.slug || "";
  const ov = (pid && productTranslations?.[pid]) || product.translations?.[locale] || {};
  return applySheet({
    ...product,
    name: (typeof ov.name === "string" && ov.name.trim()) ? ov.name : translatePhrase(product.name, locale),
    category:
      typeof product.category === "string"
        ? (typeof ov.category === "string" && ov.category.trim())
          ? ov.category
          : translatePhrase(product.category, locale)
        : product.category,
    description:
      (typeof ov.description === "string" && ov.description.trim())
        ? ov.description
        : translatePhrase(product.description, locale),
    details:
      (typeof ov.details === "string" && ov.details.trim())
        ? ov.details
        : translatePhrase(product.details, locale),
  }, product, pid, locale);
}
