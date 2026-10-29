import { captureTemplate, recordTemplateUse, templateIdentity } from "./template-snapshot.js";
import { randomUUID } from "node:crypto";
import { validateMessage } from "./newsletter-content.js";
import { PAYMENT_LABELS, formatVnd } from "../src/lib/commerce.js";
export const DEFAULT_ORDER_MESSAGE = {
  subject: "ORORA xác nhận đã nhận đơn {{orderCode}}",
  text: "Chào {{customerName}},\n\nORORA đã nhận đơn hàng {{orderCode}} của bạn.\n\nSản phẩm: {{productName}}\nSố lượng: {{quantity}}\nTạm tính: {{subtotal}}\nPhương thức thanh toán: {{paymentMethod}}\nĐịa chỉ nhận hàng: {{address}}\nSố điện thoại: {{phone}}\n\nORORA sẽ liên hệ để xác nhận đơn, phí giao hàng và thông tin thanh toán. Thư này xác nhận đã nhận yêu cầu đặt hàng, chưa xác nhận thanh toán.\n\nCảm ơn bạn đã chọn ORORA!",
};
export const ORDER_TOKENS = ["customerName", "orderCode", "productName", "quantity", "subtotal", "paymentMethod", "address", "phone", "email"];
export const validOrderEmail = (value) => typeof value === "string" && value.length <= 254 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
export function validateOrderTemplate(value) {
  const message = validateMessage(value);
  if ([...`${message.subject}\n${message.text}`.matchAll(/\{\{(\w+)\}\}/g)].some((match) => !ORDER_TOKENS.includes(match[1]))) throw new Error("invalid_order_token");
  return message;
}
export function renderOrderMessage(template, order) {
  const values = { customerName: order.customer.name, orderCode: order.code, productName: order.product.name, quantity: order.quantity, subtotal: order.subtotal === null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal), paymentMethod: PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod, address: order.customer.address, phone: order.customer.phone, email: order.customer.email };
  const fill = (text, subject = false) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => subject ? String(values[key] ?? "").replace(/[\r\n]/g, " ") : String(values[key] ?? ""));
  return validateMessage({ subject: fill(template.subject, true), text: fill(template.text) });
}
export async function sendOrderConfirmation({ db, orderId, sendMail, manual = false, requestId, confirmResend = false, actor = "automatic", actorName = "", actorEmail = "", message: customMessage, templateRef }) {
  const orderRef = db.collection("orders").doc(orderId);
  const eventRef = orderRef.collection("mailEvents").doc(manual ? `manual-${requestId || randomUUID()}` : "confirmation-auto");
  const claimed = await db.runTransaction(async (tx) => {
    const [order, event, template] = await tx.getAll(orderRef, eventRef, db.collection("newsletterSettings").doc("orderConfirmation"));
    if (!order.exists) throw Object.assign(new Error("Không tìm thấy đơn hàng."), { status: 404 });
    if (event.exists) return null;
    const data = order.data();
    if (!validOrderEmail(data.customer?.email)) throw Object.assign(new Error("Đơn này chưa có email người mua hợp lệ."), { status: 400 });
    const previous = data.confirmationMail?.state;
    if (["sending", "unknown"].includes(previous)) throw Object.assign(new Error("Kết quả gửi trước chưa rõ hoặc đang xử lý. Kiểm tra thư đã gửi trên Microsoft trước khi gửi lại."), { status: 409 });
    if (manual && previous === "accepted" && !confirmResend) throw Object.assign(new Error("Thư đã được Microsoft nhận. Cần xác nhận gửi lại để tránh gửi trùng."), { status: 409 });
    let message; let sourceTemplate; let templateError = false;
    try { sourceTemplate = manual && customMessage ? validateOrderTemplate(customMessage) : template.exists ? validateOrderTemplate(template.data()) : DEFAULT_ORDER_MESSAGE; message = renderOrderMessage(sourceTemplate, data); }
    catch { message = { subject: "Không tạo được thư xác nhận đơn", text: "" }; templateError = true; }
    const snapshot = manual && customMessage ? await captureTemplate(tx, db, templateRef, sourceTemplate || {}, ["private", "order_auto"]) : template.exists ? templateIdentity(template.data()) : {};
    const createdAt = new Date();
    tx.set(eventRef, { type: "orderConfirmation", recipient: data.customer.email, ...message, ...snapshot, templateName: snapshot.templateName || (manual && customMessage ? "Nội dung soạn riêng cho đơn" : "Xác nhận đơn tự động"), state: templateError ? "failed" : "sending", errorCode: templateError ? "mail_template_invalid" : "", createdAt, updatedAt: createdAt, actor, actorName, actorEmail, manual, ...(sourceTemplate ? { templateSubject: sourceTemplate.subject, templateText: sourceTemplate.text } : {}) });
    tx.set(orderRef, { confirmationMail: { state: templateError ? "failed" : "sending", eventId: eventRef.id, updatedAt: createdAt } }, { merge: true });
    return { recipient: data.customer.email, message, templateError, snapshot };
  });
  if (!claimed) return { duplicate: true };
  if (claimed.templateError) return { state: "failed" };
  let state = "accepted"; let errorCode = "";
  try {
    if (typeof sendMail !== "function") throw new Error("mail_configuration_missing");
    await sendMail(claimed.recipient, claimed.message);
  } catch (error) {
    const known = ["mail_configuration_missing", "mail_transport_invalid", "mail_auth_failed", "mail_send_failed", "mail_smtp_auth_failed", "mail_smtp_connection_failed"].includes(error.message);
    state = known ? "failed" : "unknown";
    errorCode = known ? error.message : "mail_outcome_unknown";
  }
  const updatedAt = new Date();
  // If writing the result fails, leave 'sending' in place; never automatically resend.
  await db.runTransaction(async (tx) => {
    if (state === "accepted") await recordTemplateUse(tx, db, claimed.snapshot);
    tx.set(eventRef, { state, errorCode, updatedAt }, { merge: true });
    tx.set(orderRef, { confirmationMail: { state, eventId: eventRef.id, updatedAt } }, { merge: true });
  });
  return { state };
}
