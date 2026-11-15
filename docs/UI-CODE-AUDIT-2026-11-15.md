# Rà giao diện và dọn code — 15/11/2026

## Phạm vi và dữ liệu

Rà mã nguồn giao diện cửa hàng, các CSS liên quan và bộ kiểm tra giao diện/admin hiện có. Chạy trên bản sao cục bộ với mock trong `qa/` và dữ liệu test trong `tests/`; không chạy công cụ migration, backup/restore, cấp quyền, gửi mail hoặc đặt đơn thật.

Không sửa API, hook đọc dữ liệu, mã ghi dữ liệu, cấu trúc cấu hình, Firestore/Storage rules, nội dung/sản phẩm đã lưu hay cấu hình triển khai. Các lựa chọn chỉnh giao diện trong admin và dữ liệu ảnh gốc giữ nguyên. Các sửa lỗi thao tác dùng các thiết lập carousel đã có, không thêm trường cấu hình mới.

## Sửa lỗi

- Carousel: chặn bước tiến khi đã tới đoạn clone cuối và đang chờ đưa vị trí về đầu. Trước đây bấm nút Sau nhiều lần trong 820 ms có thể làm index vượt số slide, để trống khung và không còn thẻ tương tác.
- Carousel: nhận diện hướng kéo trước khi kéo ngang. Cuộn dọc trên màn hình cảm ứng không còn kéo lệch hoặc chuyển sản phẩm.
- Carousel: tách hủy cử chỉ (`pointercancel`) khỏi thả tay (`pointerup`), đồng thời khôi phục trạng thái kéo. Trình duyệt hủy cử chỉ không còn được hiểu là yêu cầu chuyển sản phẩm.

## Dọn phần thừa

- Bỏ CSS badge, nút thả tim và keyframes heartPop: không có component nào dựng chúng.
- Gộp các khai báo bố cục, kích thước, chữ của dòng giỏ hàng về giá trị cuối đang có hiệu lực. Bỏ các vị trí nút giỏ desktop trên mobile vốn bị `display:none!important` vô hiệu hóa. Giữ nguyên kính, chuyển động popup và bộ chỉnh admin.
- Bỏ bản sao media query của bộ lọc lịch sử email; giữ bản cuối nằm sau các ghi đè desktop.
- Bỏ props image2…image6 ở nơi gọi ProductCard vì component chỉ nhận image. Không xóa dữ liệu ảnh phụ hoặc ảnh trong chi tiết sản phẩm.
- Bỏ JSX Ritual đã comment và hai SVG mẫu React/Vite không được tham chiếu.

## Kiểm tra

- Bổ sung kiểm tra hồi quy bấm Sau nhanh, cuộn dọc, hủy kéo ngang và kéo ngang hợp lệ tại 320/390/768/1440 px.
- Cập nhật kỳ vọng cũ của bài kiểm tra giao diện tra cứu để bao gồm hai biến CSS formPadding/fieldHeight đã có trong commit trước; thêm kiểm tra giới hạn giá trị. Không thay đổi code tra cứu hoặc cấu hình đã lưu để làm bài kiểm tra đạt.
- Chạy `npm run check` (Node tests, ESLint, build, bundle budget) và toàn bộ `npx playwright test --workers=4` trên bản cuối. Kết quả được ghi trong mô tả PR.

## Giới hạn

Các luồng UI dùng dữ liệu mock. Không khẳng định đã kiểm tra toàn bộ nội dung đang lưu ở production, mọi thiết bị thật hoặc các dịch vụ bên ngoài. Chỉ xóa phần đã xác nhận không được dùng/không có hiệu lực; giữ các nhánh tương thích cấu hình cũ và các form admin tải qua import động.
