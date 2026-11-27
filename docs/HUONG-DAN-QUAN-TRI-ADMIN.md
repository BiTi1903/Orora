# HƯỚNG DẪN SỬ DỤNG TRANG QUẢN TRỊ (ADMIN) ORORA

> Tài liệu hướng dẫn chi tiết cách hoạt động và từng bước thao tác trên toàn bộ các mục trong hệ thống Quản trị ORORA. Dành cho nhân viên vận hành, bán hàng, chăm sóc khách hàng và quản trị nội dung.

---

## MỤC LỤC

1. [Đăng nhập & Nguyên tắc thao tác an toàn](#1-đăng-nhập--nguyên-tắc-thao-tác-an-toàn)
2. [Tổng quan](#2-tổng-quan)
3. [Thống kê](#3-thống-kê)
4. [Đơn hàng](#4-đơn-hàng)
5. [Kiểm kho (Kiểm Hàng)](#5-kiểm-kho-kiểm-hàng)
6. [Phí vận chuyển](#6-phí-vận-chuyển)
7. [Trang chủ — Visual Builder (Giao diện & Thiết lập chung)](#7-trang-chủ--visual-builder-giao-diện--thiết-lập-chung)
8. [Sản phẩm](#8-sản-phẩm)
9. [Bản dịch (Đa ngôn ngữ VI / EN / JP)](#9-bản-dịch-đa-ngôn-ngữ-vi--en--jp)
10. [Email (Email Marketing & Thư Đăng Ký)](#10-email-email-marketing--thư-đăng-ký)
11. [Thư cần xử lý](#11-thư-cần-xử-lý)
12. [Chat AI](#12-chat-ai)
13. [Xuất danh sách email](#13-xuất-danh-sách-email)
14. [Checklist vận hành hằng ngày & Xử lý lỗi thường gặp](#14-checklist-vận-hành-hằng-ngày--xử-lý-lỗi-thường-gặp)

---

## 1. Đăng nhập & Nguyên tắc thao tác an toàn

### Cách truy cập
1. Mở trình duyệt và truy cập đường dẫn `/admin` của website ORORA.
2. Đăng nhập bằng tài khoản email & mật khẩu quản trị đã được cấp.
3. Sau khi đăng nhập, thanh menu bên trái hiển thị 4 nhóm chức năng chính:
   - **Nhóm chính**: `Tổng quan`, `Thống kê`
   - **Bán hàng**: `Đơn hàng`, `Kiểm kho`, `Phí vận chuyển`
   - **Giao diện và nội dung**: `Trang chủ`, `Sản phẩm`, `Bản dịch`
   - **Khách hàng**: `Email`, `Thư cần xử lý`, `Chat AI`, `Xuất danh sách email`
4. Cuối menu bên trái có nút **Xem website** (mở trang bán hàng thật ở tab mới để kiểm tra kết quả) và nút **Đăng xuất**.

### 5 nguyên tắc quan trọng cần nhớ
- **Luôn bấm nút Lưu**: Mọi chỉnh sửa chỉ có hiệu lực trên website sau khi bạn bấm **Lưu** và thấy thông báo màu xanh thành công. Nếu rời sang mục khác khi chưa lưu, hệ thống sẽ hiện hộp thoại cảnh báo.
- **Chờ tải ảnh xong mới lưu**: Khi tải ảnh sản phẩm hoặc ảnh trang chủ, phải đợi dòng trạng thái *"Đang tải ảnh…"* biến mất rồi mới bấm Lưu.
- **Cẩn trọng với các thao tác không thể hoàn tác**: Hủy đơn hàng, Hoàn tất đơn hàng, Xóa sản phẩm, Xóa email khách hàng đều có hộp thoại xác nhận và **không thể khôi phục**.
- **Chú ý số thông báo trên menu**:
  - Số đỏ cạnh **Đơn hàng** = số đơn mới đang **chờ xác nhận** (tự cập nhật mỗi phút).
  - Số đỏ cạnh **Thư cần xử lý** = số email gửi lỗi hoặc chưa rõ trạng thái cần kiểm tra.
- **Không chia sẻ tài khoản & không nhập thông tin mật vào khu vực công khai** (như ô *Kiến thức AI* hoặc mô tả sản phẩm).

---

## 2. Tổng quan

**Mục đích**: Nắm nhanh tình hình cửa hàng ngay khi mở ca làm việc.

### Cách hoạt động & thao tác
- **4 thẻ thống kê nhanh** ở đầu trang (có thể bấm trực tiếp vào từng thẻ để mở nhanh):
  1. **Sản phẩm**: Tổng số sản phẩm hiện có → bấm để mở mục *Sản phẩm*.
  2. **Đơn chờ xác nhận** (nổi bật khi > 0): Số đơn mới cần gọi/xác nhận ngay → bấm để mở danh sách đơn mới.
  3. **Đang xử lý & giao**: Tổng số đơn đang ở trạng thái *Đã xác nhận* và *Đang giao*.
  4. **Đơn hoàn tất**: Tổng số đơn đã giao thành công.
- **Nút Xem thống kê** (góc trên bên phải): Chuyển sang báo cáo doanh thu & lưu lượng chi tiết.
- **Việc cần làm hôm nay**: Liệt kê các đơn cần xử lý gấp hoặc sản phẩm sắp hết / thiếu tồn kho — bấm vào từng dòng để đi thẳng tới đơn hàng hoặc trang Kiểm kho tương ứng.

---

## 3. Thống kê

**Mục đích**: Theo dõi doanh thu thực thu và lượng khách truy cập website theo dữ liệu thật.

### Cách thao tác
1. **Chọn khoảng thời gian**: Bấm chọn `7 ngày`, `14 ngày`, `30 ngày` hoặc `90 ngày`.
2. **Xem các chỉ số & biểu đồ**:
   - **Biểu đồ cột — Doanh thu đã thanh toán theo ngày**: Chỉ tính các đơn đã ghi nhận thanh toán. Di chuột (hoặc chạm trên điện thoại) vào từng cột để xem chi tiết doanh thu và số đơn của ngày đó.
   - **Biểu đồ lưu lượng truy cập**: Hiển thị 3 đường dữ liệu:
     - **Lượt xem** (tổng số lần mở trang)
     - **Khách/ngày** (lượng khách truy cập theo ngày)
     - **Bấm sản phẩm** (số lượt khách bấm xem chi tiết sản phẩm)
3. **Xuất báo cáo**: Dùng nút xuất CSV (nếu có trong kỳ xem) để tải bảng số liệu về Excel báo cáo.

---

## 4. Đơn hàng

**Mục đích**: Tiếp nhận, xác nhận, đóng gói, theo dõi giao hàng, cập nhật thanh toán và quản lý email xác nhận đơn.

### 4 tab trong mục Đơn hàng
1. **Danh sách đơn**: Bảng toàn bộ đơn hàng.
2. **Khách hàng**: Tổng hợp danh sách khách đã mua hàng (bấm vào 1 khách để lọc nhanh các đơn của khách đó).
3. **Lịch sử email**: Xem lịch sử các email đã gửi liên quan đến đơn hàng.
4. **Thư tự động**: Chỉnh nội dung mẫu **Thư xác nhận đơn hàng** tự động gửi cho khách khi đặt hàng thành công.

### Quy trình xử lý 1 đơn hàng chuẩn
1. **Lọc & tìm đơn**:
   - Dùng thanh lọc trạng thái (`Tất cả`, `Chờ xác nhận`, `Đã xác nhận`, `Đang giao`, `Hoàn tất`, `Đã hủy`).
   - Nhập mã đơn, SĐT, email, tên khách hoặc tên sản phẩm vào ô tìm kiếm. Nếu đơn cũ chưa tải trên màn hình, bấm nút **Tìm trên máy chủ**.
2. **Mở chi tiết đơn**: Bấm vào dòng đơn hàng để xem đầy đủ sản phẩm, số lượng, dung tích, địa chỉ giao hàng, ghi chú khách, phương thức thanh toán và lịch sử hoạt động.
3. **Chuyển trạng thái theo đúng vòng đời đơn**:
   - `Chờ xác nhận` → Bấm **Xác nhận đơn** (sau khi kiểm tra thông tin & liên hệ khách nếu cần), hoặc **Giao ngay**, hoặc **Hủy đơn**.
   - `Đã xác nhận` → Bấm **Bắt đầu giao** khi bàn giao cho đơn vị vận chuyển.
   - `Đang giao` → Bấm **Hoàn tất đơn** khi khách đã nhận hàng và thanh toán xong.
   - `Hoàn tất` → Chỉ còn tùy chọn **Hủy đơn (khách trả hàng)** nếu phát sinh hoàn trả.
   > **Lưu ý quan trọng**:
   > - Bấm **Hoàn tất đơn** sẽ tự động ghi nhận **Đã thanh toán**, tự **trừ tồn kho** (nếu chưa trừ trước đó) và **không thể lùi lại trạng thái cũ**.
   > - Bấm **Hủy đơn** sẽ **không thể mở lại đơn**.
4. **Cập nhật mã vận đơn & ghi chú nội bộ**:
   - Trong khung chi tiết đơn, nhập **Mã vận đơn** (để khách tra cứu) và **Ghi chú nội bộ** (chỉ nhân viên thấy) → bấm **Lưu**.
5. **Xử lý Email xác nhận đơn**:
   - Xem cột **Thư xác nhận** để biết email đã gửi thành công hay bị lỗi.
   - Nếu email báo **bị kẹt quá 5 phút**: Bấm nút xử lý để hệ thống chuyển sang trạng thái *"Chưa rõ kết quả"* (chưa gửi trùng ngay) → kiểm tra hộp thư **Sent / Đã gửi trên Outlook** xem khách đã nhận chưa rồi mới quyết định gửi lại.
6. **Xuất danh sách đơn**: Bấm nút **Xuất CSV** để tải toàn bộ danh sách đơn đang hiển thị theo bộ lọc hiện tại.

---

## 5. Kiểm kho (Kiểm Hàng)

**Mục đích**: Quản lý số lượng tồn kho thực tế của từng sản phẩm và từng dung tích.

### Hiểu đúng 3 cột số lượng
| Cột | Ý nghĩa |
|---|---|
| **Tồn thực tế** | Số lượng hàng thực tế đang có trong kho do bạn nhập. |
| **Chờ xác nhận** | Số lượng đang được "giữ chỗ" cho các đơn mới đặt (chưa trừ kho thật). |
| **Còn có thể bán** | `= Tồn thực tế − Chờ xác nhận`. Nếu âm sẽ báo `Thiếu X` để bạn nhập thêm hàng hoặc báo khách. |

### Cơ chế trừ kho & hoàn kho tự động
- **Đơn mới đặt**: Chỉ giữ chỗ ở cột *Chờ xác nhận*, **chưa trừ** *Tồn thực tế*.
- **Khi ghi nhận thanh toán / Bắt đầu giao / Hoàn tất đơn**: Hệ thống tự động **trừ tồn thực tế đúng 1 lần**.
- **Khi hủy đơn**:
  - Hủy đơn đang *Chờ xác nhận* → tự giải phóng số lượng giữ chỗ.
  - Đơn đã xuất kho → chỉ hoàn kho khi xác nhận đã nhận lại hàng trả.

### Cách cập nhật tồn kho
- Dùng ô **Tìm sản phẩm** (theo tên, dung tích hoặc mã SP `#...`).
- **Cập nhật 1 dòng**: Nhập số lượng nguyên không âm vào cột **Nhập tồn thực tế** → bấm **Lưu** ở dòng đó.
- **Cập nhật nhiều dòng cùng lúc**: Nhập số lượng cho tất cả các sản phẩm vừa kiểm → bấm nút **Lưu tất cả (N)** ở góc trên bên phải.
- Bấm **Tải lại tồn kho** khi muốn cập nhật số liệu mới nhất từ máy chủ.

---

## 6. Phí vận chuyển

**Mục đích**: Cài đặt phí ship tự động theo địa chỉ 2 cấp (**Tỉnh/Thành phố** và **Phường/Xã**) và ngưỡng miễn phí giao hàng.

### Cách thiết lập từ đầu (làm đúng thứ tự)
1. **Nhập phí theo khu vực trước**:
   - Tại khung **Phí theo khu vực**, chọn **Tỉnh / Thành phố**.
   - Nhập **Phí chung toàn tỉnh/thành (đ)** (ví dụ `30000`, nhập `0` nếu miễn phí, để trống nếu tạm ngừng giao tỉnh đó) → bấm **Lưu phí tỉnh/thành**.
   - *(Không bắt buộc)* Nếu một phường/xã có mức phí khác (ví dụ nội thành/ngoại thành), chọn **Phường / Xã có phí riêng** → nhập số tiền → bấm **Lưu phí phường/xã**.
     - *Nguyên tắc ưu tiên*: **Phí riêng phường/xã** luôn được ưu tiên hơn **Phí chung tỉnh/thành**. Muốn quay lại dùng phí chung, chỉ cần xóa trắng ô phí phường/xã rồi bấm Lưu.
2. **Bật tính năng tự tính ship & ngưỡng Freeship**:
   - Tại khung **Tính ship theo địa chỉ**:
     - Bật công tắc **Tự tính phí ship khi khách đặt hàng** *(hệ thống yêu cầu phải lưu ít nhất 1 mức phí ở bước 1 mới cho bật)*.
     - *(Tùy chọn)* Nhập **Miễn phí khi tạm tính lớn hơn (đ)** (ví dụ `500000`). Để trống nếu không áp dụng freeship.
     - Bấm **Lưu trạng thái tính ship**.
   > **Lưu ý**: Khi đang **bật** tính ship, khách ở địa chỉ **chưa được nhập phí** sẽ chưa đặt được đơn.
3. **Tra cứu & sửa nhanh**: Kéo xuống bảng **Phí vận chuyển đã lưu**, tìm tên tỉnh/phường và bấm **Chỉnh phí** để nhảy thẳng đến ô sửa.

---

## 7. Trang chủ — Visual Builder (Giao diện & Thiết lập chung)

**Mục đích**: Chỉnh sửa trực quan toàn bộ nội dung, màu sắc, font chữ, hình ảnh, bật/tắt các khối của Trang chủ, Trang chi tiết sản phẩm, các Form đặt hàng và các thiết lập dùng chung của cửa hàng.

### Cách thao tác chung trong Visual Builder
1. **Chọn khu vực cần sửa** ở danh sách bên trái (có ô tìm kiếm nhanh theo tên khu vực hoặc tên thành phần).
2. **Bật / Tắt hiển thị khu vực**: Dùng công tắc bật/tắt ngay cạnh tên từng khối (các khối tắt sẽ ẩn khỏi website).
3. **Xem trước trực tiếp**:
   - Khung xem trước hiển thị ngay thay đổi của bạn.
   - Chuyển đổi chế độ **Máy tính (Desktop)** và **Điện thoại (Mobile)** để kiểm tra cỡ chữ và bố cục trên cả 2 thiết bị.
   - Có nút **Hoàn tác (Undo)** / **Làm lại (Redo)** nếu lỡ tay chỉnh nhầm.
4. **Chỉnh kiểu hiển thị**: Với từng chữ/khối, bạn có thể đổi nội dung chữ, font chữ, cỡ chữ máy tính/điện thoại, màu sắc, độ đậm, căn lề, màu nền, viền và bo góc.
5. **Bấm Lưu**: Sau khi ưng ý, bấm nút **Lưu** ở thanh công cụ trên cùng (nếu chỉ sửa 1 khối, hệ thống chỉ lưu phần thay đổi để tránh ghi đè dữ liệu người khác).

### Danh sách 22 khu vực trong Visual Builder
#### A. Các khối Trang chủ & Điều hướng
| Khu vực | Dùng để chỉnh gì? |
|---|---|
| **Navbar** | Logo, các link menu trên thanh điều hướng, nút chuyển ngôn ngữ (`VI / EN / JP` — chỉ chỉnh bật/tắt & màu/kiểu nút; câu dịch chỉnh ở mục *Bản dịch*), menu điện thoại. |
| **Hero** | Ảnh nền máy tính/điện thoại, tiêu đề lớn, dòng chữ xoay vòng, nhãn nổi, thẻ nổi bật, nút kêu gọi hành động (CTA). |
| **Dải chữ chạy** | Các câu chữ chạy ngang dưới Hero và màu sắc/tốc độ. |
| **Câu chuyện** | Tiêu đề, đoạn giới thiệu thương hiệu và hình ảnh câu chuyện ORORA. |
| **Triết lý** | Khối trích dẫn triết lý thương hiệu. |
| **Chọn theo nhu cầu** | Các thẻ gợi ý giúp khách chọn sản phẩm theo nhu cầu da/môi. |
| **FAQ sản phẩm** | Danh sách câu hỏi thường gặp và câu trả lời. |
| **Cách chăm sóc** | Hướng dẫn chăm sóc/sử dụng theo từng nhóm. |
| **Sản phẩm** | Tiêu đề mục Bộ sưu tập, kiểu hiển thị thẻ sản phẩm (máy tính & điện thoại), bộ lọc danh mục. |
| **Chi tiết SP** | Bố cục trang chi tiết sản phẩm: ảnh, tùy chọn mua hàng, tab thông tin, sản phẩm liên quan, sản phẩm đã xem. |
| **Nâng cấp BT** | Khối ưu điểm / lợi ích nổi bật của thương hiệu. |
| **Cảm nhận** | Khối đánh giá / cảm nhận khách hàng trên trang chủ. |
| **Nhận tin** | Khối form đăng ký nhận email ưu đãi. |
| **Footer** | Mô tả ngắn, các cột liên kết (Thông tin, Liên hệ, Mạng xã hội) và dòng bản quyền. |

#### B. Các Form mua hàng (chỉ sửa nội dung & giao diện, không có nút ẩn)
- **Form giỏ hàng**: Tiêu đề, nhãn nút, màu sắc khung giỏ hàng.
- **Form đặt hàng**: Các nhãn trường nhập liệu (họ tên, SĐT, email, địa chỉ, ghi chú), nút gửi đơn.
- **Form đã đặt hàng**: Giao diện màn hình thông báo đặt hàng thành công & hướng dẫn thanh toán sau khi khách đặt xong.

#### C. Các thiết lập dùng chung của cửa hàng
- **Slogan sản phẩm**: Thẻ khẩu hiệu/thông điệp dùng chung hiển thị trên trang sản phẩm.
- **Cam kết & chính sách**: Các dòng cam kết cạnh nút mua và nội dung trang Chính sách (đổi trả, bảo mật, điều khoản).
- **Danh mục sản phẩm**: Thêm, đổi tên, sắp xếp hoặc xóa các danh mục sản phẩm (dùng để phân loại sản phẩm và làm bộ lọc ngoài website).
- **Kênh mua & thanh toán**: Link gian hàng TikTok / Facebook và cấu hình phương thức thanh toán / thông tin tài khoản ngân hàng (QR chuyển khoản).
- **Tra cứu đơn hàng**: Bật/tắt và chỉnh câu chữ cho trang tra cứu đơn hàng công khai của khách.

---

## 8. Sản phẩm

**Mục đích**: Tạo mới, chỉnh sửa, ẩn/hiện, gán danh mục và xóa sản phẩm bán trên website.

### Thao tác trên danh sách sản phẩm
- **Tìm kiếm & lọc**: Nhập tên hoặc mã SP (`#01`, `1`, …), lọc theo trạng thái (`Tất cả`, `Đang hiện`, `Đang ẩn`).
- **Đổi danh mục nhanh**: Chọn trực tiếp danh mục trong cột **Danh mục / Thao tác** (hệ thống tự lưu ngay lập tức).
- **Xem trang thật**: Bấm **Xem trên website** dưới tên sản phẩm để mở trang sản phẩm khách nhìn thấy.
- **Sửa / Xóa**: Bấm **Sửa** để mở trình chỉnh sửa, hoặc **Xóa** (có xác nhận, không thể hoàn tác).

### Cách thêm mới hoặc chỉnh sửa 1 sản phẩm (5 tab)
Bấm **+ Thêm sản phẩm** (hoặc **Sửa**), điền lần lượt 5 tab rồi bấm **Lưu**:

1. **Tab Thông tin**:
   - **Tên sản phẩm** *(bắt buộc)*: Đường dẫn URL (`/product/...`) tự động tạo theo tên sản phẩm.
   - **Mã SP / STT**: Tự động tăng, không cần sửa.
   - **Danh mục**: Chọn danh mục phù hợp.
   - **Gợi ý chọn sản phẩm**: Câu ngắn (tối đa 240 ký tự) mô tả sản phẩm hợp với ai/nhu cầu nào.
   - **Mô tả ngắn**: Đoạn mô tả hiển thị ở đầu trang sản phẩm.
   - **Hiển thị trên website**: Bật = khách thấy và mua được; Tắt = tạm ẩn khỏi website (nhưng vẫn giữ dữ liệu trong admin).
2. **Tab Giá & dung tích**:
   - **Giá chung**: Chỉ nhập **số nguyên** (ví dụ `250000`, không nhập dấu chấm hay chữ `đ`). Để trống nếu sản phẩm cần liên hệ báo giá.
   - **Các lựa chọn dung tích / phân loại**: Thêm từng dung tích (ví dụ `50ml`, `100ml`) và giá riêng cho từng dung tích (nếu để trống giá riêng, hệ thống dùng giá chung).
3. **Tab Hình ảnh**:
   - Tải **1 Ảnh chính** và bấm **+ Thêm ảnh phụ** để thêm các ảnh trưng bày tiếp theo.
   - Đợi toàn bộ ảnh tải xong hoàn toàn rồi mới bấm **Lưu**.
4. **Tab Nội dung**:
   - Chỉnh sửa 3 nhóm thông tin chi tiết của sản phẩm (Mô tả chi tiết, Thông số, Hướng dẫn sử dụng).
   - Mỗi nhóm có **công tắc bật/tắt hiển thị** riêng — nhớ bật công tắc cho các nhóm bạn đã điền nội dung.
5. **Tab Đánh giá**:
   - Thêm hoặc chỉnh sửa đánh giá hiển thị riêng cho sản phẩm này. Nếu bật **Hiển thị**, bắt buộc điền đủ **Tên** và **Nội dung** đánh giá.

---

## 9. Bản dịch (Đa ngôn ngữ VI / EN / JP)

**Mục đích**: Quản lý tập trung toàn bộ bản dịch Tiếng Anh (**EN**) và Tiếng Nhật (**JP**) cho **Trang chủ**, **Danh mục sản phẩm**, **Sản phẩm** và các **Cụm từ lẻ**.

### Tab 1: Nội dung website
#### Hiểu giao diện
- **Thanh tiến độ trên cùng**: Cho biết tỷ lệ `Đã dịch X/N mục EN (%)` và `Đã dịch Y/N mục JP (%)`.
- **Bộ lọc**:
  - Ô tìm kiếm (hỗ trợ gõ không dấu theo câu tiếng Việt, bản dịch hoặc tên vị trí/sản phẩm).
  - **Khu vực nội dung**: `Mọi khu vực`, `Trang chủ và cấu hình`, `Danh mục sản phẩm`, `Sản phẩm`.
  - **Trạng thái**: `Tất cả trạng thái`, `Chưa có bản dịch EN`, `Chưa có bản dịch JP`, `Đã sửa, chưa lưu`.
- **Huy hiệu trạng thái trên mỗi dòng**:
  - `EN ✓` / `JP ✓` (xanh lá): Đã có bản dịch do quản trị viên lưu.
  - `EN Tự động` / `JP Tự động` (xám đậm): Đang dùng bản dịch chuẩn có sẵn trong từ điển hệ thống.
  - `EN —` / `JP —` (xám nhạt): Chưa có bản dịch (website sẽ giữ nguyên tiếng Việt).
  - `Chưa lưu` (hồng): Bạn vừa sửa nháp trên màn hình nhưng chưa bấm Lưu.

#### Cách dịch trực tiếp trên web
1. Bấm vào 1 dòng để mở khung sửa (hiển thị nguyên văn **Tiếng Việt** và 2 ô **Tiếng Anh**, **Tiếng Nhật**).
2. Nếu ô nhập hiện dòng chữ mờ `Mặc định tự động: ...`, nghĩa là hệ thống đã có sẵn bản dịch từ điển; bạn chỉ cần nhập nếu muốn dịch theo ý riêng.
3. Nếu đã lỡ lưu sai và muốn quay về bản mặc định: xóa trắng ô nhập hoặc bấm nút **Xóa về mặc định**.
4. Sửa xong một hoặc nhiều dòng → bấm nút **Lưu N mục** màu hồng ở góc trên bên phải.
   - *Mẹo*: Dùng nút **Tải lại bản dịch** nếu vừa có người khác cập nhật nội dung mới trên máy chủ.

#### Cách dịch hàng loạt bằng Excel
1. Bấm **Xuất Excel** để tải file `ORORA-ban-dich.xlsx` gồm 5 cột: `Mã nội dung | Vị trí | Tiếng Việt | English | 日本語`.
2. Mở file bằng Excel/Google Sheets, chỉ điền hoặc sửa ở 2 cột **English** và **日本語**.
   > **Tuyệt đối không sửa** cột `Mã nội dung`, cột `Tiếng Việt` và dòng tiêu đề cột.
3. Lưu file `.xlsx` → quay lại Admin bấm **Nhập Excel** → chọn file vừa sửa.
4. Hệ thống nạp bản nháp để bạn kiểm tra (có thể chọn lọc `Đã sửa, chưa lưu` để rà lại) → bấm **Lưu N mục** để áp dụng chính thức.

### Tab 2: Dịch theo cụm từ
Dùng khi bạn thấy trên website EN/JP vẫn còn sót một cụm chữ tiếng Việt không nằm trong Tab 1:
1. Bấm **Thêm cụm từ**.
2. Dán **chính xác nguyên câu tiếng Việt** đang hiện trên web vào ô *Tiếng Việt*, nhập bản dịch *Tiếng Anh* và/hoặc *Tiếng Nhật* → bấm **Lưu cụm từ**.
3. Với cụm từ đã lưu, bạn có thể tìm kiếm theo VI/EN/JP, bấm **Sửa** để cập nhật (xóa trắng 1 ngôn ngữ sẽ bỏ bản dịch ngôn ngữ đó), hoặc bấm **Xóa** để gỡ bỏ hoàn toàn.

---

## 10. Email (Email Marketing & Thư Đăng Ký)

**Mục đích**: Quản lý danh sách email khách hàng đăng ký nhận tin, gửi chiến dịch khuyến mãi và cài đặt thư chào mừng tự động từ địa chỉ `sales@ororavn.com`.

### 5 tab trong mục Email
1. **Người đăng ký**:
   - Tìm kiếm email và lọc theo trạng thái:
     - `Hoạt động`: Đang nhận được thư.
     - `Tạm ngưng`: Tạm dừng gửi thư.
     - `Bị trả lại`: Địa chỉ email lỗi / không tồn tại.
     - `Đã hủy đăng ký`: Khách đã tự bấm hủy nhận tin (tuyệt đối không gửi lại).
   - Tick chọn tối đa **100 email/lần** → chọn thao tác (`Hoạt động`, `Tạm ngưng`, `Xóa email`) → bấm **Áp dụng**.
   - Nếu danh sách dài, bấm **Tải toàn bộ** hoặc **Xuất Excel / CSV**.
2. **Gửi thư** (Gửi chiến dịch cho khách):
   - **Chọn người nhận**:
     - *Chọn email cụ thể*: Tìm và tick tối đa 100 email đang hoạt động.
     - *Toàn bộ email đang hoạt động*: Gửi cho tất cả khách đang ở trạng thái *Hoạt động* (kể cả trang chưa tải).
   - **Soạn nội dung**: Nhập Tiêu đề, Nội dung (hoặc bấm chọn từ **Mẫu Thư**), kiểm tra bản xem trước.
   - Bấm **Gửi** và xác nhận. Hệ thống sẽ gửi lần lượt từng đợt (mỗi khách nhận 1 thư riêng). Trong lúc gửi có thể bấm **Tạm dừng sau đợt hiện tại** nếu cần.
   > **Lưu ý**: Nếu phát sinh thư lỗi hoặc chưa rõ kết quả, hệ thống sẽ tự tạm dừng để bảo vệ uy tín hộp thư.
3. **Đã gửi**:
   - Hiển thị 20 chiến dịch gần nhất kèm số lượng `đã nhận / lỗi / chưa rõ`.
   - Bấm **Check** để đối chiếu trạng thái gửi thực tế với Outlook.
   - Nếu chiến dịch đang tạm dừng, bấm **Tiếp tục gửi** để gửi nốt những người chưa gửi (không gửi trùng người đã nhận).
4. **Thư Đăng Ký**:
   - Chỉnh Tiêu đề & Nội dung thư chào mừng được gửi **tự động** ngay khi khách để lại email ở form Nhận tin trên website → bấm **Lưu**.
5. **Mẫu Thư**:
   - Tạo, chỉnh sửa và lưu sẵn các mẫu email khuyến mãi/thông báo để nhân viên chọn nhanh khi soạn thư.

---

## 11. Thư cần xử lý

**Mục đích**: Tập trung các email gửi đi bị lỗi, bị trả lại hoặc chưa xác nhận được kết quả từ máy chủ Outlook để nhân viên kiểm tra và xử lý kịp thời.

### Cách thao tác
1. Chọn **Nguồn thư**: `Đơn hàng` hoặc `Đăng ký nhận tin`.
2. Chọn **Trạng thái**: Mặc định là `Cần xử lý` (có thể đổi sang `Tất cả` để xem rộng hơn).
3. Tick chọn các thư có thể kiểm tra (hoặc tick *Chọn thư có thể kiểm tra trong danh sách*).
4. Bấm **Kiểm tra N thư đã chọn**: Hệ thống tự đối chiếu trực tiếp với Outlook để cập nhật trạng thái thật (`Đã chuyển cho Microsoft`, `Có trong thư đã gửi`, `Giao chậm`, `Bị trả lại`, `Chưa tìm thấy trên Outlook`…).
5. Dựa trên kết quả, bấm **Mở đơn hàng** (hoặc **Mở quản lý email**) ngay trên thẻ đó để gửi lại thư hoặc liên hệ khách qua điện thoại/Zalo.

---

## 12. Chat AI

**Mục đích**: Cấu hình trợ lý tư vấn tự động và nút liên hệ Zalo hiển thị ở góc màn hình website.

### Kiểm tra kết nối
- Bấm vào thanh **Kết nối OpenAI và trạng thái cấu hình** ở đầu trang → bấm **Kiểm tra trạng thái** để biết máy chủ đã có khóa OpenAI hay chưa. *(Khi chưa có khóa hoặc AI tạm lỗi, khung chat vẫn tự gợi ý dựa trên thông tin sản phẩm đã đăng).*

### 5 tab thiết lập (nhớ bấm **Lưu Chat AI** sau khi sửa)
1. **Hiển thị**:
   - Bật/tắt khung chat trên website (`Hiển thị chat trên website và chi tiết sản phẩm`).
   - Bật/tắt và chỉnh nội dung **lời nhắc nổi cạnh nút chat**, thời gian hiện lần đầu, thời gian hiển thị và chu kỳ lặp lại.
   - Đổi **Tên trợ lý**, **Lời chào khi mở chat**, **Chữ gợi ý ô nhập** và **Font chữ** (có khung xem trước ngay bên dưới).
2. **Chọn Zalo / AI**: Cấu hình nút chuyển đổi / liên kết kênh tư vấn Zalo song song với Chat AI.
3. **Kiểu chữ**: Tùy chỉnh chi tiết cỡ chữ, màu sắc, khoảng cách hiển thị trong khung chat.
4. **Câu hỏi gợi ý**: Tạo tối đa **6 nút câu hỏi nhanh** giúp khách bấm 1 chạm là gửi câu hỏi cho AI (mỗi mục gồm *Tên lựa chọn* và *Câu hỏi gửi AI*).
5. **Kiến thức AI**:
   - Chọn giọng điệu trả lời (`Thân thiện, dễ hiểu`, `Ngắn gọn`, `Giải thích kỹ`).
   - Nhập **Kiến thức bổ sung**: Thông tin thương hiệu, chính sách ship/đổi trả, cách tư vấn chọn sản phẩm, giờ làm việc…
   - *Lưu ý*: Sản phẩm, giá, dung tích và cam kết được AI **tự đọc tự động**, không cần gõ lại. **Không nhập** mật khẩu, khóa API hay thông tin riêng tư khách hàng vào ô này.

---

## 13. Xuất danh sách email

**Mục đích**: Tải toàn bộ dữ liệu email về máy dưới dạng file Excel (`.xlsx`) để lưu trữ hoặc báo cáo.

### Cách thao tác
1. Chọn **Danh sách cần xuất**:
   - `Email đã đăng ký`: Toàn bộ danh sách khách đăng ký nhận tin.
   - `Thư đã gửi`: Chi tiết từng người nhận và kết quả gửi của các chiến dịch email.
   - `Thư đơn hàng đã gửi`: Gồm cả thư xác nhận tự động và thư gửi riêng theo đơn.
2. Bấm **Tải file Excel**: Hệ thống tự động tải toàn bộ các trang dữ liệu và xuất file `ORORA-<loai>-YYYY-MM-DD.xlsx`.
   - *Lưu ý*: Trạng thái kiểm tra trong file Excel lấy từ kết quả đã lưu sẵn, không gọi lại Outlook.

---

## 14. Checklist vận hành hằng ngày & Xử lý lỗi thường gặp

### Checklist đề xuất cho nhân viên
- **Đầu ca sáng**:
  1. Mở **Tổng quan** → kiểm tra số **Đơn chờ xác nhận** và mục **Việc cần làm hôm nay**.
  2. Vào **Đơn hàng** → gọi/xác nhận các đơn mới, kiểm tra thanh toán chuyển khoản.
  3. Vào **Thư cần xử lý** → bấm kiểm tra nếu có số thông báo đỏ cạnh menu.
- **Trong ca làm việc**:
  1. Khi đóng gói và giao vận chuyển → cập nhật trạng thái **Đang giao** và điền **Mã vận đơn**.
  2. Khi nhập thêm hàng về kho → cập nhật ngay số lượng ở **Kiểm kho**.
  3. Khi thêm sản phẩm hoặc danh mục mới → sang mục **Bản dịch** để bổ sung tiếng Anh (EN) và tiếng Nhật (JP).
- **Cuối ngày**:
  1. Đánh dấu **Hoàn tất đơn** cho các đơn đã giao thành công & thu đủ tiền.
  2. Kiểm tra nhanh **Thống kê** doanh thu trong ngày và rà soát đơn còn sót ở trạng thái *Chờ xác nhận*.

### Xử lý nhanh các tình huống thường gặp
| Tình huống | Cách xử lý |
|---|---|
| Đã sửa giao diện/sản phẩm nhưng mở website chưa thấy đổi | Kiểm tra đã bấm nút **Lưu** chưa; tải lại trang web (`Ctrl+F5` / `Cmd+Shift+R`). |
| Nút **Lưu** bị mờ (không bấm được) | Chưa có thay đổi mới, hoặc đang có ảnh tải dở — đợi ảnh tải xong. |
| Khách báo không đặt được đơn ở địa chỉ của họ | Vào **Phí vận chuyển** kiểm tra xem tỉnh/thành phố đó đã được nhập phí chung hay chưa (khi đang bật tự tính ship). |
| Email xác nhận đơn báo "kẹt quá 5 phút" | Bấm nút gỡ kẹt sang *"Chưa rõ kết quả"*, kiểm tra hộp thư **Đã gửi** trong Outlook trước khi bấm gửi lại để tránh gửi trùng cho khách. |
| Trang tiếng Anh / tiếng Nhật vẫn hiện một câu tiếng Việt | Vào **Bản dịch** → tìm câu đó ở tab *Nội dung website* để dịch; nếu không thấy trong danh sách thì thêm vào tab *Dịch theo cụm từ*. |
| Muốn bỏ bản dịch đã lỡ nhập sai | Vào **Bản dịch** → mở dòng đó → bấm **Xóa về mặc định** → bấm **Lưu**. |
| Nhập file Excel bản dịch bị báo lỗi | Kiểm tra lại: phải dùng đúng file vừa **Xuất Excel** từ ORORA, không đổi tên cột, không sửa cột *Mã nội dung* và *Tiếng Việt*. |
