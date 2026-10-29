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
