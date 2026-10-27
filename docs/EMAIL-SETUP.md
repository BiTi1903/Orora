# Thiết lập email ORORA với Microsoft 365

Có thể thử phương thức SMTP OAuth2 thay cho Graph theo [SMTP-SETUP.md](SMTP-SETUP.md). Graph vẫn là mặc định cho đến khi cấu hình `MS_MAIL_TRANSPORT=smtp`.

## Các tính năng đã bổ sung

- Form ở website gửi đến `/api/subscribe`: chuẩn hóa email, ghi Firestore cùng thời điểm đồng ý nhận tin, sau đó gửi mẫu thư tự động.
- Quản trị → **Email marketing**: xem danh sách email, sửa mẫu tự động, gửi thử đến email do quản trị nhập, soạn và gửi chiến dịch.
- Mỗi khách nhận một thư riêng từ `sales@ororavn.com`, không lộ danh sách khách khác.
- Thư thử, thư tự động và chiến dịch dùng nguyên nội dung đã nhập; không tự nối website hoặc liên kết hủy đăng ký. Các liên kết đã phát hành trong thư cũ vẫn hoạt động.
- Danh sách khách hỗ trợ chọn nhiều (tối đa 100/lần), Hoạt động, Tạm ngưng, Xóa email và lọc trạng thái trong các email đã tải. Chỉ trạng thái `active` được gửi chiến dịch. Xóa khỏi danh sách không xóa lịch sử chiến dịch/deliveries.
- Chiến dịch lưu tiến độ, gửi tối đa 2 thư/mỗi yêu cầu; giao diện chờ 5 giây giữa các đợt. Giữ trang quản trị mở khi gửi. Tạm dừng/đóng trang chỉ dừng các đợt tiếp theo; đợt đã gọi máy chủ vẫn có thể hoàn tất.
- Tiếp tục **chiến dịch cũ** khi mất kết nối. Không tạo chiến dịch mới cho cùng nội dung chỉ vì chưa thấy kết quả: chiến dịch mới có thể gửi lại cho toàn bộ khách.
- Chỉ gửi đến khách đang có trạng thái `active`, đã đồng ý trước thời điểm tạo chiến dịch. Email được đánh dấu lỗi/chưa rõ kết quả không tự gửi lại trong chiến dịch đó.
- `Microsoft đã nhận` là HTTP 202 từ Microsoft Graph, **không phải** xác nhận khách đã đọc hoặc thư đã vào inbox. `Hoàn tất` là đã quét xong danh sách; cần xem riêng số lỗi/chưa rõ.

## 1. Nơi chạy ứng dụng

Repository đã có `vercel.json` và các Vercel Functions trong `api/`. Hướng dẫn này dùng **Vercel + Firestore + Microsoft Graph**. Các endpoint có thời gian xử lý tối đa 60 giây trong cấu hình Vercel; tài khoản triển khai cần hỗ trợ mức này.

`npm run dev` chỉ chạy Vite, **không chạy các API**. Muốn thử trên máy cá nhân, dùng `vercel dev` sau khi liên kết dự án Vercel và thiết lập biến môi trường. Đặt `NEWSLETTER_SITE_ORIGIN` đúng origin của phiên thử, ví dụ `http://localhost:3000`; không dùng cấu hình đó cho production. Với deploy preview, cần origin riêng đúng tên miền preview.

## 2. Cấp quyền gửi thư cho Microsoft 365

Bạn cần quản trị viên của tenant Microsoft 365. Việc đã có hộp thư business chưa tự cấp quyền cho website gửi thư.

