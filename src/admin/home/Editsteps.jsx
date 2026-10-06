import useHomeForm from "./Usehomeform";
import { Field, ItemCards, SectionShell } from "./Ui";

export default function EditSteps() {
  const h = useHomeForm(["ritualLabel", "ritualTitle", "ritualHighlight", "steps"]);

  return (
    <SectionShell title="Quy trình" hint="Các bước chăm sóc da." {...h} onSubmit={h.save}>
      <Field label="Nhãn nhỏ" name="ritualLabel" {...h} />
      <Field label="Tiêu đề" name="ritualTitle" {...h} />
      <Field label="Chữ nổi bật" name="ritualHighlight" {...h} />
      <ItemCards
        title="Bước"
        listKey="steps"
        h={h}
        blank={{ n: "", t: "", d: "" }}
        fields={[
          { key: "n", label: "Số" },
          { key: "t", label: "Tiêu đề" },
          { key: "d", label: "Mô tả", rows: 3 },
        ]}
      />
    </SectionShell>
  );
}