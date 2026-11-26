# Đối chiếu khi bỏ Form cũ — 16/11/2026

Các khóa cũ giữ nguyên; không di chuyển/xóa dữ liệu production. Builder tiếp tục lưu patch theo nhóm đã sửa qua save-sections.js và changedValues. Nội dung/style dùng bộ chỉnh cùng các khóa đã có, không thay format dữ liệu.

| Form trước đây | Khóa cấu hình | Nơi chỉnh hiện tại |
|---|---|---|
| Editfooter.jsx | footerLogo, footerDescription, footerInfoTitle, footerAboutText, footerShopText, footerTermsText, footerPrivacyText, footerContactTitle, footerPhone, footerEmail, footerAddress, footerSocialTitle, footerInstagram, footerFacebook, footerTikTok, footerYouTube, footerCopyright, footerCompanyNumber | Chân trang |
| Editticker.jsx | marqueeWords, marqueeStyles | Dải chữ chạy |
| Editfeatures.jsx | featuresLabel, featuresTitle, features | Nâng cấp BT |
| Editproductdetail.jsx | productDetailStyles | Chi tiết SP và Form đặt hàng trong Visual Builder |
| Editsteps.jsx | ritualLabel, ritualTitle, ritualHighlight, steps | Không còn phần hiển thị trên website; giữ nguyên dữ liệu đã lưu |
| Editreviews.jsx | testimonialsLabel, testimonialsTitle, testimonialsHighlight, testimonialsTitleEnd, reviews, testimonialsStyles | Cảm nhận |
| Editnewletter.jsx | newsletterTitle, newsletterHighlight, newsletterText | Nhận tin |
| Editcollection.jsx | collectionLabel, collectionTitle, collectionHighlight, collectionStyles | Sản phẩm |
| Edithero.jsx | heroEyebrow, heroTitle, heroDescription, heroButtonText, heroButtonLink, shopButtonText, shopButtonLink, heroImage, heroImageMobile, heroRotator, heroChip1, heroChip2, heroChip3, heroRingText, heroScrollText | Hero |
| Editproductcard.jsx | productCardStyles | Sản phẩm → Thẻ sản phẩm |
| Editphilosophy.jsx | philosophyLabel, philosophyBody, philosophyAccentCount, philosophyStyles | Triết lý |
| Editstory.jsx | storyLabel, storyTitle, storyHighlight, storyText, storyImage, storyImages, storyStats, aboutStyles | Câu chuyện |

Các trường style nằm trong map (productDetailStyles, productCardStyles, aboutStyles, philosophyStyles...) vẫn giữ bộ chỉnh màu/kiểu chữ/khung. Kiểu chữ và khung thu vào Nâng cao; không bị bỏ đi. Nhãn tab sản phẩm có mục riêng, kiểu chữ navigation vẫn dùng chung theo cấu hình hiện tại.

Visual Builder tập trung cam kết và chính sách, danh mục, slogan, nhu cầu, FAQ, kênh mua và thanh toán, tra cứu đơn. Danh mục có nút lưu riêng. Các mục còn lại dùng Lưu tất cả. Đường dẫn /admin/store mở mục kênh mua trong Builder.

EditSteps từng ghi ritualLabel/ritualTitle/ritualHighlight/steps; kiểm tra src/components và page-sections không có nơi hiển thị nhóm này. Việc bỏ form không xóa các khóa này và không gửi patch cho chúng. Không khôi phục nội dung đã ngừng dùng lên website.
