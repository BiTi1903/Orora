# Nội dung và ảnh sản phẩm

Trong **Admin → Sản phẩm → Thêm/Sửa**, phần nội dung chi tiết gồm các mục có tên và nội dung. Sản phẩm mới bắt đầu với một mục trống; bấm **+ Thêm mục nội dung** để thêm. Mô tả ngắn vẫn là trường riêng cho thẻ sản phẩm. Giá, danh mục, nội dung và trạng thái đã lưu được giữ nguyên; mã số và đường dẫn dùng quy tắc bên dưới.

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

Trên desktop rộng, phần trên có ba cột: gallery trái, tên/giá/mô tả ngắn/nút mua ở giữa và cam kết ở cột phải riêng. Nội dung dài nằm dưới, chia ba phần **Mô tả**, **Thông số**, **Hướng dẫn sử dụng**. Ba ô chuyển nhanh cuộn đến phần tương ứng, có khoảng tránh navbar và giữ sử dụng bàn phím. Cả ba phần dùng chung kiểu chữ/màu của Visual Builder; thông số vẫn có tên bên trái, nội dung bên phải. Mobile hiển thị ảnh/mua hàng, cam kết, Slogan, ba phần nội dung, sản phẩm khác rồi đánh giá.

Mỗi mục trong form có **Phần hiển thị**, lưu ở `detailSections[].group` (`description`, `specifications`, `usage`). Dữ liệu chưa có nhóm được phân loại khi đọc: câu chuyện/công dụng/mô tả vào Mô tả, các trường thành phần/dung tích/màu/xuất xứ vào Thông số, tên hướng dẫn/cách sử dụng vào Hướng dẫn sử dụng. Chọn nhóm thủ công sẽ ưu tiên hơn suy luận từ tên. Nội dung và các trường cũ không bị xóa hoặc ghi lại hàng loạt. Phần chưa có nội dung hiện trạng thái đang cập nhật, không tự tạo hướng dẫn sử dụng sản phẩm.

## Cam kết và chính sách cạnh nút mua

Tại **Admin → Sản phẩm → Thiết lập dùng chung → Cam kết và chính sách**, có **Cam kết cạnh phần mua hàng**. Tự nhập tên, nội dung, bật/tắt và thêm/bỏ mục. Lưu riêng ở `settings/home.productPolicies`, dùng chung các sản phẩm; không ghi đè kênh mua hay phí ship. Mục trống/tắt không hiển thị. Không tự điền mức miễn phí ship, đền bù hoặc điều kiện đổi trả chưa được cửa hàng cung cấp.

Đây là nội dung hiển thị, không phải quy tắc tính phí hoặc hoàn tiền. Cần cấu hình giá ship/chính sách thực tế nhất quán với nội dung đã đăng.

## Đánh giá tự thêm

Trong **Sửa sản phẩm → Đánh giá minh họa**, thêm tên hiển thị, số sao, nội dung và bật hiển thị từng mục. Bản mới mặc định chưa xuất bản; khi lưu, đánh giá muốn xuất bản phải có tên và nội dung. Dữ liệu lưu riêng ở `productReviews` trên sản phẩm.

Website luôn ghi rõ đây là **Minh họa**, không phải phản hồi đã xác minh từ người mua. Không có nhãn “đã mua hàng”, không tạo điểm trung bình/số khách đánh giá hoặc dữ liệu SEO aggregateRating từ các mục minh họa. Không sinh sẵn tên, nội dung khen hoặc điểm sao của khách hàng. Khi chưa có mục xuất bản, hiển thị trạng thái chưa có đánh giá. Hệ thống tiếp nhận đánh giá thật từ người mua chưa được triển khai trong phần này.

Phần Mô tả/Thông số/Hướng dẫn sử dụng và thanh chuyển nhanh chiếm 80% khung nội dung trên desktop; cột 20% bên phải hiển thị Sản phẩm khác dạng nhỏ gọn. Không hiển thị số 01–03 ở thanh chuyển và tiêu đề. Tablet/mobile dùng toàn chiều rộng, xếp cam kết dưới phần mua để tránh cột quá hẹp. Đánh giá nằm ngay dưới Sản phẩm khác trong cột phải, không còn khối đánh giá trong phần nội dung chính.

