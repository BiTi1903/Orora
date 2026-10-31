# Nội dung và ảnh sản phẩm

Trong **Admin → Sản phẩm → Thêm/Sửa**, phần nội dung chi tiết gồm các mục có tên và nội dung. Sản phẩm mới bắt đầu với một mục trống; bấm **+ Thêm mục nội dung** để thêm. Mô tả ngắn vẫn là trường riêng cho thẻ sản phẩm. Giá, danh mục, ID và trạng thái hiển thị không thay đổi cách lưu.

- Enter xuống dòng. Thanh công cụ định dạng dòng đang đứng hoặc các dòng được chọn: gạch ngang, dấu chấm, đánh số, bỏ danh sách.
- Enter trong danh sách tiếp tục dấu/đánh số; Enter trên dòng danh sách trống kết thúc danh sách. Shift+Enter chỉ xuống dòng thông thường.
- Khi xóa một mục có nội dung, cần xác nhận. Thay đổi chỉ áp dụng khi lưu sản phẩm; Hủy không ghi dữ liệu.
- Ảnh gồm một ảnh chính và một ô ảnh phụ ban đầu. Bấm **+ Thêm ảnh phụ** thay cho các ô cố định. Trang chi tiết dùng toàn bộ các ảnh đã thêm trong gallery. Bỏ ảnh/mục ảnh không xóa tệp Cloudinary.
- Không lưu hoặc đổi sản phẩm khi còn tải ảnh. Có thể hủy lần tải trong ô ảnh; ảnh đã có trước đó được giữ nếu lần tải bị hủy.

## Tương thích dữ liệu

Nội dung mới lưu ở `detailSections: [{id, title, content}]`; nội dung là văn bản thường, danh sách dùng các ký hiệu ở đầu dòng. Trang sản phẩm tạo các phần tử danh sách thật và hiển thị văn bản an toàn, không chèn HTML do người dùng nhập.

Sản phẩm chưa có mảng mới vẫn hiển thị `story`, `material`, `size`, `color`, `origin` như trước. Khi sửa, các trường có nội dung được nạp thành các mục tương ứng; giữ nguyên chuỗi nội dung, kể cả xuống dòng. Các trường cũ và các thuộc tính khác được giữ trong bản ghi khi lưu, không có bước di chuyển/xóa hàng loạt. Mảng đã lưu là nguồn hiển thị chính; mảng rỗng không phục hồi nội dung cũ đã chủ động bỏ khỏi trang.

Ảnh phụ mới lưu ở `additionalImages` theo thứ tự. Khi chưa có mảng này, gallery và form đọc `image2` đến `image6`; các trường cũ vẫn được giữ. Mảng mới có thể có ô trống; gallery bỏ qua ô trống và dùng ảnh chính từ `image`. Collection/thẻ sản phẩm tiếp tục dùng ảnh chính như trước.

Kiểm thử bao gồm sản phẩm cũ nhiều mục/ảnh, lưu-mở lại không đổi trường cũ, thêm nhiều hơn năm ảnh phụ, danh sách/xuống dòng, ảnh đang tải/hủy và giao diện 320/390/1440 px. API sản phẩm và tải ảnh trong kiểm tra trình duyệt được giả lập; không sửa dữ liệu Firestore hoặc tải tệp sản xuất trong các kiểm thử này.

## Bố cục trang chi tiết

Phần trên giữ hai cột trên desktop: gallery bên trái, tên/giá/mô tả ngắn/nút mua bên phải. Các mục nội dung dài nằm ở khối riêng bên dưới, cùng chiều rộng và căn lề với phần trên; không kéo dài riêng cột phải. Mobile xếp ảnh → thông tin mua → nội dung chi tiết. Áp dụng cả các trường cũ lẫn `detailSections`, giữ tùy chỉnh chữ trong Visual Builder và không ghi lại dữ liệu sản phẩm.
