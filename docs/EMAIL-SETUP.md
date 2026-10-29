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
- **Đăng ký nhận tin:** API lưu email vào Firestore trước rồi trả thành công; Vercel tiếp tục gửi thư chào mừng bằng `waitUntil` trong thời gian thực thi của Function (tối đa 60 giây). Thành công đăng ký không có nghĩa thư đã được giao. Lỗi gửi được lưu trong trạng thái thư tự động để quản trị viên kiểm tra. Đây không phải hàng đợi bền vững có worker tự thử lại.
- **Không chặn spam trên form đăng ký:** không giới hạn IP, tổng lượt website, thời gian chờ hay honeypot. Vẫn kiểm tra email hợp lệ và đồng ý nhận tin. Email đang gửi, đã được Microsoft nhận hoặc chưa rõ kết quả có thể đăng ký lại thành công nhưng không gửi thư lặp. Lỗi gửi xác định cho phép thử lại ngay.
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
- `newsletterLimits`: dữ liệu bộ đếm cũ được giữ nguyên nhưng form đăng ký không còn đọc hoặc áp dụng.

Không xóa lịch sử deliveries của chiến dịch đang gửi hoặc đang tạm dừng. Không chia sẻ dữ liệu khách hàng hoặc khóa cấu hình qua repository công khai.

### Chọn người nhận khi soạn thư

Trong **Email marketing → Soạn và gửi thư**, mặc định chọn email cụ thể từ danh sách đang hoạt động. Có tìm kiếm, chọn tất cả kết quả đang hiển thị và bỏ chọn; tối đa 100 địa chỉ mỗi thư ở chế độ này. Tìm kiếm không bỏ các địa chỉ đã chọn trước đó. Có thể chọn **Toàn bộ email đang hoạt động** để gửi tới cả những địa chỉ chưa tải trên màn hình.

Thư lưu danh sách ID người nhận tại lúc tạo để tiếp tục gửi đúng danh sách. Máy chủ đọc địa chỉ từ dữ liệu đã lưu, kiểm tra lại trạng thái và bỏ qua email đã tạm ngưng, hủy đăng ký hoặc bị xóa. Các thư cũ không có danh sách người nhận riêng vẫn giữ hành vi gửi toàn bộ email hoạt động như trước.

### Lịch sử thư đơn hàng

**Email marketing → Thư đơn hàng đã gửi** tổng hợp các bản ghi `orders/{id}/mailEvents` hiện có, gồm thư tự động và thư gửi riêng từ admin, kể cả lần gửi lỗi/chưa rõ kết quả. Có tìm theo email, tên khách, mã/ID đơn, tiêu đề; lọc cách gửi và kết quả. Bấm một thư để xem đúng nội dung, người nhận và thời gian đã lưu. Danh sách tải lịch sử qua các trang đơn, không cần tạo lại hoặc di chuyển dữ liệu cũ. Chỉ tài khoản có quyền quản lý đơn được đọc lịch sử. Thư gửi trực tiếp từ Outlook không nằm trong lịch sử website.

### Tài khoản thao tác và dùng lại mẫu

Lịch sử hiển thị tên/email tài khoản đã đăng nhập khi gửi (từ token Firebase đã xác thực); địa chỉ gửi Microsoft vẫn là hộp thư đã cấu hình. Thư tự động ghi rõ tự động khi đặt hàng. Bản ghi cũ chỉ có UID sẽ được tra hồ sơ Firebase nếu còn tài khoản; nếu không tìm được, giữ UID thay vì gán tên người đang xem. Không sửa dữ liệu lịch sử cũ.

Lịch sử thư đơn hàng dùng bảng gọn với cột mẫu riêng. Các nhãn mẫu trong lịch sử gom các thư theo tiêu đề/nội dung mẫu gốc; các giá trị như mã đơn và tên khách đã điền không tạo mẫu mới. Thư cũ chưa lưu mẫu gốc chỉ gom được theo nội dung thực tế. Bấm tên mẫu, **Xem thư** hoặc **Xem mẫu** để mở nội dung trong cửa sổ lớn giữa màn hình. **Dùng lại mẫu** chép sang **nội dung gửi riêng**, không ghi đè mẫu tự động. Chọn đơn và kiểm tra nội dung trước khi bấm gửi. Thư cũ có thể chứa thông tin khách cũ cần sửa trước khi dùng lại.

