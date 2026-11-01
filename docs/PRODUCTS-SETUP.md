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

Trên desktop rộng, phần trên có ba cột: gallery trái, tên/giá/mô tả ngắn/nút mua ở giữa và cam kết ở cột phải riêng. Nội dung dài nằm dưới, chia ba phần **Mô tả**, **Thông số**, **Hướng dẫn sử dụng**. Ba ô chuyển nhanh cuộn đến phần tương ứng, có khoảng tránh navbar và giữ sử dụng bàn phím. Cả ba phần dùng chung kiểu chữ/màu của Visual Builder; thông số vẫn có tên bên trái, nội dung bên phải. Mobile hiển thị ảnh/mua hàng, cam kết, Triết lý, ba phần nội dung, sản phẩm khác rồi đánh giá.

Mỗi mục trong form có **Phần hiển thị**, lưu ở `detailSections[].group` (`description`, `specifications`, `usage`). Dữ liệu chưa có nhóm được phân loại khi đọc: câu chuyện/công dụng/mô tả vào Mô tả, các trường thành phần/dung tích/màu/xuất xứ vào Thông số, tên hướng dẫn/cách sử dụng vào Hướng dẫn sử dụng. Chọn nhóm thủ công sẽ ưu tiên hơn suy luận từ tên. Nội dung và các trường cũ không bị xóa hoặc ghi lại hàng loạt. Phần chưa có nội dung hiện trạng thái đang cập nhật, không tự tạo hướng dẫn sử dụng sản phẩm.

## Cam kết và chính sách cạnh nút mua

Tại **Admin → Sản phẩm**, ngoài trình sửa từng sản phẩm, có **Cam kết cạnh phần mua hàng**. Tự nhập tên, nội dung, bật/tắt và thêm/bỏ mục. Lưu riêng ở `settings/home.productPolicies`, dùng chung các sản phẩm; không ghi đè kênh mua hay phí ship. Mục trống/tắt không hiển thị. Không tự điền mức miễn phí ship, đền bù hoặc điều kiện đổi trả chưa được cửa hàng cung cấp.

Đây là nội dung hiển thị, không phải quy tắc tính phí hoặc hoàn tiền. Cần cấu hình giá ship/chính sách thực tế nhất quán với nội dung đã đăng.

## Đánh giá tự thêm

Trong **Sửa sản phẩm → Đánh giá minh họa**, thêm tên hiển thị, số sao, nội dung và bật hiển thị từng mục. Bản mới mặc định chưa xuất bản; khi lưu, đánh giá muốn xuất bản phải có tên và nội dung. Dữ liệu lưu riêng ở `productReviews` trên sản phẩm.

Website luôn ghi rõ đây là **Minh họa**, không phải phản hồi đã xác minh từ người mua. Không có nhãn “đã mua hàng”, không tạo điểm trung bình/số khách đánh giá hoặc dữ liệu SEO aggregateRating từ các mục minh họa. Không sinh sẵn tên, nội dung khen hoặc điểm sao của khách hàng. Khi chưa có mục xuất bản, hiển thị trạng thái chưa có đánh giá. Hệ thống tiếp nhận đánh giá thật từ người mua chưa được triển khai trong phần này.

Phần Mô tả/Thông số/Hướng dẫn sử dụng và thanh chuyển nhanh chiếm 80% khung nội dung trên desktop; cột 20% bên phải hiển thị Sản phẩm khác dạng nhỏ gọn. Không hiển thị số 01–03 ở thanh chuyển và tiêu đề. Tablet/mobile dùng toàn chiều rộng, xếp cam kết dưới phần mua để tránh cột quá hẹp. Đánh giá nằm ngay dưới Sản phẩm khác trong cột phải, không còn khối đánh giá trong phần nội dung chính.

Khối mua hàng trên desktop rộng dùng tỷ lệ ảnh/thông tin/cột phải 50/30/20 (không tính khe giữa cột). Ảnh chính và hai ảnh phụ hiển thị trong cùng một card. Card ảnh rộng hơn card thông tin theo tỷ lệ 5:3; hai card vẫn cùng chiều cao. Trên desktop, chiều cao nội dung thông tin tự nhiên là chuẩn; ảnh chính thu vào phần chiều cao còn lại sau khi trừ hàng ảnh phụ và khoảng đệm. Không kéo dài card thông tin theo ảnh. Ảnh chính dùng kiểu phủ khung (hoặc kiểu hiển thị đã chọn trong admin); thiết lập ảnh đã lưu không bị ghi đè. Mobile giữ kích thước ảnh tự nhiên/theo thiết lập mobile. Ảnh phụ vẫn đổi được ảnh chính; nếu nhiều hơn hai ảnh thì dùng mũi tên chuyển. Hiệu ứng chạy cho toàn bộ card ảnh một lần, không chạy lặp trên ảnh chính và ảnh phụ. Kích thước cột ưu tiên hơn giới hạn chiều rộng gallery cũ, không đổi dữ liệu ảnh hoặc chữ. Mobile vẫn xếp dọc và dùng chiều cao tự nhiên.

