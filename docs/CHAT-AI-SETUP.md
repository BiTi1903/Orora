# Chat AI của ORORA

## Bật OpenAI trên Vercel

Nút chat mở khung trò chuyện trong website và trang chi tiết sản phẩm. Khách có thể chọn câu hỏi sẵn, tự nhập câu hỏi, nhận câu trả lời, thẻ sản phẩm, đường dẫn và các câu hỏi tiếp theo. Hội thoại được giữ khi đóng/mở chat hoặc chuyển trang trong cùng lần mở website.

Trong **Vercel → Project → Settings → Environment Variables**, đặt:

| Biến | Giá trị |
| --- | --- |
| `OPENAI_API_KEY` | Khóa API của dự án OpenAI có quyền và hạn mức sử dụng API |
| `OPENAI_CHAT_MODEL` | Mặc định `gpt-4.1-mini`; model cần hỗ trợ Responses API và JSON schema |
| `CHAT_SITE_ORIGIN` | `https://ororavn.com` hoặc origin chính xác đang triển khai |
| `CHAT_AI_DAILY_LIMIT` | Tối đa lượt gọi AI/ngày cho toàn website, mặc định `250` |
| `CHAT_RATE_LIMIT_SALT` | Chuỗi ngẫu nhiên riêng để băm địa chỉ mạng trong bộ đếm |

API dùng lại `FIREBASE_SERVICE_ACCOUNT_JSON` của các chức năng máy chủ hiện có. Sau khi thêm hoặc đổi biến môi trường, redeploy. Không đặt khóa OpenAI trong biến `VITE_`, cấu hình Firebase công khai, mã nguồn hoặc nội dung chat. Gói ChatGPT và hạn mức API là hai dịch vụ riêng; tài khoản API cần còn hạn mức sử dụng.

Mục **Admin → Chat AI → Kết nối OpenAI** cho biết máy chủ đã có khóa hay chưa; đây là kiểm tra sự hiện diện cấu hình, không phải xác minh khóa có quyền/hạn mức. Sau khi cấu hình, thử gửi câu hỏi trên website. Nhãn AI và thẻ AI trên câu trả lời chỉ xuất hiện theo chế độ thực tế. Thiếu khóa, hết hạn mức ngày, lỗi nhà cung cấp, phản hồi không hợp lệ hoặc quá thời gian sẽ dùng câu trả lời theo thông tin cửa hàng; không giả là câu trả lời từ model.

Chưa có khóa trong môi trường làm việc thì chỉ kiểm tra bằng OpenAI giả lập; không thể xác nhận dịch vụ AI thật hoặc tình trạng triển khai Vercel từ kết quả đó.

## Chỉnh trong admin

**Admin → Chat AI** có bật/tắt, tên trợ lý, lời chào, chữ gợi ý ô nhập, phong cách trả lời, tối đa sáu lựa chọn ban đầu và kiến thức bổ sung. Mỗi lựa chọn có tên hiển thị và câu hỏi gửi đi. Xóa hết danh sách sẽ chỉ giữ ô chat. Lưu chỉ ghi các thuộc tính `settings/home.chatSettings` đã thay đổi và giữ nguyên nội dung/thiết lập khác. Tải cấu hình lỗi thì không cho lưu để tránh ghi đè bằng mặc định.

Kiến thức bổ sung dành cho thông tin được phép công khai về cửa hàng và câu hỏi thường gặp. Nội dung này nằm trong tài liệu Firebase công khai. Không nhập khóa, dữ liệu khách hoặc thông tin riêng vào đây.

## Nguồn thông tin và đường dẫn

Máy chủ chỉ đọc danh mục sản phẩm và các trường công khai cần thiết: tên, giá, dung tích, mô tả, nội dung chi tiết, giới thiệu, cam kết, phương thức thanh toán và kênh liên hệ. Không đọc đơn hàng, danh sách khách, email hoặc ghi chú nội bộ sản phẩm để cung cấp cho AI. Nội dung sản phẩm dùng các trường cũ/mới theo cùng quy tắc website. Danh mục được cache tối đa 30 giây; công tắc chat đọc lại ở mỗi yêu cầu.

