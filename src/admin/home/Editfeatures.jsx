import useHomeForm from "./Usehomeform";
import { Field, ItemCards, SectionShell } from "./Ui";

export default function EditFeatures() {
  const h = useHomeForm([
    "featuresLabel",
    "featuresTitle",
    "features",
  ]);

  return (
    <SectionShell
      title="Lý do chọn"
      hint="Các ô giới thiệu ưu điểm."
      {...h}
      onSubmit={h.save}
    >
      <Field
        label="Nhãn nhỏ"
        name="featuresLabel"
        {...h}
      />

      <Field
        label="Tiêu đề"
        name="featuresTitle"
        {...h}
      />

      <ItemCards
        title="Ô"
        listKey="features"
        h={h}
        blank={{
          icon: "✦",
          title: "",
          text: "",
        }}
        fields={[
          {
            key: "icon",
            label: "Icon",
          },
          {
            key: "title",
            label: "Tiêu đề",
          },
          {
            key: "text",
            label: "Nội dung",
            rows: 3,
          },
        ]}
      />
    </SectionShell>
  );
}