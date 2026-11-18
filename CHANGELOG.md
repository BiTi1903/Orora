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
