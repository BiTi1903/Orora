export const TEMPLATE_KINDS = { private: "Mẫu thư gửi riêng", order_auto: "Mẫu thư xác nhận tự động", welcome_auto: "Mẫu thư đăng ký tự động" };
export const normalizeTemplateKind = (kind) => ["general", "order"].includes(kind) ? "private" : kind;
export const ORDER_TOKENS = [
  "customerName",
  "orderCode",
  "productName",
  "variantLabel",
  "quantity",
  "subtotal",
  "shippingFee",
  "totalAmount",
  "total",
  "paymentMethod",
  "address",
  "phone",
  "email",
  "note",
  "unitPrice",
  "createdAt",
  "paymentStatus",
  "trackingUrl",
];
const ORDER_TOKEN_PATTERN = new RegExp(`\\{\\{(?:${ORDER_TOKENS.join("|")})\\}\\}`);
export const hasOrderTokens = (message) => ORDER_TOKEN_PATTERN.test(`${message?.subject || ""}\n${message?.text || ""}`);
