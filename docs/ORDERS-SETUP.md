# Đặt hàng website và kênh TikTok/Facebook

## Cấu hình trên admin

Vào **Admin → Sản phẩm → Kênh mua hàng dùng chung**:

- Nhập link HTTPS TikTok Shop và Facebook fanpage/shop. Để trống để ẩn nút tương ứng.
- Chọn phương thức thanh toán cho đơn web: COD hoặc chuyển khoản sau khi xác nhận.
- Bấm **Lưu kênh mua hàng**. Cấu hình này nằm ở `settings/home.shopLinks`, áp dụng cho tất cả sản phẩm và tách khỏi link mạng xã hội ở chân trang.

Trong **Trang chủ → Chi tiết SP**, bấm cụm nút mua hàng để đổi tên nút, màu nền và kiểu chữ. Preview dùng sản phẩm mẫu và không gửi đơn.

## Khách đặt trên website

Mỗi form đặt một sản phẩm với số lượng từ 1–20. Khách nhập họ tên, số điện thoại, email nhận xác nhận đơn, địa chỉ, phương thức thanh toán và ghi chú tùy chọn, rồi xác nhận cho shop xử lý thông tin đơn hàng.

Máy chủ kiểm tra sản phẩm đang hiển thị và lấy giá trực tiếp từ Firebase. Giá thay đổi trong lúc khách mở form sẽ yêu cầu khách tải lại trước khi đặt. Giá dạng “Liên hệ” được để chờ báo giá. Tạm tính chưa gồm phí giao hàng; shop liên hệ xác nhận phí giao hàng và thanh toán.

Sau khi gửi, khách nhận mã đơn. Một mã yêu cầu được giữ nguyên trong lần mở form để thử gửi lại sau lỗi mạng không tạo trùng đơn đã nhận. Đơn mới luôn có trạng thái `new` và thanh toán `unpaid`. Chuyển khoản hiện là lựa chọn để shop xác nhận, chưa có cổng thu tiền hoặc xác nhận giao dịch tự động.

## Quản lý đơn

Vào **Admin → Đơn hàng** để xem danh sách gọn. Bấm **Xem đơn** để mở đủ thông tin người mua, sản phẩm, số lượng, tạm tính, phương thức thanh toán và lịch sử email. Có ô xác nhận nhanh trong danh sách, các trạng thái xử lý và ô đánh dấu thanh toán trong chi tiết. Chỉ đánh dấu “Đã thanh toán” sau khi kiểm tra tiền thực nhận. Danh sách tải 50 đơn gần nhất mỗi trang, có nút tải thêm.

Máy chủ dùng cấu hình hiện có:

- `FIREBASE_SERVICE_ACCOUNT_JSON` đúng dự án Firebase của website.
- `NEWSLETTER_SITE_ORIGIN` khớp origin của website (hoặc origin localhost khi chạy local).
- `ORDER_ADMIN_UIDS` nếu có; nếu không, dùng danh sách `NEWSLETTER_ADMIN_UIDS` đang cấu hình cho API email.

Đơn lưu trong collection `orders`. Dữ liệu người mua chỉ đọc/cập nhật qua `/api/admin-orders` có xác thực Firebase và kiểm tra UID. Collection `orders` và dữ liệu bộ đếm cũ `orderRateLimits` không có quyền truy cập công khai trong Firestore Rules hiện tại của repository. Không thêm quy tắc cho phép khách đọc các collection này. `/api/orders` chỉ nhận POST và trả mã đơn/tạm tính; không có API công khai để tra cứu thông tin khách.

Thông tin sản phẩm được chụp tại lúc nhận đơn, nên đổi tên/giá sản phẩm sau này không thay đổi bản ghi của đơn cũ. Các API không gọi điện hoặc thu tiền thay shop.

## Email xác nhận đơn

Đơn mới yêu cầu email hợp lệ và tự gửi thư xác nhận đã nhận yêu cầu đặt hàng qua cấu hình Microsoft mailer hiện có trong `docs/EMAIL-SETUP.md`. Không tự đánh dấu đơn đã xác nhận hoặc đã thanh toán. Đơn cũ không bị thay đổi; đơn thiếu email không thể gửi thư từ admin.

