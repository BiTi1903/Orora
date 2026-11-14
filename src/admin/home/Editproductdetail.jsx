import MobileDetailSettings from "../builder/MobileDetailSettings";
import ProductLoadErrorSettings from "../builder/ProductLoadErrorSettings";
import PurchaseOptionsSettings from "../builder/PurchaseOptionsSettings";
import ProductContactSettings from "../builder/ProductContactSettings";
import MobileImageSettings from "../builder/MobileImageSettings";
import useHomeForm from "./Usehomeform";
import { SectionShell } from "./Ui";
import { StyleList } from "./StyleEditor";
import { SloganAppearanceEditor, SloganTypographyEditor } from "../ProductSloganDesign";

const ELEMENTS = [
  { key: "selectionLabel", title: "Kiểu chữ — Nhãn Dung tích / Số lượng", sample: "Dung tích" },
  { key: "selectionValue", title: "Kiểu chữ — Lựa chọn dung tích", sample: "100 ml" },
  { key: "aboutTitle", title: "Kiểu chữ — Tiêu đề Mô tả / Thông số / Hướng dẫn sử dụng", sample: "Mô tả" },
  { key: "navigation", title: "Kiểu chữ — Nút Mô tả / Thông số / Hướng dẫn sử dụng", sample: "Nút Mô tả / Thông số / Hướng dẫn sử dụng" },
  { key: "subheading", title: "Kiểu chữ — Tên mục trong nội dung", sample: "Tên mục trong nội dung" },
  { key: "purchaseHeading", title: "Kiểu chữ — Chữ Chọn cách mua hàng", sample: "Chữ Chọn cách mua hàng" },
  { key: "assuranceTitle", title: "Kiểu chữ — Cam kết — Tiêu đề", sample: "Cam kết — Tiêu đề" },
  { key: "assuranceBody", title: "Kiểu chữ — Cam kết — Nội dung", sample: "Cam kết — Nội dung" },
  { key: "reviewTitle", title: "Kiểu chữ — Đánh giá — Tiêu đề", sample: "Đánh giá — Tiêu đề" },
  { key: "reviewName", title: "Kiểu chữ — Đánh giá — Tên hiển thị", sample: "Đánh giá — Tên hiển thị" },
  { key: "reviewBody", title: "Kiểu chữ — Đánh giá — Nội dung", sample: "Đánh giá — Nội dung" },
  { key: "relTitle", title: "Khám phá thêm — Tiêu đề", sample: "Khám phá thêm" },
  { key: "relName", title: "Khám phá thêm — Tên sản phẩm", sample: "Tên sản phẩm" },
  { key: "relPrice", title: "Khám phá thêm — Giá", sample: "349.000đ" },
  { key: "relButton", title: "Khám phá thêm — Xem tất cả", sample: "Xem tất cả sản phẩm" },
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
    title: "Kiểu chữ — Tiêu đề nội dung sản phẩm",
    sample: "Mô tả",
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
    title: "Kiểu chữ — Tên thông tin sản phẩm",
    sample: "Thành phần",
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
      <MobileDetailSettings value={h.form.productDetailStyles?.mobileLayout} onChange={patch=>h.set("productDetailStyles",{...h.form.productDetailStyles,mobileLayout:{...h.form.productDetailStyles?.mobileLayout,...patch}})}/>
      <ProductLoadErrorSettings value={h.form.productDetailStyles?.loadError||{}} onChange={patch=>h.set("productDetailStyles",{...h.form.productDetailStyles,loadError:{...h.form.productDetailStyles?.loadError,...patch}})}/>
      <PurchaseOptionsSettings value={h.form.productDetailStyles?.purchaseOptions || {}} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, purchaseOptions: { ...h.form.productDetailStyles?.purchaseOptions, ...patch } })} />
      <ProductContactSettings value={h.form.productDetailStyles?.contactActions || {}} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, contactActions: { ...h.form.productDetailStyles?.contactActions, ...patch } })} />
      <MobileImageSettings layout={h.form.productDetailStyles?.imageLayout || {}} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, imageLayout: { ...h.form.productDetailStyles?.imageLayout, ...patch } })} />
      <details className="slogan-home-settings"><summary>Slogan — Kiểu chữ, khung thẻ và biểu tượng</summary>
        <SloganTypographyEditor title="Slogan — Chữ tiêu đề" value={h.form.productDetailStyles?.sloganTitle} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, sloganTitle: { ...h.form.productDetailStyles?.sloganTitle, ...patch } })} />
        <SloganTypographyEditor title="Slogan — Chữ nội dung" body value={h.form.productDetailStyles?.sloganBody} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, sloganBody: { ...h.form.productDetailStyles?.sloganBody, ...patch } })} />
        <SloganAppearanceEditor value={h.form.productDetailStyles?.sloganCard} onChange={(patch) => h.set("productDetailStyles", { ...h.form.productDetailStyles, sloganCard: { ...h.form.productDetailStyles?.sloganCard, ...patch } })} />
      </details>
      <StyleList
        elements={ELEMENTS}
        value={h.form.productDetailStyles}
        onChange={(v) => h.set("productDetailStyles", v)}
      />
    </SectionShell>
  );
}
