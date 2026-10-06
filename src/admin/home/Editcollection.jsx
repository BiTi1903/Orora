import useHomeForm from "./Usehomeform";
import { Field, SectionShell } from "./Ui";

export default function EditCollection() {
  const h = useHomeForm([
    "collectionLabel",
    "collectionTitle",
    "collectionHighlight",
  ]);

  return (
    <SectionShell
      title="Collection"
      hint="Chỉnh sửa tiêu đề của khu vực sản phẩm."
      {...h}
      onSubmit={h.save}
    >
      <Field
        label="Nhãn nhỏ"
        name="collectionLabel"
        {...h}
      />

      <Field
        label="Tiêu đề dòng 1"
        name="collectionTitle"
        {...h}
      />

      <Field
        label="Tiêu đề dòng 2"
        name="collectionHighlight"
        {...h}
      />
    </SectionShell>
  );
}