import { PRODUCT_DETAIL_FIELD_MAP } from "./registry";

export function getProductDetailSelectedData(productDetail, selected, detailProduct) {
  if (typeof selected === "string" && selected.startsWith("pdValue:")) {
    const key = selected.split(":")[1];
    return {
      type: "pdValue",
      data: productDetail,
      meta: {
        key,
        label: `Nội dung ${key}`,
        text: detailProduct?.[key] || "",
      },
    };
  }
  if (typeof selected === "string" && selected.startsWith("pdLabel:")) {
    const key = selected.split(":")[1];
    const styleKey = `${key}Label`;
    return {
      type: "pdFieldLabel",
      data: productDetail,
      meta: {
        key,
        styleKey,
        label: `Tên mục ${key}`,
        sample: key[0].toUpperCase() + key.slice(1),
      },
    };
  }
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
