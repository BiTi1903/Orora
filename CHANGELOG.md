## 28/11/2026 — Phân biệt đơn mới và sự cố thư theo ngày trong Tổng quan

- Tách danh sách đơn chờ xác nhận theo ngày đặt và thư cần kiểm tra theo ngày ghi nhận sự cố (giờ Việt Nam). Mỗi dòng mở đúng mã đơn, hiện thời điểm và lý do. Tải thêm riêng theo từng danh sách; giữ cảnh báo thư xác nhận bị kẹt trong 50 đơn gần nhất.
- Dùng dữ liệu orderMailReview hiện có, không ghi hoặc chuyển đổi database. Không suy diễn lỗi lịch sử chưa có bản ghi kiểm tra.
- Kiểm tra tình huống 10 đơn hôm nay, 20 thư lỗi hôm qua trên desktop/mobile đạt. Kiểm tra mail-review, ESLint các file sửa và build đạt.

## 28/11/2026 — Sửa nội dung gợi ý và gửi thư theo trạng thái đơn

- Bảng Nội dung trong Studio và trình soạn cho sửa trực tiếp tiêu đề, danh sách gợi ý và lời nhắn trong thân thư. Mở mẫu giao hàng/cảm ơn sẽ đọc phiên bản đã lưu.
- Khi đơn chuyển sang shipping/completed, ghi sự kiện mailEvents cùng giao dịch đổi trạng thái và dùng mẫu hệ thống tương ứng để gửi. Lưu kết quả, cập nhật danh sách kiểm tra thư và báo admin nếu thiếu địa chỉ hoặc gửi lỗi. Không gửi hồi tố cho các đơn cũ.
- 68 bài kiểm tra đơn hàng/email và bài Playwright chỉnh nội dung đạt. Lint và build đạt. Kiểm thử dùng dịch vụ gửi giả lập, chưa gửi email cho khách thật.

## 28/11/2026 — Tối ưu tốc độ đăng ký/đặt hàng, đổi chữ nút đang xử lý, bỏ kính lỏng ở Tra cứu đơn và bổ sung nút hướng dẫn `i` trong Admin

- **Lý do**: Cải thiện trải nghiệm người dùng khi bấm đăng ký nhận tin & đặt hàng (đổi chữ nút thành *Đang đăng ký…* / *Đang đặt hàng…* và rút ngắn thời gian phản hồi BE); bỏ hiệu ứng kính lỏng trên form & hộp thoại chi tiết Tra cứu đơn hàng để đồng bộ màu nền; đồng thời bổ sung nút hướng dẫn `i` (`TranslationHelp`) ở nhiều thao tác quan trọng trong trang quản trị.
- **Thay đổi chính**:
  - `src/components/Extras.jsx`, `src/components/OrderFormFields.jsx`, `src/admin/builder/FormBuilderPanels.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `src/lib/i18n.js`: Đổi nhãn đang xử lý nút nhận tin từ *Đang lưu email…* → *Đang đăng ký…* và nút đặt hàng mặc định từ *Đang gửi đơn hàng…* → *Đang đặt hàng…* (có dịch EN/JP và vẫn giữ khả năng chỉnh nhãn nút trong Visual Builder).
  - `server/request-limits.js`, `server/newsletter.js`, `server/orders.js`: Gộp kiểm tra trùng đơn (`order.get`), 2 giới hạn tần suất (IP & email) và ghi đơn/đăng ký vào **1 transaction Firestore duy nhất** (`tx.getAll`), giảm từ 6–7 lượt gọi mạng tuần tự xuống 2 lượt (giữ nguyên tiến trình gửi email & thông báo shop chạy nền qua `waitUntil` của Vercel sau khi trả phản hồi).
  - `src/styles/mobile-glass.css`, `src/styles/order-tracking.css`: Gỡ bỏ lớp kính lỏng (`backdrop-filter` / nền bán trong suốt) khỏi toàn bộ khu vực Tra cứu đơn hàng (khung tìm kiếm, thẻ danh sách, ô nhập và modal chi tiết đơn `.order-tracking-modal`), đồng bộ màu nền đục chuẩn theo biến giao diện `--tracking-card`, `--tracking-surface`, `--tracking-border` (chỉnh được trong Admin Visual Builder).
  - `src/admin/OrdersAdmin.jsx`, `src/admin/ProductsAdmin.jsx`, `src/admin/InventoryAdmin.jsx`, `src/admin/ShippingAdmin.jsx`, `src/admin/NewsletterAdmin.jsx`, `src/admin/MailTemplateLibrary.jsx`, `src/admin/ChatSettings.jsx`, `src/admin/EmailExport.jsx`: Bổ sung nút hướng dẫn `i` tại các thao tác trọng yếu (xử lý trạng thái & trừ kho đơn hàng, mã vận đơn/ghi chú nội bộ, email xác nhận & Check Outlook, ẩn/hiện & dung tích sản phẩm, cột tồn kho, phí theo khu vực, quản lý người đăng ký & lịch sử gửi, bộ 4 mẫu thư & Studio, thiết lập/kiến thức Chat AI, xuất Excel).
- **Kiểm tra đã chạy**: `npm run check` (298 unit tests gồm cả kiểm thử rate-limit 429 & replay `requestId`, ESLint, Vite build, kiểm tra giới hạn bundle) và Playwright (`qa/tracking-layout.spec.js`, `qa/glass-surfaces.spec.js`, `qa/admin-confirm.spec.js` ở `390px` & `1440px`) đều đạt. Chưa đo độ trễ thực tế sau deploy trên Vercel production.
- **Ảnh hưởng database**: Không thay đổi cấu trúc dữ liệu hay cần migrate. Các tài liệu `chatRateLimits`, `newsletterSubscribers`, `orders` giữ nguyên schema.

## 27/11/2026 — Thiết kế lại UI/UX Kho Mẫu Thư (Split Studio) và bổ sung bộ 4 mẫu chuẩn theo hành trình khách hàng

- **Lý do**: Khắc phục tình trạng khung xem trước ở tab *Mẫu Thư* vẫn bị xếp chồng xuống dưới cột nhập liệu hẹp; chuẩn hóa lại logic phân nhóm điều khiển UI/UX của trình thiết kế email theo mô hình Email Studio chuyên nghiệp (Shopify Email / Klaviyo) và tạo sẵn đủ 4 mẫu chuẩn: *Đăng ký nhận tin*, *Đã nhận đơn hàng*, *Đang giao hàng*, *Cảm ơn sau khi nhận hàng*.
- **Thay đổi chính**:
  - `src/admin/MailTemplateLibrary.jsx`, `src/styles/admin.css`: Tách *Bộ 4 mẫu chuẩn* và *Kho mẫu đã lưu* thành 2 kệ thẻ (card shelves) thoáng ở phía trên; đưa vùng soạn & thiết kế mẫu thư xuống khung **Split Studio 2 cột toàn chiều rộng** với thanh tác vụ cố định trên đầu, cột điều khiển bên trái và khung **Xem trước HTML/Text cố định song song bên phải** (không còn nằm dưới đáy form). Hỗ trợ chèn biến đơn hàng trực tiếp tại con trỏ và nhận diện mẫu gửi riêng có biến đơn hàng để xem trước với đơn minh họa.
  - `src/lib/mail-presets.js`, `server/default-mail-templates.js`, `src/lib/mail-html.js`: Tạo sẵn và tự động khởi tạo 4 mẫu chuẩn ORORA (`builtin-welcome`, `builtin-order-confirmation`, `builtin-order-shipping`, `builtin-order-thankyou`), bổ sung điều khiển bước kích hoạt trên thanh hành trình đơn hàng (`orderActiveStep: 1 | 2 | 3`) và hỗ trợ hiển thị hộp mã ưu đãi tri ân (`showCoupon`) trong thư đơn hàng. Cơ chế seed ghi nhận `seededIds` để tự động bổ sung 2 mẫu mới cho cửa hàng đã seed bản cũ mà không tạo lại mẫu quản trị viên từng xóa.
  - `src/admin/MailDesignFields.jsx`, `src/lib/mail-design.js`: Tổ chức lại bảng chỉnh giao diện thành 4 bảng phối màu sang trọng bấm-1-chạm (*ORORA Signature*, *Rose Editorial*, *Minimal Ivory*, *Midnight Luxe*) và 3 nhóm rõ ràng theo từng khu vực (*Hiển thị & Nội dung*, *Kiểu chữ & Kích thước*, *Màu sắc* kèm mã `#HEX`), mở khóa đầy đủ các khối đơn hàng cho cả mẫu gửi riêng có biến đơn hàng.
  - `src/admin/MailWriter.jsx`, `src/admin/MailOrderTokenBar.jsx`, `src/admin/MailPreviewDialog.jsx`: Gom các biến cá nhân hóa đơn hàng thành ngăn kéo phân nhóm gọn (*Khách hàng*, *Đơn hàng & Thanh toán*, *Vận chuyển & Tra cứu*), đưa mục *Khung và màu email* lên trước *Sửa mã HTML*, thêm nút nạp nhanh 3 mẫu theo giai đoạn đơn (*Đã nhận đơn*, *Đang giao hàng*, *Sau khi nhận hàng*) trong trình gửi email đơn hàng, và đồng bộ xem trước biến đơn hàng trong hộp thoại chọn mẫu.
- **Kiểm tra đã chạy**: `npm run check` (298 unit tests trong đó có kiểm thử 4 mẫu chuẩn & nâng cấp seed v1, ESLint, Vite build, kiểm tra giới hạn bundle) và Playwright `qa/admin-confirm.spec.js` trên 4 khung nhìn (`320px`, `390px`, `768px`, `1440px` — xác minh khung xem trước nằm song song bên phải cột soạn thảo ở desktop) đều đạt. Chưa gửi thư thật đến hộp thư ngoài.
- **Ảnh hưởng database**: Khi quản trị viên mở mục Email, `ensureDefaultMailTemplates` ghi thêm tối đa 2 mẫu mặc định mới (`builtin-order-shipping`, `builtin-order-thankyou`) vào `newsletterTemplates` và cập nhật mảng `seededIds` trên `newsletterSettings/libraryDefaultsSeed`. Không ghi đè cấu hình thư tự động đang dùng và không phục hồi mẫu đã xóa.

## 27/11/2026 — Nâng cấp bộ chỉnh mẫu email (Email Studio) theo từng phần và Click-to-Select

- **Lý do**: Cho phép quản trị viên chỉnh chi tiết từng phần trong email (Đầu thư, Tiêu đề, Nội dung, Các khối chuyên biệt, Nút hành động, Chân thư) gồm kiểu chữ máy tính/điện thoại, màu sắc, bật/tắt khối, định dạng văn bản giàu và bấm trực tiếp trên bản xem trước để chỉnh nhanh.
- **Thay đổi chính**:
  - `src/lib/mail-design.js`, `src/lib/mail-html.js`: Mở rộng schema `mailDesign` (tương thích ngược hoàn toàn) với 6 phông chữ nội dung, phông/cỡ chữ riêng cho Thương hiệu & Tiêu đề (máy tính/điện thoại), màu sắc riêng từng khu vực, logo ảnh/banner HTTPS, hộp mã ưu đãi, 3 ô giá trị thương hiệu, nhãn & thứ tự các khối đơn hàng, chân thư tùy chỉnh và công tắc bật/tắt từng khối; hỗ trợ định dạng nhanh an toàn (`**đậm**`, `*nghiêng*`, `==nhấn màu==`, `## tiêu đề phụ`, `> hộp nổi bật`, danh sách, kẻ ngang).
  - `src/admin/MailFormatToolbar.jsx`: Thêm thanh công cụ định dạng nhanh ngay trên ô soạn nội dung ở `MailWriter` và `MailTemplateLibrary`.
  - `src/admin/MailDesignFields.jsx`, `src/admin/MailPreviewPane.jsx`: Mở rộng thành 7 nhóm chỉnh sửa (`Khung thư`, `Đầu thư`, `Tiêu đề`, `Nội dung`, `Các khối`, `Nút hành động`, `Chân thư`) đồng bộ trực tiếp khi bấm vào từng phần trên khung Xem trước (`Click-to-Select`).
  - `src/admin/MailPreviewDialog.jsx`: Nâng cấp hộp thoại xem mẫu & lịch sử thư hiển thị giao diện HTML thật kèm nút chuyển Văn bản thuần.
  - `src/admin/MailWriter.jsx`, `src/admin/NewsletterAdmin.jsx`: Giữ nguyên thiết kế khung/màu khi bấm *Nạp mẫu chuẩn ORORA*, sửa cảnh báo thay đổi chưa lưu (`dirtyGuard`) nhận diện cả thay đổi `design` của Thư Đăng Ký.
- **Kiểm tra đã chạy**: `npm run check` (unit tests, ESLint, Vite build, bundle budget) và Playwright `qa/admin-confirm.spec.js`. Chưa gửi thử trên hộp thư sản xuất.
- **Ảnh hưởng database**: Không cần migrate. Các thuộc tính thiết kế mới lưu trong trường `design` hiện có với giá trị mặc định tương thích ngược cho mọi mẫu cũ.

## 27/11/2026 — Bố trí lại màn hình soạn thư và kho mẫu

- Đặt bản xem trước cạnh vùng soạn trên desktop. Kho mẫu hiển thị toàn bộ mẫu khi mở, cho tìm, xem trước HTML hoặc văn bản và nhân bản mẫu. Thư đơn hàng dùng dữ liệu minh họa để hiện biến trong bản xem trước.
- Thêm hoàn tác khi nạp nội dung chuẩn trong trình soạn. Không thay đổi cấu trúc database.
- Lint, build và 12 lượt Playwright tại 390/1440 px đạt. Chưa kiểm tra trên admin production.

## 27/11/2026 — Chỉnh HTML phần nội dung email

- Thêm chế độ mã nguồn ở trình soạn và kho mẫu. Xem trước và tạo thư gửi dùng chung bộ lọc HTML và biến {{content}}. Tắt chế độ vẫn giữ mã để chỉnh tiếp.
- Lưu mã cùng thiết kế của mẫu, không cần chuyển đổi database. Kiểm tra 80 bài mail/newsletter, lint, build và Playwright 390/1440 px đạt. Chưa gửi thư thật.

## 27/11/2026 — Mở rộng trình soạn email cho admin

- Chia thiết kế thành bốn phần. Cho chỉnh tên thương hiệu, dòng phụ, dòng xem trước hộp thư, font, độ đậm, căn đoạn và nút hành động. Thư đơn hàng dùng đường dẫn tra cứu hoặc hỗ trợ của đơn.
- Cho di chuyển các đoạn nội dung trong cả trình soạn và kho mẫu. Lưu các tùy chọn mới vào trường design sẵn có, không chuyển đổi dữ liệu cũ.
- 79 bài kiểm tra mail/newsletter, lint, build và kiểm tra giao diện ở 390/1440 px đạt. Chưa gửi thư vào hộp thư thật.

## 27/11/2026 — Chỉnh khung và màu thư trong admin

- Thêm bộ chỉnh nền, viền, góc, chiều rộng khung, màu nút và chữ nội dung trong Gửi thư, thư tự động và kho Mẫu Thư. Bản xem trước và thư HTML gửi đi dùng cùng cấu hình.
- Kiểm tra lint, build, 78 bài kiểm tra email/newsletter và hai lượt Playwright trên khung nhìn 390/1440 px đều đạt. Chưa gửi thư ra hộp thư thật.
- Lưu thêm trường design vào tài liệu mẫu hoặc chiến dịch khi admin lưu. Mẫu cũ dùng giao diện mặc định, không cần chuyển đổi dữ liệu.

## 27/11/2026 — Sửa chớp trang chi tiết sản phẩm ở EN và JP

- ProductDetail giữ lại sản phẩm đã dịch giữa các lần rê chuột và cuộn để tránh khởi động lại đo kích thước và hiệu ứng xuất hiện.
- Playwright desktop tái hiện lỗi ở EN/JP trước khi sửa, VI đạt. Sau sửa cả ba ngôn ngữ và bài kiểm tra zoom đều đạt. Lint và build đạt. Không thay đổi database.

## 27/11/2026 — Ưu tiên dòng thiếu bản dịch và thêm gợi ý admin

- Đưa dòng thiếu EN/JP lên trước trong Bản dịch. Thêm gợi ý cạnh thao tác khó của Bản dịch, Đơn hàng, Kiểm kho, Phí vận chuyển, Email và Thư cần xử lý.
- Build, lint và 16 lượt Playwright đạt. Không thay đổi dữ liệu.

## 27/11/2026 — Dịch phần đầu trang và danh mục

- Dịch cụm mỗi ngày mặc định trong Hero và các nhãn lọc Tất cả, Trắng Da, Dưỡng Da sang EN/JP.
- Lint, build và kiểm tra tám giá trị dịch đạt. Không thay đổi database.

## 27/11/2026 — Gọn hiệu ứng hover và chọn dung tích

- Bỏ vệt sáng rê chuột trên ảnh thẻ và nhãn nổi bị cắt ở thanh mua. Chỉ hiện dung tích ở trang chi tiết, giá vẫn cập nhật theo lựa chọn.
- Tải ảnh nội dung đầu tiên sớm hơn và bỏ hiệu ứng xuất hiện trên ảnh đó ở trang khách. Lint, build và chín lượt Playwright đạt. Không thay đổi database.

## 27/11/2026 — Làm rõ ảnh phụ trên thẻ sản phẩm

- Thẻ trang chủ chọn ảnh theo thứ tự bộ ảnh sản phẩm và dùng ảnh CDN chất lượng cao theo kích thước hiển thị. Khi rê chuột, giữ ảnh chính đến khi ảnh phụ tải xong, bỏ phóng lớn và lớp phủ sáng trên ảnh phụ.
- Lint, build và 9 lượt Playwright đạt. Không thay đổi database.

## 27/11/2026 — Chỉnh toàn bộ khối đánh giá sản phẩm

- Visual Builder cho chọn khung đánh giá, bật/tắt toàn mục và chỉnh riêng khung ngoài, khung thẻ, chữ và sao. Giữ nhãn nhận diện đánh giá minh họa.
- Lint, build và bốn lượt kiểm tra preview đạt. Không ghi dữ liệu sản xuất.

## 27/11/2026 — Thanh mua nhanh và đánh giá trong Builder

- Dùng nền đục cho thanh mua nổi để nội dung bên dưới không xuyên qua. Visual Builder hỗ trợ chọn đánh giá và chỉnh tiêu đề, kiểu chữ, khung thẻ.
- Lint, build và bảy lượt Playwright đạt, một lượt cấu hình desktop bỏ qua bài dành cho mobile. Không thay đổi dữ liệu sản xuất.

## 27/11/2026 — Gỡ file hướng dẫn nhân viên khỏi repo

- **Lý do**: Tài liệu hướng dẫn quản trị nội bộ chỉ cần xuất file Excel gửi nhân viên, không lưu trong repo mã nguồn.
- **Thay đổi chính**:
  - Xóa `docs/HUONG-DAN-QUAN-TRI-ADMIN.md` và `docs/HUONG-DAN-QUAN-TRI-ADMIN.xlsx` khỏi repo (giữ bản xuất Excel ngoài repo để người dùng tải trực tiếp).
- **Kiểm tra đã chạy**: Kiểm tra `git status` sạch, không ảnh hưởng mã nguồn hay build.
- **Ảnh hưởng database**: Không ảnh hưởng.

## 27/11/2026 — Sửa lỗi chức năng, đồng bộ UI/UX và mở rộng danh mục cho Bản dịch

- **Lý do**: Khắc phục lỗi không xóa được bản dịch đã lưu, tránh nháy tiếng Việt khi tải trang EN/JP, loại bỏ nơi chỉnh bản dịch trùng lặp ở Visual Builder, bổ sung dịch Danh mục sản phẩm, tránh giới hạn 500 document/transaction và đồng bộ giao diện/nội dung theo thiết kế Admin ORORA.
- **Thay đổi chính**:
  - `src/admin/TranslationAdmin.jsx`: Cho phép xóa trắng ô EN/JP (và thêm nút "Xóa về mặc định") để gỡ bản dịch đã lưu và kích hoạt nút Lưu; đọc và lưu bản dịch cho `settings/productCategories` kèm bộ lọc khu vực "Danh mục sản phẩm"; chia transaction lưu theo từng document theo lô 5 mục thay vì gộp 1 transaction lớn; thêm thanh tiến độ dịch EN/JP, huy hiệu trạng thái từng dòng (`EN ✓ / Tự động / —`, `JP ✓ / Tự động / —`), placeholder gợi ý bản dịch tự động từ từ điển, đổi nhãn lọc thành "Chưa có bản dịch EN/JP" và phân biệt thông báo lỗi (`.admin-error`) với thành công (`.admin-success`).
  - `src/admin/PhraseTranslationForm.jsx`: Cho phép xóa trắng một ngôn ngữ khi sửa cụm từ, bổ sung nút **Xóa** cụm từ đã lưu khỏi `phraseOverrides`, đồng bộ nhãn `EN`/`JP` và kiểu thông báo lỗi/thành công.
  - `src/admin/translations.css`: Bọc panel trong `.admin-card`, thay toàn bộ mã màu cứng sang token `admin-theme.css` và bổ sung kiểu hiển thị thanh tiến độ, huy hiệu trạng thái, nút xóa.
  - `src/lib/home-shell.js`: Đưa `translations`, `phraseOverrides` và các mục `translationSheet` thuộc phần khung đầu trang (Navbar/Hero/Marquee) vào `/api/storefront-shell` để loại bỏ hiện tượng nháy tiếng Việt khi khách tải lại trang ở EN/JP.
  - `src/lib/translation-rows.js`: Chuyển đường dẫn vị trí (`row.where`) sang tiếng Việt thân thiện (loại bỏ `@uuid` và tên biến kỹ thuật) nhưng giữ nguyên hoàn toàn `row.key` để tương thích dữ liệu và file Excel cũ.
  - `src/lib/live-home-client.js`, `src/hooks/useCategories.js`: Truyền kèm `translationSheet` của `settings/productCategories` để áp dụng bản dịch danh mục tùy chỉnh trước khi fallback sang từ điển.
  - `src/admin/builder/LanguageSwitcherSettings.jsx`, `src/admin/AdminApp.jsx`: Gỡ form nhập câu dịch cũ trùng lặp trong Visual Builder, thống nhất nhãn `Tiếng Nhật (JP)` và thêm nút chuyển thẳng sang mục **Bản dịch** (qua sự kiện `orora-admin-navigate`, vẫn giữ cảnh báo thay đổi chưa lưu).
- **Kiểm tra đã chạy**: `npm run check` (293/293 unit test đạt, ESLint 0 lỗi/0 cảnh báo, Vite build và giới hạn bundle đạt), Playwright `qa/translation-admin.spec.js` (12/12 lượt trên 4 kích thước màn hình `320px/390px/768px/1440px` đạt). Chưa ghi trực tiếp trên Firestore sản xuất.
- **Ảnh hưởng database**: Không cần migrate. Chỉ có thể lưu thêm trường `translationSheet` (tùy chọn) trên document `settings/productCategories` khi quản trị viên dịch danh mục.
## 27/11/2026 — Thiết kế lại khu vực Bản dịch

- Chia nội dung website và cụm từ thành hai tab. Thêm thống kê thiếu bản dịch, lọc khu vực, danh sách cụm đã lưu có tìm kiếm và sửa trực tiếp.
- Lint, build và tám lượt Playwright đạt. Không cần chuyển đổi dữ liệu.

## 27/11/2026 — Dịch theo cụm từ

- Admin có thể lưu câu tiếng Việt và bản EN/JP vào cấu hình trang chủ. Website đối chiếu nguyên cụm văn bản khi khách đổi ngôn ngữ và khi nội dung xuất hiện sau.
- Build, lint và tám lượt Playwright đạt. Chưa ghi thử trên dữ liệu sản xuất.

## 27/11/2026 — Tải lại bản dịch trong admin

- Thêm nút đọc bản dịch mới nhất từ máy chủ. Hỏi trước khi bỏ sửa đổi chưa lưu và chỉ xóa bản nháp sau khi tải thành công.
- Lint và bốn lượt Playwright đạt với dữ liệu máy chủ giả lập. Không thay đổi database.

## 27/11/2026 — Bổ sung nội dung đa ngôn ngữ

- Thêm nhãn tab kỹ thuật và hướng dẫn, địa chỉ, tiêu đề và CTA vào bảng dịch nếu đã nhập. Bổ sung EN và JP cho trình xem ảnh và các nhãn trang chính sách.
- Lint và build đạt. Không ghi dữ liệu sản xuất.

## 27/11/2026 — Thu gọn form bản dịch

- Admin hiển thị tám câu mỗi trang, tìm kiếm không dấu, lọc theo ngôn ngữ thiếu hoặc bản nháp. Chỉ mở trình sửa của câu được chọn.
- Lint, build và bốn lượt Playwright kiểm tra phân trang, lọc, giữ bản nháp và chiều rộng đều đạt. Không thay đổi database.

## 27/11/2026 — Chọn VI / EN / JP

- Bật chuyển ngôn ngữ trên thanh điều hướng và menu điện thoại, dùng mã ja cho tiếng Nhật và hiển thị JP. Khôi phục lựa chọn đã lưu.
- Build và 8 lượt Playwright trên bốn chiều rộng đạt. Không thay đổi database.

## 27/11/2026 — Tải bảng dịch hiện tại

- Admin đọc lại trang chủ và sản phẩm từ máy chủ khi xuất Excel. Hỗ trợ sửa, nhập và lưu cả tiếng Anh lẫn tiếng Nhật, đọc được file cũ bốn cột.
- Build, lint và kiểm tra đọc 219 dòng song ngữ đạt. Chưa thử ghi trên database thật.

## 27/11/2026 — Biên tập bản dịch bằng Excel

- Admin Bản dịch đọc nội dung trang chủ và sản phẩm, nhập hoặc xuất Excel, cho sửa tiếng Anh và lưu sau khi kiểm tra nội dung gốc. Ghi bản dịch riêng khi quản trị viên bấm lưu.
- Build và lint đạt. Đã đọc lại 219 dòng từ file Excel xuất cho nội dung công khai và kiểm tra khóa khối khi đổi thứ tự. Chưa thử ghi lên database thật.

## 27/11/2026 — Chạm để phóng to và chọn ảnh phụ

- Ảnh trong nội dung chi tiết mở với mức phóng to 2× quanh điểm chạm và đóng khi chạm lại. Ảnh phụ mờ đổi ảnh chính ngay khi chọn.
- Lint, build và tám lượt Playwright trên bốn chiều rộng đều đạt. Thao tác chạm được giả lập. Không thay đổi database.

## 27/11/2026 — Thao tác với ảnh nội dung sản phẩm

- Trình xem ảnh trong nội dung bỏ nút ×, thêm Lưu ảnh và Chia sẻ liên kết ảnh. Chạm nền hoặc dùng Escape để đóng.
- Lint, build và bốn lượt Playwright kiểm tra tải ảnh, gọi API chia sẻ giả lập và thu phóng đều đạt. Không thay đổi database.

## 27/11/2026 — Hiển thị mục chi tiết và vuốt ảnh phụ

- Visual Builder thêm công tắc cho ảnh phụ, mã, mô tả ngắn, thông tin chi tiết, đánh giá và thẻ slogan. Cấu hình cũ mặc định vẫn hiển thị.
- Vuốt ngang dải ảnh phụ để chuyển nhóm ảnh, chạm ảnh để chọn. Kiểm tra Playwright trên bốn chiều rộng và build thành công. Không cần chuyển đổi dữ liệu.

## 27/11/2026 — Tối giản trình xem ảnh sản phẩm

- Bỏ tiêu đề hiển thị, số thứ tự, thanh zoom và hướng dẫn trong ProductImageLightbox. Chạm trực tiếp để đổi mức thu phóng.
- Playwright kiểm tra ảnh tăng gấp đôi và đóng bằng Escape ở bốn chiều rộng, cả bốn lượt đạt. Không thay đổi database.

## 27/11/2026 — Sửa thao tác phóng to ảnh sản phẩm

- Ảnh vừa khung theo cả chiều rộng và chiều cao. Khi phóng to, trình xem giữ điểm đang chạm và cho kéo để xem chi tiết.
- Playwright kiểm tra kích thước ảnh thực tế ở mức 150%.

## 27/11/2026 — Xem lớn ảnh trong nội dung chi tiết sản phẩm

- Mở ảnh của các khối nội dung bằng trình xem ảnh sản phẩm hiện có. Dùng tên mô tả của ảnh cho nút mở và hộp thoại. Visual Builder giữ thao tác chọn khối để chỉnh sửa.
- Kiểm tra mở ảnh, phóng to, đóng bằng Escape và trả focus về ảnh. 16 lượt Playwright trên bốn chiều rộng đạt, lint các tệp sửa và build thành công. Không thay đổi database.

## 27/11/2026 — Khắc phục lỗi Chromium và kiểm tra lại WebKit

- Visual Builder cho phép chọn phần tử trong liên kết preview và mở bảng chỉnh trên màn hình nhỏ. Khôi phục viền focus của ô chat, lề giỏ hàng, cỡ chữ ô số lượng và thu gọn thanh mua nhanh ở 320 px.
- Đồng bộ các bài Playwright với tên dung tích kèm giá, cấu hình Zalo, xác nhận bỏ bản nhập, các chế độ preview, menu admin và hình học thực tế của hiệu ứng giỏ hàng.
- Đã chạy npm run check, 10 bài WebKit iOS của CI, kiểm tra giá preview trên cả bốn kích thước và chạy lại luồng checkout ở 320 px. Không thay đổi database.

## 27/11/2026 — Thư cần xử lý trong admin

- Gom thư xác nhận đơn, chào mừng và thông báo cửa hàng mới vào hai bộ sưu tập Firestore orderMailReview và newsletterMailReview, dùng quyền admin theo từng nguồn.
- Menu hiện số thư cần xử lý. Admin có thể chọn nhiều dòng hoặc chọn theo bộ lọc, đối chiếu Outlook và mở trang vận hành liên quan.
- Vercel Cron chạy hằng ngày (08 giờ Việt Nam), mỗi lượt tối đa 30 thư đến hạn cho mỗi nguồn. Cần CRON_SECRET và quyền Microsoft Graph đọc hộp thư. Bản ghi cũ tiếp tục tra ở lịch sử hiện có.
- Lint, build và 290 kiểm thử đạt. Chưa chạy cron hoặc đối chiếu Outlook trên production.

## 27/11/2026 — Báo cho cửa hàng khi có đơn hoặc đăng ký nhận tin mới

- API đặt đơn và đăng ký nhận tin gửi email nội bộ qua Microsoft khi vừa tạo bản ghi. Thư chứa liên kết đến khu vực xử lý trong admin. Có thể chọn hộp thư nhận qua STORE_NOTIFICATION_EMAIL.
- Ghi kết quả gửi tại storeNotification trên bản ghi tương ứng trong Firestore. Yêu cầu trùng và lần thử lại gửi thư chào mừng không phát sinh thông báo mới.
- 289 kiểm thử đạt, lint và build thành công. Chưa kiểm tra nhận thư qua hộp thư thật.

## 27/11/2026 — Tìm đơn, xóa danh mục và thư xác nhận

- Sửa lỗi tìm mã đơn khớp nhầm số điện thoại trong OrdersAdmin.
- Visual Builder hiển thị số sản phẩm trước khi xóa danh mục và đưa chúng về Chưa phân loại trong cùng giao dịch. Việc gán danh mục cập nhật assignmentVersion trên settings/productCategories để phát hiện cập nhật đồng thời. Danh mục trên 499 sản phẩm cần chuyển bớt trước khi xóa.
- Thư xác nhận dùng chung hướng dẫn với bản xem trước. Khi tắt tra cứu, liên kết mở email hỗ trợ với mã đơn trong tiêu đề. MailWriter cho thử cả hai trạng thái.
- Đã chạy lint, 289 kiểm thử và build thành công. Chưa gửi email hoặc thao tác trên Firestore thật.

## 27/11/2026 — Khắc phục toàn bộ lỗi Mức độ Cao & Trung bình sau rà soát toàn diện (Backend, Visual Builder, Admin & Storefront)

- **Lý do**: Thực hiện khắc phục toàn bộ các vấn đề mức độ Cao (H1–H6) và Trung bình (M1–M6) phát hiện trong đợt `/review` tổng thể trên nhánh `main` (`7f64a48`).
- **Thay đổi chính**:
  - **Backend, Tồn kho & Doanh thu (`server/orders.js`, `server/inventory.js`)**:
    - Bảo vệ tổng doanh thu theo ngày (`server/orders.js`): chỉ cộng/trừ delta vào `siteAnalyticsDaily/{day}` khi ngày đó đã có `revenueTracked === true`, tránh ghi đè làm mất doanh thu các đơn cũ khi đơn COD ngày cũ đổi trạng thái thanh toán hoặc bị hủy.
    - Giải phóng đúng `reserved` trên kho gốc từ `reservedTargets` kể cả khi chốt đơn (`paid`/`shipping`) sau lúc admin mới khởi tạo tồn kho theo dung tích (`server/inventory.js`), chấm dứt rò rỉ `reserved`.
  - **Admin, Đơn hàng & Email (`src/admin/OrdersAdmin.jsx`, `src/lib/mail-html.js`, `src/admin/MailWriter.jsx`, `src/lib/api.js`, `src/admin/builder/SharedBuilderPanels.jsx`)**:
    - Chuẩn hóa bộ lọc tìm đơn ở client (`OrdersAdmin.jsx`: bỏ dấu tiếng Việt, chuẩn hóa `+84`/`84`, tìm trên toàn bộ `order.items`) để không ẩn mất kết quả tìm trên máy chủ; bọc chống CSV formula injection (`=`, `+`, `-`, `@`, `\t`, `\r`) khi xuất CSV đơn hàng.
    - Hỗ trợ `bankCode` (mã BIN ngân hàng) trong `renderOrderEmailHtml` và nạp `bankInfo` thật trong `MailWriter.jsx` để bản xem trước email đơn chuyển khoản hiển thị đúng STK & VietQR.
    - Bổ sung `deleteCategory` trong `src/lib/api.js` và nút xóa danh mục có xác nhận trong Visual Builder (`CategoriesBuilderPanel`).
  - **An toàn & Độ khớp Visual Builder (`src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/builder-updaters.js`, `src/admin/builder/PreviewFrame.jsx`, `src/admin/builder/home-model.js`, `src/components/Extras.jsx`, `src/components/Hero.jsx`, `src/styles/hero.css`, `src/components/About.jsx`)**:
    - Bảo toàn `purchaseOptions` (STK ngân hàng, VietQR, nhãn checkout/biên nhận), kiểu Slogan, `navStyles.cart` và `navStyles.surfaces` khi bấm `Khôi phục mặc định mục này` ở `Chi tiết SP` hoặc `Navbar`.
    - Sửa rơi thay đổi ở 3 nhóm thiết lập `purchaseOptions`, `trustStrip`, `recentlyViewed` trong `builder-updaters.js`; mở lại thông báo lưu thành công trên thanh công cụ Visual Builder; chặn điều hướng `<Link>` trong `PreviewFrame` ở pha capture để không văng khỏi `/admin`; sửa `mergeNestedStyle` giữ nguyên giá trị boolean/string ngoài mặc định.
    - Gắn `reviewCardStyle(fs.card)` lên thẻ `.feature-card` (`Extras.jsx`), giữ nguyên khoảng trắng & màu chữ tùy chỉnh trên tiêu đề `Hero` (`Hero.jsx`, `hero.css`), bổ sung `textTransform` và `--mobile-font-size` ở `About.jsx`, đồng bộ `navStyles` + `sectionVisibility` vào preview `Collection`.
  - **Storefront, Công tắc hiển thị, Tìm kiếm & Checkout (`src/components/Navbar.jsx`, `src/components/MobileShopNav.jsx`, `src/components/Footer.jsx`, `src/components/PolicyPage.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/ProductDetail.jsx`, `src/components/AddressSelect.jsx`, `src/lib/catalog-filters.js`, `src/components/Collection.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderForm.jsx`)**:
    - Đồng bộ công tắc tắt `ordertracking` tại cả 5 điểm vào (`Navbar`, `MobileShopNav`, `Footer`, `PolicyPage`, biên nhận `OrderSuccessView`); đồng bộ công tắc `categories` trên dropdown `Navbar`; đồng bộ công tắc `policies` trên `.product-trust-strip` và `shoplinks` trên preview `ProductDetail`.
    - Thêm `tabIndex={-1}` cho các tùy chọn trong `AddressSelect` để không kẹt phím `Tab`; đồng bộ tìm theo `description` và giữ `?q=` giữa `NavbarQuickSearch` và `Collection`; bổ sung kiểm tra `pattern`/`onBlur` cho SĐT khôi phục từ nháp, khóa checkbox ghi nhớ trong preview và xóa đúng `startVariantId` khỏi giỏ khi đổi dung tích trong checkout.
- **Kiểm tra đã chạy**:
  - `npm run check`: toàn bộ 287/287 unit test đạt, ESLint 0 lỗi, Vite build & ngân sách bundle đạt.
- **Ảnh hưởng database**: Không thay đổi schema hay dữ liệu Firestore; bổ sung thao tác xóa danh mục trong `settings/productCategories`.

## 26/11/2026 — Khắc phục 4 vấn đề ưu tiên cao: Chống mời chuyển khoản trùng trong email, làm rõ chỉ số thống kê, ghi nguyên tử analytics & khung chờ ngay khi mở thẳng trang sản phẩm

- **Lý do**: Xử lý triệt để 4 phát hiện ưu tiên cao sau kiểm toán thực tế trên email xác nhận đơn, dashboard thống kê, luồng ghi Firestore analytics và tải trực tiếp trang chi tiết sản phẩm.
- **Thay đổi chính**:
  - **Email xác nhận đơn & VietQR (`src/lib/mail-html.js`, `src/lib/vietqr.js`, `tests/mail-html.test.js`)**:
    - `renderBankTransferBlock`: khi đơn chuyển khoản đã `paymentStatus === "paid"`, chỉ hiển thị thẻ xanh **Đã nhận thanh toán** (tuyệt đối không hiện STK/QR hay mời chuyển tiền lại khi admin gửi lại email).
    - Khi đơn chưa chốt tổng tiền (`totalAmount == null` hoặc `<= 0`), hiển thị thông báo chờ ORORA xác nhận tổng tiền trước khi chuyển khoản; yêu cầu `amount > 0` trong `vietQrUrl` để không bao giờ tạo mã QR bỏ trống số tiền.
    - Chỉ hiển thị STK & QR khi đơn còn phải thu, có tổng tiền hợp lệ và đủ tên ngân hàng, STK, chủ tài khoản.
  - **Làm rõ chỉ số Dashboard Thống kê (`src/admin/AnalyticsDashboard.jsx`)**:
    - Đổi nhãn KPI `"Khách truy cập"` thành **`Tổng lượt khách theo ngày`** (ghi rõ cộng theo từng ngày, có thể lặp qua nhiều ngày) và `"Tỷ lệ chuyển đổi"` thành **`Đơn đã thanh toán / lượt khách theo ngày`** (ghi chú rõ phụ thuộc thời điểm thu tiền, đặc biệt với COD).
  - **Ghi nguyên tử sự kiện Analytics (`server/analytics.js`, `tests/analytics.test.js`)**:
    - Đưa toàn bộ dấu chống trùng (`siteAnalyticsEvents`), dấu khách (`siteAnalyticsVisitors`), bộ đếm ngày (`siteAnalyticsDaily`) và bộ đếm sản phẩm (`siteAnalyticsProducts`) vào **cùng một `db.runTransaction(...)`** để không bao giờ xảy ra lệch số giữa hai bảng khi lỗi giữa chừng.
    - Bổ sung unit test mô phỏng lỗi giữa transaction rồi gửi lại cùng `eventId`, xác nhận cả hai bảng chỉ cộng đúng 1 lần.
  - **Khung chờ tức thì khi mở thẳng URL sản phẩm (`src/App.jsx`, `src/styles/global.css`)**:
    - Thêm `ProductRouteLoading` (khung chờ ảnh, ảnh phụ, tiêu đề, giá, mô tả, nút mua) và hiển thị ngay trên route `/product/:id` trong lúc `home.loading` lẫn `<Suspense>` fallback; bổ sung `.sr-only` vào `global.css` để không lộ chữ trợ năng.
- **Kiểm tra đã chạy**:
  - `npm run check`: 287/287 unit test đạt (gồm 2 kịch bản mới cho email QR/đã thanh toán và retry transaction analytics), ESLint 0 lỗi, Vite build & ngân sách bundle đạt.
- **Ảnh hưởng database**: Không thay đổi schema hay dữ liệu hiện có; mọi lượt ghi sự kiện analytics từ nay thực thi nguyên tử trong 1 transaction Firestore.

## 26/11/2026 — Đưa toàn bộ Thiết lập dùng chung & Cửa hàng vào Visual Builder, vẽ lại Thống kê thực tế và giữ nguyên chữ người dùng nhập

- **Lý do**: Chủ website yêu cầu đưa 2 mục Cửa hàng (`Kênh mua & thanh toán`, `Tra cứu đơn hàng`) cùng toàn bộ `Thiết lập dùng chung` (`Cam kết & chính sách`, `Danh mục`, `Slogan`, `Chọn theo nhu cầu`, `FAQ sản phẩm`) vào Visual Builder để chỉnh đầy đủ (nội dung, form, kiểu chữ, khung, bật/tắt) kèm xem trước trực tiếp; vẽ lại trang Thống kê & biểu đồ cho hợp lý; và không tự động dịch tiếng Anh sang tiếng Việt cho các nhãn người dùng tự nhập.
- **Thay đổi chính**:
  - **Tắt tự động dịch nhãn người dùng nhập (`src/lib/i18n.js`)**:
    - Gỡ bỏ bảng `vietnameseNavLabels` trong `navigationLabel` để khi ngôn ngữ là tiếng Việt (`vi`), mọi nhãn người dùng tự nhập (kể cả tiếng Anh như `Home`, `Products`, `About Us`, `Story`, `Contact`, `Cart`, `Discover`, `Scroll`, `Track Order`...) được giữ nguyên đúng ký tự đã nhập.
  - **Đưa toàn bộ Thiết lập dùng chung & Cửa hàng vào Visual Builder (`src/admin/builder/SharedBuilderPanels.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/lib/page-sections.js`, `src/admin/builder/save-sections.js`, `src/admin/builder/useBuilderDraft.js`)**:
    - Thay thẻ thông báo tạm của `Chọn theo nhu cầu` (`productneeds`) và `FAQ sản phẩm` (`productfaq`) bằng bộ chỉnh đầy đủ ngay trong Visual Builder (nội dung, thêm/sửa/xóa/đảo thứ tự mục, gán sản phẩm, kiểu chữ, khung/nền, công tắc bật/tắt).
    - Bổ sung 5 mục mới vào Visual Builder kèm xem trước trực tiếp trên khung Desktop/Tablet/Mobile: **Slogan sản phẩm** (`productslogan`), **Cam kết & chính sách** (`policies` — xem trước cả dải cam kết và 3 mục trang `/chinh-sach`), **Danh mục sản phẩm** (`categories`), **Kênh mua & thanh toán** (`shoplinks`), và **Tra cứu đơn hàng** (`ordertracking` — xem trước trực tiếp khung tìm kiếm + chi tiết đơn, chỉnh đầy đủ nội dung trang, nội dung kết quả, kiểu chữ và màu khung).
    - Đồng bộ hoàn toàn với Undo/Redo, Draft Guard và nút `Lưu tất cả`.
  - **Vẽ lại trang Thống kê & biểu đồ (`src/admin/AnalyticsDashboard.jsx`, `src/styles/admin.css`)**:
    - Gỡ bỏ `chartDisplaySeries` (không chèn số liệu minh họa vào biểu đồ live), hiển thị 100% dữ liệu thực tế.
    - Nâng cấp 6 thẻ KPI có chỉ số phụ (Doanh thu & TB/đơn AOV, Đơn thanh toán & số ngày có đơn, Lượt xem & TB/ngày, Khách truy cập & lượt xem/khách, Lượt bấm SP & CTR %, Tỷ lệ chuyển đổi).
    - Vẽ lại biểu đồ **Doanh thu theo ngày** sang dạng **biểu đồ cột (Bar Chart)** với trục Y chia bước đẹp (`niceCeiling`), tooltip hiển thị ngày, doanh thu, số đơn và TB/đơn.
    - Vẽ lại biểu đồ **Lượt truy cập & tương tác** với 3 đường (`Lượt xem`, `Khách/ngày`, `Bấm sản phẩm`) kèm **nút chú giải tương tác bật/tắt từng đường**.
    - Nâng cấp bảng Top sản phẩm (huy hiệu hạng `#1–#3`), bảng số liệu từng ngày (hàng Tổng cộng `<tfoot>`, căn số `tabular-nums`), nút **Xuất CSV thống kê** (UTF-8 BOM, chống CSV formula injection) và trạng thái tải skeleton.
- **Kiểm tra đã chạy**:
  - `npm run check`: 285/285 unit test đạt (gồm 2 kịch bản mới trong `tests/page-sections.test.js`), ESLint 0 lỗi, Vite build & ngân sách bundle đạt.
  - Playwright (`qa/visual-builder-focus.spec.js` tại `width-390` và `width-1440`): 6/6 đạt (kịch bản 1 ở 390px đạt khi chạy lại sau cold-start Vite).
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu Firestore hiện có; các mục mới trong Visual Builder đọc và ghi vào đúng các khóa sẵn có trên `settings/home` (`productSlogan`, `productPolicies`, `policyPageContent`, `shopLinks`, `orderTrackingText`, `productNeeds`, `productFaq`) và `settings/productCategories`.

## 26/11/2026 — Thiết lập chuẩn mẫu email HTML cao cấp cho Thư Đăng Ký & Thư Xác Nhận Đơn Hàng (kèm VietQR & xem trước trực tiếp)

- **Lý do**: Chủ website yêu cầu thiết lập thư đăng ký nhận tin và thư xác nhận đơn hàng theo form chuẩn, sang trọng đồng bộ nhận diện ORORA.
- **Thay đổi chính**:
  - **Bộ dựng email HTML chuẩn thương hiệu (`src/lib/mail-html.js`, `src/lib/vietqr.js`)**:
    - Thiết kế bố cục email dạng bảng (table-based responsive), inline CSS tương thích Gmail/Outlook/Apple Mail, có preheader ẩn và thoát mã HTML chống XSS toàn bộ dữ liệu động.
    - **Thư đăng ký (`renderWelcomeEmailHtml`)**: Header nền mận tím `#3a1526` viền hồng ánh kim kèm wordmark `ORORA`, huy hiệu `Chào mừng thành viên mới`, nội dung tùy biến từ admin (hỗ trợ đoạn văn, danh sách gạch đầu dòng, tự động gắn liên kết an toàn), khối 3 giá trị thương hiệu, nút CTA `Khám phá bộ sưu tập ORORA` và chân trang có liên kết `Hủy đăng ký nhận tin` đồng bộ header RFC 8058.
    - **Thư xác nhận đơn hàng (`renderOrderEmailHtml`)**: Thẻ mã đơn hàng, ngày đặt (giờ Việt Nam), huy hiệu trạng thái thanh toán, thanh tiến trình 3 bước (`1. Đã tiếp nhận ✓` → `2. Xác nhận & đóng gói` → `3. Giao hàng tận nơi`), bảng chi tiết nhiều sản phẩm (tên, phân loại, số lượng, thành tiền), tổng kết tạm tính/phí giao/tổng thanh toán, khối thông tin giao nhận (kèm mã vận đơn `trackingCode` nếu có), khối **Chuyển khoản & mã VietQR động** (dùng chung `resolveBank`/`vietQrUrl` trong `src/lib/vietqr.js`, tự đọc thông tin ngân hàng từ cấu hình `settings/home` khi khách chọn chuyển khoản) và nút CTA `Tra cứu trạng thái đơn hàng`.
  - **Nâng cấp mẫu mặc định & gửi đa định dạng (`server/newsletter-content.js`, `server/order-mail.js`, `server/newsletter-admin.js`, `server/microsoft-smtp.js`, `server/microsoft-mail.js`, `src/lib/template-kinds.js`)**:
    - Cập nhật `DEFAULT_WELCOME` và `DEFAULT_ORDER_MESSAGE` theo văn phong chuẩn thương hiệu; bổ sung biến `{{trackingCode}}` (Mã vận đơn).
    - Nâng cấp SMTP (`microsoft-smtp.js`) gửi chuẩn `multipart/alternative` (cả `text` và `html`) và Graph fallback (`microsoft-mail.js`) hỗ trợ `contentType: "HTML"`; áp dụng luôn cho tính năng `Gửi thử` trong Admin. Giữ nguyên `mailEvents` chỉ lưu `subject`/`text` để không phình dung lượng Firestore.
  - **Xem trước trực tiếp trong Admin (`src/admin/MailWriter.jsx`, `src/styles/admin.css`)**:
    - Thêm khung xem trước email HTML trong iframe sandbox (`HTML · Máy tính`, `HTML · Điện thoại 390px`, `Văn bản thuần`), nút chèn nhanh `{{trackingCode}}` và nút `Nạp mẫu chuẩn ORORA` (nạp nhanh văn bản chuẩn mà không tự ghi đè cấu hình đã lưu cho tới khi bấm Lưu).
- **Kiểm tra đã chạy**:
  - `npm run check`: toàn bộ unit test đạt (gồm 4 kịch bản mới trong `tests/mail-html.test.js`), ESLint 0 lỗi, Vite build & ngân sách bundle đạt (0 byte tăng thêm cho bundle trang chủ).
  - Playwright (`qa/admin-appearance.spec.js --grep "email workflows"` tại `width-390` và `width-1440`): 2/2 đạt.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu Firestore hiện có; các mẫu thư đã lưu trong `newsletterSettings` và `newsletterTemplates` vẫn tương thích hoàn toàn và tự động được bọc trong khung email HTML chuẩn ORORA khi gửi.

## 26/11/2026 — Thanh toán, freeship, danh mục và vận hành

- Tạo VietQR ngay trên thiết bị từ mã BIN đã chọn. Admin xem trước bằng cùng bộ tạo mã với khách. Dùng tạm thông tin pháp nhân theo chủ cửa hàng, chỉ hiển thị số liệu thương hiệu có nguồn, Việt hóa các nhãn điều hướng mẫu và bổ sung hướng dẫn chọn sản phẩm.
- Miễn phí tại khu vực phục vụ khi tạm tính lớn hơn 400.000 đ. Giỏ hàng, checkout, API đơn hàng, cam kết và trang chính sách dùng chung cấu hình. Admin có thể đổi ngưỡng.
- Phân trang hàng đợi đơn theo trạng thái, quét hết kho theo lô, đo số tài liệu báo cáo và tránh quét những khoảng ngày đã tổng hợp. Danh mục công khai đi qua API; bộ rules mới yêu cầu admin khi đọc trực tiếp collection sản phẩm.
- Bổ sung workflow backup có thể kích hoạt qua OIDC, diễn tập khôi phục emulator và kiểm tra WebKit iOS trong CI. Không di chuyển dữ liệu production.
- Kiểm tra cục bộ: 279 unit test đạt; ESLint, build, bundle đạt; 44 ca Chromium về mua hàng/admin và 2 ca QR đạt, 8 ca WebKit iOS đạt. Khôi phục đơn và nhật ký mẫu đạt. Hai ca Storage emulator cho tài khoản admin thành viên bị từ chối, đã tái hiện cả trên main trước thay đổi. Chưa xác minh quyền lưu ảnh, cấu hình ngân hàng, backup và Firestore Rules trên production.

## 26/11/2026 — Nâng cấp toàn diện A→Z: Storefront, Checkout VietQR, SEO/Bảo mật, Backend Tồn kho/Mã đơn & Admin/Visual Builder

- **Lý do**: Thực hiện toàn bộ các cải tiến và sửa lỗi từ đợt rà soát tổng thể A→Z (giao diện, trải nghiệm mua hàng, SEO, bảo mật, tồn kho/mã đơn, vận hành đơn hàng và Visual Builder).
- **Thay đổi chính**:
  - **Hạ tầng, SEO & Bảo mật (`vercel.json`, `server/sitemap.js`, `src/components/Seo.jsx`)**:
    - Bổ sung `/chinh-sach` vào sitemap động và gắn security headers chuẩn (`X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, `Strict-Transport-Security`).
    - Giữ đúng ngôn ngữ đang chọn (`useLocale()`) trên `document.documentElement.lang` thay vì cố định `"vi"`.
  - **Storefront UI/UX, A11y & Chuyển đổi (`src/hooks/useHeroFonts.js`, `src/components/Navbar.jsx`, `src/components/ProductCard.jsx`, `src/components/Collection.jsx`, `src/components/ProductDetail.jsx`, `src/components/ProductPurchaseSelection.jsx`, `src/components/ShopCart.jsx`, `src/components/Hero.jsx`, `src/components/Extras.jsx`, `src/components/ChatPanel.jsx`, `src/styles/*.css`)**:
    - Sửa kẹt phông chữ dự phòng ở `useHeroFonts`; thay dải màu chữ Hero neon sang bảng màu Rose–Plum–Champagne đồng bộ thương hiệu; nới nhẹ `letter-spacing` tiêu đề để không dính dấu tiếng Việt.
    - Bổ sung trạng thái đang tải/lỗi/thử lại cho tìm kiếm nhanh trên Navbar, sửa cắt mép popover tìm kiếm trên mobile, trả focus khi nhấn Escape, chống auto-zoom trên iOS (`font-size: 16px`) cho các ô nhập và mở rộng `.mobile-drawer`.
    - Thẻ sản phẩm hỗ trợ chuyển ảnh phụ mượt khi rê chuột trên máy tính, tên sản phẩm là thẻ `<h3>` bấm được vào trang chi tiết; thêm thanh hiển thị từ khóa đang tìm kèm nút xóa nhanh ở `Collection`.
    - Cho phép bấm lại ảnh phụ đang xem để quay về ảnh chính #1 ở PDP; tách `volumeDisabled` khỏi `disabled` để chọn phân loại hết hàng không bị khóa nút chọn dung tích khác; lọc sạch cam kết đã tắt trên `.product-trust-strip`; đồng bộ màu/kiểu nút từ Visual Builder sang thanh mua dính trên desktop.
    - Giỏ hàng sticky chân tổng tiền và cho phép bấm ảnh/tên sản phẩm quay lại PDP; hoàn thiện thuộc tính trợ năng (`aria-hidden`, `role="img"`, `aria-modal="true"`).
  - **Checkout & VietQR (`src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/styles/checkout.css`)**:
    - Dùng `cdnSrc(THUMB)` cho ảnh sản phẩm trong checkout; tự động lưu và điền lại thông tin người nhận (`orora_checkout_profile` trong `localStorage`) cho khách quay lại.
    - Tự động tạo mã **VietQR động** (điền sẵn số tiền & nội dung chuyển khoản) trong biên nhận đơn hàng chuyển khoản ngân hàng.
  - **Backend Quy mô & Toàn vẹn dữ liệu (`server/orders.js`, `server/inventory.js`, `server/order-code.js`, `tests/order-code.test.js`, `tests/orders.test.js`)**:
    - Ghi nhận chính xác `reservedTargets` khi tạo đơn và hoàn đúng kho đã giữ khi hủy đơn (chống rò rỉ `reserved` khi thêm tồn kho theo dung tích về sau); giới hạn `.limit(500)` cho truy vấn `countWaitingForStockKey`.
    - Gỡ trần cứng 10.000 đơn ở `allocateOrderCode`: tự động chuyển tiếp mượt sang mã 5 chữ số (`OW_10000C`+) thay vì báo lỗi 503.
    - Thêm hành động `updateOrderMeta` trong `server/orders.js` để lưu mã vận đơn (`trackingCode`) và ghi chú nội bộ (`internalNote`).
  - **Admin & Visual Builder (`src/admin/OrdersAdmin.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/PreviewFrame.jsx`, `src/components/PolicyPage.jsx`, `src/admin/ProductPoliciesSettings.jsx`)**:
    - Thêm nút **Xuất CSV đơn hàng** (UTF-8 BOM cho Excel) và khung chỉnh sửa **Mã vận đơn & Ghi chú nội bộ** trong chi tiết đơn hàng.
    - Nâng cấp Visual Builder: phím tắt `Ctrl/Cmd+S` (Lưu), `Ctrl/Cmd+Z` (Hoàn tác), `Ctrl/Cmd+Shift+Z` / `Ctrl+Y` (Làm lại), thêm chế độ xem trước **Tablet (768px)** và bộ chọn **xem trước sản phẩm thật từ kho** ở mục Chi tiết SP.
    - Cho phép chỉnh sửa trực tiếp 3 mục nội dung trang `/chinh-sach` trong `ProductPoliciesSettings.jsx` (lưu vào `policyPageContent`, có mặc định an toàn).
- **Kiểm tra đã chạy**:
  - `npm run check`: 273/273 unit test đạt, ESLint 0 lỗi & 0 cảnh báo, Vite build & ngân sách bundle đạt.
  - Playwright (`qa/editor-checkout.spec.js`, `qa/mobile-catalog.spec.js`, `qa/navbar-cart.spec.js`, `qa/product-information-tabs.spec.js`, `qa/admin-appearance.spec.js`, `qa/visual-builder-focus.spec.js` tại `width-390` và `width-1440`): toàn bộ 57 kịch bản đều đạt.
- **Ảnh hưởng database**: Tương thích ngược hoàn toàn với dữ liệu Firestore hiện tại; bổ sung các trường tùy chọn mới (`reservedTargets`, `trackingCode`, `internalNote` trên `orders`; `overflowSeq` trên `orderCodePools`; `policyPageContent` trên cấu hình trang chủ) không làm ảnh hưởng tài liệu cũ.

## 26/11/2026 — Hoàn thiện chính sách, tìm khách hàng và xem trước giao hàng

- Giữ chính sách đổi trả mặc định 7 ngày, cho chọn loại cam kết trong admin. Giữ focus khi tìm email, dùng địa chỉ mẫu phù hợp với phí và dùng chung điều kiện bảo vệ bản nháp trong Visual Builder.
- Kiểm tra: npm run check đạt; kiểm thử Chromium cho mua hàng, điều hướng admin, chính sách và trình chỉnh sửa. Không thay đổi dữ liệu hoặc schema database.

## 26/11/2026 — Sửa luồng đặt hàng và quản trị sau rà soát UX

- Sửa rewrite trang chính sách, xác nhận bỏ bản nhập, kiểm tra điện thoại, tạm tính giỏ, tra cứu và thứ tự đăng ký nhận tin.
- Đồng bộ cam kết và phí giao hàng, thêm tình huống xem trước checkout, bảo vệ bản nháp khi duyệt lịch sử, sửa tiêu đề admin và số liệu theo kỳ. Cho phép tra email chính xác trên lịch sử đơn có phân trang.
- Kiểm tra trên môi trường phát triển: 273 kiểm thử đơn vị, 8 ca Chromium ở 390 px, lint và build. Kiểm tra đường dẫn chính sách từ checkout, trực tiếp và khi tải lại. Chưa kiểm tra bản triển khai Vercel.
- Database: bổ sung truy vấn đọc theo email, không đổi schema hoặc di chuyển dữ liệu.

## 26/11/2026 — Ẩn mặc định nhãn nhỏ "Products" ở mục Sản phẩm, thêm công tắc bật/tắt và rà soát an toàn code

- **Lý do**: Chủ website yêu cầu bỏ phần chữ nhãn nhỏ `Products` ở mục Sản phẩm vì chiếm chỗ không đẹp, sau đó rà soát lại toàn bộ code vừa sửa.
- **Thay đổi chính**:
  - **`src/components/Collection.jsx`**: Ẩn mặc định `.collection-label` ở mục Sản phẩm trang chủ (chỉ hiển thị khi bật `collectionStyles.label.enabled === true`), đồng thời giữ nguyên hiển thị khi tái sử dụng cho khối sản phẩm liên quan (`isRelated`).
  - **`src/admin/builder/CollectionPanels.jsx`**: Thêm công tắc bật/tắt `Hiển thị nhãn nhỏ trên website` trong Visual Builder → Sản phẩm → Nhãn nhỏ.
  - **`src/components/ChatPanel.jsx` & `qa/mobile-catalog.spec.js`**: Gán giá trị mặc định `messages = []` trong `ChatPanel` để chống lỗi runtime `Cannot read properties of undefined (reading 'at')` khi dữ liệu hội thoại chưa khởi tạo mảng tin nhắn, và đồng bộ bộ chọn nút đóng chat trong bài test Playwright.
- **Kiểm tra đã chạy**:
  - `npm run check`: 273/273 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/mobile-catalog.spec.js`, `qa/product-information-tabs.spec.js` tại `width-390` và `width-1440`): 16/16 đạt tuyệt đối.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu production.

## 26/11/2026 — Sửa nhãn Products bị đè, thu gọn tiêu đề tab Mô tả và đồng bộ thanh điều hướng dưới theo vị trí cuộn trang chủ

- **Lý do**: Chủ website phản hồi trên mobile nhãn `Products` ở đầu mục sản phẩm bị phần trên đè cắt một nửa, khối nút `Mô tả` (khi bật 1 tab) đang bị to/lồng 2 lớp viền kém cân đối, và khi cuộn trang chủ xuống từng phần thì thanh điều hướng dưới (`MobileShopNav`) chưa tự chuyển mục đang chọn theo vị trí cuộn.
- **Thay đổi chính**:
  - **Chống đè/cắt nhãn `Products` (`src/components/Collection.jsx`)**:
    - Giới hạn không áp dụng `marginTop` âm từ cấu hình cũ lên `.collection-label` để nhãn `Products` không bị kéo tràn lên mép trên của `.collection` (`overflow: hidden`) và bị mục Câu chuyện phía trên đè cắt.
  - **Thu gọn & thiết kế lại khối tab đơn `Mô tả` (`src/styles/product-detail.css`, `src/styles/product-detail-mobile.css`, `src/styles/mobile-glass.css`)**:
    - Gỡ khung kính lồng 2 lớp trên `.product-information-nav[data-tab-count="1"]`, thay bằng thanh tiêu đề gọn với 2 đường kẻ mảnh hai bên (`──── Mô tả ────`) và nút pill mảnh (`min-height: 28px–30px`, `padding: 4px 14px`) cùng khoảng cách sát gọn tới khung ảnh bên dưới (vẫn giữ nguyên tùy chỉnh màu & kiểu chữ trong Visual Builder).
  - **Scroll-spy cho thanh điều hướng dưới trên trang chủ (`src/components/MobileShopNav.jsx`)**:
    - Tự động theo dõi vị trí cuộn trang trên `/` và trượt ống kính chọn (`aria-current="page"` + `.mobile-nav-lens`) sang đúng mục tương ứng (`Home` → `Story` → `Product`, v.v.) khi người dùng cuộn xuống, kèm khóa chống giật ngắn khi bấm trực tiếp vào tab.
- **Kiểm tra đã chạy**:
  - `npm run check`: 273/273 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/product-information-tabs.spec.js`, `qa/mobile-catalog.spec.js` tại `width-390` và `width-1440`): 16/16 đạt.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu production.

## 26/11/2026 — Khôi phục bản trước đợt rà soát giao diện

- Theo yêu cầu của chủ website, hoàn tác commit 0a06f29. Đã đối chiếu mã nguồn và kiểm thử với cc097bd. Chỉ nhật ký thay đổi khác bản đó. Không thao tác trên database.

## 26/11/2026 — Rà soát trải nghiệm mua hàng, tìm kiếm và quản trị

- Khung mua trên PC cao theo nội dung. Mã sản phẩm vừa chữ, dung tích và số lượng xếp cạnh nhau khi đủ chỗ. Nút thêm giỏ và mua ngay có nhãn riêng. Tổng tiền xuất hiện khi đổi số lượng, cả hai thanh mua dùng chung lựa chọn và kiểu nút từ Visual Builder.
- Khách có thể đổi dung tích sau khi chọn loại hết hàng. Cam kết đã tắt được loại khỏi danh sách tự động. Thu gọn liên kết mua ngoài, đồng bộ kiểu chữ mặc định trong Builder và làm rõ nhãn nhóm trên thanh quản trị.
- Tìm kiếm trên navbar phân biệt đang tải, lỗi và kết quả rỗng, hỗ trợ thử lại và trả focus về nút tìm kiếm khi nhấn Escape. Trên điện thoại, ô tìm kiếm và ô số lượng dùng cỡ chữ dễ nhập, khung giỏ có khoảng đệm hai bên. Tăng cỡ chữ thông tin pháp lý ở chân trang.
- Sửa vòng focus khi nhập chat, xử lý lịch sử chat chưa có tin và cho Hero nhận phông tải xong sau khi đã hiển thị phông dự phòng.
- Kiểm tra gồm 273 bài Node, lint, build và ngân sách bundle. Playwright đã xác nhận bố cục mua ở 1024 và 1440 px, đổi dung tích, tồn kho, thêm giỏ, tổng tiền, checkout và tìm kiếm bàn phím. Cập nhật dữ liệu giả lập cho luồng có Zalo và cách đo hoạt ảnh. Lần chạy diện rộng trong quá trình sửa có lỗi ở các phép đo hoạt ảnh; kết quả toàn bộ ma trận cần đối chiếu với CI của commit.
- Phạm vi dữ liệu chỉ gồm mã giao diện và kiểm thử. Database, rules và dữ liệu production giữ nguyên.

## 25/11/2026 — Thiết kế lại giao diện khung mua sản phẩm trên PC và form chỉnh sửa Admin

- **Lý do**: Chủ website phản hồi khung thông tin & mua sản phẩm trên PC đang bố cục xấu (nhãn số thứ tự `01` bị kéo dài 100% chiều ngang thành thanh trống, khoảng cách giữa Dung tích và Số lượng bị hở do dòng trợ giúp ẩn vẫn chiếm chỗ, cỡ chữ và khung nút Mua ngay chưa hài hòa) và cần chỉnh lại đồng bộ cả giao diện Chi tiết sản phẩm lẫn form Admin.
- **Thay đổi chính**:
  - **Khung mua sản phẩm trên PC (`src/styles/product-detail.css`, `src/styles/purchase-selection.css`)**:
    - Thu gọn nhãn số thứ tự (`01` — `.product-detail-number`) và huy hiệu đánh giá (`.product-rating-summary`) về đúng kích thước `fit-content` (`align-self: flex-start`) thay vì bị kéo giãn 100% chiều rộng cột flex.
    - Xóa khoảng trống thừa giữa phần chọn **Dung tích** và **Số lượng** (`.product-selection-help { display: none }`), nâng cấp nút chọn dung tích (hiệu ứng gradient hồng phấn nhẹ khi chọn, bóng đổ tinh tế) và cụm nút tăng/giảm số lượng.
    - Cân chỉnh lại tỷ lệ chữ tiêu đề sản phẩm (`clamp(30px, 2.75vw, 44px)`), giá (`30px`), đường phân cách mảnh dưới mô tả ngắn, hộp hành động **Mua ngay & Thêm vào giỏ** nền hồng kem sang trọng, và tiêu đề `HOẶC MUA QUA` kèm đường kẻ mảnh nối ngang + nút `Facebook / Tiktok` cân đối.
  - **Giao diện Preview & Form Admin trong Visual Builder (`src/admin/builder/VisualBuilder.css`, `src/admin/builder/ProductCareBuilderPanel.jsx`)**:
    - Gỡ quy tắc cũ `.builder-preview--productdetail .product-detail-content { width: 92% !important; padding-bottom: 48px !important; }` để bản xem trước Chi tiết sản phẩm trong Admin khớp 100% với trang thật trên PC.
    - Tinh gọn giao diện form Admin bên cột phải Visual Builder (340px) cho các mục **Cách chăm sóc**, **Slogan**, danh sách chọn sản phẩm áp dụng và cụm nút thao tác nhóm (`+ Tạo mới / Nhân bản / Xóa bộ` chia 3 cột đều nhau).
- **Kiểm tra đã chạy**:
  - `npm run check`: 273/273 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/editor-checkout.spec.js`, `qa/admin-appearance.spec.js`, `qa/visual-builder-focus.spec.js` tại `width-390` và `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu production.

## 25/11/2026 — Chuyển Cách chăm sóc vào Visual Builder và bổ sung tùy chỉnh cho Sản phẩm vừa xem & Dải chip Cam kết

- **Lý do**: Chủ website yêu cầu chuyển phần **Hướng dẫn chăm sóc phù hợp** vào Visual Builder (xóa khỏi `Sản phẩm → Thiết lập dùng chung`) kèm bật/tắt đầy đủ, đồng thời bổ sung bộ chỉnh nội dung, kiểu hiển thị và bật/tắt trong Visual Builder cho mục **Sản phẩm vừa xem (Gợi ý cho bạn)** và **Dải chip Cam kết** dưới nút mua hàng.
- **Thay đổi chính**:
  - **Chuyển "Cách chăm sóc" vào Visual Builder (`src/lib/page-sections.js`, `src/lib/product-care-guide.js`, `src/admin/builder/save-sections.js`, `src/admin/builder/useBuilderDraft.js`, `src/admin/builder/ProductCareBuilderPanel.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/ProductsAdmin.jsx`)**:
    - Đăng ký mục `productcare` (`Cách chăm sóc`) trong danh sách section của Visual Builder với công tắc bật/tắt toàn cục (`productCareGuide.enabled`), xem trước trực tiếp `<ProductCareGuide>` và đầy đủ công cụ sửa nhóm hướng dẫn, gán sản phẩm, nội dung, kiểu chữ (máy tính/điện thoại) và khung/nền ngay trong Visual Builder.
    - Xóa tab `Cách chăm sóc` khỏi `Sản phẩm → Thiết lập dùng chung` và gỡ file `src/admin/ProductCareSettings.jsx` không còn dùng.
  - **Tùy chỉnh "Sản phẩm vừa xem (Gợi ý)" trong Visual Builder (`src/admin/builder/RecentlyViewedSettings.jsx`, `src/components/RecentlyViewedProducts.jsx`, `src/admin/builder/registry.js`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/StylePanels.jsx`)**:
    - Thêm thành phần `pdRecentlyViewed` có thể bấm trực tiếp trên khung xem trước `Chi tiết SP`: bật/tắt mục, sửa nhãn nhỏ, tiêu đề, số sản phẩm tối đa (2–4), màu/viền/bo góc/đệm khung & thẻ, kiểu chữ (font, cỡ máy tính/điện thoại, màu, độ đậm, căn chữ) cho nhãn, tiêu đề, tên sản phẩm và giá.
  - **Tùy chỉnh "Dải chip Cam kết" dưới nút mua (`src/admin/builder/TrustStripSettings.jsx`, `src/components/ProductDetail.jsx`, `src/admin/builder/registry.js`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/StylePanels.jsx`)**:
    - Thêm thành phần `pdTrustStrip` bấm trực tiếp trên khung xem trước `Chi tiết SP`: bật/tắt dải chip, bật/tắt dấu tích `✓` và đường kẻ ngăn, giới hạn số chip, nhập nội dung tùy chỉnh (hoặc tự động lấy từ Cam kết & chính sách), căn lề, màu nền/viền/icon, bo góc, đệm, khoảng cách và kiểu chữ máy tính/điện thoại.
- **Kiểm tra đã chạy**:
  - `npm run check`: 273/273 unit test (gồm test mới trong `tests/page-sections.test.js` cho `productcare`), ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/admin-appearance.spec.js`, `qa/visual-builder-focus.spec.js`, `qa/editor-checkout.spec.js` tại `width-390` và `width-1440`): 37/37 đạt.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu production; cấu hình mới lưu vào `productCareGuide` và `productDetailStyles.{trustStrip,recentlyViewed}` khi quản trị viên bấm lưu.

## 25/11/2026 — Thiết kế lại bố cục khung mua sản phẩm trên máy tính hết khoảng trống dưới

- **Lý do**: Chủ website phản hồi phần dưới của khung thông tin mua hàng (`.product-detail-info`) bị trống nhiều khi kéo bằng chiều cao khung ảnh.
- **Thay đổi chính**:
  - Cập nhật `src/styles/product-detail.css`: bố cục lại `.product-purchase-content` thành 2 vùng cân đối trên máy tính (vùng trên: mã SP, tên, giá, mô tả ngắn; vùng dưới gắn sát đáy với đường phân cách mảnh gồm chọn dung tích/số lượng, thanh `Mua ngay` & các kênh `Facebook / Tiktok` trải đều toàn chiều rộng khung, kèm dải chip **Cam kết mua hàng** lấy từ dữ liệu Admin).
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/editor-checkout.spec.js` tại `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi database hay security rules.

## 25/11/2026 — Thu gọn khoảng cách Dải chữ chạy ↔ Câu chuyện ↔ Sản phẩm và chống giật khung khi đổi chế độ Lưới / Trượt ngang

- **Lý do**: Chủ website phản hồi khoảng cách giữa Dải chữ chạy, Câu chuyện và Sản phẩm đang quá xa nhau, và khi bấm chuyển giữa `?view=grid#shop` và `?view=carousel#shop` thì khung ảnh sản phẩm bị nhảy.
- **Thay đổi chính**:
  - **Thu gọn khoảng cách các mục (`src/styles/about.css`, `src/styles/collection.css`, `src/admin/builder/defaults.js`)**:
    - Bỏ `min-height: 100vh` khỏi `.about` và `.collection`, giảm khoảng đệm dọc mặc định từ `140px / 150px` xuống `72px` trên máy tính và `52px–64px` trên điện thoại để 3 khu vực liền mạch, cân đối (vẫn giữ tùy chỉnh padding trong Visual Builder).
  - **Chống nhảy khung khi chuyển Lưới / Trượt ngang (`src/components/Collection.jsx`, `src/components/ScrollToTop.jsx`, `src/styles/catalog-filters.css`)**:
    - Truyền `state: { keepScroll: true }` khi đổi bộ lọc/chế độ xem để `ScrollToTop` không cuộn giật trang mỗi lần đổi `?view=grid#shop` ↔ `?view=carousel#shop`.
    - Khởi tạo đồng bộ số cột (`perView`) và khoảng cách cột (`gap`: `28px / 20px / 14px`) + `padding-top: 0` giữa chế độ Lưới và Trượt ngang để khung ảnh sản phẩm đứng yên, không nhảy chiều cao/bề rộng khi chuyển qua lại.
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/mobile-catalog.spec.js`, `qa/carousel-resilience.spec.js` tại `width-390` và `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi database hay security rules.

## 25/11/2026 — Căn đều chiều cao khung ảnh và khung mua sản phẩm trên máy tính

- **Lý do**: Chủ website phản hồi khung ảnh (`.product-detail-gallery`) và khung thông tin mua hàng (`.product-detail-info`) trên trang Chi tiết sản phẩm đang lệch đáy không đều nhau.
- **Thay đổi chính**:
  - Cập nhật `src/styles/product-detail.css` (`@media (min-width: 901px)`): đổi `.product-detail-shell .product-detail-content` sang `align-items: stretch`, kéo đều `height: 100%` cho cả `.product-detail-gallery` và `.product-detail-info` để mép trên và mép dưới hai khung luôn bằng nhau bất kể tỷ lệ ảnh hay số lượng dung tích.
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/editor-checkout.spec.js` tại `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi database hay security rules.

## 25/11/2026 — Nâng cấp trải nghiệm chuẩn flagship (Desktop Sticky Buy Bar, Navbar Search, Sản phẩm vừa xem, SEO, Chat AI & Admin)

- **Lý do**: Thực hiện toàn bộ nhóm sửa lỗi nhỏ và nâng cấp trải nghiệm người dùng + quản trị viên chuẩn các website mỹ phẩm cao cấp.
- **Thay đổi chính**:
  - **Sửa lỗi & đồng bộ (`src/styles/chat-button.css`, `src/components/Seo.jsx`, `src/lib/seo.js`, `src/components/ProductCard.jsx`, `qa/mobile-catalog.spec.js`)**:
    - Đặt quy tắc trừ `--mobile-shop-nav-height` xuống cuối `chat-button.css` (áp dụng cả `[data-dock-side]`) để khung Chat AI trên điện thoại luôn nằm gọn phía trên thanh điều hướng dưới.
    - Cập nhật `document.title` theo từng trang (`<Tên sản phẩm> | ORORA VN`, `Tra cứu đơn hàng | ORORA VN`...) và bổ sung đa ảnh + `availability` (khi có dữ liệu tồn kho thực) vào JSON-LD `Product`.
    - Tắt hiệu ứng nghiêng 3D trên thẻ sản phẩm khi bật `prefers-reduced-motion: reduce`; đồng bộ bài test `qa/mobile-catalog.spec.js`.
  - **Trải nghiệm Website chuẩn Flagship (`src/components/ProductDetail.jsx`, `src/components/RecentlyViewedProducts.jsx`, `src/components/Navbar.jsx`, `src/styles/product-detail.css`, `src/styles/navbar.css`)**:
    - Thêm **Desktop Sticky Buy Bar** nổi gọn khi cuộn qua khối mua hàng trên máy tính (ảnh nhỏ, tên, dung tích/giá, nút Thêm giỏ & Mua ngay).
    - Thêm dải **Cam kết ngắn gọn** (`.product-trust-strip`) ngay dưới cụm nút mua trên điện thoại (lấy trực tiếp từ cấu hình Cam kết trong Admin).
    - Thêm **Tìm kiếm nhanh** trên thanh `Navbar` (`NavbarQuickSearch`) giúp tìm và nhảy thẳng tới sản phẩm từ mọi trang.
    - Thêm dải **Sản phẩm vừa xem** (`RecentlyViewedProducts`, lưu `localStorage`) ở cuối trang chi tiết sản phẩm và nâng cấp trang 404 **Không tìm thấy sản phẩm** thành card đồng bộ kèm gợi ý sản phẩm nổi bật.
  - **Tiện ích Admin (`src/admin/ProductsAdmin.jsx`, `src/styles/admin.css`)**:
    - Thêm nút **Xem trang sản phẩm ↗** ngay trên thanh đầu form sửa sản phẩm và hiển thị tóm tắt số mục nội dung đang bật + số dung tích ngay trên danh sách sản phẩm.
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/navbar-cart.spec.js`, `qa/cart.spec.js`, `qa/product-information-tabs.spec.js`, `qa/editor-checkout.spec.js` tại `width-390` và `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu production.

## 25/11/2026 — Giữ thanh điều hướng dưới khi mở Chat AI trên điện thoại

- **Lý do**: Chủ website yêu cầu khi mở Chat AI trên điện thoại không ẩn thanh điều hướng phía dưới.
- **Thay đổi chính**:
  - Gỡ `.orora-chat-panel` và `.orora-chat-channel-chooser` khỏi quy tắc ẩn `.mobile-shop-nav` trong `src/styles/mobile-shop-nav.css`.
  - Giới hạn chiều cao `.orora-chat-panel` trên màn hình hẹp trong `src/styles/chat-button.css` chừa đúng khoảng `--mobile-shop-nav-height` để khung nhập tin nhắn nằm gọn phía trên thanh điều hướng dưới.
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
- **Ảnh hưởng database**: Không thay đổi database hay security rules.

## 25/11/2026 — Thêm tooltip & toast "Đã thêm vào giỏ" thiết kế riêng, và định dạng lại nút "Tải lại địa chỉ"

- **Lý do**: Chủ website yêu cầu tăng phản hồi cho nút biểu tượng thêm vào giỏ (tooltip thiết kế đẹp + `aria-label` + toast chỉ hiển thị `"Đã thêm vào giỏ"` đồng bộ thẩm mỹ ORORA, không dùng kiểu mặc định và bỏ nút Xem giỏ) và định dạng lại nút "Tải lại địa chỉ" trong form đặt hàng khỏi kiểu nút trần mặc định của trình duyệt.
- **Thay đổi chính**:
  - **Nút thêm vào giỏ & Toast (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/components/ShopCart.jsx`, `src/styles/shop-cart.css`)**:
    - Thêm tooltip nổi dạng viên thuốc kính mờ hồng kem (`data-tooltip` kết hợp `aria-label`, bỏ `title` mặc định của trình duyệt) trên nút giỏ hàng cạnh nút Mua ngay.
    - Nâng cấp thông báo `.cart-announcement` thành toast kính mờ hồng kem kèm biểu tượng dấu tích tròn màu hồng chỉ hiển thị `"Đã thêm vào giỏ"` (đọc từ cấu hình Admin, tự tránh đè thanh điều hướng & thanh Mua ngay trên mobile).
  - **Form đặt hàng (`src/components/OrderFormFields.jsx`, `src/styles/checkout.css`)**:
    - Bọc lỗi tải địa chỉ bằng `.order-error-action` và gắn class `.order-retry-btn` cho nút `Tải lại địa chỉ` đồng bộ màu viền, bo góc và trạng thái hover/focus của form đặt hàng.
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/cart.spec.js`, `qa/editor-checkout.spec.js` tại `width-320` và `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi database hay security rules.

## 25/11/2026 — Chuyển 3 mục Mô tả / Thông số / Hướng dẫn sử dụng sang mặc định tắt, chỉ hiện khi bật ở từng sản phẩm

- **Lý do**: Chủ website yêu cầu 3 mục (`Mô tả`, `Thông số`, `Hướng dẫn sử dụng`) không tự hiển thị mặc định nữa; chỉ khi bấm bật công tắc hiển thị trong chi tiết từng sản phẩm thì mục đó mới hiện trên trang thật, trong khi cấu trúc và giao diện 3 mục vẫn giữ là thuộc tính dùng chung.
- **Thay đổi chính**:
  - Thêm `isProductContentGroupVisible` & `normalizeProductDetailVisibility` trong `src/lib/product-content.js` với mặc định `false` cho cả 3 mục (`description`, `specifications`, `usage`).
  - Cập nhật `src/components/ProductInformation.jsx`, `src/components/ProductDetail.jsx`, `src/admin/builder/registry.js` và `src/styles/product-detail.css`: trên trang thật chỉ hiển thị các mục được bật tường minh (`detailVisibility[group] === true`) và ẩn hoàn toàn khối 3 tab nếu chưa bật mục nào; bỏ dòng tiêu đề mục lặp lại bên dưới thanh tab (và gỡ `pdAboutTitle` thừa khỏi Visual Builder); thanh tab tự căn giữa và co gọn dạng viên thuốc khi chỉ bật 1 mục (`data-tab-count="1"`), chia 2 cột cân đối khi bật 2 mục (`data-tab-count="2"`), và mở rộng đủ 3 cột khi bật cả 3 mục; trong Visual Builder (`preview`) vẫn hiển thị đủ 3 tab dùng chung (`src/admin/builder/preview-products.js`) để chỉnh giao diện.
  - Cập nhật `src/admin/ProductInformationEditor.jsx` & `src/admin/ProductsAdmin.jsx`: công tắc mặc định ở trạng thái tắt, hiển thị nhãn `· Đang hiện / · Đang ẩn` ngay trên từng tiêu đề mục và chuẩn hóa `detailVisibility` khi mở sửa/lưu sản phẩm.
- **Kiểm tra đã chạy**:
  - `npm run check`: 272/272 unit test, ESLint 0 lỗi, Vite build & giới hạn bundle đạt.
  - Playwright (`qa/product-information-tabs.spec.js`, `qa/product-detail-mobile.spec.js` tại `width-320` và `width-1440`): đạt toàn bộ.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay xóa dữ liệu production; sản phẩm cũ chưa bật `detailVisibility` sẽ ẩn 3 mục cho đến khi admin bật và lưu.

## 25/11/2026 — Đồng bộ Admin ↔ Website, sửa thao tác chọn Preview và nâng cấp trải nghiệm trang Chi tiết sản phẩm

- **Lý do**: Thực hiện các hạng mục rà soát đồng bộ giữa Admin/Visual Builder và Website thật, đồng thời nâng cấp trải nghiệm trang Chi tiết sản phẩm theo chuẩn các trang thương mại điện tử mỹ phẩm cao cấp.
- **Thay đổi chính**:
  - **Admin & Visual Builder (`src/admin/builder/InformationTabsSettings.jsx`, `src/components/ProductInformation.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/ProductDetailPanels.helpers.js`, `src/admin/builder/builder-updaters.js`, `src/admin/ProductsAdmin.jsx`)**:
    - Đồng bộ tab đang mở của `InformationTabsSettings` khi chuyển chọn giữa `Khung ảnh`, `Chú thích`, `Tab` trên Preview và tự mở đúng sub-tab `Đầu mục` / `Nội dung` / `Khung nền` ngay cả khi vừa bấm từ thành phần khác sang.
    - Trỏ các dòng Thông số dạng chữ trên Preview về `pdInfoCaption` thay vì mục cũ đã xóa; gỡ hẳn nhánh thừa `pdRowValue` / `pdFieldLabel` / `pdValue:` / `pdLabel:` / `__labelKey`, gỡ CSS cũ (`subheading`, `body`, `rowLabel`, `rowValue`) trộn vào chú thích, và bỏ trường `effect` thừa khi tạo khối mới.
  - **Đồng bộ Admin ↔ Website thật (`src/components/ProductCard.jsx`, `src/styles/product-detail-mobile.css`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Hiển thị đúng chữ nút trên Thẻ sản phẩm theo cấu hình trong Admin thay vì tự cắt `"Xem chi tiết"` thành `"Xem"`.
    - Thay cỡ chữ fix cứng `!important` trên mobile (`.product-detail-number`, `.purchase-subtotal strong`) sang dùng biến `--mobile-font-size`, sửa fallback khoảng cách ảnh phụ (`thumbsLayout.gap`), và thay các mã màu cố định trong khu vực mua hàng/tư vấn/ảnh phụ sang biến CSS theo theme.
  - **Giao diện Website chuẩn Flagship (`src/components/ProductDetail.jsx`, `src/components/ProductReviews.jsx`, `src/components/Navbar.jsx`, `src/styles/product-detail.css`, `src/styles/product-detail-mobile.css`, `src/styles/mobile-shop-nav.css`)**:
    - Kích hoạt bộ xem ảnh toàn màn hình `ProductImageLightbox` từ nút kính lúp trên ảnh chính.
    - Nâng vị trí nút `Back-to-top` trên mobile để không đè lên thanh `Mua ngay` kính lỏng; tăng bề rộng nút `+ / -` chọn số lượng trên điện thoại lên `42px`.
    - Thêm dòng tóm tắt số sao đánh giá (`★ avg (N đánh giá)`) dưới giá sản phẩm (bấm cuộn mượt tới mục đánh giá) và đưa phần Đánh giá ra cột chính rộng rãi dưới nội dung 3 tab, đồng bộ khung thẻ và thứ tự hiển thị (`order: 3`) trên màn hình hẹp.
    - Thay khung chờ tải trang sản phẩm bằng Skeleton 2 cột khớp bố cục thật; đo chiều cao thực của Navbar (`--navbar-height`) để căn vị trí thanh Tab dính (`sticky`) chính xác.
- **Kiểm tra đã chạy**:
  - `npm run check`: **272/272** unit test đạt, `eslint .` 0 lỗi, `vite build` & giới hạn bundle đạt.
  - Playwright (`qa/admin-appearance.spec.js`, `qa/admin-consistency.spec.js`, `qa/visual-builder-focus.spec.js`, `qa/review-card-style.spec.js`, `qa/product-information-tabs.spec.js`, `qa/product-detail-mobile.spec.js`, `qa/editor-simplification.spec.js`, `qa/petals-icons.spec.js` tại `width-320` và `width-1440`): **38/38** bài đạt.
- **Ảnh hưởng database**: Không thay đổi schema, security rules hay dữ liệu production.

## 25/11/2026 — Nâng cấp khối Ảnh + Chú thích, công tắc bật/tắt, hiệu ứng tải & Visual Builder cho nội dung sản phẩm

- **Lý do**: Chủ website yêu cầu bật/tắt riêng từng mục (Mô tả / Thông số / Hướng dẫn sử dụng), thêm nhiều khối Ảnh + Chú thích có công tắc bật/tắt, xóa text/ảnh cũ, cố định ảnh tỷ lệ 3:2 (1920 × 1280 px), bỏ ô văn bản thay thế cho ảnh, gọn phần nhập từng sản phẩm chỉ gồm Đầu mục & Nội dung cơ bản, còn toàn bộ font/màu/hiệu ứng load ảnh & load text dùng chung chỉnh tập trung trong Visual Builder (trang Chi tiết sản phẩm).
- **Thay đổi chính**:
  - **Quản lý nội dung từng sản phẩm (`src/admin/ProductInformationEditor.jsx`, `src/admin/ProductsAdmin.jsx`, `src/lib/product-content.js`, `src/admin/builder/preview-products.js`, `src/components/ProductDetail.jsx`, `src/styles/admin.css`)**:
    - Bật/tắt riêng từng mục (`detailVisibility`), bật/tắt từng khối (`enabled`), bật/tắt riêng chú thích (`showText`), sắp xếp thứ tự khối (↑/↓), xem trước, xóa từng khối / xóa sạch mục / xóa toàn bộ nội dung.
    - Bỏ ô văn bản thay thế cho ảnh và bỏ bộ chỉnh font/màu/hiệu ứng riêng từng khối; chỉ giữ **Đầu mục** và **Nội dung** (chỉnh text cơ bản).
    - Gỡ nhánh fallback nội dung cũ, chuyển dữ liệu mẫu Visual Builder sang khối mới, và tự động làm sạch các trường text cũ (`story`, `material`, `size`, `color`, `origin`) khi lưu sản phẩm.
  - **Khung ảnh 3:2 (1920 × 1280), Skeleton/Shimmer & Hiệu ứng load ảnh/text (`src/components/ProductInformation.jsx`, `src/lib/product-information.js`, `src/styles/product-detail.css`)**:
    - Cố định tỷ lệ khung ảnh `3 / 2` (`1920 × 1280`), hỗ trợ `cover`/`contain`, bo góc, viền, màu nền, đổ bóng, khoảng cách khối, tự nhận diện ảnh đã cache (`img.complete`).
    - Hiệu ứng tải **Skeleton / Shimmer** (`shimmer`, `pulse`, `static`), hiệu ứng chuyển tab (`slide-up`, `fade`, `zoom`, `none`), hiệu ứng load ảnh (`rise`, `fade`, `zoom`, `none`) và hiệu ứng load text dùng chung (`fade`, `rise`, `zoom`, `none`), tôn trọng `prefers-reduced-motion: reduce`.
  - **Tùy chỉnh gọn gàng & giàu hiệu ứng trong Visual Builder (`src/admin/builder/InformationTabsSettings.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/VisualBuilder.css`, `src/admin/builder/registry.js`)**:
    - Thiết kế lại thành 4 tab con gọn (`Tab` / `Khung ảnh` / `Chú thích` / `Hiệu ứng`), bỏ bảng lặp đôi khi chọn trực tiếp trên preview, tách riêng 3 mục nhỏ `Đầu mục` / `Nội dung` / `Khung nền` trong tab Chú thích.
    - Xóa 4 mục cũ thừa (`pdRowLabel`, `pdRowValue`, `pdSubheading`, `pdBody`) và sắp xếp lại danh sách thành phần Chi tiết sản phẩm theo thứ tự từ trên xuống dưới; click Đầu mục / Nội dung trên preview mở thẳng đúng sub-tab Chú thích; click Tab mở luôn bộ chỉnh màu thanh tab & 4 nhóm chỉnh; thay Form đặt hàng lồng lặp trong Chi tiết sản phẩm bằng nút chuyển nhanh sang mục `Form đặt hàng`.
    - Bỏ bước mở `<details>` thừa và khung xem trước lặp lại dưới textarea trong `Sản phẩm → Nội dung` (`ProductInformationEditor.jsx`, `ProductContentEditor.jsx`).
    - Thêm bộ Preset nhanh 1-click cho khung ảnh & hiệu ứng, nút **▶ Xem thử hiệu ứng trên preview** (chạy lại skeleton/shimmer → load ảnh → load text ngay trên khung xem trước), cùng nhiều hiệu ứng mới (`shimmer-rose`, `wave`, `blur-in`, `curtain`, `slide-left`, `stagger`).
- **File / khu vực liên quan**: `src/lib/product-content.js`, `src/lib/product-information.js`, `src/components/ProductInformation.jsx`, `src/components/ProductDetail.jsx`, `src/admin/ProductInformationEditor.jsx`, `src/admin/ProductContentEditor.jsx`, `src/admin/ProductsAdmin.jsx`, `src/admin/builder/InformationTabsSettings.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/VisualBuilder.css`, `src/admin/builder/registry.js`, `src/admin/builder/preview-products.js`, `src/styles/product-detail.css`, `src/styles/admin.css`, `tests/product-content.test.js`, `qa/product-information-tabs.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **272/272** unit test đạt, `eslint .` 0 lỗi, `vite build` & giới hạn bundle đạt.
  - Playwright (`qa/product-information-tabs.spec.js` tại `width-320` và `width-1440` bằng Chrome hệ thống): **8/8** bài đạt.
- **Ảnh hưởng database**: Không thay đổi schema hay security rules và không xóa hàng loạt dữ liệu production. Cấu hình dùng chung lưu trong `home.productDetailStyles.informationTabs`; khi lưu từng sản phẩm, dữ liệu khối mới lưu vào `detailSections` và các trường text cũ được làm sạch.

## 24/11/2026 — Làm sạch nội dung cũ và thêm thao tác cho từng mục ảnh

- Mô tả, Thông số và Hướng dẫn sử dụng hiển thị các mục ảnh mới. Nội dung chi tiết cũ được bỏ qua trong trang sản phẩm và trình sửa. Mỗi tab bắt đầu với một ô ảnh nếu chưa có mục mới.
- Admin có thể thêm, xem trước và xóa từng mục. Chữ dưới ảnh hỗ trợ xuống dòng bằng Enter hoặc ký hiệu xuống dòng như hướng dẫn trong form.
- Ảnh giữ tỷ lệ 3:2 và hiện dần, trượt nhẹ khi cuộn tới. Tùy chọn giảm chuyển động của hệ điều hành được áp dụng.
- Kiểm tra đạt với npm run check và sáu bài Playwright ở 320 px và 1440 px.
- Không xóa hàng loạt dữ liệu production. Khi lưu từng sản phẩm, trình sửa lưu danh sách mục mới vào trường nội dung chi tiết hiện có.

## 24/11/2026 — Xếp ảnh dọc trong ba mục chi tiết sản phẩm

- Mô tả, Thông số và Hướng dẫn sử dụng hỗ trợ nhiều ảnh toàn chiều rộng cột, tỷ lệ 1920 × 1280. Ảnh tải theo cuộn, giữ sẵn khung và hiện dần khi tải xong.
- Sản phẩm → Nội dung cung cấp một ô ảnh ban đầu cho mỗi mục, nút thêm ảnh, chữ và kiểu chữ tùy chọn sau mỗi ảnh, hiệu ứng chữ và công tắc hiển thị từng tab.
- Nội dung chữ cũ vẫn đọc được. Dữ liệu tùy chọn được ghi vào sản phẩm khi admin bấm lưu. Không chạy chuyển đổi dữ liệu hoặc sửa rules.
- Kiểm tra đạt với npm run check và tám bài Playwright tại 320 px và 1440 px cho tab, ảnh, công tắc và giao diện admin.

## 22/11/2026 — Làm gọn dải ảnh phụ ở trang chi tiết

- Hai ảnh phụ hiển thị theo khung vuông, mặc định 48 px trên desktop và 44 px ở màn hình hẹp. Bộ chỉnh Ảnh phụ dùng cạnh hình vuông và áp dụng giới hạn để khung luôn gọn.
- Khi có hơn hai ảnh phụ, hiển thị lát ảnh mờ không viền và không bóng ở cả hai bên. Bấm mỗi bên để lướt theo hướng tương ứng.
- Kiểm tra đạt với npm run check và hai bài Playwright ở 320 px và 1440 px, gồm trường hợp bật hiệu ứng kính.
- Database giữ nguyên dữ liệu, cấu trúc và rules.

## 22/11/2026 — Thu gọn ảnh phụ và tạm ẩn bộ chọn ngôn ngữ

- Trang chi tiết hiển thị tối đa hai ảnh phụ đầy đủ. Khi còn ảnh, nút tiếp hiển thị một phần ảnh kế được làm mờ. Mặc định ảnh vuông 56 px, giảm còn 48 px ở màn hình hẹp. Visual Builder vẫn chỉnh được khung ảnh và có thêm các mức chiều cao nhỏ.
- Website dùng tiếng Việt trong thời gian tạm ẩn bộ chọn. Phần cấu hình và xem trước bản dịch vẫn có trong Visual Builder.
- Kiểm tra gồm 270 bài Node, lint, build, giới hạn bundle và 4 bài Playwright cho ảnh phụ và ngôn ngữ tại 320 px và 1440 px, tất cả đều đạt. Kiểm tra thêm phát hiện ngưỡng chiều cao thanh mua ở 320 px đã vượt từ bản gốc 51b99de. Bài hoàn tác trong Builder đạt khi chạy lại riêng.
- Database giữ nguyên dữ liệu, cấu trúc và rules.

## 21/11/2026 — Đồng bộ kích thước khung ảnh Chi tiết sản phẩm, rà soát toàn bộ bộ chỉnh Admin và nâng cấp giao diện thanh bên / mục lớn Admin

- **Lý do**:
  1. Khung ảnh chính và hàng ảnh phụ ở trang Chi tiết sản phẩm bị không đều và không nhận cấu hình từ Admin do nhiều quy tắc `!important` trong `src/styles/product-detail.css` (`height: var(--balanced-image-height) !important; aspect-ratio: auto !important;` và kích thước cứng `90px !important` trên `.product-detail-thumb`) ghi đè lên các thông số chiều cao, tỷ lệ khung, bo góc và cách cắt ảnh (`objectFit`) mà chủ website chỉnh trong Visual Builder.
  2. Rà soát toàn bộ các mục trên Trang chủ & Chi tiết sản phẩm phát hiện một số thuộc tính khung chưa nối ra trang thật (chiều cao/bo góc/độ dày viền ảnh phần Câu chuyện `About.jsx`, màu nền/viền/bo góc Nút chính `btnPrimary` của `Hero`, khung thẻ Ưu điểm `Features`, khung nền khối Nhận tin `Newsletter`, và chữ nút `Xem tất cả sản phẩm` ở cột `RelatedProductsSidebar`), đồng thời có 6 mục dư thừa trong danh sách chọn phần tử của `Chi tiết sản phẩm` (`pdNavigation`, `pdSectionTitle`, `relLabel`, `relHeader`, `relSection`, `relDescription`) không còn tương ứng với giao diện hiện tại.
  3. Chủ website yêu cầu làm đậm các mục lớn và nâng cấp giao diện thanh bên (sidebar) trong Admin cho rõ ràng, có điểm nhấn hơn.
- **Thay đổi chính**:
  - **Đồng bộ kích thước khung ảnh Chi tiết sản phẩm (`src/hooks/useProductPanelSize.js`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Chỉ áp dụng chiều cao cân bằng tự động (`--balanced-image-height`, tối thiểu `360px`) khi admin để chiều cao tự động (`height = 0`) và tỷ lệ mặc định (`3 / 4`); khi admin chọn chiều cao cố định hoặc tỷ lệ khung riêng (`1 / 1`, `4 / 5`, `2 / 3`, ...), khung ảnh chính giữ đúng tỷ lệ/chiều cao đã cấu hình.
    - Xóa các quy tắc `!important` khóa cứng `.product-detail-gallery`, `.product-detail-image`, `object-fit` và `.product-detail-thumb`; chuyển hàng ảnh phụ sang hiển thị flex đồng tâm với biến `--pd-thumb-size` (mặc định `88×88px` vuông đều) và `--pd-thumb-radius` đọc trực tiếp từ bộ chỉnh `Ảnh phụ`.
  - **Bổ sung đầy đủ bộ chỉnh cho từng khung, chữ, nút trên Trang chủ & loại bỏ mục dư (`src/components/About.jsx`, `src/components/Extras.jsx`, `src/components/Hero.jsx`, `src/components/RelatedProductsSidebar.jsx`, `src/lib/review-card-style.js`, `src/admin/builder/HeroPanels.jsx`, `src/admin/builder/ReviewCardSettings.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/ProductRelatedPanels.jsx`, `src/admin/builder/registry.js`)**:
    - **Câu chuyện (`About.jsx`, `Extras.jsx`)**: Truyền `image.height`, `image.radius` và `image.borderWidth` từ bộ chỉnh Hình ảnh xuống `.about-image-wrapper` thông qua `RevealBox`/`Reveal`.
    - **Hero (`Hero.jsx`, `HeroPanels.jsx`)**: Thêm bộ chỉnh màu nền, màu viền và độ bo góc cho **Nút chính (`btnPrimary`)** tương tự Nút phụ.
    - **Ưu điểm & Đánh giá & Nhận tin (`Extras.jsx`, `ReviewCardSettings.jsx`, `review-card-style.js`, `StylePanels.jsx`)**: Mở rộng `ReviewCardSettings` hỗ trợ chỉnh màu nền thẻ, bo góc, độ dày viền, màu viền và độ đệm trong (`padding`); gắn thiết lập **Khung thẻ ưu điểm** cho mục `Ưu điểm` (`featuresStyles.card`) và **Khung nhận tin** cho mục `Nhận tin` (`newsletterStyles.frame`).
    - **Sản phẩm khác (`RelatedProductsSidebar.jsx`, `registry.js`)**: Cho phép sửa nội dung chữ link **Xem tất cả sản phẩm** (`relButton.text`).
    - **Dọn bỏ 6 mục thừa trong `PRODUCT_DETAIL_FIELD_MAP` (`registry.js`, `ProductDetailPanels.jsx`, `ProductRelatedPanels.jsx`)**: Gỡ `pdNavigation`, `pdSectionTitle`, `relLabel`, `relHeader`, `relSection`, `relDescription` khỏi danh sách chọn phần tử để tránh gây rối khi chỉnh sửa.
  - **Nâng cấp giao diện Admin — Mục lớn đậm rõ & Thanh bên có điểm nhấn (`src/styles/admin.css`, `src/admin/builder/VisualBuilder.css`)**:
    - Tăng độ đậm và phân cấp thị giác cho các tiêu đề lớn (`.admin-shell h1` `font-weight: 800`, `h2`/`h3` `font-weight: 700`, tiêu đề Inspector và nhóm cài đặt `font-weight: 700–800`).
    - Thiết kế lại thanh bên `.admin-side` và `.builder-sections` với nền chuyển sắc dịu (`#ffffff` → `#fff9fb`), huy hiệu `ADMIN` cạnh thương hiệu `ORORA`, đóng khung từng nhóm công việc (`.admin-nav-group`), tiêu đề nhóm chữ in hoa đậm (`font-weight: 800`) có đường kẻ phân tách, và mục đang chọn (`.active`) nổi bật với thanh nhấn trái `3px` màu hồng đậm kèm nền gradient nhẹ.
- **File / khu vực liên quan**: `src/hooks/useProductPanelSize.js`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/components/About.jsx`, `src/components/Extras.jsx`, `src/components/Hero.jsx`, `src/components/RelatedProductsSidebar.jsx`, `src/lib/review-card-style.js`, `src/admin/builder/HeroPanels.jsx`, `src/admin/builder/ReviewCardSettings.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/ProductRelatedPanels.jsx`, `src/admin/builder/registry.js`, `src/styles/admin.css`, `src/admin/builder/VisualBuilder.css`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **270/270** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt (`149.28 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **37/37** test đạt trên `qa/admin-appearance.spec.js`, `qa/admin-consistency.spec.js`, `qa/review-card-style.spec.js`, và `qa/editor-checkout.spec.js` (1 test mobile-only bỏ qua trên `width-1440`).
- **Ảnh hưởng database**: Không thay đổi schema hay rules; các thuộc tính khung mới (`heroStyles.btnPrimary`, `featuresStyles.card`, `newsletterStyles.frame`, `relButton.text`) lưu gọn trong document cấu hình trang chủ hiện có khi quản trị viên chỉnh sửa.

## 21/11/2026 — Thêm cụm chuyển ngôn ngữ `VI` / `EN` / `JA` trên Navbar và bộ dịch đa ngôn ngữ toàn trang

- **Lý do**: Chủ website yêu cầu thêm nút chuyển ngôn ngữ tiếng Việt (`VI`), tiếng Anh (`EN`) và tiếng Nhật (`JA`) ngay trên thanh điều hướng (Navbar) để khách hàng quốc tế có thể chuyển đổi ngôn ngữ xem trang chủ và các luồng mua hàng, đồng thời cho phép quản trị viên tùy chỉnh giao diện nút chọn và bản dịch trong Admin Visual Builder.
- **Thay đổi chính**:
  - **Store ngôn ngữ & từ điển dịch tự động kết hợp bản dịch tùy chỉnh (`src/lib/i18n.js`, `src/hooks/useHomeContent.js`, `src/hooks/useProducts.js`, `src/hooks/useCategories.js`)**:
    - Xây dựng store ngôn ngữ phản ứng (`getLocale`, `setLocale`, `useLocale`) lưu lựa chọn vào `localStorage` (`orora_locale`) và đồng bộ `document.documentElement.lang`.
    - Cung cấp bộ từ điển dịch sẵn (`PHRASE_DICTIONARY`, `PRODUCT_PHRASES`) chuẩn phong cách mỹ phẩm cho toàn bộ nội dung mặc định tiếng Anh (`en`) và tiếng Nhật (`ja`), kết hợp cơ chế ưu tiên bản dịch ghi đè của admin trong `home.translations.en` / `home.translations.ja` (`localizeHomeContent`, `localizeProduct`, `translatePhrase`).
  - **Cụm nút chuyển ngôn ngữ trên Navbar & Mobile Drawer (`src/components/Navbar.jsx`, `src/styles/navbar.css`, `src/lib/navbar-links.js`)**:
    - Thêm `LanguageSwitcher` (`VI` / `EN` / `JA`) đặt cạnh nút Giỏ hàng trong `.navbar-actions` trên desktop và trong `.mobile-drawer-lang` trên menu di động.
    - Hỗ trợ chọn trực tiếp trên khung xem trước Visual Builder (`data-builder-key="navLang"`) và đọc đầy đủ cấu hình ẩn/hiện, bật/tắt từng ngôn ngữ, nhãn nút, màu nền, màu viền, màu nút đang chọn, độ bo góc và kiểu chữ.
  - **Đồng bộ đa ngôn ngữ trên toàn bộ luồng khách hàng (`src/components/ProductCard.jsx`, `src/components/CatalogFilters.jsx`, `src/components/MobileShopNav.jsx`, `src/components/ProductDetail.jsx`, `src/components/ProductPurchaseSelection.jsx`, `src/components/ProductInformation.jsx`, `src/components/ShopCart.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderTracking.jsx`, `src/components/OrderTrackingDetails.jsx`, `src/lib/order-tracking-copy.js`)**:
    - Tự động chuyển ngữ cho thẻ sản phẩm, bộ lọc danh mục, thanh điều hướng dưới mobile, trang Chi tiết sản phẩm (breadcrumb, dung tích, số lượng, nút Mua ngay/Thêm vào giỏ, các tab thông tin, hộp thoại tư vấn), Giỏ hàng, Form đặt hàng, Biên lai Đã nhận đơn và trang Tra cứu đơn hàng.
  - **Bộ chỉnh giao diện & bản dịch trong Admin Visual Builder (`src/admin/builder/LanguageSwitcherSettings.jsx`, `src/admin/builder/NavbarPanels.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/navbar-state.js`, `src/admin/builder/home-model.js`, `src/admin/builder/save-sections.js`, `src/admin/builder/element-options.js`)**:
    - Thêm phần tử **Chuyển ngôn ngữ (VI / EN / JA)** (`navLang`) vào mục **Thanh điều hướng** của Visual Builder.
    - Cho phép chỉnh nhãn nút (`VI`, `EN`, `JA`), bật/tắt từng ngôn ngữ, đổi ngôn ngữ xem trước, chỉnh màu nền/viền/nút đang chọn/bo góc/font/cỡ chữ desktop & mobile, và mở trình sửa bản dịch `EN` / `JA` theo từng khu vực (Thanh điều hướng, Mở đầu Hero, Câu chuyện & Triết lý, Bộ sưu tập & Điểm nổi bật, Đánh giá & Nhận tin, Chân trang) kèm nút **Điền gợi ý tự động**.
- **File / khu vực liên quan**: `src/lib/i18n.js`, `src/hooks/useHomeContent.js`, `src/hooks/useProducts.js`, `src/hooks/useCategories.js`, `src/components/Navbar.jsx`, `src/styles/navbar.css`, `src/lib/navbar-links.js`, `src/components/ProductCard.jsx`, `src/components/CatalogFilters.jsx`, `src/components/MobileShopNav.jsx`, `src/components/ProductDetail.jsx`, `src/components/ProductPurchaseSelection.jsx`, `src/components/ProductInformation.jsx`, `src/components/ShopCart.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderTracking.jsx`, `src/components/OrderTrackingDetails.jsx`, `src/lib/order-tracking-copy.js`, `src/admin/builder/LanguageSwitcherSettings.jsx`, `src/admin/builder/NavbarPanels.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/navbar-state.js`, `src/admin/builder/home-model.js`, `src/admin/builder/save-sections.js`, `src/admin/builder/element-options.js`, `tests/presentation-defaults.test.js`, `qa/navbar-cart.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **270/270** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt (`148.82 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **42/42** test đạt trên `qa/navbar-cart.spec.js`, `qa/admin-appearance.spec.js`, `qa/editor-checkout.spec.js`, và `qa/presentation-polish.spec.js` (2 test phân tách thiết bị bỏ qua đúng điều kiện).
- **Ảnh hưởng database**: Lưu cấu hình nút chuyển ngôn ngữ tại `home.navStyles.languageSwitcher` và bản dịch tùy chỉnh tại `home.translations.{en,ja}` trong document cấu hình trang chủ hiện có; không thay đổi schema hay rules.

## 21/11/2026 — Sửa lỗi Footer tự đổi `Information` → `Thông tin`, `Contact` → `Liên hệ`

- **Lý do**: Hàm `footerCopy()` trong `src/lib/footer-copy.js` có cơ chế tự dịch cứng các nhãn tiếng Anh cũ (`information`, `contact`, `about us`, `shop`, `terms & conditions`, `privacy policy`, `follow us`, `All rights reserved.`) sang tiếng Việt, khiến mỗi khi chủ website cố tình nhập `Information` hoặc `Contact` trong trình sửa Footer thì chữ bị tự động nhảy ngược lại thành `Thông tin` / `Liên hệ`.
- **Thay đổi chính**:
  - **Giữ nguyên giá trị chủ website đã lưu (`src/lib/footer-copy.js`)**: `footerCopy()` chỉ điền nhãn mặc định tiếng Việt khi trường chưa được thiết lập (`null`/`undefined`); mọi chuỗi quản trị viên đã nhập (kể cả tiếng Anh như `Information`, `Contact` hoặc chuỗi rỗng) đều được giữ nguyên ở cả trình sửa lẫn trang thật.
  - **Kiểm thử (`tests/presentation-defaults.test.js`, `qa/presentation-polish.spec.js`)**: Cập nhật unit test và Playwright test xác minh `footerCopy()` giữ nguyên nhãn tiếng Anh người quản trị nhập và chỉ điền mặc định cho trường chưa có dữ liệu.
- **File / khu vực liên quan**: `src/lib/footer-copy.js`, `tests/presentation-defaults.test.js`, `qa/presentation-polish.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt.
  - Playwright (`width-1440` & `width-390`): **7/7** test đạt trên `qa/presentation-polish.spec.js` (1 test mobile-only bỏ qua trên desktop).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 21/11/2026 — Hoàn thiện trải nghiệm Form đặt hàng, Màn Đã nhận đơn và Khung Chat AI

- **Lý do**: Xử lý hàng loạt điểm chưa hợp lý phát hiện qua rà soát thực tế trên 3 luồng khách hàng: Form đặt hàng (trùng dòng Tạm tính, mâu thuẫn lý do phí ship, lặp hướng dẫn chuyển khoản, viền focus trên nút `×` khi vừa mở, lệch kiểu mũi tên mở rộng, hộp thoại còn lề trên mobile), Màn Đã nhận đơn (sai thứ tự ưu tiên, chân trang yếu), và Khung Chat AI (lộ thông báo nội bộ khi chưa cấu hình Zalo, cắt biểu tượng, tiêu đề chào quá lớn, thừa nhãn "Bạn", viền kép ở ô nhập).
- **Thay đổi chính**:
  - **Form đặt hàng (`src/components/OrderFormFields.jsx`, `src/components/ModalDialog.jsx`, `src/styles/global.css`, `src/styles/checkout.css`)**:
    - Ẩn dòng `Tạm tính` trùng lặp khi chưa có phí giao hàng (`shipping.fee === null`), chỉ giữ 1 dòng `Tạm tính (chưa gồm phí giao)`.
    - Hiển thị đúng `shipping.reason` từ `shippingFeeFor()` tại dòng phí giao hàng để khớp hoàn toàn cả 3 tình huống (chưa chọn địa chỉ / chưa có biểu phí / chưa bật tính phí).
    - Bỏ dòng hướng dẫn phương thức thanh toán bị lặp lại dưới khung tóm tắt (giữ bản ngay trong từng lựa chọn thanh toán). Link chính sách giữ `target="_blank" rel="noopener noreferrer"` để không làm mất dữ liệu đang nhập.
    - Focus vào tiêu đề hộp thoại (`tabIndex={-1}`, ẩn outline focus lập trình) thay vì nút đóng `×` khi mở `ModalDialog`.
    - Thống nhất mũi tên mở rộng dạng chevron xoay mượt trên cả `.checkout-note summary` và `.order-received-details summary`.
    - Trên mobile (`≤ 768px`), `.order-form-modal[open]:not(.checkout-preview)` hiển thị toàn màn hình (`100%`, không lề, không bo góc).
  - **Màn Đã nhận đơn hàng (`src/components/OrderSuccessView.jsx`, `src/lib/checkout-presentation.js`, `src/styles/checkout.css`)**:
    - Sắp xếp lại theo thứ tự ưu tiên: **Mã đơn** → **Bước tiếp theo & Thông tin chuyển khoản** → **Chi tiết đơn & Người nhận** → **Lưu ảnh biên lai / Xác nhận nhanh**.
    - Nâng cấp chân trang thành 2 nút rõ ràng: nút phụ **Tra cứu đơn** (dạng nút viền gắn sẵn `?code=...`) và nút chính **Tiếp tục mua sắm** (nút hồng nổi bật; vẫn giữ khả năng đổi chữ trong Visual Builder).
  - **Khung Chat AI (`src/components/ChatButton.jsx`, `src/components/ChatChannelChooser.jsx`, `src/components/ChatPanel.jsx`, `src/styles/chat-button.css`, `qa/chat-popup-side.spec.js`)**:
    - Khi chưa cấu hình Zalo (chỉ có 1 kênh AI), bấm nút chat hoặc gợi ý sẽ mở thẳng khung chat AI; thông báo nội bộ `Zalo chưa được cấu hình...` chỉ hiện ở chế độ xem trước admin (`preview`), không bao giờ lộ ra khách.
    - Sửa lỗi cắt biểu tượng `✧` ở đầu vùng tin nhắn, thu gọn tiêu đề lời chào (`17px` gọn gàng cho khung ~310px, vẫn tôn trọng biến tùy chỉnh admin), bỏ nhãn `"Bạn"` thừa trên bong bóng tin nhắn của khách, và xóa viền kép trên `textarea` của ô nhập liệu.
- **File / khu vực liên quan**: `src/components/OrderFormFields.jsx`, `src/components/ModalDialog.jsx`, `src/components/OrderSuccessView.jsx`, `src/lib/checkout-presentation.js`, `src/styles/global.css`, `src/styles/checkout.css`, `src/components/ChatButton.jsx`, `src/components/ChatChannelChooser.jsx`, `src/components/ChatPanel.jsx`, `src/styles/chat-button.css`, `qa/chat-popup-side.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt (`136.90 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **32/32** test đạt trên `qa/editor-checkout.spec.js`, `qa/order-receipt.spec.js`, `qa/chat-popup-side.spec.js`, `qa/chat-liquid.spec.js`, và `qa/glass-surfaces.spec.js` (2 test phân tách thiết bị bỏ qua đúng điều kiện).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 21/11/2026 — Tối ưu hiệu năng, giảm giật lag cho Form đặt hàng

- **Lý do**: Người dùng phản ánh form đặt hàng có cảm giác lag khi mở, cuộn và gõ chọn địa chỉ; kiểm tra cho thấy nguyên nhân chính đến từ `backdrop-filter: blur(4px)` toàn màn hình trên `dialog::backdrop` chạy chồng lên hiệu ứng cánh hoa rơi nền, kết hợp `backdrop-filter` glass trên mobile, `scrollIntoView` cưỡng bức trên mỗi lần gõ phím trong `AddressSelect`, và thời lượng mở modal `420ms` kèm re-render không cần thiết.
- **Thay đổi chính**:
  - **Loại bỏ GPU blur toàn màn hình & tạm dừng cánh hoa nền (`src/styles/global.css`, `src/styles/checkout.css`)**:
    - Bỏ `backdrop-filter: blur(4px)` ở `.orora-modal::backdrop`, thay bằng lớp phủ tối dịu (`rgba(32, 16, 26, .48)`), thêm `overscroll-behavior: contain` và tạm dừng hiệu ứng `.petal` (`animation-play-state: paused`) khi bất kỳ hộp thoại modal nào đang mở.
    - Tắt rõ `backdrop-filter` trên `.order-form-modal.orora-modal` (nền trắng đặc) để tránh lớp kính kép gây nặng khi cuộn trên mobile.
  - **Giảm reflow khi tìm địa chỉ (`src/components/AddressSelect.jsx`)**: Chỉ gọi `scrollIntoView({ block: "nearest" })` khi điều hướng bằng phím mũi tên (`ArrowDown`/`ArrowUp`) thay vì chạy trên mỗi ký tự gõ, và giới hạn danh sách hiển thị tối đa `40` mục mỗi lần lọc.
  - **Mở form nhanh hơn & giảm re-render (`src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`)**: Rút ngắn `motionDuration` của form đặt hàng xuống `240ms`, memoize `modalStyle`/`titleStyle`/`shippingProp`/`methods` trong `OrderForm.jsx` và bọc `OrderFormFields` bằng `React.memo` kèm `useMemo` cho toàn bộ style cấu hình.
- **File / khu vực liên quan**: `src/styles/global.css`, `src/styles/checkout.css`, `src/components/AddressSelect.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt.
  - Playwright (`width-1440` & `width-390`): **25/25** test đạt trên `qa/editor-checkout.spec.js`, `qa/glass-surfaces.spec.js`, và `qa/petals-icons.spec.js` (1 test mobile-only bỏ qua trên `width-1440`).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 21/11/2026 — Bỏ phần `/ dung tích` bên cạnh giá sản phẩm và sắp xếp lại cụm nút mua hàng

- **Lý do**: Chủ website yêu cầu bỏ phần `/ 180ml` dư thừa bên cạnh giá ở trang Chi tiết sản phẩm (vì dung tích đã chọn ngay bên dưới) và sắp xếp lại vị trí các nút mua hàng cho hợp lý, đồng đều kích thước.
- **Thay đổi chính**:
  - **Hiển thị giá gọn sạch (`src/components/ProductDetail.jsx`)**: Xóa phần `/ {variant.label}` bên cạnh giá sản phẩm (`349.000 đ` thay vì `349.000 đ / 180ml`); dung tích đã chọn vẫn hiển thị rõ ở phần chọn Dung tích và dòng tóm tắt trong thanh Mua ngay.
  - **Bố cục cụm nút mua hàng (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Đưa thanh **Mua ngay + Giỏ hàng** (hành động chính) lên **trên cùng**, ngay dưới bộ chọn Số lượng, với độ rộng thống nhất `440px` trên desktop.
    - Đưa cụm kênh phụ (**Facebook / Tiktok** và nút **Tư vấn** nếu bật) xuống **bên dưới** trong `.purchase-channels-block` có cùng độ rộng `440px` để thẳng mép hai bên, với tiêu đề mặc định gọn hơn (`Hoặc mua qua`, vẫn giữ đầy đủ chữ/kiểu chỉnh trong Visual Builder).
  - **Kiểm thử (`qa/editor-checkout.spec.js`)**: Cập nhật kiểm tra xác minh không còn `.product-price-variant` cạnh giá chính và dung tích vẫn hiện trong `.product-mobile-buy-total`.
- **File / khu vực liên quan**: `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `qa/editor-checkout.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt.
  - Playwright (`width-1440` & `width-390`): **17/17** test đạt trên `qa/editor-checkout.spec.js` và `qa/product-detail-mobile.spec.js` (1 test mobile-only bỏ qua trên `width-1440`).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 21/11/2026 — Sửa lỗi nút Chat AI bị nhảy vị trí trên desktop ở trang Chi tiết sản phẩm

- **Lý do**: Trên desktop (`≥ 769px`), khung `.product-mobile-buy` nằm trong luồng nội dung (`position: relative`) thay vì cố định dưới đáy như trên mobile, nhưng `dock()` trong `ChatButton.jsx` vẫn lấy `getBoundingClientRect().top` của nó để đẩy nút chat lên trên — khiến nút chat bị nhảy lên giữa hoặc đầu màn hình mỗi khi người dùng cuộn hoặc bấm chuyển các mục trong trang chi tiết sản phẩm.
- **Thay đổi chính**:
  - **Chỉ né thanh mua cố định (`src/components/ChatButton.jsx`)**: Kiểm tra `getComputedStyle(buyBar).position === "fixed"` (và loại trừ `.is-preview`) trước khi tính khoảng né `aboveBuy` trong `dock()`. Nhờ vậy, trên mobile nút chat vẫn tự né thanh mua cố định phía dưới, còn trên desktop nút chat luôn neo ổn định ở góc dưới.
  - **Kiểm thử hồi quy (`qa/chat-popup-side.spec.js`)**: Thêm test xác minh trên desktop (`width-1440`) khi có thẻ `.product-mobile-buy` dạng `position: relative` ở giữa trang, nút chat vẫn neo ổn định ở đáy màn hình và không nhảy khi DOM thay đổi.
- **File / khu vực liên quan**: `src/components/ChatButton.jsx`, `qa/chat-popup-side.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` & ngân sách bundle đạt.
  - Playwright (`width-1440` & `width-390`): **9/9** test đạt trên `qa/chat-popup-side.spec.js`, `qa/chat-liquid.spec.js`, và `qa/product-information-tabs.spec.js` (1 test desktop-only bỏ qua trên `width-390`).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 21/11/2026 — Thiết kế lại giao diện trang Tra cứu đơn hàng (UI & tùy chỉnh Admin)

- **Lý do**: Chủ website yêu cầu thiết kế lại giao diện trang tra cứu đơn hàng cho tinh tế, rõ phân cấp và đồng bộ phong cách thương hiệu ORORA trên cả máy tính lẫn điện thoại, đồng thời giữ đầy đủ khả năng chỉnh nội dung & kiểu hiển thị trong trang quản trị.
- **Thay đổi chính**:
  - **Bố cục trang & thẻ tra cứu (`src/components/OrderTracking.jsx`, `src/components/OrderTrackingSearch.jsx`, `src/styles/order-tracking.css`)**:
    - Đưa phần tiêu đề trang sang bố cục căn giữa thoáng gọn với thanh `← Trở về trang chủ` nhẹ ở góc trên.
    - Nâng cấp thẻ tra cứu (`order-tracking-panel`) với đổ bóng mềm, thanh chuyển chế độ dạng segmented pill có biểu tượng (Số điện thoại / Mã đơn), lưới 2 cột cân đối cho chế độ tra mã đơn trên màn hình rộng, hiệu ứng focus dịu và dòng ghi chú bảo mật có biểu tượng khiên ở chân thẻ.
    - Thiết kế lại mục **Hướng dẫn & hỗ trợ** thành thẻ gấp/mở gọn có mũi tên xoay và lưới 3 bước nằm ngang trên desktop (xếp dọc trên mobile).
  - **Danh sách đơn & chi tiết đơn (`src/components/OrderTracking.jsx`, `src/components/OrderTrackingDetails.jsx`, `src/styles/order-tracking.css`)**:
    - Thêm nhãn trạng thái phân màu ngữ nghĩa (`data-status`: mới nhận, đã xác nhận, đang giao, hoàn tất, đã hủy), thẻ kết quả có hiệu ứng hover nhẹ và bố cục 3 tầng gọn gàng trên mobile (không còn lưới 2×2 chật).
    - Nâng cấp thanh tiến trình đơn hàng (`order-tracking-steps`) thành stepper nối liền (nằm ngang trên desktop, timeline dọc trên mobile) với dấu `✓` cho các bước đã qua và vòng nhấn cho bước hiện tại; hộp **Bước tiếp theo** và hộp **Chi tiết số tiền** dùng nền phụ dịu mắt.
  - **Tùy chỉnh trong Admin (`src/admin/OrderTrackingSettings.jsx`, `src/lib/order-tracking-copy.js`, `src/admin/controls/color-defaults.js`)**:
    - Bổ sung tùy chọn **Màu nền phụ (tab / hộp gợi ý)** (`surface` → `--tracking-surface`) trong `Kiểu chữ & khung`, mở rộng khoảng đệm mặc định `24px` (8–40px) và chiều cao ô mặc định `46px` (44–60px), áp dụng đồng bộ giữa bản xem trước admin và trang thật.
  - **Kiểm thử (`tests/order-tracking-copy.test.js`)**: Cập nhật kiểm tra giá trị mặc định mới và xác minh biến `--tracking-surface`.
- **File / khu vực liên quan**: `src/components/OrderTracking.jsx`, `src/components/OrderTrackingSearch.jsx`, `src/components/OrderTrackingDetails.jsx`, `src/styles/order-tracking.css`, `src/admin/OrderTrackingSettings.jsx`, `src/lib/order-tracking-copy.js`, `src/admin/controls/color-defaults.js`, `tests/order-tracking-copy.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
  - Playwright (`width-390` & `width-1440`): **20/20** test đạt trên `qa/tracking-layout.spec.js` và `qa/admin-appearance.spec.js`.
- **Ảnh hưởng database**: Chỉ bổ sung khóa tùy chọn `orderTrackingText.styles.surface` trên cấu hình giao diện khi quản trị viên chủ động đổi màu; không thay đổi schema hay rules.

## 21/11/2026 — Sửa 7 lỗi sau kiểm thử hệ thống Email (A–G: chèn biến mẫu, mã lỗi 5.1.x, kiểm tra lô chiến dịch, fallback tra cứu Outlook, điền sẵn `?code=`, chặn đăng ký lại, đồng bộ nhãn)

- **Lý do**: Xử lý 7 vấn đề phát hiện khi chạy thử bản nâng cấp hệ thống Email trước đó (chèn biến làm 409 `template_changed`, mã `550` chung bị coi nhầm là lỗi người nhận, tự loại `bounced` chưa chạy theo lô và chưa có bộ lọc, cửa sổ cố định của `checkBatch` làm bỏ sót thư cũ, trang tra cứu đơn chưa đọc `?code=`, người đã hủy đăng ký/bounce vẫn bị kích hoạt lại khi gửi form đăng ký, và còn sót nhãn cũ `"Đã nhận"` / trùng mục lọc `"Cần kiểm tra"`).
- **Thay đổi chính**:
  - **A — Chèn biến không giữ `templateRef` cũ (`src/admin/MailWriter.jsx`)**: `insertToken` bỏ `templateRef` khi chèn biến vào mẫu đã chọn để tránh lỗi `409 template_changed` lúc gửi.
  - **B — Phân biệt chính xác lỗi riêng người nhận (`5.1.x`) & tự chuyển `bounced` (`server/newsletter-admin.js`)**: `sendBatch` chỉ coi là lỗi riêng người nhận khi có mã chi tiết SMTP `5.1.x` (`/^5\.1\.\d+$/`) hoặc `recipientRejected === true`, đồng thời cập nhật ngay `status: "bounced"` trên `newsletterSubscribers/{id}`. Mã `550` chung phía người gửi (ví dụ `5.7.60`) sẽ dừng chiến dịch an toàn.
  - **C — Kiểm tra toàn bộ chiến dịch & bộ lọc `Bị trả lại` (`server/newsletter-admin.js`, `src/admin/CampaignOutlookStatus.jsx`, `src/admin/NewsletterAdmin.jsx`)**:
    - Thêm action `checkCampaignBatchOutlook` quét tối đa 30 người nhận mỗi đợt chiến dịch bằng `syncOutlookBatch` và tự động chuyển các địa chỉ bị trả lại sang `status: "bounced"`.
    - Thêm nút **Kiểm tra toàn bộ** trong chi tiết chiến dịch và thêm tùy chọn lọc `Bị trả lại` (`bounced`) trong danh sách người đăng ký.
  - **D — Fallback tra cứu chính xác khi quét theo lô không thấy (`server/outlook-status.js`)**: Với bản ghi có kết quả `not_found` trong `check.checkBatch` (do nằm ngoài cửa sổ 100 thư gửi / 150 thư nhận gần nhất), tự động gọi lại `check(record)` để dò chính xác theo `internetMessageId`.
  - **E — Tự điền mã đơn từ `?code=` trên trang tra cứu (`src/components/OrderTracking.jsx`, `server/order-mail.js`)**: Trang tra cứu đọc tham số `?code=` từ URL, chuyển sang chế độ tra cứu theo mã, điền sẵn mã đơn và đưa con trỏ vào ô nhập 4 số cuối SĐT; cập nhật `DEFAULT_ORDER_MESSAGE` ghi rõ gợi ý nhập 4 số cuối SĐT cạnh `{{trackingUrl}}`.
  - **F — Không kích hoạt lại email đã hủy đăng ký hoặc bị trả lại (`server/newsletter.js`)**: Trong transaction đăng ký, nếu bản ghi đã ở trạng thái `unsubscribed` hoặc `bounced`, giữ nguyên trạng thái và trả về `"exists"` mà không gửi lại thư chào.
  - **G — Đồng bộ toàn bộ nhãn còn sót (`src/admin/NewsletterAdmin.jsx`, `src/admin/OrderMailHistory.jsx`, `src/admin/email-export.js`, `tests/email-export.test.js`)**: Chuyển các nhãn cũ `"Đã nhận"` sang `"Đã gửi đi"` trong thông báo hoàn tất, bảng người đăng ký, ghi chú lịch sử thư đơn và file xuất Excel; gộp hai mục lọc trùng tên `"Cần kiểm tra"` (`stuck` + `unknown`) thành một mục `needs_check`.
  - **Kiểm thử (`tests/newsletter.test.js`, `tests/email-export.test.js`)**: Bổ sung 3 unit test mới kiểm tra chặn đăng ký lại (`unsubscribed`/`bounced`), phân biệt `550` chung vs `5.1.1` auto-bounce trong `sendBatch`, và `checkCampaignBatchOutlook` tự động chuyển `bounced`; cập nhật kỳ vọng nhãn trong `tests/email-export.test.js`.
- **File / khu vực liên quan**: `src/admin/MailWriter.jsx`, `server/newsletter-admin.js`, `src/admin/CampaignOutlookStatus.jsx`, `src/admin/NewsletterAdmin.jsx`, `server/outlook-status.js`, `src/components/OrderTracking.jsx`, `server/order-mail.js`, `server/newsletter.js`, `src/admin/OrderMailHistory.jsx`, `src/admin/email-export.js`, `tests/newsletter.test.js`, `tests/email-export.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **269/269** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
  - Playwright (`width-390`): **14/14** test đạt trên `qa/admin-appearance.spec.js`, `qa/admin-confirm.spec.js`, và `qa/tracking-layout.spec.js`.
- **Ảnh hưởng database**: Cập nhật `status: "bounced"` (kèm `bouncedAt`) trên `newsletterSubscribers/{id}` khi `sendBatch` gặp lỗi người nhận `5.1.x` hoặc khi `checkCampaignBatchOutlook` phát hiện thư bị trả lại; không thay đổi schema hay rules.

## 21/11/2026 — Nâng cấp độ tin cậy hệ thống Email (Graph headers, tự chặn bounce, quét NDR 1 lần, thống nhất trạng thái)

- **Lý do**: Xử lý các lỗi kỹ thuật và điểm chưa đồng bộ trong hệ thống gửi/kiểm tra email được phát hiện qua rà soát (header `List-Unsubscribe` trên Microsoft Graph, thiếu `trackingUrl`/`total` trong `hasOrderTokens`, địa chỉ bounce không tự bị loại khỏi chiến dịch, 1 địa chỉ lỗi làm dừng cả chiến dịch, quét NDR lặp nhiều lần gây tốn quota Graph, chèn biến luôn nối cuối nội dung, và từ vựng trạng thái thư khác nhau giữa 3 màn hình).
- **Thay đổi chính**:
  - **Microsoft Graph & Header (`server/microsoft-mail.js`)**: Chỉ gửi header tùy chỉnh bắt đầu bằng `x-` (`x-orora-mail-id`) trong `internetMessageHeaders` của Graph JSON để tránh bị Microsoft Graph từ chối khi bật `MS_MAIL_TRANSPORT=graph` (SMTP mặc định vẫn gửi đầy đủ `List-Unsubscribe` / `List-Unsubscribe-Post`).
  - **Một nguồn chân lý cho biến đơn hàng (`src/lib/template-kinds.js`, `server/order-mail.js`)**: Chuyển `ORDER_TOKENS` sang `src/lib/template-kinds.js` và sinh regex `hasOrderTokens` trực tiếp từ `ORDER_TOKENS` (bao gồm `trackingUrl` và `total`). Cập nhật `DEFAULT_ORDER_MESSAGE` dùng `Tổng dự kiến`, thêm `{{trackingUrl}}` (tự gắn `?code=...`), bỏ email viết cứng `sales@ororavn.com`.
  - **Tự động chặn địa chỉ bị trả lại & không dừng cả chiến dịch vì 1 người nhận lỗi (`server/newsletter-admin.js`, `src/admin/NewsletterAdmin.jsx`)**:
    - Khi `checkWelcomeOutlook` hoặc `checkCampaignOutlook` phát hiện `bounced`, tự động chuyển `status: "bounced"` trên `newsletterSubscribers/{id}` để loại khỏi các chiến dịch sau.
    - Trong `sendBatch`, phân biệt lỗi riêng của người nhận (`recipientRejected` / `mail_recipient_rejected` / SMTP `550`/`551`/`553`) để ghi nhận `failed` và gửi tiếp thay vì dừng cả chiến dịch; lỗi xác thực/cấu hình toàn cục vẫn dừng an toàn.
  - **Quét NDR gộp 1 lần & phát hiện thư `stuck` thật (`server/outlook-status.js`, `server/orders.js`)**:
    - Bổ sung `check.checkBatch` và `syncOutlookBatch` để tải Sent Items & NDR **1 lần duy nhất** từ mốc thời gian cũ nhất của cả lô rồi đối chiếu trong bộ nhớ thay vì quét lặp lại cho từng thư.
    - Dùng `effectiveMailState(ev, clock())` trong `checkAllOrderOutlook` để phát hiện cả thư `sending` bị kẹt quá 5 phút.
  - **Soạn thư & thống nhất từ vựng trạng thái (`src/admin/MailWriter.jsx`, `src/admin/order-api.js`, `src/admin/OutlookCheck.jsx`, `src/admin/NewsletterAdmin.jsx`, `qa/admin-confirm.spec.js`)**:
    - Nút chèn biến trong `MailWriter.jsx` chèn đúng tại vị trí con trỏ của cả **Tiêu đề** và **Nội dung**, và đồng bộ link xem trước `{{trackingUrl}}` có `?code=`.
    - Thống nhất nhãn trạng thái gọn rõ: `Chưa gửi`, `Đang gửi`, `Đã gửi đi`, `Bị trả lại`, `Gửi lỗi`, `Cần kiểm tra`.
  - **Kiểm thử (`tests/order-flow-and-stock.test.js`)**: Thêm 2 unit test cho Graph `x-*` headers + `hasOrderTokens` (`trackingUrl`, `total`), tự động chặn subscriber `bounced`, và tiếp tục chiến dịch khi 1 người nhận bị từ chối.
- **File / khu vực liên quan**: `server/microsoft-mail.js`, `src/lib/template-kinds.js`, `server/order-mail.js`, `server/outlook-status.js`, `server/orders.js`, `server/newsletter-admin.js`, `src/admin/MailWriter.jsx`, `src/admin/order-api.js`, `src/admin/OutlookCheck.jsx`, `src/admin/NewsletterAdmin.jsx`, `tests/order-flow-and-stock.test.js`, `qa/admin-confirm.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **266/266** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
  - Playwright (`width-390`): **11/11** test đạt trên `qa/admin-confirm.spec.js` và `qa/admin-appearance.spec.js`.
- **Ảnh hưởng database**: Bổ sung giá trị trạng thái `status: "bounced"` (kèm `bouncedAt`) trên tài liệu `newsletterSubscribers/{id}` khi kiểm tra Outlook phát hiện thư bị trả lại; không thay đổi schema/rules hiện có.

## 21/11/2026 — Chuyển phóng to ảnh sản phẩm sang dạng phóng trực tiếp theo vị trí con trỏ (không mở popup riêng)

- **Lý do**: Chủ website yêu cầu di chuột vào vị trí nào trên ảnh sản phẩm thì phóng to trực tiếp ngay tại chỗ đó thay vì mở cửa sổ popup Lightbox riêng.
- **Thay đổi chính**:
  - **Phóng to trực tiếp trên khung ảnh (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Bỏ hoàn toàn popup `ProductImageLightbox` khỏi trang Chi tiết sản phẩm.
    - Trên desktop: di chuột vào ảnh tự động phóng to `2.15×` ngay tại tọa độ con trỏ (`--zoom-x`, `--zoom-y`, cập nhật trực tiếp qua style DOM mượt 60fps) và tự nạp ảnh độ phân giải cao `w_1600`; rời chuột khỏi ảnh hoặc đưa chuột vào nút `‹` / `›` sẽ tự thu về `1×`.
    - Trên mobile: chạm trực tiếp để bật/tắt phóng to tại điểm chạm và kéo ngón tay theo hướng tự nhiên (ảnh di chuyển cùng chiều ngón tay thay vì ngược chiều), kèm chặn sự kiện chuột giả lập sau thao tác chạm; vuốt ngang khi ở mức `1×` để đổi ảnh.
  - **Kiểm thử (`qa/editor-checkout.spec.js`)**: Cập nhật test xác minh di chuột vào ảnh kích hoạt `data-zooming="true"`, cập nhật đúng `--zoom-x`/`--zoom-y`, nạp ảnh `w_1600`, không mở bất kỳ `dialog` nào và tự tắt khi rời chuột.
- **File / khu vực liên quan**: `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `qa/editor-checkout.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **264/264** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.83 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **15/15** test đạt trên `qa/editor-checkout.spec.js` (1 test mobile-only bỏ qua trên desktop).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 21/11/2026 — Bỏ nút "Phóng to ảnh" riêng lẻ, nâng cấp trải nghiệm xem & phóng to ảnh sản phẩm chuẩn e-commerce

- **Lý do**: Nút `Phóng to ảnh` đặt bên dưới ảnh chính làm thừa chi tiết và không tự nhiên bằng thao tác bấm/chạm trực tiếp vào ảnh như các trang thương mại điện tử lớn.
- **Thay đổi chính**:
  - **Thư viện ảnh chính (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Xóa bỏ nút `Phóng to ảnh` rời dưới ảnh.
    - Cho phép bấm/chạm trực tiếp lên ảnh chính (hoặc nhấn `Enter`/`Space`) để mở khung xem ảnh phóng to (`cursor: zoom-in`), kèm hiệu ứng phóng nhẹ khi di chuột trên desktop và biểu tượng kính lúp nhỏ gọn ở góc ảnh.
    - Khi sản phẩm có nhiều ảnh, hiển thị nút mũi tên `‹` / `›` khi di chuột trên desktop, hỗ trợ vuốt ngang trên mobile và phím `←` / `→`, kèm huy hiệu số thứ tự ảnh (`1 / N`).
  - **Khung xem ảnh phóng to (`src/components/ProductImageLightbox.jsx`, `src/styles/product-detail.css`)**:
    - Hỗ trợ chạm trực tiếp vào ảnh để phóng to/thu về `100% ↔ 200%`, kéo để lia ảnh khi đang phóng to, pinch 2 ngón trên mobile, và chuyển ảnh ngay trong Lightbox bằng nút `‹` / `›`, vuốt ngang hoặc phím `←` / `→`.
    - Tinh gọn thanh điều khiển sang dạng pill (`−`, `100%`, `+` và bộ đếm `1 / N`) kèm dòng gợi ý thao tác ngắn.
- **File / khu vực liên quan**: `src/components/ProductDetail.jsx`, `src/components/ProductImageLightbox.jsx`, `src/styles/product-detail.css`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **264/264** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **15/15** test đạt trên `qa/editor-checkout.spec.js` (gồm luồng mở lightbox, phóng to, kéo lia ảnh và đóng bằng `Escape`).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 20/11/2026 — Đưa nút Giỏ hàng (kèm biểu tượng SVG) vào thanh Mua ngay và thêm tùy chọn ẩn nút Tư vấn

- **Lý do**: Nút giỏ hàng đặt cạnh giá trên cùng chưa hợp lý và bị trống biểu tượng do `productCart` chưa có mặc định trong `ButtonIcon`; chủ website muốn đặt nút giỏ hàng ngay bên cạnh giá tạm tính & nút **Mua ngay** ở thanh dưới và tạm ẩn nút **Tư vấn** theo tùy chọn quản trị.
- **Thay đổi chính**:
  - **Thanh Mua ngay (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Đưa giá sản phẩm phía trên về dạng sạch gọn ban đầu.
    - Chuyển nút biểu tượng giỏ hàng (`.product-buy-cart-btn`, kèm SVG giỏ hàng mặc định qua `ButtonIcon allowHidden={false}`) vào trong thanh `.product-mobile-buy` ngay giữa giá tạm tính và nút **Mua ngay** (đồng bộ trên cả desktop và mobile, vẫn giữ tùy chỉnh `pdAddToCart`).
  - **Tùy chọn bật/tắt nút Tư vấn (`src/admin/builder/ProductContactSettings.jsx`, `src/components/ProductDetail.jsx`)**:
    - Thêm công tắc `Hiện nút Tư vấn trên trang sản phẩm` (`showTrigger`, mặc định tắt) trong Visual Builder; trang thật ẩn nút Tư vấn khi tắt và Visual Builder hiển thị mờ để quản trị viên vẫn bấm bật lại được bất kỳ lúc nào.
  - **Kiểm thử (`qa/editor-checkout.spec.js`)**: Chỉ định rõ selector `.product-mobile-buy .product-mobile-buy-cta` khi kiểm tra trạng thái hết hàng.
- **File / khu vực liên quan**: `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/admin/builder/ProductContactSettings.jsx`, `qa/editor-checkout.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **264/264** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **15/15** test đạt trên `qa/editor-checkout.spec.js` (1 test mobile-only bỏ qua trên desktop).
- **Ảnh hưởng database**: Không thay đổi schema hay dữ liệu; bổ sung trường tùy chọn `productDetailStyles.contactActions.showTrigger` (mặc định `false`).

## 20/11/2026 — Bổ sung chức năng Kiểm tra toàn bộ mail 1 lần để phát hiện thư lỗi / trả lại

- **Lý do**: Quản trị viên cần kiểm tra 1 lần toàn bộ email đơn hàng gần đây thay vì phải mở từng đơn để kiểm tra Outlook thủ công.
- **Thay đổi chính**:
  - **Backend (`server/orders.js`)**: Thêm action `checkAllOrderOutlook` trên `POST /api/admin-orders` để quét song song có giới hạn (4 luồng đồng thời, tối đa 30 thư từ tối đa 30 đơn gần nhất) qua `syncOutlookStatus`, đồng thời tổng hợp cả thư lỗi gửi cục bộ (`failed`, `stuck`, `unknown`), thư bị trả lại (`bounced` / NDR) và thư gửi chậm (`delayed`).
  - **Giao diện Admin (`src/admin/OrdersAdmin.jsx`, `src/admin/OrderMailHistory.jsx`)**:
    - Thêm nút **Kiểm tra toàn bộ mail** ở đầu trang `Đơn hàng` (kèm nút **Lọc xem thư lỗi** ngay trên thông báo nếu phát hiện lỗi) và đầu mục `Lịch sử email` (cập nhật trạng thái Outlook trực tiếp trên danh sách).
  - **Kiểm thử (`tests/order-flow-and-stock.test.js`)**: Thêm unit test cho `checkAllOrderOutlook` xác minh tổng hợp thư bình thường, thư trả lại (NDR) và thư lỗi gửi.
- **File / khu vực liên quan**: `server/orders.js`, `src/admin/OrdersAdmin.jsx`, `src/admin/OrderMailHistory.jsx`, `tests/order-flow-and-stock.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **264/264** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
- **Ảnh hưởng database**: Chỉ cập nhật trường `outlook` trên các tài liệu `orders/{id}/mailEvents/{eventId}` đã tồn tại giống luồng kiểm tra đơn lẻ, không thay đổi schema hay rules.

## 20/11/2026 — Sắp xếp trực tiếp trên tiêu đề cột Đơn hàng và tải tức thì tab Đơn hàng, Kiểm kho, Email

- **Lý do**: Quản trị viên muốn bấm trực tiếp vào từng tiêu đề cột trong bảng Đơn hàng để sắp xếp (bỏ hộp chọn `Sắp xếp đơn` thừa ở trên) và khắc phục tình trạng phải chờ tải lại từ đầu mỗi lần bấm vào các mục `Đơn hàng`, `Kiểm kho`, `Email`.
- **Thay đổi chính**:
  - **Sắp xếp trực tiếp trên tiêu đề cột (`src/admin/OrdersAdmin.jsx`, `src/styles/admin.css`)**:
    - Bỏ dropdown `Sắp xếp đơn` trên thanh lọc.
    - Chuyển toàn bộ 7 tiêu đề cột (`Mã đơn / Ngày đặt`, `Người mua`, `Sản phẩm`, `Giá trị đơn`, `Trạng thái`, `Thanh toán`, `Thư xác nhận`) thành nút bấm sắp xếp tăng/giảm trực tiếp kèm `aria-sort` và mũi tên chỉ hướng (`↑`/`↓`/`↕`).
  - **Cache SWR & tải trước nền cho Admin (`src/admin/admin-cache.js`, `src/admin/AdminApp.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/InventoryAdmin.jsx`, `src/admin/NewsletterAdmin.jsx`)**:
    - Tạo bộ nhớ đệm in-memory dùng chung `src/admin/admin-cache.js` kèm chống gọi trùng (`dedupe`) cho `Đơn hàng`, `Kiểm kho`, `Email`.
    - Tải trước nền (chỉ đọc GET + preload JS chunk) sau 500ms khi vào Admin và khi di chuột/focus vào nút menu bên trái; xóa cache khi đăng xuất.
    - Khi bấm vào `Đơn hàng`, `Kiểm kho`, `Email`, dữ liệu đã tải hiện lên ngay lập tức và tự làm mới âm thầm ở nền; tách `ensureDefaultTemplates` sang chạy tối đa 1 lần mỗi phiên ở nền thay vì chặn hiển thị trang Email.
- **File / khu vực liên quan**: `src/admin/admin-cache.js`, `src/admin/AdminApp.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/InventoryAdmin.jsx`, `src/admin/NewsletterAdmin.jsx`, `src/styles/admin.css`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **263/263** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.84 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **24/24** test đạt trên `qa/admin-appearance.spec.js`, `qa/admin-navigation.spec.js`, `qa/audit-resilience.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 20/11/2026 — Tinh gọn Tổng quan & Thống kê Admin; thiết kế lại nút Giỏ hàng, Tư vấn (Zalo/AI) và Mua ngay trên trang sản phẩm

- **Lý do**:
  - Trang Tổng quan và Thống kê Admin có nhiều điều khiển thừa (thanh trượt Thu/phóng thời gian trùng với bộ chọn khoảng ngày, panel tùy chỉnh màu/nét đường X–Y và thanh giãn mốc trên từng biểu đồ, tiêu đề trùng lặp, đoạn chú thích dài dòng).
  - Trên trang Chi tiết sản phẩm, nút `Thêm vào giỏ` chiếm nguyên hàng gây nặng bố cục, nút `Tư vấn` quá lớn và cần hỗ trợ chọn nhanh giữa **Tư vấn qua Zalo** hoặc **Tư vấn cùng AI** giống khung Chat AI.
- **Thay đổi chính**:
  - **Tổng quan & Thống kê Admin (`src/admin/Dashboard.jsx`, `src/admin/TodayTasks.jsx`, `src/admin/AnalyticsDashboard.jsx`, `src/styles/admin.css`)**:
    - Đưa hàng 4 thẻ KPI lên đầu trang Tổng quan, nhấn màu khi có đơn chờ xác nhận; trình bày lại `Cần xử lý hôm nay` gọn gàng với nhãn lý do và số lượng tồn kho còn bán được.
    - Bỏ toàn bộ điều khiển thừa trên trang Thống kê (thanh trượt `Thu/phóng thời gian`, `Kiểu đường X–Y`, `Khoảng cách mốc` và tiêu đề `<h2>` trùng với `<h1>Thống kê</h1>`), thay bằng nhóm nút chọn nhanh `7 / 14 / 30 / 90 ngày`, đưa KPI **Doanh thu đã thanh toán** lên đầu, thêm vùng đổ bóng gradient nhẹ trên biểu đồ SVG, định dạng ngày `DD/MM/YYYY` trong bảng số liệu và gom ghi chú kỹ thuật vào mục thu gọn.
  - **Khu vực mua hàng & Tư vấn trên Chi tiết sản phẩm (`src/components/ProductDetail.jsx`, `src/components/ChatButton.jsx`, `src/styles/product-detail.css`)**:
    - Bỏ nút `Thêm vào giỏ` cỡ lớn, chuyển thành nút biểu tượng giỏ hàng nhỏ gọn (`40×40px`, giữ nguyên tùy chỉnh `pdAddToCart` trong Visual Builder) đặt ngay bên cạnh giá sản phẩm.
    - Thu gọn nút **Tư vấn** (`min-height: 36px`) nằm gọn cùng hàng với **Facebook** / **Tiktok**, đặt khung **Mua ngay** phía dưới cùng.
    - Nâng cấp popup Tư vấn (`ConsultationDialog`) hiển thị lựa chọn **Tư vấn qua Zalo** và **Tư vấn cùng AI** (phát sự kiện `orora-chat-open` mở thẳng khung Chat AI trong `ChatButton.jsx`) cùng tùy chọn gọi điện nếu có cấu hình.
- **File / khu vực liên quan**: `src/admin/Dashboard.jsx`, `src/admin/TodayTasks.jsx`, `src/admin/AnalyticsDashboard.jsx`, `src/styles/admin.css`, `src/components/ProductDetail.jsx`, `src/components/ChatButton.jsx`, `src/styles/product-detail.css`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **263/263** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.82 kB` gzip).
  - Playwright (`width-1440` & `width-390`): **16/16** test đạt trên `qa/admin-appearance.spec.js` & `qa/admin-navigation.spec.js`; **33/33** test đạt trên `qa/editor-checkout.spec.js`, `qa/cart.spec.js` & `qa/button-press.spec.js` (1 test mobile-only bỏ qua trên desktop).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 20/11/2026 — Thiết kế lại bố cục khung nút Mua ngay trên trang Chi tiết sản phẩm (Desktop)

- **Lý do**: Trên giao diện máy tính, khung tạm tính & nút **Mua ngay** bị đặt ở dưới cùng sau `Thêm vào giỏ`, `Tư vấn`, `Facebook`/`Tiktok`, bề ngang chật (`320px`) và không đồng bộ bo góc với các nút kênh mua hàng khác.
- **Thay đổi chính**:
  - **Thứ bậc nút mua hàng (`src/components/ProductDetail.jsx`)**: Đưa khung tạm tính & nút **Mua ngay** (`product-mobile-buy` khi không ghim mobile) lên vị trí đầu tiên ngay dưới tiêu đề `Chọn cách mua hàng`, ngay trên nút phụ **Thêm vào giỏ**; vẫn giữ nguyên thanh kính nổi ghim đáy màn hình trên mobile (`<= 768px`) và giữ đủ tùy chỉnh từ Visual Builder (`PurchaseOptionsSettings`, `pdWebsiteText`).
  - **Đồng bộ thẩm mỹ & kích thước (`src/styles/product-detail.css`)**:
    - Đồng nhất bề ngang `max-width: 380px` và hệ bo góc `12px–14px` cho toàn bộ khối mua hàng (`Mua ngay`, `Thêm vào giỏ`, `Tư vấn`, `Facebook`, `Tiktok`).
    - Nâng cấp khung **Mua ngay** trên desktop sang nền trắng sạch (`#ffffff`), viền mảnh `#e9dde3`, bóng nhẹ, nút CTA rộng rãi (`min-width: 152px`); nút **Thêm vào giỏ** chuyển sang kiểu viền mảnh đồng cặp; tách nhóm hỗ trợ (`Tư vấn` + `Facebook`/`Tiktok`) bên dưới bằng đường kẻ mảnh.
  - **Kiểm thử (`qa/editor-checkout.spec.js`)**: Đợi hoàn tất hiệu ứng mở modal `OrderForm` trước khi đo tọa độ nhãn trên mobile (`width-390`).
- **File / khu vực liên quan**: `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `qa/editor-checkout.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **263/263** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.78 kB` gzip).
  - Playwright (`width-390` & `width-1440`): **15/15** test đạt trên `qa/editor-checkout.spec.js` (1 test mobile-only bỏ qua trên desktop) và **2/2** test đạt trên `qa/cart.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 20/11/2026 — Nâng cấp tồn kho theo biến thể dung tích, tổng hợp doanh thu theo ngày, chỉ mục Firestore và tối ưu UI/UX Storefront & Admin

- **Lý do**: Xử lý các hạng mục đã xác minh từ báo cáo kiểm tra kỹ thuật toàn diện (bỏ qua các mục trùng/đã xử lý và bỏ qua đổi Rate Limiter sang Redis/KV theo yêu cầu), đồng thời nâng cấp schema Firestore khi website đang trong giai đoạn thử nghiệm.
- **Thay đổi chính**:
  - **Tồn kho theo biến thể dung tích (`server/inventory.js`, `server/orders.js`, `server/storefront-stock.js`, `src/admin/InventoryAdmin.jsx`, `src/components/ProductDetail.jsx`, `src/components/ShopCart.jsx`)**:
    - Tách tài liệu tồn kho theo mã `{productId}__{variantId}` cho sản phẩm có nhiều dung tích (`volumeOptions`), vẫn tương thích ngược với tài liệu `{productId}` cũ khi chưa tách kho.
    - Cập nhật `createOrderHandler` và `settleOrderInventory` để giữ chỗ, chặn đặt vượt kho và trừ/hoàn kho đúng theo từng dung tích trong transaction an toàn (đọc trước khi ghi).
    - Cập nhật `server/storefront-stock.js`, `ProductDetail.jsx` và `ShopCart.jsx` đọc trạng thái tồn kho theo từng dung tích đang chọn.
    - Thêm nút **Lưu tất cả (N)** theo lô trên trang Kiểm hàng (`InventoryAdmin.jsx`).
  - **Tổng hợp doanh thu theo ngày & chỉ mục Firestore (`server/orders.js`, `server/analytics.js`, `firestore.indexes.json`)**:
    - Cập nhật nguyên tử `paidAmount`, `paidOrders`, `unpricedPaid`, `revenueTracked: true` vào `siteAnalyticsDaily/{YYYY-MM-DD}` ngay khi đơn hàng đổi trạng thái thanh toán hoặc hủy.
    - `server/analytics.js` đọc trực tiếp tổng hợp doanh thu từ `siteAnalyticsDaily` và bỏ qua quét collection `orders` cho các ngày đã có `revenueTracked: true` (giữ fallback quét cho ngày cũ chưa tổng hợp).
    - Tạo `firestore.indexes.json` khai báo composite index cho `orders (status ASC, createdAt DESC)` và `orders (customer.phone ASC, createdAt DESC)`.
  - **Tối ưu bundle, mobile & typography (`src/components/ChatPanel.jsx`, `src/components/RelatedProductsSidebar.jsx`, `src/styles/checkout.css`, `src/styles/hero.css`)**:
    - Chuyển import `cdnSrc`/`THUMB` ở `ChatPanel.jsx` và `RelatedProductsSidebar.jsx` sang `../lib/image-cdn` để tách mã upload Cloudinary khỏi bundle storefront.
    - Đặt `font-size: 16px` cho các trường nhập ở màn hình đặt hàng mobile (`checkout.css`) để tránh iOS Safari tự phóng to khi focus.
    - Đổi `letter-spacing` của `.hero-title` từ `-4px` sang `-0.02em` để tránh dính dấu tiếng Việt.
  - **Cải tiến UI/UX Storefront & Admin (`src/components/CursorSparkle.jsx`, `src/App.jsx`, `src/admin/builder/SurfaceSettings.jsx`, `src/components/ProductDetail.jsx`, `src/components/ShopCart.jsx`, `src/styles/shop-cart.css`, `src/admin/AdminApp.jsx`, `src/admin/AdminLogin.jsx`, `src/admin/order-api.js`, `src/admin/ProductReviewsEditor.jsx`, `src/admin/ProductVolumeEditor.jsx`)**:
    - Tắt mặc định hiệu ứng lấp lánh theo con trỏ (`CursorSparkle`) và thêm công tắc bật/tắt trong Visual Builder (`SurfaceSettings.jsx`).
    - Giữ cố định thứ tự ảnh thumbnail và hỗ trợ vuốt ngang đổi ảnh trên mobile trong `ProductDetail.jsx`.
    - Thêm thanh **Hoàn tác** 5 giây khi xóa sản phẩm và gợi ý 3 sản phẩm khi giỏ hàng trống trong `ShopCart.jsx`.
    - Hỗ trợ đường dẫn sạch `/admin/:tab` trong `AdminApp.jsx` (vẫn tương thích `#hash` cũ), thêm xác nhận `useConfirm()` trước khi xóa đánh giá/dung tích, hiển thị trạng thái `"Đang đăng nhập…"` trên nút đăng nhập Admin và thay câu thông báo kỹ thuật Vercel trong `order-api.js`.
  - **Kiểm thử (`tests/order-flow-and-stock.test.js`)**:
    - Thêm 2 unit test cho tách tồn kho theo biến thể (`productId__variantId`) và tổng hợp doanh thu ngày không quét `orders`.
- **File / khu vực liên quan**: `firestore.indexes.json`, `server/inventory.js`, `server/orders.js`, `server/storefront-stock.js`, `server/analytics.js`, `src/App.jsx`, `src/components/ChatPanel.jsx`, `src/components/RelatedProductsSidebar.jsx`, `src/components/CursorSparkle.jsx`, `src/components/ProductDetail.jsx`, `src/components/ShopCart.jsx`, `src/styles/checkout.css`, `src/styles/hero.css`, `src/styles/shop-cart.css`, `src/admin/AdminApp.jsx`, `src/admin/AdminLogin.jsx`, `src/admin/InventoryAdmin.jsx`, `src/admin/ProductReviewsEditor.jsx`, `src/admin/ProductVolumeEditor.jsx`, `src/admin/order-api.js`, `src/admin/builder/SurfaceSettings.jsx`, `tests/order-flow-and-stock.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **263/263** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`136.78 kB` gzip).
  - Playwright (`width-390`): **30/30** test đạt trên `qa/cart.spec.js`, `qa/cart-toggle.spec.js`, `qa/cart-settings.spec.js`, `qa/admin-navigation.spec.js`, `qa/admin-appearance.spec.js`, `qa/audit-resilience.spec.js`, `qa/shopping.spec.js`, `qa/button-press.spec.js`.
- **Ảnh hưởng database**:
  - Mở rộng collection `inventory` hỗ trợ document ID `{productId}__{variantId}` cho sản phẩm có nhiều dung tích (tương thích ngược với `{productId}`).
  - Bổ sung các trường tổng hợp doanh thu (`paidAmount`, `paidOrders`, `unpricedPaid`, `revenueTracked`) vào `siteAnalyticsDaily/{YYYY-MM-DD}`.
  - Bổ sung `firestore.indexes.json` (cần chạy `firebase deploy --only firestore:indexes` khi triển khai lên môi trường Firebase mới).

## 20/11/2026 — Đồng bộ toàn diện Backend, Popup Storefront và vận hành Admin sau rà soát chi tiết

- **Lý do**: Rà soát lại toàn bộ hệ thống từ Backend (`server/`), giao diện Storefront đến Admin để xử lý các trường hợp biên, đồng bộ ngôn ngữ thiết kế tối giản cao cấp và hiệu ứng mở/đóng cho toàn bộ popup trên website, cũng như tối ưu thao tác vận hành hằng ngày cho quản trị viên.
- **Thay đổi chính**:
  - **Backend (`server/orders.js`, `server/inventory.js`, `server/order-tracking.js`, `server/chat-knowledge.js`, `server/unsubscribe.js`)**:
    - Chuẩn hóa biến thể SĐT (`0...`, `+0...`, `84...`, `+84...`) bằng `normalizeTrackingPhone`, mở rộng tìm mã đơn và bổ sung tìm theo tên khách hàng / tên sản phẩm không dấu khi Admin tìm kiếm trên máy chủ (`GET /api/admin-orders?q=`).
    - Tính `available = Math.max(0, quantity - reserved)` trong `GET /api/inventory?lowStock=1` để cảnh báo sớm cả sản phẩm đang có nhiều đơn chờ giữ chỗ (giữ nguyên tương thích ngược khi `reserved = 0`), và hiển thị chi tiết trên `TodayTasks.jsx`.
    - Bổ sung fallback an toàn trong `server/order-tracking.js` khi Firestore chưa tạo composite index cho truy vấn tra cứu theo SĐT.
    - Thêm liên kết nhanh **Tra cứu đơn hàng** (`/tra-cuu-don-hang`) và **Chính sách đổi trả & bảo mật** (`/chinh-sach`) vào `buildChatKnowledge` và `guidedChatReply` của Chat AI.
    - Nâng cấp trang xác nhận hủy đăng ký email (`/api/unsubscribe` `GET` & `POST`) thành giao diện thẻ HTML chuẩn thương hiệu ORORA, có `<meta name="viewport">` và nút quay về trang chủ.
  - **Giao diện & UX Storefront (`src/components/CartSelectionDialog.jsx`, `src/components/ConsultationDialog.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderTracking.jsx`, `src/components/ProductDetail.jsx`, `src/components/ShopCart.jsx`, `src/components/Extras.jsx`, `src/styles/shop-cart.css`, `src/styles/storefront-polish.css`)**:
    - Nâng cấp popup **Chọn dung tích** (`CartSelectionDialog`) và **Tư vấn** (`ConsultationDialog`) sang thẻ trắng tinh khiết (`#ffffff`), viền `#ebe4e8`, đổ bóng sâu, nút CTA nổi bật và gắn hiệu ứng mở/đóng mượt từ nút bấm.
    - Đồng bộ hiệu ứng mở/đóng từ tọa độ nút bấm (`motionSource` + `motionClosing`) cho **Form Đặt hàng / Đã nhận hàng** (`OrderForm`) và **Chi tiết đơn tra cứu** (`OrderTracking`).
    - Xóa component `Footer` cũ không còn sử dụng trong `src/components/Extras.jsx`.
  - **Giao diện & Quy trình Admin (`src/admin/MailWriter.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/ProductsAdmin.jsx`, `src/admin/Dashboard.jsx`, `src/admin/AdminApp.jsx`, `src/admin/TodayTasks.jsx`, `src/admin/EmailExport.jsx`)**:
    - Đồng bộ đủ 18 biến đơn hàng (`ORDER_TOKENS`) và hiển thị danh sách nhiều sản phẩm trong khung Xem trước thư thực tế của `MailWriter.jsx`.
    - Thêm nút sao chép 1 chạm cho **Mã đơn**, **Số điện thoại** và **Địa chỉ giao hàng** trong modal Chi tiết đơn hàng Admin.
    - Chuyển ảnh bảng sản phẩm trong `ProductsAdmin.jsx` sang thumbnail CDN (`cdnSrc(p.image, THUMB)`) kèm `loading="lazy" decoding="async"`.
    - Nâng cấp thẻ thống kê trên `Dashboard.jsx` hiển thị số liệu vận hành (`Sản phẩm`, `Đơn chờ xác nhận`, `Đang xử lý & giao`, `Đơn hoàn tất`) có thể bấm để mở thẳng mục tương ứng; mặc định chọn sẵn `Email đã đăng ký` ở `EmailExport.jsx`.
  - **Kiểm thử (`tests/order-flow-and-stock.test.js`)**:
    - Thêm 3 unit test mới cho tìm đơn theo biến thể SĐT & tên không dấu, cảnh báo tồn kho có tính `reserved`, và liên kết nhanh Chat AI.
- **File / khu vực liên quan**: `server/orders.js`, `server/inventory.js`, `server/order-tracking.js`, `server/chat-knowledge.js`, `server/unsubscribe.js`, `src/components/CartSelectionDialog.jsx`, `src/components/ConsultationDialog.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderTracking.jsx`, `src/components/ProductDetail.jsx`, `src/components/ShopCart.jsx`, `src/components/Extras.jsx`, `src/styles/shop-cart.css`, `src/styles/storefront-polish.css`, `src/admin/MailWriter.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/ProductsAdmin.jsx`, `src/admin/Dashboard.jsx`, `src/admin/AdminApp.jsx`, `src/admin/TodayTasks.jsx`, `src/admin/EmailExport.jsx`, `tests/order-flow-and-stock.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **261/261** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`140.2 kB` gzip).
  - Playwright (`width-390`): **25/25** test đạt trên `qa/cart.spec.js`, `qa/cart-toggle.spec.js`, `qa/cart-settings.spec.js`, `qa/form-builder.spec.js`, `qa/shopping.spec.js`, `qa/tracking-layout.spec.js`, `qa/admin-appearance.spec.js`, `qa/audit-resilience.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có; truy vấn tra cứu SĐT có fallback an toàn nếu chưa có composite index.

## 20/11/2026 — Đồng bộ hiệu ứng mở và đóng Giỏ hàng theo đúng hiệu ứng nút Chat AI

- **Lý do**: Chủ website yêu cầu đồng bộ hiệu ứng khi mở và đóng giỏ hàng giống hệt hiệu ứng mở và đóng của nút Chat AI để trải nghiệm mượt mà, dứt khoát và đồng nhất trên toàn trang.
- **Thay đổi chính**:
  - **Hiệu ứng mở/đóng Giỏ hàng (`src/lib/popup-motion.js`, `src/components/ModalDialog.jsx`, `src/components/ShopCart.jsx`, `src/components/CartSelectionDialog.jsx`)**:
    - Thay hiệu ứng lò xo nảy chậm (650ms) bằng chuyển động phóng mở dứt khoát từ đúng vị trí và tỉ lệ nút giỏ hàng (`sx`/`sy` trong khoảng `0.05–0.4`, `opacity: 0 → 1`) với đường cong `cubic-bezier(.16, 1, .3, 1)` và thời gian mặc định `420ms` (`200–700ms`), giống hệt `useChatEntrance.js` của Chat AI.
    - Hiệu ứng đóng thu gọn mượt ngược về nút giỏ hàng với thời gian bằng `0.65×` thời gian mở (`120–380ms`) và đường cong đối xứng tương đương `cubic-bezier(.4, 0, .7, .4)` của `animateChatExit`, tái sử dụng animation sẵn có (`playbackRate = -1`) để tránh xung đột WebKit.
  - **Tùy chỉnh trong Visual Builder (`src/admin/builder/CartSettings.jsx`, `src/admin/builder/FormBuilderPanels.jsx`)**:
    - Cập nhật nhãn công tắc thành `Mở giỏ hàng từ nút giỏ hàng` và giới hạn ô `Thời gian mở giỏ (ms)` về `200–700ms` (mặc định `420ms`) đồng bộ với cài đặt mở form Chat AI.
- **File / khu vực liên quan**: `src/lib/popup-motion.js`, `src/components/ModalDialog.jsx`, `src/components/ShopCart.jsx`, `src/components/CartSelectionDialog.jsx`, `src/admin/builder/CartSettings.jsx`, `src/admin/builder/FormBuilderPanels.jsx`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **258/258** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`140.1 kB` gzip).
  - Playwright (`width-390`): **15/15** test đạt trên `qa/cart-toggle.spec.js`, `qa/cart.spec.js`, `qa/cart-settings.spec.js`, `qa/form-builder.spec.js`, `qa/button-press.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có.

## 20/11/2026 — Đồng bộ giao diện Giỏ hàng, Tra cứu đơn, Chính sách, Admin và tối ưu hiệu năng hiển thị

- **Lý do**: Rà soát toàn diện website khách hàng và trang quản trị phát hiện một số điểm chưa đồng bộ về thẩm mỹ với hệ giao diện tối giản cao cấp mới, thao tác admin còn rời rạc ở Chat AI và Email, cùng 3 điểm nghẽn hiệu năng ở thẻ sản phẩm và hook tải danh mục.
- **Thay đổi chính**:
  - **Đồng bộ giao diện Storefront (`src/components/ShopCart.jsx`, `src/components/CartFormPreview.jsx`, `src/styles/shop-cart.css`, `src/components/OrderTrackingDetails.jsx`, `src/components/PolicyPage.jsx`, `src/styles/order-tracking.css`)**:
    - Bỏ lệnh ép cứng `if (copy.order === 'Đặt sản phẩm này')` trong `ShopCart` và `CartFormPreview` để tôn trọng 100% nhãn nút do Admin chỉnh.
    - Nâng cấp khung Giỏ hàng (`shop-cart.css`) sang nền trắng tinh khiết, viền mảnh `#ece4e8`, đổ bóng sâu, thẻ `.cart-summary-card` đóng khung rõ ràng, số tiền `tabular-nums`, và hiển thị **thành tiền theo số lượng** kèm chú thích đơn giá khi `SL > 1` (vẫn giữ nguyên toàn bộ biến `--cart-*` của Visual Builder).
    - Nâng cấp Tra cứu đơn hàng (`OrderTrackingDetails.jsx`) thêm **nút Sao chép 1 chạm** cạnh mã đơn hàng và **vòng tròn đánh số bước `1–4`** trên thanh tiến trình.
    - Chuyển trang Chính sách (`PolicyPage.jsx`) từ inline style sang hệ thẻ chuẩn (`.policy-page`, `.policy-header`, `.policy-card`, `.policy-contact-card`) đồng bộ với trang Tra cứu đơn.
  - **Đồng bộ giao diện & thao tác Admin (`src/admin/ChatSettings.jsx`, `src/admin/AdminApp.jsx`, `src/admin/NewsletterAdmin.jsx`)**:
    - Chuyển `ChatSettings.jsx` sang chỉ render đúng tab đang mở thay vì mount cả 5 tab ẩn trong DOM, đồng thời đổi khung xem trước font chữ sang `.admin-detail-box` đồng bộ theme phẳng.
    - Thêm nút **Xuất Excel / CSV** ngay trên thanh công cụ tab **Người đăng ký** trong `NewsletterAdmin.jsx` để chuyển thẳng sang màn hình xuất file.
  - **Tối ưu hiệu năng Web & Visual Builder (`src/components/Collection.jsx`, `src/components/ProductCard.jsx`, `src/hooks/useProducts.js`)**:
    - Loại bỏ hook `useHomeContent()` riêng lẻ trong từng thẻ `ProductCard`, truyền cấu hình giỏ hàng đã `useMemo` từ `Collection.jsx` và bọc `React.memo(ProductCard)` để tránh 30–40 thẻ render lại đồng loạt khi cuộn hoặc chỉnh trong Visual Builder.
    - Throttle hiệu ứng nghiêng 3D (`handleMove`) trên `ProductCard` bằng `requestAnimationFrame` và cache `getBoundingClientRect()` khi `onMouseEnter` để loại bỏ forced layout reflow.
    - Bổ sung bộ nhớ đệm snapshot 30 giây ở mức module trong `useProducts.js` để các component mount sau (như Giỏ hàng, chuyển trang) hiển thị danh sách sản phẩm tức thì không nháy trạng thái tải lại (vẫn xóa cache khi bấm thử lại).
- **File / khu vực liên quan**: `src/components/ShopCart.jsx`, `src/components/CartFormPreview.jsx`, `src/styles/shop-cart.css`, `src/components/OrderTrackingDetails.jsx`, `src/components/PolicyPage.jsx`, `src/styles/order-tracking.css`, `src/admin/ChatSettings.jsx`, `src/admin/AdminApp.jsx`, `src/admin/NewsletterAdmin.jsx`, `src/components/Collection.jsx`, `src/components/ProductCard.jsx`, `src/hooks/useProducts.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **258/258** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt (`140.2 kB` gzip).
  - Playwright (`width-390`): **23/23** test đạt trên `qa/cart.spec.js`, `qa/cart-settings.spec.js`, `qa/form-builder.spec.js`, `qa/tracking-layout.spec.js`, `qa/shopping.spec.js`, `qa/admin-appearance.spec.js`, `qa/audit-resilience.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có.

## 20/11/2026 — Sửa 5 điểm Backend Admin về tồn kho đa sản phẩm, biến mẫu mail, gửi thử và truy vấn lọc đơn

- **Lý do**: Rà soát chuyên sâu backend quản trị phát hiện 5 điểm bất cập trong tính toán `reserved` cho đơn nhiều sản phẩm, đồng bộ `reserved` khi nhập tồn kho lần đầu, nhật ký trừ kho đa sản phẩm, biến mẫu email đơn hàng (`{{trackingUrl}}`, `{{total}}`), dữ liệu mẫu khi gửi thử email, sắp xếp lọc đơn theo trạng thái và tối ưu truy vấn Kiểm Hàng.
- **Thay đổi chính**:
  - **Tồn kho & hàng chờ đa sản phẩm (`server/inventory.js`, `src/admin/InventoryAdmin.jsx`)**:
    - Sửa fallback tính `reserved` (`countWaitingForProduct`) để cộng đúng số lượng của từng sản phẩm trong cả đơn nhiều món (`order.items`) thay vì cộng tổng số lượng cả giỏ.
    - Đồng bộ và lưu luôn `reserved` hiện tại ngay khi Admin nhập tồn kho lần đầu qua `POST /api/inventory`.
    - Gắn tổng `quantity` đã trừ kho vào `inventory` của đơn nhiều sản phẩm để `recordOrderActivity` ghi nhật ký đầy đủ.
    - Trả `reserved` đã đồng bộ trong `GET /api/inventory` và tối ưu `InventoryAdmin.jsx` dùng trực tiếp `reserved` (chỉ fallback quét `?pending=1` khi còn sản phẩm cũ chưa đồng bộ).
  - **Biến mẫu email & Gửi thử (`server/order-mail.js`, `server/newsletter-admin.js`, `src/admin/MailWriter.jsx`)**:
    - Bổ sung `{{trackingUrl}}` (link `/tra-cuu-don-hang`) và alias `{{total}}` vào `ORDER_TOKENS`, `renderOrderMessage`, cùng chip chèn nhanh & xem trước trong `MailWriter`.
    - Bổ sung đủ `priceText`, `unitPrice`, `subtotal`, `shippingFee`, `totalAmount`, `createdAt` cho đơn giả lập khi bấm **Gửi thử** (`sendTest`).
  - **Sắp xếp lọc đơn theo trạng thái (`server/orders.js`)**:
    - Ưu tiên `orders.where("status", "==", rawStatus).orderBy("createdAt", "desc").limit(100)` và tự động fallback an toàn nếu Firestore chưa tạo composite index.
  - **Kiểm thử (`tests/order-flow-and-stock.test.js`)**:
    - Thêm unit test xác minh fallback `reserved` đa sản phẩm, đồng bộ `reserved` khi nhập tồn lần đầu, `GET /api/inventory` trả `reserved`, tổng `quantity` khi trừ kho đơn nhiều món và biến `{{trackingUrl}}`/`{{total}}`.
- **File / khu vực liên quan**: `server/inventory.js`, `server/order-mail.js`, `server/newsletter-admin.js`, `server/orders.js`, `src/admin/InventoryAdmin.jsx`, `src/admin/MailWriter.jsx`, `tests/order-flow-and-stock.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **258/258** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-390`): **11/11** test đạt trên `qa/audit-resilience.spec.js` và `qa/admin-appearance.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema hay rules; `POST /api/inventory` tự khởi tạo trường `reserved` cho sản phẩm chưa có, còn truy vấn `status` có fallback an toàn nếu chưa tạo composite index.

## 20/11/2026 — Thiết kế lại giao diện Form đặt hàng và Form đã nhận đơn theo chuẩn thương mại điện tử tối giản cao cấp

- **Lý do**: Chủ website yêu cầu thiết kế lại Form đặt hàng và Form đã nhận hàng cho sang trọng, hiện đại và dễ thao tác giống các thương hiệu thương mại điện tử lớn (chuẩn Shopify Checkout / Glossier / Stripe), đồng thời vẫn tương thích hoàn toàn với toàn bộ tùy chỉnh trong Visual Builder.
- **Thay đổi chính**:
  - **Form đặt hàng (`src/components/OrderFormFields.jsx`, `src/styles/checkout.css`)**:
    - Chuyển nền hộp thoại sang trắng tinh khiết (`#ffffff`), thẻ phụ sáng nhẹ (`#faf8f9`), viền mảnh (`#ece4e8`), đổ bóng mềm sâu và chữ số căn cột (`tabular-nums`).
    - Bổ sung **ảnh thumbnail sản phẩm** (54×54 bo góc kèm badge số lượng) ở thẻ tóm tắt đầu form.
    - Đánh số bước trực quan **`1` Thông tin người nhận → `2` Địa chỉ giao hàng → `3` Phương thức thanh toán**.
    - Thay dropdown phương thức thanh toán khô cứng bằng **thẻ chọn trực quan (Payment Option Cards)** hiển thị ngay mô tả ngắn của COD / Chuyển khoản và highlight khi chọn.
    - Bổ sung dòng **Tạm tính** rõ ràng trước Phí giao hàng và Tổng cộng trong khối Tóm tắt thanh toán.
  - **Form đã nhận đơn hàng (`src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/styles/checkout.css`)**:
    - Thêm **biểu tượng dấu tích thành công (checkmark badge)** ở banner xác nhận, kèm **nút Sao chép 1 chạm** ngay cạnh Mã đơn hàng, Số tài khoản và Nội dung chuyển khoản.
    - Thêm **thanh tiến trình 3 bước** (`1. Đã tiếp nhận` → `2. Xác nhận & đóng gói` → `3. Giao tận nơi`) trong khối Bước tiếp theo.
    - Nâng cấp nút **Lưu ảnh đơn hàng** thành nút có icon kèm nhãn `"Tải ảnh"` rõ ràng, cân đối với nút xác nhận nhanh Zalo/Facebook.
  - **Bộ chỉnh format chữ đầy đủ cho mọi thành phần trong Visual Builder (`src/admin/builder/FormBuilderPanels.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/styles/checkout.css`)**:
    - Bổ sung đầy đủ `StyleTypographyBlock` (font, cỡ chữ desktop/mobile, màu chữ, độ đậm, chữ hoa/thường, giãn chữ/giãn dòng, căn lề, in nghiêng, lề/đệm) cho toàn bộ các phần tử trước đây còn thiếu ở **Form đặt hàng** (`ofSelection`, `ofPaymentFields`, `ofSummary`, `ofConsent`) và **Form đã đặt hàng** (nhãn mã đơn `osCode`, `osSave`, nội dung `osDetails`, nội dung `osRecipient`, `osBank`, `osNextSteps`, `osEmailNote`, và kiểu chữ chung `receiptTextStyle`).
    - Kết nối trực tiếp mọi cấu hình kiểu chữ mới vào trang thật và bản xem trước Visual Builder, đảm bảo kế thừa sạch vào các thành phần con.
- **File / khu vực liên quan**: `src/admin/builder/FormBuilderPanels.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/styles/checkout.css`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **256/256** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright: **24/24** test đạt trên `qa/shopping.spec.js`, `qa/editor-checkout.spec.js`, `qa/form-builder.spec.js`, `qa/order-receipt.spec.js`, `qa/admin-appearance.spec.js` (`width-390`) + **5/5** test đạt trên `qa/shopping.spec.js` và `qa/form-builder.spec.js` (`width-1440`), và xác nhận lại **17/17** test sau khi bổ sung bộ chỉnh format chữ.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có.

## 20/11/2026 — Chuẩn hóa quy trình tìm/lọc/sắp xếp đơn từ server, thao tác nhanh trạng thái, xem trước biến email và bỏ quét toàn bộ đơn

- **Lý do**: Rà soát thao tác vận hành thực tế theo chuẩn quản trị thương mại điện tử phát hiện các điểm chưa hợp lý: tìm/lọc trạng thái đơn chỉ chạy trên 50 đơn mới nhất ở trình duyệt, ô Sắp xếp bị giấu trong Bộ lọc nâng cao, bảng đơn thiếu cột Sản phẩm, chưa có nút hành động 1 chạm cho bước xử lý tiếp theo, chưa có xem trước thư sau khi ghép biến `{{...}}`, hai tab Khách hàng & Lịch sử email tự động quét toàn bộ đơn khi mở, và còn tab trung gian dư thừa.
- **Thay đổi chính**:
  - **Tìm đơn & lọc trạng thái trực tiếp trên server (`server/orders.js`, `src/admin/OrdersAdmin.jsx`, `tests/order-flow-and-stock.test.js`)**:
    - Bổ sung `GET /api/admin-orders?q=...` (tra trực tiếp theo mã đơn `OW_...`, SĐT, email hoặc ID đơn bằng single-field index mặc định của Firestore) và `GET /api/admin-orders?status=...` (lấy đúng các đơn theo trạng thái đang chọn kể cả đơn cũ nằm ngoài 50 đơn mới nhất).
    - Đưa dropdown **Sắp xếp đơn** và **Thanh toán** lên thẳng thanh công cụ chính cạnh ô tìm kiếm; bấm `Enter` hoặc nút **Tìm trên máy chủ** để tra thẳng trong toàn bộ database.
  - **Bảng đơn rõ sản phẩm & Nút thao tác nhanh 1 chạm (`src/admin/OrdersAdmin.jsx`)**:
    - Bổ sung cột **Sản phẩm** (tên + dung tích + số lượng) ngay trên bảng danh sách đơn, bỏ 2 nút `Gọi` / `Sao chép số` lặp lại trên từng dòng (giữ link `tel:` gọn sạch và nút gọi trong chi tiết đơn).
    - Thêm thanh nút hành động bước tiếp theo nổi bật ngay trong Chi tiết đơn (`Xác nhận đơn`, `Giao ngay` / `Bắt đầu giao`, `Hoàn tất đơn`, `Hủy đơn`).
  - **Xem trước thư thực tế trong `MailWriter` (`src/admin/MailWriter.jsx`)**:
    - Bổ sung khối **Xem trước thư thực tế** tự động thay các biến `{{customerName}}`, `{{orderCode}}`, `{{productName}}`, `{{quantity}}`, `{{subtotal}}`, `{{shippingFee}}`, `{{totalAmount}}`, `{{paymentMethod}}`, `{{address}}`, `{{phone}}` bằng dữ liệu của đơn đang chọn (hoặc dữ liệu minh họa khi sửa mẫu tự động).
  - **Chặn quét vô hạn toàn bộ đơn & Dọn tab dư thừa (`src/admin/OrderMailHistory.jsx`, `src/admin/OrderCustomers.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/ProductsAdmin.jsx`)**:
    - Thay vòng lặp tự quét toàn bộ database ở `OrderMailHistory` và `OrderCustomers` bằng tải 1 trang gần nhất (20/50 đơn) kèm nút **Tải thêm từ đơn cũ hơn** khi cần.
    - Bỏ 2 tab trung gian chỉ chứa nút chuyển trang: `Chữ trang tra cứu` trong Đơn hàng và `Kênh mua hàng` trong Sản phẩm -> Thiết lập dùng chung (cả 2 đã có sẵn ở mục `Cửa hàng`).
- **File / khu vực liên quan**: `server/orders.js`, `src/admin/OrdersAdmin.jsx`, `src/admin/MailWriter.jsx`, `src/admin/OrderMailHistory.jsx`, `src/admin/OrderCustomers.jsx`, `src/admin/ProductsAdmin.jsx`, `tests/order-flow-and-stock.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **256/256** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright: **14/14** test `qa/admin-appearance.spec.js` đạt trên cả mobile (`390px`) và desktop (`1440px`), cùng **5/5** test `qa/admin-confirm.spec.js` và `qa/admin-navigation.spec.js` đạt.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay index; các truy vấn `?q=` và `?status=` đều dùng single-field index mặc định của Firestore.

## 20/11/2026 — Đại tu giao diện Admin theo phong cách vận hành phẳng, gọn quy trình và giảm lag

- **Lý do**: Chủ website phản ánh giao diện quản trị đang bị lag, có các hiệu ứng/bóng đổ không cần thiết, đồng thời một số màn hình chính (Đơn hàng, Gửi mail, Sản phẩm, Visual Builder) có bố cục dàn trải hoặc tải ẩn quá nhiều DOM/dữ liệu gây chậm khi thao tác.
- **Thay đổi chính**:
  - **Hệ thống giao diện vận hành phẳng, không hiệu ứng thừa (`src/styles/admin-theme.css`, `src/styles/admin.css`, `src/admin/builder/VisualBuilder.css`)**:
    - Chuyển nền làm việc sang tông xám-trắng trung tính (`#f8fafc` / `#ffffff`), viền `1px` sắc nét (`#e2e8f0`), giữ điểm nhấn hồng ORORA (`#b8446d` / `#9a3358`) cho nút hành động chính và nút nguy hiểm.
    - Loại bỏ toàn bộ `box-shadow` trang trí và `transition` thừa trên sidebar, thẻ, bảng, nút, ô nhập liệu và khung chrome của Visual Builder (không ảnh hưởng bản xem trước website).
    - Bổ sung bố cục lưới vận hành 2 cột chuẩn responsive cho chi tiết đơn hàng và khung soạn thư.
  - **Đơn hàng 1 màn hình, lọc gọn (`src/admin/OrdersAdmin.jsx`)**:
    - Chỉ render đúng tab đang mở (bỏ cơ chế giữ DOM ẩn của các tab khác), thu gọn thanh tìm kiếm/lọc về 1 hàng (`.admin-order-filter-bar`), phân trang 25 đơn/trang và bỏ vòng lặp `"Tải toàn bộ đơn để lọc"` gây treo máy.
    - Chuyển hộp thoại **Chi tiết đơn hàng** từ 3 tab rải rác sang bố cục **1 màn hình 2 cột**: cột trái gồm sản phẩm, tổng tiền, trạng thái đơn, thanh toán và hoàn kho; cột phải gồm thông tin người nhận, trạng thái/lịch sử/gửi lại email xác nhận; bên dưới là mục **Nhật ký xử lý** dạng gập gọn (`<details>`).
  - **Gửi Email 2 cột, chèn biến nhanh, giảm tải nền (`src/admin/NewsletterAdmin.jsx`, `src/admin/MailWriter.jsx`)**:
    - Chỉ render đúng tab đang mở trong `NewsletterAdmin`, bỏ cơ chế tự gọi `loadRemainingContacts()` khi bấm vào ô tìm kiếm (thay bằng nút tải rõ ràng khi cần).
    - Tái thiết kế `MailWriter` theo bố cục 2 cột (trái: soạn tiêu đề & nội dung kèm các nút chip bấm chèn nhanh biến `{{customerName}}`, `{{orderCode}}`, `{{productName}}`, `{{total}}`, `{{paymentMethod}}`, `{{trackingUrl}}`; phải: chọn đối tượng/đơn hàng và hành động gửi).
    - Chỉ bật chu kỳ tự làm mới 30 giây khi đơn hàng đang chọn thực sự ở trạng thái `"sending"`.
  - **Sản phẩm gọn nhẹ (`src/admin/ProductsAdmin.jsx`)**:
    - Chỉ render đúng màn hình và tab đang mở (danh sách sản phẩm, từng nhóm trong Thiết lập dùng chung, từng mục trong form chỉnh sản phẩm) thay vì giữ toàn bộ cây DOM ẩn và các listener nền cùng lúc.
  - **Trang Chính sách `/chinh-sach` & Header hủy đăng ký Microsoft Graph (`src/components/PolicyPage.jsx`, `src/App.jsx`, `src/lib/seo.js`, `src/components/Footer.jsx`, `src/components/OrderFormFields.jsx`, `server/microsoft-mail.js`)**:
    - Tạo trang `/chinh-sach` hiển thị Điều khoản sử dụng, Chính sách đổi trả, Chính sách bảo mật và thông tin cam kết/liên hệ đọc từ cấu hình quản trị; gắn link trực tiếp ở Footer và ngay tại ô tích đồng ý trong Form đặt hàng.
    - Bổ sung header `List-Unsubscribe` và `List-Unsubscribe-Post: List-Unsubscribe=One-Click` cho kênh gửi mail Microsoft Graph (`server/microsoft-mail.js`) đồng bộ với kênh SMTP.
- **File / khu vực liên quan**: `src/styles/admin-theme.css`, `src/styles/admin.css`, `src/admin/builder/VisualBuilder.css`, `src/admin/OrdersAdmin.jsx`, `src/admin/MailWriter.jsx`, `src/admin/NewsletterAdmin.jsx`, `src/admin/ProductsAdmin.jsx`, `src/components/PolicyPage.jsx`, `src/App.jsx`, `src/lib/seo.js`, `src/components/Footer.jsx`, `src/components/OrderFormFields.jsx`, `server/microsoft-mail.js`, `qa/audit-resilience.spec.js`, `qa/mobile-polish.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **255/255** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright: **127/127** test toàn bộ bộ kiểm thử `qa/*.spec.js` (`width-390`) đạt (2 test desktop-only bỏ qua theo cấu hình viewport), và **14/14** test `qa/admin-appearance.spec.js` đạt trên cả mobile (`390px`) và desktop (`1440px`).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có.

## 20/11/2026 — Chuẩn hóa 3 form trong Visual Builder: bấm đúng từng phần tử để chỉnh và chỉ chỉnh UI với mục dữ liệu tự động

- **Lý do**: Chủ website yêu cầu 3 mục **Form giỏ hàng**, **Form đặt hàng** và **Form đã đặt hàng** trong Visual Builder phải có trải nghiệm chỉnh sửa giống hệt các mục khác: bấm trúng từng thành phần nào thì mở đúng bộ chỉnh của thành phần đó, có tab **Thiết lập mục** riêng cho khung/màu chung, và những mục hiển thị dữ liệu tự động từ sản phẩm/đơn hàng thì chỉ cho chỉnh UI chứ không hiện ô sửa nội dung.
- **Thay đổi chính**:
  - **Bấm chọn từng phần tử riêng biệt trên bản xem trước (`src/components/CartFormPreview.jsx`, `src/components/OrderFormPreview.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/admin/builder/element-options.js`, `src/admin/builder/home-model.js`)**:
    - **Form giỏ hàng** (12 phần tử độc lập): Tiêu đề, Nút đóng ×, Ảnh sản phẩm, Tên sản phẩm, Dung tích/phân loại, Giá sản phẩm, Khung chọn số lượng, Nút Xóa, Nút Chi tiết, Chú thích phí giao hàng, Dòng Tạm tính, Nút Mua ngay.
    - **Form đặt hàng** (15 phần tử độc lập): Tiêu đề hộp thoại, Nút đóng ×, Tên sản phẩm, Lời hướng dẫn, Nhãn giá, Dung tích & số lượng, Tiêu đề Người nhận, Các ô Người nhận, Tiêu đề Địa chỉ, Các ô Địa chỉ, Tiêu đề Thanh toán, Phương thức thanh toán & Ghi chú, Khối Tóm tắt, Ô tích đồng ý, Nút Đặt hàng ngay.
    - **Form đã đặt hàng** (13 phần tử độc lập): Tiêu đề hộp thoại, Nút đóng ×, Mã đơn hàng, Lời cảm ơn/Lời nhắn, Xác nhận nhanh (Zalo/FB), Lưu ảnh đơn hàng, Chi tiết đơn hàng, Thông tin người nhận, Thông tin chuyển khoản, Bước tiếp theo, Ghi chú email, Link Tra cứu đơn, Nút Đóng.
  - **Chỉ chỉnh UI với thành phần dữ liệu tự động + Tab Thiết lập mục (`src/admin/builder/FormBuilderPanels.jsx`, `src/admin/builder/StylePanels.jsx`, `src/lib/checkout-presentation.js`, `src/styles/checkout.css`)**:
    - Các thành phần dữ liệu tự động (Ảnh, Tên sản phẩm, Dung tích, Giá, Khung số lượng, Nút đóng ×, Thông tin người nhận) chỉ hiển thị bộ chỉnh giao diện (kiểu chữ, màu, viền, bo góc) kèm ghi chú nguồn dữ liệu giống mục Sản phẩm và Chi tiết SP.
    - Chuyển các thiết lập khung hộp thoại, màu nền/viền tổng thể, hiệu ứng và nút giỏ hàng navbar vào tab **Thiết lập mục** riêng của `Inspector`.
  - **Kiểm thử (`qa/form-builder.spec.js`)**:
    - Bổ sung bước kiểm tra bấm trực tiếp vào từng phần tử dữ liệu tự động (`cartItemName`, `ofPrice`) xác nhận chỉ mở chỉnh UI và hiện ghi chú nguồn dữ liệu.
- **File / khu vực liên quan**: `src/components/CartFormPreview.jsx`, `src/components/OrderFormPreview.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/admin/builder/FormBuilderPanels.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/element-options.js`, `src/admin/builder/home-model.js`, `src/lib/checkout-presentation.js`, `src/styles/checkout.css`, `qa/form-builder.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **255/255** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-390`): **15/15** test đạt trên `qa/form-builder.spec.js`, `qa/cart-settings.spec.js`, `qa/visual-builder-focus.spec.js` và `qa/editor-checkout.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có.

## 20/11/2026 — Hoàn thiện máy trạng thái đơn, kiểm kho nhanh, nội dung đặt hàng/chuyển khoản và tối ưu giảm lag trang Admin

- **Lý do**: Khắc phục các điểm tồn đọng theo rà soát: gom máy trạng thái đơn về một nguồn dùng chung, cho phép `new → shipping` và `completed → cancelled` (kèm hoàn kho cho đơn hoàn tất bị trả hàng), chặn tuyệt đối đổi `paymentStatus` trên đơn đã hủy, thay vòng lặp 10 trang kho ở `TodayTasks` bằng endpoint `?lowStock=1`, bổ sung hướng dẫn chuyển khoản / Bước tiếp theo / biên nhận / email xác nhận, dọn các khóa chết trong `CHECKOUT_COPY`, và tách chunk lazy-load + tách tab Thống kê để giảm lag trang Admin.
- **Thay đổi chính**:
  - **Máy trạng thái đơn & Kiểm kho (`src/lib/order-flow.js`, `server/orders.js`, `src/admin/OrdersAdmin.jsx`, `server/inventory.js`, `src/admin/TodayTasks.jsx`)**:
    - Tạo file dùng chung `src/lib/order-flow.js` chứa `ORDER_STATUSES` và `NEXT_ORDER_STATUSES` cho cả API và giao diện quản trị.
    - Cho phép chuyển thẳng `new → shipping` và `completed → cancelled` (mở khóa thao tác hủy đơn hoàn tất trong `OrdersAdmin` và hỗ trợ hoàn kho kể cả đơn nhiều sản phẩm qua `restockOrder`).
    - Chặn mọi yêu cầu thay đổi `paymentStatus` khi đơn đã ở trạng thái `cancelled` (kể cả khi gửi kèm `status: "cancelled"`).
    - Bổ sung chế độ `GET /api/inventory?lowStock=1` trả danh sách sản phẩm sắp hết hàng trong 1 truy vấn duy nhất thay vì quét tuần tự tới 10 trang trong `TodayTasks`.
  - **Nội dung Form đặt hàng, Giỏ hàng, Trang đã đặt, Ảnh biên nhận & Email (`src/lib/checkout-presentation.js`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/lib/order-receipt.js`, `server/order-mail.js`, `src/components/ShopCart.jsx`, `src/lib/cart-copy.js`, `src/admin/builder/CheckoutSettings.jsx`, `src/admin/builder/FormBuilderPanels.jsx`)**:
    - Bỏ 4 khóa không sử dụng (`productHeading`, `confirmHeading`, `continueLabel`, `backLabel`) khỏi `CHECKOUT_COPY` và `CheckoutSettings`.
    - Hiển thị rõ `"Chọn tỉnh và phường để tính phí"` và `"Tạm tính (chưa gồm phí giao)"` trước khi có phí ship; đổi ghi chú thanh toán linh hoạt theo phương thức đang chọn (COD / Chuyển khoản).
    - Mở sẵn khung **Thông tin người nhận**, bổ sung khối **Thông tin chuyển khoản** (ngân hàng, số tài khoản, chủ tài khoản, mẫu nội dung `{{code}}`) và khối **Bước tiếp theo** trên trang Đã đặt hàng (tất cả chỉnh được trong Visual Builder).
    - Thêm nút **Xem sản phẩm** khi giỏ hàng trống; bổ sung **Ngày đặt**, **Tình trạng thanh toán** và **Liên hệ ORORA** vào ảnh biên nhận PNG; bổ sung mục **Bước tiếp theo** và email hỗ trợ vào mẫu mail xác nhận mặc định.
  - **Tối ưu hiệu năng trang Admin (`src/admin/AdminApp.jsx`, `src/admin/Dashboard.jsx`)**:
    - Tách toàn bộ các mục quản trị bằng `React.lazy` + `Suspense` (giảm chunk khởi đầu `AdminApp` từ ~483 KB xuống ~15 KB).
    - Chỉ render đúng tab đang mở kèm cảnh báo giữ bản nháp khi chuyển tab, tránh giữ toàn bộ DOM ẩn và render lại mỗi 60 giây khi polling thông báo.
    - Tách `AnalyticsDashboard` sang tab **Thống kê** riêng để màn hình **Tổng quan** chỉ tải `TodayTasks` và số liệu nhẹ, không quét 10.000 đơn ngay khi mới vào.
  - **Kiểm thử (`tests/order-flow-and-stock.test.js`, `tests/inventory.test.js`, `qa/admin-navigation.spec.js`)**:
    - Bổ sung unit test cho toàn bộ vòng đời `reserved`, `new → shipping`, `completed → cancelled → restockOrder`, chặn `paymentStatus` trên đơn đã hủy, `?lowStock=1` và `receiptLines`.
- **File / khu vực liên quan**: `src/lib/order-flow.js`, `server/orders.js`, `server/inventory.js`, `server/order-mail.js`, `src/admin/OrdersAdmin.jsx`, `src/admin/TodayTasks.jsx`, `src/admin/Dashboard.jsx`, `src/admin/AdminApp.jsx`, `src/admin/builder/CheckoutSettings.jsx`, `src/admin/builder/FormBuilderPanels.jsx`, `src/lib/checkout-presentation.js`, `src/lib/cart-copy.js`, `src/lib/order-receipt.js`, `src/components/OrderFormFields.jsx`, `src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/components/ShopCart.jsx`, `tests/order-flow-and-stock.test.js`, `tests/inventory.test.js`, `qa/admin-navigation.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **255/255** unit test đạt, `eslint .` 0 lỗi, `vite build` (chunk `AdminApp` còn `15.22 kB`) và ngân sách bundle đạt.
  - Playwright (`width-390`): **15/15** test đạt trên `qa/admin-navigation.spec.js`, `qa/form-builder.spec.js`, `qa/cart.spec.js`, `qa/shopping.spec.js` và `qa/editor-checkout.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có; truy vấn `?lowStock=1` dùng single-field index mặc định trên `inventory.quantity`.

## 19/11/2026 — Thêm 3 mục riêng trong Visual Builder cho Form giỏ hàng, Form đặt hàng và Form đã đặt hàng với bộ chỉnh toàn diện

- **Lý do**: Chủ website yêu cầu tách **Form giỏ hàng** và **Form đặt hàng** thành các mục riêng ngay trong danh sách của **Visual Builder** để xem trước trực tiếp và chỉnh sửa được đầy đủ mọi thành phần, đồng thời bổ sung thêm mục **Form đã đặt hàng** (màn hình xác nhận sau khi đặt đơn) để tiện chỉnh sửa và xem trước.
- **Thay đổi chính**:
  - **3 mục mới trong Visual Builder (`src/lib/page-sections.js`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/FormBuilderPanels.jsx`, `src/admin/builder/element-options.js`, `src/admin/builder/home-model.js`, `src/admin/builder/save-sections.js`, `src/admin/builder/builder-updaters.js`)**:
    - Thêm 3 mục **Form giỏ hàng** (`cartform`), **Form đặt hàng** (`orderform`) và **Form đã đặt hàng** (`ordersuccess`) vào thanh danh sách mục của Visual Builder (không gắn công tắc ẩn/hiện trang chủ và không ảnh hưởng nút khôi phục của mục khác).
    - Hỗ trợ bấm chọn trực tiếp từng vùng ngay trên khung xem trước (Desktop/Mobile) hoặc chọn từ danh sách thành phần và lưu đúng phần cấu hình đã thay đổi vào `navStyles.cart` và `productDetailStyles.purchaseOptions`.
  - **Form giỏ hàng (`src/components/CartFormPreview.jsx`, `src/components/ShopCart.jsx`, `src/lib/cart-presentation.js`, `src/styles/shop-cart.css`)**:
    - Bổ sung bản xem trước toàn bộ khung giỏ hàng kèm bộ chỉnh đầy đủ: tiêu đề & nút đóng, khung hộp thoại (rộng/bo góc/đệm/nền/viền/đường kẻ/màu nhấn), dòng sản phẩm (bo góc ảnh, kiểu chữ tên/dung tích/giá), khung số lượng, nút **Xóa**, nút **Chi tiết**, dòng phí giao hàng & **Tạm tính**, và nút **Mua ngay** (nội dung, màu, viền, bo góc, chiều cao, font, cỡ chữ máy tính/điện thoại, độ đậm, căn chữ). Áp dụng trực tiếp lên giỏ hàng thật.
  - **Form đặt hàng (`src/components/OrderFormPreview.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderForm.jsx`, `src/lib/checkout-presentation.js`, `src/styles/checkout.css`, `src/admin/builder/CheckoutSettings.jsx`, `src/components/ModalDialog.jsx`)**:
    - Bổ sung bản xem trước toàn bộ form đặt hàng trên canvas Visual Builder kèm bộ chỉnh đầy đủ: tiêu đề & nút đóng, khung form & thẻ mục (rộng/đệm/bo góc/nền/viền/màu nhấn), khối sản phẩm (lời hướng dẫn, nhãn dung tích/số lượng, khung & nhãn giá), toàn bộ nhãn và chữ gợi ý của **Thông tin người nhận**, **Địa chỉ giao hàng**, **Thanh toán & ghi chú**, kiểu ô nhập liệu, khối **Tóm tắt thanh toán & đồng ý**, và nút **Đặt hàng ngay** (chữ, màu nền/viền, bo góc, chiều cao, kiểu chữ bình thường & khi đang gửi). Áp dụng trực tiếp lên form đặt hàng thật.
  - **Form đã đặt hàng (`src/components/OrderSuccessView.jsx`, `src/components/OrderReceiptActions.jsx`, `src/components/OrderForm.jsx`, `src/lib/checkout-presentation.js`, `src/styles/checkout.css`)**:
    - Tách giao diện màn hình xác nhận sau khi đặt hàng thành component dùng chung `OrderSuccessContent` / `OrderSuccessPreview` cho cả trang thật và bản xem trước Visual Builder.
    - Cho chỉnh toàn bộ nội dung, màu sắc, khung viền, bo góc và kiểu chữ (font, cỡ chữ máy tính/điện thoại, màu, độ đậm, căn chữ) cho tiêu đề hộp thoại, khung mã đơn & lời cảm ơn, khối xác nhận nhanh (Zalo/Facebook) & lưu ảnh đơn, thẻ chi tiết đơn & thông tin người nhận, ghi chú email, link tra cứu đơn và nút Đóng.
  - **Kiểm thử (`tests/form-builder.test.js`, `qa/form-builder.spec.js`)**:
    - Bổ sung unit test cho cấu hình 3 mục mới và các hàm sinh style khung/nút/biên nhận, cùng kiểm thử Playwright xác minh xem trước trực tiếp, bấm chọn trên preview và lưu cấu hình cho cả 3 form.
- **File / khu vực liên quan**: `src/lib/page-sections.js`, `src/lib/cart-presentation.js`, `src/lib/checkout-presentation.js`, `src/components/ModalDialog.jsx`, `src/components/ShopCart.jsx`, `src/components/CartFormPreview.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderFormPreview.jsx`, `src/components/OrderReceiptActions.jsx`, `src/components/OrderSuccessView.jsx`, `src/styles/shop-cart.css`, `src/styles/checkout.css`, `src/admin/builder/FormBuilderPanels.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/CheckoutSettings.jsx`, `src/admin/builder/element-options.js`, `src/admin/builder/home-model.js`, `src/admin/builder/save-sections.js`, `src/admin/builder/builder-updaters.js`, `tests/form-builder.test.js`, `qa/form-builder.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **252/252** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-390`): **16/16** test đạt trên `qa/form-builder.spec.js`, `qa/cart-settings.spec.js`, `qa/visual-builder-focus.spec.js`, `qa/editor-checkout.spec.js` và `qa/cart.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu hiện có; các tùy chỉnh mới lưu bổ sung vào các trường cấu hình giao diện sẵn có (`navStyles.cart` và `productDetailStyles.purchaseOptions`) trên tài liệu cấu hình trang chủ.

## 19/11/2026 — Chuyển toàn bộ phần chỉnh Form giỏ hàng, Form Mua ngay và Form đặt hàng vào Visual Builder, bỏ ở mục Cửa hàng cũ

- **Lý do**: Chủ website yêu cầu gom phần chỉnh sửa **Form giỏ hàng**, **Form Mua ngay** và **Form đặt hàng** trực tiếp vào **Visual Builder** (mục **Trang chủ**) để xem trước và lưu chung thuận tiện hơn, đồng thời bỏ 2 tab cũ (**Giỏ hàng** và **Form đặt hàng**) khỏi mục **Cửa hàng**.
- **Thay đổi chính**:
  - **Visual Builder (`src/admin/builder/NavbarPanels.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/CartSettings.jsx`, `src/admin/builder/registry.js`, `src/admin/builder/element-options.js`)**:
    - Hiển thị trực tiếp trình chỉnh **Form giỏ hàng & nút giỏ hàng** ngay trong mục **Navbar** (khi chọn nút giỏ hàng hoặc mở thiết lập chung của Navbar) thay vì nút chuyển sang Cửa hàng.
    - Hiển thị trực tiếp trình chỉnh **Form Mua ngay & Form đặt hàng** ngay trong mục **Chi tiết sản phẩm** (khi chọn khung mua hàng hoặc mở thiết lập chung của Chi tiết sản phẩm) thay vì nút chuyển sang Cửa hàng.
    - Tách rõ tên nhãn chỉnh bo góc và chiều cao cho nút **Mua ngay** trong giỏ hàng để không trùng nhãn với nút giỏ hàng trên thanh điều hướng.
  - **Cửa hàng (`src/admin/builder/StoreWorkspace.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/HomeAdmin.jsx`, `src/admin/AdminApp.jsx`, `src/admin/StoreSettingsLink.jsx`, `src/admin/store-navigation.js`)**:
    - Gỡ bỏ hoàn toàn 2 tab cũ **Giỏ hàng** và **Form đặt hàng** khỏi mục **Cửa hàng**, chỉ giữ lại **Kênh mua và thanh toán** (mặc định) và **Tra cứu đơn**.
  - **Kiểm thử giao diện (`qa/cart-settings.spec.js`, `qa/editor-simplification.spec.js`, `qa/visual-builder-focus.spec.js`, `qa/admin-appearance.spec.js`)**:
    - Cập nhật kịch bản kiểm thử chỉnh trực tiếp Giỏ hàng, Form Mua ngay và Form đặt hàng trong Visual Builder và xác minh mục Cửa hàng chỉ còn 2 tab.
- **File / khu vực liên quan**: `src/admin/builder/NavbarPanels.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/StylePanels.jsx`, `src/admin/builder/CartSettings.jsx`, `src/admin/builder/StoreWorkspace.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/registry.js`, `src/admin/builder/element-options.js`, `src/admin/HomeAdmin.jsx`, `src/admin/AdminApp.jsx`, `src/admin/StoreSettingsLink.jsx`, `src/admin/store-navigation.js`, `qa/cart-settings.spec.js`, `qa/editor-simplification.spec.js`, `qa/visual-builder-focus.spec.js`, `qa/admin-appearance.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **248/248** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-390`): **25/25** test đạt trên `qa/cart-settings.spec.js`, `qa/editor-simplification.spec.js`, `qa/visual-builder-focus.spec.js`, `qa/editor-checkout.spec.js` và `qa/admin-appearance.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Bỏ bước chặn phân quyền ở giao diện quản trị để tài khoản đăng nhập vào xem được đầy đủ

- **Lý do**: Bước kiểm tra phân quyền chi tiết ở giao diện quản trị khiến các tài khoản admin đã đăng nhập bị chặn hoặc bị ẩn mất các mục quản lý. Chủ website yêu cầu chỉ cần đăng nhập đúng tài khoản quản trị là vào xem được đầy đủ tất cả các mục.
- **Thay đổi chính**:
  - **Giao diện quản trị (`src/admin/AdminApp.jsx`)**: Bỏ bước chặn theo phản hồi kiểm tra quyền và bỏ cơ chế ẩn từng mục menu ở giao diện; ngay khi đăng nhập Firebase Auth thành công sẽ mở thẳng trang quản trị với đầy đủ toàn bộ 10 mục và các tab con trong màn hình Đơn hàng.
  - **Kiểm thử giao diện (`qa/admin-navigation.spec.js`)**: Cập nhật bỏ bài kiểm tra màn hình chặn phân quyền không còn sử dụng.
- **File / khu vực liên quan**: `src/admin/AdminApp.jsx`, `qa/admin-navigation.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **248/248** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-320` và `width-390`): **2/2** test đạt trên `qa/admin-navigation.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Gộp đặt nhiều sản phẩm chung trong giỏ hàng, chỉnh giao diện nút Mua ngay trên máy tính và tối ưu mượt form đặt hàng

- **Lý do**: Trong giỏ hàng cần bỏ nút mua riêng trên từng dòng và chỉ giữ một nút **Mua ngay** chung ở chân giỏ để đặt nhiều sản phẩm trong cùng một đơn; trên màn hình máy tính, thanh giá kèm nút **Mua ngay** ở trang chi tiết sản phẩm bị kéo giãn rộng và lệch màu so với cột nút phía trên, đồng thời nút **Thêm vào giỏ** bị thiếu biểu tượng giỏ hàng; form đặt hàng có độ trễ khi cuộn và chọn địa chỉ.
- **Thay đổi chính**:
  - **Đặt chung nhiều sản phẩm trong giỏ hàng (Frontend & Backend)**:
    - Bỏ nút mua riêng trên từng dòng trong giỏ hàng (`src/components/ShopCart.jsx`, `src/styles/shop-cart.css`), giữ lại chỉnh số lượng, **Xóa** và **Chi tiết**; đặt một nút **Mua ngay** duy nhất ở chân giỏ để mở form đặt chung toàn bộ sản phẩm hợp lệ và còn hàng.
    - Mở rộng form đặt hàng, biên nhận, trang tra cứu đơn và trang quản trị đơn (`src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderTrackingDetails.jsx`, `src/admin/OrdersAdmin.jsx`) để hiển thị danh sách đầy đủ các sản phẩm trong đơn gộp và tự động xóa đúng các món đã đặt khỏi giỏ sau khi gửi thành công.
    - Mở rộng API tạo đơn, tồn kho, email đơn hàng và tra cứu đơn (`server/orders.js`, `server/inventory.js`, `server/order-mail.js`, `server/order-tracking.js`) để hỗ trợ đơn nhiều sản phẩm (kiểm tra giá/dung tích, giữ chỗ, trừ kho và hoàn giữ chỗ theo từng sản phẩm) đồng thời tương thích hoàn toàn với đơn một sản phẩm cũ.
  - **Giao diện trang chi tiết sản phẩm trên máy tính (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**:
    - Sửa tên biểu tượng để nút **Thêm vào giỏ** hiển thị đúng biểu tượng giỏ hàng bên trái.
    - Căn khung giá và nút **Mua ngay** trên màn hình máy tính gọn đúng chiều rộng cột nút phía trên, bỏ hiệu ứng kính mờ thừa và khôi phục màu hồng nổi bật cho nút **Mua ngay**.
  - **Tối ưu độ mượt cho form đặt hàng (`src/styles/checkout.css`, `src/components/AddressSelect.jsx`, `src/components/ModalDialog.jsx`)**:
    - Bỏ hiệu ứng làm mờ nền liên tục trên thanh tiêu đề và thanh nút bấm dính bên trong hộp thoại đặt hàng, đồng thời cô lập phạm vi bố cục của hộp thoại để giảm tải vẽ lại khi cuộn và nhập liệu.
    - Giới hạn số dòng địa chỉ hiển thị cùng lúc trong danh sách xổ xuống (tối đa 60 dòng kèm gợi ý gõ tên lọc nhanh) và tránh cập nhật lại kích thước khung nhìn khi giá trị không đổi.
  - **Chỉnh giao diện trong trang quản trị (`src/admin/builder/CartSettings.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `src/components/ShopCart.jsx`, `src/styles/product-detail.css`)**:
    - Bổ sung mục **Nút Mua ngay trong giỏ hàng** trong phần cài đặt Giỏ hàng của Visual Builder (cho chỉnh chữ nút, màu nền, màu viền, bo góc, chiều cao, font chữ, cỡ chữ máy tính/điện thoại, màu chữ, độ đậm, căn chữ kèm xem trước trực tiếp và áp dụng ra giỏ hàng thật).
    - Đồng bộ bo góc và màu viền khung **Mua ngay** trên máy tính theo cấu hình admin, đồng thời hiển thị thêm tùy chỉnh màu nền, viền và kiểu chữ nút **Thêm vào giỏ** ngay trong mục **Màu và kiểu chữ các nút** của phần Chi tiết sản phẩm.
- **File / khu vực liên quan**: `src/components/ShopCart.jsx`, `src/styles/shop-cart.css`, `src/admin/builder/CartSettings.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderTrackingDetails.jsx`, `src/styles/order-tracking.css`, `src/admin/OrdersAdmin.jsx`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/styles/checkout.css`, `src/components/AddressSelect.jsx`, `src/components/ModalDialog.jsx`, `server/orders.js`, `server/inventory.js`, `server/order-mail.js`, `server/order-tracking.js`, `tests/orders.test.js`, `qa/cart.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **248/248** unit test đạt (bao gồm test mới cho đơn nhiều sản phẩm và kiểm kho), `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-320` và `width-390`): **26/26** test đạt trên `qa/cart.spec.js`, `qa/shopping.spec.js` và `qa/editor-checkout.spec.js`.
- **Ảnh hưởng database**: Bổ sung tùy chọn trường mảng `items` trên tài liệu đơn hàng trong collection `orders` khi khách đặt từ 2 sản phẩm trở lên; vẫn giữ trường `product` tóm tắt để tương thích ngược với các đơn và truy vấn cũ, không thay đổi rules hay index.

## 19/11/2026 — Tách riêng nút Chi tiết và Mua ngay trong giỏ hàng, đồng bộ giao diện nút Thêm vào giỏ trên trang sản phẩm

- **Lý do**: Trong giỏ hàng cần giữ nút **Chi tiết** đi tới trang chi tiết sản phẩm và bổ sung nút **Mua ngay** ngay trên từng dòng sản phẩm để đặt hàng trực tiếp; đồng thời nút **Thêm vào giỏ** trên trang chi tiết sản phẩm chưa đồng bộ kích thước, màu sắc và bố cục với nhóm nút mua hàng bên cạnh và cần cho chỉnh sửa trong trang quản trị.
- **Thay đổi chính**:
  - **Giỏ hàng (`src/components/ShopCart.jsx`, `src/lib/cart-copy.js`, `src/styles/shop-cart.css`)**:
    - Nút **Chi tiết** chuyển tới trang chi tiết sản phẩm bình thường, không tự bật form đặt hàng.
    - Bổ sung nút **Mua ngay** nổi bật trên từng dòng sản phẩm trong giỏ để mở thẳng form đặt hàng tại chỗ (chỉ hiển thị khi website đang bật nhận đơn, tự trừ đúng số lượng trong giỏ sau khi đặt thành công). Cho phép đổi chữ nút **Mua ngay** trong phần cài đặt Giỏ hàng của admin.
  - **Trang chi tiết sản phẩm và Visual Builder (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/admin/builder/registry.js`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`)**:
    - Thiết kế lại nút **Thêm vào giỏ** cùng chiều rộng tối đa, chiều cao, bo góc, khoảng cách, sắc thái và bố cục biểu tượng đồng bộ hoàn toàn với nút **Tư vấn** và khối kênh mua hàng bên dưới.
    - Bổ sung tùy chỉnh trong Visual Builder cho nút **Thêm vào giỏ** (chữ nút, màu nền, màu viền, font chữ, cỡ chữ máy tính/điện thoại, độ đậm, căn chữ) có xem trước và lưu cấu hình.
- **File / khu vực liên quan**: `src/components/ShopCart.jsx`, `src/lib/cart-copy.js`, `src/styles/shop-cart.css`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/admin/builder/registry.js`, `src/admin/builder/ProductDetailPanels.jsx`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `qa/cart.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **247/247** unit test đạt, `eslint .` 0 lỗi, `vite build` và ngân sách bundle đạt.
  - Playwright (`width-320` và `width-390`): **18/18** test đạt trên `qa/cart.spec.js` và `qa/editor-checkout.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Sửa lỗi toàn diện cho Web bán hàng, Trang quản trị và Hệ thống máy chủ

- **Lý do**: Rà soát và khắc phục các lỗi thao tác, phân quyền, đồng bộ dữ liệu, bảo mật và trải nghiệm người dùng trên cả 3 lớp (Web khách hàng, Trang quản trị và API/Rules).
- **Thay đổi chính**:
  - **Web khách hàng**:
    - Bổ sung nút "Thêm vào giỏ" trên trang chi tiết sản phẩm; khi bấm từ giỏ hàng sang trang sản phẩm sẽ mở sẵn form đặt hàng và ghi rõ ở chân giỏ là đặt theo từng sản phẩm.
    - Khắc phục lỗi mất chạm chọn Tỉnh/Phường trên iOS Safari; giữ nút "Đặt hàng ngay" bấm được để báo lỗi và cuộn tới trường còn thiếu; làm rõ tổng tiền chưa gồm phí giao hàng trước khi chọn địa chỉ; chỉ đóng hộp thoại khi cả lúc nhấn xuống lẫn thả chuột đều nằm ngoài khung.
    - Cải thiện giỏ hàng: không nháy thông báo không khả dụng khi danh sách sản phẩm đang tải, cho phép xóa trắng ô số lượng khi đang gõ, vô hiệu hóa chỉnh số lượng và loại sản phẩm hết hàng khỏi tổng tiền, không báo thêm thành công khi đã đạt giới hạn.
    - Sắp xếp theo giá giữ nguyên danh mục đang lọc và luôn hiển thị thanh chọn danh mục; thêm nút đóng trên menu di động; cho phép cuộn ảnh dọc khi phóng to ở mức 100%; tách bố cục tra cứu theo mã đơn và hiển thị lỗi tải thêm đơn ngay cạnh nút bấm; giữ nguyên thông báo quá thời gian ở trợ lý chat; dùng điều hướng nội bộ cho chân trang, bỏ liên kết rỗng và chữ mẫu thừa, thêm nút quay về trang chủ ở trang không tồn tại.
  - **Trang quản trị**:
    - Phân tách đúng quyền trong màn hình Đơn hàng: tài khoản chỉ có quyền đơn hàng không bị gọi API email marketing khi mở khung gửi thư riêng cho khách, đồng thời ẩn tab Thư tự động và tab Chữ trang tra cứu nếu không có quyền tương ứng.
    - Tự làm mới lịch sử email sau khi gửi lại thư xác nhận; xóa bộ lọc đơn gồm cả bộ lọc email; lọc theo khách hàng tự đặt lại bộ lọc email; hiện thông báo lỗi nếu đăng xuất thất bại.
    - Bổ sung cảnh báo rời trang khi chưa lưu và xác nhận trước khi tải lại ở Phí vận chuyển và Email; chống bấm xóa sản phẩm nhiều lần khi đang bận; chống trùng dòng khi tải thêm danh sách email.
    - Visual Builder: khôi phục mặc định xóa sạch giá trị cũ và đẩy được lên máy chủ, ẩn nút khôi phục ở hai mục không hỗ trợ, tính trạng thái chưa lưu chính xác sau khi Hoàn tác, giữ thanh lưu hiện khi có thay đổi ở tab cài đặt cửa hàng, và thêm nút "Thử lại" khi tải dữ liệu lỗi.
  - **Hệ thống máy chủ và Rules**:
    - Vô hiệu hóa tài khoản quản trị trong `adminUsers` lập tức chặn quyền ở cả API, Firestore Rules và Storage Rules (ưu tiên ghi đè cả custom claim và biến môi trường).
    - Khôi phục email chào mừng bị kẹt ở trạng thái đang gửi sau 5 phút và chống ghi đè trạng thái bằng kiểm tra phiên gửi trong giao dịch; chặn gửi email marketing ngay từ đầu nếu thiếu cấu hình hủy đăng ký; không ghi đè thời điểm hủy đăng ký khi gửi lặp lại.
    - Trừ số lượng giữ chỗ khi tính trạng thái còn/hết hàng; lọc đúng đơn đang chờ xử lý khi kiểm kho; sắp xếp danh sách tra cứu đơn theo thời gian mới nhất; dùng HMAC kèm khóa bí mật cho giới hạn tần suất; tách bộ đếm thống kê khỏi giao dịch để giảm xung đột; xóa cache lỗi ở API địa chỉ; xử lý lỗi parse JSON, giới hạn kích thước nội dung và lỗi xác thực dịch vụ mail gọn gàng.
- **File / khu vực liên quan**:
  - Web khách hàng: `src/components/ShopCart.jsx`, `src/components/ProductDetail.jsx`, `src/components/AddressSelect.jsx`, `src/components/OrderFormFields.jsx`, `src/components/ModalDialog.jsx`, `src/components/CatalogFilters.jsx`, `src/components/Collection.jsx`, `src/components/Navbar.jsx`, `src/components/OrderTracking.jsx`, `src/components/OrderTrackingSearch.jsx`, `src/components/Footer.jsx`, `src/components/About.jsx`, `src/hooks/useChatConversation.js`, `src/App.jsx`, `src/styles/product-detail.css`, `src/styles/order-tracking.css`.
  - Trang quản trị: `src/admin/AdminApp.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/OrderEmails.jsx`, `src/admin/ShippingAdmin.jsx`, `src/admin/ProductsAdmin.jsx`, `src/admin/NewsletterAdmin.jsx`, `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/save-sections.js`.
  - Máy chủ & Rules: `server/admin-auth.js`, `server/newsletter.js`, `server/newsletter-admin.js`, `server/newsletter-content.js`, `server/microsoft-mail.js`, `server/unsubscribe.js`, `server/storefront-stock.js`, `server/inventory.js`, `server/order-tracking.js`, `server/analytics.js`, `server/addresses.js`, `firestore.rules`, `storage.rules`.
  - Kiểm thử: `tests/firestore-memory.js`, `tests/inventory.test.js`, `tests/mail-flows.test.js`, `tests/newsletter.test.js`, `qa/shopping.spec.js`, `qa/cart.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **247/247** unit test đạt, `eslint .` 0 lỗi, `vite build` và kiểm tra ngân sách bundle đạt.
  - Playwright (`width-320` và `width-390`): **30/30** test đạt trên `qa/shopping.spec.js`, `qa/cart.spec.js`, `qa/editor-checkout.spec.js` và `qa/admin-navigation.spec.js`.
- **Ảnh hưởng database**:
  - Cập nhật `firestore.rules` và `storage.rules` để tài khoản quản trị có `enabled !== true` trong `adminUsers` bị từ chối quyền ngay cả khi còn claim hoặc cấu hình biến môi trường.
  - Truy vấn tra cứu đơn theo số điện thoại bổ sung sắp xếp theo `createdAt` giảm dần (cần đảm bảo composite index `phoneHash` + `createdAt desc` trên collection `orders` khi triển khai Firestore).

## 19/11/2026 — Giữ nguyên thông báo quá thời gian khi nội dung phản hồi tra cứu đơn bị treo

- **Lý do**: Nếu máy chủ đã trả phần đầu phản hồi nhưng nội dung bị treo quá 20 giây, bước đọc JSON trước đó nuốt lỗi hủy yêu cầu khiến người dùng thấy thông báo lỗi chung thay vì thông báo chờ quá lâu.
- **Thay đổi chính**:
  - **Chuyển lỗi hủy/quá thời gian về đúng nhánh xử lý (`src/components/OrderTracking.jsx`)**: Không nuốt lỗi hủy yêu cầu khi đọc nội dung phản hồi ở cả bước tra cứu danh sách lẫn bước mở chi tiết đơn, đảm bảo hiển thị đúng thông báo chờ quá lâu.
- **File / khu vực liên quan**: `src/components/OrderTracking.jsx`.
- **Kiểm tra đã chạy**:
  - `npm run lint`, `npm run build`: 0 lỗi, 0 cảnh báo.
  - Playwright (`width-320` và `width-390`): **8/8** test đạt trên `qa/shopping.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Thêm giới hạn 20 giây cho yêu cầu tải chi tiết đơn và tách dòng thông báo lỗi lưu trên thanh đáy mobile

- **Lý do**: (1) Yêu cầu tải chi tiết đơn hàng chưa có thời hạn chờ và cơ chế hủy nên có thể kẹt ở trạng thái đang tải và khóa các nút khác nếu mạng treo; (2) thông báo lỗi lưu trong Visual Builder nằm trong thanh đáy không xuống dòng khiến nút "Lưu tất cả" bị ép chật trên màn hình `320px`.
- **Thay đổi chính**:
  - **Giới hạn thời gian và hủy yêu cầu tải chi tiết (`src/components/OrderTracking.jsx`)**: Áp dụng cơ chế hủy yêu cầu và giới hạn chờ 20 giây tương tự form tra cứu; tự hủy khi rời trang, đổi chế độ, sửa ô nhập hoặc tra cứu mới, đồng thời hiển thị thông báo quá thời gian/lỗi mạng ngay tại dòng đơn và mở khóa các nút.
  - **Đưa thông báo lỗi lưu lên dòng riêng trên thanh đáy mobile (`src/admin/builder/VisualBuilder.css`)**: Cho thanh đáy tách riêng thông báo lỗi lên một hàng phía trên, giữ trạng thái lưu và nút "Lưu tất cả" trên một hàng gọn và dễ bấm ở `320px`.
- **File / khu vực liên quan**: `src/components/OrderTracking.jsx`, `src/admin/builder/VisualBuilder.css`.
- **Kiểm tra đã chạy**:
  - `npm run lint`, `npm run build`: 0 lỗi, 0 cảnh báo.
  - Playwright (`width-320` và `width-390`): **24/24** test đạt trên `qa/shopping.spec.js` và `qa/editor-checkout.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Tối ưu bố cục Visual Builder trên màn hình hẹp, báo tải/lỗi ngay tại dòng tra cứu đơn và tăng vùng chạm giỏ hàng

- **Lý do**: Khắc phục 3 điểm trải nghiệm mobile phát hiện qua kiểm tra giao diện: (1) Visual Builder ở 320px xếp dọc toàn bộ danh sách mục trước phần xem trước và thanh lưu cố định bị xuống 3 hàng do gộp cả nút Hoàn tác/Làm lại/Khôi phục mặc định; (2) màn hình tra cứu đơn hiển thị trạng thái tải và lỗi của nút "Xem chi tiết" ở form phía trên, dễ nằm ngoài vùng nhìn trên điện thoại; (3) nút tăng/giảm số lượng trong giỏ hàng nhỏ (~30×36px) gây khó chạm trên màn hình hẹp.
- **Thay đổi chính**:
  - **Thu gọn Visual Builder trên mobile (`src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/VisualBuilder.css`)**: Chuyển danh sách mục trên màn hình `<= 800px` thành dải cuộn ngang một hàng gọn nhẹ; tách nhóm Hoàn tác / Làm lại / Khôi phục mặc định lên thanh công cụ trên và chỉ giữ trạng thái lưu cùng nút "Lưu tất cả" trên một hàng ở thanh đáy cố định.
  - **Phản hồi tải và lỗi ngay tại dòng đơn đang mở (`src/components/OrderTracking.jsx`, `src/styles/order-tracking.css`)**: Hiển thị trạng thái "Đang tải…" trực tiếp trên nút "Xem chi tiết" của dòng đang bấm và đặt thông báo lỗi tải chi tiết ngay trong thẻ dòng đơn tương ứng thay vì đẩy lên form phía trên.
  - **Tăng vùng chạm nút số lượng giỏ hàng (`src/styles/shop-cart.css`)**: Nâng kích thước nút tăng/giảm lên tối thiểu `44×44px` và cho nhóm điều khiển xuống dòng gọn gàng ở màn hình `<= 480px`.
- **File / khu vực liên quan**: `src/admin/builder/VisualBuilder.jsx`, `src/admin/builder/VisualBuilder.css`, `src/components/OrderTracking.jsx`, `src/styles/order-tracking.css`, `src/styles/shop-cart.css`.
- **Kiểm tra đã chạy**:
  - `npm run lint`, `npm run build`: 0 lỗi, 0 cảnh báo.
  - Playwright (`width-320` và `width-390`): **26/26** test đạt trên `qa/editor-checkout.spec.js`, `qa/shopping.spec.js` và `qa/cart.spec.js`; đã kiểm tra ảnh chụp Visual Builder ở `320px`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Kiểm tra đủ 3 cờ quyền trong phản hồi đăng nhập admin để phân biệt phản hồi lỗi với tài khoản thiếu quyền

- **Lý do**: Nếu phản hồi kiểm tra quyền trả về đối tượng rỗng hoặc thiếu một trong ba quyền (đơn hàng, email, quản trị đầy đủ), giao diện trước đó có thể hiểu nhầm là tài khoản không có quyền hoặc chỉ hiện một phần menu.
- **Thay đổi chính**:
  - **Xác thực đủ 3 cờ quyền boolean (`src/admin/AdminApp.jsx`)**: Yêu cầu phản hồi kiểm tra quyền phải có đủ cả 3 trường boolean; nếu thiếu bất kỳ trường nào sẽ hiển thị màn hình "Thử lại" báo phản hồi chưa đầy đủ.
  - **Mở rộng kiểm thử (`qa/admin-navigation.spec.js`)**: Kiểm tra cả 3 tình huống phản hồi thiếu quyền, đối tượng quyền rỗng và đối tượng chỉ có một phần quyền.
- **File / khu vực liên quan**: `src/admin/AdminApp.jsx`, `qa/admin-navigation.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run lint`, `npm run build`: 0 lỗi, 0 cảnh báo.
  - Playwright (`width-390`): **2/2** test đạt trên `qa/admin-navigation.spec.js`.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Chuyển sang màn hình Thử lại khi phản hồi kiểm tra quyền admin thiếu danh sách quyền

- **Lý do**: Khi frontend và API lệch phiên bản dẫn tới phản hồi kiểm tra quyền thiếu trường danh sách quyền, giao diện admin trước đó tự mặc định quyền đầy đủ khiến nhân viên chỉ quản lý đơn có thể mở màn hình chỉnh sửa nội dung rồi mới gặp lỗi lúc lưu.
- **Thay đổi chính**:
  - **Fail-closed tại cổng vào quản trị (`src/admin/AdminApp.jsx`)**: Bỏ mặc định quyền đầy đủ; nếu phản hồi kiểm tra quyền thiếu thông tin quyền thì hiển thị màn hình "Thử lại" hiện có thay vì mở khung quản trị.
  - **Cập nhật kiểm thử giao diện (`qa/admin-navigation.spec.js`, `qa/admin-appearance.spec.js`)**: Cập nhật dữ liệu giả lập trả đầy đủ quyền và bổ sung kịch bản kiểm tra màn hình "Thử lại" khi thiếu quyền.
- **File / khu vực liên quan**: `src/admin/AdminApp.jsx`, `qa/admin-navigation.spec.js`, `qa/admin-appearance.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **247/247** test Node đạt, `eslint .` 0 lỗi, `vite build` 0 cảnh báo, giới hạn bundle đạt (`425.767` bytes / `138.214` gzip bytes).
  - Playwright (`width-390`): **9/9** test đạt trên `qa/admin-appearance.spec.js` (7/7) và `qa/admin-navigation.spec.js` (2/2).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Chặn hiển thị mục ghi Firestore cho tài khoản thiếu quyền đầy đủ, đồng bộ quyền gửi thử email đơn và tắt vòng sáng khi tắt hiệu ứng nhấn

- **Lý do**: Khắc phục 3 điểm phát hiện sau đợt review: (1) tài khoản chỉ có quyền đơn hàng vẫn thấy các mục ghi trực tiếp Firestore (Sản phẩm, Trang chủ, Cửa hàng, Phí vận chuyển, Chat AI) rồi mới lỗi khi lưu; (2) admin đầy đủ được cấp quyền qua Firebase claim hoặc `adminUsers.enabled` bị từ chối 403 khi bấm Gửi thử email từ đơn hàng thật; (3) tắt hiệu ứng nhấn trong Visual Builder vẫn còn vòng sáng 420ms ở nút "Mua ngay".
- **Thay đổi chính**:
  - **Ẩn các mục ghi trực tiếp Firestore khi không có quyền quản trị đầy đủ (`src/admin/AdminApp.jsx`)**: Chỉ hiển thị Sản phẩm, Trang chủ, Cửa hàng, Phí vận chuyển và Chat AI khi tài khoản có quyền quản trị đầy đủ (`permissions.full`).
  - **Đồng bộ kiểm tra quyền đơn hàng khi gửi email thử từ đơn thật (`server/admin-auth.js`, `server/newsletter-admin.js`, `tests/newsletter.test.js`)**: Dùng chung phép kiểm tra quyền đơn hàng (chấp nhận cả custom claim, `adminUsers.enabled === true` và biến môi trường) thay vì chỉ kiểm tra danh sách UID trong biến môi trường; bổ sung test xác nhận.
  - **Tắt vòng sáng nút "Mua ngay" khi tắt hiệu ứng nhấn (`src/components/ProductDetail.jsx`)**: Bỏ qua vòng sáng 420ms khi tùy chọn hiệu ứng nhấn nút đang tắt trong Visual Builder.
- **File / khu vực liên quan**: `src/admin/AdminApp.jsx`, `server/admin-auth.js`, `server/newsletter-admin.js`, `src/components/ProductDetail.jsx`, `tests/newsletter.test.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **247/247** test Node đạt, `eslint .` 0 lỗi, `vite build` 0 cảnh báo, giới hạn bundle đạt (`425.767` bytes / `138.216` gzip bytes).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu.

## 19/11/2026 — Siết điều kiện `adminUsers.enabled`, tách quyền đơn hàng/email, chặn thanh toán đơn hủy và sửa giỏ hàng/Zalo/reduced-motion

- **Lý do**: Khắc phục 6 điểm phát hiện sau đợt review kế tiếp: (1) API chỉ kiểm tra `adminUsers/{uid}` tồn tại thay vì `enabled === true` như `firestore.rules`; (2) gộp quyền `ORDER_ADMIN_UIDS` với `NEWSLETTER_ADMIN_UIDS` và chặn tài khoản chỉ có quyền email ngay tại `whoami`; (3) mua trực tiếp một sản phẩm hoặc mua một phần số lượng từ giỏ làm xóa cả dòng trong giỏ; (4) đơn đã hủy vẫn có thể nhận request đánh dấu `paid` từ tab admin cũ; (5) nhánh Zalo fallback báo đã lưu ảnh trước khi tải thành công; (6) vòng sáng nút "Mua ngay" vẫn chạy khi bật `prefers-reduced-motion: reduce`.
- **Thay đổi chính**:
  - **Đồng bộ `adminUsers.enabled === true` & phân tách quyền chức năng (`server/admin-auth.js`, `server/newsletter-admin.js`, `server/orders.js`, `src/admin/AdminApp.jsx`, `src/admin/useOrderNotifications.js`)**: Kiểm tra `doc.exists && doc.data()?.enabled === true` khớp `firestore.rules`. Tách `server/newsletter-admin.js` chỉ chấp nhận `NEWSLETTER_ADMIN_UIDS` (cùng full admin). Bổ sung `resolveAdminPermissions()` cho `GET /api/admin-orders?whoami=1` trả `permissions: { orders, newsletter, full }` để tài khoản chỉ có quyền email vẫn đăng nhập được và `AdminApp` chỉ hiện các mục được cấp quyền đồng thời không poll thông báo đơn hàng khi không có quyền `orders`.
  - **Chặn cập nhật thanh toán trên đơn đã hủy (`server/orders.js`)**: Trong transaction cập nhật đơn, từ chối mọi yêu cầu đổi `paymentStatus` với HTTP `409` nếu đơn đang ở trạng thái `cancelled`.
  - **Phân biệt mua trực tiếp với mua từ giỏ & trừ đúng số lượng (`src/components/ProductDetail.jsx`, `src/components/OrderForm.jsx`, `src/components/ShopCart.jsx`)**: Chỉ phát sự kiện `orora-cart-remove` khi khách đi từ giỏ (`fromCart = true`) và truyền đúng `quantity` đã đặt để `ShopCart` trừ đúng số lượng còn lại thay vì xóa cả dòng.
  - **Báo trạng thái chính xác ở nhánh Zalo fallback & tôn trọng `prefers-reduced-motion` (`src/components/OrderReceiptActions.jsx`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**: Chỉ báo "Đã lưu ảnh đơn hàng" sau khi `downloadOrderReceipt` hoàn tất, và báo lỗi `role="alert"` nếu tải thất bại; tắt animation vòng sáng và chuyển động nút "Mua ngay" khi bật `prefers-reduced-motion: reduce`.
- **File / khu vực liên quan**: `server/admin-auth.js`, `server/newsletter-admin.js`, `server/orders.js`, `src/admin/AdminApp.jsx`, `src/admin/useOrderNotifications.js`, `src/components/ProductDetail.jsx`, `src/components/OrderForm.jsx`, `src/components/ShopCart.jsx`, `src/components/OrderReceiptActions.jsx`, `src/styles/product-detail.css`, `tests/orders.test.js`, `tests/order-activity.test.js`, `tests/newsletter.test.js`, `qa/cart.spec.js`, `qa/order-receipt.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **247/247** test Node đạt (bao gồm test từ chối `adminUsers` có `enabled: false` / thiếu `enabled`, tách quyền `ORDER_ADMIN_UIDS` vs `NEWSLETTER_ADMIN_UIDS`, và chặn `paymentStatus: "paid"` trên đơn đã hủy), `eslint .` 0 lỗi, `vite build` 0 cảnh báo, vượt giới hạn bundle (`425.767` bytes / `138.219` gzip bytes).
  - Playwright (`width-390`): **6/6** test đạt trên `qa/order-receipt.spec.js`, `qa/cart.spec.js`, `qa/admin-navigation.spec.js` (bao gồm kịch bản tải ảnh Zalo lỗi và trừ một phần số lượng giỏ hàng).
- **Ảnh hưởng database**: Không thay đổi schema hay dữ liệu; điều kiện đọc `adminUsers/{uid}` phía API nay yêu cầu `enabled === true` đồng nhất hoàn toàn với `firestore.rules`.

## 19/11/2026 — Đồng bộ quyền admin, siết máy trạng thái đơn, bảo vệ tra cứu, gắn hủy đăng ký email và tối ưu Firestore/UX toàn trang

- **Lý do**: Khắc phục toàn bộ các điểm tồn đọng từ đợt review tổng thể BE + FE (admin và storefront): lệch quyền admin giữa API và Firestore rules, trạng thái đơn cho phép lùi/bỏ thanh toán sau khi trừ kho và thiếu xác nhận khi hủy/hoàn tất, gửi lại `requestId` bị tính rate limit, tra cứu đơn bằng mã không cần xác minh SĐT, thư marketing thiếu liên kết hủy đăng ký, giỏ hàng chưa đồng bộ giữa các tab / chưa tự xóa sản phẩm vừa đặt, và các truy vấn Firestore còn quét toàn bộ đơn chờ hoặc gọi lẻ từng document.
- **Thay đổi chính**:
  - **Đồng bộ quyền admin & cổng `whoami` (`server/admin-auth.js`, `server/orders.js`, `server/inventory.js`, `server/newsletter-admin.js`, `server/analytics.js`, `src/admin/AdminApp.jsx`, `src/admin/AdminLogin.jsx`)**: Gộp kiểm tra quyền admin vào `requireAdmin()` dùng chung cho cả 4 nhóm API (chấp nhận Firebase custom claim `admin === true`, danh sách env `ORDER_ADMIN_UIDS`/`NEWSLETTER_ADMIN_UIDS`, hoặc document `adminUsers/{uid}` trên Firestore). Bổ sung `GET /api/admin-orders?whoami=1`; `AdminApp` kiểm tra quyền trước khi mở khung quản trị và hiển thị thẻ báo thiếu quyền kèm UID/Thử lại/Đăng xuất nếu tài khoản chưa được cấp quyền; `AdminLogin` Việt hóa đầy đủ mã lỗi Firebase Auth.
  - **Máy trạng thái đơn hàng chặt chẽ & thao tác nhanh mail (`server/orders.js`, `server/order-mail.js`, `src/admin/OrdersAdmin.jsx`, `src/components/OrderForm.jsx`)**: Áp dụng bảng chuyển trạng thái `NEXT_ORDER_STATUSES` ở cả server và UI (chặn lùi trạng thái, chặn bỏ tick thanh toán sau khi đã xuất kho/hoàn tất/hủy); thêm hộp thoại xác nhận trước khi Hủy đơn hoặc Hoàn tất. Kiểm tra replay `orders/{requestId}` **trước** bước rate limit để khách bấm lại sau timeout nhận ngay `201` mà không tốn hạn mức. Cập nhật thông báo mail đang xử lý ở nền trên `OrderForm`, bổ sung `{{shippingFee}}` và `{{totalAmount}}` vào `DEFAULT_ORDER_MESSAGE`, thêm nút **Gửi lại mail / Gỡ kẹt mail** trực tiếp ở bảng đơn và tab email trong `OrdersAdmin`.
  - **Bảo mật tra cứu đơn hàng (`server/order-tracking.js`, `src/lib/order-tracking-copy.js`, `src/components/OrderTrackingSearch.jsx`, `src/components/OrderTracking.jsx`, `src/components/OrderForm.jsx`)**: Tra cứu bằng mã đơn bắt buộc kèm số điện thoại đặt hàng (hoặc 4 số cuối); tra cứu bằng SĐT chỉ trả tóm tắt gọn (không trả sẵn tên sản phẩm/dung tích/tạm tính/phí giao hàng) và tải chi tiết theo yêu cầu khi bấm **Xem chi tiết**. Thêm nhãn/placeholder chỉnh được trong admin (`codePhoneLabel`, `codePhonePlaceholder`) và tự truyền `phone` từ màn hình đặt hàng thành công.
  - **Liên kết hủy đăng ký & header `List-Unsubscribe` (`server/newsletter-content.js`, `server/newsletter-admin.js`, `server/microsoft-smtp.js`, `docs/EMAIL-SETUP.md`)**: Tự động nối liên kết hủy đăng ký đã ký (`/api/unsubscribe`) vào thư chào mừng và thư chiến dịch, đồng thời gắn header `List-Unsubscribe` / `List-Unsubscribe-Post` khi gửi qua SMTP.
  - **UX giỏ hàng, thanh dưới, biên lai & dọn mã thừa (`src/lib/cart-copy.js`, `src/components/ShopCart.jsx`, `src/components/MobileShopNav.jsx`, `src/lib/order-receipt.js`, `src/admin/builder/ImageUploadControl.jsx`, `qa/ui-efficiency.spec.js`)**: Đồng bộ giỏ hàng giữa các tab qua sự kiện `storage`, tự xóa sản phẩm vừa đặt khỏi giỏ qua sự kiện `orora-cart-remove`, ngắt `MutationObserver` ở `MobileShopNav` sau khi `.marquee`/`.hero` đã gắn, tăng độ nét ảnh biên lai theo `devicePixelRatio` (tối thiểu 2x), đổi import động trùng sang import tĩnh ở `ImageUploadControl` (xóa cảnh báo Vite `INEFFECTIVE_DYNAMIC_IMPORT`), và xóa 4 file thừa (`src/components/BackToTop.jsx`, `src/styles/back-to-top.css`, `src/data/content.js`, `src/assets/hero.png`).
  - **Tối ưu Firestore & điều hướng Admin (`server/inventory.js`, `server/orders.js`, `src/App.jsx`, `src/admin/AdminApp.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/TodayTasks.jsx`)**: Duy trì bộ đếm `inventory/{productId}.reserved` O(1) (tự khởi tạo 1 lần từ đơn cũ nếu document chưa có trường `reserved`, tăng khi đặt đơn và giảm khi hủy/xuất kho) để tránh quét toàn bộ đơn chờ ở mỗi lần đặt; gộp đọc kho bằng `db.getAll` ở `GET /api/inventory`; bổ sung đếm tổng từng trạng thái bằng `.count()` tại `GET /api/admin-orders?summary=1` hiển thị trên thanh lọc `OrdersAdmin`; hỗ trợ route `/admin/*`, lưu tab admin qua URL hash (`#orders`, `#products`, ...), và tải đủ phân trang tồn kho ở `TodayTasks` (tối đa 10 trang).
- **File / khu vực liên quan**: `server/admin-auth.js`, `server/orders.js`, `server/inventory.js`, `server/order-mail.js`, `server/order-tracking.js`, `server/newsletter-content.js`, `server/newsletter-admin.js`, `server/microsoft-smtp.js`, `server/analytics.js`, `src/App.jsx`, `src/admin/AdminApp.jsx`, `src/admin/AdminLogin.jsx`, `src/admin/OrdersAdmin.jsx`, `src/admin/TodayTasks.jsx`, `src/admin/builder/ImageUploadControl.jsx`, `src/components/OrderForm.jsx`, `src/components/OrderTracking.jsx`, `src/components/OrderTrackingSearch.jsx`, `src/components/ShopCart.jsx`, `src/components/MobileShopNav.jsx`, `src/lib/cart-copy.js`, `src/lib/order-receipt.js`, `src/lib/order-tracking-copy.js`, `docs/EMAIL-SETUP.md`, các file test trong `tests/` và `qa/`; xóa `src/components/BackToTop.jsx`, `src/styles/back-to-top.css`, `src/data/content.js`, `src/assets/hero.png`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **246/246** test Node đạt, `eslint .` 0 lỗi, `vite build` 0 cảnh báo, giới hạn bundle đạt (`425.630` bytes / `138.159` gzip bytes).
  - Playwright (`width-390`): **31/31** test đạt trên 10 spec (`qa/order-receipt.spec.js`, `qa/ui-efficiency.spec.js`, `qa/shopping.spec.js`, `qa/cart.spec.js`, `qa/tracking-layout.spec.js`, `qa/tracking-navigation.spec.js`, `qa/admin-navigation.spec.js`, `qa/admin-appearance.spec.js`, `qa/admin-confirm.spec.js`, `qa/admin-consistency.spec.js`). Giới hạn: chưa kiểm thử trên Firestore/SMTP production thật.
- **Ảnh hưởng database**:
  - Bổ sung trường số nguyên tùy chọn `inventory/{productId}.reserved` (tương thích ngược: document cũ chưa có `reserved` được tự tính và ghi khi có đơn mới hoặc cập nhật tồn).
  - Các API quản trị nay đọc thêm `adminUsers/{uid}` làm nguồn cấp quyền đồng bộ với Firestore rules. Không thay đổi dữ liệu cũ hay xóa collection nào.

## 19/11/2026 — Thêm giới hạn tốc độ cho `/api/orders` & `/api/subscribe` và dựng sẵn ảnh đơn hàng để gọi Web Share đồng bộ

- **Lý do**: (1) Chặn spam tự động và ngăn lạm dụng gửi mail xác nhận / chào mừng rác tới email người khác trên `/api/orders` và `/api/subscribe`; (2) trên iOS Safari, việc `await` vẽ canvas PNG trước khi gọi `navigator.share` làm mất user gesture (`NotAllowedError`), cần dựng sẵn `Blob` ảnh đơn hàng ngay khi mở biên lai để gọi `navigator.share` đồng bộ trong sự kiện click.
- **Thay đổi chính**:
  - **Rate limit 2 lớp (IP + email) có fail-open (`server/request-limits.js`, `server/orders.js`, `server/newsletter.js`)**: Mở rộng `reserveRequestBudget` hỗ trợ `key` tùy chỉnh và `windowMs = 60000` (giữ tên trường `minute` cho tương thích ngược, mở rộng `expiresAt`), bổ sung `rateLimitSalt(env)` và `reserveBudgetOrAllow` (nếu Firestore kiểm tra hạn mức gặp lỗi thì vẫn cho qua để không chặn nhầm khách). Áp dụng trên `/api/orders` (IP: 8 đơn/phút; email nhận mail: 5 đơn/ngày) và `/api/subscribe` (IP: 5 lượt/phút; email: 3 lượt/giờ), trả HTTP `429` kèm header `Retry-After`.
  - **Dựng sẵn ảnh PNG & gọi Web Share đồng bộ (`src/lib/order-receipt.js`, `src/components/OrderReceiptActions.jsx`)**: Thay `shareOrderReceipt` bằng `shareOrderReceiptBlob(order, blob)` chạy đồng bộ trong click handler; dựng sẵn `blob` trong `useEffect` khi mở biên lai và gắn `data-receipt-ready` trên nút Zalo; khi `navigator.share` gặp lỗi (như `NotAllowedError`) sẽ báo rõ và chuyển sang tải ảnh dự phòng + mở Zalo ở lần bấm tiếp theo; giữ `role="status"` luôn hiện diện trên `.receipt-download-note`.
  - **Kiểm thử mở rộng (`tests/orders.test.js`, `tests/newsletter.test.js`, `qa/order-receipt.spec.js`)**: Thêm unit test giới hạn IP + email kèm `Retry-After` cho cả hai API và thêm kịch bản Playwright mô phỏng `NotAllowedError` khi chia sẻ.
- **File / khu vực liên quan**: `server/request-limits.js`, `server/orders.js`, `server/newsletter.js`, `src/lib/order-receipt.js`, `src/components/OrderReceiptActions.jsx`, `tests/orders.test.js`, `tests/newsletter.test.js`, `qa/order-receipt.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **243/243** test Node đạt, `eslint .` 0 lỗi, `vite build` và giới hạn bundle đạt (`425.231` bytes / `138.126` gzip bytes).
  - `npx playwright test qa/order-receipt.spec.js --project=width-390`: **3/3** test đạt (chia sẻ file PNG + hủy `AbortError`, lỗi `NotAllowedError` chuyển fallback ở lần bấm 2, và fallback tải PNG khi không hỗ trợ `canShare`). Giới hạn: chưa thử trên iPhone vật lý.
- **Ảnh hưởng database**: Tái sử dụng collection `chatRateLimits` (cùng cấu trúc `minute`, `count`, `expiresAt`) với các khóa băm HMAC riêng theo scope `orders`, `orders-email`, `subscribe`, `subscribe-email`. Không thay đổi Firestore rules hay dữ liệu hiện có. Lưu ý vận hành: đặt biến `CHAT_RATE_LIMIT_SALT` riêng trên Vercel và bật TTL cho trường `chatRateLimits.expiresAt` trên Firestore.

## 19/11/2026 — Dùng Web Share API gửi ảnh đơn qua Zalo và đồng bộ màu hiệu ứng nút Mua ngay theo cấu hình admin

- **Lý do**: Khắc phục hai điểm phản biện sau đợt cập nhật trước: (1) trên iPhone/trình duyệt trong app, tải ảnh PNG song song với việc mở link Zalo dễ bị chặn hoặc ngắt kết nối và tự lưu thông tin người nhận mà khách chưa chủ động bấm; (2) hiệu ứng xung sáng khi nhấn nút Mua ngay đang dùng màu hồng viết cứng `rgba(184, 68, 109)` thay vì lấy theo màu nền nút admin đã chọn.
- **Thay đổi chính**:
  - **Chia sẻ ảnh đơn hàng qua Web Share API (`src/lib/order-receipt.js`, `src/components/OrderReceiptActions.jsx`)**: Tách `renderOrderReceiptBlob`, `canShareOrderReceipt`, `shareOrderReceipt`. Khi trình duyệt hỗ trợ `navigator.canShare({ files })`, bấm **Xác nhận qua Zalo** sẽ chặn chuyển trang tức thì và mở hộp chia sẻ gốc kèm file `ORORA-<mã>.png` để khách chọn Zalo gửi trực tiếp; nếu khách hủy (`AbortError`) sẽ không tự tải ảnh xuống máy. Khi trình duyệt không hỗ trợ chia sẻ file (ví dụ desktop), giữ phương án dự phòng tải ảnh PNG và mở link Zalo.
  - **Đồng bộ màu hiệu ứng xung & bóng đổ nút Mua ngay (`src/components/ProductDetail.jsx`, `src/styles/product-detail.css`)**: Truyền biến CSS `--quick-buy-cta-bg` và dùng `color-mix(in srgb, ...)` dựa trên `purchase.websiteBackground` (hoặc màu tính toán của nút) cho cả bóng đổ CSS lẫn animation xung sáng khi nhấn, bỏ màu hồng viết cứng.
  - **Kiểm thử mở rộng (`qa/order-receipt.spec.js`)**: Bổ sung kịch bản kiểm tra cả nhánh Web Share API kèm `File` PNG (xác nhận không tự download kể cả khi hủy `AbortError`) lẫn nhánh tải ảnh dự phòng.
- **File / khu vực liên quan**: `src/lib/order-receipt.js`, `src/components/OrderReceiptActions.jsx`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `qa/order-receipt.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check`: **241/241** test Node pass, `eslint .` 0 lỗi, `vite build` và giới hạn bundle đạt.
  - Playwright (`npx playwright test qa/order-receipt.spec.js qa/editor-checkout.spec.js`): đạt toàn bộ kịch bản active trên 4 viewport (`320px`, `390px`, `768px`, `1440px`). Giới hạn: chưa kiểm thử hộp chia sẻ hệ điều hành trên iPhone vật lý.
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu. Lưu ý vận hành: vẫn nên đặt biến môi trường `CHAT_RATE_LIMIT_SALT` riêng trên Vercel (`openssl rand -hex 32 | vercel env add CHAT_RATE_LIMIT_SALT production`) thay vì dựa vào fallback `FIREBASE_SERVICE_ACCOUNT_JSON`.

## 18/11/2026 — Khôi phục màu nút trước bản hồng phấn

- Khôi phục màu nút website, admin và giá trị màu mặc định trong Visual Builder theo bản 0035938.
- Kiểm tra: đối chiếu mã nguồn với bản 0035938, chỉ khác nhật ký. npm run check và 12 bài Playwright ở 390 px đều đạt.
- Database: giữ nguyên dữ liệu, schema và rules.

## 18/11/2026 — Làm nhạt màu nút cho giao diện kính lỏng

- Dùng nền hồng phấn và chữ hồng đậm cho các nút mặc định trên website, nút chính và nút xác nhận nguy hiểm trong admin. Giữ lớp bóng kính và các tùy chỉnh màu đã lưu.
- Kiểm tra: npm run check đạt và 45 bài Playwright đạt ở 390 px và 1440 px (một bài chỉ chạy mobile). Cặp màu chữ/nền đậm nhất của bảng màu mới có độ tương phản 6,85:1 trên website và 4,96:1 trong admin.
- Database: giữ nguyên dữ liệu, schema và rules.

## 18/11/2026 — Đồng bộ nút hồng trên website

- Dùng chung bảng màu nút hồng cho Hero, thẻ sản phẩm, đặt hàng, giỏ hàng, chat, đăng ký và tra cứu đơn trên desktop và mobile. Giữ lớp bóng kính và các màu tùy chỉnh trong Visual Builder.
- Ổn định kiểm tra Playwright cho nút chat bằng cách giữ hiệu ứng nhấn ở thời điểm kích hoạt, trước khi chờ hộp thoại đóng.
- Kiểm tra: npm run check đạt (241 bài test, lint, build và giới hạn bundle) và 16 bài Playwright checkout/chat ở 390 px đạt.
- Database: giữ nguyên dữ liệu, schema và rules.

## 18/11/2026 — Đổi nút đỏ sang hồng đồng bộ với kính lỏng

- Nút thao tác nguy hiểm và nút xác nhận admin dùng màu hồng của theme, hồng nhạt khi rê chuột trên nút viền và hồng đậm cho nút nền. Thông báo lỗi giữ biến riêng.
- Kiểm tra: 4 bài Playwright xác nhận admin tại 390px đạt.
- Database: giữ nguyên dữ liệu, schema và rules.

## 18/11/2026 — Bỏ khung thông tin cạnh nút mua

- Bỏ khung thanh toán, giao hàng, ước tính phí theo tỉnh và đổi trả cạnh nút mua trên trang chi tiết. Xóa component, CSS và hai trường chỉnh riêng của khung trong Visual Builder.
- Khách vẫn xem phí ở form đặt hàng và chính sách ở phần Cam kết.
- Kiểm tra: npm run check đạt và 8 bài Playwright checkout/builder tại 390px đạt.
- Database: giữ nguyên dữ liệu, schema và rules.

## 18/11/2026 — Đưa thanh Mua ngay lên trên nội dung chi tiết

- Thanh mua kính lỏng trên mobile được render trực tiếp dưới body, tránh bị ngữ cảnh xếp lớp nội dung và tab thông tin che khi cuộn. Desktop và preview giữ thanh mua trong khung sản phẩm.
- Giữ thiết kế, kiểu chữ, số lượng và hành vi mở checkout từ bản mới trên main.
- Kiểm tra: 241 test Node, lint/build đạt. Chromium Android và WebKit iOS giả lập kiểm tra nút nhận thao tác khi cuộn qua tab và mở checkout đúng số lượng. WebKit desktop kiểm tra thanh mua vẫn trong khung sản phẩm.
- Database: không đổi dữ liệu, schema hoặc rules.

## 18/11/2026 — Bỏ nút lên đầu, đồng bộ kính lỏng khối Mua ngay, tự lưu ảnh đơn khi qua Zalo và thiết kế lại form đặt hàng

- **Lý do**: Theo yêu cầu chủ website cần bỏ nút đẩy lên đầu trang (`BackToTop`), bỏ khung tạm tính và nút đặt hàng ngay rời rạc ở trang chi tiết sản phẩm, chuyển khối Mua ngay sang hiệu ứng kính lỏng trong suốt nhìn xuyên nền đằng sau và đồng bộ với thanh điều hướng dưới (`MobileShopNav`), thêm hiệu ứng phản hồi khi nhấn Mua ngay, tự động tải ảnh đơn hàng khi nhấn xác nhận qua Zalo để Zalo gợi ý gửi ảnh ngay, đồng thời thiết kế lại form nhận hàng gọn rõ và hợp lý hơn.
- **Thay đổi chính**:
  - **Bỏ nút lên đầu trang (`BackToTop`)**: Loại bỏ `<BackToTop />` khỏi `src/App.jsx`, cập nhật vị trí neo nút chat trong `src/components/ChatButton.jsx` để căn trực tiếp theo mép dưới màn hình, thanh điều hướng mobile (`.mobile-shop-nav`) và khối Mua ngay (`.product-mobile-buy`), đồng thời dọn các mục cấu hình nút lên đầu không còn dùng trong `src/admin/builder/SurfaceSettings.jsx`.
  - **Khối Mua ngay kính lỏng & bỏ Tạm tính / Đặt hàng ngay**: Bỏ `<PurchaseSubtotal />` và nút `Đặt hàng ngay` cũ trong `src/components/ProductDetail.jsx`, nâng cấp `.product-mobile-buy` thành thanh Mua ngay kính lỏng dùng chung biến chất liệu với `MobileShopNav` (`backdrop-filter: blur(...) saturate(165%)`, nền pha trong suốt `color-mix`, lớp khúc xạ `.product-mobile-buy-lens` có viền ánh sắc conic-gradient) để nhìn rõ nội dung phía sau và đồng bộ kích thước/bo góc với thanh dưới trên mobile. Thêm hiệu ứng nhún và vòng sáng lan tỏa khi nhấn nút **Mua ngay**.
  - **Tùy chỉnh trong Admin**: Cập nhật `src/admin/builder/PurchaseOptionsSettings.jsx` và `src/admin/builder/ProductDetailPanels.jsx` cho phép chỉnh chữ nút Mua ngay, độ đục kính (`quickBuyOpacity`), độ mờ nền (`quickBuyBlur`), bo góc, màu nền/viền kính và kiểu chữ hiển thị giá ngay trên Visual Builder.
  - **Tự động lưu ảnh đơn hàng khi ấn Xác nhận qua Zalo**: Cập nhật `src/components/OrderReceiptActions.jsx` tự động gọi `downloadOrderReceipt(order)` ngay khi khách nhấn nút **Xác nhận qua Zalo**, đồng thời hiển thị trạng thái báo đã lưu ảnh để khách chọn ảnh gửi ngay khi chuyển sang Zalo.
  - **Thiết kế lại form nhận hàng & màn hình xác nhận đơn**: Thiết kế lại `src/components/OrderFormFields.jsx`, `src/components/OrderForm.jsx` và `src/styles/checkout.css` theo bố cục thẻ nhóm trực quan trên một màn hình (`.checkout-product-card` có huy hiệu giá trực tiếp kèm chọn dung tích/số lượng, các thẻ `.checkout-card` cho Thông tin người nhận, Địa chỉ giao hàng, Thanh toán, khung tổng kết 2 dòng Phí giao hàng + Tổng thanh toán không lặp lại dòng Tạm tính, và thanh nút gửi dính đáy phủ kính mờ).
- **File / khu vực liên quan**: `src/App.jsx`, `src/components/ChatButton.jsx`, `src/admin/builder/SurfaceSettings.jsx`, `src/components/ProductDetail.jsx`, `src/styles/product-detail.css`, `src/styles/product-detail-mobile.css`, `src/admin/builder/PurchaseOptionsSettings.jsx`, `src/admin/builder/ProductDetailPanels.jsx`, `src/components/OrderReceiptActions.jsx`, `src/components/OrderFormFields.jsx`, `src/components/OrderForm.jsx`, `src/styles/checkout.css`, `qa/editor-checkout.spec.js`, `qa/shopping.spec.js`, `qa/order-receipt.spec.js`, `qa/chat-liquid.spec.js`, `qa/navbar-cart.spec.js`, `qa/mobile-catalog.spec.js`.
- **Kiểm tra đã chạy**:
  - `npm run check` đạt toàn bộ: **241/241** test Node pass, `eslint .` 0 lỗi, `vite build` thành công và vượt kiểm tra giới hạn bundle (`425.2 KB` / `138.1 KB` gzip).
  - Playwright UI (`npx playwright test qa/order-receipt.spec.js qa/shopping.spec.js qa/editor-checkout.spec.js qa/chat-liquid.spec.js qa/navbar-cart.spec.js qa/mobile-catalog.spec.js qa/product-detail-mobile.spec.js`): **79/79** kịch bản active pass trên cả 4 viewport (`320px`, `390px`, `768px`, `1440px`).
- **Ảnh hưởng database**: Không thay đổi schema, rules hay dữ liệu đơn hàng; các trường giao diện mới của khối Mua ngay kính lỏng (`quickBuyOpacity`, `quickBuyBlur`, `mobileBuyLabel`) nằm trong cấu hình `productDetailStyles.purchaseOptions` với giá trị mặc định tương thích ngược.

## 18/11/2026 — Sửa lớp giao diện mobile, tạm tính thanh mua và hiệu ứng đóng chat

- Thanh Mua ngay hiện tạm tính bằng giá dung tích đang chọn nhân số lượng, kèm số sản phẩm. Form nhận đúng lựa chọn đang hiển thị và vẫn giữ quy trình tính phí giao hàng.
- Nút Lên đầu trang nằm trên thanh mua, có tính chiều cao thực của thanh và navbar khi hiện. Bước địa chỉ trên mobile cho tóm tắt cuộn cùng form, danh sách tỉnh/phường mở trong luồng để tránh che ô nhập. Focus tiêu đề đặt ngay sau khi chuyển bước để tránh đóng picker do focus đến trễ.
- Hộp chọn kênh và chat AI thu về nút mở khi đóng. Nếu đóng trong lúc đang mở, hiệu ứng bắt đầu từ khung hiện tại. Trả focus về nút mở sau khi chạy và đóng ngay khi đã tắt animation hoặc bật giảm chuyển động.
- Database: không đổi dữ liệu, schema hoặc rules.
- Kiểm tra: 241 test Node, lint, build và giới hạn bundle đạt. 8 bài Playwright đạt. Kiểm tra tạm tính 3 sản phẩm, vị trí nút lên đầu trang, thao tác chọn địa chỉ và đóng chat trên Chromium Android/WebKit iOS giả lập.

## 18/11/2026 — Đồng bộ nút mua mobile, chừa chỗ cho chat và tải ảnh theo mức zoom

- Nút mua dính đáy và nút chính dùng chung kiểu chữ và nền từ Visual Builder. Cả hai chỉ xuất hiện trên trang thật khi website có phương thức thanh toán đang bật. Trạng thái hết hàng khóa cả hai.
- Đo chiều cao thanh mua và chừa khoảng trống cho chat dựa trên khung thực tế. Tính cả phần dành cho thanh điều hướng mobile khi Safari hiện thanh trở lại.
- Lightbox dùng biến thể Cloudinary 1600px lúc mở, nâng lên 2400px khi zoom từ 2× để giảm lượt tải ảnh lớn.
- Khóa bộ đếm tồn kho dùng HMAC với CHAT_RATE_LIMIT_SALT hoặc bí mật Firebase máy chủ. Thiếu cả hai trả 503 trước khi đọc kho. Giữ ngân sách 600/phút cho IP dùng chung và kiểm tra tồn ở bước đặt đơn.
- Vercel/Firestore: tài liệu ghi thao tác cấu hình biến và TTL expiresAt. Workspace không có phiên quản trị để cập nhật production. Không đổi schema, rules hoặc dữ liệu đơn/kho.
- Kiểm tra: 241 test Node, lint, build và bundle đạt. 6 bài trên Chromium Android/WebKit iOS giả lập đạt, gồm đo khoảng hở chat, so sánh style và ẩn nút khi tắt đặt đơn. Chạy thêm 2 bài xác nhận ảnh 1600/2400px đạt. Chưa thử điện thoại vật lý.

## 18/11/2026 — Gom lịch sử chỉnh sửa, giảm lượt đọc mail và thêm nút Mua ngay trên mobile

- Visual Builder gộp lần chỉnh liên tiếp trên cùng đường dẫn trường chữ trong khoảng 500ms. Đổi trường, chờ lâu hơn, hoàn tác, làm lại hoặc reset sẽ bắt đầu nhóm mới. Giữ tối đa 40 bước.
- Tổng quan và bộ lọc Mail lỗi dùng API tóm tắt bounce cho 20 đơn gần nhất, tối đa một kết quả đã đánh dấu bounced mỗi đơn và không tải nội dung thư. Lịch sử mail tải tối đa 50 lượt gửi mới nhất mỗi đơn. UI nói rõ chưa tự quét Outlook và bounce chỉ hiện sau khi kiểm tra.
- API tồn kho dùng ngân sách theo IP qua Firestore và HTTP 429 với Retry-After. Tối đa 600 đơn vị mỗi phút, mỗi truy vấn tính 1 cộng 2 cho từng ID duy nhất. Đổi tổ hợp hoặc thứ tự ID không đổi ngân sách. Tái dùng cách nhận diện IP của chat/tra cứu và gom ngưỡng Còn ít vào LOW_STOCK_THRESHOLD.
- Checkout báo rõ khi Enter ở bước địa chỉ mà chưa chọn đủ tỉnh/phường, giữ cách chọn bằng Enter của combobox. Các nhãn bước có mặc định cho cấu hình cũ hoặc nhãn trống.
- Lightbox tải biến thể nét hơn tối đa 2400px từ Cloudinary, hỗ trợ kéo chuột và focus bàn phím. Chi tiết có thanh Mua ngay trên mobile, canh trên navbar khi navbar hiện, ẩn khi mở dialog/chat và khóa khi hết hàng. Chạy lại riêng bài lightbox có kéo chuột và focus bàn phím, kết quả đạt. Admin chỉnh được tên nút.
- Database: không đổi schema/rules và không cập nhật dữ liệu đơn hoặc kho. Hạn mức ghi bộ đếm và mốc hết hạn vào collection chatRateLimits hiện có dưới khóa riêng của tồn kho. Chưa bật tích hợp Graph hoặc quét Outlook tự động.
- Kiểm tra: 240 test Node, lint, build và bundle đạt. Playwright 390px đạt 7 bài admin và 10 bài checkout/tra cứu/builder, gồm gom thao tác nhập, Enter, mở checkout từ thanh mua và khóa khi hết hàng. Chạy lại riêng bài lightbox có kéo chuột và focus bàn phím, kết quả đạt.

## 18/11/2026 — Cải thiện mua hàng trên di động và các việc cần xử lý trong admin

- Danh sách, chi tiết và giỏ dùng trạng thái tồn kho từ API chỉ đọc theo lô. Chỉ trả trạng thái cho sản phẩm đang bán, không trả số tồn hoặc dữ liệu nội bộ. Hết hàng khi kho kiểm đếm bằng 0, Còn ít từ 1 đến 5, chưa kiểm đếm không gắn nhãn. Máy chủ vẫn kiểm tra hàng đang giữ khi đặt đơn. API cache ngắn để giảm lượt đọc.
- Chi tiết có đường dẫn trang, ảnh lớn với điều khiển phóng, chụm ngón và kéo ảnh; giữ truy vấn bộ lọc và vị trí cuộn khi quay lại danh sách. Khối cạnh nút mua hiển thị phương thức thanh toán, thông tin giao và đổi trả cấu hình trong admin, ước tính phí theo tỉnh khi bật bảng phí.
- Checkout chia 3 bước, giữ lại ô đã nhập khi đi tới/lùi hoặc gửi lỗi, tóm tắt dính dưới. Đã nhận đơn ưu tiên mã và tóm tắt, nút Zalo nổi bật và thông tin người nhận có thể thu gọn. Tra cứu giữ tiến trình cũ và thêm câu hướng dẫn bước tiếp theo theo trạng thái, có thể chỉnh trong admin.
- Hoa rơi mặc định 0 cánh trên mobile, vẫn áp dụng số lượng đã cài. Tắt hiệu ứng con trỏ dưới 768px và tắt cả hai hiệu ứng khi trình duyệt báo tiết kiệm dữ liệu. Thu khoảng đệm Hero trên điện thoại để đưa CTA vào màn hình đầu với nội dung mẫu.
- Tổng quan có Cần xử lý hôm nay dựa trên trang đầu đơn, lịch sử email và tồn kho, có liên kết mở đơn/kiểm kho. Danh sách thêm lọc mail lỗi hoặc chưa gửi, Gọi/Sao chép số, tiêu đề dính trên desktop và chi tiết toàn màn hình với hành động dính dưới trên mobile.
- Visual Builder giữ lựa chọn thiết bị, thêm hoàn tác/làm lại bản nháp tối đa 40 thao tác và khôi phục những giá trị có mặc định theo mục sau xác nhận. Dùng nhãn Cơ bản/Nâng cao trong bộ chỉnh. Lịch sử hoàn tác được xóa sau khi lưu thành công.
- Kiểm tra: 238 test Node, lint, build và bundle đạt. 23 test UI tại 390px đạt, kiểm tra thêm khôi phục vị trí cuộn, undo/redo và CTA Hero đạt. 10 test checkout/tra cứu/lưu ảnh trên Chromium Android và WebKit iOS giả lập đạt. Chưa kiểm tra chụm ảnh trên điện thoại vật lý.
- Database: giữ nguyên schema, rules và dữ liệu production. API tồn kho chỉ đọc. Các kiểm thử dùng dữ liệu giả.

## 18/11/2026 — Đồng bộ nút nguy hiểm và cảnh báo thiếu ConfirmProvider

- Màu chữ và màu hover nút nguy hiểm lấy từ biến màu admin. Xác nhận Hoàn kho dùng nút đỏ và đặt focus vào Hủy.
- Khi gọi useConfirm ngoài provider, yêu cầu được hủy an toàn và console ghi cảnh báo trong môi trường phát triển.
- Kiểm tra: cả 4 bài trong qa/admin-confirm.spec.js đạt qua npm run test:ui tại 390px, gồm kiểm tra cảnh báo ngoài provider và cập nhật trạng thái mail.
- Database: giữ nguyên schema, rules và dữ liệu production.

## 18/11/2026 — Nhãn xác nhận theo thao tác và kiểm tra cập nhật mail trong admin

- Hộp xác nhận nhận tiêu đề, nhãn nút và mức nguy hiểm. Các bước xóa, bỏ bản nháp và gửi lại thư có nút đỏ, mở với focus ở Hủy. Ngoài provider, useConfirm trả về yêu cầu đã hủy.
- Playwright xác minh MailWriter tải lại đúng đơn sau phản hồi recoverOnly có trạng thái unchanged. Mô phỏng đơn chuyển từ Kẹt sang Đã nhận, kiểm tra thông báo và nhãn mới. Xác minh nút admin 44px, aria-current cho mục đang mở và viền focus ô chat.
- Kiểu chữ nút gợi ý chat dùng biến CSS, giữ cấu hình riêng trên mobile và giảm số khai báo !important trong chat-button.css từ 215 xuống 202.
- Kiểm tra: npm run check đạt với 237 test Node, lint, build và giới hạn bundle. 11 test UI tại 390px đạt và 8 test trên Chromium Android/WebKit iOS đạt.
- Database: giữ nguyên schema, rules và dữ liệu production. Các test dùng dữ liệu giả.

## 18/11/2026 — Focus rõ hơn, xác nhận admin dùng chung và phản hồi khi mail bị kẹt

- Chat trên màn hình đến 600px giữ ô nhập từ 16px kể cả khi cấu hình đặt nhỏ hơn, còn cỡ lớn hơn vẫn được áp dụng. Viền focus bàn phím rộng 2px. Chuyển kiểu chữ ô nhập và placeholder sang biến CSS có giá trị dự phòng, giảm 21 khai báo `!important` trong CSS chat.
- Nâng các nhãn và ghi chú nhỏ trong chat, admin, Hero và chi tiết sản phẩm lên 12px. Nút hành động admin có chiều cao tối thiểu 44px. Xác minh menu đã đánh dấu mục hiện tại bằng `aria-current="page"`. Thời gian chờ font Hero trước khi hiện chữ dự phòng giảm còn 1 giây.
- Thay cả 12 lời gọi `window.confirm` trong admin bằng hộp thoại dùng chung dựa trên ModalDialog. Hỗ trợ bàn phím, hủy bằng Escape và trả focus về nút đã mở.
- MailWriter hiển thị thao tác cập nhật trạng thái cho đơn gửi bị kẹt. Lượt này báo rõ khi đã chuyển sang Chưa rõ kết quả và chưa gửi email. Máy chủ chặn gửi ở lượt cập nhật dù trạng thái đơn đã đổi ở phiên khác.
- Database: giữ nguyên schema và rules. Luồng cập nhật mail dùng trường hiện có. Kiểm thử dùng dữ liệu giả, không gửi email thật.
- Kiểm tra: 237 test Node, lint, build và giới hạn bundle đạt. 9 test UI admin và focus ở 390px đạt, thêm 4 test trên Chromium Android và WebKit iOS đạt.

## 18/11/2026 — Siết ngưỡng retry mail đơn hàng và hiển thị đơn kẹt quá 5 phút trong admin

- **Lý do:** Đơn có `confirmationMail.state === "sending"` thiếu `updatedAt` có thể kẹt vĩnh viễn; ngưỡng retry 16 giây sát giới hạn 60 giây của Vercel Function; admin chưa có nhãn riêng cho trạng thái `sending` bị kẹt.
- **Xử lý mail máy chủ (`server/order-mail.js`, `docs/EMAIL-SETUP.md`, `tests/order-mail.test.js`):** Coi bản ghi `sending` thiếu `updatedAt` hoặc quá 5 phút là quá hạn và chuyển sang `unknown` (không tự gửi lại); làm rõ dấu ngoặc điều kiện chặn gửi lại khi chưa xác nhận; giảm ngưỡng retry lỗi kết nối SMTP từ 16 giây xuống 10 giây và chờ 750ms trước lượt thử lại; thêm bài test đơn `sending` không có timestamp.
- **Hiển thị trong admin (`src/lib/mail-state.js`, `src/admin/order-api.js`, `src/admin/OrdersAdmin.jsx`, `src/admin/MailWriter.jsx`, `src/admin/OrderMailHistory.jsx`):** Thêm `effectiveMailState` nhận diện trạng thái `stuck` (`Kẹt quá 5 phút, cần kiểm tra Outlook rồi gửi lại`), hiển thị trong bảng đơn hàng, chi tiết email đơn, bộ lọc/lịch sử email đơn và màn hình gửi thư, đồng thời mở khóa nút gửi lại trong `MailWriter` khi đơn bị kẹt.
- **Kiểm tra:** `npm run check` đạt: 236/236 bài test Node đạt, `eslint` 0 lỗi, `vite build` và `check-bundles` đạt (JS đầu trang + static imports gzip 137.262 byte, giới hạn 330.000 byte).
- **Database:** Không thay đổi schema, rules hoặc dữ liệu production; đơn `sending` thiếu timestamp hoặc quá 5 phút chỉ chuyển sang `unknown` khi có yêu cầu gửi mới.

## 18/11/2026 — Đồng bộ điều khiển admin, gộp CSS trường nhập và tách các file giao diện dài

- **Lý do:** Nhiều màn hình cài đặt và Visual Builder dùng riêng ô chọn màu, ô số, bộ chỉnh chữ và hai hệ class trường nhập (`admin-field`/`builder-field`), kèm nhiều file JSX viết dồn trên một dòng và file lớn khó sửa.
- **Bộ điều khiển dùng chung (`src/admin/controls/`):** Gom `ColorField` (bảng màu + ô nhập mã + nút trả về mặc định `↺`), `NumberField`, `ChoiceField` vào `src/admin/controls/fields.jsx` và `src/admin/controls/index.js`. Tái xuất từ `src/admin/builder/ui.jsx` và `src/admin/ProductSloganDesign.jsx` để giữ nguyên API/cấu hình, thay thế các ô `type="color"` và `type="number"` viết rời ở `ChatChannelSettings.jsx`, `OrderTrackingSettings.jsx`, `CollectionPanels.jsx`, `NavbarPanels.jsx`, `ProductContactSettings.jsx`, `ProductDetailPanels.jsx`, `PurchaseOptionsSettings.jsx`, `TickerPanels.jsx`.
- **Giao diện và CSS (`src/styles/admin-theme.css`, `src/styles/admin.css`, `src/admin/builder/VisualBuilder.css`):** Bổ sung biến màu/trạng thái trong `admin-theme.css`, gộp quy tắc hiển thị của `.admin-field` và `.builder-field` dùng chung biến theme, bỏ CSS trùng lặp giữa hai file và chuyển màu biểu đồ trong `AnalyticsDashboard.jsx` sang biến theme.
- **Tổ chức panel và tách file (`src/admin/builder/`):** Tách `StylePanels.jsx` theo bảng tra panel mục (`SECTION_SETTINGS_PANELS`) thay cho chuỗi điều kiện lồng nhau; tách `ProductDetailPanels.jsx` thành `ProductImagePanels.jsx` và `ProductRelatedPanels.jsx`, bỏ các inline style rời; tách bộ chọn dữ liệu và hàm cập nhật bản nháp khỏi `VisualBuilder.jsx` sang `builder-updaters.js`; định dạng lại các file JSX một dòng (`AnalyticsDashboard.jsx`, `ChatChannelSettings.jsx`, `OrderTrackingSettings.jsx`, `ProductSloganDesign.jsx`, `NavbarPanels.jsx`, `ProductContactSettings.jsx`, `PurchaseOptionsSettings.jsx`) để dễ đọc và chỉnh sửa.
- **Kiểm tra:** `npm run check` đạt: 235 bài test Node đạt, `eslint` 0 lỗi, `vite build` và `check-bundles` đạt (JS đầu trang + static imports gzip 137.263 byte, giới hạn 330.000 byte). Chạy 8 bộ Playwright admin/builder/editor (`admin-appearance`, `admin-consistency`, `admin-navigation`, `builder-spacing`, `builder-stability`, `editor-checkout`, `editor-simplification`, `visual-builder-focus`) trên các khổ 320/390/768/1440px: 101 bài đạt, 3 bài bỏ qua theo cấu hình viewport. Đây là kiểm thử trình duyệt giả lập với dữ liệu mẫu, không phải thiết bị thật.
- **Database:** Không thay đổi schema, khóa cấu hình, API, rules hay dữ liệu production; mọi bản nháp và leaf patch khi lưu giữ nguyên định dạng cũ.

## 17/11/2026 — Thiết kế khung xác nhận nhanh bằng icon

- Khung hành động sau đặt đơn chia thành hàng xác nhận nhanh qua icon Facebook/Zalo và hàng chữ Lưu ảnh đơn với nút icon tải xuống. Nút có vùng chạm 44px, tên truy cập/tooltip, trạng thái bận và focus bàn phím; giữ chức năng tải PNG và link liên hệ đã kiểm tra.
- Admin giữ nhãn nút, thêm màu nút tải/nền khung; preview dùng cùng component. Không thay đổi database, API hay dữ liệu production.
- Kiểm tra: 235 test Node, lint/build/bundle đạt; 2 test tải PNG/link/icon/không tràn ngang trên Chromium Android và WebKit iOS đạt. Chưa thử trên điện thoại vật lý.

## 17/11/2026 — Đơn thành công gọn hơn, liên hệ xác nhận và lưu ảnh đơn

- Thu nhỏ chữ/khoảng cách phần thông tin đơn sau đặt hàng. Thêm nút xác nhận qua Zalo/Facebook từ cấu hình liên hệ hiện có; link không hợp lệ hoặc chưa cấu hình không được hiển thị, không tự gửi tin nhắn.
- Nút Lưu ảnh đơn hàng tạo PNG ngay trong trình duyệt, gồm mã đơn, sản phẩm/dung tích/số lượng, người nhận/điện thoại/địa chỉ, phương thức thanh toán và các số tiền. Tiền chưa xác định ghi Xác nhận sau; ảnh ghi rõ đang chờ xác nhận, chưa xác nhận thanh toán. Không gửi dữ liệu ảnh tới dịch vụ ngoài, không thêm thư viện chụp DOM. Có trạng thái tạo ảnh/lỗi và hướng dẫn nơi tải về trên iPhone.
- Admin: Form đặt hàng → Sau khi đặt hàng thành công có chỉnh nhãn hướng dẫn/nút, cỡ chữ thông tin 12–16px và preview nút dùng chung component. Liên hệ lấy Zalo trong contactActions/số footer và Facebook cửa hàng/footer.
- Database: không đổi API, schema, rules hoặc dữ liệu production; các tùy chỉnh dùng cấu hình purchaseOptions hiện có khi admin chủ động lưu.
- Kiểm tra: 235 test Node, lint/build/bundle đạt; 5 test UI tại 390px đạt (checkout/editor và tải PNG), thêm 2 test tải PNG trên WebKit iOS/Chromium Android đạt. Kiểm tra chữ ký file PNG, tên file, ảnh dài đủ chứa địa chỉ nhiều dòng và link liên hệ. Chưa thử tải trên iPhone vật lý.

## 17/11/2026 — Retry kết nối mail và phục hồi lượt gửi bị gián đoạn

- Email đơn hàng thử lại tối đa một lần khi transport xác nhận lỗi kết nối trước khi gửi; chỉ retry nếu lượt đầu không quá 16 giây, dành thời gian ghi kết quả trong giới hạn function. Không retry lỗi xác thực, từ chối SMTP hay kết quả không rõ.
- Khi có yêu cầu gửi tiếp, sending quá 5 phút có timestamp hợp lệ được chuyển sang unknown ở đơn và sự kiện cũ, không gửi lại trong lượt phục hồi. Admin cần kiểm tra Microsoft và xác nhận gửi lại bằng yêu cầu mới. Không có cron quét nền; bản ghi cũ không timestamp vẫn bị chặn để tránh gửi trùng.
- MailWriter cảnh báo nguy cơ gửi trùng khi kết quả cũ chưa rõ. Kết quả lượt cũ không ghi đè trạng thái lượt mới.
- Database: dùng trường/trạng thái hiện có, không migration, không sửa rules/config production; chỉ cập nhật trạng thái gửi qua luồng xử lý đơn được yêu cầu. Không gửi mail thật trong kiểm thử. Cấu hình Exchange/quota cần kiểm tra riêng trên Microsoft.
- Kiểm tra: 235 test Node đạt, gồm retry thành công/giới hạn lượt, không retry kết quả mơ hồ, chặn sending còn hạn và phục hồi sending hết hạn; lint/build/bundle đạt. Test dùng DB trong bộ nhớ và mail giả, không gửi mail hoặc sửa dữ liệu production. Chưa chạy UI trình duyệt cho thay đổi MailWriter.

## 17/11/2026 — Dọn code thanh bên và ổn định khoảng đệm thanh dưới

- Xóa state, effect, JSX, hook kéo và CSS của thanh bên đã bỏ; bỏ tùy chọn preview Safari không còn tác dụng cùng các ngoại lệ nhấn/đóng giỏ dành riêng cho nút bên.
- Dùng chung nhận diện Safari giữa hook hướng cuộn và component; thống nhất loại trừ trình duyệt iOS khác và standalone.
- Giữ khoảng đệm cuối trang khi thanh dưới tạm ẩn, tránh đổi chiều cao nội dung theo hướng cuộn. Giữ nguyên các điều khiển màu/chữ/icon trong admin.
- Database: không đổi dữ liệu, schema, rules hoặc tự lưu cấu hình production; giữ các trường cấu hình cũ để không ảnh hưởng dữ liệu.
- Kiểm tra: 232 test Node, lint/build/bundle đạt (gzip 137.261 byte); 8 test UI thanh dưới và giỏ hàng tại 390px đạt. Bổ sung kiểm tra chiều cao tài liệu không đổi khi Safari ẩn thanh; cập nhật kỳ vọng khoảng đệm luôn được giữ. Chưa thử trên iPhone vật lý.

## 17/11/2026 — Bỏ thanh bên Safari, hiện thanh dưới theo hướng cuộn

- Theo yêu cầu mới, ngừng dùng menu bên trên trang thật và preview, kể cả cấu hình cũ đã chọn kiểu bên; bỏ bộ chỉnh thanh bên trong admin.
- Safari hiện thanh dưới khi cuộn xuống, ẩn khi cuộn lên/ở đầu trang; không chờ vượt hero và không phụ thuộc ước lượng chiều cao toolbar. Giữ bảo vệ bàn phím/zoom và thiết lập màu/chữ/icon của thanh dưới.
- Database: không thay đổi dữ liệu, schema, rules hoặc tự ghi cấu hình production.
- Kiểm tra: 232 test code đạt; lint không có lỗi (còn cảnh báo ref cleanup ở hook kéo cũ), build và giới hạn bundle đạt. 6 test UI thanh dưới tại 390px đạt, gồm hướng cuộn Safari và bàn phím/zoom. Bỏ hai spec menu bên đã ngừng dùng, cập nhật kỳ vọng Safari theo yêu cầu mới. Chưa thử iPhone vật lý.

## 17/11/2026 — Nút tròn nép cạnh Safari, menu gọn và tránh giỏ hàng

- **Yêu cầu:** Nút tròn kiểu nút trợ năng, nép cạnh khi thu gọn, kéo lên/xuống được; menu dọc nhỏ và tự thu khi bấm Giỏ hàng. Khi mở giỏ, nút chuyển xuống dưới khung để không bị che.
- **Giao diện và hành vi:** Menu rộng tối đa 148px, hàng có vùng chạm tối thiểu 44px. Tách mặt nút tròn khỏi vùng chạm; kéo dùng pointer capture và requestAnimationFrame, giới hạn trong viewport, chặn click sau kéo. Giỏ mở sẽ tự thu menu, dành khoảng trống phía dưới cho nút; nút chuyển thành Đóng giỏ hàng. Bỏ qua nút này trong xử lý bấm ngoài của giỏ để tránh đóng rồi bật lại. Android giữ thanh dưới hiện có. Tôn trọng giảm chuyển động và trạng thái bàn phím/zoom.
- **Admin:** Có bật/tắt nép cạnh và kéo nút, nhãn đóng giỏ, giữ chỉnh kích thước/vị trí/tốc độ/màu có sẵn. Preview dùng chung component, đồng bộ chiều rộng menu 148px. Gộp rule kích thước menu để tránh ghi đè CSS trùng.
- **Kiểm tra:** 232 bài Node đạt, lint/build/bundle đạt (gzip JS đầu trang 138.573 byte, dưới 330.000). Bộ 10 bài UI tại 390px đã đạt trước bước gộp CSS; Lượt cuối trên Chromium Android, WebKit iOS và WebKit desktop: 28 bài đạt, 8 bài bỏ qua đúng viewport; kiểm tra thêm giỏ đầy/menu ở 320px đạt. Có ảnh chụp nút thu gọn, menu và giỏ đầy với dữ liệu mẫu. Chưa thử trên iPhone vật lý.
- **Database:** Không sửa API, schema, rules hoặc dữ liệu/config production. Cấu hình mới chỉ lưu khi admin chủ động lưu; vị trí kéo giữ trong phiên trang, không tự ghi database. Test dùng fixture/dữ liệu mẫu, không tạo đơn thật.

# Nhật ký thay đổi ORORA

Ghi mọi lần sửa vào file này, mục mới nhất ở trên. Ngày ghi theo giờ Việt Nam; giữ lại lịch sử cũ. Mỗi mục nêu lý do, thay đổi, file liên quan, kiểm tra và ảnh hưởng đến database. Không ghi mật khẩu, token, khóa API hoặc dữ liệu khách hàng.

## 17/11/2026 — Giọt nước Safari bung menu dọc

- **Yêu cầu:** Đính chính hướng bung: danh sách phải dọc, thay cho bản ngang vừa làm.
- **Giao diện:** Safari droplet dùng một cột, mỗi mục một hàng có icon cạnh chữ, cuộn dọc native khi dài. Đổi chuyển động bung/thu sang trục dọc và vùng sáng theo từng hàng. Giữ một danh sách/sự kiện giỏ/route, thao tác Escape/bấm ngoài, bàn phím/zoom và các điều khiển admin đang có. Nhãn lựa chọn và hướng dẫn trong admin đổi thành Bung dọc, giữ nguyên giá trị config droplet để không phải lưu lại dữ liệu.
- **Khung:** Danh sách tách khỏi nút neo, giới hạn trong viewport theo safe area/dvh (có vh fallback). Dùng ResizeObserver hiện có đo chiều cao nội dung cả viền, nên tên dài/chữ lớn hoặc vị trí neo thấp không đẩy menu khỏi màn hình; không thêm vòng RAF liên tục. CSS ẩn rõ cả danh sách khi một form khác mở.
- **Kiểm tra:** 232 bài Node, lint/build/bundle đạt (entry/static JS gzip 137.878 byte, dưới giới hạn 330.000). 14 bài UI ở 320/390px đạt; ma trận cuối trên Chromium Android, WebKit iOS và WebKit desktop có 18 bài đạt, 6 bài mobile bỏ qua trên desktop. Bổ sung xác nhận từng hàng cùng tọa độ ngang/tăng tọa độ dọc, và khung không tràn viewport với 7 mục tên dài/chữ lớn/neo thấp; vẫn mở/đóng giỏ, điều hướng tra cứu, keyboard/zoom và lưu preview đúng leaf patch. Đã xem ảnh menu dọc. Đây là giả lập trình duyệt, không phải iPhone thật.
- **Database:** Không đổi API, schema, rules hay dữ liệu/config production. Không migration hoặc tự ghi cấu hình; dùng cấu hình hiện tại và luồng lưu admin cũ. Tests dùng fixture/chặn API.

## 17/11/2026 — Safari iPhone dùng giọt nước cạnh màn hình, bung menu ngang

- **Yêu cầu:** Thử thay thanh dưới trên Safari mobile bằng một giọt nước nhỏ ở cạnh màn hình, bấm bung các mục theo hàng ngang để tránh thanh công cụ Safari.
- **Điều hướng:** Safari iOS ở viewport mobile mặc định dùng giọt nước cạnh phải/giữa chiều cao, mở menu ngang bằng transform/opacity. Dùng đúng một danh sách và các link, số giỏ, sự kiện mở giỏ đang có; không nhân đôi nội dung. Bấm lại/bấm ngoài/Escape để thu gọn, link điều hướng đóng menu; giữ menu khi bấm giỏ để còn nút đóng giỏ. Menu đóng có inert/aria-hidden, nút có aria-expanded/controls và trả focus preventScroll khi Escape. Danh sách dài cuộn ngang native, không dùng cử chỉ liquid-swipe của thanh dưới.
- **Safari và viewport:** Chế độ cạnh không phụ thuộc ẩn/hiện thanh công cụ trình duyệt và không chờ dải chữ; vẫn ẩn khi gõ, bàn phím hoặc zoom, trở lại ở trạng thái thu gọn. Không dành khoảng đệm footer/thanh dưới khi dùng giọt nước. Android, Chrome iOS, Safari desktop và standalone giữ cơ chế cũ; có tùy chọn quay lại thanh dưới trên Safari. Có vị trí theo dvh, fallback vh, safe area cạnh phải và giới hạn vị trí; reduced-motion bỏ chuyển động bung/thu.
- **Admin:** Navbar → Thiết lập mục → Thanh điều hướng dưới — mobile có nhóm Safari iPhone: chọn kiểu, lệch cao/thấp, cỡ giọt 44–64px, thời gian bung 200–600ms, nhãn mở/thu gọn và xem thử kiểu Safari. Màu/kính/icon/font của menu dùng cùng cấu hình mobile hiện có. Preview và trang thật dùng MobileShopNav; lưu leaf patch trong navStyles.mobile, giữ height và trường không sửa.
- **Kiểm tra:** 232 bài Node, lint/build/bundle đạt (entry/static JS gzip 137.788 byte, dưới 330.000). 14 bài mới ở 320/390px và 6 bài hồi quy admin đạt. Lượt trình duyệt cart/tra cứu/giọt nước có 26 bài đạt, 7 bài bỏ qua đúng viewport; kiểm tra lại trên mã cuối có 16 bài giọt nước đạt, 5 bài mobile bỏ qua trên desktop. Bao gồm toolbar hiện vẫn thấy giọt, keyboard/zoom ẩn, route cuộn đầu trang, Escape/focus, bấm ngoài, giỏ đóng một lần, admin preview/cỡ/tốc độ và leaf patch. Đã xem ảnh bung menu WebKit iOS; đây là giả lập trình duyệt, chưa xác nhận trên iPhone thật. Các fixture kiểm tra thanh dưới cũ chọn rõ safariLayout=bar để tiếp tục kiểm tra nhánh này, tách với mặc định giọt nước mới. Test tra cứu chờ hoàn tất frame cuộn của route trước khi mô phỏng cuộn tiếp, tránh bấm trong lúc Safari đang thu thanh dưới.
- **Database:** Không đổi API, schema, rules hoặc dữ liệu/config production. Không tự ghi kiểu mới vào database; mặc định áp dụng ở lớp hiển thị và admin chỉ ghi khi chủ động lưu. UI dùng dữ liệu mẫu/chặn API, không tạo đơn/gửi email hoặc chat thật.

## 17/11/2026 — Chỉnh hoa rơi và icon cạnh nút trong admin

- **Yêu cầu:** Thêm chỉnh số lượng/tốc độ hoa rơi và mở chỉnh các icon cạnh nút đang bị cố định trong code.
- **Hoa rơi:** Petals đọc navStyles.surfaces.petals; giữ mặc định 10 cánh/tốc độ 1 khi chưa cấu hình. Admin có bật/tắt, số lượng desktop 0–40/mobile 0–30, tốc độ 0,25–3 lần, kích thước, độ đậm và bảng màu. Dùng hạt giống cố định, không tạo vị trí ngẫu nhiên khi đổi trường; CSS chọn số lượng theo viewport, tối đa 40 node. Có mẫu rơi trong khung riêng, không chặn thao tác, tự ẩn và dừng animation khi prefers-reduced-motion. Trang chủ chờ tải cấu hình trước khi bật để tránh lóe hoa dù đã tắt.
- **Icon:** Bộ chỉnh chung cho 15 vị trí Hero, Xem/giỏ sản phẩm, giỏ navbar, Tư vấn/Đặt hàng, Facebook/TikTok, menu và Tra cứu. Cho chọn icon/màu/kích thước, ẩn icon cạnh chữ hoặc trả về mặc định/màu chữ nút; nút chỉ có icon không bị để trống. Tách SVG gốc vào dữ liệu dùng chung, giữ logo thương hiệu, aria-label, link và hành vi bấm. Không nhận SVG/HTML tùy ý. Sửa flex/margin ở nút mua, giỏ và tra cứu để thay/ẩn/tăng cỡ icon không làm đổi bố cục chữ hay bóp nhỏ SVG.
- **Admin và preview:** Navbar → Thiết lập mục → Hiệu ứng, cánh hoa và icon nút, gồm Cánh hoa rơi — trang chủ và Icon cạnh nút bấm. Mẫu editor, iframe Builder và trang thật dùng chung component/config; ButtonIconProvider không thêm lớp DOM ngoài main. Lưu theo leaf patch, giữ trường tương lai và cài đặt kính không sửa. Dọn dòng log kiểm tra đang chờ còn sót trong mục trước.
- **Kiểm tra:** 232 bài Node, lint/build/bundle đạt (entry/static JS gzip 137.207 byte, dưới giới hạn 330.000); lint chạy lại sau khi bổ sung ảnh chụp đạt. 26 bài UI hoa/icon/thẻ/checkout/tra cứu ở 390/1440px đạt; chạy thêm 4 bài tại 320px đều đạt. Ma trận 42 bài trên Chromium Android, WebKit iOS và WebKit desktop đạt, gồm giữ hiệu ứng nhấn/mở chat đã sửa trước đó. Kiểm tra số lượng theo viewport, tốc độ và node ổn định, reduced-motion, đổi/ẩn icon giữ nhãn và sự kiện thêm giỏ, cỡ SVG không bị flex bóp nhỏ, logo mặc định, preview iframe và leaf patch không gửi trường không sửa. Đã xem ảnh thật phần điều khiển hoa/icon mobile. Đây là trình duyệt giả lập, không phải kiểm tra điện thoại thật.
- **Database:** Không đổi API, schema, rules hoặc dữ liệu/config production; cấu hình mới chỉ ghi khi admin chủ động lưu. Kiểm thử dùng dữ liệu mẫu, chặn API và không gửi đơn/chat/email hoặc upload thật.

## 17/11/2026 — Phản hồi nhấn toàn bộ nút và hiệu ứng mở form chat

- **Yêu cầu:** Bổ sung hiệu ứng khi nhấn toàn bộ nút website/admin và hiệu ứng bật form chat.
- **Nút:** Bỏ rule scale khi nhấn riêng của kính để bật/tắt có hiệu lực thống nhất. Dùng chung button-press.js và ButtonPressFeedback, lắng nghe click ở document để hỗ trợ cả chuột/chạm/bàn phím, nút thêm giỏ có stopPropagation và nút trong iframe Builder. Nhấn xuống nhẹ rồi trở về; chat nảy rõ hơn. Animate individual scale nên giữ transform hover/kéo giãn đang có; hủy lượt cũ khi nhấn liên tục, không cộng dồn. Bỏ qua nút disabled/inert, giữ chặn click khi kéo nút chat. Tự tắt khi prefers-reduced-motion; không thêm vòng đo/RAF liên tục.
- **Mở chat:** ChatChannelChooser và ChatPanel dùng chung useChatEntrance, khung nhỏ đi từ tâm nút chat tới vị trí hoàn chỉnh bằng một hoạt ảnh transform/opacity 420ms mặc định. Chạy trước khi vẽ, hủy khi đóng/unmount và không phát lại khi cập nhật hội thoại. Dùng tọa độ tương đối theo cạnh khung để giữ điểm xuất phát khi font Safari làm đổi chiều cao; giữ focus preventScroll và cơ chế viewport của panel. Chưa thay đổi hoạt ảnh đóng form chat.
- **Admin:** Navbar → Thiết lập mục → Hiệu ứng nút, kính và khung chat có bật/tắt nhấn nút, thời gian 120–500ms, độ nhún 2–10%, cùng bật/tắt mở form chat và thời gian 200–700ms. Có nút nhấn thử và mở thử form; preview và trang thật dùng chung code/config navStyles.surfaces. Lưu theo leaf patch, giữ blur/các thiết lập không liên quan; không có cấu hình nhấn nút trùng ở trang Chat AI.
- **Kiểm tra:** 230 bài Node, lint/build/bundle đạt trên mã cuối (entry/static JS gzip 135.115 byte, dưới giới hạn 330.000). 24 bài hồi quy admin/checkout và 14 bài hành vi ở 390/1440px đạt. Ma trận cuối có 21 bài đạt trên Chromium Android, WebKit iOS và WebKit desktop (giả lập trình duyệt, không phải điện thoại thật): click/Space/Enter, SVG và stopPropagation, nhấn liên tục không cộng hoạt ảnh, giữ transform kéo/hover, tắt hiệu ứng cả khi kính bật, reduced-motion, nguồn mở form/AI và đóng sớm, preview và lưu đúng leaf patch. Test Safari chờ animation.ready trước khi lấy mẫu frame; lỗi font làm lệch tâm nguồn đã được sửa bằng tọa độ tương đối. Không gọi dịch vụ chat thật.
- **Database:** Không đổi API, schema, rules hoặc dữ liệu/config production. Tùy chọn mới chỉ ghi khi admin chủ động lưu; kiểm thử dùng dữ liệu mẫu và chặn API, không tạo đơn/gửi chat hoặc ghi production.

## 17/11/2026 — Làm gọn admin, thanh lưu mobile và đồng bộ giao diện website

- **Yêu cầu:** Rà các điểm rối của admin/Cửa hàng/Builder, chuẩn hóa CSS và sửa các bất hợp lý ở footer, hero, thẻ sản phẩm mobile, thang chữ và form tra cứu. Tiếp tục bảo toàn dữ liệu đã lưu.
- **Admin:** Thay thêm màu/bo góc phổ biến bằng biến --ad-* trong admin.css, admin-theme.css và VisualBuilder.css; giữ màu theo ngữ nghĩa thành công/lỗi. Bỏ nền hồng toàn hàng của tùy chọn được chọn và khi hover, giữ nhãn đậm. Dùng input native role=switch cho cài đặt bật/tắt; danh sách chọn nhiều sản phẩm/email/phương thức thanh toán vẫn là checkbox. Có focus bàn phím, reduced-motion và forced-colors; CSS không áp vào preview khách hàng.
- **Builder mobile:** Tách nhóm hiện/ẩn với nhóm thiết bị/tỉ lệ; danh sách mục thành chip cuộn ngang. Chuyển đúng thanh Lưu tất cả đang có xuống đáy, kèm trạng thái/chấm chưa lưu, không thêm luồng lưu thứ hai. ResizeObserver đo chiều cao thanh lưu và dành khoảng trống tương ứng, kể cả safe area/thông báo lỗi; không dùng vòng đo liên tục. Tab có nút lưu riêng vẫn giữ luồng lưu riêng. Liên kết label Nội dung của Hero với input/textarea để thao tác truy cập được.
- **Website:** Việt hóa đúng nhãn tiếng Anh mặc định của footer và dòng bản quyền mẫu khi hiển thị, dùng chung helper với admin; giữ nội dung tùy chỉnh và giá trị rỗng. Nút phụ Hero có nền sáng đủ đặc/chữ và viền đậm hơn, kể cả chế độ kính; admin chỉnh nền/viền/bo góc và cảnh báo tương phản ước tính dưới 4,5:1 (không thay thế đo trên ảnh thật).
- **Thẻ và chữ:** Mobile mặc định đặt giá trái cùng hàng với giỏ, nút Xem đủ 44px ở hàng dưới cho thẻ hẹp; desktop giữ bố cục riêng. Thêm chỉnh bố cục/căn giá/cỡ giá mobile trong Thiết lập mục Sản phẩm, preview và trang thật cùng đọc productCardStyles.mobileActions; giữ cỡ/font tùy chỉnh cũ khi chưa ghi đè. Bổ sung thang CSS tiêu đề/phụ đề/chú thích; mặc định các tiêu đề dùng chung thang, thiết lập kiểu chữ đã lưu vẫn có ưu tiên. Số thứ tự và mô tả/nút nhỏ mặc định ít nhất 12px, số thứ tự dùng màu đậm hơn.
- **Tra cứu:** Tách CSS tra cứu khỏi product-detail.css sang order-tracking.css dùng chung cho tìm kiếm/chi tiết/preview. Gộp các lớp ghi đè lặp thành bố cục cơ sở và breakpoint theo chức năng, giữ biến cấu hình, nhãn/trạng thái thanh toán và một lớp nền trong modal. Giữ CSS kính toàn website ở mobile-glass.css.
- **Kiểm tra:** 230 bài Node, lint/build/bundle đạt (entry/static JS gzip 133.998 byte, dưới giới hạn 330.000). 84 bài UI admin/Builder/tra cứu/thẻ/menu và 44 bài hồi quy/thanh lưu/footer/cài đặt mobile/hiệu suất đạt ở 320/390/768/1440px; 4 bài bỏ qua đúng viewport. Đã xem ảnh thực tế thanh lưu, công tắc Cửa hàng, thẻ mobile và footer cuối trang. Kiểm tra chặn API xác nhận lưu một trường Hero không gửi footer đã chuẩn hóa hoặc trường cấu hình không liên quan. Thêm 59 bài đạt trên Chromium Android/WebKit iOS/WebKit desktop, 1 bài mobile bỏ qua trên desktop; đây là giả lập trình duyệt, không phải xác nhận trên điện thoại thật.
- **Database:** Không sửa API, schema, rules, migration hoặc dữ liệu/config production; không tự ghi bản dịch/footer hay thang chữ vào database. Cấu hình hiển thị mới chỉ lưu khi admin chủ động nhấn Lưu. Các bài UI dùng dữ liệu mẫu và chặn request, không gửi email/đơn hoặc upload thật.

## 17/11/2026 — Siết Storage, cập nhật audit an toàn, hoàn thiện Builder và cuộn Tra cứu iOS

- **Yêu cầu:** Xử lý báo cáo Storage/dependencies, hoàn thiện chỉnh khoảng cách 4 cạnh và dọn Builder/repo; giữ tiếp lỗi iOS bấm Tra cứu không lên đầu trang. Không có file orora-builder-polish.patch trong các patch hiện có; triển khai trực tiếp các thay đổi được mô tả trên bản main hiện tại, không chép đè bản cũ.
- **Storage:** storage.rules dùng cùng quyền admin claim hoặc adminUsers/{uid}.enabled như Firestore; chỉ admin tạo/sửa ảnh JPEG/PNG/WebP/GIF/AVIF, không rỗng và tối đa 10 MiB. Delete có điều kiện admin riêng. Public read giữ nguyên. Thêm cấu hình/test emulator demo-orora-security và job CI storage-rules (Java 21); kiểm tra quyền user thường/anonymous, admin claim/document, giới hạn/MIME, metadata HTML, delete và ngăn tự cấp quyền. Chi tiết và lệnh triển khai ở docs/SECURITY-2026-11-17.md.
- **Production:** Chủ website cung cấp project ororavn-e6b49. Đã chuẩn bị firebase.storage.json và npm run deploy:storage chỉ nhắm Storage của project này. Thử triển khai non-interactive dừng do Firebase CLI chưa đăng nhập (Failed to authenticate); chưa publish rules hay thử upload thật. Upload của ImageField dùng Cloudinary, không kiểm chứng Storage rules. Không sửa Firestore rules, schema, API hoặc dữ liệu production.
- **Dependencies:** Chạy npm audit fix không dùng --force, cập nhật lockfile trong giới hạn phiên bản hiện có. Audit runtime từ 15 (4 high/11 moderate) còn 12 (4 high/8 moderate). Các chuỗi @grpc/grpc-js/uuid của Firebase chưa hết cảnh báo; không ép major override hoặc nâng major SDK khi chưa kiểm tra tương thích. Firebase CLI và rules-unit-testing chỉ là devDependencies phục vụ kiểm thử rules.
- **Builder:** Dùng SpacingControls chung cho margin/padding đủ trên/phải/dưới/trái, cho margin âm và trả về Mặc định; giữ giá trị cũ khi tải, đổi phần và lưu leaf patch. About section/card image/kiểu chữ dùng cùng điều khiển; About đọc cả 8 thuộc tính ở trang thật. Sửa các wrapper tên khách/icon/nội dung ô để không làm mất giá trị cạnh ngang khi hiển thị lại. Cột mục rộng hơn, nút switch có Đang hiện/Đang ẩn và vẫn giữ aria-checked. Bỏ Story/Ritual/CountUp không còn dùng, gỡ Orora.zip khỏi HEAD và thêm ignore. Thay các màu/bo góc admin phổ biến bằng --ad-*; giữ cấu hình nội dung đã lưu.
- **iOS Tra cứu:** ScrollToTop dùng scroll instant khi đổi route, quản lý history.scrollRestoration để tránh Safari trả vị trí cũ, kiểm tra lại một frame sau khi mở khóa menu và xử lý bấm lại đúng route Tra cứu bằng location.key. Menu trả focus với preventScroll. Cuộn đến hash vẫn giữ hành vi cũ; không thêm vòng RAF liên tục.
- **Kiểm tra:** 228 bài Node, lint/build/bundle đạt (gzip entry/static JS 133.512 byte dưới 330.000). 5 nhóm kiểm thử rules emulator đạt; lỗi proxy localhost được xử lý chỉ trong môi trường chạy emulator, không nới rules. 39 bài UI đạt, 5 bỏ qua theo viewport; thêm 10 lượt Chromium Android/WebKit iOS/WebKit desktop đạt, 2 lượt desktop bỏ qua bài mobile. Có kiểm tra đủ 8 cạnh, giữ draft/leaf patch/preview, trạng thái switch, Builder vừa khung không tải/đo lặp, cuộn từ thanh dưới và menu mobile, bấm Tra cứu lần hai. Đây là giả lập trình duyệt, không phải xác nhận trên iPhone thật. Không gửi email hoặc thao tác dữ liệu thật trong test.

## 16/11/2026 — Đồng bộ toàn bộ điều khiển admin, tích hợp theme từ ZIP

- **Yêu cầu:** Rà giao diện tất cả mục admin, nhất là ô tick, ô nhập, nút bấm và các nhóm chỉnh; tích hợp orora-admin-theme.patch trong files (1).zip cùng ảnh tham chiếu. Patch được đối chiếu và ghép vào mã hiện tại, giữ lịch sử CHANGELOG đang có; không chép các kết quả kiểm tra của patch thành kết quả đã chạy ở repo này.
- **Theme dùng chung:** Thêm src/styles/admin-theme.css qua admin.css để cả đăng nhập, admin chính và Builder dùng cùng bộ biến --ad-*; các biến --a-* cũ trỏ về bộ này, gồm --a-ink. Áp dụng màu hồng/đỏ trầm, nút bo gọn và nút chính màu đặc, menu/tab chọn nền hồng nhạt, checkbox/radio tùy chỉnh theo patch; giữ HTML input thật để dùng được bàn phím. Có trạng thái focus, disabled, readonly, indeterminate và fallback native khi forced-colors.
- **Sửa CSS và bố cục:** Tách input chữ/select/textarea khỏi checkbox/radio/color/range/file để ô tick không bị kéo rộng hoặc mang padding ô chữ. Đồng bộ viền/bo góc/khoảng cách, nhãn Builder 13px, ô chọn có mũi tên; sửa background shorthand cũ làm mất mũi tên. Ô nhập 16px ở màn hình nhỏ hoặc thiết bị cảm ứng để tránh Safari tự zoom. Chỉnh khoảng cách form sản phẩm, thẻ/bảng/thông báo, nút đóng modal đơn và ba tab chi tiết đơn trên điện thoại; giữ bố cục responsive và luồng lưu/bản nhập.
- **Cách ly và dọn code:** Vùng xem trước giỏ, chọn dung tích, tra cứu, chọn kênh chat, form đặt hàng, FAQ và gợi ý theo nhu cầu có data-admin-preview để theme không đổi điều khiển khách hàng. Builder iframe giữ CSS website riêng. Đăng nhập có label/id và autocomplete đúng trường, không đổi xác thực. Bỏ các bản CSS select/input lặp, CSS chuyển Form cũ và Adminextra.css không còn import. Không thay đổi logic giỏ hàng/hoạt ảnh đã sửa trước đó.
- **Kiểm tra:** 228 bài Node đạt; ESLint, build và bundle đạt trên mã cuối; entry/static JS gzip 133.109 byte dưới giới hạn 330.000. Thêm qa/admin-appearance.spec.js dùng màn hình admin thật với dữ liệu mẫu, đi qua đủ 10 menu, các tab sản phẩm/thiết lập chung/chat/email/cửa hàng, modal đơn, đăng nhập; kiểm tra ô chọn không kéo rộng, bàn phím Space/focus, mũi tên dropdown, giữ draft, preview không bị đổi và không tràn ngang; ảnh chụp dùng testInfo.outputPath. Đã xem ảnh thực tế desktop/mobile. Đợt hồi quy rộng có 117 bài đạt, 3 bài bỏ qua theo kích thước màn hình; 4 assertion cũ đòi nút Lưu gradient được cập nhật theo nút màu đặc. Chạy lại 40 bài admin/checkout ở 320/390/768/1440 px đều đạt, gồm các assertion đã đổi. Thêm 18 lượt Chromium Android/WebKit iOS/desktop đạt; sau bước cách ly preview cuối, 4 lượt so sánh trực tiếp checkout/FAQ với CSS website và 9 lượt trình duyệt cho preview/cửa hàng/thiết lập chung đều đạt. Các cấu hình mobile là giả lập trình duyệt, không phải thiết bị thật.
- **Database:** Không đổi API, schema, rules, cấu hình hoặc dữ liệu production. Các test dùng dữ liệu mẫu và chặn request; không gửi email, tải ảnh thật hoặc ghi vào database thật.

## 16/11/2026 — Giỏ hàng đóng ngay khi đang mở không phình thêm một nhịp

- **Lỗi và tái hiện:** Đóng khi hoạt ảnh mở chưa xong có thể chạy ngược qua đoạn spring vượt kích thước đích, làm khung phình thêm trước khi thu. Test mới tại khoảng 70% thời lượng mở thất bại trên bản trước khi sửa: scale tăng từ khoảng 1,00416 lên 1,00519 khi đang đóng. Các kiểm tra cũ chỉ xác nhận điểm đầu/cuối và một animation nên không bắt được chiều tăng này.
- **Sửa:** ModalDialog chụp transform/opacity đang hiển thị, dùng chính animation hiện tại thu liên tục về nguồn với easing không nảy; thời lượng theo phần đã mở, tối thiểu 100ms. Không reset về khung lớn hay phát lại spring khi đóng; giữ nảy lúc mở và giữ frame cuối ẩn đến khi React gỡ. Nếu đóng trước frame mở đầu thì gỡ ngay. Vẫn bỏ qua sự kiện finish chiều mở đến muộn trên WebKit.
- **Dọn luồng dự phòng:** Sự kiện mở thiếu vị trí nguồn dùng nút giỏ đang hiện (hoặc tâm đáy viewport), cùng một luồng WAAPI; bỏ animation CSS đóng riêng bắt đầu từ scale 1 và timer gỡ dự phòng. Không thay đổi chế độ tắt chuyển động hoặc khả năng giữ thanh dưới khi giỏ mở. Cài đặt bật/tắt và thời lượng trong admin giữ nguyên.
- **Kiểm tra:** npm run check đạt 228 bài Node, lint, build và bundle (gzip 133.110 byte, dưới giới hạn 330.000). 20 bài giỏ hàng/chuyển động/toggle tại 390/1440 px đạt; kiểm tra các frame đóng tại 12%, 38%, 70% không đổi vị trí/kích thước ngay lúc chuyển chiều và scale chỉ giảm. Thêm 24 lượt chức năng/motion và 9 lượt liên tục frame trên Chromium Android/WebKit iOS/WebKit desktop đạt (giả lập, không phải thiết bị thật). 9 lượt frame chạy lại sau khi test chờ animation.ready để phép đo Safari không lệch do pause còn pending. ESLint bổ sung cho spec/runtime đạt.
- **Database:** Không sửa API, schema, rules, cấu hình đã lưu hoặc dữ liệu production; chỉ sửa chuyển động giao diện và test.

## 16/11/2026 — Gọn Visual Builder, bỏ Form cũ và gom cài đặt cửa hàng

- **Yêu cầu:** Giảm nhãn trùng, nhiều điều khiển cùng lúc và hai nơi chỉnh cùng nội dung; tìm đúng phần tử và giữ bản nhập khi chuyển mục.
- **Giao diện:** Nhãn có ngữ cảnh phần trang; tách từng tab mô tả/thông số/hướng dẫn và từng nút web/Facebook/TikTok. Có tìm phần tử theo từ khóa tiếng Việt và đường dẫn Trang chủ › phần › phần tử. Nội dung/màu hiện trước, font, biến đổi chữ, giãn dòng và khung nằm trong Nâng cao; giữ các giá trị kiểu chữ của form trước. Hero đọc các kiểu chữ đã chỉnh trong cấu hình.
- **Cửa hàng:** Thêm mục admin chung cho Giỏ hàng, Form đặt hàng, Kênh mua và thanh toán, Tra cứu đơn; các vị trí cũ dẫn đến đúng mục. Trang chủ và Cửa hàng dùng cùng một draft, chuyển mục không mất bản nhập. Giỏ/form dùng Lưu tất cả; kênh mua/tra cứu giữ nút lưu riêng, ẩn thanh lưu chung ở hai mục này để tránh nhầm. Các màn hình chưa dùng được tải trì hoãn.
- **Dọn code:** Bỏ 16 file của Form cũ sau khi đối chiếu khóa trong docs/admin-editor-coverage.md. Giữ tải ảnh lên cho Hero, Câu chuyện, Đánh giá qua ImageField dùng chung, chỉ tải bộ chọn khi mở. Tách defaults/model/payload khỏi VisualBuilder (1.735 xuống 882 dòng), gom 13 trạng thái nội dung vào useBuilderDraft; không nhân đôi draft cho Cửa hàng. Quy trình không còn hiển thị vẫn giữ nguyên dữ liệu đã lưu.
- **Kiểm tra:** npm run check đạt 228 bài Node, lint/build/bundle; entry và static imports gzip 132.967 byte, dưới 330.000. Bộ Chromium toàn bộ đạt 323 bài, 13 bài bỏ qua ở 320/390/768/1440 px trước bước rà cuối tải ảnh/ẩn thanh lưu. Sau bước rà cuối, 8 bài luồng mới ở 390/1440 px và 12 lượt Chromium Android/WebKit iOS/WebKit desktop đều đạt (giả lập trình duyệt, không phải thiết bị thật). Đã xem ảnh chụp mobile và chỉnh ô tìm nhanh đồng bộ bộ điều khiển. Các bài mới kiểm tra tìm kiếm, Nâng cao, sửa từng tab/nút, giữ draft và payload chỉ gồm trường sửa; kiểm tra riêng các luồng cũ giỏ hàng, lưu lỗi/chờ, navigation và chống tràn ngang.
- **Database:** Không sửa API, schema, rules hoặc dữ liệu production; giữ khóa cấu hình, cơ chế leaf patch và nội dung không được chỉnh. Không tải ảnh thật hay ghi dữ liệu production trong kiểm tra.

## 16/11/2026 — Sửa nút giỏ vừa đóng ngoài vừa mở lại popup

- **Nguyên nhân:** Sau khi giữ nút giỏ hiện khi popup mở, pointerup trên nút có thể gọi đóng bên ngoài rồi click lại gọi mở, đổi source và tạo hoạt ảnh mới. Khi tắt motion, popup có thể gỡ ngay ở pointerup rồi mở lại ở click.
- **Sửa:** ModalDialog hỗ trợ selector loại trừ khỏi xử lý bấm ngoài; chỉ ShopCart truyền [data-cart-target]. Nút giỏ desktop chuyển thành bật/tắt; thanh dưới gửi cờ toggle trong sự kiện mở để bấm lần hai đóng một lần, giữ nguyên ý nghĩa mở của các sự kiện không có cờ. Bấm ngoài ở vị trí khác vẫn đóng; nút X/Escape và hoạt ảnh thu về nguồn giữ nguyên. closeCart dùng callback ổn định, listener đọc đúng trạng thái open hiện tại.
- **Kiểm tra:** npm run check đạt 228 bài Node/lint/build/bundle. 14 kiểm tra giỏ/chuyển động ở 390/1440 px đạt. Thêm 6 lượt trên Chromium Android/WebKit iOS/desktop đạt, cả bật và tắt motion: mở bằng nút thật, bấm lại đóng, không tạo animation mở mới, mở lại được và bấm ngoài đóng được. ESLint cho spec/config bổ sung đạt.
- **Database:** Không đổi API, schema, rules hoặc dữ liệu production; cờ toggle chỉ nằm trong sự kiện giao diện, không lưu vào cấu hình hay đơn hàng.

## 16/11/2026 — Tăng tương phản admin và bỏ mock phụ thuộc tên file Vite

- **Yêu cầu:** Sửa các điểm nhỏ đã rà sau bản dọn admin: tương phản, chiều cao sidebar, mock test dễ vỡ và trình bày log.
- **Giao diện:** Tăng màu chữ nhóm/menu phụ từ rgba(58,21,38,0.6) lên 0.7; tiêu đề nhóm trên nền trắng đạt tương phản xấp xỉ 6.07:1. Sidebar thêm height:100dvh sau fallback 100vh; mobile vẫn height:auto và giữ cuộn/menu wrap đã có.
- **Test đăng nhập:** AdminApp lấy auth/onAuthStateChanged/signOut qua module lib/firebaseAuth hiện có, module re-export đúng các hàm SDK Firebase. Test mock module của dự án, bỏ đường dẫn nội bộ node_modules/.vite/deps/firebase_auth.js; thêm kiểm tra nút đăng xuất gọi hàm tương ứng. Không đổi cơ chế đăng nhập thật.
- **Nhật ký:** Thêm khoảng trắng cho các chỗ chữ/số và đơn vị dính nhau trong văn bản log, giữ nguyên các giá trị và đoạn code trong backtick.
- **Kiểm tra:** npm run check đạt 228 bài Node, ESLint, build và bundle; 16 kiểm tra admin ở 320/390/768/1440 px đạt, gồm giữ bản nhập, số đơn chờ, UID, đăng xuất và không tràn ngang.
- **Database:** Không đổi API, schema, rules hay dữ liệu production; không thực hiện các đề xuất lớn như bỏ Form cũ hoặc gom cài đặt cửa hàng trong lượt này.

## 16/11/2026 — Áp dụng bản dọn admin từ tài liệu và sửa responsive menu

- **Yêu cầu:** Chủ website yêu cầu thực hiện sau khi rà files.zip và Orora-thay-doi.md. Chỉ lấy patch admin, giữ các bản sửa giỏ và CI đang có; không chép đè toàn bộ ZIP cũ.
- **Menu và code:** Chia menu thành nhóm Tổng quan, Bán hàng, Giao diện và nội dung, Khách hàng; đổi nhãn Kiểm kho/Xuất danh sách email. Tách OrderBadge, dùng bảng panels thay các khối render lặp nhưng giữ các màn đã mở trong DOM và giữ key/state các luồng email/đơn hàng. UID đặt trong details để vẫn lấy được khi cần cấp quyền.
- **Tổng quan/Builder:** Thay thẻ đếm số tab bằng số đơn chờ từ useOrderNotifications sẵn có. Bỏ khóa philosophyStyle chết, đồng bộ mặc định philosophyLabel/philosophyBody/philosophyAccentCount/philosophyStyles với phần tải dữ liệu.
- **Responsive bổ sung:** Sidebar desktop cuộn riêng để không khuất UID/đăng xuất ở chiều cao 600 px. Kiểm tra phát hiện menu trong patch tràn ngang ở mobile; bổ sung minmax(0,1fr), giới hạn chiều rộng và wrap nhóm/tài khoản, mobile dùng chiều cao tự nhiên.
- **Kiểm tra:** npm run check đạt 228 bài Node, lint/build/bundle; sau chỉnh CSS cuối đã chạy lại lint, build và bundle, gzip 131934 bytes. 14 kiểm tra admin/navigation/inspector ở 390/1440 px đạt; thêm 2 ca tại 320/768 px đạt. Xác nhận 9 nút menu, số đơn chờ, giữ bản nhập qua đổi tab, UID/đăng xuất tới được trên màn hình thấp và không tràn ngang. Dùng tài khoản/dữ liệu giả trong fixture, không đăng nhập hay ghi dữ liệu thật.
- **Bảo toàn:** Giữ nguyên testInfo.outputPath của bản sửa CI 0e76cc0. Những đề xuất bỏ Form cũ, chuyển cài đặt cửa hàng, tách VisualBuilder lớn và xóa ZIP chưa được thực hiện trong lần áp dụng này.
- **Database:** Không đổi API, schema, Firebase rules, hooks dữ liệu hoặc dữ liệu production.

## 16/11/2026 — Sửa Quality checks lỗi đường dẫn ảnh trên GitHub Actions

- **Nguyên nhân:** Run #86 tại commit 9d75980 có check đạt, browser có 294 ca đạt/13 bỏ qua và một ca lỗi ENOENT khi ghi ảnh vào /workspace/work/tracking-detail-after.png. Đường dẫn cục bộ không tồn tại trên GitHub runner; không phải lỗi dữ liệu hoặc thao tác tra cứu.
- **Sửa:** qa/tracking-layout.spec.js dùng testInfo.outputPath('tracking-detail.png') để Playwright tạo thư mục kết quả riêng theo ca/project/runner. Giữ nguyên toàn bộ assertion, không bỏ ca kiểm tra hoặc tăng retry để che lỗi.
- **Kiểm tra:** CI=1 chạy lại ba ca tracking-layout tại 390 px đạt 3/3; ESLint đạt. Xác nhận ảnh thật được tạo trong test-results của ca kiểm tra. Workflow đầy đủ tự chạy lại sau push để xác nhận trên GitHub Actions.
- **Database:** Chỉ sửa bài kiểm tra và log; không đổi ứng dụng, API, schema hoặc dữ liệu production.

## 16/11/2026 — Giữ thanh dưới khi mở giỏ và tránh lóe khung khi đóng

- **Yêu cầu:** Giỏ bị chớp khi tắt; thanh điều hướng dưới phải còn khi mở giỏ.
- **Sửa:** Loại giỏ hàng khỏi selector ẩn thanh dưới/nút giỏ desktop khi dialog mở. Với giỏ modeless, thanh dưới nằm trên lớp nền popup, giữ điều kiện Safari/bàn phím hiện có; các dialog khác và chat vẫn có hành vi cũ. Khi animation thu về nguồn kết thúc, ẩn dialog đồng bộ trước khi React gỡ/cancel animation để tránh lóe lại khung đầy đủ.
- **Khu vực:** ModalDialog.jsx, mobile-shop-nav.css, shop-cart.css, qa/popup-motion.spec.js.
- **Kiểm tra:** npm run check đạt 228 bài Node, lint/build/bundle. 10 kiểm tra giỏ/chuyển động ở 390/1440 px và 8 kiểm tra WebKit iOS/desktop đạt; thêm xác nhận thanh dưới vẫn hiện trong lúc giỏ mở. Chưa đối chiếu trực tiếp trên thiết bị thật.
- **Database:** Không thay API, schema, rules hoặc dữ liệu production.

## 16/11/2026 — Tối ưu tải ảnh, cuộn và tương thích giao diện mobile/trình duyệt

- **Yêu cầu:** Rà giao diện/code lặp, độ mượt, hiệu suất và khả năng thích nghi Android/iOS/trình duyệt, giữ nguyên database.
- **Tải ảnh:** ProductSlideshow chỉ gắn nguồn cho ảnh hiện tại và ảnh kế tiếp khi hiển thị, giữ ảnh đã dùng để tái sử dụng cache. Không tải thêm ảnh khi ngoài màn hình hoặc reduced motion; thao tác chọn ảnh vẫn tải đúng ảnh. Mẫu 6 ảnh trong kiểm tra chỉ yêu cầu 2 ảnh đầu (1 khi reduced motion), thay vì gắn toàn bộ nguồn khi vừa xuất hiện.
- **Cuộn:** BackToTop gom sự kiện theo requestAnimationFrame, cập nhật vòng tiến độ trực tiếp và chỉ đổi trạng thái React khi hiện/ẩn; tính lại khi chiều cao trang thay đổi. ScrollText không đo vị trí ở ngoài màn hình, chỉ cập nhật những từ có trạng thái thay đổi, không cài hiệu ứng cuộn cho preview và đáp ứng thay đổi reduced motion. Kiểm tra 80 sự kiện cuộn không quá 2 lần đọc layout; đoạn chữ ngoài màn hình không có lần đo mới.
- **CSS/responsive:** Bỏ hơn 90 dòng responsive đã bị ghi đè/chồng nhau trong VisualBuilder.css. Bộ chỉnh dùng một bố cục xếp dọc ở <=1000 px, ba cột từ 1001 px, không còn xung đột 901–1000 px. Gộp kiểu navbar giỏ trùng; giữ lề 12 px cho popup giỏ mobile, cho nhóm nút xuống hàng khi thiếu chỗ, giữ ô số lượng 16 px để tránh Safari tự zoom. Đã xem ảnh 320/390 px; nhóm nút 320 px không còn ép nút chi tiết thành hai dòng/tràn.
- **Bàn phím và thanh dưới:** useSafariToolbar xử lý bàn phím/zoom cho mobile Android, iOS browser và standalone. Chỉ input nhập chữ/số, textarea, contenteditable hoặc viewport thu nhỏ mới là điều kiện bàn phím; radio/checkbox/range không ẩn thanh nhầm. Tích lũy hướng cuộn chậm, có fallback khi không hỗ trợ 100lvh, ngắt listener cuộn/viewport và probe ở desktop/preview. Ba regression Android/standalone/radio đã thất bại trước sửa và đạt sau sửa.
- **Modal/WebKit:** ModalDialog đo visualViewport trước khi đo spring, cập nhật theo resize/pan để form còn trong vùng nhìn thấy khi mở bàn phím; không khóa thao tác pinch zoom. Khi popup đã ổn định nhưng viewport đổi, tính lại keyframe trước khi thu về nút. Chặn sự kiện finish của lượt mở bị giao muộn làm đóng sớm. Đặt playbackRate âm và play trên cùng animation để tránh reverse() của WebKit nằm pending ở animation đã kết thúc; giữ cùng đường/vận tốc, reduced motion, bật/tắt/thời gian từ admin. Kiểm tra trước sửa form có đáy826.5 px dù vùng thấy kết thúc458 px; sau sửa nằm trong vùng và cuộn tới được nút tiếp tục.
- **Kiểm tra:** npm run check bản cuối đạt 228 bài Node, ESLint, build và bundle (gzip entry+static imports131919 bytes, dưới 330000). Ma trận giao diện đầy đủ320/390/768/1440 px đạt 292 ca, bỏ12 ca theo điều kiện màn hình. Sau các sửa WebKit cuối, nhóm popup/keyboard/responsive trên Chromium Android và WebKit iOS/desktop đạt 20 ca, bỏ4; kiểm tra bổ sung tại 320 px đạt 8 ca, bỏ1. Ma trận engine cuối đạt 66 ca trên Chromium Android/WebKit iOS/WebKit desktop, bỏ9 ca theo điều kiện màn hình.
- **Tái kiểm tra:** Thêm npm run test:ui:browsers / playwright.browsers.config.js cho Chromium Android, WebKit iOS/desktop và Firefox desktop. Fixture visualViewport dùng getter động, tránh giữ nhầm kích thước trước khi meta viewport có hiệu lực ở chế độ thiết bị thật.
- **Giới hạn:** Chromium/WebKit là engine thật trong môi trường Linux với mô phỏng thiết bị, không phải đo FPS/native toolbar trên máy Android/iPhone thật. Firefox đã thử nhưng môi trường không khởi động được profile, chưa xác minh Firefox. Không công bố điểm Lighthouse/Core Web Vitals hoặc cam kết mọi thiết bị.
- **Database:** Không sửa API, hooks dữ liệu, schema, rules, đơn hàng, giá, tồn kho hay cấu hình production. Không gửi đơn/ghi CMS production trong kiểm tra; fixture dùng dữ liệu minh họa. Không đổi dependency ứng dụng.

## 15/11/2026 — Bỏ điểm khựng hai nhịp khi popup giỏ phóng lên

- **Yêu cầu:** Popup còn khựng như nhảy hai lần; muốn khung nhỏ từ nút giỏ phía dưới phóng lên mượt, nảy nhẹ rồi ổn định.
- **Nguyên nhân đã xác minh:** Các đoạn easing cũ làm khung gần dừng tại mốc 62% (scale .94), sau đó tăng tốc lần nữa để tới scale 1.012. Kiểm tra trên animation thật tái hiện mức đổi vận tốc tại điểm nối 0.180099, vượt ngưỡng 0.1. Không có CSS scale chạy chồng trên đường mở từ nút giỏ.
- **Sửa:** Thay các đoạn easing nối rời bằng một đường spring giảm chấn duy nhất, lấy mẫu 91 keyframe transform/opacity chuẩn. Vị trí và kích thước dùng chung tiến độ; bắt đầu tại tâm nút, chỉ vượt nhẹ khoảng 1.35% một lần rồi về đúng vị trí/kích thước cuối. Không tạo vòng lặp React hoặc JS cập nhật mỗi frame, không phụ thuộc CSS linear(). Giữ reverse cùng animation khi đóng, kể cả đóng giữa lúc mở; giữ thời gian/bật tắt hiệu ứng từ admin và reduced motion.
- **Khu vực:** ModalDialog.jsx, lib/popup-motion.js và qa/popup-motion.spec.js.
- **Kiểm tra:** Regression chuyển động trước sửa thất bại đúng điểm nối; sau sửa đạt. npm run check đạt 228 bài Node, ESLint, build và bundle. 24 kiểm tra trình duyệt ở 320/390/1440 px đạt: vị trí nguồn, chỉ một animation, không tăng tốc lại ở điểm nối cũ, chỉ một lần overshoot, đóng ngược giữa/cuối chuyển động, reduced motion, chọn dung tích/số lượng và cấu hình admin. Đã rà phương trình spring để xác nhận chỉ một đỉnh nảy. Chưa đo trực tiếp FPS trên iPhone Safari thật.
- **Database:** Không sửa API, schema, rules, cấu hình lưu trữ hoặc dữ liệu production.

## 15/11/2026 — Làm mềm popup và thiết kế lại thông tin tra cứu đơn

- **Yêu cầu:** Popup giỏ nảy mượt/đẹp hơn; thông tin và UI track order đẹp, hợp lý.
- **Chuyển động:** Chia đường phóng từ nút thành các đoạn tăng kích thước liên tục, giảm overshoot từ 1.035 xuống 1.012, easing riêng cho từng đoạn và đoạn cuối hạ nhẹ về 1. Vẫn reverse chính chuyển động khi đóng; giữ thời gian chỉnh trong admin, reduced motion và bật/tắt hiệu ứng.
- **Chi tiết đơn:** Tách rõ tình trạng/ngày giờ, sản phẩm đã đặt, thông tin thanh toán và khung chi phí. Tên sản phẩm nổi bật, dung tích/số lượng có hàng riêng; nhãn thanh toán thể hiện đúng dữ liệu; tổng tiền có đường phân cách và điểm nhấn. Đơn hủy không hiện tiến trình giao, số tiền null vẫn báo chờ xác nhận, không tự suy đoán trạng thái hoặc số tiền.
- **Form và admin:** Khôi phục tiêu đề form đang có bộ chỉnh; bổ sung nhãn nội dung chi tiết vào tab Nội dung kết quả, thêm bộ chỉnh chữ tiêu đề nhóm/tên sản phẩm/tổng tiền. Tab Xem trước dùng chung component chi tiết với dữ liệu OW_DEMO được ghi rõ là minh họa; không tra cứu đơn thật. Trang thật đọc các cấu hình tương ứng, giữ các tùy chỉnh cũ.
- **Khu vực:** ModalDialog, OrderTracking/Details/Search, order-tracking-copy, OrderTrackingSettings, product-detail.css và qa/tracking-layout.spec.js.
- **Kiểm tra:** npm run check cuối đạt 228 bài Node, lint, build, bundle. 27 kiểm tra giỏ/checkout/tra cứu/admin ở 320/390/1440 px đạt; sau bổ sung bộ chỉnh chạy lại 15 kiểm tra bố cục và admin đạt, thêm 1 kiểm tra sửa nhãn rồi xem trước ở admin đạt. Đã xem ảnh chi tiết đơn ở 390 px. Kiểm tra tên dài không tràn, đơn hủy, hoàn tiền, số tiền chưa xác nhận và cấu hình chữ được áp dụng.
- **Database:** Không thay API, schema, rules hoặc dữ liệu đơn hàng/production. Các khóa nội dung mới chỉ là fallback giao diện và lựa chọn sẵn trong editor; không ghi cấu hình hay dữ liệu lên production khi làm/kiểm tra.

## 15/11/2026 — Giỏ nảy chậm khi mở, đóng chạy ngược về nút

- **Làm rõ:** Chủ website muốn mở nhỏ từ nút giỏ phía dưới nảy lên giữa, thu về cùng đường; không chỉ kéo dài hiệu ứng thu nhỏ.
- **Sửa:** Giữ animation mở có tọa độ nguồn và chạy reverse chính animation đó khi đóng, kể cả khi đóng giữa lúc mở. Chỉ unmount sau animation kết thúc thay timer 70% thời gian. Không chạy thêm CSS thu nhỏ giữa màn hình khi đã có nguồn. Giỏ có thời gian tối thiểu 650 ms (admin 650–1200 ms), cấu hình cũ thấp hơn được giới hạn lúc hiển thị, không ghi đè database. Nhánh mở bằng sự kiện không có tọa độ giữ fallback và timer riêng. Tôn trọng tắt hiệu ứng/reduced motion.
- **Khu vực:** ModalDialog, ShopCart, CartSettings, shop-cart.css và qa/cart.spec.js.
- **Kiểm tra:** npm run check đạt 228 bài Node, lint, build, bundle. Hai bài giỏ ở 390/1440 px đạt: bấm nút thực tế, kiểm tra animation đóng có playbackRate -1, dialog được gỡ sau chuyển động; chọn dung tích, số lượng và lưu giỏ vẫn đạt.
- **Database:** Không sửa API, schema, rules hoặc dữ liệu production.

## 15/11/2026 — Popup chậm hơn, sửa tra cứu đơn và thanh dưới Safari

- **Yêu cầu:** Popup nảy chậm hơn; form/chi tiết tra cứu đơn lệch, rối; thanh website chỉ hiện khi thanh Safari iPhone thu lại, kéo lên thì ẩn.
- **Popup:** Tăng mặc định 380 ms lên 650 ms, mở rộng mức chỉnh admin đến 1200 ms, giữ giá trị thời gian đã lưu nếu có; không ghi đè cấu hình production.
- **Tra cứu:** Khung chi tiết dùng một lớp nền; bỏ lớp glass lồng bên trong, thêm khoảng đệm rõ. Ngày giờ căn thành hàng; sản phẩm và cách thanh toán dài dùng dòng riêng trên mobile, tiến trình dọc thay hai hàng bị đứt, nhấn tổng tiền. Kế thừa màu và kiểu chữ kết quả đã chỉnh trong admin vào modal. Không thay API hay nội dung đơn.
- **Safari:** Hook useSafariToolbar đo visualViewport so với 100lvh và hướng cuộn, ẩn thanh web khi chrome trình duyệt mở, cuộn lên, ở đầu trang, zoom hoặc ô nhập được focus; chỉ hiện khi viewport mở rộng và không còn điều kiện ẩn. Áp dụng iOS Safari, bỏ qua preview/PWA và trình duyệt khác; giữ điều kiện qua ticker hiện có. Cập nhật inert/aria và khoảng chừa đáy theo trạng thái thanh. Gỡ toàn bộ listener/probe khi unmount.
- **Kiểm tra:** npm run check đạt 228 bài Node, lint/build/bundle. 13 kiểm tra checkout, giỏ, tra cứu và thanh dưới ở 390/1440 px đạt; thêm 8 kiểm tra bố cục và thanh dưới ở 320/390/1440 px đạt (bỏ ca Safari trên desktop). ESLint bổ sung đạt. Đã xem ảnh khung chi tiết ở 390 px, kiểm tra không tràn và không lồng lớp blur. Mô phỏng geometry và UA Safari đạt; chưa xác minh trực tiếp toolbar trên iPhone Safari thật vì trình duyệt không cung cấp sự kiện trạng thái toolbar.
- **Database:** Không thay schema, API, rules hoặc dữ liệu production; không lưu thay đổi cấu hình lên database trong quá trình làm.

## 15/11/2026 — Đúng popup giỏ ở thanh dưới

- **Làm rõ:** Chủ website nói popup giỏ từ thanh điều hướng dưới, không phải chỉ popup chọn dung tích trên card.
- **Sửa:** Thanh dưới truyền tọa độ nút giỏ vào sự kiện mở; ShopCart dùng tọa độ để phóng popup nhỏ từ nút ra giữa, nảy nhẹ. Nút desktop truyền tọa độ tương tự. Bỏ bố cục popup mobile sát đáy; giữ giữa màn hình. Tránh chạy đồng thời hiệu ứng CSS và hiệu ứng theo tọa độ. Giữ cấu hình bật/tắt, thời gian mở và reduced motion.
- **Kiểm tra:** npm run check đạt 228 bài Node/lint/build/bundle. Hai kiểm tra giỏ thực tế tại 390/1440 px đạt, bấm nút hiển thị, xác nhận popup nằm giữa và thao tác số lượng/lưu giỏ hoạt động. Fixture cho hiện thanh dưới trực tiếp để không phụ thuộc điều kiện cuộn qua ticker.
- **Database:** Không thay database, API, schema hoặc dữ liệu production.

## 15/11/2026 — Popup giỏ hàng phóng từ card, nảy nhẹ

- **Yêu cầu:** Popup nhỏ từ card rồi lớn dần ra giữa, cả desktop và mobile; bỏ trượt nguyên khung từ dưới lên.
- **Sửa:** Truyền vị trí/kích thước nút giỏ trên card vào popup chọn dung tích; đo vị trí dialog khi mở và animate translate/scale từ nút đến giữa, vượt nhẹ 1.035 rồi về 1. Popup giỏ hàng phóng nhỏ/lớn thay hiệu ứng trượt dọc. Giữ tùy chỉnh bật/tắt và thời gian mở hiện có trong admin, cập nhật nhãn phù hợp; tôn trọng reduced motion.
- **Khu vực:** ProductCard, ShopCart, CartSelectionDialog, ModalDialog, shop-cart.css và CartSettings.
- **Kiểm tra:** npm run check đạt: 228 bài Node, lint, build, bundle. 8 kiểm tra giỏ hàng/cấu hình ở 390 px và 1440 px đạt; chọn dung tích, số lượng, lưu cấu hình và giỏ hàng hoạt động.
- **Database:** Không đổi API, schema hay dữ liệu production; không thêm trường cấu hình lưu trữ.

## 15/11/2026 — Ổn định preview ở chế độ Vừa khung

- **Yêu cầu:** Visual Builder chớp/giật ở Vừa khung; chế độ 100% không gặp.
- **Sửa:** Đặt iframe tuyệt đối trong khung đã thu tỷ lệ, cắt phần tràn để kích thước thật không làm thay đổi vùng đo. Giữ chỗ thanh cuộn, tắt scroll anchoring ở vùng preview, làm tròn số đo và bỏ số đo 0 khi ẩn. Đồng bộ CSS theo từng stylesheet thay đổi, giữ nguyên các stylesheet còn lại thay vì gỡ/nạp lại toàn bộ.
- **Khu vực:** PreviewFrame.jsx, VisualBuilder.css, qa/builder-stability.spec.js.
- **Kiểm tra:** npm run check đạt (228 bài Node, lint, build, bundle). Kiểm tra trình duyệt 30 tổ hợp phần nội dung/kích thước đạt, không đổi tỷ lệ sau ổn định và không tải lại iframe. Regression cập nhật head giữ CSS đạt; trước sửa test ghi nhận 65 stylesheet bị gỡ. Chưa tái hiện trực tiếp trên trình duyệt của chủ website.
- **Database:** Không đổi database, API, schema hay dữ liệu; chỉ sửa giao diện xem trước admin.

## 15/11/2026 — Rà lại bộ chỉnh Visual Builder và đưa toàn bộ lên main

- **Yêu cầu:** Bộ chỉnh vẫn khó dùng; chủ website yêu cầu đưa toàn bộ các bản sửa lên `main`.
- **Phát hành:** Xác nhận các bản trước vẫn ở PR nháp #1, còn `main` là bản cũ. Sau khi kiểm tra GitHub Actions/Vercel của bản trước đều đạt, đưa toàn bộ lịch sử đã kiểm tra vào `main` bằng fast-forward, không viết lại lịch sử. Những ghi chú “chưa gộp main” ở các mục cũ phản ánh thời điểm của các lần làm việc trước.
- **Bộ chỉnh:** Thêm danh sách “Chọn thành phần cần sửa”, dùng cùng registry với các bộ chỉnh hiện có và hỗ trợ phần tử động như liên kết, số liệu, thẻ ưu điểm/đánh giá. Không còn phải tìm một vùng nhỏ trên preview để mở đúng bộ chỉnh. Có hướng dẫn phân biệt nội dung/giá lấy từ mục Sản phẩm và kiểu hiển thị chỉnh trong builder.
- **Nhóm thuộc tính:** Trong tab Đang chọn, các nhóm cấp đầu là accordion có tên; mặc định mở nhóm đầu và chỉ mở một nhóm chính. Không lồng thêm accordion vào những nhóm đã có sẵn. Các ô nhập vẫn được giữ trong DOM khi thu nhóm, nên không mất bản nhập. Nhóm thiết lập chung và các form ngoài inspector giữ hành vi cũ.
- **Xem trước:** Có chế độ “Vừa khung” / “100% — kích thước thật”. Khi chọn thành phần ở xa, iframe cuộn tới vùng tương ứng; không đổi kích thước viewport mô phỏng desktop/mobile hay nội dung cấu hình.
- **Lưu:** Hiện trạng thái chưa lưu/đang lưu/đã lưu rõ ràng; lỗi lưu không xóa bản nhập. Nếu sửa thêm trong lúc đang chờ phản hồi lưu, trạng thái vẫn báo còn thay đổi chưa lưu. Việc chọn phần tử hoặc đổi tỉ lệ xem không được coi là thay đổi nội dung website.
- **Kiểm tra:** 228 bài Node, ESLint, build và giới hạn bundle đạt. Nhóm 52 kiểm tra giao diện liên quan đạt ở 320/390/768/1440 px; sau tinh chỉnh cuối, chạy lại 12 thao tác mới và đạt 12/12. Kiểm tra chọn trực tiếp logo/giỏ/giá, chỉ một nhóm mở, giữ bản nhập khi đổi thành phần, payload chỉ chứa trường đã sửa, lưu lỗi/thay đổi phát sinh khi chờ lưu, preview 100% không tràn trang; xem lại ảnh chụp desktop/mobile. Đã sửa nhãn của bộ chọn thành phần để liên kết rõ với select.
- **Database:** Chỉ sửa giao diện admin và kiểm tra, không đổi API/server, hooks dữ liệu, schema, Firebase rules, giá, ảnh, tồn kho hoặc đơn hàng. Các bộ chọn, accordion, tỉ lệ xem và chỉ báo lưu là trạng thái phiên giao diện; không ghi thêm cấu hình/database production trong quá trình sửa hoặc kiểm tra.

## 15/11/2026 — Sắp xếp Visual Admin, đồng bộ dung tích và tối ưu form đặt hàng

- **Yêu cầu:** Visual Admin khó tìm/chỉnh, khung tạm tính dư dòng, dung tích chưa chọn sẵn theo giá ngoài danh sách, form đặt hàng có cảm giác chậm.
- **Visual Admin:** Thêm inspector hai tab “Đang chọn” / “Thiết lập mục”; chuyển các thiết lập chung của navbar, bộ sưu tập, chi tiết sản phẩm, Hero và đánh giá ra nhóm riêng. Nhóm chung chỉ dựng sau lần mở đầu; giữ trạng thái đã mở và bản nhập khi chuyển tab. Bấm lại thành phần trên preview trở về tab Đang chọn. Thêm tìm mục, mở rộng panel desktop, bố cục xếp dọc trên màn hình nhỏ, thu phần giãn chữ/lề/độ rộng vào nhóm nâng cao, nối nhãn với ô nhập navbar.
- **Giá và dung tích:** Chọn mặc định dung tích có giá hợp lệ thấp nhất, cùng quy tắc giá đang hiển thị ở danh sách; nếu chỉ báo giá thì dùng dung tích đầu. Lựa chọn dung tích/số lượng đi từ giỏ được ưu tiên. Không đổi `selectedVolumeOption` dùng để kiểm tra nghiệp vụ phía server. Hiện dung tích cạnh giá; tạm tính gọn hơn, chỉ hiện phép nhân đơn giá khi số lượng lớn hơn 1; vẫn có chỉnh đệm/bo góc, màu và chữ trong admin.
- **Form:** Gom thành các phần sản phẩm, người nhận, địa chỉ, thanh toán và tóm tắt; xếp một cột trên điện thoại, ghi chú mở thêm, nút gửi dễ tiếp cận khi cuộn. Tách `OrderFormFields` dùng chung trang thật / preview. Thêm chỉnh tiêu đề/nội dung nhóm, khung và kiểu chữ qua `purchaseOptions` hiện có.
- **Xử lý nhập liệu:** Cache danh sách địa chỉ đã chuẩn hóa trong bộ chọn, hoãn lọc danh sách để ưu tiên ô đang gõ, memo component và callback phù hợp; sửa tìm chữ Đ không dấu và Escape khi danh sách đã đóng. Form từ trang sản phẩm được portal ra ngoài vùng theo dõi hiệu ứng, tránh observer quét lại trang khi nhập địa chỉ. Nạp trước danh sách tỉnh qua cache GET hiện có khi người dùng đưa chuột/focus vào nút đặt hàng.
- **Kiểm tra:** 228 bài Node, ESLint, build và giới hạn bundle đạt. Chạy toàn bộ 208 trường hợp UI: 207 đạt, một bài mới bị chặn bởi thao tác click vào radio đã ẩn trong nhãn; đổi bài kiểm tra sang click nhãn nhìn thấy như người dùng. Chạy lại nhóm Visual Admin/giỏ/form ở 320/390/768/1440 px đạt 40/40, bao gồm trường hợp từng báo lỗi. Kiểm tra thêm nút Lưu khi hover. Đã xem ảnh chụp desktop/mobile; kiểm tra DOM xác nhận gõ tên/tìm địa chỉ trong form không gây mutation ở vùng trang chi tiết. Không coi kiểm tra mock là phép đo độ trễ mạng/server production.
- **Database và nghiệp vụ:** Không ghi database production; không đổi API/server, hooks đọc dữ liệu, Firebase rules, cấu trúc sản phẩm/đơn hàng, giá, tồn kho, phí vận chuyển hoặc dữ liệu ảnh. Request gửi đơn, chống gửi lặp, chờ xác nhận, xử lý lỗi và tính tiền phía server được giữ nguyên. Các kiểm tra đặt hàng dùng mock; cấu hình giao diện chỉ lưu qua luồng admin hiện có khi chủ website bấm Lưu.

## 15/11/2026 — Thu gọn popup chọn dung tích và thêm bộ chỉnh giỏ navbar

- **Yêu cầu:** Popup chọn dung tích quá rộng so với nội dung; giỏ hàng trên navbar chưa có mục tùy chỉnh riêng.
- **Thay đổi:** Tạo `CartSelectionDialog` dùng chung giữa trang thật và admin; popup mặc định rộng 360 px, chiều cao ôm nội dung, giới hạn theo màn hình. Chuyển CSS chọn dung tích/số lượng sang `purchase-selection.css` để có kiểu đúng ngay lần mở đầu từ trang chủ, không phụ thuộc tải trang chi tiết sản phẩm trước đó.
- **Admin:** Thêm `CartSettings` vào Navbar, tách khỏi mục điều hướng mobile; nhấn nút giỏ trong preview để chọn chỉnh. Cho sửa nhãn, icon/số lượng, kích thước, đệm, bo góc, viền, nền và kiểu chữ của nút. Popup chọn dung tích có chỉnh nội dung, chiều rộng desktop/mobile, khoảng cách, màu, bo góc và kiểu chữ; dùng cùng component để xem trước và hiển thị thật.
- **Tương thích:** Giữ các tùy chọn giỏ hàng cũ và kiểu chữ cũ làm giá trị kế thừa; các kiểu mới là trường tùy chọn dưới `navStyles.cart`. Khi lưu, bộ lưu từng phần hiện có chỉ gửi các trường được chỉnh.
- **Kiểm tra:** 226 bài Node, ESLint, build và giới hạn bundle đạt. Đã xác minh 56 trường hợp UI liên quan ở 320/390/768/1440 px: lượt rộng đạt 55/56 trước khi sửa giới hạn chiều rộng mặc định của dialog; sau sửa, chạy lại toàn bộ 12 bài mới và đạt 12/12. Bao gồm chọn dung tích/số lượng, lưu giỏ, chỉnh/xem trước, nhấn giỏ trong iframe, payload chỉ chứa trường đã sửa và trang thật đọc lại tùy chỉnh. Checkout và tra cứu dùng mock, không gửi dữ liệu production.
- **Database:** Không ghi cấu hình hoặc dữ liệu production trong lúc sửa/test, không đổi API, hooks dữ liệu, schema nghiệp vụ hay Firebase rules. Tùy chỉnh chỉ được lưu qua luồng admin hiện có khi chủ website bấm Lưu. Không sửa dữ liệu dung tích, giá, tồn kho, đơn hàng hoặc ảnh.

## 15/11/2026 — Thêm nhật ký chung

- **Yêu cầu:** Lưu lịch sử sửa trong repo để lần sau dễ tiếp tục.
- **Thay đổi:** Tạo `CHANGELOG.md`, thêm quy định cập nhật vào `AGENTS.md` và liên kết từ `README.md`.
- **Kiểm tra:** Đọc lại nội dung, kiểm tra đường dẫn và `git diff --check`. Chỉ sửa tài liệu nên không chạy lại kiểm tra ứng dụng.
- **Database:** Không thay đổi dữ liệu, cấu trúc, quy tắc hoặc luồng đọc/ghi.

## 15/11/2026 — Sửa danh tính commit cho Vercel

- **Vấn đề:** Vercel chặn triển khai vì email tác giả commit không khớp tài khoản GitHub.
- **Thay đổi:** Đặt danh tính Git cục bộ của repo theo tài khoản `BiTi1903`, dùng email GitHub noreply đã được nhận diện trong lịch sử; cập nhật thông tin tác giả commit cuối trên nhánh sửa lỗi. Không đổi nội dung code.
- **Kiểm tra:** GitHub API nhận diện tác giả là `BiTi1903`; nội dung trước/sau giống nhau. Cả hai dự án Vercel chuyển sang đang triển khai tại thời điểm kiểm tra, chưa phải xác nhận triển khai hoàn tất.
- **Database:** Không thay đổi hoặc thực hiện thao tác dữ liệu.

## 15/11/2026 — Rà giao diện và dọn code thừa

- **Vấn đề:** Carousel có thể vượt vùng slide khi bấm Sau liên tục, nhận nhầm cuộn dọc hoặc cử chỉ bị hủy thành yêu cầu chuyển sản phẩm; có CSS và tham số không còn dùng.
- **Thay đổi:** Sửa carousel trong `src/components/Collection.jsx`; gộp CSS giỏ hàng bị ghi đè; bỏ CSS thả tim/badge không dùng, media query admin lặp, props ảnh phụ không được ProductCard đọc, JSX đã comment và SVG mẫu React/Vite.
- **Kiểm tra:** 226 bài Node, ESLint, build và giới hạn bundle đạt. Xác minh 180 trường hợp giao diện qua lượt đầy đủ và các lượt chạy lại: lượt riêng đầy đủ đạt 176/180; sau khi xử lý lỗi môi trường kiểm tra, bài preload đạt 4/4 viewport và nhóm 768 px đạt 45/45. Bổ sung kiểm tra hồi quy carousel; cập nhật kỳ vọng kiểm tra tra cứu theo các biến CSS đã có.
- **Bộ kiểm tra:** Bỏ đường dẫn screenshot chỉ tồn tại cục bộ; dùng `baseURL` được cấu hình thay cho cổng viết cứng trong bài preload.
- **Database:** Giữ nguyên `api/`, `server/`, `src/hooks/`, `src/lib/`, Firestore/Storage rules, cấu hình triển khai và dữ liệu ảnh đã lưu. Kiểm tra dùng dữ liệu giả lập, không gửi đơn hàng/email thật.
- **Tham khảo:** [Báo cáo rà soát](docs/UI-CODE-AUDIT-2026-11-15.md), [PR #1](https://github.com/BiTi1903/Orora/pull/1). Đưa thay đổi lên nhánh riêng, chưa gộp vào `main` trong lần làm việc này.

Các lần rà trước khi lập nhật ký được mô tả trong `docs/`; không dựng lại chi tiết chưa xác minh.