Sản phẩm khác hiển thị tối đa bốn sản phẩm còn hoạt động, loại sản phẩm đang xem và trùng ID, ưu tiên cùng danh mục. Thẻ nhỏ gồm ảnh/tên/giá và liên kết chi tiết; có Xem tất cả sản phẩm. Cột có thể theo cuộn và cuộn danh sách khi thiếu chiều cao. Trên mobile, danh sách nằm dưới ba phần nội dung. Không còn Collection sản phẩm khác lớn ở cuối trang; dữ liệu danh mục/sản phẩm không thay đổi, vẫn dùng cache catalog hiện có. Màu/font tên và giá giữ cấu hình riêng; cỡ chữ và khoảng cách được giới hạn để vừa cột hẹp.

## Triết lý và cột bên phải

Card dưới cam kết hiển thị Triết lý ORORA, thay khối Facebook. Nội dung dùng chung với Trang chủ → Triết lý (`philosophyLabel`, `philosophyBody`, hoặc trường cũ `philosophyText`) và giữ xuống dòng/nhấn màu các chữ cuối. Cỡ chữ từ trang chủ được giới hạn để vừa cột hẹp; có thể chỉnh kiểu chữ riêng tại Trang chủ → Chi tiết SP hoặc chọn trực tiếp trong Visual Builder. Khi chưa có nội dung, đang tải hoặc tắt Triết lý trong Sections thì không hiển thị card. Không tạo sẵn nội dung triết lý. Dữ liệu `productFacebook` cũ được giữ nguyên trong cơ sở dữ liệu, nhưng không dùng cho card mới. Link Facebook ở nút mua hàng vẫn giữ nguyên.

Desktop dùng cột nội dung 80% và cột phụ 20%. Cột phụ xếp liên tục **Cam kết → Triết lý → Sản phẩm khác → Đánh giá sản phẩm**. Mobile xếp toàn chiều rộng, sản phẩm khác và đánh giá ở sau nội dung. Đánh giá minh họa vẫn giữ nhãn minh họa.

## Nội dung và kiểu chữ bổ sung

Sản phẩm mới chỉ có một mục Mô tả. Tên mục là tùy chọn; có thể lưu nội dung không có tên. Mục bổ sung chỉ xuất hiện trong admin khi bấm Thêm mục nội dung; mục trống không được đưa vào dữ liệu lưu. Mở sản phẩm cũ giữ nguyên tên và nội dung đã lưu. Mục thông số không có tên sẽ dùng toàn chiều rộng dòng.

Trong Trang chủ → Chi tiết SP, có thể chỉnh kiểu chữ thanh chuyển mục, tiêu đề phần nội dung, tên mục, Chọn cách mua hàng, tiêu đề/nội dung cam kết, card Triết lý, tiêu đề/tên/nội dung đánh giá và chữ ở Khám phá thêm. Các thành phần này cũng chọn trực tiếp được trong Visual Builder. Kiểu chữ lưu ở productDetailStyles; không sửa nội dung từng sản phẩm. Thanh chuyển mục không có mũi tên. Nút Facebook/TikTok giữ nhãn trên một dòng; màn hình rất hẹp xếp nút dọc.

## Popup đặt hàng

Bấm Đặt hàng ngay mở form trong dialog ở giữa màn hình, có tiêu đề/nút đóng cố định và cuộn bên trong khi nội dung dài. Khi chưa gửi, có thể đóng bằng nút ×, Esc hoặc bấm ngoài popup. Trong lúc đang gửi, tạm khóa các cách đóng để tránh ngắt thao tác. Lưu thành công chuyển sang dialog xác nhận có thông tin người nhận; không mở hai dialog chồng nhau. Dữ liệu đơn, API, thanh toán, tính ship và xử lý email giữ nguyên.

## Hiệu ứng trang chi tiết

Trang chi tiết dùng một hàng đợi hiệu ứng chung cho ảnh, khung mua, thanh chuyển mục, từng phần nội dung và các card bên phải. Các khối trong vùng nhìn thấy hiện theo vị trí từ trên xuống, cùng hàng từ trái sang phải; phần dưới chỉ chạy khi cuộn tới. Không chạy đồng thời hiệu ứng ở cả cha và con. Card tải muộn vẫn được theo dõi. Mỗi khối chạy một lần cho mỗi sản phẩm; điều hướng dọn hiệu ứng cũ. Preview không chạy hiệu ứng. Tùy chọn giảm chuyển động của thiết bị bỏ hiệu ứng và luôn hiện nội dung. Thanh chuyển mục desktop chỉ rộng theo các nhãn, mobile vẫn chia ba cột.