Vào **Admin → Đơn hàng → Thư đơn hàng → Viết thư đơn hàng** để sửa mẫu thư, chèn biến thông tin đơn và gửi lại cho email đã lưu trong đơn. Lưu mẫu trước khi gửi. Mẫu được lưu riêng ở `newsletterSettings/orderConfirmation`, không ghi đè mẫu chào mừng người đăng ký nhận tin. Khách đặt hàng không tự được thêm vào danh sách email marketing.

Lịch sử tại `orders/{id}/mailEvents` lưu người nhận, nội dung đã gửi, thời gian, gửi tự động/thủ công và kết quả. “Microsoft đã nhận” chỉ là hệ thống gửi đã chấp nhận, chưa bảo đảm phát tới hộp thư khách. Nếu gửi thất bại, đơn vẫn được lưu. Yêu cầu đặt lại do lỗi mạng không gửi trùng thư tự động. Kết quả chưa rõ hoặc đang xử lý sẽ chặn gửi lại để tránh trùng; cần đối chiếu thư đã gửi trên Microsoft. Khi gửi lại thư đã được Microsoft nhận, admin phải xác nhận.

## Thanh toán và thống kê theo email

Danh sách đơn hiển thị **Thanh toán khi nhận hàng (COD)** cho đơn COD chưa thu tiền; đơn chuyển khoản chưa được admin đánh dấu nhận tiền hiển thị **Chưa thanh toán**. Cả hai hiện **Đã thanh toán** khi admin tích ô xác nhận nhận tiền hoặc chọn trạng thái **Hoàn tất**. Chuyển khỏi Hoàn tất không tự bỏ ghi nhận thanh toán; admin điều chỉnh bằng ô thanh toán. Đơn đã hoàn tất trước thay đổi này không bị tự sửa hàng loạt: tích ô thanh toán nếu đã nhận tiền. Phương thức `paymentMethod` của đơn luôn được giữ riêng, không bị đổi khi cập nhật thanh toán.

Trong **Đơn hàng → Khách hàng theo email**, hệ thống tải tất cả các trang đơn để tổng hợp số đơn, tổng tạm tính, số tiền đã thanh toán và chưa thu theo email (không phân biệt hoa thường). Có tìm kiếm khách hàng và nút mở các đơn của email đó. Số đơn gồm đơn hủy, nhưng cột tiền loại đơn hủy, chưa tính phí giao hàng và không cộng đơn chờ báo giá. Đơn cũ thiếu email được báo số lượng riêng; không sửa dữ liệu cũ để tự gán người mua. Đây là thống kê đơn hàng, không phải báo cáo doanh thu hay đối soát thanh toán.

## Bộ lọc

Danh sách đơn có tìm mã/ID, tên, email hoặc điện thoại; lọc trạng thái và bộ lọc nâng cao theo khoảng tạm tính, ngày đặt (giờ Việt Nam), tình trạng thu tiền và phương thức thanh toán. Có sắp xếp mới/cũ hoặc số tiền tăng/giảm. Bộ lọc áp dụng cho các đơn đã tải; dùng **Tải toàn bộ đơn để lọc** nếu cần tìm trên tất cả các trang. Đơn chưa có giá không thuộc khoảng tiền đã nhập. **Xóa bộ lọc đơn** khôi phục cách xem mặc định.

Thống kê khách hàng có lọc khoảng tổng giá trị và sắp xếp theo số đơn, tổng giá trị, tiền đã thanh toán hoặc tên. Những bộ lọc này chỉ thay đổi cách hiển thị, không cập nhật đơn hoặc dữ liệu khách.

## Địa chỉ hai cấp và phí giao hàng

