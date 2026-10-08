import useHomeForm from "./Usehomeform";
import { Field, SectionShell } from "./Ui";
import { StyleList } from "./StyleEditor";

const ELEMENTS = [
  {
    key: "label",
    title: "Kiểu chữ — Nhãn nhỏ",
    sample: "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦",
    fields: ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "textTransform"],
    defaults: { fontSize: 20, fontWeight: 500, letterSpacing: 4, color: "#b8446d" },
  },
  {
    key: "text",
    title: "Kiểu chữ — Câu triết lý",
    sample: "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 48,
      fontWeight: 500,
      letterSpacing: -1,
      lineHeight: 1.2,
      color: "#3a1526",
    },
  },
  {
    key: "accent",
    title: "Kiểu chữ — Những chữ cuối (nhấn màu)",
    sample: "CHÍNH MÌNH.",
    fields: ["color", "fontStyle"],
    defaults: { color: "#e2678f", fontStyle: "italic" },
  },
];

export default function EditPhilosophy() {
  const h = useHomeForm([
    "philosophyLabel",
    "philosophyBody",
    "philosophyAccentCount",
    "philosophyStyles",
  ]);

  return (
    <SectionShell
      title="Triết lý"
      hint="Câu chữ sáng dần khi cuộn trang: nội dung và kiểu chữ."
      {...h}
      onSubmit={h.save}
    >
      <Field label="Nhãn — Triết lý của chúng tôi" name="philosophyLabel" rows="2" {...h} />
      <Field label="Nội dung (Enter để xuống dòng)" name="philosophyBody" rows="6" {...h} />
      <Field label="Số chữ cuối được nhấn màu (0 = tắt)" name="philosophyAccentCount" {...h} />

      <StyleList
        elements={ELEMENTS}
        value={h.form.philosophyStyles}
        onChange={(v) => h.set("philosophyStyles", v)}
      />
    </SectionShell>
  );
}
