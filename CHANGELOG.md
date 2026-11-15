# Nhật ký thay đổi ORORA

Ghi mọi lần sửa vào file này, mục mới nhất ở trên. Ngày ghi theo giờ Việt Nam; giữ lại lịch sử cũ. Mỗi mục nêu lý do, thay đổi, file liên quan, kiểm tra và ảnh hưởng đến database. Không ghi mật khẩu, token, khóa API hoặc dữ liệu khách hàng.

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
