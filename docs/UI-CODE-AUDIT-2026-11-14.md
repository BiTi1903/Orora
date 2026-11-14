# Rà soát giao diện và code — 14/11/2026

Phạm vi: storefront, Visual Builder, biểu mẫu admin, bộ chỉnh nội dung/kiểu chữ và các luồng được kiểm tra tự động. Không ghi vào database thật, thay đổi cấu trúc dữ liệu, API, Firebase rules hoặc cấu hình triển khai.

## Các lỗi đã sửa

- Visual Builder chỉ nạp `navStyles.logo` và `navStyles.link`, bỏ qua cấu hình mobile, giỏ hàng, menu bên và chất liệu kính. Bộ nạp nay giữ nguyên cả các nhánh cấu hình mở rộng. Kiểm tra lưu xác nhận chỉ trường được sửa được đưa vào payload.
- Iframe preview có CSS kính nhưng thiếu cờ bật/tắt và biến chất liệu của trang thật. Preview và storefront nay dùng chung hàm áp dụng cấu hình, bao gồm vị trí lớp kính trên tab thông tin sản phẩm; cấu hình preview không tràn ra admin.
- Preview sản phẩm luôn dựng lưới dù chọn dạng trượt. Preview nay dùng đúng layout đã chọn, dừng autoplay để chỉnh sửa, và tính số cột bằng viewport của iframe. Việc cân chiều cao ảnh chi tiết cũng dùng viewport đó.
- Bộ chỉnh thông số sản phẩm trước đây chỉ có font và cỡ chữ. Nay dùng đầy đủ bộ chỉnh chung: độ đậm, nghiêng, màu, căn chữ, khoảng cách và cỡ chữ mobile.
- Bỏ các ô “About the product”/“Details” không còn được trang thật sử dụng. Giá trị cũ trong cấu hình không bị xóa. Nội dung từng sản phẩm tiếp tục sửa tại Sản phẩm; các tiêu đề nhóm giữ hành vi hiện có.
- Chữ gợi ý tra cứu bị khóa cỡ chữ/giãn dòng bằng `!important`. Bỏ khóa để thiết lập admin có hiệu lực.
- Đồng bộ các biểu mẫu với Visual Builder bằng cách dùng lại bộ chỉnh bộ lọc, hành động card desktop và viền card đánh giá; không tạo một bộ cấu hình thứ hai.
- Tách kích thước chat khỏi nhóm “kính chỉ mobile”, tránh hiểu nhầm phạm vi áp dụng. Bỏ tùy chọn “tiêu đề bảng danh mục” không còn hiển thị ở thanh dưới.
- Nhãn kiểu chữ/căn lề được làm rõ bằng tiếng Việt; nút căn chữ/nghiêng có trạng thái chọn và ô chọn màu có nhãn truy cập.

## Dọn code an toàn

- Gộp chất liệu kính và theo dõi tab thành module dùng chung cho preview/storefront.
- Tách bộ nạp navbar khỏi file Visual Builder để kiểm tra việc giữ cấu hình độc lập.
- Xóa CSS của popup/form bộ lọc đã bỏ và các lớp ghi đè cũ; giữ thanh lọc hai nút giá thấp/giá cao hiện tại.
- Xóa các đoạn JSX đã comment không còn chạy và nhánh xử lý riêng trùng với bộ chỉnh kiểu chữ chung.
- Bỏ điều kiện xử lý nhãn Facebook/TikTok nằm trong vòng lặp màu nền, nơi điều kiện không bao giờ đúng.
- Ổn định callback định vị chat để dependency của effect đầy đủ; không đổi hành vi kéo/thả.
- Bỏ media query mobile lồng trùng. Giữ kính chỉ trên mobile và nền hội thoại AI đặc.

## Kiểm chứng

- Node tests: 219 trường hợp, bao gồm giá, đơn hàng, tra cứu, inventory, lưu từng phần, API và an toàn nghiệp vụ bằng dữ liệu test.
- Playwright: các luồng giao diện tại 320/390/768/1440px, bao gồm bài mới về giữ cấu hình navbar, payload lưu, preview kính/layout và kiểu chữ tra cứu.
- ESLint, production build và giới hạn bundle được kiểm tra riêng.
- Kiểm tra lưu/admin và đặt hàng dùng mock; không gửi đơn, sửa nội dung hay dữ liệu thật.

Kết quả này không thay thế kiểm tra thủ công trên thiết bị thật hoặc xác nhận triển khai Vercel/Firebase production. Không xác nhận kết nối OpenAI thực tế trong đợt rà soát này.
