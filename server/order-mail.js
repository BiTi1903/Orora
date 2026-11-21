import { orderProductName } from "../src/lib/product-options.js";
import { describeMailError } from "./mail-error.js";
import { safeMailTracking } from "./mail-tracking.js";
import { captureTemplate, recordTemplateUse, templateIdentity } from "./template-snapshot.js";
import { randomUUID } from "node:crypto";
import { validateMessage } from "./newsletter-content.js";
import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "../src/lib/commerce.js";
import { ORDER_TOKENS } from "../src/lib/template-kinds.js";
export { ORDER_TOKENS };
export const DEFAULT_ORDER_MESSAGE = {
  subject: "ORORA xác nhận đã nhận đơn {{orderCode}}",
  text: "Chào {{customerName}},\n\nORORA đã nhận đơn hàng {{orderCode}} của bạn.\n\nSản phẩm: {{productName}}\nSố lượng: {{quantity}}\nTạm tính: {{subtotal}}\nPhí giao hàng: {{shippingFee}}\nTổng dự kiến: {{totalAmount}}\nPhương thức thanh toán: {{paymentMethod}}\nĐịa chỉ nhận hàng: {{address}}\nSố điện thoại: {{phone}}\n\nTra cứu trạng thái đơn hàng: {{trackingUrl}}\n\nBước tiếp theo:\n- ORORA sẽ liên hệ xác nhận đơn, phí giao hàng và hướng dẫn thanh toán (nếu chuyển khoản).\n- Thư này xác nhận đã nhận yêu cầu đặt hàng, chưa xác nhận thanh toán.\n- Nếu cần hỗ trợ nhanh, bạn có thể trả lời trực tiếp email này kèm mã đơn {{orderCode}}.\n\nCảm ơn bạn đã chọn ORORA!",
};
export const validOrderEmail = (value) => typeof value === "string" && value.length <= 254 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
export function validateOrderTemplate(value) {
  const message = validateMessage(value);
  if ([...`${message.subject}\n${message.text}`.matchAll(/\{\{(\w+)\}\}/g)].some((match) => !ORDER_TOKENS.includes(match[1]))) throw new Error("invalid_order_token");
  return message;
}
export function renderOrderMessage(template, order, env = process.env) {
  const orderedAt = order.createdAt?.toDate?.() ?? order.createdAt;
  const orderedDate = orderedAt ? new Date(orderedAt) : null;
  const multiProductSummary = Array.isArray(order.items) && order.items.length > 1
    ? order.items.map((item) => `${orderProductName(item)} × ${item.quantity}`).join("; ")
    : orderProductName(order.product);
  const totalFormatted = order.totalAmount == null ? "ORORA sẽ xác nhận" : formatVnd(order.totalAmount);
  let origin = "https://ororavn.com";
  try { if (env?.NEWSLETTER_SITE_ORIGIN) origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin; } catch { /* fallback to default */ }
  const trackingUrl = order.code
    ? `${origin}/tra-cuu-don-hang?code=${encodeURIComponent(order.code)}`
    : `${origin}/tra-cuu-don-hang`;
  const values = { customerName: order.customer.name, orderCode: order.code, productName: multiProductSummary, variantLabel: order.product.variantLabel || "", quantity: order.quantity, subtotal: order.subtotal == null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal), unitPrice: order.product.unitPrice == null ? formatProductPrice(order.product.priceText) || "ORORA sẽ báo giá" : formatVnd(order.product.unitPrice), shippingFee: order.shippingFee == null ? "ORORA sẽ xác nhận" : formatVnd(order.shippingFee), totalAmount: totalFormatted, total: totalFormatted, paymentMethod: PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod, paymentStatus: order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán", address: order.customer.address, phone: order.customer.phone, email: order.customer.email, note: order.customer.note || "Không có", createdAt: orderedDate && Number.isFinite(orderedDate.getTime()) ? orderedDate.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa lưu ngày đặt", trackingUrl };
  const fill = (text, subject = false) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => subject ? String(values[key] ?? "").replace(/[\r\n]/g, " ") : String(values[key] ?? ""));
  return validateMessage({ subject: fill(template.subject, true), text: fill(template.text) });
}
export async function sendOrderConfirmation({ db, orderId, sendMail, manual = false, requestId, confirmResend = false, recoverOnly = false, actor = "automatic", actorName = "", actorEmail = "", message: customMessage, templateRef }) {
  const orderRef = db.collection("orders").doc(orderId);
  const eventRef = orderRef.collection("mailEvents").doc(manual ? `manual-${requestId || randomUUID()}` : "confirmation-auto");
  const claimed = await db.runTransaction(async (tx) => {
    const [order, event, template] = await tx.getAll(orderRef, eventRef, db.collection("newsletterSettings").doc("orderConfirmation"));
    if (!order.exists) throw Object.assign(new Error("Không tìm thấy đơn hàng."), { status: 404 });

    const data = order.data();
    if (!validOrderEmail(data.customer?.email)) throw Object.assign(new Error("Đơn này chưa có email người mua hợp lệ."), { status: 400 });
    let previous = data.confirmationMail?.state;
    const stamp = data.confirmationMail?.updatedAt;
    const timestamp = stamp?.toMillis?.() ?? (stamp ? new Date(stamp).getTime() : NaN);
    const stale = previous === "sending" && (!Number.isFinite(timestamp) || Date.now() - timestamp > 5 * 60 * 1000);
    if (stale) {
      const updatedAt = new Date();
      const oldId = data.confirmationMail?.eventId;
      if (oldId && /^(confirmation-auto|manual-[a-f0-9-]{36})$/i.test(oldId)) tx.set(orderRef.collection("mailEvents").doc(oldId), { state: "unknown", errorCode: "mail_smtp_outcome_unknown", errorMessage: "Quá thời gian xử lý. Kiểm tra Microsoft trước khi gửi lại.", updatedAt }, { merge: true });
      tx.set(orderRef, { confirmationMail: { ...data.confirmationMail, state: "unknown", updatedAt } }, { merge: true });
      return { expired: true };
    }
    if (recoverOnly) return { recoverySkipped: true };
    if (event.exists) return null;
    if (previous === "sending" || (previous === "unknown" && !(manual && confirmResend))) throw Object.assign(new Error("Kết quả gửi trước chưa rõ hoặc đang xử lý. Kiểm tra thư đã gửi trên Microsoft trước khi gửi lại."), { status: 409 });
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
  if (claimed.recoverySkipped) return { state: "unchanged", errorMessage: "Trạng thái đã thay đổi. Hãy xem lại kết quả trước khi gửi." };
  if (claimed.expired) return {
    state: "unknown",
    errorMessage: "Đã chuyển lần gửi bị gián đoạn sang Chưa rõ kết quả. Chưa gửi thêm email. Hãy kiểm tra Outlook trước khi xác nhận gửi lại.",
  };
  if (claimed.templateError) return { state: "failed" };
  let state = "accepted"; let errorCode = ""; let errorMessage = ""; let tracking = {};
  try {
    if (typeof sendMail !== "function") throw new Error("mail_configuration_missing");
    const started = Date.now();
    try { tracking = safeMailTracking(await sendMail(claimed.recipient, claimed.message)); }
    catch (error) {
      if (error.message !== "mail_smtp_connection_failed" || Date.now() - started > 10000) throw error;
      // A single proven pre-submission retry, leaving time for the final write.
      await new Promise((resolve) => setTimeout(resolve, 750));
      tracking = safeMailTracking(await sendMail(claimed.recipient, claimed.message));
    }
  } catch (error) {
    tracking = safeMailTracking(error.mailTracking);
    const known = ["mail_configuration_missing", "mail_transport_invalid", "mail_auth_failed", "mail_send_failed", "mail_smtp_auth_failed", "mail_smtp_connection_failed"].includes(error.message);
    state = known ? "failed" : "unknown";
    ({ errorCode, errorMessage } = describeMailError(error));
  }
  const updatedAt = new Date();
  // An interrupted write is recovered conservatively on the next send request.
  await db.runTransaction(async (tx) => {
    const latest = await tx.get(orderRef);
    if (state === "accepted") await recordTemplateUse(tx, db, claimed.snapshot);
    tx.set(eventRef, { state, errorCode, errorMessage, ...tracking, updatedAt }, { merge: true });
    if (latest.data()?.confirmationMail?.eventId === eventRef.id) tx.set(orderRef, { confirmationMail: { state, eventId: eventRef.id, updatedAt } }, { merge: true });
  });
  return { state, ...(errorCode ? { errorCode, errorMessage } : {}) };
}