Lịch sử thư gửi danh sách đăng ký cũng có cột tài khoản thao tác, cột mẫu và nút dùng lại để chép sang phần Soạn thư mới.

### Xem người nhận và cột mẫu thư

Phần soạn thư luôn hiện riêng **Email đã chọn**, giữ danh sách này khi đổi từ khóa tìm kiếm và có nút bỏ từng địa chỉ. Hộp xác nhận gửi cũng liệt kê các email cụ thể. Trong lịch sử gửi, bấm số email ở cột Người nhận để xem danh sách: thư mới lưu lại địa chỉ tại lúc tạo, nên vẫn xem được khi liên hệ đã bị xóa sau này. Thư cũ chưa lưu địa chỉ sẽ đối chiếu liên hệ còn tồn tại; nếu không còn thì báo rõ thay vì đoán địa chỉ.

Kho mẫu được quản lý tập trung trong mục **Mẫu Thư** cạnh **Thư đơn hàng đã gửi**. Các khu vực soạn/gửi dùng nút chọn mẫu hoặc tên mẫu có thể bấm để mở cửa sổ xem lớn, không đặt kho mẫu ở cột bên cạnh nữa. Chọn mẫu không đổi người nhận đã chọn.

### Kho Mẫu Thư độc lập

**Email marketing → Mẫu Thư** có ô soạn tên, loại (gửi riêng/xác nhận đơn tự động/chào mừng tự động), tiêu đề, nội dung; lưu nhiều mẫu, chỉnh mẫu đã lưu, tìm kiếm và xem trước. Các mẫu lưu tại collection riêng `newsletterTemplates`, chỉ đọc/ghi qua API có kiểm tra UID. Lưu hoặc chỉnh mẫu trong kho không gửi email, không thay đổi mẫu chào mừng/xác nhận đơn tự động hay lịch sử cũ.

Kho chỉ hiển thị các mẫu đã lưu, không tự tạo thêm các hàng “Mẫu thư 1, 2…” từ lịch sử. Mẫu thư cho khách được chép vào ô soạn thư cho khách; mẫu đơn hàng gửi riêng được chép vào nội dung gửi riêng; mẫu xác nhận tự động được chép vào cấu hình tự động và cần bấm Lưu mới áp dụng. Chỉ thao tác gửi rõ ràng mới phát thư.

Cửa sổ xem mẫu/thư sử dụng modal giữa màn hình, cuộn được nội dung dài, đóng bằng nút Đóng, phím Esc hoặc bấm nền bên ngoài. Người dùng bàn phím được giữ focus trong cửa sổ và quay về nút đã mở khi đóng.

### Xóa mẫu và tách gửi thư đơn hàng

Trong **Mẫu Thư**, mỗi mẫu đã lưu có nút **Xóa mẫu** và hộp xác nhận. Xóa chỉ tác động bản ghi trong `newsletterTemplates`; mẫu tự động đã áp dụng và lịch sử thư đã gửi không bị xóa. Các mẫu nguồn “đang dùng” không có nút xóa vì đó là cấu hình hoạt động, không phải bản sao trong kho.

**Thư đơn hàng** chỉ chỉnh nội dung xác nhận tự động. Nút **Chọn mẫu có sẵn** nằm cùng hàng với **Lưu mẫu thư đơn hàng**: chọn mẫu chỉ điền vào ô soạn, bấm Lưu mới áp dụng cho đơn mới.

**Gửi thư đơn hàng** là mục độc lập để chọn đơn, xem rõ email người nhận, chọn mẫu hoặc soạn nội dung riêng, xem trước và gửi. Dùng lại mẫu đơn từ kho hoặc lịch sử sẽ mở mục này. Gửi riêng không sửa cấu hình thư tự động.

### Phiên bản mẫu và lịch sử bất biến

