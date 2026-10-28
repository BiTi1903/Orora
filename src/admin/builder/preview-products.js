// Editor fixtures only. Never included in saveHomeContent or saved as products.
export const PREVIEW_PRODUCTS = [1, 2, 3].map((number) => ({
  id: `preview-${number}`, slug: `preview-${number}`, number: String(number).padStart(2, "0"),
  name: `Sản phẩm mẫu ${number}`, price: "250.000đ", image: "/preview/product.svg",
  image2: "/preview/product.svg", description: "Mô tả mẫu để xem bố cục sản phẩm.",
  story: "Nội dung minh họa giúp bạn chỉnh cách trình bày. Dữ liệu sản phẩm thực tế vẫn được giữ nguyên.",
  material: "Thông tin thành phần mẫu", size: "30 ml", color: "Thông tin mẫu", origin: "Thông tin xuất xứ mẫu", active: true,
}));
