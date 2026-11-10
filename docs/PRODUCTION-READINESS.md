# Kiểm tra vận hành ORORA — 10/11/2026

Cập nhật tối ưu theo báo cáo PageSpeed và số đo bundle mới: [PAGESPEED-2026-11-10.md](PAGESPEED-2026-11-10.md).

Phạm vi người dùng chọn: 1 (mua hàng), 3 (điện thoại), 4 (tốc độ), 5 (quản trị/dữ liệu), 6 (SEO). Không thêm nội dung chính sách kinh doanh thuộc mục 2.

## Trạng thái

| Mục | Đã thực hiện trong repo | Chưa xác minh trên production |
| --- | --- | --- |
| 1. Mua hàng | Kiểm tra lựa chọn, giá/ship thay đổi, đơn trùng, giữ tồn, lỗi, timeout, email qua unit/integration với DB giả lập; kiểm tra form, phản hồi thành công và thử lại qua trình duyệt. | Đơn thật → Firestore thật → gửi/nhận email thật → tra cứu thật. |
| 3. Điện thoại | Bộ Playwright tại 320/390/768/1440px: đặt hàng, tra cứu/phân trang/popup, điều hướng và form admin không tràn ngang. | Thiết bị iOS/Android thật, bàn phím hệ thống, cấu hình và ảnh thực tế của cửa hàng. |
| 4. Tốc độ | Chia tải chi tiết sản phẩm/tra cứu theo route; ảnh slideshow dưới trang dùng lazy/async; ảnh Hero Cloudinary giới hạn độ rộng và ưu tiên tải. | Core Web Vitals, máy chủ khởi động nguội, Firestore và tốc độ mạng di động thật. |
| 5. Quản trị/dữ liệu | Cảnh báo chưa lưu/đang lưu; kiểm tra trước đăng xuất/hủy sản phẩm; công cụ export/preview restore; rules chỉ admin được ghi; CI và HTTP checker. | Cấp UID admin, triển khai/kiểm thử rules Firebase, lịch backup/retention, storage bảo mật, diễn tập khôi phục và cảnh báo lỗi Vercel. |
| 6. SEO | Kiểm tra title/canonical/sitemap/noindex/metadata/schema; giá dùng parser chung; không tự gán nhà sản xuất ORORA. HTTP checker kiểm tra các đường dẫn liên quan. | Search Console/quyền sở hữu, trạng thái index, rich-result ngoài Google, metadata của bot không chạy JS. |

Không đánh dấu production đã đạt: proxy của môi trường chặn CONNECT tới `ororavn.com` bằng403 (curl56/HTTP000). Runtime không có secret/outbound identity được cấu hình. Không có đơn/email thật được tạo trong đợt này. Lệnh kiểm tra HTTP không tạo đơn, không chạy analytics JS, không xác thực và không gửi mail.

## Lệnh kiểm tra lặp lại

```sh
npm ci
npm run check
# Cài Chromium một lần nếu máy chưa có browser Playwright:
npx playwright install chromium
npm run test:ui
npm run check:production -- https://ororavn.com
```

`check` chạy unit/integration, ESLint, production build và giới hạn entry JS (raw≤1100000bytes, gzip≤330000bytes) để phát hiện tăng kích thước ngoài dự kiến; đây không phải đo tốc độ mạng. `test:ui` dùng dữ liệu giả lập trên Vite cục bộ; không được đổi baseURL sang website thật. GitHub Actions chạy hai nhóm kiểm tra mỗi push/PR; khi lỗi, giữ trace/ảnh kiểm tra7ngày. Đây là kiểm tra cập nhật, chưa thay thế giám sát production. HTTP checker ghi status, TTFB và tổng thời gian; không ghi body hay thông tin khách. Nó không chứng minh checkout hay SEO sau khi JavaScript chạy.

### Số đo build, không phải số đo tốc độ website thật

Entry JS trước thay đổi:1013.11kB, gzip318.67kB. Sau chia route:946.58kB, gzip298.66kB (giảm khoảng66.5kB, gzip20kB). Chi tiết sản phẩm50.78kB và tra cứu7.51kB được tải khi cần. Firebase/GSAP vẫn chiếm phần đáng kể; build còn cảnh báo chunk lớn. Chưa có điểm Lighthouse/PSI được đo, không dùng số build để kết luận LCP hay thời gian DB. Mục tiêu cần đo thực: LCP≤2.5s, INP≤200ms, CLS≤0.1.

## Cảnh báo bản nhập

Sản phẩm, Chat AI, Visual Builder, các form Trang chủ, chữ tra cứu và các nhóm kênh mua hàng/cam kết/Slogan/chăm sóc/nhu cầu/FAQ đăng ký bản nhập chưa lưu. Cảnh báo hệ thống khi tải lại/đóng trang; đăng xuất hỏi trước nếu còn bản nhập. Hủy sản phẩm chỉ hỏi khi có thay đổi. Không ghi nháp hay dữ liệu khách vào localStorage. Lưu thất bại giữ cảnh báo; chỉ xác nhận máy chủ thành công mới xóa trạng thái bẩn. Cảnh báo không thay thế việc lưu; không bảo đảm giữ dữ liệu khi trình duyệt/thiết bị bị tắt đột ngột. Các màn hình khác như soạn thư/phí ship chưa gắn guard riêng.

