# Thử gửi Microsoft 365 qua SMTP OAuth2

Đây là phương thức thay thế Microsoft Graph, dùng `smtp.office365.com:587` + STARTTLS + OAuth2 client credentials. Không dùng mật khẩu mailbox hoặc app password. Microsoft vẫn có thể chặn chuyển phát bên ngoài với `5.7.708`; đổi giao thức không bảo đảm gỡ hạn chế tenant/IP.

Mã hỗ trợ hai lựa chọn `MS_MAIL_TRANSPORT=graph` (mặc định) hoặc `smtp`. Không có cơ chế tự chuyển cách gửi sau lỗi, để tránh gửi trùng. Tất cả thư thử, thư chào mừng và chiến dịch dùng cùng lựa chọn này.

## 1. Thêm quyền ứng dụng SMTP

Dùng tài khoản quản trị, vào **Microsoft Entra → App registrations → ORORA Newsletter → API permissions → Add a permission**:

1. Chọn **APIs my organization uses**.
2. Tìm **Office 365 Exchange Online**.
3. Chọn **Application permissions → SMTP.SendAsApp → Add permissions**.
4. Bấm **Grant admin consent** cho tổ chức.

Đây là quyền Exchange Online, khác quyền Graph `Mail.Send`. Giữ nguyên quyền Graph hiện tại cho đến khi SMTP được thử thành công. Không cần tạo Client Secret mới. SMTP dùng token scope `https://outlook.office365.com/.default`, đã được cấu hình trong mã.

## 2. Lấy đúng hai ID

- **Application (client) ID** của ORORA Newsletter, cũng là `MS_CLIENT_ID` đã lưu.
- **Object ID của Enterprise application**: Entra → Enterprise applications → ORORA Newsletter → Overview → Object ID.

**Object ID này KHÔNG phải Object ID ở App registrations.** Dùng nhầm sẽ làm SMTP không xác thực được.

## 3. Đăng ký service principal trong Exchange và cấp quyền mailbox

Chạy trên PowerShell của quản trị viên. Các ID không phải secret, nhưng phải lấy đúng từ tổ chức của bạn. Các lệnh bên dưới được cung cấp để quản trị viên chạy; chúng chưa được thực thi trong môi trường phát triển.

```powershell
Install-Module ExchangeOnlineManagement -Scope CurrentUser
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@ororavn.onmicrosoft.com

$OroraAppId = "DIEN_APPLICATION_CLIENT_ID"
$OroraEnterpriseObjectId = "DIEN_OBJECT_ID_CUA_ENTERPRISE_APPLICATION"

$OroraService = Get-ServicePrincipal | Where-Object { $_.AppId -eq $OroraAppId }
if (-not $OroraService) {
    New-ServicePrincipal -AppId $OroraAppId -ObjectId $OroraEnterpriseObjectId -DisplayName "ORORA Newsletter SMTP"
    $OroraService = Get-ServicePrincipal | Where-Object { $_.AppId -eq $OroraAppId }
}
if (-not $OroraService -or @($OroraService).Count -ne 1) {
    throw "Chua xac dinh duoc duy nhat service principal ORORA trong Exchange."
}

Add-MailboxPermission -Identity sales@ororavn.com -User $OroraService.Identity -AccessRights FullAccess
Add-RecipientPermission -Identity sales@ororavn.com -Trustee $OroraService.Identity -AccessRights SendAs

# Chỉ bật SMTP AUTH cho mailbox gửi này.
Set-CASMailbox -Identity sales@ororavn.com -SmtpClientAuthenticationDisabled $false
Get-CASMailbox -Identity sales@ororavn.com | Format-List SmtpClientAuthenticationDisabled
```

Nếu quyền mailbox đã tồn tại, kiểm tra quyền hiện có thay vì xóa rồi cấp lại. Không cấp quyền cho các mailbox khác. Nếu tổ chức có Security Defaults hoặc policy chặn SMTP AUTH, trao đổi với quản trị viên/Microsoft Support để chọn cấu hình được hỗ trợ; không tự tắt MFA hay chính sách bảo mật toàn tenant.

Việc cấp quyền có thể cần thời gian đồng bộ. Lỗi `535`/`EAUTH` cần kiểm tra cả quyền `SMTP.SendAsApp`, consent, Object ID, mailbox permissions và SMTP AUTH, không mặc định là Client Secret sai.

## 4. Chuyển transport trên Vercel

Chỉ thực hiện sau các bước quyền ở trên:

- Thêm biến loại Config: **`MS_MAIL_TRANSPORT` = `smtp`**, môi trường **Production**.
- Giữ nguyên `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET`, `MS_SENDER_EMAIL` (`sales@ororavn.com`), các biến Firebase và newsletter.
- Không thêm mật khẩu mailbox vào biến môi trường.
- Redeploy phiên bản mới nhất của `main` với biến Production.

Nodemailer được ghim trong `package.json`/lockfile. Mã bắt buộc STARTTLS, xác minh chứng chỉ TLS và không đọc file/URL tùy ý từ nội dung thư. Không cần đổi DNS hoặc bật lại OneShield.

## 5. Thử một thư trước

1. Vào Admin → Email marketing → Gửi thử mẫu thư.
2. Nhập một địa chỉ Gmail bạn kiểm tra được, bấm **Gửi thư thử** đúng một lần.
3. Kiểm tra email người nhận và NDR tại `sales@ororavn.com`.
4. Microsoft chấp nhận SMTP chỉ xác nhận đã đưa vào hàng đợi, không bảo đảm inbox. Nếu vẫn có `550 5.7.708`, bổ sung vào ticket Microsoft rằng cả Graph và SMTP OAuth2 đều bị ảnh hưởng.

SMTP không tự lưu một bản vào Sent Items như Graph `saveToSentItems`; dùng kết quả người nhận, NDR và Message trace để đối chiếu. Khi mới đổi cách gửi, đăng ký trùng email từng được ghi `accepted` không tự kích hoạt lại welcome; dùng nút gửi thử trước để tránh hiểu nhầm.

Chiến dịch SMTP xử lý một địa chỉ mỗi yêu cầu để giảm nguy cơ vượt thời gian Vercel Function. Giữ trang quản trị mở khi chạy chiến dịch. Khi lỗi timeout sau DATA, trạng thái là chưa rõ; không tự gửi lại vì thư có thể đã được nhận.

Nếu cần quay về Graph, đặt `MS_MAIL_TRANSPORT=graph` rồi redeploy. Không có tự động fallback giữa hai transport.

## Kiểm tra đã thực hiện trong mã

`npm test` bao gồm khởi động API với module CommonJS, luồng nghiệp vụ newsletter và kiểm thử SMTP bằng transport/token giả lập: OAuth scope, STARTTLS/TLS verification, một người nhận mỗi thư, token caching, phân biệt lỗi AUTH/kết nối/timeout sau DATA và batch SMTP một thư. Các kiểm thử không gửi thư thật và không xác minh các quyền Exchange của production.

## Tài liệu chính thức

- [OAuth2 cho IMAP/POP/SMTP, gồm client credentials và đăng ký service principal](https://learn.microsoft.com/en-us/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth)
- [Bật/tắt authenticated SMTP theo tổ chức hoặc mailbox](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission)

Bản nguồn MicrosoftDocs đã được đối chiếu cho `SMTP.SendAsApp`, scope, `New-ServicePrincipal`, `Add-MailboxPermission` và ghi chú quyền SendAs. Thiết lập Exchange và gửi thật cần quản trị viên thực hiện trên tenant.
