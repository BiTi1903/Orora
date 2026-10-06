import useHomeForm from "./Usehomeform";
import { Field, ItemCards, SectionShell } from "./Ui";

export default function EditReviews() {
  const h = useHomeForm([
    "testimonialsLabel",
    "testimonialsTitle",
    "testimonialsHighlight",
    "testimonialsTitleEnd",
    "reviews",
  ]);

  return (
    <SectionShell
      title="Cảm nhận khách hàng"
      hint="Chỉ đăng đánh giá thật của khách hàng."
      {...h}
      onSubmit={h.save}
    >
      <Field label="Nhãn nhỏ" name="testimonialsLabel" {...h} />
      <Field
        label="Tiêu đề (trước chữ nổi bật)"
        name="testimonialsTitle"
        {...h}
      />
      <Field
        label="Chữ nổi bật"
        name="testimonialsHighlight"
        {...h}
      />
      <Field
        label="Tiêu đề (phía sau)"
        name="testimonialsTitleEnd"
        {...h}
      />

      <ItemCards
        title="Đánh giá"
        listKey="reviews"
        h={h}
        blank={{ name: "", text: "" }}
        fields={[
          { key: "name", label: "Tên khách hàng" },
          { key: "text", label: "Nội dung", rows: 3 },
        ]}
      />
    </SectionShell>
  );
}