- Admin có mục **Phí vận chuyển**. Chọn tỉnh/thành để lưu phí chung, tùy chọn phường/xã để đặt phí riêng. Phí riêng được ưu tiên; để trống phí riêng và lưu sẽ dùng lại phí chung. Số **0** là miễn phí, để trống phí chung là chưa có báo giá. Lưu từng vùng trước, sau đó bật **Tự tính phí ship khi khách đặt hàng** và lưu trạng thái.
- Cấu hình lưu riêng ở `settings/home.shippingSettings`, không thay đổi link shop, nội dung giao diện hoặc các đơn cũ. Khi bật, địa chỉ chưa có mức phí sẽ chưa nhận đơn; khi tắt vẫn nhận đơn nhưng phí/tổng tiền chờ xác nhận như trước.
- Form dùng tỉnh/thành → phường/xã, kèm số nhà/tên đường. `/api/addresses` phục vụ dữ liệu `vietnam-divisions-js@3.0.0`, hệ thống mới NQ 202/2025/QH15 (34 tỉnh/thành, 3.321 đơn vị cấp xã). Dữ liệu được đóng gói trên máy chủ, không gửi dữ liệu khách sang dịch vụ địa chỉ ngoài. Đây là snapshot của nguồn thư viện cộng đồng, không phải tra cứu trực tiếp cơ sở dữ liệu nhà nước; cần cập nhật phiên bản khi địa giới/mã thay đổi. Bản cũ 63 tỉnh, quận/huyện không được dùng cho đơn mới.
- Máy chủ xác thực phường/xã thuộc tỉnh/thành, lấy tên chuẩn, tính lại giá sản phẩm + phí giao hàng và lưu `shippingFee`, `totalAmount` cùng địa chỉ chuẩn trên đơn. Giá ship đổi giữa lúc xem và đặt sẽ bị từ chối để khách kiểm tra lại. Gửi lại cùng yêu cầu giữ giá/địa chỉ của đơn đã nhận, không tạo đơn thứ hai. Dữ liệu địa chỉ và tiền của đơn cũ không được sửa hàng loạt.
- Thư đơn hàng hỗ trợ thêm `{{shippingFee}}`, `{{totalAmount}}`. Nội dung mẫu đã lưu không tự đổi; có thể thêm biến khi soạn/sửa mẫu trong Email. Thống kê tiền sản phẩm theo email vẫn không cộng phí vận chuyển vào doanh số sản phẩm.
- QR và webhook đối soát chưa được bật trong bước này. Cần tài khoản dịch vụ nhận/đối soát, liên kết ngân hàng và cấu hình xác thực webhook trước khi ghi nhận tiền tự động. Không suy diễn đặt đơn hoặc quét QR là thanh toán thành công.

Kiểm thử dùng bộ địa chỉ thật của thư viện, Firestore trong bộ nhớ và SMTP giả; không giao dịch tiền thật. Môi trường làm việc không truy cập trực tiếp được các trang API địa chỉ/SePay (proxy trả 403), nên không xác minh trực tiếp bảng phí/ngân hàng được hỗ trợ của SePay tại thời điểm này.

### Tra cứu phí, xem đơn và thư xác nhận đầy đủ

Ô tỉnh/thành và phường/xã có tìm kiếm (kể cả gõ không dấu), dùng bàn phím hoặc chọn trực tiếp. Admin có bảng **Phí vận chuyển đã lưu** gồm phí chung và phí riêng, tìm khu vực và nút **Chỉnh phí**; bảng không coi bản nháp chưa lưu là phí đang áp dụng. Chi tiết đơn trong admin và thông tin đơn sau khi đặt thành công mở bằng popup giữa màn hình, có nút đóng, Escape và vùng cuộn cho mobile.

Thư đơn hàng gửi theo đúng mẫu đang áp dụng, không tự nối thêm khối thông tin. Đã khôi phục hành vi này theo yêu cầu sau bản thay đổi bổ sung thông tin đơn. Muốn thêm phí/tổng tiền/ghi chú vào nội dung, đặt các biến trong mẫu: `{{shippingFee}}`, `{{totalAmount}}`, `{{note}}`, `{{unitPrice}}`, `{{createdAt}}`, `{{paymentStatus}}`. Không đổi adapter SMTP/Graph, tài khoản gửi hoặc cấu hình xác thực. Mẫu đã lưu và lịch sử thư cũ không bị ghi đè.

### Không giới hạn lượt đặt theo thông tin khách

