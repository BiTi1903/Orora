# Rà soát UI/UX và code — 10/11/2026

Đã rà các luồng trang chủ/điều hướng, chi tiết sản phẩm, đặt hàng, chat, tra cứu và admin bằng mã nguồn, kiểm tra tự động và trình duyệt cục bộ. Kiểm tra tương tác dùng dữ liệu giả lập, không gửi đơn hay email thật.

## Lỗi đã sửa

| Vấn đề | Thay đổi |
| --- | --- |
| Chuyển mục admin làm mất bản nhập sản phẩm/chat/trang chủ | Giữ các màn hình đã mở trong bộ nhớ; chỉ một màn hình hiện. Giữ cả Visual Builder, form cũ và từng mục form. |
| Builder ẩn vẫn làm đổi khoảng đệm của mục khác | Quy tắc bố cục chỉ tính builder đang hiển thị; các panel ẩn không nhận focus. |
| Nhãn form cũ không liên kết với ô nhập | Bộ Field/ItemCards dùng ID và htmlFor; thêm trạng thái lưu/lỗi cho công cụ hỗ trợ. |
| Đặt hàng chờ vô hạn và khóa popup khi mạng treo | Dừng chờ sau 20 giây, cho thử lại và giữ thông tin cùng mã chống gửi trùng. Thông báo chỉnh được trong phần nút mua hàng. |
| Lỗi đọc dữ liệu bị hiển thị thành “không tìm thấy sản phẩm” | Tách lỗi kết nối có nút thử lại khỏi trường hợp sản phẩm không tồn tại. Chữ/kiểu của khung lỗi chỉnh được ở admin form và Visual Builder. |
| Tin nhắn mới kéo người đang đọc lịch sử xuống cuối | Chỉ theo tin mới khi đang gần cuối, tự gửi tin hoặc bấm thử lại; tôn trọng vị trí đọc cũ. |
| Tiêu đề tab luôn là ORORA dù đã tính đúng tên sản phẩm | Dùng tiêu đề của trang/sản phẩm đã có trong bộ SEO; không đọc catalog ở các trang không cần metadata sản phẩm. |
| Link #shop/#about không đến đúng mục khi dữ liệu tải quá 700ms | Theo dõi mục xuất hiện tối đa 10 giây thay cho ba lần thử ngắn; ngừng canh vị trí nếu người dùng chủ động cuộn. Fragment mã hóa sai không còn làm lỗi trang. |
| Tab bằng bàn phím thoát khỏi menu điện thoại | Giữ vòng Tab/Shift+Tab trong menu đang mở, Escape đóng và trả focus về nút mở. |
| Nút lên đầu trang ẩn vẫn nhận Tab | Loại nút ẩn khỏi thứ tự focus; tôn trọng tùy chọn giảm chuyển động khi cuộn. |
| Bộ sản phẩm bật đọc sau khi tải cấu hình có thể thoáng báo rỗng | Trạng thái loading phụ thuộc lần đọc đã hoàn tất, kể cả hook khởi tạo ở chế độ tắt. |
| Hoạt ảnh trang chủ chạy cả khi yêu cầu giảm chuyển động | Giới hạn timeline GSAP bằng media query; bỏ đoạn hiệu ứng nhắm tới class ảnh About không tồn tại. |

## Code trùng đã xử lý

- Gom ba danh sách font và logic đổi tên font/CSS stack vào `src/lib/typography.js`. Builder và form cũ dùng chung nguồn; Jost, Times New Roman và font đã lưu tiếp tục dùng được.
- Sửa bộ chọn builder để “Mặc định” luôn có sẵn sau khi đổi font; giữ lựa chọn tùy chỉnh cũ.
- Xóa `src/components/SloganSymbol.jsx` vì không còn được import sau khi Slogan chuyển sang chỉ chữ.

## Các phần giữ lại có chủ đích

- Các nhánh chuẩn hóa biểu tượng Slogan cũ và CSS liên quan vẫn giữ để tránh thay đổi dữ liệu/kiểu lịch sử ngoài phạm vi đã kiểm tra. Có thể dọn trong đợt tách CSS riêng cho từng khối.
- Các hàm ngày/giờ và request admin trông tương tự nhưng có cách xử lý lỗi, xác thực và giá trị trống khác nhau. Chưa gộp khi chưa có lợi ích cụ thể.
- Các file `Edit*.jsx` vẫn được dùng qua `import.meta.glob`, không phải code chết.
- Bản nhập admin được giữ trong phiên giao diện đang mở; tải lại trang, đăng xuất hoặc rời admin vẫn cần lưu trước. Chưa thêm lưu nháp bền vững.

## Xác minh và giới hạn

- 204 kiểm tra tự động đạt; ESLint và production build đạt.
- Kiểm tra trình duyệt ở 390px/1440px: chuyển mục giữ bản nhập; builder/form cũ; font/default reset; lỗi đọc và thử lại; phân biệt lỗi với 404; timeout đặt hàng và giữ requestId; chat khi đọc lịch sử; điều hướng bàn phím; link anchor tải chậm; tiêu đề sản phẩm; loading khi bật đọc sản phẩm muộn.
- Chưa xác minh nội dung cụ thể trong Firestore production, tốc độ mạng thực hoặc trạng thái triển khai Vercel từ môi trường cục bộ. Các thay đổi không ghi dữ liệu thật hay gửi tin nhắn cho khách.
