import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createOrderHandler, createAdminOrdersHandler } from "../server/orders.js";
import { memoryDb, response } from "./firestore-memory.js";
import { socialShopUrl, parseVndPrice, availablePaymentMethods } from "../src/lib/commerce.js";
const env = { NEWSLETTER_SITE_ORIGIN: "https://orora.example", NEWSLETTER_ADMIN_UIDS: "owner" };
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, "content-type": "application/json", "x-forwarded-for": "192.0.2.1" };
const body = () => ({ requestId: randomUUID(), productId: "serum", quantity: 2, name: "Khách thử nghiệm", phone: "0900000000", email: "buyer@example.com", address: "Địa chỉ thử nghiệm tại Hà Nội", note: "Ghi chú thử", paymentMethod: "cod", consent: true, website: "" });
async function setup() {
  const db = memoryDb();
  await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  await db.collection("inventory").doc("serum").set({ quantity: 100, version: 1 });
  const handler = createOrderHandler({ getDb: () => db, env, now: () => 1700000000000 });
  return { db, call: async (data, overrides = {}) => { const res = response(); await handler({ method: "POST", headers, body: data, ...overrides }, res); return res; } };
}
function admin(db, user = { uid: "owner" }) {
  const handler = createAdminOrdersHandler({ getDb: () => db, verifyToken: async () => user, env });
  return async (data, options = {}) => { const res = response(); await handler({ method: data ? "POST" : "GET", headers: { ...headers, authorization: "Bearer test-token" }, body: data, ...options }, res); return res; };
}

test("server prices orders from the real product and never accepts client payment claims", async () => {
  const { db, call } = await setup(); const data = { ...body(), subtotal: 1, price: 1, paymentStatus: "paid", status: "completed" };
  const res = await call(data); assert.equal(res.statusCode, 201);
  const record = (await db.collection("orders").doc(data.requestId).get()).data();
  assert.equal(record.subtotal, 500000); assert.equal(record.product.unitPrice, 250000); assert.equal(record.paymentStatus, "unpaid"); assert.equal(record.status, "new"); assert.equal(record.shippingFee, null);
  assert.equal(record.customer.phone, data.phone); assert.equal(record.paymentMethod, "cod");
  assert.equal(res.body.customer, undefined);
});

test("retries and concurrent double submissions create one order; changing the same key conflicts", async () => {
  const { db, call } = await setup(); const data = body();
  const [a, b] = await Promise.all([call(data), call(data)]);
  assert.equal(a.statusCode, 201); assert.equal(b.statusCode, 201); assert.equal(a.body.code, b.body.code);
  assert.equal((await db.collection("orders").get()).docs.length, 1);
  assert.equal((await call({ ...data, quantity: 3 })).statusCode, 409);
});

test("invalid input, cross-origin requests, inactive products and disabled payment methods are rejected", async () => {
  const { db, call } = await setup();
  for (const patch of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: 21 }, { consent: false }, { phone: "invalid" }, { paymentMethod: "credit_card" }, { website: "bot" }]) assert.equal((await call({ ...body(), ...patch })).statusCode, 400);
  assert.equal((await call(body(), { headers: { ...headers, origin: "https://evil.example" } })).statusCode, 403);
  assert.equal((await db.collection("orders").get()).docs.length, 0);
  await db.collection("settings").doc("home").set({ shopLinks: { paymentMethods: ["bank_transfer"] } });
  assert.equal((await call(body())).statusCode, 400);
  assert.equal((await call({ ...body(), paymentMethod: "bank_transfer" })).statusCode, 201);
  await db.collection("products").doc("serum").set({ active: false }, { merge: true });
  assert.equal((await call(body())).statusCode, 404);
});

test("rate limiting applies to new submissions and permits retrying an already accepted order", async () => {
  const { call } = await setup(); const original = body();
  assert.equal((await call(original)).statusCode, 201);
  for (let i = 0; i < 4; i++) assert.equal((await call(body())).statusCode, 201);
  assert.equal((await call(body())).statusCode, 429);
  assert.equal((await call(original)).statusCode, 201);
});

test("orders without a fixed price are explicitly left for a quote", async () => {
  const { db, call } = await setup(); await db.collection("products").doc("serum").set({ price: "Liên hệ" }, { merge: true });
  const data = body(); assert.equal((await call(data)).statusCode, 201);
  assert.equal((await db.collection("orders").doc(data.requestId).get()).data().subtotal, null);
});

test("private order data requires an allowlisted Firebase user; updates cannot rewrite customer or totals", async () => {
  const { db, call } = await setup(); const data = body(); await call(data);
  assert.equal((await admin(db)(null, { headers: {} })).statusCode, 401);
  assert.equal((await admin(db, { uid: "other" })(null)).statusCode, 403);
  const authorized = admin(db); const listed = await authorized(null);
  assert.equal(listed.statusCode, 200); assert.equal(listed.body.orders[0].requestHash, undefined);
  assert.equal((await authorized({ id: data.requestId, status: "confirmed", subtotal: 1, customer: { name: "changed" } })).statusCode, 200);
  let record = (await db.collection("orders").doc(data.requestId).get()).data();
  assert.equal(record.status, "confirmed"); assert.equal(record.customer.name, data.name); assert.equal(record.subtotal, 500000); assert.equal(record.paymentStatus, "unpaid");
  assert.equal((await authorized({ id: data.requestId, paymentStatus: "paid" })).statusCode, 200);
  record = (await db.collection("orders").doc(data.requestId).get()).data(); assert.equal(record.paymentStatus, "paid");
});