Khối mua hàng trên desktop rộng dùng tỷ lệ ảnh/thông tin/cột phải 40/40/20 (không tính khe giữa cột). Ảnh chính và hai ảnh phụ hiển thị trong cùng một card. Card ảnh và card thông tin cùng chiều rộng và chiều cao. Trên desktop, chiều cao nội dung thông tin tự nhiên là chuẩn; ảnh chính thu vào phần chiều cao còn lại sau khi trừ hàng ảnh phụ và khoảng đệm. Không kéo dài card thông tin theo ảnh. Ảnh chính và ảnh phụ phủ kín khung bằng cover; thiết lập ảnh đã lưu không bị ghi đè. Mobile giữ kích thước ảnh tự nhiên/theo thiết lập mobile. Ảnh phụ vẫn đổi được ảnh chính; nếu nhiều hơn hai ảnh thì dùng mũi tên chuyển. Hiệu ứng chạy cho toàn bộ card ảnh một lần, không chạy lặp trên ảnh chính và ảnh phụ. Kích thước cột ưu tiên hơn giới hạn chiều rộng gallery cũ, không đổi dữ liệu ảnh hoặc chữ. Mobile vẫn xếp dọc và dùng chiều cao tự nhiên.

Sản phẩm khác hiển thị tối đa bốn sản phẩm còn hoạt động, loại sản phẩm đang xem, sản phẩm ẩn và trùng ID; lấy các sản phẩm kế tiếp theo STT rồi vòng lại từ đầu. Ví dụ đang xem số 5 trong danh sách 1–8 thì hiển thị 6, 7, 8, 1. Mỗi ảnh có mã STT đúng của sản phẩm, không đánh số lại theo vị trí thẻ. Thẻ nhỏ gồm ảnh/tên/giá và liên kết chi tiết; có Xem tất cả sản phẩm. Cột có thể theo cuộn và cuộn danh sách khi thiếu chiều cao. Trên mobile, danh sách nằm dưới ba phần nội dung. Không còn Collection sản phẩm khác lớn ở cuối trang; dữ liệu danh mục/sản phẩm không thay đổi, vẫn dùng cache catalog hiện có. Màu/font tên và giá giữ cấu hình riêng; cỡ chữ và khoảng cách được giới hạn để vừa cột hẹp.

## Slogan và cột bên phải

Card dưới cam kết hiển thị **Slogan** riêng do admin nhập tại **Sản phẩm → Thiết lập dùng chung → Slogan trên chi tiết sản phẩm**. Có tiêu đề, nội dung và bật/tắt; lưu riêng ở settings/home.productSlogan. Không dùng lại, sao chép hoặc thay đổi philosophyLabel/philosophyBody/philosophyText của trang chủ. Chưa có nội dung, đang tải hoặc tắt Slogan thì không hiển thị card; không tạo nội dung mẫu. Enter giữ xuống dòng và nội dung được hiển thị dưới dạng chữ an toàn.

Ngay tại **Sản phẩm → Thiết lập dùng chung → Slogan trên chi tiết sản phẩm**, ba nhóm Nội dung, Kiểu chữ và Khung thẻ dùng chung một bản nháp, có xem trước và nút Lưu Slogan luôn theo cuộn. Có thể chỉnh phông/cỡ chữ máy tính và điện thoại, màu, độ đậm, nghiêng, hoa/thường, căn lề, giãn chữ/dòng, gạch chân/gạch ngang và khoảng cách riêng cho tiêu đề/nội dung. Khung thẻ có nền một màu/chuyển màu/trong suốt, hướng chuyển màu, viền, bo góc, bóng, khoảng đệm, đệm mobile, khoảng cách các phần, đường phân cách và bật/tắt tiêu đề.