Form đặt hàng không áp dụng quota IP/toàn website hoặc honeypot; tên, số điện thoại và email trùng vẫn được đặt đơn mới. Bộ đếm `orderRateLimits` cũ được giữ nhưng không đọc/ghi nữa. Vẫn kiểm tra dữ liệu hợp lệ, địa chỉ, tồn có thể bán, giá/phí và phương thức thanh toán. Cùng request ID chỉ tạo một đơn và không gửi thư lặp; thư đang xử lý/chưa rõ kết quả không tự gửi lại. Các cơ chế này không chặn theo tên hay số điện thoại. NDR 5.7.708 là từ Microsoft, độc lập với kiểm tra form.

### Email và nhật ký trong chi tiết đơn

**Đơn hàng** gồm Danh sách đơn, Khách hàng, Lịch sử email và Thư tự động. Mở chi tiết để xử lý, ghi nhận thanh toán, gửi email cho đúng khách hoặc xem **Nhật ký xử lý**. Kho **Email → Mẫu Thư** dùng chung. Không thay đổi SMTP/OAuth2 hoặc nội dung gửi. Lịch sử email vẫn đọc `orders/{id}/mailEvents`.

### Thông báo đơn chờ xác nhận

- Menu **Đơn hàng** hiển thị tổng số đơn có `status = new`, kể cả đơn ngoài trang đang tải. API riêng `GET /api/admin-orders?summary=1` dùng phép đếm Firestore và trả mã đơn mới nhất; không trả tên, địa chỉ, email hay nội dung đơn. Vẫn yêu cầu token và UID quản lý đơn như API hiện có, `Cache-Control: no-store`.
- Khi admin đang hiển thị, kiểm tra mỗi 60 giây; quay về tab/cửa sổ kiểm tra lại với khoảng cách tối thiểu 15 giây để tránh gọi lặp. Không chạy định kỳ khi tab ẩn hoặc đã đăng xuất. Có timeout, không để các lần đọc chồng nhau. Thông báo chỉ trong trang admin, không phải push notification của trình duyệt.
- Lần đầu chỉ hiển thị số chờ. Đơn mới tiếp theo hiện thông báo kèm nút **Xem đơn chờ**, chuyển về danh sách với bộ lọc Mới nhận. Danh sách đã mở cập nhật nền khi phát hiện đơn mới, giữ bộ lọc và dữ liệu đã tải; không ghi đè thao tác đang xử lý. Sau khi đổi trạng thái, số chờ được kiểm tra lại.
- Khi đọc lỗi, không coi là 0 đơn. Giữ số đọc lần trước và ghi chú lỗi ở tooltip; lỗi quyền sẽ dừng kiểm tra và ẩn số cũ. Đổi tài khoản/đăng xuất hủy tác vụ và xóa trạng thái giao diện. Không lưu dữ liệu khách vào localStorage.

### Nhật ký xử lý

Các thay đổi trạng thái, thanh toán, xuất kho và xác nhận hoàn hàng được ghi vào `orders/{id}/activityEvents/{uuid}` **trong cùng transaction** cập nhật đơn/kho. Chỉ ghi khi giá trị thay đổi; thao tác lỗi hoặc gửi lại cùng trạng thái không tạo sự kiện thừa. Hoàn kho lặp không cộng kho hay ghi nhật ký lần hai.

Mỗi bản ghi giữ `action`, `changes` (trước/sau), `actor`/`actorName`/`actorEmail` từ token được xác thực và `createdAt` phía máy chủ; xuất/hoàn kho có số lượng. Không lấy người thao tác từ body client và không đổi tên lịch sử theo hồ sơ tài khoản sau này. Firestore rules hiện có không cho client đọc/ghi collection đơn; API không có thao tác sửa/xóa nhật ký.

Chi tiết đơn tải 30 sự kiện mới nhất; **Tải thêm nhật ký** phân trang trong đúng đơn. Giờ hiển thị Việt Nam. Nhật ký cũ chưa có không được tạo giả hoặc suy đoán từ `updatedBy`; mọi dữ liệu đơn/thư/kho cũ được giữ nguyên. Email đã có lịch sử riêng, không ghi trùng vào nhật ký xử lý. Kiểm thử dùng Firestore trong bộ nhớ và xác thực giả; không thao tác đơn hoặc gửi email sản xuất.