AI nhận ngữ cảnh sản phẩm khách đang xem và tối đa 16 tin nhắn gần nhất; mỗi tin nhắn gửi lên tối đa 1.200 ký tự. AI chọn ID sản phẩm và ID đường dẫn; máy chủ gắn giá, ảnh, tên và URL thật, lọc sản phẩm ẩn/không tồn tại. Model không thể tạo URL tùy ý, tự đổi giá trong thẻ hoặc gọi chức năng đặt hàng/thanh toán. Khách vẫn đặt đơn qua form hiện có.

Chỉ khi có thông tin nguồn mới trả lời các chi tiết về công dụng/cách sử dụng/chính sách. Chat hướng dẫn chọn địa chỉ trong form để tính phí ship, không tự suy ra miễn phí hoặc phí giao hàng khi thiếu địa chỉ. Câu trả lời AI vẫn cần được đối chiếu với thông tin sản phẩm; hệ thống kiểm tra đường dẫn và dữ liệu thẻ, không bảo đảm mọi câu chữ của model đều đúng.

## Hạn mức và dữ liệu hội thoại

Mỗi địa chỉ mạng có tối đa 15 yêu cầu trong 10 phút và 60 yêu cầu/ngày. Bộ đếm ngày dùng giờ Việt Nam. Bộ đếm toàn website mặc định cho phép 250 lượt OpenAI/ngày; có thể chỉnh bằng biến máy chủ (tối đa 2.000). Hết hạn mức AI chung thì chuyển sang hỗ trợ theo thông tin cửa hàng. Đổi biến môi trường cần redeploy.

Collection `chatRateLimits` chỉ lưu số lượt, thời điểm và ID đã băm, không lưu địa chỉ IP thô hoặc nội dung trò chuyện. Các collection không được cấp quyền trong Firestore Rules hiện tại bị từ chối truy cập từ client. Có trường `expiresAt` sau 48 giờ; có thể bật Firestore TTL cho trường này để dọn bộ đếm cũ.

Website không ghi hội thoại vào Firestore/localStorage; tin nhắn chỉ nằm trong bộ nhớ của tab và mất khi tải lại hoặc bấm bắt đầu cuộc trò chuyện mới. Khi dùng AI, phần hội thoại gần nhất và thông tin cửa hàng được gửi đến OpenAI qua máy chủ, với Responses API `store: false`. Việc xử lý/lưu giữ ở nhà cung cấp vẫn theo chính sách và thiết lập tài khoản OpenAI; `store: false` không đồng nghĩa với cam kết không lưu dữ liệu ở mọi tầng dịch vụ.

## Kiểm tra

Chạy `npm test`, `npm run lint`, `npm run build`. Các kiểm thử API dùng Firestore trong bộ nhớ và phản hồi OpenAI giả; không gọi model trả phí, ghi dữ liệu sản xuất hoặc tạo đơn thật. Kiểm tra trình duyệt gồm mở chat, gợi ý, gửi/nhận, hội thoại nhiều lượt, đường dẫn, retry, reset, đóng/mở, kéo nút, màn hình hẹp và lưu admin.

`vite` chỉ phục vụ frontend. Để chạy API tại máy phát triển, cần môi trường Vercel Functions hoặc nối `/api/chat` với server chạy handler; không coi phản hồi HTML của Vite là câu trả lời AI.

## Chữ trong khung chat và lời nhắc

Admin → Chat AI → Chỉnh từng chữ trong khung chat: chọn riêng tên trợ lý, trạng thái, lời chào, tin nhắn trợ lý/khách, gợi ý, ô nhập, placeholder, dòng cuối, liên hệ, tên/giá sản phẩm, đường dẫn, tên người gửi và thông báo. Có font, cỡ máy tính/mobile, màu, độ đậm, căn lề, giãn dòng/chữ và trang trí chữ; lưu ở chatSettings.textStyles. Các dòng giao diện cố định chỉnh ở chatSettings.labels; không thay tên/giá sản phẩm hoặc nội dung AI bằng các nhãn này. Kiểu riêng ưu tiên hơn font chung, bỏ trống để dùng mặc định.

Lời nhắc cạnh nút chat mặc định hiện sau 5 giây, tự ẩn sau 10 giây. Có nút đóng và bấm nội dung để mở chat. Sau khi khách mở chat hoặc đóng lời nhắc thì không hiện lại trong lần mở trang đó. Admin chỉnh nội dung, bật/tắt và thời gian chờ 1–60 giây. Mở lời nhắc không gọi OpenAI; chỉ gửi câu hỏi mới phát sinh yêu cầu AI.
