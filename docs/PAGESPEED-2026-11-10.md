# Tối ưu theo báo cáo PageSpeed di động — 10/11/2026

## Bằng chứng ban đầu do chủ website cung cấp

Ảnh báo cáo Lighthouse13.6, MotoGPower mô phỏng/4Gchậm, lượt tải đầu tiên: FCP1.5s, LCP14.3s, TBT30ms, CLS0.016, SpeedIndex6.5s. Báo cáo ước tính chặn hiển thị750ms, ảnh438KiB, JS không dùng169KiB, CSS không dùng23KiB; tổng tài nguyên2834KiB. Accessibility96 với lỗi `aria-hidden=true` chứa phần tử nhận focus. Đây là số đo trước thay đổi; các ước tính tiết kiệm không cộng trực tiếp thành thời gian tải mới.

Ảnh chưa mở chi tiết phần tử LCP nên chưa khẳng định toàn bộ14.3s đến từ một ảnh/đoạn chữ cụ thể. Chưa truy cập được production từ môi trường kiểm tra; không có điểm PageSpeed/LCP sau thay đổi được đo ở đây.

## Đã thay đổi

- HTML bắt đầu GET `/api/storefront-shell` trước bundle ứng dụng, rồi preload đúng ảnh Hero của viewport với ưu tiên cao. Endpoint chỉ xuất danh sách trường Hero/navbar/visibility cho phép; không xuất giá, phí ship, đơn, khách hay kiến thức chat. Cache CDN15s, stale-while-revalidate15s; phản hồi lỗi không cache. Khi backend lỗi, luồng Firestore cũ vẫn hoạt động độc lập.
- Cho phép navbar/Hero hiện từ dữ liệu sớm trong lúc phần nội dung khác vẫn chờ snapshot đầy đủ. Nội dung sớm không bao giờ ghi đè dữ liệu realtime đã nhận. Shell cache có thể là bản xuất bản gần nhất tối đa khoảng30s; snapshot Firestore thay thế khi sẵn sàng. Không dùng shell để tính tiền/ship hay xác nhận đơn.
- Firebase và mã đọc catalog tải bất đồng bộ, không còn là static dependency bắt buộc trước lúc React vẽ đầu trang. Các thành phần dùng một listener home chung. About/Footer không đọc lại cùng tài liệu riêng.
- GSAP/ScrollTrigger tải khi trình duyệt rảnh, không còn chặn nhập module của trang chủ. Không chạy timeline giấu Hero/navbar trước khi hiện; không tạo lại hiệu ứng ẩn cho nội dung đã ở trong màn hình. Giữ hiệu ứng dưới trang và giảm chuyển động theo thiết bị.
- Bỏ trì hoãn chữ Hero và giảm gradient/filter động trên mobile. Dữ liệu và kiểu trong CMS vẫn là nguồn nội dung, không thay bằng chữ/ảnh demo cố định.
- Mobile dùng ảnh Cloudinary900px ngay cả khi chưa nhập ảnh mobile riêng; desktop1920px. Hai đường dẫn được tính bởi cùng một helper ở server/client, tránh preload sai ảnh. URL ngoài Cloudinary giữ nguyên.
- Font chính tải stylesheet không chặn render. Chỉ tải thêm các font đã chọn trong cấu hình hoặc được chọn khi chỉnh admin; bỏ hai bộ tải hàng loạt font trùng ở main/About. Preview iframe đồng bộ được stylesheet thêm/chuyển rel.
- Carousel/slideshow dots không còn nằm trong `aria-hidden`; có tên/aria-pressed. Slide ngoài vùng hiển thị dùng `inert`, không nhận focus. Tiêu đề Hero có tên truy cập nguyên từ thay vì đọc từng chữ rời.

## Kích thước build và kiểm tra

Trước thay đổi, entry JS946589bytes là static JS chính. Sau thay đổi, toàn bộ entry **và static JS imports**358910bytes, giảm khoảng62%; SDK Firebase, GSAP và các route vẫn tải sau khi cần, không bị xóa khỏi tổng tài nguyên của cả phiên. Đây là số đo bundle, không phải LCP hay tiết kiệm tổng traffic.

Bộ kiểm tra bundle nay đi theo manifest và cộng cả static imports để không báo giảm giả khi chỉ tách vendor thành file khác. Không cộng deferred chunks vào đường tải bắt buộc, và không dùng chỉ số này để khẳng định điểm Lighthouse.

212 unit/integration, ESLint, build và ngân sách bundle đạt. 32 kiểm tra browser ở320/390/768/1440px đạt: ảnh được yêu cầu trước khi main JS hoàn tất; ảnh mobile/fallback đúng; copy hiện ngay không chờ animation; app thật hiện shell khi realtime pending rồi cập nhật CMS; dots/slide có trạng thái truy cập đúng; các luồng đặt hàng/tra cứu/admin vẫn đạt. API/DB trong kiểm tra được giả lập, không tạo đơn hay gửi email thật.

## Kiểm tra lại sau triển khai

1. Vercel Production phải dùng commit chứa bản sửa và trạng tháiReady; thử GET `/api/storefront-shell` trả200, JSON chỉ có nội dung công khai. Nếu503, kiểm tra cấu hình Firebase Admin phía Vercel; đừng đưa khóa vào chat/repo.
2. Chạy lại PageSpeed Mobile trên cùng URL. Ghi FCP/LCP/TBT/CLS/SpeedIndex, mở LCP element + breakdown và network waterfall; xem ảnh có priority/preload đúng không.
3. Đo nhiều lượt và tách cold/warm cache. Không lấy thời gian test cục bộ làm số giây trên4G thật. Đặc biệt theo dõi CLS vì font dùng swap.
4. Nếu vẫn LCP cao, cần URL báo cáo để xác định download/TTFB/render delay và ảnh thực tế. Nội dung trang sau màn hình đầu tiên vẫn đọc realtime; CSS và ảnh CMS thực tế có thể cần tối ưu tiếp theo từng tài nguyên.

## Mobile visual follow-up

- Public first-screen shell now includes ticker words/styles. Hero, navigation and ticker mount together, reserving the band before the realtime snapshot arrives. Browser regression checks compare first-screen height before/after the snapshot.
- Primary Google Fonts use `display=optional` to avoid a late font replacement on slow first visits; the browser may retain its fallback for that visit. Navigation logo uses an explicit line height.
- Removed the hardcoded newsletter star; separated email input and submit button. Newsletter sits above falling petals so controls remain legible. Input/button colors, radius and consent copy/typography are editable in Visual Builder, with consent visible in preview.
- Chat hint tracks its actual anchor only during its brief display, including scrolling, visual viewport changes and dragging. Regression checks cover multiple button positions at all four viewport widths.

## Font and hero follow-up — 11 November

Replaced the earlier `display=optional` Google Fonts approach: it could keep a heavier fallback on the cold visit and use the real font after refresh. Primary Cormorant Garamond and Jost variable fonts are now served as versioned assets from the website, including Vietnamese subsets and real italic weights. The hero reserves its text layout while critical faces load, with a bounded, stable fallback on errors. The rotator reserves the longest configured phrase and starts without an entrance animation. Rotator typography is editable and preserved by the hero section save payload.

The hero image is a high-priority responsive picture, decoded before a short opacity reveal over the existing fallback. This removes the abrupt background-image replacement without delaying its network request. These changes do not write CMS/Firestore content. Browser checks cover cold and warm font loads, word changes and failed fonts; production Web Vitals still require a fresh measurement after deployment.