Các tùy chỉnh cũng có tại Trang chủ → Chi tiết SP; Visual Builder chọn trực tiếp chữ để chỉnh kiểu chữ, chọn khung để chỉnh thiết kế. Cả ba nơi dùng productDetailStyles.sloganTitle/sloganBody/sloganCard. Nội dung vẫn ở productSlogan và độc lập với Triết lý trang chủ. Lưu chỉ ghi những thuộc tính Slogan đã thay đổi, giữ nguyên các thiết lập khác, thuộc tính chưa biết và kiểu chữ cũ; không ghi hàng loạt hoặc xóa dữ liệu đã lưu. Dữ liệu Facebook/kiểu chữ card Triết lý cũ vẫn được giữ trong cơ sở dữ liệu nhưng không dùng làm nội dung Slogan.

Desktop dùng cột nội dung 80% và cột phụ 20%. Cột phụ xếp liên tục **Cam kết → Slogan → Sản phẩm khác → Đánh giá sản phẩm**. Mobile xếp toàn chiều rộng, sản phẩm khác và đánh giá ở sau nội dung. Đánh giá minh họa vẫn giữ nhãn minh họa.

## Nội dung và kiểu chữ bổ sung

Sản phẩm mới chỉ có một mục Mô tả. Tên mục là tùy chọn; có thể lưu nội dung không có tên. Mục bổ sung chỉ xuất hiện trong admin khi bấm Thêm mục nội dung; mục trống không được đưa vào dữ liệu lưu. Mở sản phẩm cũ giữ nguyên tên và nội dung đã lưu. Mục thông số không có tên sẽ dùng toàn chiều rộng dòng.

Trong Trang chủ → Chi tiết SP, có thể chỉnh kiểu chữ thanh chuyển mục, tiêu đề phần nội dung, tên mục, Chọn cách mua hàng, tiêu đề/nội dung cam kết, card Slogan, tiêu đề/tên/nội dung đánh giá và chữ ở Khám phá thêm. Các thành phần này cũng chọn trực tiếp được trong Visual Builder. Kiểu chữ lưu ở productDetailStyles; không sửa nội dung từng sản phẩm. Thanh chuyển mục không có mũi tên. Nút Facebook/TikTok giữ nhãn trên một dòng; màn hình rất hẹp xếp nút dọc.

## Popup đặt hàng

Bấm Đặt hàng ngay mở form trong dialog ở giữa màn hình, có tiêu đề/nút đóng cố định và cuộn bên trong khi nội dung dài. Khi chưa gửi, có thể đóng bằng nút ×, Esc hoặc bấm ngoài popup. Trong lúc đang gửi, tạm khóa các cách đóng để tránh ngắt thao tác. Lưu thành công chuyển sang dialog xác nhận có thông tin người nhận; không mở hai dialog chồng nhau. Dữ liệu đơn, API, thanh toán, tính ship và xử lý email giữ nguyên.

## Hiệu ứng trang chi tiết

Trang chi tiết dùng một hàng đợi hiệu ứng chung cho ảnh, khung mua, thanh chuyển mục, từng phần nội dung và các card bên phải. Các khối trong vùng nhìn thấy hiện theo vị trí từ trên xuống, cùng hàng từ trái sang phải; phần dưới chỉ chạy khi cuộn tới. Không chạy đồng thời hiệu ứng ở cả cha và con. Card tải muộn vẫn được theo dõi. Mỗi khối chạy một lần cho mỗi sản phẩm; điều hướng dọn hiệu ứng cũ. Preview không chạy hiệu ứng. Tùy chọn giảm chuyển động của thiết bị bỏ hiệu ứng và luôn hiện nội dung. Thanh chuyển mục desktop chỉ rộng theo các nhãn, mobile vẫn chia ba cột.

Card ảnh và card mua hàng chỉ hiện dần, không dịch chuyển dọc. Tương tác bằng chuột/bàn phím kết thúc hiệu ứng còn lại ngay, không chạy lại hiệu ứng ở card đã hiện. Chuyển link cũ sang link tên của cùng sản phẩm không cuộn lại đầu trang hoặc đặt lại lựa chọn; chỉ đổi sang sản phẩm khác mới cuộn lên đầu.

## Dung tích và số lượng

