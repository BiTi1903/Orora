# Nhật ký thay đổi ORORA

Ghi mọi lần sửa vào file này, mục mới nhất ở trên. Ngày ghi theo giờ Việt Nam; giữ lại lịch sử cũ. Mỗi mục nêu lý do, thay đổi, file liên quan, kiểm tra và ảnh hưởng đến database. Không ghi mật khẩu, token, khóa API hoặc dữ liệu khách hàng.

## 15/11/2026 — Đúng popup giỏ ở thanh dưới

- **Làm rõ:** Chủ website nói popup giỏ từ thanh điều hướng dưới, không phải chỉ popup chọn dung tích trên card.
- **Sửa:** Thanh dưới truyền tọa độ nút giỏ vào sự kiện mở; ShopCart dùng tọa độ để phóng popup nhỏ từ nút ra giữa, nảy nhẹ. Nút desktop truyền tọa độ tương tự. Bỏ bố cục popup mobile sát đáy; giữ giữa màn hình. Tránh chạy đồng thời hiệu ứng CSS và hiệu ứng theo tọa độ. Giữ cấu hình bật/tắt, thời gian mở và reduced motion.
- **Kiểm tra:** npm run check đạt 228 bài Node/lint/build/bundle. Hai kiểm tra giỏ thực tế tại 390/1440px đạt, bấm nút hiển thị, xác nhận popup nằm giữa và thao tác số lượng/lưu giỏ hoạt động. Fixture cho hiện thanh dưới trực tiếp để không phụ thuộc điều kiện cuộn qua ticker.
- **Database:** Không thay database, API, schema hoặc dữ liệu production.

## 15/11/2026 — Popup giỏ hàng phóng từ card, nảy nhẹ

- **Yêu cầu:** Popup nhỏ từ card rồi lớn dần ra giữa, cả desktop và mobile; bỏ trượt nguyên khung từ dưới lên.
- **Sửa:** Truyền vị trí/kích thước nút giỏ trên card vào popup chọn dung tích; đo vị trí dialog khi mở và animate translate/scale từ nút đến giữa, vượt nhẹ 1.035 rồi về 1. Popup giỏ hàng phóng nhỏ/lớn thay hiệu ứng trượt dọc. Giữ tùy chỉnh bật/tắt và thời gian mở hiện có trong admin, cập nhật nhãn phù hợp; tôn trọng reduced motion.
- **Khu vực:** ProductCard, ShopCart, CartSelectionDialog, ModalDialog, shop-cart.css và CartSettings.
- **Kiểm tra:** npm run check đạt: 228 bài Node, lint, build, bundle. 8 kiểm tra giỏ hàng/cấu hình ở 390px và 1440px đạt; chọn dung tích, số lượng, lưu cấu hình và giỏ hàng hoạt động.
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
- **Kiểm tra:** 228 bài Node, ESLint, build và giới hạn bundle đạt. Nhóm 52 kiểm tra giao diện liên quan đạt ở 320/390/768/1440px; sau tinh chỉnh cuối, chạy lại 12 thao tác mới và đạt 12/12. Kiểm tra chọn trực tiếp logo/giỏ/giá, chỉ một nhóm mở, giữ bản nhập khi đổi thành phần, payload chỉ chứa trường đã sửa, lưu lỗi/thay đổi phát sinh khi chờ lưu, preview 100% không tràn trang; xem lại ảnh chụp desktop/mobile. Đã sửa nhãn của bộ chọn thành phần để liên kết rõ với select.
- **Database:** Chỉ sửa giao diện admin và kiểm tra, không đổi API/server, hooks dữ liệu, schema, Firebase rules, giá, ảnh, tồn kho hoặc đơn hàng. Các bộ chọn, accordion, tỉ lệ xem và chỉ báo lưu là trạng thái phiên giao diện; không ghi thêm cấu hình/database production trong quá trình sửa hoặc kiểm tra.

## 15/11/2026 — Sắp xếp Visual Admin, đồng bộ dung tích và tối ưu form đặt hàng

