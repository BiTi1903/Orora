import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "../lib/commerce";
import { orderProductName } from "../lib/product-options";

export const SAMPLE_PREVIEW_ORDER = {
  code: "OW_1024C",
  customer: {
    name: "Nguyễn Minh Anh",
    email: "khachhang@example.com",
    phone: "0901234567",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    note: "Giao giờ hành chính giúp mình nhé.",
  },
  product: { name: "Gel dưỡng ORORA", variantLabel: "100 ml", unitPrice: 250000, priceText: "250000" },
  quantity: 1,
  subtotal: 250000,
  shippingFee: 30000,
  totalAmount: 280000,
  paymentMethod: "cod",
  paymentStatus: "unpaid",
  trackingCode: "",
  createdAt: new Date().toISOString(),
};

export function previewOrderVariables(text, order, tracking) {
  if (!text) return "";
  const multiProductSummary = Array.isArray(order?.items) && order.items.length > 1
    ? order.items.map((item) => `${orderProductName(item)} × ${item.quantity}`).join("; ")
    : order?.product
      ? orderProductName(order.product)
      : "Gel dưỡng ORORA 100ml";
  const unitPriceFormatted = order?.product
    ? (order.product.unitPrice == null ? formatProductPrice(order.product.priceText) || "ORORA sẽ báo giá" : formatVnd(order.product.unitPrice))
    : "250.000 đ";
  const totalFormatted = order ? (order.totalAmount == null ? "ORORA sẽ xác nhận" : formatVnd(order.totalAmount)) : "280.000 đ";
  const createdAtFormatted = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const map = {
    "{{customerName}}": order?.customer?.name || "Nguyễn Minh Anh",
    "{{orderCode}}": order?.code || "OW_1024C",
    "{{productName}}": multiProductSummary,
    "{{variantLabel}}": order?.product?.variantLabel || "100 ml",
    "{{quantity}}": String(order?.quantity ?? 1),
    "{{unitPrice}}": unitPriceFormatted,
    "{{subtotal}}": order ? (order.subtotal == null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal)) : "250.000 đ",
    "{{shippingFee}}": order ? (order.shippingFee == null ? "ORORA sẽ xác nhận" : formatVnd(order.shippingFee)) : "30.000 đ",
    "{{totalAmount}}": totalFormatted,
    "{{total}}": totalFormatted,
    "{{paymentMethod}}": PAYMENT_LABELS[order?.paymentMethod] || "Thanh toán khi nhận hàng (COD)",
    "{{paymentStatus}}": order?.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
    "{{address}}": order?.customer?.address || "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    "{{phone}}": order?.customer?.phone || "0901234567",
    "{{email}}": order?.customer?.email || "khachhang@example.com",
    "{{note}}": order?.customer?.note || "Không có",
    "{{createdAt}}": createdAtFormatted,
    "{{trackingUrl}}": tracking.url,
    "{{trackingInstructions}}": tracking.instructions,
    "{{trackingCode}}": order?.trackingCode || "",
  };
  return Object.entries(map).reduce((acc, [token, val]) => acc.replaceAll(token, val), text);
}
