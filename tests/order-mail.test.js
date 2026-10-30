import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { memoryDb, response } from "./firestore-memory.js";
import { sendOrderConfirmation, renderOrderMessage, validateOrderTemplate, DEFAULT_ORDER_MESSAGE } from "../server/order-mail.js";
import { createOrderHandler, createAdminOrdersHandler } from "../server/orders.js";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";
const env = { NEWSLETTER_SITE_ORIGIN: "https://orora.example", NEWSLETTER_ADMIN_UIDS: "owner" };
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, "content-type": "application/json", authorization: "Bearer test" };
const record = () => ({ code: "OR-TEST", product: { id: "serum", name: "Serum" }, quantity: 2, subtotal: 500000, paymentMethod: "cod", status: "new", paymentStatus: "unpaid", customer: { name: "Khách thử", email: "buyer@example.com", phone: "0900000000", address: "Địa chỉ thử nghiệm", note: "" }, createdAt: new Date() });
async function setup() { const db = memoryDb(); const orderId = randomUUID(); await db.collection("orders").doc(orderId).set(record()); return { db, orderId }; }

test("automatic receipt sends once across concurrent calls and preserves exact sent content in history", async () => {
  const { db, orderId } = await setup(); const sent = [];
  await db.collection("newsletterSettings").doc("orderConfirmation").set({ subject: "Đã nhận {{orderCode}}", text: "Chào {{customerName}}: {{productName}} × {{quantity}}" });
  const sendMail = async (...args) => { sent.push(args); };
  await Promise.all([sendOrderConfirmation({ db, orderId, sendMail }), sendOrderConfirmation({ db, orderId, sendMail })]);
  assert.equal(sent.length, 1); assert.equal(sent[0][0], "buyer@example.com"); assert.equal(sent[0][1].subject, "Đã nhận OR-TEST");
  const events = await db.collection("orders").doc(orderId).collection("mailEvents").get();
  assert.equal(events.docs.length, 1); assert.equal(events.docs[0].data().state, "accepted"); assert.equal(events.docs[0].data().text, sent[0][1].text);
  const order = (await db.collection("orders").doc(orderId).get()).data(); assert.equal(order.status, "new"); assert.equal(order.paymentStatus, "unpaid");
});

test("known failures are logged, auto retries do not send twice, and manual retries are idempotent", async () => {
  const { db, orderId } = await setup(); let calls = 0;
  const fail = async () => { calls++; throw new Error("mail_smtp_auth_failed"); };
  assert.equal((await sendOrderConfirmation({ db, orderId, sendMail: fail })).state, "failed");
  await sendOrderConfirmation({ db, orderId, sendMail: fail }); assert.equal(calls, 1);
  const requestId = randomUUID(); const sendMail = async () => { calls++; };
  await sendOrderConfirmation({ db, orderId, sendMail, manual: true, requestId });
  await sendOrderConfirmation({ db, orderId, sendMail, manual: true, requestId }); assert.equal(calls, 2);
  await assert.rejects(sendOrderConfirmation({ db, orderId, sendMail, manual: true, requestId: randomUUID() }), { status: 409 });
  await sendOrderConfirmation({ db, orderId, sendMail, manual: true, requestId: randomUUID(), confirmResend: true }); assert.equal(calls, 3);
});

test("ambiguous SMTP outcomes block automatic and manual retransmission", async () => {
  const { db, orderId } = await setup(); let calls = 0;
  const sendMail = async () => { calls++; throw new Error("mail_smtp_outcome_unknown"); };
  assert.equal((await sendOrderConfirmation({ db, orderId, sendMail })).state, "unknown");
  await sendOrderConfirmation({ db, orderId, sendMail });
  await assert.rejects(sendOrderConfirmation({ db, orderId, sendMail, manual: true, requestId: randomUUID(), confirmResend: true }), { status: 409 });
  assert.equal(calls, 1);
});

test("mail failures never reject an accepted order, and buyers are not enrolled in marketing", async () => {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  const handler = createOrderHandler({ getDb: () => db, env, sendMail: async () => { throw new Error("mail_configuration_missing"); } });
  const body = { ...record().customer, requestId: randomUUID(), productId: "serum", quantity: 1, paymentMethod: "cod", consent: true };
  const res = response(); await handler({ method: "POST", headers, body }, res); assert.equal(res.statusCode, 201);
  assert.equal((await db.collection("orders").doc(body.requestId).get()).data().confirmationMail.state, "failed");
  assert.equal((await db.collection("newsletterSubscribers").get()).docs.length, 0);
  for (const email of ["", "a@example.com,b@example.com", "a@example.com\r\nBcc:b@example.com"]) {
    const invalid = response(); await handler({ method: "POST", headers, body: { ...body, requestId: randomUUID(), email } }, invalid); assert.equal(invalid.statusCode, 400);
  }
});