## Quan trọng: di chuyển quyền Firebase trước khi áp dụng rules mới

`firestore.rules` trong repo đã được siết, nhưng KHÔNG được triển khai trong đợt này. Rules cũ trong repo cho mọi tài khoản đã đăng nhập ghi sản phẩm/cấu hình; chưa đọc được rules thực tế của Firebase. **Không triển khai rules mới trước khi chủ tài khoản đã được cấp quyền**, nếu không việc lưu từ admin sẽ bị từ chối.

1. Trên máy chủ/trạm quản trị đáng tin cậy, cấu hình `FIREBASE_SERVICE_ACCOUNT_JSON` đúng project; không đưa nội dung khóa vào repo/chat.
2. Dùng UID hiện hữu của chủ website, thống nhất với `ORDER_ADMIN_UIDS`/`NEWSLETTER_ADMIN_UIDS` của API:

```sh
# Kiểm tra user/project, chưa ghi:
node scripts/grant-admin.mjs --project PROJECT_ID --uid OWNER_UID
# Chỉ sau khi kiểm tra đúng UID/project:
node scripts/grant-admin.mjs --project PROJECT_ID --uid OWNER_UID --apply
```

3. Rules công nhận custom claim `admin:true` hoặc `adminUsers/UID.enabled:true`. Client không được tự cấp quyền trong `adminUsers`. Server-only collections (orders, inventory, mail, analytics…) tiếp tục không đọc/ghi qua client. Public chỉ đọc sản phẩm và home/productCategories.
4. Kiểm thử bằng Firebase emulator/staging: admin được lưu; tài khoản khác/khách không ghi; không đọc được dữ liệu khách. Sau đó mới triển khai bằng Firebase CLI/Console. Push Vercel/Git không triển khai Firestore Rules. Kiểm thử emulator và bước triển khai còn chờ quyền/môi trường.

## Sao lưu và khôi phục Firestore

```sh
# Read-only export, tên file mới không được trùng:
npm run backup:firestore -- export --project PROJECT_ID --file .backups/DATE.firestore-backup.json
# Xác minh SHA-256, path, mọi kiểu dữ liệu; không ghi, không cần credential để preview:
npm run backup:firestore -- restore --project PROJECT_ID --file .backups/DATE.firestore-backup.json
# Chỉ chạy trên môi trường bảo trì sau khi đã kiểm tra bản sao:
npm run backup:firestore -- restore --project PROJECT_ID --file .backups/DATE.firestore-backup.json --apply
```

Export duyệt cả subcollection, kể cả cha không có document; giữ Timestamp/GeoPoint/reference/bytes. File quyền0600, thư mục mới0700; `.backups/` và đuôi backup bị Git bỏ qua. Công cụ không chứa hoặc export khóa tài khoản dịch vụ. Project của credential/backup/CLI phải khớp; restore mặc định chỉ preview và kiểm tra toàn bộ dữ liệu trước ghi. File≤64MiB,≤100000documents; database lớn dùng managed export.

Giới hạn cần hiểu trước restore: đây là bản sao document đọc lần lượt, không phải snapshot nhất quán theo một thời điểm; restore ghi theo batch, có thể dở dang nếu lỗi, thay thế document có trong bản sao nhưng không xóa document mới ngoài bản sao. Không tự khôi phục khi website đang nhận đơn/gửi mail. Cần cửa sổ bảo trì hoặc dịch vụ managed backup/PITR cho dữ liệu giao dịch. Công cụ không sao lưu tài khoản Firebase Auth hoặc file ảnh Cloudinary; cần lịch và lưu trữ riêng, có mã hóa/retention/quyền truy cập. Chưa cấu hình backup tự động hay thử restore dữ liệu thật.

## Các bước production còn cần kết nối

- Cho môi trường kiểm tra truy cập domain website và các dịch vụ phụ thuộc; chạy HTTP/browser trên bản đang triển khai.
- Kết nối quyền quản trị Vercel/Firebase để kiểm tra log, cấu hình vùng, alerts và quyền dữ liệu; không cung cấp secret trong chat.
- Thực hiện một đơn kiểm thử nhận diện rõ bằng thông tin người kiểm tra; xác nhận lưu đơn, giữ tồn, email đến, tra cứu, hủy và nhật ký, không lẫn với khách thật. Chưa thực hiện bước này.
- Search Console: xác minh domain, gửi sitemap, URL Inspection cho trang chủ/sản phẩm thật; kiểm tra canonical/index và xử lý URL cũ. Metadata hiện được cập nhật bởi JavaScript; social bot không chạy JS có thể vẫn đọc metadata trang chủ, cần SSR/prerender được xác minh trước khi khẳng định chia sẻ từng sản phẩm đã hoàn chỉnh.

## Kết quả kiểm tra cục bộ

209 kiểm tra logic và bộ trình duyệt16/16đạt; ESLint, production build và giới hạn entry bundle đạt. Dry-run restore1document giả lập trả `applied:false`; không dùng dữ liệu thật.
