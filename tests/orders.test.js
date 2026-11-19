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
  for (const patch of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: 21 }, { consent: false }, { phone: "invalid" }, { paymentMethod: "credit_card" }]) assert.equal((await call({ ...body(), ...patch })).statusCode, 400);
  assert.equal((await call(body(), { headers: { ...headers, origin: "https://evil.example" } })).statusCode, 403);
  assert.equal((await db.collection("orders").get()).docs.length, 0);
  await db.collection("settings").doc("home").set({ shopLinks: { paymentMethods: ["bank_transfer"] } });
  assert.equal((await call(body())).statusCode, 400);
  assert.equal((await call({ ...body(), paymentMethod: "bank_transfer" })).statusCode, 201);
  await db.collection("products").doc("serum").set({ active: false }, { merge: true });
  assert.equal((await call(body())).statusCode, 404);
});

test("repeated names, phones, emails and IPs do not block new orders or their emails", async () => {
  const { db } = await setup(); let sent = 0;
  await db.collection("orderRateLimits").doc("global").set({ count: 999999, windowStart: new Date() });
  const handler = createOrderHandler({ getDb: () => db, env, sendMail: async () => { sent++; } });
  const original = body();
  const call = async (data) => { const res = response(); await handler({ method: "POST", headers, body: data }, res); return res; };
  for (let i = 0; i < 8; i++) assert.equal((await call(i === 0 ? original : { ...body(), website: "ignored legacy field" })).statusCode, 201);
  assert.equal(sent, 8);
  assert.equal((await call(original)).statusCode, 201); assert.equal(sent, 8);
  assert.equal((await db.collection("orders").get()).docs.length, 8);
  assert.equal((await db.collection("orderRateLimits").doc("global").get()).data().count, 999999);
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

test("completing an order records payment atomically and locks backward status or unpaid reversal", async () => {
  for (const paymentMethod of ["cod", "bank_transfer"]) {
    const { db, call } = await setup(); const data = { ...body(), paymentMethod }; await call(data);
    const authorized = admin(db);
    assert.equal((await authorized({ id: data.requestId, status: "completed" })).statusCode, 409);
    assert.equal((await authorized({ id: data.requestId, status: "confirmed" })).statusCode, 200);
    assert.equal((await authorized({ id: data.requestId, status: "completed", paymentStatus: "unpaid" })).statusCode, 200);
    const record = (await db.collection("orders").doc(data.requestId).get()).data();
    assert.equal(record.status, "completed"); assert.equal(record.paymentStatus, "paid");
    assert.equal(record.paymentMethod, paymentMethod); assert.equal(record.subtotal, 500000); assert.equal(record.customer.email, data.email);
    assert.equal((await authorized({ id: data.requestId, status: "shipping" })).statusCode, 409);
    assert.equal((await authorized({ id: data.requestId, status: "new" })).statusCode, 409);
    assert.equal((await authorized({ id: data.requestId, paymentStatus: "unpaid" })).statusCode, 409);
    assert.equal((await db.collection("orders").doc(data.requestId).get()).data().paymentStatus, "paid");
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

test("volume price and label are trusted snapshots; choosing another volume on a retry never creates a second order", async () => {
  const { db, call } = await setup();
  const volumeOptions = [{ id: "small", label: "100 ml", price: "" }, { id: "big", label: "200 ml", price: "400.000đ" }];
  await db.collection("products").doc("serum").set({ volumeOptions }, { merge: true });
  const request = { ...body(), variantId: "big", variantLabel: "Fake label", price: 1, unitPrice: 1, expectedPriceText: "400.000đ", expectedVariantLabel: "200 ml" };
  const response = await call(request); assert.equal(response.statusCode, 201);
  const first = (await db.collection("orders").doc(request.requestId).get()).data();
  assert.equal(first.product.variantId, "big"); assert.equal(first.product.variantLabel, "200 ml");
  assert.equal(first.product.unitPrice, 400000); assert.equal(first.product.priceText, "400.000đ"); assert.equal(first.subtotal, 800000);
  assert.equal(response.body.variantLabel, "200 ml"); assert.equal(response.body.quantity, 2);
  await db.collection("products").doc("serum").set({ volumeOptions: [{ id: "small", label: "100 ml", price: "" }, { id: "big", label: "250 ml", price: "500.000đ" }] }, { merge: true });
  const retry = await call(request); assert.equal(retry.statusCode, 201); assert.equal(retry.body.subtotal, 800000); assert.equal(retry.body.variantLabel, "200 ml");
  assert.equal((await call({ ...request, variantId: "small" })).statusCode, 409);
  assert.equal((await db.collection("orders").get()).docs.length, 1);
  assert.equal((await db.collection("inventory").doc("serum").get()).data().quantity, 100);
});

test("single volumes auto-select and inherit base price, but missing/removed choices and stale prices never reserve stock", async () => {
  const { db, call } = await setup();
  const stock = () => db.collection("inventory").doc("serum").get().then(s => s.data());
  await db.collection("products").doc("serum").set({ volumeOptions: [{ id: "only", label: "40 ml", price: "" }] }, { merge: true });
  const single = { ...body(), quantity: 1 };
  assert.equal((await call(single)).statusCode, 201);
  const saved = (await db.collection("orders").doc(single.requestId).get()).data();
  assert.equal(saved.product.variantLabel, "40 ml"); assert.equal(saved.subtotal, 250000);
  const before = await stock();
  await db.collection("products").doc("serum").set({ volumeOptions: [{ id: "one", label: "40 ml", price: "" }, { id: "two", label: "100 ml", price: "450.000đ" }] }, { merge: true });
  for (const patch of [{}, { variantId: "removed" }, { variantId: {} }, { variantId: "../../products" }]) assert.equal((await call({ ...body(), ...patch })).statusCode, 400);
  assert.equal((await call({ ...body(), variantId: "two", expectedPriceText: "250.000đ" })).statusCode, 409);
  assert.equal((await call({ ...body(), variantId: "two", expectedVariantLabel: "200 ml" })).statusCode, 409);
  assert.deepEqual(await stock(), before);
  assert.equal((await db.collection("orders").get()).docs.length, 1);
});

test("products without volume options reject injected choices; invalid configured options cannot silently use the base price", async () => {
  const { db, call } = await setup();
  assert.equal((await call({ ...body(), variantId: "fake" })).statusCode, 400);
  for (const options of [[{ id: "one", label: "100 ml", price: "bad price" }], [{ id: "same", label: "100 ml" }, { id: "same", label: "200 ml" }], null]) {
    await db.collection("products").doc("serum").set({ volumeOptions: options }, { merge: true });
    assert.equal((await call({ ...body(), variantId: "one" })).statusCode, 409);
  }
  assert.equal((await db.collection("orders").get()).docs.length, 0);
});

test("format-only price changes do not reject orders, while real amount changes still require confirmation", async () => {
  const { db, call } = await setup();
  await db.collection("products").doc("serum").set({ price: "250000" }, { merge: true });
  const oldDisplay = body();
  assert.equal((await call({ ...oldDisplay, expectedPriceText: "250.000đ" })).statusCode, 201);
  assert.equal((await db.collection("orders").doc(oldDisplay.requestId).get()).data().subtotal, 500000);
  await db.collection("products").doc("serum").set({ volumeOptions: [{ id: "one", label: "100 ml", price: "400000" }] }, { merge: true });
  const variant = body();
  assert.equal((await call({ ...variant, variantId: "one", expectedPriceText: "400.000 đ" })).statusCode, 201);
  const saved = (await db.collection("orders").doc(variant.requestId).get()).data();
  assert.equal(saved.product.priceText, "400000"); assert.equal(saved.subtotal, 800000);
  await db.collection("products").doc("serum").set({ volumeOptions: [{ id: "one", label: "100 ml", price: "450000" }] }, { merge: true });
  assert.equal((await call({ ...body(), variantId: "one", expectedPriceText: "400000" })).statusCode, 409);
  assert.equal((await db.collection("orders").get()).docs.length, 2);
});

test("order creation batches stock reads and skips historical-order scans only for uncounted stock", async () => {
  const { db } = await setup();
  const transactions = db.runTransaction.bind(db), batches = [];
  let historyReads = 0;
  db.runTransaction = work => transactions(tx => work({
    ...tx,
    getAll: (...refs) => { batches.push(refs.map(ref => ref.path)); return tx.getAll(...refs); },
    get: ref => { if (!ref.path) historyReads++; return tx.get(ref); },
  }));
  const handler = createOrderHandler({ getDb: () => db, env, schedule: () => {} });
  const place = async () => { const res = response(); await handler({ method: "POST", headers, body: body() }, res); return res; };
  await db.collection("inventory").doc("serum").set({ quantity: null, version: 1 });
  assert.equal((await place()).statusCode, 201);
  assert.equal(historyReads, 0);
  assert.ok(batches.some(paths => paths.includes("products/serum") && paths.includes("inventory/serum")));
  assert.equal((await db.collection("inventory").doc("serum").get()).data().version, 2);
  await db.collection("inventory").doc("serum").set({ quantity: 3, version: 2 });
  assert.equal((await place()).statusCode, 409);
  assert.equal(historyReads, 1, "finite stock still checks prior pending orders before accepting");
  assert.equal((await db.collection("orders").get()).docs.length, 1);
});

test("recent bounce summary returns a single entry per checked order and history caps events", async () => {
  const db = memoryDb();
  const id = randomUUID();
  const ref = db.collection("orders").doc(id);
  await ref.set({ code: "OW_TEST", createdAt: new Date() });
  for (let i = 0; i < 55; i++) {
    await ref.collection("mailEvents").doc(`event-${i}`).set({
      text: "Private content", createdAt: new Date(1000 + i),
      outlook: i < 2 ? { state: "bounced" } : { state: "submitted" },
    });
  }
  const summary = await admin(db)(null, { query: { mailBounceSummary: "1" } });
  assert.deepEqual(summary.body, { bounced: [{ orderId: id, orderCode: "OW_TEST" }], scannedOrders: 1 });
  const history = await admin(db)(null, { query: { mailHistory: "1" } });
  assert.equal(history.body.mails.length, 50);
  assert.equal(history.body.mails[0].id, `${id}/event-54`);
});

test("order creation rate limits by IP (8/min) and recipient email (5/day) with Retry-After", async () => {
  const { db } = await setup();
  const handler = createOrderHandler({
    getDb: () => db,
    env: { ...env, CHAT_RATE_LIMIT_SALT: "test-salt" },
    now: () => 1700000000000,
    schedule: () => {},
  });
  const place = async (ip, email) => {
    const res = response();
    await handler({ method: "POST", headers: { ...headers, "x-forwarded-for": ip }, body: { ...body(), email } }, res);
    return res;
  };
  for (let i = 0; i < 8; i++) assert.equal((await place("198.51.100.1", `ip-${i}@example.com`)).statusCode, 201);
  const ipBlocked = await place("198.51.100.1", "ip-8@example.com");
  assert.equal(ipBlocked.statusCode, 429);
  assert.ok(Number(ipBlocked.headers["Retry-After"]) > 0);
  for (let i = 0; i < 5; i++) assert.equal((await place(`203.0.113.${i + 1}`, "target@example.com")).statusCode, 201);
  const emailBlocked = await place("203.0.113.6", "target@example.com");
  assert.equal(emailBlocked.statusCode, 429);
  assert.ok(Number(emailBlocked.headers["Retry-After"]) > 0);
});

test("replaying the same requestId after timeout returns 201 without consuming rate-limit budget", async () => {
  const { db } = await setup();
  const handler = createOrderHandler({
    getDb: () => db,
    env: { ...env, CHAT_RATE_LIMIT_SALT: "test-salt" },
    now: () => 1700000000000,
    schedule: () => {},
  });
  const payload = body();
  let code;
  for (let i = 0; i < 10; i++) {
    const res = response();
    await handler({ method: "POST", headers: { ...headers, "x-forwarded-for": "198.51.100.77" }, body: payload }, res);
    assert.equal(res.statusCode, 201);
    if (!code) code = res.body.code;
    else assert.equal(res.body.code, code);
  }
  assert.equal((await db.collection("orders").get()).docs.length, 1);
});

test("inventory reserved counter avoids historical order scans on subsequent orders and decrements on cancel", async () => {
  const { db } = await setup();
  const transactions = db.runTransaction.bind(db);
  let historyReads = 0;
  db.runTransaction = work => transactions(tx => work({
    ...tx,
    get: ref => { if (!ref.path) historyReads++; return tx.get(ref); },
  }));
  await db.collection("inventory").doc("serum").set({ quantity: 10, reserved: 0, version: 1 });
  const handler = createOrderHandler({ getDb: () => db, env, schedule: () => {} });
  const place = async () => { const payload = body(); const res = response(); await handler({ method: "POST", headers, body: payload }, res); return { res, id: payload.requestId }; };
  const first = await place();
  assert.equal(first.res.statusCode, 201);
  assert.equal(historyReads, 0, "counter already initialized so no historical orders scan needed");
  assert.equal((await db.collection("inventory").doc("serum").get()).data().reserved, 2);
  const second = await place();
  assert.equal(second.res.statusCode, 201);
  assert.equal(historyReads, 0);
  assert.equal((await db.collection("inventory").doc("serum").get()).data().reserved, 4);
  const cancelRes = await admin(db)({ id: first.id, status: "cancelled" });
  assert.equal(cancelRes.statusCode, 200);
  assert.equal((await db.collection("inventory").doc("serum").get()).data().reserved, 2);
});

test("admin summary returns per-status counts, adminUsers requires enabled===true, and whoami scopes permissions", async () => {
  const { db, call } = await setup();
  const o1 = body(), o2 = body();
  assert.equal((await call(o1)).statusCode, 201);
  assert.equal((await call(o2)).statusCode, 201);
  assert.equal((await admin(db)({ id: o2.requestId, status: "cancelled" })).statusCode, 200);
  // Cancelled order cannot be marked paid later (e.g. from another stale admin tab).
  const latePaid = await admin(db)({ id: o2.requestId, paymentStatus: "paid" });
  assert.equal(latePaid.statusCode, 409);
  assert.equal((await db.collection("orders").doc(o2.requestId).get()).data().paymentStatus, "unpaid");

  const summary = await admin(db)(null, { query: { summary: "1" } });
  assert.equal(summary.statusCode, 200);
  assert.deepEqual(summary.body.counts, { all: 2, new: 1, confirmed: 0, shipping: 0, completed: 0, cancelled: 1 });

  await db.collection("adminUsers").doc("fs-admin").set({ enabled: true });
  await db.collection("adminUsers").doc("disabled-admin").set({ enabled: false });
  await db.collection("adminUsers").doc("legacy-active").set({ active: true });
  const makeHandler = (uid, customEnv = { NEWSLETTER_SITE_ORIGIN: env.NEWSLETTER_SITE_ORIGIN }) => createAdminOrdersHandler({
    getDb: () => db,
    verifyToken: async () => ({ uid, email: `${uid}@orora.example` }),
    env: customEnv,
  });
  const callGet = async (handler, query) => {
    const res = response();
    await handler({ method: "GET", headers: { ...headers, authorization: "Bearer token" }, query }, res);
    return res;
  };
  const enabledRes = await callGet(makeHandler("fs-admin"), { whoami: "1" });
  assert.equal(enabledRes.statusCode, 200);
  assert.deepEqual(enabledRes.body.permissions, { orders: true, newsletter: true, full: true });
  assert.equal((await callGet(makeHandler("disabled-admin"), { whoami: "1" })).statusCode, 403);
  assert.equal((await callGet(makeHandler("disabled-admin"), {})).statusCode, 403);
  assert.equal((await callGet(makeHandler("legacy-active"), { whoami: "1" })).statusCode, 403);

  // Scoped env UIDs: newsletter-only admin passes whoami with newsletter permission but is blocked from orders API.
  const splitEnv = { NEWSLETTER_SITE_ORIGIN: env.NEWSLETTER_SITE_ORIGIN, ORDER_ADMIN_UIDS: "orders-only", NEWSLETTER_ADMIN_UIDS: "mail-only" };
  const mailWho = await callGet(makeHandler("mail-only", splitEnv), { whoami: "1" });
  assert.equal(mailWho.statusCode, 200);
  assert.deepEqual(mailWho.body.permissions, { orders: false, newsletter: true, full: false });
  assert.equal((await callGet(makeHandler("mail-only", splitEnv), {})).statusCode, 403);
  const orderWho = await callGet(makeHandler("orders-only", splitEnv), { whoami: "1" });
  assert.equal(orderWho.statusCode, 200);
  assert.deepEqual(orderWho.body.permissions, { orders: true, newsletter: false, full: false });
});


