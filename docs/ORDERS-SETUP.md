# Đặt hàng website và kênh TikTok/Facebook

## Cấu hình trên admin

Vào **Admin → Sản phẩm → Kênh mua hàng dùng chung**:

- Nhập link HTTPS TikTok Shop và Facebook fanpage/shop. Để trống để ẩn nút tương ứng.
- Chọn phương thức thanh toán cho đơn web: COD hoặc chuyển khoản sau khi xác nhận.
- Bấm **Lưu kênh mua hàng**. Cấu hình này nằm ở `settings/home.shopLinks`, áp dụng cho tất cả sản phẩm và tách khỏi link mạng xã hội ở chân trang.

Trong **Trang chủ → Chi tiết SP**, bấm cụm nút mua hàng để đổi tên nút, màu nền và kiểu chữ. Preview dùng sản phẩm mẫu và không gửi đơn.

## Khách đặt trên website

Mỗi form đặt một sản phẩm với số lượng từ 1–20. Khách nhập họ tên, số điện thoại, email nhận xác nhận đơn, địa chỉ, phương thức thanh toán và ghi chú tùy chọn, rồi xác nhận cho shop xử lý thông tin đơn hàng.

Máy chủ kiểm tra sản phẩm đang hiển thị và lấy giá trực tiếp từ Firebase. Giá thay đổi trong lúc khách mở form sẽ yêu cầu khách tải lại trước khi đặt. Giá dạng “Liên hệ” được để chờ báo giá. Tạm tính chưa gồm phí giao hàng; shop liên hệ xác nhận phí giao hàng và thanh toán.

Sau khi gửi, khách nhận mã đơn. Một mã yêu cầu được giữ nguyên trong lần mở form để thử gửi lại sau lỗi mạng không tạo trùng đơn đã nhận. Đơn mới luôn có trạng thái `new` và thanh toán `unpaid`. Chuyển khoản hiện là lựa chọn để shop xác nhận, chưa có cổng thu tiền hoặc xác nhận giao dịch tự động.

## Quản lý đơn

Vào **Admin → Đơn hàng** để xem danh sách gọn. Bấm **Xem đơn** để mở đủ thông tin người mua, sản phẩm, số lượng, tạm tính, phương thức thanh toán và lịch sử email. Có ô xác nhận nhanh trong danh sách, các trạng thái xử lý và ô đánh dấu thanh toán trong chi tiết. Chỉ đánh dấu “Đã thanh toán” sau khi kiểm tra tiền thực nhận. Danh sách tải 50 đơn gần nhất mỗi trang, có nút tải thêm.

Máy chủ dùng cấu hình hiện có:

- `FIREBASE_SERVICE_ACCOUNT_JSON` đúng dự án Firebase của website.
- `NEWSLETTER_SITE_ORIGIN` khớp origin của website (hoặc origin localhost khi chạy local).
- `ORDER_ADMIN_UIDS` nếu có; nếu không, dùng danh sách `NEWSLETTER_ADMIN_UIDS` đang cấu hình cho API email.

Đơn lưu trong collection `orders`. Dữ liệu người mua chỉ đọc/cập nhật qua `/api/admin-orders` có xác thực Firebase và kiểm tra UID. Các collection `orders` và `orderRateLimits` không có quyền truy cập công khai trong Firestore Rules hiện tại của repository. Không thêm quy tắc cho phép khách đọc các collection này. `/api/orders` chỉ nhận POST và trả mã đơn/tạm tính; không có API công khai để tra cứu thông tin khách.

Thông tin sản phẩm được chụp tại lúc nhận đơn, nên đổi tên/giá sản phẩm sau này không thay đổi bản ghi của đơn cũ. Các API không gọi điện hoặc thu tiền thay shop.

## Email xác nhận đơn

Đơn mới yêu cầu email hợp lệ và tự gửi thư xác nhận đã nhận yêu cầu đặt hàng qua cấu hình Microsoft mailer hiện có trong `docs/EMAIL-SETUP.md`. Không tự đánh dấu đơn đã xác nhận hoặc đã thanh toán. Đơn cũ không bị thay đổi; đơn thiếu email không thể gửi thư từ admin.

Vào **Admin → Email marketing → Thư xác nhận đơn hàng** để sửa mẫu thư, chèn biến thông tin đơn và gửi lại cho email đã lưu trong đơn. Lưu mẫu trước khi gửi. Mẫu được lưu riêng ở `newsletterSettings/orderConfirmation`, không ghi đè mẫu chào mừng người đăng ký nhận tin. Khách đặt hàng không tự được thêm vào danh sách email marketing.

Lịch sử tại `orders/{id}/mailEvents` lưu người nhận, nội dung đã gửi, thời gian, gửi tự động/thủ công và kết quả. “Microsoft đã nhận” chỉ là hệ thống gửi đã chấp nhận, chưa bảo đảm phát tới hộp thư khách. Nếu gửi thất bại, đơn vẫn được lưu. Yêu cầu đặt lại do lỗi mạng không gửi trùng thư tự động. Kết quả chưa rõ hoặc đang xử lý sẽ chặn gửi lại để tránh trùng; cần đối chiếu thư đã gửi trên Microsoft. Khi gửi lại thư đã được Microsoft nhận, admin phải xác nhận.

## Thanh toán và thống kê theo email

Danh sách đơn hiển thị **Thanh toán khi nhận hàng (COD)** cho đơn COD chưa thu tiền; đơn chuyển khoản chưa được admin đánh dấu nhận tiền hiển thị **Chưa thanh toán**. Cả hai hiện **Đã thanh toán** khi admin tích ô xác nhận nhận tiền hoặc chọn trạng thái **Hoàn tất**. Chuyển khỏi Hoàn tất không tự bỏ ghi nhận thanh toán; admin điều chỉnh bằng ô thanh toán. Đơn đã hoàn tất trước thay đổi này không bị tự sửa hàng loạt: tích ô thanh toán nếu đã nhận tiền. Phương thức `paymentMethod` của đơn luôn được giữ riêng, không bị đổi khi cập nhật thanh toán.

Trong **Đơn hàng → Khách hàng theo email**, hệ thống tải tất cả các trang đơn để tổng hợp số đơn, tổng tạm tính, số tiền đã thanh toán và chưa thu theo email (không phân biệt hoa thường). Có tìm kiếm khách hàng và nút mở các đơn của email đó. Số đơn gồm đơn hủy, nhưng cột tiền loại đơn hủy, chưa tính phí giao hàng và không cộng đơn chờ báo giá. Đơn cũ thiếu email được báo số lượng riêng; không sửa dữ liệu cũ để tự gán người mua. Đây là thống kê đơn hàng, không phải báo cáo doanh thu hay đối soát thanh toán.
