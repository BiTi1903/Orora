# Google Search cho ORORA

Website giữ bố cục một trang: menu cuộn đến `/#shop`, `/#about`, `/#contact`. Chỉ trang chủ và trang chi tiết sản phẩm `/product/{id}` được đưa vào sitemap. Các URL thử nghiệm `/san-pham`, `/ve-orora`, `/lien-he` đưa khách về đúng phần trên trang chủ. Các phần nội dung tiếp tục đọc dữ liệu đã lưu trong Firebase.

Mỗi trang có tiêu đề, mô tả, canonical, dữ liệu WebSite/Organization và breadcrumb. Sản phẩm có tên, ảnh và mô tả thật; chỉ thêm giá VND khi giá hiển thị có định dạng rõ ràng. Không tạo đánh giá hoặc thông tin tồn kho giả. Các thẻ SEO riêng cho từng trang được cập nhật bằng JavaScript, nên cần cho Google tải và render trang.

`https://ororavn.com/sitemap.xml` lấy sản phẩm từ Firebase phía máy chủ, loại sản phẩm đang ẩn. Sitemap được cache tối đa một giờ trên CDN. Cần giữ `FIREBASE_SERVICE_ACCOUNT_JSON` đúng dự án ở Vercel Production như API email hiện có. Nếu Firebase lỗi, sitemap trả 503 để công cụ tìm kiếm thử lại thay vì ghi nhận danh sách sản phẩm rỗng. API này chỉ xuất URL công khai, không đọc danh sách email.

Sau khi Vercel triển khai:

1. Mở sitemap để kiểm tra URL.
2. Trong Google Search Console, chọn thuộc tính `ororavn.com` đã xác minh.
3. Vào **Sitemaps**, gửi `https://ororavn.com/sitemap.xml`.
4. Dùng **URL inspection / Kiểm tra URL** cho trang chủ và trang sản phẩm, chọn **Test live URL / Kiểm tra URL đang hoạt động** để kiểm tra bản Google render, rồi **Request indexing / Yêu cầu lập chỉ mục** nếu hợp lệ.

Google tự chọn tiêu đề, mô tả và các liên kết phụ (sitelinks). Không có thiết lập bảo đảm hiển thị giống một ảnh mẫu hoặc xuất hiện ngay sau triển khai. Thay đổi cần Google thu thập và xử lý lại. Ô tìm kiếm sitelinks từng xuất hiện trong kết quả Google đã ngừng hỗ trợ; không thêm SearchAction chỉ để tạo ô đó.