1. Mở [Microsoft Entra admin center](https://entra.microsoft.com/) → **App registrations** → **New registration**. Đặt tên `ORORA Newsletter`, chọn tài khoản trong tổ chức hiện tại (single tenant). Backend dùng client credentials, không cần Redirect URI.
2. Trong **Overview**, lấy **Application (client) ID** và **Directory (tenant) ID**.
3. **Certificates & secrets** → tạo client secret. Lưu **Value**, không dùng `Secret ID`. Đặt lịch thay trước ngày hết hạn.
4. **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions** → `Mail.Send`. Không chọn Delegated cho luồng backend này. Quản trị viên bấm **Grant admin consent**.
5. Xác nhận `sales@ororavn.com` là hộp thư Exchange Online có thể gửi thư. Cấu hình backend không dùng mật khẩu hộp thư.
6. `Application Mail.Send` ở Entra có phạm vi rộng trong tenant. Quản trị viên nên giới hạn ứng dụng chỉ được dùng hộp thư `sales@ororavn.com` bằng chính sách truy cập ứng dụng của Exchange, kiểm tra bằng `Test-ApplicationAccessPolicy`. Nếu dùng cơ chế **Application RBAC** mới, làm theo hướng dẫn Exchange và gỡ quyền Entra tương đương có phạm vi toàn tenant; hai cơ chế cấp quyền có tính cộng dồn. Không bật một cấu hình phạm vi hẹp rồi giữ một quyền rộng khác và cho rằng đã giới hạn thành công.

Tài liệu chính thức:

- [Microsoft Graph: sendMail](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [Client credentials flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-client-creds-grant-flow)
- [Giới hạn phạm vi quyền ứng dụng bằng Application Access Policies](https://learn.microsoft.com/en-us/graph/auth-limit-mailbox-access)
- [Application RBAC của Exchange Online](https://learn.microsoft.com/en-us/exchange/permissions-exo/application-rbac)

## 3. Cấu hình Firebase và quyền quản trị email

1. Dùng cùng dự án Firebase với frontend. Bật Firestore và phương thức đăng nhập mà quản trị đang dùng (Email/Password).
2. Firebase Console → **Project settings → Service accounts** → tạo khóa service account. Lưu nội dung JSON vào biến **chỉ phía server** `FIREBASE_SERVICE_ACCOUNT_JSON` của Vercel. Không tải file khóa lên GitHub, không thêm tiền tố `VITE_`.
3. Lấy UID tài khoản quản trị tại Firebase Authentication → Users (hoặc UID dưới thanh bên admin sau khi đăng nhập).
4. Đặt `NEWSLETTER_ADMIN_UIDS` bằng UID đó. Nếu có nhiều quản trị, ngăn bằng dấu phẩy. Backend kiểm tra Firebase ID token và allowlist UID, không dựa vào việc người dùng chỉ truy cập được giao diện `/admin`.
5. Không mở quyền public đọc/ghi các collection newsletter. Firestore Rules hiện tại mặc định từ chối các collection này; backend dùng Firebase Admin SDK. Không cần thêm rule public nào cho newsletter.

## 4. Các biến môi trường trên Vercel

Vào project → **Settings → Environment Variables**. Những giá trị nhạy cảm nhập trực tiếp ở đó, không gửi trong chat. Sau khi thay đổi, **Redeploy** để Functions dùng cấu hình mới.

| Tên | Nội dung |
| --- | --- |
| `MS_TENANT_ID` | Directory (tenant) ID từ Entra |
| `MS_CLIENT_ID` | Application (client) ID |
| `MS_CLIENT_SECRET` | Giá trị client secret, chỉ server |
| `MS_SENDER_EMAIL` | `sales@ororavn.com` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Toàn bộ JSON khóa Firebase Admin, chỉ server |
| `NEWSLETTER_SITE_ORIGIN` | Origin chính xác nơi form và admin chạy, ví dụ `https://ororavn.com`; nếu website dùng `www`, đặt đúng origin `https://www.ororavn.com` |
| `NEWSLETTER_ADMIN_UIDS` | UID Firebase của người được quyền xem danh sách và gửi chiến dịch |
| `NEWSLETTER_UNSUBSCRIBE_SECRET` | Giữ nguyên khóa cũ nếu đã phát hành liên kết hủy đăng ký; không còn bắt buộc cho việc gửi thư mới |

Tạo khóa ngẫu nhiên bằng trình quản lý mật khẩu hoặc `openssl rand -hex 32` **trên máy của bạn**, rồi nhập trực tiếp vào Vercel. Giữ khóa này ổn định: thay khóa sẽ làm các liên kết hủy đăng ký cũ không còn hợp lệ.

Giữ các biến frontend Firebase đang có: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`. Đây là cấu hình ứng dụng web; tuyệt đối không đưa client secret, private key hoặc khóa ký vào biến `VITE_`.

Mẫu tên biến trống có trong `.env.example`. Nếu dùng `.env.local` để phát triển, tệp đó đã được Git ignore. Không đưa secrets vào `vercel.json`.

## 5. Kiểm tra trước khi gửi đến khách

1. Chạy `npm test`, `npm run lint -- --max-warnings 0` và `npm run build`.
2. Deploy trên Vercel sau khi điền biến môi trường.
3. Đăng nhập `/admin` → **Email marketing**. Nếu báo thiếu UID/quyền, đối chiếu UID người đăng nhập với `NEWSLETTER_ADMIN_UIDS`.
4. Sửa mẫu thư tự động, bấm **Lưu mẫu thư tự động**. Sau đó nhập hộp thư bạn sử dụng vào ô **Email nhận thư thử** và bấm **Gửi thư thử**. Có thể khác email đăng nhập Firebase. Thao tác này gửi email thật đến một địa chỉ đã nhập, không gửi đến danh sách khách.
5. Trên website, đăng ký bằng email thử do bạn sở hữu và tích đồng ý. Kiểm tra email đã xuất hiện trong quản trị và thư thật đến inbox/thư rác.
6. Trong danh sách, chọn email thử → **Tạm ngưng** → **Áp dụng**. Email đó bị loại khỏi các đợt chiến dịch tiếp theo. Có thể chuyển lại **Hoạt động** hoặc **Xóa email** sau xác nhận. Thao tác xóa không hoàn tác và giữ lịch sử chiến dịch cũ.
7. Ban đầu chỉ dùng danh sách thử của bạn. Soạn chiến dịch, xem trước, bấm **Gửi đến khách đang đăng ký** và xác nhận. Theo dõi `Microsoft đã nhận`, `Lỗi`, `Chưa rõ` trong lịch sử.

Kiểm thử tự động trong repository dùng Firestore và Microsoft giả lập; **không gửi email thật** và chưa xác minh quyền tenant hoặc khả năng thư vào inbox. Cần hoàn tất các bước kiểm tra production ở trên.

## 6. Xử lý lỗi và giới hạn vận hành

- **API lỗi `ERR_REQUIRE_ESM` tại `jwks-rsa` / `jose`:** một số loader Vercel Node.js 22 không hỗ trợ chuỗi CommonJS `require()` sang ESM của Firebase Admin 14. Dự án ghim `firebase-admin` ở `13.10.0` cùng lockfile để dùng chuỗi dependency CommonJS tương thích. Kiểm thử `tests/api-startup.test.js` nạp các API thật với `--no-experimental-require-module` để bắt lại lỗi này. Sau khi cập nhật mã, deploy lại; không cần đổi khóa Microsoft vì lỗi này.

- **Website chỉ báo lỗi kết nối API:** không chạy bằng Vite thuần để thử phần gửi mail; kiểm tra deploy Vercel Functions và domain.
- **Microsoft từ chối xác thực:** kiểm tra Tenant ID, Client ID, giá trị secret và hạn dùng.
- **Microsoft từ chối gửi:** kiểm tra `Application Mail.Send`, admin consent, phạm vi Exchange, hộp thư người gửi, các giới hạn tài khoản. Với 429, dừng gửi và chờ Microsoft bỏ giới hạn, không tạo chiến dịch mới để thử liên tục.
- **Email đã lưu nhưng gửi lỗi:** contact vẫn ở Firestore. Thư tự động giới hạn 5 lượt/IP/giờ, 100 lượt website/24 giờ; retry lỗi xác định có thời gian chờ. Không báo gửi thành công khi Microsoft chưa nhận.
- **Mất kết nối khi gửi chiến dịch:** đợi đợt đang chạy kết thúc; nếu gặp khóa phiên, chờ tối đa 2 phút, tải lại và chọn tiếp tục chiến dịch cũ. Thư đã đặt chỗ nhưng chưa rõ Microsoft nhận hay chưa được đánh dấu `Chưa rõ`, không gửi lại tự động để tránh trùng.
- **Khách ngừng nhận trong khi đang có một thư gửi đi:** các lần xử lý tiếp theo sẽ bỏ qua khách đó; thư đã gửi/đã bắt đầu xử lý có thể vẫn đến.
- **Danh sách lớn:** giải pháp này xử lý các đợt nhỏ bằng trang quản trị đang mở; không phải worker chạy nền khi bạn đóng trình duyệt. Hạn mức Exchange phụ thuộc tenant và hộp thư. Với nhu cầu marketing lớn hoặc cần theo dõi bounce/delivery, nên chuyển adapter gửi sang dịch vụ email marketing có queue và webhook.
- **Chưa có thống kê đọc/bounce:** không suy diễn `accepted` thành đã giao thư; kiểm tra Sent Items/NDR và Message Trace của Microsoft 365 khi cần.
- Thư thử và chiến dịch đều dùng cùng sender; địa chỉ trong trường `MS_SENDER_EMAIL` phải thuộc phạm vi ứng dụng được phép.

## Dữ liệu được lưu

- `newsletterSubscribers/{sha256(email)}`: email, trạng thái, nguồn, thời điểm đồng ý, trạng thái thư tự động.
- `newsletterSettings/welcome`: tiêu đề/nội dung mẫu gửi cho người mới.
- `newsletterCampaigns/{id}`: nội dung chiến dịch, tiến độ, số Microsoft nhận/lỗi/chưa rõ, lease chống chạy đồng thời.
- `newsletterCampaigns/{id}/deliveries/{subscriberId}`: trạng thái xử lý từng người của chiến dịch, dùng để tránh gửi trùng.
- `newsletterLimits`: bộ đếm chống lạm dụng form công khai.

Không xóa lịch sử deliveries của chiến dịch đang gửi hoặc đang tạm dừng. Không chia sẻ dữ liệu khách hàng hoặc khóa cấu hình qua repository công khai.