- **Yêu cầu:** Visual Admin khó tìm/chỉnh, khung tạm tính dư dòng, dung tích chưa chọn sẵn theo giá ngoài danh sách, form đặt hàng có cảm giác chậm.
- **Visual Admin:** Thêm inspector hai tab “Đang chọn” / “Thiết lập mục”; chuyển các thiết lập chung của navbar, bộ sưu tập, chi tiết sản phẩm, Hero và đánh giá ra nhóm riêng. Nhóm chung chỉ dựng sau lần mở đầu; giữ trạng thái đã mở và bản nhập khi chuyển tab. Bấm lại thành phần trên preview trở về tab Đang chọn. Thêm tìm mục, mở rộng panel desktop, bố cục xếp dọc trên màn hình nhỏ, thu phần giãn chữ/lề/độ rộng vào nhóm nâng cao, nối nhãn với ô nhập navbar.
- **Giá và dung tích:** Chọn mặc định dung tích có giá hợp lệ thấp nhất, cùng quy tắc giá đang hiển thị ở danh sách; nếu chỉ báo giá thì dùng dung tích đầu. Lựa chọn dung tích/số lượng đi từ giỏ được ưu tiên. Không đổi `selectedVolumeOption` dùng để kiểm tra nghiệp vụ phía server. Hiện dung tích cạnh giá; tạm tính gọn hơn, chỉ hiện phép nhân đơn giá khi số lượng lớn hơn 1; vẫn có chỉnh đệm/bo góc, màu và chữ trong admin.
- **Form:** Gom thành các phần sản phẩm, người nhận, địa chỉ, thanh toán và tóm tắt; xếp một cột trên điện thoại, ghi chú mở thêm, nút gửi dễ tiếp cận khi cuộn. Tách `OrderFormFields` dùng chung trang thật / preview. Thêm chỉnh tiêu đề/nội dung nhóm, khung và kiểu chữ qua `purchaseOptions` hiện có.
- **Xử lý nhập liệu:** Cache danh sách địa chỉ đã chuẩn hóa trong bộ chọn, hoãn lọc danh sách để ưu tiên ô đang gõ, memo component và callback phù hợp; sửa tìm chữ Đ không dấu và Escape khi danh sách đã đóng. Form từ trang sản phẩm được portal ra ngoài vùng theo dõi hiệu ứng, tránh observer quét lại trang khi nhập địa chỉ. Nạp trước danh sách tỉnh qua cache GET hiện có khi người dùng đưa chuột/focus vào nút đặt hàng.
- **Kiểm tra:** 228 bài Node, ESLint, build và giới hạn bundle đạt. Chạy toàn bộ 208 trường hợp UI: 207 đạt, một bài mới bị chặn bởi thao tác click vào radio đã ẩn trong nhãn; đổi bài kiểm tra sang click nhãn nhìn thấy như người dùng. Chạy lại nhóm Visual Admin/giỏ/form ở 320/390/768/1440px đạt 40/40, bao gồm trường hợp từng báo lỗi. Kiểm tra thêm nút Lưu khi hover. Đã xem ảnh chụp desktop/mobile; kiểm tra DOM xác nhận gõ tên/tìm địa chỉ trong form không gây mutation ở vùng trang chi tiết. Không coi kiểm tra mock là phép đo độ trễ mạng/server production.
- **Database và nghiệp vụ:** Không ghi database production; không đổi API/server, hooks đọc dữ liệu, Firebase rules, cấu trúc sản phẩm/đơn hàng, giá, tồn kho, phí vận chuyển hoặc dữ liệu ảnh. Request gửi đơn, chống gửi lặp, chờ xác nhận, xử lý lỗi và tính tiền phía server được giữ nguyên. Các kiểm tra đặt hàng dùng mock; cấu hình giao diện chỉ lưu qua luồng admin hiện có khi chủ website bấm Lưu.

## 15/11/2026 — Thu gọn popup chọn dung tích và thêm bộ chỉnh giỏ navbar

- **Yêu cầu:** Popup chọn dung tích quá rộng so với nội dung; giỏ hàng trên navbar chưa có mục tùy chỉnh riêng.
- **Thay đổi:** Tạo `CartSelectionDialog` dùng chung giữa trang thật và admin; popup mặc định rộng 360px, chiều cao ôm nội dung, giới hạn theo màn hình. Chuyển CSS chọn dung tích/số lượng sang `purchase-selection.css` để có kiểu đúng ngay lần mở đầu từ trang chủ, không phụ thuộc tải trang chi tiết sản phẩm trước đó.
- **Admin:** Thêm `CartSettings` vào Navbar, tách khỏi mục điều hướng mobile; nhấn nút giỏ trong preview để chọn chỉnh. Cho sửa nhãn, icon/số lượng, kích thước, đệm, bo góc, viền, nền và kiểu chữ của nút. Popup chọn dung tích có chỉnh nội dung, chiều rộng desktop/mobile, khoảng cách, màu, bo góc và kiểu chữ; dùng cùng component để xem trước và hiển thị thật.
- **Tương thích:** Giữ các tùy chọn giỏ hàng cũ và kiểu chữ cũ làm giá trị kế thừa; các kiểu mới là trường tùy chọn dưới `navStyles.cart`. Khi lưu, bộ lưu từng phần hiện có chỉ gửi các trường được chỉnh.
- **Kiểm tra:** 226 bài Node, ESLint, build và giới hạn bundle đạt. Đã xác minh 56 trường hợp UI liên quan ở 320/390/768/1440px: lượt rộng đạt 55/56 trước khi sửa giới hạn chiều rộng mặc định của dialog; sau sửa, chạy lại toàn bộ 12 bài mới và đạt 12/12. Bao gồm chọn dung tích/số lượng, lưu giỏ, chỉnh/xem trước, nhấn giỏ trong iframe, payload chỉ chứa trường đã sửa và trang thật đọc lại tùy chỉnh. Checkout và tra cứu dùng mock, không gửi dữ liệu production.
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
- **Kiểm tra:** 226 bài Node, ESLint, build và giới hạn bundle đạt. Xác minh 180 trường hợp giao diện qua lượt đầy đủ và các lượt chạy lại: lượt riêng đầy đủ đạt 176/180; sau khi xử lý lỗi môi trường kiểm tra, bài preload đạt 4/4 viewport và nhóm 768px đạt 45/45. Bổ sung kiểm tra hồi quy carousel; cập nhật kỳ vọng kiểm tra tra cứu theo các biến CSS đã có.
- **Bộ kiểm tra:** Bỏ đường dẫn screenshot chỉ tồn tại cục bộ; dùng `baseURL` được cấu hình thay cho cổng viết cứng trong bài preload.
- **Database:** Giữ nguyên `api/`, `server/`, `src/hooks/`, `src/lib/`, Firestore/Storage rules, cấu hình triển khai và dữ liệu ảnh đã lưu. Kiểm tra dùng dữ liệu giả lập, không gửi đơn hàng/email thật.
- **Tham khảo:** [Báo cáo rà soát](docs/UI-CODE-AUDIT-2026-11-15.md), [PR #1](https://github.com/BiTi1903/Orora/pull/1). Đưa thay đổi lên nhánh riêng, chưa gộp vào `main` trong lần làm việc này.

Các lần rà trước khi lập nhật ký được mô tả trong `docs/`; không dựng lại chi tiết chưa xác minh.
