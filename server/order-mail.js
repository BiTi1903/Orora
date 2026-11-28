import { findMailPreset } from "../src/lib/mail-presets.js";
import { reviewRecord } from "./mail-review.js";
import { orderTrackingMail, trackingTemplate } from "../src/lib/order-tracking-mail.js";
import { sectionIsEnabled } from "../src/lib/page-sections.js";
import { orderProductName } from "../src/lib/product-options.js";
import { describeMailError } from "./mail-error.js";
import { safeMailTracking } from "./mail-tracking.js";
import { captureTemplate, recordTemplateUse, templateIdentity } from "./template-snapshot.js";
import { randomUUID } from "node:crypto";
import { validateMessage } from "./newsletter-content.js";
import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "../src/lib/commerce.js";
import { ORDER_TOKENS } from "../src/lib/template-kinds.js";
import { renderOrderEmailHtml } from "../src/lib/mail-html.js";
export { ORDER_TOKENS };
export const DEFAULT_ORDER_MESSAGE = {
  subject: "ORORA xác nhận đã tiếp nhận đơn hàng {{orderCode}}",
  text: "Chào {{customerName}},\n\nCảm ơn bạn đã tin chọn ORORA. Đơn hàng {{orderCode}} của bạn đã được hệ thống tiếp nhận thành công.\n\nTHÔNG TIN ĐƠN HÀNG\n- Sản phẩm: {{productName}}\n- Số lượng: {{quantity}}\n- Tạm tính: {{subtotal}}\n- Phí giao hàng: {{shippingFee}}\n- Tổng thanh toán dự kiến: {{totalAmount}}\n- Thanh toán: {{paymentMethod}} ({{paymentStatus}})\n- Người nhận: {{customerName}} · {{phone}}\n- Địa chỉ giao hàng: {{address}}\n\n{{trackingInstructions}}\n\nBƯỚC TIẾP THEO\n- Đội ngũ ORORA sẽ liên hệ xác nhận đơn hàng, phí giao hàng và thời gian giao dự kiến.\n- Email này xác nhận đã tiếp nhận yêu cầu đặt hàng, chưa xác nhận thanh toán.\n- Nếu cần điều chỉnh thông tin hoặc hỗ trợ nhanh, bạn chỉ cần trả lời trực tiếp email này kèm mã đơn {{orderCode}}.\n\nTrân trọng,\nORORA Vietnam\nsales@ororavn.com",
};
export const validOrderEmail = (value) => typeof value === "string" && value.length <= 254 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);
export function validateOrderTemplate(value) {
  const message = validateMessage(value);
  if ([...`${message.subject}\n${message.text}`.matchAll(/\{\{(\w+)\}\}/g)].some((match) => !ORDER_TOKENS.includes(match[1]))) throw new Error("invalid_order_token");
  return message;
}
export function renderOrderMessage(template, order, env = process.env, { bankInfo = null, trackingEnabled = true } = {}) {
  const orderedAt = order.createdAt?.toDate?.() ?? order.createdAt;
  const orderedDate = orderedAt ? new Date(orderedAt) : null;
  const multiProductSummary = Array.isArray(order.items) && order.items.length > 1
    ? order.items.map((item) => `${orderProductName(item)} × ${item.quantity}`).join("; ")
    : orderProductName(order.product);
  const totalFormatted = order.totalAmount == null ? "ORORA sẽ xác nhận" : formatVnd(order.totalAmount);
  let origin = "https://ororavn.com";
  try { if (env?.NEWSLETTER_SITE_ORIGIN) origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin; } catch { /* fallback to default */ }
  const tracking = orderTrackingMail(origin, order.code, trackingEnabled);
  const trackingUrl = tracking.url;
  const values = { customerName: order.customer.name, orderCode: order.code, productName: multiProductSummary, variantLabel: order.product.variantLabel || "", quantity: order.quantity, subtotal: order.subtotal == null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal), unitPrice: order.product.unitPrice == null ? formatProductPrice(order.product.priceText) || "ORORA sẽ báo giá" : formatVnd(order.product.unitPrice), shippingFee: order.shippingFee == null ? "ORORA sẽ xác nhận" : formatVnd(order.shippingFee), totalAmount: totalFormatted, total: totalFormatted, paymentMethod: PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod, paymentStatus: order.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán", address: order.customer.address, phone: order.customer.phone, email: order.customer.email, note: order.customer.note || "Không có", createdAt: orderedDate && Number.isFinite(orderedDate.getTime()) ? orderedDate.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "Chưa lưu ngày đặt", trackingInstructions: tracking.instructions, trackingUrl, trackingCode: order.trackingCode || "" };
  const fill = (text, subject = false) => text.replace(/\{\{(\w+)\}\}/g, (_, key) => subject ? String(values[key] ?? "").replace(/[\r\n]/g, " ") : String(values[key] ?? ""));
  const text = trackingTemplate(template.text, trackingEnabled);
  const validated = validateMessage({ subject: fill(template.subject, true), text: fill(text) });
  const html = renderOrderEmailHtml({
    design: template.design,
    subject: validated.subject,
    text: validated.text,
    order,
    siteOrigin: origin,
    bankInfo,
    contactEmail: env?.MS_SENDER_EMAIL || "sales@ororavn.com",
    trackingUrl,
    trackingEnabled,
  });
  return { ...validated, html };
}
export async function sendOrderConfirmation({ db, orderId, sendMail, manual = false, requestId, confirmResend = false, recoverOnly = false, actor = "automatic", actorName = "", actorEmail = "", message: customMessage, templateRef, env = process.env }) {
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
    const home = (await tx.get(db.collection("settings").doc("home"))).data();
    const trackingEnabled = sectionIsEnabled(home, "ordertracking");
    const bankInfo = data.paymentMethod === "bank_transfer" ? home?.productDetailStyles?.purchaseOptions : null;
    let message; let sourceTemplate; let templateError = false;
    try { sourceTemplate = manual && customMessage ? validateOrderTemplate(customMessage) : template.exists ? validateOrderTemplate(template.data()) : DEFAULT_ORDER_MESSAGE; message = renderOrderMessage(sourceTemplate, data, env, {bankInfo,trackingEnabled}); }
    catch { message = { subject: "Không tạo được thư xác nhận đơn", text: "" }; templateError = true; }
    const snapshot = manual && customMessage ? await captureTemplate(tx, db, templateRef, sourceTemplate || {}, ["private", "order_auto"]) : template.exists ? templateIdentity(template.data()) : {};
    const createdAt = new Date();
    tx.set(eventRef, { type: "orderConfirmation", recipient: data.customer.email, subject: message.subject, text: message.text, ...snapshot, templateName: snapshot.templateName || (manual && customMessage ? "Nội dung soạn riêng cho đơn" : "Xác nhận đơn tự động"), state: templateError ? "failed" : "sending", errorCode: templateError ? "mail_template_invalid" : "", createdAt, updatedAt: createdAt, actor, actorName, actorEmail, manual, ...(sourceTemplate ? { templateSubject: sourceTemplate.subject, templateText: sourceTemplate.text } : {}) });
    tx.set(orderRef, { confirmationMail: { state: templateError ? "failed" : "sending", eventId: eventRef.id, updatedAt: createdAt } }, { merge: true });
    const reviewRef = db.collection("orderMailReview").doc(orderId + "-" + eventRef.id);
    if (templateError) tx.set(reviewRef, reviewRecord("order", data.customer.email, "failed", {}, eventRef.path, data.code));
    return { recipient: data.customer.email, code:data.code, message, templateError, snapshot };
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
    tx.set(db.collection("orderMailReview").doc(orderId + "-" + eventRef.id), reviewRecord("order", claimed.recipient, state, tracking, eventRef.path, claimed.code));
    tx.set(eventRef, { state, errorCode, errorMessage, ...tracking, updatedAt }, { merge: true });
    if (latest.data()?.confirmationMail?.eventId === eventRef.id) tx.set(orderRef, { confirmationMail: { state, eventId: eventRef.id, updatedAt } }, { merge: true });
  });
  return { state, ...(errorCode ? { errorCode, errorMessage } : {}) };
}