Trong **Admin → Sản phẩm → Sửa/Thêm sản phẩm → Giá & dung tích**, bấm Thêm dung tích rồi tự nhập nhãn (ví dụ 40 ml, 100 ml). Mỗi lựa chọn có ID ổn định và giá riêng tùy chọn; bỏ trống giá riêng để dùng giá chung. Tối đa 30 lựa chọn, không chấp nhận trùng tên hoặc giá không hợp lệ. Sản phẩm cũ không tự phát sinh dung tích từ trường size; nội dung cũ được giữ nguyên.

Trang chi tiết và popup đặt hàng dùng chung điều khiển dung tích/số lượng. Một dung tích tự được chọn, nhiều dung tích yêu cầu khách chọn; không có dung tích vẫn đặt sản phẩm như trước. Số lượng mặc định 1, từ 1–20 theo giới hạn đơn hiện có. Lựa chọn và số lượng đồng bộ hai chiều với popup; đổi sản phẩm sẽ trở về mặc định. Giá hiển thị và tổng tiền thay đổi theo dung tích/số lượng.

Popup đọc trực tiếp dung tích/số lượng đang chọn trên trang, không giữ một bản lựa chọn riêng có thể bị lệch. Dòng hướng dẫn chọn dung tích giữ chỗ sau lần chọn đầu tiên để card mua hàng và card ảnh không bị co lại hoặc nhảy khi thao tác.

Máy chủ kiểm tra lại dung tích và tính tiền từ sản phẩm trong Firestore, không tin giá/nhãn do trình duyệt gửi. ID/nhãn dung tích, giá và số lượng được chụp lại trong đơn; chỉnh/xóa dung tích sau đó không thay đổi đơn cũ. Gửi lại cùng requestId không tạo đơn trùng hoặc đổi lựa chọn đã nhận. Đơn hàng trong admin và email hiển thị dung tích. Biến thư {{productName}} bao gồm dung tích; có thêm {{variantLabel}} nếu muốn đặt riêng. Không đổi mẫu thư đang lưu.

Kho vẫn quản lý tổng số lượng theo ID sản phẩm, không tách tồn theo từng dung tích. Giữ số lượng chờ xác nhận và trừ kho theo quy trình hiện có.

## Nhập và hiển thị giá

Giá chung và giá từng dung tích trong admin chỉ nhập số, ví dụ `250000`; ô nhập có đơn vị **đ** riêng và bàn phím số trên điện thoại. Có thể dán giá cũ dạng `250.000đ` để chuyển thành số. Giá phải là số nguyên từ 0 đến 1.000.000.000 đ; để trống giá dung tích để dùng giá chung, để trống giá chung nếu cần báo giá.

Website, danh sách sản phẩm, đơn hàng và email mới thống nhất hiển thị `250.000 đ`. Giá cũ có dấu phân cách/đơn vị vẫn đọc được; mở form rồi sửa thông tin khác không tự ghi lại giá cũ. Chỉ chỉnh ô giá mới lưu chuỗi số vừa nhập. Không chuyển đổi hàng loạt sản phẩm, đơn hàng hoặc nội dung email đã lưu.

Máy chủ so sánh số tiền khi kiểm tra giá trước đặt đơn: `250.000đ` và `250000` là cùng giá, không báo thay đổi chỉ vì cách ghi. Thay đổi số tiền thực tế vẫn yêu cầu tải lại và xác nhận giá mới; đơn giá/tổng tiền luôn tính từ dữ liệu phía máy chủ.

## Trang quản lý sản phẩm và nút lưu

Mở Sản phẩm sẽ thấy danh sách, ô tìm theo tên/mã và lọc đang hiện/ẩn. Kênh mua, cam kết, danh mục nằm trong Thiết lập dùng chung, chỉ tải khi mở lần đầu. Không còn nhiều form thiết lập nằm trước danh sách. Danh mục vẫn đổi nhanh cạnh nút Sửa/Xóa, không lặp thành một cột thông tin riêng.