test("template validation rejects unknown variables and rendering cannot inject a subject header", () => {
  assert.throws(() => validateOrderTemplate({ subject: "{{badToken}}", text: "Hello" }));
  const order = record(); order.customer.name = "Khách\r\nBcc: attacker";
  const message = renderOrderMessage({ subject: "Chào {{customerName}}", text: "{{orderCode}}" }, order);
  assert.ok(!/[\r\n]/.test(message.subject)); assert.equal(message.text, "OR-TEST");
  assert.ok(DEFAULT_ORDER_MESSAGE.text.includes("chưa xác nhận thanh toán"));
});

test("receipt template is managed through Email marketing and history remains private", async () => {
  const { db, orderId } = await setup();
  const handler = createNewsletterAdminHandler({ getDb: () => db, verifyToken: async () => ({ uid: "owner" }), env, sendMail: async () => {} });
  const save = response(); await handler({ method: "POST", headers, body: { action: "saveOrderTemplate", subject: "Đơn {{orderCode}}", text: "{{productName}}" } }, save); assert.equal(save.statusCode, 200);
  const get = response(); await handler({ method: "GET", headers }, get); assert.equal(get.body.orderTemplate.subject, "Đơn {{orderCode}}");
  await sendOrderConfirmation({ db, orderId, sendMail: async () => {} });
  const unauthorized = createAdminOrdersHandler({ getDb: () => db, verifyToken: async () => ({ uid: "other" }), env });
  const no = response(); await unauthorized({ method: "GET", headers, query: { id: orderId } }, no); assert.equal(no.statusCode, 403);
  const authorized = createAdminOrdersHandler({ getDb: () => db, verifyToken: async () => ({ uid: "owner" }), env });
  const yes = response(); await authorized({ method: "GET", headers, query: { id: orderId } }, yes); assert.equal(yes.body.mails[0].recipient, "buyer@example.com"); assert.equal(yes.body.mails[0].subject, "Đơn OR-TEST");
});

test("manual order mail records verified account and reusable source template without replacing automatic settings", async () => {
  const { db, orderId } = await setup(); const sent = [];
  const original = { subject: "Automatic {{orderCode}}", text: "Automatic {{customerName}}" };
  await db.collection("newsletterSettings").doc("orderConfirmation").set(original);
  const handler = createAdminOrdersHandler({ getDb: () => db, env, verifyToken: async () => ({ uid: "owner", name: "Linh", email: "linh@ororavn.com" }), sendMail: async (...args) => sent.push(args) });
  const message = { subject: "Riêng {{orderCode}}", text: "Chào {{customerName}}, nội dung riêng." };
  const res = response(); await handler({ method: "POST", headers, body: { action: "sendOrderEmail", id: orderId, requestId: randomUUID(), message, actorName: "Forged" } }, res);
  assert.equal(res.statusCode, 200); assert.equal(sent[0][1].subject, "Riêng OR-TEST");
  const event = (await db.collection("orders").doc(orderId).collection("mailEvents").get()).docs[0].data();
  assert.equal(event.actorName, "Linh"); assert.equal(event.actorEmail, "linh@ororavn.com"); assert.equal(event.actor, "owner");
  assert.equal(event.templateSubject, message.subject); assert.equal(event.templateText, message.text);
  assert.deepEqual((await db.collection("newsletterSettings").doc("orderConfirmation").get()).data(), original);
});

