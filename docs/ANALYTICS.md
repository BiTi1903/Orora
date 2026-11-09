# Thống kê website và thanh toán

Admin → Tổng quan có hai biểu đồ cạnh nhau trên desktop, xếp dọc trên điện thoại, chọn 7/30/90 ngày và Làm mới. Biểu đồ khách/lượt xem theo ngày, biểu đồ giá trị đơn đã thanh toán, bảng tối đa 20 sản phẩm xếp theo lượt bấm và số liệu từng ngày có thể mở thêm. Tooltip trên biểu đồ ghi ngày/giá trị; bảng dữ liệu hỗ trợ đọc đầy đủ.

## Ý nghĩa số liệu

- Lượt xem: mở một trang công khai được hỗ trợ, gồm trang chủ, chi tiết sản phẩm, tra cứu và các đường dẫn điều hướng công khai. Bỏ query/hash khỏi dữ liệu. Đợi tuyến trang ổn định 150ms để tránh đếm cả URL chuyển hướng và URL đích.
- Khách/ngày: trình duyệt ẩn danh khác nhau trong ngày theo giờ Việt Nam. Một người dùng nhiều thiết bị hoặc xóa bộ nhớ có thể thành nhiều khách; không phải số người chính xác. Không cộng khách từng ngày thành khách duy nhất của cả khoảng.
- Lượt bấm sản phẩm: bấm liên kết nội bộ dẫn tới /product/…; mở trực tiếp từ ngoài website chỉ có lượt xem sản phẩm, không có lượt bấm nội bộ. Tên/alias được gộp theo sản phẩm trong danh mục hiện tại. Sản phẩm đã xóa có thể hiện theo slug cũ.
- Tiền: tổng totalAmount của các đơn paymentStatus=paid và không cancelled, nhóm theo NGÀY ĐẶT ĐƠN, trạng thái hiện tại. Bao gồm phí giao hàng đã chốt. Đây là giá trị đơn đã thanh toán, không phải dòng tiền nhận đúng ngày, lợi nhuận hay sao kê. Đơn chưa có totalAmount không cộng tiền và có số lượng báo riêng. Đổi paid/unpaid/hủy cập nhật báo cáo khi Làm mới; không tự thay đổi dữ liệu đơn.

Không dựng số truy cập cho quá khứ. Ngày trước lần ghi nhận đầu tiên hiển thị “—” và không vẽ đường truy cập về số 0; đơn hàng đã có vẫn có thể tổng hợp theo khoảng chọn. Ngày hôm nay còn đang diễn ra. Chặn thống kê, DNT, Global Privacy Control và lỗi mạng có thể làm thiếu lượt; không coi là công cụ đếm người tuyệt đối.

## Dữ liệu và bảo vệ

SiteAnalytics nằm một lần trong App. Chỉ chạy trên trang công khai, không chạy admin hoặc Preview các thành phần trong Visual Builder. Đọc/ghi một UUID trình duyệt ở localStorage (orora.analytics.visitor), tạo eventId riêng, không thu tên, điện thoại, địa chỉ, email, query, referrer hoặc lịch sử nhập form. Không gửi trước khi kiểm tra tín hiệu riêng tư. Lỗi thống kê không chặn xem sản phẩm/đặt hàng. StrictMode không gửi trùng lượt đầu; yêu cầu gửi lại cùng eventId không cộng lại trong ngày.

POST /api/analytics kiểm tra origin NEWSLETTER_SITE_ORIGIN, JSON tối đa 2KB, UUID, loại sự kiện và whitelist đường dẫn. Bỏ sự kiện nhận diện bot/DNT/GPC. Ghi bằng giao dịch vào siteAnalyticsDaily, siteAnalyticsProducts; sổ chống trùng siteAnalyticsEvents, khách/ngày siteAnalyticsVisitors và giới hạn siteAnalyticsLimits chỉ lưu khóa băm theo ngày, không IP/UUID thô. Mỗi IP tối đa 150 yêu cầu/10 phút và 2.000/ngày. Có thể đặt ANALYTICS_RATE_SALT; mặc định dùng CHAT_RATE_LIMIT_SALT hoặc giá trị riêng của tính năng. Trường expiresAt ở các sổ phụ cho phép bật TTL Firestore để dọn sau khoảng 3 ngày; bảng tổng hợp giữ lại để báo cáo.

GET /api/analytics?days=7|30|90 yêu cầu Firebase ID token đã kiểm tra thu hồi và UID thuộc ORDER_ADMIN_UIDS hoặc NEWSLETTER_ADMIN_UIDS như quản lý đơn hàng. Dùng Firebase Admin hiện có, không mở quyền đọc/ghi thống kê cho khách trong Firestore rules. Trả dữ liệu tổng hợp, không trả chi tiết người mua hay UUID trình duyệt. Phản hồi no-store.

Báo cáo đọc đủ các trang đơn trong khoảng (500 đơn/lượt), chỉ lấy các trường cần tính tiền; không cắt ở trang đầu. Nếu vượt 10.000 đơn hoặc bản ghi sản phẩm/ngày, yêu cầu chọn khoảng ngắn hơn thay vì trả tổng tiền thiếu. Vercel cho API tối đa 60 giây. Không cần dịch vụ analytics bên ngoài hoặc khóa AI.

## Rà soát độ chính xác

Lượt bấm được nghe ở pha bubble sau bộ chặn kéo carousel; thao tác kéo bị hủy không cộng lượt bấm. Listener giữ ổn định khi chuyển trang để vẫn nhận điều hướng React Router; quay lại trang công khai từ admin được ghi nhận là một lượt xem mới. Các sửa cách ghi chỉ áp dụng cho lượt mới, không tự suy đoán/trừ số lượt đã ghi trong quá khứ.

Trước ngày bắt đầu thu thập, API trả null cho lượt xem/khách/lượt bấm, giao diện hiện “—” và biểu đồ để trống; tiền đơn cũ vẫn tính bình thường từ dữ liệu đơn. Ngày đã bắt đầu thu nhưng không có sự kiện ghi nhận có thể hiện 0. Dashboard kiểm tra đủ ngày, không trùng ngày và kiểu dữ liệu/số tiền hợp lệ trước khi vẽ; dữ liệu thiếu hoặc sai sẽ hiện lỗi thay vì tự coi là 0.

## Dữ liệu mẫu để kiểm tra giao diện

Admin → Tổng quan → Xem dữ liệu mẫu mở bộ minh họa 7 ngày, 24–52 lượt xem/ngày, có khách ước tính, lượt bấm, sản phẩm và số tiền giả định. Có thể đổi 7/30/90 ngày; tổng lượt bấm trong bảng sản phẩm khớp tổng biểu đồ. Banner ĐANG XEM DỮ LIỆU MẪU luôn hiển thị. Dữ liệu sinh riêng trong trình duyệt bởi analytics-demo.js, không lưu Firestore, không tạo đơn và không sửa số liệu thu thập. Khi ở chế độ mẫu không gọi API thống kê; Làm mới bị khóa. Bấm Xem dữ liệu thật để đọc lại API. Tải lại trang sẽ trở về chế độ thật.