Form sửa có năm nhóm: Thông tin, Giá & dung tích, Hình ảnh, Nội dung, Đánh giá. Chuyển nhóm giữ nguyên bản nháp; thanh Lưu/Hủy luôn hiện khi cuộn. Lỗi bắt buộc sẽ mở đúng nhóm cần sửa. Không lưu được khi đang tải ảnh. Hủy không ghi thay đổi.

## Mã sản phẩm và đường dẫn

Mã hiển thị theo STT (01, 02…), cùng mã dùng ở trang sản phẩm, danh sách và Kiểm Hàng. Sản phẩm mới được tạo bằng khóa số tự tăng trong transaction, dựa vào số lớn nhất hiện có và settings/productSequence; không ghi đè sản phẩm khác khi nhiều admin thêm cùng lúc. Mã số không đổi trong form sửa.

Khóa Firestore của sản phẩm cũ được giữ để bảo toàn tham chiếu đơn hàng, kho và lịch sử; không đổi ID hàng loạt hoặc ghi lại nội dung đã lưu. Đường dẫn công khai sinh từ tên, ví dụ White Gel - Bodyplex → /product/white-gel-bodyplex. Tên trùng hoặc xung đột link cũ có hậu tố STT để phân biệt. Đường dẫn từ Collection/Khám phá thêm, canonical SEO và sitemap dùng cùng quy tắc.

Link cũ theo ID/slug, mã số và các alias đã lưu vẫn mở được rồi chuyển sang đường dẫn theo tên. Khi lưu đổi tên, giữ cả slug cũ và đường dẫn theo tên trước đó trong slugAliases. Dùng chung cache danh sách công khai 30 giây cho Collection, SEO và trang chi tiết để tránh tải lặp; lưu/xóa sản phẩm sẽ xóa cache ở phiên admin hiện tại.

## Chỉnh chữ Fb / TikTok

Trang chủ → Chi tiết SP → Nút chọn kênh mua hàng cho sửa nhãn của mỗi kênh. Có thêm Chữ riêng nút Facebook và Chữ riêng nút TikTok để chỉnh font, size desktop/mobile, màu, độ đậm… độc lập. Visual Builder cũng chọn trực tiếp được chữ từng nút. Kiểu riêng ghi trong productDetailStyles.purchaseOptions.facebookStyle/tiktokStyle; các kiểu chung, nhãn và thiết lập khác giữ nguyên.



Slogan trong chi tiết sản phẩm chỉ hiển thị chữ, không có biểu tượng hoặc họa tiết, kể cả khi dữ liệu cũ có lưu các lựa chọn này. Admin chỉ có Nội dung, Kiểu chữ và Khung thẻ; tiêu đề không bắt buộc và có thể bật/tắt. Nội dung và kiểu chữ đã lưu được giữ nguyên. Các thiết lập biểu tượng cũ không còn được sử dụng hoặc hiển thị trong giao diện chỉnh sửa.

## Cách chăm sóc trên footer

Sản phẩm → Thiết lập dùng chung → Cách chăm sóc phù hợp — trên footer. Tạo nhiều bộ hướng dẫn, đặt tên nội bộ, nhân bản, xóa bộ và chọn sản phẩm áp dụng bằng danh sách có tìm kiếm theo tên/STT. Một bộ có thể dùng cho nhiều sản phẩm; một sản phẩm chỉ dùng một bộ. Chọn sản phẩm đã thuộc bộ khác sẽ chuyển sang bộ đang chỉnh khi lưu. Nhân bản tạo bộ chưa gán sản phẩm. Bộ không có sản phẩm là bản nháp. Sản phẩm chưa được chọn không hiển thị hướng dẫn khi đã dùng cấu hình theo bộ. Sản phẩm mới cần được gán vào bộ phù hợp.

Mỗi bộ có nội dung, liên kết, kiểu chữ và thiết kế riêng. Admin có thể bật/tắt, sửa tiêu đề và giới thiệu, thêm/xóa/sắp xếp mục, sửa nội dung và nhãn/đường dẫn từng mục. Các mẫu gồm chăm sóc hằng ngày, dưỡng da đều đặn và chăm sóc khi di chuyển. Xóa hết mục không khôi phục mẫu. Liên kết chỉ chấp nhận http/https, đường dẫn nội bộ bắt đầu bằng / hoặc #.