test("sent order snapshots keep template name and content across rename, edits and deletion; stale picks cannot send", async () => {
  const { db, orderId } = await setup(); const sent = [];
  const handler = createNewsletterAdminHandler({ getDb: () => db, env, verifyToken: async () => ({ uid: "owner" }), sendMail: async () => {} });
  const call = async (body) => { const res = response(); await handler({ method: "POST", headers, body }, res); return res; };
  const original = { action: "saveLibraryTemplate", id: "manual-template", name: "Cảm ơn ban đầu", kind: "order", subject: "Đơn {{orderCode}}", text: "Chào {{customerName}}" };
  await call(original);
  const templateRef = { id: original.id, revision: 1 };
  await sendOrderConfirmation({ db, orderId, manual: true, requestId: randomUUID(), message: original, templateRef, sendMail: async (...args) => sent.push(args) });
  let saved = (await db.collection("newsletterTemplates").doc(original.id).get()).data();
  assert.equal(saved.sentCount, 1); assert.deepEqual(saved.usedRevisions, [1]);
  await call({ ...original, name: "Đổi tên mới", text: "Nội dung mới {{orderCode}}" });
  saved = (await db.collection("newsletterTemplates").doc(original.id).get()).data();
  assert.equal(saved.revision, 2); assert.equal(saved.sentCount, 1); assert.deepEqual(saved.usedRevisions, [1]);
  const event = (await db.collection("orders").doc(orderId).collection("mailEvents").get()).docs[0].data();
  assert.equal(event.templateName, original.name); assert.equal(event.templateRevision, 1); assert.equal(event.templateText, original.text); assert.equal(event.text, "Chào Khách thử");
  await assert.rejects(sendOrderConfirmation({ db, orderId, manual: true, requestId: randomUUID(), message: original, templateRef, confirmResend: true, sendMail: async (...args) => sent.push(args) }), /template_changed/);
  assert.equal(sent.length, 1);
  await call({ action: "deleteLibraryTemplate", id: original.id });
  assert.equal((await db.collection("orders").doc(orderId).collection("mailEvents").get()).docs[0].data().templateName, original.name);
});

test("automatic template applies a snapshot and keeps it when the library changes later", async () => {
  const { db, orderId } = await setup();
  const admin = createNewsletterAdminHandler({ getDb: () => db, env, verifyToken: async () => ({ uid: "owner" }), sendMail: async () => {} });
  const call = async (body) => { const res = response(); await admin({ method: "POST", headers, body }, res); return res; };
  const template = { id: "automatic-template", name: "Tự động v1", kind: "order_auto", subject: "Đơn {{orderCode}}", text: "Nội dung gốc" };
  assert.equal((await call({ action: "saveLibraryTemplate", ...template })).statusCode, 200);
  assert.equal((await call({ action: "saveOrderTemplate", ...template, templateRef: { id: template.id, revision: 1 } })).statusCode, 200);
  await call({ action: "saveLibraryTemplate", ...template, name: "Đổi tên v2", text: "Nội dung khác" });
  const sent = []; await sendOrderConfirmation({ db, orderId, sendMail: async (...args) => sent.push(args) });
  assert.equal(sent[0][1].text, "Nội dung gốc");
  const event = (await db.collection("orders").doc(orderId).collection("mailEvents").get()).docs[0].data();
  assert.equal(event.templateText, "Nội dung gốc"); assert.equal(event.templateName, "Tự động v1"); assert.equal(event.templateRevision, 1);
  const current = (await db.collection("newsletterTemplates").doc(template.id).get()).data();
  assert.equal(current.revision, 2); assert.deepEqual(current.usedRevisions, [1]);
});

test("order email sends the exact saved body without appending details or exceeding its validated length", async () => {
  const { db, orderId } = await setup();
  const template = { subject: "Đơn {{orderCode}}", text: "x".repeat(19990) };
  await db.collection("newsletterSettings").doc("orderConfirmation").set(template);
  let actual;
  const result = await sendOrderConfirmation({ db, orderId, sendMail: async (_, message) => { actual = message; } });
  assert.equal(result.state, "accepted"); assert.equal(actual.text, template.text);
  assert.deepEqual((await db.collection("newsletterSettings").doc("orderConfirmation").get()).data(), template);
  const event = (await db.collection("orders").doc(orderId).collection("mailEvents").doc("confirmation-auto").get()).data();
  assert.equal(event.templateText, template.text); assert.equal(event.text, template.text);
  const explicit = renderOrderMessage({ subject: "Đơn {{orderCode}}", text: "Phí {{shippingFee}}, tổng {{totalAmount}}, ghi chú {{note}}, thanh toán {{paymentStatus}}" }, { ...record(), shippingFee: 15000, totalAmount: 515000 });
  assert.match(explicit.text, /15\.000/); assert.match(explicit.text, /515\.000/); assert.match(explicit.text, /Chưa thanh toán/);
});
