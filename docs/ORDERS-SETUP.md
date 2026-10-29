# Đặt hàng website và kênh TikTok/Facebook

## Cấu hình trên admin

Vào **Admin → Sản phẩm → Kênh mua hàng dùng chung**:

- Nhập link HTTPS TikTok Shop và Facebook fanpage/shop. Để trống để ẩn nút tương ứng.
- Chọn phương thức thanh toán cho đơn web: COD hoặc chuyển khoản sau khi xác nhận.
- Bấm **Lưu kênh mua hàng**. Cấu hình này nằm ở `settings/home.shopLinks`, áp dụng cho tất cả sản phẩm và tách khỏi link mạng xã hội ở chân trang.

Trong **Trang chủ → Chi tiết SP**, bấm cụm nút mua hàng để đổi tên nút, màu nền và kiểu chữ. Preview dùng sản phẩm mẫu và không gửi đơn.

## Khách đặt trên website

Mỗi form đặt một sản phẩm với số lượng từ 1–20. Khách nhập họ tên, số điện thoại, địa chỉ, phương thức thanh toán và ghi chú tùy chọn, rồi xác nhận cho shop xử lý thông tin đơn hàng.

Máy chủ kiểm tra sản phẩm đang hiển thị và lấy giá trực tiếp từ Firebase. Giá thay đổi trong lúc khách mở form sẽ yêu cầu khách tải lại trước khi đặt. Giá dạng “Liên hệ” được để chờ báo giá. Tạm tính chưa gồm phí giao hàng; shop liên hệ xác nhận phí giao hàng và thanh toán.

Sau khi gửi, khách nhận mã đơn. Một mã yêu cầu được giữ nguyên trong lần mở form để thử gửi lại sau lỗi mạng không tạo trùng đơn đã nhận. Đơn mới luôn có trạng thái `new` và thanh toán `unpaid`. Chuyển khoản hiện là lựa chọn để shop xác nhận, chưa có cổng thu tiền hoặc xác nhận giao dịch tự động.

## Quản lý đơn

Vào **Admin → Đơn hàng**, xem thông tin người mua, sản phẩm, số lượng, tạm tính, phương thức thanh toán; cập nhật trạng thái xử lý và thanh toán. Chỉ đánh dấu “Đã thanh toán” sau khi kiểm tra tiền thực nhận. Danh sách tải 50 đơn gần nhất mỗi trang, có nút tải thêm.

Máy chủ dùng cấu hình hiện có:

- `FIREBASE_SERVICE_ACCOUNT_JSON` đúng dự án Firebase của website.
- `NEWSLETTER_SITE_ORIGIN` khớp origin của website (hoặc origin localhost khi chạy local).
- `ORDER_ADMIN_UIDS` nếu có; nếu không, dùng danh sách `NEWSLETTER_ADMIN_UIDS` đang cấu hình cho API email.

Đơn lưu trong collection `orders`. Dữ liệu người mua chỉ đọc/cập nhật qua `/api/admin-orders` có xác thực Firebase và kiểm tra UID. Các collection `orders` và `orderRateLimits` không có quyền truy cập công khai trong Firestore Rules hiện tại của repository. Không thêm quy tắc cho phép khách đọc các collection này. `/api/orders` chỉ nhận POST và trả mã đơn/tạm tính; không có API công khai để tra cứu thông tin khách.

Thông tin sản phẩm được chụp tại lúc nhận đơn, nên đổi tên/giá sản phẩm sau này không thay đổi bản ghi của đơn cũ. Các API không gửi email, gọi điện hoặc thu tiền thay shop.
