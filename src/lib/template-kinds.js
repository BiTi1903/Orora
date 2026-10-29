export const TEMPLATE_KINDS = { private: "Mẫu thư gửi riêng", order_auto: "Mẫu thư xác nhận tự động", welcome_auto: "Mẫu thư đăng ký tự động" };
export const normalizeTemplateKind = (kind) => ["general", "order"].includes(kind) ? "private" : kind;
export const hasOrderTokens = (message) => /\{\{(?:customerName|orderCode|productName|quantity|subtotal|paymentMethod|address|phone|email)\}\}/.test(`${message?.subject || ""}\n${message?.text || ""}`);
