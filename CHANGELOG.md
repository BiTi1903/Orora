# Nhật ký thay đổi ORORA

Ghi mọi lần sửa vào file này, mục mới nhất ở trên. Ngày ghi theo giờ Việt Nam; giữ lại lịch sử cũ. Mỗi mục nêu lý do, thay đổi, file liên quan, kiểm tra và ảnh hưởng đến database. Không ghi mật khẩu, token, khóa API hoặc dữ liệu khách hàng.

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