export async function deliverStatusMail({ db, orderRef, status, sendMail, env }) {
  const eventRef = orderRef.collection("mailEvents").doc("status-" + status);
  const preset = findMailPreset(status === "shipping" ? "shipping" : "delivered");
  const templateRef = db.collection("newsletterTemplates").doc(preset.id);
  const claim = await db.runTransaction(async tx => {
    const event = await tx.get(eventRef);
    if (event.data()?.state !== "queued") return null;
    const [order, saved, home] = await tx.getAll(orderRef, templateRef, db.collection("settings").doc("home"));
    const template = saved.data() || preset;
    const data = order.data();
    const metadata = { templateName:template.name, templateSubject:template.subject, templateText:template.text,
      ...(saved.exists ? {templateId:saved.id, templateRevision:template.revision || 1} : {}) };
    const message = renderOrderMessage(validateOrderTemplate(template), data, env, {
      trackingEnabled:sectionIsEnabled(home.data(), "ordertracking"),
      bankInfo:home.data()?.productDetailStyles?.purchaseOptions,
    });
    tx.set(eventRef, { ...metadata, state:"sending", subject:message.subject, text:message.text, updatedAt:new Date() }, {merge:true});
    return { message, recipient:data.customer.email, code:data.code, metadata };
  });
  if (!claim) return null;
  let state = "accepted";
  let tracking = {};
  let failure = {};
  try {
    if (!sendMail) throw new Error("mail_configuration_missing");
    tracking = safeMailTracking(await sendMail(claim.recipient, claim.message));
  } catch (error) {
    failure = describeMailError(error);
    tracking = safeMailTracking(error.mailTracking);
    state = ["mail_configuration_missing","mail_transport_invalid","mail_auth_failed","mail_send_failed","mail_smtp_auth_failed","mail_smtp_connection_failed"].includes(error.message) ? "failed" : "unknown";
  }
  await db.runTransaction(async tx => {
    if (state === "accepted") await recordTemplateUse(tx, db, claim.metadata);
    tx.set(eventRef, {state, ...failure, ...tracking, updatedAt:new Date()}, {merge:true});
    tx.set(db.collection("orderMailReview").doc(orderRef.id + "-" + eventRef.id), reviewRecord("order", claim.recipient, state, tracking, eventRef.path, claim.code));
  });
  return state;
}
