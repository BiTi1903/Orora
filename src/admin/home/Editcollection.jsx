import useHomeForm from "./Usehomeform";
import { Field, SectionShell } from "./Ui";
import { StyleList } from "./StyleEditor";

const ELEMENTS = [
  {
    key: "label",
    title: "Kiểu chữ — Nhãn nhỏ",
    sample: "COLLECTION",
    fields: ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "textTransform"],
    defaults: { fontSize: 12, fontWeight: 500, letterSpacing: 3, color: "#b8446d" },
  },
  {
    key: "title",
    title: "Kiểu chữ — Tiêu đề dòng 1",
    sample: "Explore",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 130,
      fontWeight: 600,
      letterSpacing: -3,
      lineHeight: 0.92,
      color: "#e2678f",
    },
  },
  {
    key: "highlight",
    title: "Kiểu chữ — Tiêu đề dòng 2 (nổi bật)",
    sample: "the details.",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 130,
      fontWeight: 400,
      letterSpacing: -3,
      lineHeight: 0.92,
      color: "#e2678f",
      fontStyle: "italic",
    },
  },
];

export default function EditCollection() {
  const h = useHomeForm([
    "collectionLabel",
    "collectionTitle",
    "collectionHighlight",
    "collectionStyles",
  ]);

  return (
    <SectionShell
      title="Khám phá (Collection)"
      hint="Tiêu đề khu vực sản phẩm: nội dung và kiểu chữ."
      {...h}
      onSubmit={h.save}
    >
      <Field label="Nhãn nhỏ" name="collectionLabel" {...h} />
      <Field
        label="Tiêu đề (nhấn Enter để xuống dòng)"
        name="collectionTitle"
        rows={3}
        {...h}
      />
      <Field label="Tiêu đề dòng 2" name="collectionHighlight" {...h} />

      <StyleList
        elements={ELEMENTS}
        value={h.form.collectionStyles}
        onChange={(v) => h.set("collectionStyles", v)}
      />
    </SectionShell>
  );
}