test("common shop links and price parsing reject misleading or unsupported values", () => {
  assert.equal(socialShopUrl("https://www.tiktok.com/@orora", "tiktok"), "https://www.tiktok.com/@orora");
  assert.equal(socialShopUrl("https://www.facebook.com/orora", "facebook"), "https://www.facebook.com/orora");
  for (const url of ["javascript:alert(1)", "https://facebook.com.evil.example/", "https://name@facebook.com/"]) assert.equal(socialShopUrl(url, "facebook"), null);
  assert.equal(parseVndPrice("1.290.000đ"), 1290000); assert.equal(parseVndPrice("Liên hệ"), null); assert.equal(parseVndPrice(0), 0);
  assert.deepEqual(availablePaymentMethods({ shopLinks: { paymentMethods: ["cod", "cod", "fake"] } }), ["cod"]);
});

test("stale displayed prices are rejected before writing an order", async () => {
  const { db, call } = await setup();
  assert.equal((await call({ ...body(), expectedPriceText: "200.000đ" })).statusCode, 409);
  assert.equal((await db.collection("orders").get()).docs.length, 0);
});

test("admin order pagination returns the next older page without duplicates", async () => {
  const db = memoryDb();
  for (let i = 0; i < 52; i++) await db.collection("orders").doc(randomUUID()).set({ code: `TEST-${i}`, createdAt: new Date(1700000000000 + i), requestHash: "private" });
  const call = admin(db); const first = await call(null);
  assert.equal(first.body.orders.length, 50); assert.equal(first.body.orders[0].code, "TEST-51");
  const second = await call(null, { query: { cursor: first.body.nextCursor } });
  assert.equal(second.body.orders.length, 2); assert.equal(second.body.nextCursor, null);
  assert.equal(new Set([...first.body.orders, ...second.body.orders].map((item) => item.id)).size, 52);
});

test("completing an order records payment atomically without changing method, amount or buyer", async () => {
  for (const paymentMethod of ["cod", "bank_transfer"]) {
    const { db, call } = await setup(); const data = { ...body(), paymentMethod }; await call(data);
    const authorized = admin(db);
    assert.equal((await authorized({ id: data.requestId, status: "completed", paymentStatus: "unpaid" })).statusCode, 200);
    const record = (await db.collection("orders").doc(data.requestId).get()).data();
    assert.equal(record.status, "completed"); assert.equal(record.paymentStatus, "paid");
    assert.equal(record.paymentMethod, paymentMethod); assert.equal(record.subtotal, 500000); assert.equal(record.customer.email, data.email);
    await authorized({ id: data.requestId, status: "shipping" });
    assert.equal((await db.collection("orders").doc(data.requestId).get()).data().paymentStatus, "paid");
    await authorized({ id: data.requestId, paymentStatus: "unpaid" });
    assert.equal((await db.collection("orders").doc(data.requestId).get()).data().paymentStatus, "unpaid");
  }
});

test("order mail history includes existing automatic and manual events across pages and requires order authorization", async () => {
  const db = memoryDb(); const ids = [];
  for (let i = 0; i < 21; i++) {
    const id = randomUUID(); ids.push(id);
    const ref = db.collection("orders").doc(id);
    await ref.set({ code: `ORDER-${i}`, customer: { name: "Buyer", address: "Private address", email: "buyer@example.com" }, createdAt: new Date(100000 - i * 1000), requestHash: "private-hash" });
    for (const manual of [false, true]) await ref.collection("mailEvents").doc(manual ? "manual-test" : "confirmation-auto").set({ subject: "Stored receipt", text: "Exact old content", recipient: "buyer@example.com", state: manual ? "failed" : "accepted", manual, createdAt: new Date(500000 + i), updatedAt: new Date(600000 + i) });
  }
  const options = { query: { mailHistory: "1" } };
  assert.equal((await admin(db, { uid: "other" })(null, options)).statusCode, 403);
  assert.equal((await admin(db)(null, { ...options, headers: {} })).statusCode, 401);
  const page1 = await admin(db)(null, options);
  assert.equal(page1.statusCode, 200); assert.equal(page1.body.scannedOrders, 20); assert.equal(page1.body.mails.length, 40);
  assert.equal(page1.body.nextCursor, ids[19]);
  const page2 = await admin(db)(null, { query: { mailHistory: "1", cursor: page1.body.nextCursor } });
  assert.equal(page2.body.mails.length, 2); assert.equal(page2.body.nextCursor, null);
  const mails = [...page1.body.mails, ...page2.body.mails];
  assert.equal(new Set(mails.map((mail) => mail.id)).size, 42);
  assert.equal(mails.filter((mail) => mail.manual).length, 21);
  assert.ok(mails.every((mail) => mail.text === "Exact old content" && mail.requestHash === undefined && mail.customer === undefined));
});

