import PurchaseOptionsSettings from "../builder/PurchaseOptionsSettings";
import ProductContactSettings from "../builder/ProductContactSettings";
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
    defaults: { fontSize: 12, fontWeight: 500, letterSpacing: 2, color: "#b8446d" },
  },
  {
    key: "name",
    title: "Kiểu chữ — Tên sản phẩm",
    sample: "First Story",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 100,
      fontWeight: 600,
      letterSpacing: -2,
      lineHeight: 0.95,
      color: "#3a1526",
    },
  },
  {
    key: "price",
    title: "Kiểu chữ — Giá",
    sample: "1.290.000đ",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 34,
      fontWeight: 600,
      color: "#b8446d",
    },
  },
  {
    key: "description",
    title: "Kiểu chữ — Mô tả",
    sample: "A beautiful piece created for your everyday moments.",
    defaults: { fontSize: 16, fontWeight: 300, lineHeight: 1.85, color: "#7d656f" },
  },
  {
    key: "sectionTitle",
    title: "Kiểu chữ — Tiêu đề mục (About / Details)",
    sample: "About the product",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 26,
      fontWeight: 600,
      color: "#3a1526",
    },
  },
  {
    key: "body",
    title: "Kiểu chữ — Đoạn câu chuyện sản phẩm",
    sample: "First Story is created with a simple idea in mind.",
    defaults: { fontSize: 15, lineHeight: 1.9, color: "#7d656f" },
  },
  {
    key: "rowLabel",
    title: "Kiểu chữ — Tên thông tin (Material, Size...)",
    sample: "Material",
    defaults: { fontSize: 13, fontWeight: 500, color: "#b8446d" },
  },
  {
    key: "rowValue",
    title: "Kiểu chữ — Giá trị thông tin",
    sample: "Premium material with a soft finish.",
    defaults: { fontSize: 14, lineHeight: 1.7, color: "#7d656f" },
  },
];

export default function EditProductDetail() {
  const h = useHomeForm(["productDetailStyles"]);

  return (
    <SectionShell
      title="Trang chi tiết sản phẩm"
      hint="Kiểu chữ áp dụng cho trang /product/... của MỌI sản phẩm."
      {...h}
      onSubmit={h.save}
    >
      <div className="admin-field">
        <label>Tiêu đề About the product</label>
        <input
          value={h.form.productDetailStyles?.aboutTitle?.text ?? "About the product"}
          onChange={(e) =>
            h.set("productDetailStyles", {
              ...(h.form.productDetailStyles || {}),
              aboutTitle: {
                ...(h.form.productDetailStyles?.aboutTitle || {}),
                text: e.target.value,
              },
            })
          }
        />
      </div>
      <div className="admin-field">
        <label>Tiêu đề Details</label>
        <input
          value={h.form.productDetailStyles?.detailsTitle?.text ?? "Details"}
          onChange={(e) =>
            h.set("productDetailStyles", {
              ...(h.form.productDetailStyles || {}),
              detailsTitle: {
                ...(h.form.productDetailStyles?.detailsTitle || {}),
                text: e.target.value,
              },
            })
          }
        />
      </div>

      <PurchaseOptionsSettings value={h.form.productDetailStyles?.purchaseOptions || {}} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, purchaseOptions: { ...h.form.productDetailStyles?.purchaseOptions, ...patch } })} />
      <ProductContactSettings value={h.form.productDetailStyles?.contactActions || {}} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, contactActions: { ...h.form.productDetailStyles?.contactActions, ...patch } })} />
      <MobileImageSettings layout={h.form.productDetailStyles?.imageLayout || {}} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, imageLayout: { ...h.form.productDetailStyles?.imageLayout, ...patch } })} />
      <StyleList
        elements={ELEMENTS}
        value={h.form.productDetailStyles}
        onChange={(v) =>
          h.set("productDetailStyles", {
            ...v,
            aboutTitle: {
              ...(h.form.productDetailStyles?.aboutTitle || {}),
              ...(v.aboutTitle || {}),
              text: h.form.productDetailStyles?.aboutTitle?.text ?? "About the product",
            },
            detailsTitle: {
              ...(h.form.productDetailStyles?.detailsTitle || {}),
              ...(v.detailsTitle || {}),
              text: h.form.productDetailStyles?.detailsTitle?.text ?? "Details",
            },
          })
        }
      />
    </SectionShell>
  );
}