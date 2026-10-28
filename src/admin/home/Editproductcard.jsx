import MobileImageSettings from "../builder/MobileImageSettings";
import useHomeForm from "./Usehomeform";
import { SectionShell } from "./Ui";
import { StyleList } from "./StyleEditor";

const ELEMENTS = [
  {
    key: "number",
    title: "Kiểu chữ — Số thứ tự",
    sample: "01",
    fields: ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing"],
    defaults: { fontSize: 12, letterSpacing: 1, color: "#e2678f" },
  },
  {
    key: "name",
    title: "Kiểu chữ — Tên sản phẩm",
    sample: "First Story",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 22,
      fontWeight: 600,
      color: "#3a1526",
    },
  },
  {
    key: "description",
    title: "Kiểu chữ — Mô tả ngắn",
    sample: "A beautiful piece created for your everyday moments.",
    defaults: { fontSize: 13, lineHeight: 1.7, color: "#7d656f" },
  },
  {
    key: "price",
    title: "Kiểu chữ — Giá",
    sample: "1.290.000đ",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 22,
      fontWeight: 600,
      color: "#b8446d",
    },
  },
  {
    key: "button",
    title: "Kiểu chữ — Nút “Xem chi tiết”",
    sample: "Xem chi tiết ↗",
    previewBg: "#d9628a",
    fields: ["fontFamily", "fontSize", "fontWeight", "color", "letterSpacing", "textTransform"],
    defaults: { fontSize: 12, fontWeight: 500, letterSpacing: 1, color: "#ffffff" },
  },
];

export default function EditProductCard() {
  const h = useHomeForm(["productCardStyles"]);

  return (
    <SectionShell
      title="Thẻ sản phẩm"
      hint="Kiểu chữ áp dụng cho TẤT CẢ thẻ sản phẩm trong Collection. Nội dung từng sản phẩm sửa ở mục Sản phẩm."
      {...h}
      onSubmit={h.save}
    >
      <MobileImageSettings layout={h.form.productCardStyles?.imageLayout || {}} onChange={(patch) => h.set("productCardStyles", { ...h.form.productCardStyles, imageLayout: { ...h.form.productCardStyles?.imageLayout, ...patch } })} />
      <StyleList
        elements={ELEMENTS}
        value={h.form.productCardStyles}
        onChange={(v) => h.set("productCardStyles", v)}
      />
    </SectionShell>
  );
}
