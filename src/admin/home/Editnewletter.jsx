import useHomeForm from "./Usehomeform";
import { Field, SectionShell } from "./Ui";

export default function EditNewsletter() {
  const h = useHomeForm(["newsletterTitle", "newsletterHighlight", "newsletterText"]);

  return (
    <SectionShell title="Đăng ký nhận tin" hint="Khối mời khách để lại email." {...h} onSubmit={h.save}>
      <Field label="Tiêu đề" name="newsletterTitle" {...h} />
      <Field label="Chữ nổi bật" name="newsletterHighlight" {...h} />
      <Field label="Mô tả" name="newsletterText" rows="3" {...h} />
    </SectionShell>
  );
}