test("Outlook order checks require order authorization and preserve immutable send history", async () => {
  const db = memoryDb(); const id = randomUUID(); const eventId = `manual-${randomUUID()}`;
  const ref = db.collection("orders").doc(id).collection("mailEvents").doc(eventId);
  await ref.set({ subject: "Original", text: "Sent body", state: "accepted", recipient: "buyer@example.com", trackingId: randomUUID() });
  let reads = 0;
  const check = async () => { reads++; return { state: "bounced", diagnosticCode: "5.7.708", checkedAt: new Date().toISOString() }; };
  const call = async (uid) => { const res = response(); const handler = createAdminOrdersHandler({ getDb: () => db, verifyToken: async () => ({ uid }), checkOutlook: check, env }); await handler({ method: "POST", headers: { ...headers, authorization: "Bearer test" }, body: { action: "checkOrderOutlook", id, eventId } }, res); return res; };
  assert.equal((await call("other")).statusCode, 403); assert.equal(reads, 0);
  assert.equal((await call("owner")).body.outlook.state, "bounced");
  await call("owner"); assert.equal(reads, 1);
  const saved = (await ref.get()).data(); assert.equal(saved.subject, "Original"); assert.equal(saved.text, "Sent body"); assert.equal(saved.state, "accepted");
});

test("order is durably saved and acknowledged before slow background email; duplicate submissions send once", async () => {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  let release; const gate = new Promise((resolve) => { release = resolve; }); const tasks = []; let calls = 0;
  const handler = createOrderHandler({ getDb: () => db, env, schedule: (task) => tasks.push(task), sendMail: async () => { calls++; await gate; } });
  const data = body();
  const call = async () => { const res = response(); await handler({ method: "POST", headers, body: data }, res); return res; };
  const first = await call(); assert.equal(first.statusCode, 201); assert.equal(first.body.mailStatus, "pending");
  const saved = (await db.collection("orders").doc(data.requestId).get()).data(); assert.equal(saved.code, first.body.code); assert.equal(saved.subtotal, 500000);
  const second = await call(); assert.equal(second.statusCode, 201); assert.equal(second.body.code, first.body.code);
  release(); await Promise.all(tasks);
  assert.equal(calls, 1); assert.equal((await db.collection("orders").get()).docs.length, 1);
  assert.equal((await db.collection("orders").doc(data.requestId).get()).data().confirmationMail.state, "accepted");
});

test("background confirmation failure preserves the accepted order and records admin failure", async () => {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  const tasks = []; const data = body();
  const handler = createOrderHandler({ getDb: () => db, env, schedule: (task) => tasks.push(task), sendMail: async () => { throw new Error("mail_smtp_auth_failed"); } });
  const res = response(); await handler({ method: "POST", headers, body: data }, res); assert.equal(res.statusCode, 201);
  await Promise.all(tasks);
  const order = (await db.collection("orders").doc(data.requestId).get()).data(); assert.equal(order.status, "new"); assert.equal(order.paymentStatus, "unpaid"); assert.equal(order.confirmationMail.state, "failed");
});

test("random order codes include the correct payment suffix and remain stable across concurrent retries", async () => {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  const handler = createOrderHandler({ getDb: () => db, env, chooseCodeIndex: () => 0, sendMail: async () => {} });
  const call = async (data = body()) => { const res = response(); await handler({ method: "POST", headers, body: data }, res); return res; };
  const original = body();
  const results = await Promise.all([call(original), call(), call(original), call({ ...body(), paymentMethod: "bank_transfer" })]);
  assert.deepEqual(results.map((res) => res.body.code), ["OW_0000C", "OW_9999C", "OW_0000C", "OW_0000B"]);
  assert.ok(results.every((res) => res.statusCode === 201));
  assert.equal((await db.collection("orderCodePools").doc("C").get()).data().remaining, 9998);
  assert.equal((await db.collection("orderCodePools").doc("B").get()).data().remaining, 9999);
  assert.equal((await call({ ...body(), expectedPriceText: "wrong" })).statusCode, 409);
  assert.equal((await db.collection("orderCodePools").doc("C").get()).data().remaining, 9998);
});

test("legacy codes survive retries; exhausted pools do not create orders or reserve inventory", async () => {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", active: true });
  const handler = createOrderHandler({ getDb: () => db, env, sendMail: async () => {} });
  const call = async (data) => { const res = response(); await handler({ method: "POST", headers, body: data }, res); return res; };
  const original = body(); await call(original);
  await db.collection("orders").doc(original.requestId).set({ code: "OW22910" }, { merge: true });
  await db.collection("orderCodePools").doc("C").set({ remaining: 0, swaps: {} });
  assert.equal((await call(original)).body.code, "OW22910");
  const inventoryBefore = (await db.collection("inventory").doc("serum").get()).data();
  assert.equal((await call(body())).statusCode, 503);
  assert.equal((await db.collection("orders").get()).docs.length, 1);
  assert.deepEqual((await db.collection("inventory").doc("serum").get()).data(), inventoryBefore);
});