Ba loại mẫu: `private` (gửi riêng, cho khách hoặc đơn cụ thể), `order_auto` (xác nhận đơn tự động), `welcome_auto` (chào mừng tự động). Cửa sổ chọn chỉ hiển thị loại tương ứng, ghi rõ loại và số mẫu của từng loại, có lối vào Quản lý Mẫu Thư. Mẫu cũ giữ nguyên loại đã lưu; admin có thể chỉnh loại trong kho, không tự chuyển dữ liệu hàng loạt.

Mỗi lần đổi tên/loại/nội dung mẫu tạo phiên bản mới. Khi chọn mẫu, phía máy chủ kiểm tra ID, phiên bản, loại và nội dung còn khớp. Nếu mẫu bị sửa/xóa trước lúc gửi, cần chọn lại hoặc tự soạn; không tự dùng bản mới mà người gửi chưa xem.

Thư đơn hàng và thư gửi danh sách khách lưu tên mẫu, ID, phiên bản, nội dung mẫu và nội dung thực gửi tại thời điểm tạo/gửi. Lịch sử không tra tên hiện tại trong kho. Sửa hoặc xóa mẫu không đổi bản thư đã gửi. Cấu hình tự động cũng giữ bản mẫu đã áp dụng, không tự chạy theo lần sửa trong kho.

Khi Microsoft chấp nhận gửi, kho ghi nhận phiên bản đã dùng. Nhãn **Chưa gửi**, **Đã gửi · phiên bản hiện tại**, **Đã sửa · bản hiện tại chưa gửi** phản ánh đúng phiên bản; chấp nhận gửi chưa bảo đảm thư tới inbox. Thư/dữ liệu cũ thiếu tên mẫu hoặc liên kết được ghi rõ là bản cũ/chưa có thống kê, không gán tên hoặc trạng thái giả.

Phần gửi đơn riêng khởi đầu bằng nội dung trống, không tự dùng mẫu xác nhận tự động. Chọn mẫu lưu rồi sửa nội dung sẽ trở thành thư tự soạn, không gắn nhầm tên mẫu gốc. Các danh sách mẫu tự sinh và nút sao chép/xem trùng đã được bỏ; bấm tên để xem, dùng Chỉnh sửa/Xóa trong kho, và Soạn thư mới từ bản này trong lịch sử.

### Tạo mẫu tập trung và ba loại hiện tại

Chỉ tạo/sửa mẫu trong **Mẫu Thư**: nhập tên, chọn **Mẫu thư gửi riêng**, **Mẫu thư xác nhận tự động** hoặc **Mẫu thư chào mừng tự động**, rồi lưu. Loại cũ `general`/`order` được đọc tương thích thành gửi riêng; không viết lại hàng loạt các mẫu hoặc lịch sử cũ.

Các mục tự động có ô tiêu đề/nội dung để viết trực tiếp hoặc chọn mẫu đã lưu rồi chỉnh. Chỉ bấm Áp dụng mới cập nhật cấu hình đang chạy; không ghi đè bản mẫu trong kho. Mẫu chào mừng đã áp dụng giữ tên/phiên bản/nội dung độc lập với lần chỉnh sửa trong kho, và ghi nhận phiên bản đã dùng khi gửi chào mừng thành công.

Gửi riêng dùng chung một loại mẫu: mẫu tĩnh dùng cho email khách hoặc đơn cụ thể; mẫu có biến đơn chỉ dùng khi chọn đơn. Danh sách khách và mẫu chào mừng không được nhận các biến đơn chưa điền.

Đã bỏ toàn bộ nút xem trước ở nội dung đang nhập. Kho mẫu vẫn có một form tạo mẫu và chọn loại khi lưu; không chia thành ba tab. Cửa sổ xem mẫu đã lưu và thư đã gửi vẫn giữ để đọc bản lưu. Việc chọn mẫu không tự gửi email hoặc áp dụng cấu hình tự động.

### Danh sách mẫu chung và nội dung tự động có thể chỉnh trực tiếp