Nhóm Kiểu chữ chỉnh riêng tiêu đề khối, giới thiệu, tiêu đề mục, nội dung mục và liên kết: font, cỡ máy tính/mobile, màu, độ đậm, căn lề và giãn cách. Nhóm Khung và nền chỉnh cả khối và thẻ con: nền, viền, bo góc, bóng, khoảng đệm, đệm mobile, đường phân cách và ẩn/hiện tiêu đề. Có xem trước và nút lưu theo cuộn.

Khối nằm dưới nội dung trong cột trái 80%, chừa cột đánh giá bên phải; điện thoại xếp toàn chiều rộng trước sản phẩm gợi ý và đánh giá. Lưu settings/home.productCareGuide.groups; liên kết sản phẩm bằng ID cơ sở dữ liệu, không theo slug hay STT nên đổi tên/STT không mất áp dụng. Cấu hình chung cũ giữ nguyên trên website đến khi lưu cấu hình bộ; admin chuyển nội dung và kiểu đã chỉnh thành bộ hiện có áp dụng cho danh sách sản phẩm đang tồn tại. Tải nội dung hoặc danh sách sản phẩm lỗi thì khóa lưu để tránh mất cấu hình. Không tự ghi dữ liệu khi mở admin.

## Chọn sản phẩm theo nhu cầu và FAQ

Trong Sản phẩm → Thiết lập dùng chung có hai mục riêng: Chọn sản phẩm theo nhu cầu, Câu hỏi thường gặp theo sản phẩm. Cả hai có nội dung, kiểu chữ và khung/nền; có bật/tắt, thêm/xóa/sắp xếp mục, xem trước và nút lưu theo cuộn. Lưu độc lập settings/home.productNeeds và productFaq, giữ thiết lập khác. Tải dữ liệu hoặc danh sách sản phẩm lỗi sẽ khóa lưu. Các nhãn nhu cầu hiển thị mặc định; gợi ý sản phẩm chỉ có khi admin chọn và lưu. FAQ mẫu chưa gán sản phẩm sẽ không hiển thị công khai.

Chọn theo nhu cầu xuất hiện trước bộ sưu tập trên trang chủ. Mẫu gồm Làm sạch, Dưỡng sáng, Khử mùi, Chưa biết chọn gì. Admin chọn rõ ID sản phẩm gợi ý cho từng nhu cầu; không tự gán công dụng theo tên. Khách bấm nhu cầu sẽ thấy sản phẩm còn hiển thị và đường dẫn chuẩn tới chi tiết; nhu cầu chưa gán sản phẩm có thông báo do admin chỉnh và liên kết đến bộ sưu tập #shop. Không tự mở chat hoặc gửi tin nhắn. Chọn lại nhu cầu thay kết quả, không tải lại trang.

FAQ xuất hiện dưới nội dung trong cột trái trang chi tiết. Mỗi câu hỏi có nội dung trả lời và danh sách sản phẩm áp dụng riêng, có thể dùng chung cho nhiều sản phẩm. Chỉ hiện câu đầy đủ, đang bật và đúng ID sản phẩm; câu mẫu chưa gán không hiện công khai. Sản phẩm chưa có câu hỏi sẽ ẩn toàn khối. Dùng details/summary để mở/đóng bằng chuột và bàn phím, văn bản hiển thị an toàn và giữ xuống dòng.

Kiểu chữ chỉnh riêng tiêu đề khối, giới thiệu, tên nhu cầu/câu hỏi, lời gợi ý/trả lời và chữ liên kết. Thiết kế chỉnh nền, viền, bo góc, bóng, căn lề, khoảng đệm desktop/mobile, khoảng cách, đường phân cách. Không có biểu tượng trang trí. Câu hỏi luôn giữ tên để khách mở câu trả lời.

