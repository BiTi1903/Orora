import useHomeForm from "./Usehomeform";
import { Field, SectionShell } from "./Ui";

export default function EditFooter() {
  const h = useHomeForm([
    "footerLogo",
    "footerDescription",

    "footerInfoTitle",
    "footerAboutText",
    "footerShopText",
    "footerTermsText",
    "footerPrivacyText",

    "footerContactTitle",
    "footerPhone",
    "footerEmail",
    "footerAddress",

    "footerSocialTitle",
    "footerInstagram",
    "footerFacebook",
    "footerTikTok",
    "footerYouTube",

    "footerCopyright",
    "footerCompanyNumber",
  ]);

  return (
    <SectionShell
      title="Footer"
      hint="Chỉnh sửa toàn bộ nội dung ở chân trang."
      {...h}
      onSubmit={h.save}
    >
      <h3 className="admin-subtitle">Thương hiệu</h3>

      <Field
        label="Tên thương hiệu"
        name="footerLogo"
        {...h}
      />

      <Field
        label="Mô tả"
        name="footerDescription"
        rows="3"
        {...h}
      />

      <h3 className="admin-subtitle">Information</h3>

      <Field
        label="Tiêu đề"
        name="footerInfoTitle"
        {...h}
      />

      <Field
        label="About us"
        name="footerAboutText"
        {...h}
      />

      <Field
        label="Shop"
        name="footerShopText"
        {...h}
      />

      <Field
        label="Terms & Conditions"
        name="footerTermsText"
        {...h}
      />

      <Field
        label="Privacy Policy"
        name="footerPrivacyText"
        {...h}
      />

      <h3 className="admin-subtitle">Contact</h3>

      <Field
        label="Tiêu đề"
        name="footerContactTitle"
        {...h}
      />

      <Field
        label="Số điện thoại"
        name="footerPhone"
        {...h}
      />

      <Field
        label="Email"
        name="footerEmail"
        {...h}
      />

      <Field
        label="Địa chỉ"
        name="footerAddress"
        {...h}
      />

      <h3 className="admin-subtitle">Mạng xã hội</h3>

      <Field
        label="Tiêu đề"
        name="footerSocialTitle"
        {...h}
      />

      <Field
        label="Instagram"
        name="footerInstagram"
        {...h}
      />

      <Field
        label="Facebook"
        name="footerFacebook"
        {...h}
      />

      <Field
        label="TikTok"
        name="footerTikTok"
        {...h}
      />

      <Field
        label="YouTube"
        name="footerYouTube"
        {...h}
      />

      <h3 className="admin-subtitle">License</h3>

      <Field
        label="Copyright"
        name="footerCopyright"
        {...h}
      />

      <Field
        label="Thông tin công ty"
        name="footerCompanyNumber"
        {...h}
      />
    </SectionShell>
  );
}