**Mẫu Thư** hiển thị một danh sách chung, bỏ hàng tab theo loại. Loại chỉ là tùy chọn trong form lưu mẫu. Chọn mẫu từ các phần tự động sẽ tìm trong các bản đã lưu của danh sách này; có ô tìm tên/tiêu đề, không thêm hàng mẫu ảo đang dùng vào cửa sổ chọn.

Khi mở trang quản trị ở bản mới, API được xác thực sẽ lưu một lần hai mẫu tự động hiện có (chào mừng và xác nhận đơn) vào kho, lấy đúng nội dung đang cấu hình; nếu chưa có cấu hình thì lấy mẫu mặc định. Mẫu được liên kết sẵn hoặc bản có ID mặc định đã tồn tại không bị ghi đè. Dấu mốc `newsletterSettings/libraryDefaultsSeed` ngăn tạo trùng và ngăn phục hồi mẫu mà admin chủ động xóa sau đó. Không đổi cấu hình tự động hoặc lịch sử trong bước này.

**Thư chào mừng** và **Thư đơn hàng** có lại ô tiêu đề, nội dung cùng nút **Chọn mẫu có sẵn** và **Áp dụng**. Có thể viết trực tiếp, hoặc chọn mẫu rồi sửa. Nội dung chỉnh trực tiếp được tách khỏi liên kết mẫu đã chọn, để lịch sử không gắn nhầm tên mẫu gốc. Bản mẫu trong kho và thư đã gửi không bị sửa theo.

### Viết Thư hợp nhất

Thanh điều hướng hiện gồm **Danh sách email**, **Viết Thư**, **Thư đơn hàng đã gửi**, **Mẫu Thư**. Các màn hình soạn riêng cũ đã được bỏ.

Trong **Viết Thư**, chọn **Thư Đăng Ký** (tên mới của thư chào mừng), **Thư Đơn Hàng** hoặc **Gửi riêng**. Hai loại tự động nạp nội dung đang cấu hình. Mỗi loại giữ bản đang soạn riêng khi đổi lựa chọn. Chọn mẫu từ kho sẽ chép vào cùng ô tiêu đề/nội dung; sửa nội dung tách khỏi liên kết mẫu gốc.

- **Lưu làm thư tự động** chỉ cập nhật cấu hình cho lần gửi tự động sau đó.
- **Gửi thử** chỉ gửi bản đang soạn tới email thử được nhập, không ghi trạng thái gửi cho đơn hay gửi thêm tới khách. Thư Đơn Hàng điền biến từ đơn đang chọn; khi chưa chọn đơn dùng dữ liệu minh họa. Việc đọc dữ liệu đơn để gửi thử vẫn cần quyền quản lý đơn.
- **Gửi cho đơn đã chọn** gửi nội dung đang soạn tới email thật lưu trong đơn và ghi lịch sử; không đổi cấu hình tự động. Mẫu gửi riêng hoặc mẫu xác nhận đều có thể dùng trong ngữ cảnh có đơn.
- **Gửi riêng** giữ lựa chọn người nhận/tìm kiếm/gửi theo đợt như trước.

**Mẫu Thư** có form tạo/sửa và chọn loại ở trái. Có thể **Thêm loại mẫu** riêng (nhóm dùng cho gửi riêng), được lưu trong `newsletterTemplateTypes`. Ở phải, mặc định chưa liệt kê mẫu; chọn loại trong **Chọn loại để xem mẫu** mới hiện danh sách và ô tìm kiếm. Mẫu thuộc loại riêng được dùng ở Viết Thư như mẫu gửi riêng. Không thêm trigger tự động cho loại tùy chỉnh.

### Kiểm tra trạng thái Outlook trong admin

Nút **Kiểm tra Outlook** có ở lịch sử từng thư đơn, danh sách email đăng ký và **Trạng thái Outlook** theo người nhận của một lần gửi danh sách. Thao tác này chỉ đọc Microsoft và ghi lại kết quả đối chiếu; không gửi lại thư, không đổi nội dung, người gửi hoặc kết quả tiếp nhận ban đầu. Kết quả được lưu, có thời gian kiểm tra và cache 60 giây cho cùng một mã thư.