Preview của Chọn theo nhu cầu và FAQ có nút Bật/Tắt đồng bộ với checkbox hiển thị trong Nội dung. Tắt ẩn khung xem trước, hiện trạng thái và giữ toàn bộ nội dung; bật lại khôi phục bản nháp. Chỉ áp dụng trên website khi Lưu thiết lập. Nút khóa khi đang tải, tải lỗi hoặc đang lưu. Visual Builder cũng có công tắc ngay cạnh Desktop/Mobile, dùng chung trạng thái với danh sách mục bên trái và chỉ lưu phần sectionVisibility đã đổi khi bấm Lưu tất cả.

Visual Builder có mục riêng Chọn theo nhu cầu và FAQ sản phẩm trong danh sách bên trái, có preview riêng Desktop/Mobile và công tắc. Hai mục dùng trực tiếp productNeeds.enabled/productFaq.enabled giống trình chỉnh nội dung; lưu từ Builder chỉ ghi lá enabled đã đổi, không ghi lại danh sách sản phẩm, câu hỏi hay kiểu chữ. Chọn theo nhu cầu có thể bật độc lập với Bộ sưu tập; khi Bộ sưu tập tắt sẽ ẩn liên kết #shop để tránh đường dẫn đến phần không có trên trang. Preview vẫn hiện nội dung để kiểm tra khi mục đang tắt, kèm trạng thái rõ ràng.

Quy tắc phát triển: mọi khối thêm vào trang chủ phải đăng ký trong src/lib/page-sections.js và được bọc kiểm tra hiển thị khi render. Visual Builder dùng chính danh mục này để tạo công tắc. Với khối có thiết lập enabled riêng, khai báo settingsKey để dùng chung nguồn trạng thái, không tạo hai công tắc mâu thuẫn. Kiểm tra page-sections.test.js phát hiện key hiển thị công khai chưa có trong danh mục.

## Tra cứu đơn hàng

Trang /tra-cuu-don-hang nhận mã đơn và số điện thoại đầy đủ đã đặt. Footer có liên kết Tra cứu đơn hàng; màn hình đặt hàng thành công cũng có liên kết mang theo riêng mã đơn, không đưa số điện thoại vào URL. Có thể chỉnh chữ liên kết footer và kiểu chữ chung của liên kết trong Visual Builder → Footer → Tra cứu đơn hàng; để trống chữ để ẩn liên kết.

Trạng thái lấy trực tiếp từ đơn đã lưu, dùng cùng danh mục trạng thái với Admin → Đơn hàng: Mới nhận, Đã xác nhận, Đang giao, Hoàn tất, Đã hủy. Admin cập nhật như hiện tại; không tự gửi thêm email khi khách tra cứu. Kết quả gồm sản phẩm, dung tích, số lượng, tiền hàng, phí giao hàng, tổng tiền, thanh toán, ngày đặt và cập nhật. Đây là tiến trình cửa hàng, chưa tích hợp hành trình từ hãng vận chuyển. Tổng tiền/phí ship chưa xác định hiển thị ORORA sẽ xác nhận.

API POST /api/order-tracking chạy trên máy chủ với Firebase Admin hiện có. Tra cứu đúng mã và điện thoại đã chuẩn hóa (+84 tương đương số 0 đầu đối với số Việt Nam). Mã cũ vẫn hỗ trợ. Không trả UUID nội bộ, tên người mua, điện thoại, địa chỉ, email, ghi chú hay lịch sử email. Sai mã hoặc sai số điện thoại trả cùng một thông báo; không có danh sách đơn công khai, không mở quyền đọc Firestore cho khách. Dữ liệu gửi qua POST, không lưu trong URL/localStorage; phản hồi no-store và trang noindex.

Giới hạn lưu bền trong orderLookupLimits: mỗi IP 10 lượt/10 phút, 60/ngày; mỗi số điện thoại 20 lượt/10 phút, 100/ngày, lưu khóa băm theo ngày, không lưu điện thoại/IP thô trong bộ đếm. Dùng NEWSLETTER_SITE_ORIGIN giống API đặt hàng; có thể đặt ORDER_TRACKING_RATE_SALT (không bắt buộc). Bộ đếm có expiresAt để cấu hình TTL Firestore nếu cần dọn tự động. Mọi phản hồi đều không cache; đọc lỗi không lộ thông tin hệ thống.
