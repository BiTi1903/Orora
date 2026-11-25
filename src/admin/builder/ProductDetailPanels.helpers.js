import { PRODUCT_DETAIL_FIELD_MAP } from "./registry";

export function getProductDetailSelectedData(productDetail, selected) {
  const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
  if (!meta) {
    return { type: "pdEmpty", data: null };
  }
  if (meta.type === "pdRelImage" || selected === "relImage") {
    return { type: "pdRelImage", data: productDetail, meta };
  }
  if (meta.type === "pdImage" || selected === "pdImage") {
    return { type: "pdImage", data: productDetail, meta };
  }
  if (meta.type === "pdThumbs" || selected === "pdThumbs") {
    return { type: "pdThumbs", data: productDetail, meta };
  }
  return { type: "pdStyle", data: productDetail, meta };
}