Cần cấp cho ứng dụng đang dùng `MS_CLIENT_ID` quyền **Microsoft Graph → Application permissions → Mail.Read**, rồi **Grant admin consent**. SMTP.SendAsApp hoặc Mail.Send không cấp quyền đọc. Giới hạn quyền ứng dụng vào hộp thư `MS_SENDER_EMAIL` (mặc định sales@ororavn.com) qua chính sách truy cập ứng dụng/RBAC Exchange phù hợp. Không đổi `MS_MAIL_TRANSPORT`, không bật/tắt SMTP AUTH để cấu hình tính năng đọc. Thiếu quyền sẽ báo rõ trong admin và giữ kết quả cũ; sau khi cấp quyền có thể kiểm tra lại.

- **Microsoft đã nhận**: kết quả tiếp nhận ở API/SMTP, được giữ riêng.
- **Có trong Đã gửi**: tìm được bản lưu bằng mã thư, không chứng minh khách nhận.
- **Có thư báo trả lại (NDR)** hoặc **Có thư báo gửi chậm**: tìm được báo cáo chứa đúng Message-ID gốc và email người nhận. Hiển thị mã như 5.7.708 và liên kết Outlook nếu có.
- **Chưa tìm thấy bằng mã đối chiếu**: chưa có bằng chứng trong phạm vi đọc. Hệ thống giới hạn số trang thư để tránh gọi Graph quá nhiều, nên không kết luận thư đã phát/không phát khi chưa tìm thấy NDR.
- **Thư cũ chưa có mã đối chiếu**: không đoán theo tiêu đề/email. Bản ghi cũ được giữ nguyên.

Thư mới gửi SMTP có Message-ID riêng và header `X-Orora-Mail-Id`; Graph có header đối chiếu và lưu bản trong Sent Items. SMTP có thể không lưu bản Sent Items: vẫn có thể đối chiếu NDR bằng Message-ID, nhưng thiếu bản Đã gửi không đồng nghĩa gửi thất bại. Thư đăng ký mới giữ mã của lần gửi mới, không dùng trạng thái bounce của lần cũ.

Kiểm thử repository dùng Microsoft giả lập và Firestore bộ nhớ; chưa xác minh Mail.Read hoặc đọc hộp thư thật trong phiên sửa mã này. Muốn xác nhận đã phát tới máy chủ người nhận cần Message Trace của Exchange; không gán trạng thái đã giao hoặc đã đọc chỉ dựa trên Sent Items/việc chưa thấy NDR. Thư Outlook soạn trực tiếp và thư gửi thử chưa có trang lịch sử riêng không được tự nhập vào lịch sử website.

### Xác nhận đơn hàng ở nền

`/api/orders` chỉ trả mã đơn thành công sau khi giao dịch Firestore đã lưu đơn và giá sản phẩm trên máy chủ. Trên Vercel, `waitUntil` tiếp tục xử lý email xác nhận sau phản hồi, trong giới hạn 60 giây của Function. Khách không phải chờ SMTP; giao diện hiển thị email đang xử lý. Lỗi gửi không hủy đơn và được ghi trong lịch sử admin. Đây không phải hàng đợi có worker tự thử lại. Mã yêu cầu đơn và sự kiện `confirmation-auto` ngăn tạo đơn hoặc gửi thư trùng khi khách gửi lại.

### Mã đơn dễ đọc

Đơn mới dùng `OW` + số thứ tự + ngày hai chữ số + tháng hai chữ số, ví dụ `OW22910` là đơn thứ 2 ngày 29/10. Bộ đếm `orderDailyCounters/{YYYY-MM-DD}` tính theo `Asia/Ho_Chi_Minh`, được tăng cùng giao dịch lưu đơn để các lượt đặt đồng thời không lấy cùng số. Gửi lại cùng yêu cầu không tăng số; yêu cầu không hợp lệ cũng không chiếm số. Ngày mới bắt đầu từ 1. Mã `OW` không chứa năm; ngày đầy đủ của đơn vẫn có trong admin và trường `orderDate`. ID nội bộ của đơn và mã các đơn cũ không đổi; bộ đếm mới chỉ cấp số cho đơn tạo theo cơ chế này.
