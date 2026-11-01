import { parseVndPrice } from "./commerce.js";

export const MAX_ORDER_QUANTITY = 20;
export const MAX_VOLUME_OPTIONS = 30;
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const key = (label) => label.normalize("NFKC").replace(/\s+/g, "").toLocaleLowerCase("vi-VN");

export function validateVolumeOptions(options) {
  if (!Array.isArray(options) || options.length > MAX_VOLUME_OPTIONS) return "Chỉ thêm tối đa 30 dung tích cho một sản phẩm.";
  const ids = new Set(); const labels = new Set();
  for (const option of options) {
    if (!option || !validId(option.id) || ids.has(option.id)) return "Dung tích chưa hợp lệ. Hãy xóa mục lỗi và thêm lại.";
    if (typeof option.label !== "string" || !option.label.trim() || option.label.trim().length > 60) return "Nhập tên dung tích cho từng mục (tối đa 60 ký tự).";
    const normalized = key(option.label.trim());
    if (labels.has(normalized)) return "Các dung tích không được trùng tên.";
    if (option.price != null && (typeof option.price !== "string" || (option.price.trim() && parseVndPrice(option.price) === null))) return "Giá dung tích phải là số tiền hợp lệ, hoặc để trống để dùng giá chung.";
    ids.add(option.id); labels.add(normalized);
  }
  return "";
}

export function productVolumeOptions(product = {}) {
  const options = product.volumeOptions;
  if (options === undefined) return [];
  if (validateVolumeOptions(options)) return [];
  return options.map((option) => ({ ...option, label: option.label.trim(), price: option.price?.trim() || "" }));
}
export function selectedVolumeOption(options, id) {
  return options.find((option) => option.id === id) || (options.length === 1 ? options[0] : null);
}
export function volumePriceText(product, option) {
  return option?.price?.trim() || String(product.price ?? "");
}
export function orderProductName(product = {}) {
  return `${product?.name || ""}${product?.variantLabel ? ` — ${product.variantLabel}` : ""}`;
}
