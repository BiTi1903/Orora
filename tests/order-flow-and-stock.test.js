import test from "node:test";
import assert from "node:assert/strict";
import { memoryDb } from "./firestore-memory.js";
import { createOrderHandler, createAdminOrdersHandler } from "../server/orders.js";
import { createInventoryHandler } from "../server/inventory.js";
import { NEXT_ORDER_STATUSES } from "../src/lib/order-flow.js";
import { receiptLines } from "../src/lib/order-receipt.js";

const ORIGIN = "https://ororavn.com";
const ENV = {
  NEWSLETTER_SITE_ORIGIN: ORIGIN,
  ORDER_ADMIN_UIDS: "admin-1",
  ORDER_TRACKING_SECRET: "a".repeat(64),
  RATE_LIMIT_SECRET: "b".repeat(64),
};

function makeReq({ method = "POST", body, query = {}, auth = true } = {}) {
  const headers = { origin: ORIGIN };
  if (body !== undefined) {
    headers["content-type"] = "application/json";
    headers["content-length"] = String(Buffer.byteLength(JSON.stringify(body)));
  }
  if (auth) headers.authorization = "Bearer valid-token";
  return { method, headers, body, query, socket: { remoteAddress: "127.0.0.1" } };
}

function makeRes() {
  const out = { statusCode: 200, headers: {}, body: null };
  out.setHeader = (k, v) => { out.headers[k] = v; };
  out.status = (code) => { out.statusCode = code; return out; };
  out.json = (data) => { out.body = data; return out; };
  return out;
}

const verifyToken = async () => ({ uid: "admin-1", email: "admin@ororavn.com" });

async function seedOrderEnv() {
  const db = memoryDb();
  await db.collection("products").doc("p1").set({ name: "Gel", price: "200.000 đ", active: true });
  await db.collection("products").doc("p2").set({ name: "Mist", price: "300.000 đ", active: true });
  await db.collection("inventory").doc("p1").set({ quantity: 10, reserved: 0, version: 1 });
  await db.collection("inventory").doc("p2").set({ quantity: 2, reserved: 0, version: 1 });
  await db.collection("settings").doc("home").set({ paymentMethods: { cod: true, bank_transfer: true }, shippingSettings: { enabled: false } });
  const placeHandler = createOrderHandler({
    getDb: async () => db,
    sendMail: async () => ({ trackingId: "t1", transport: "smtp" }),
    schedule: () => {},
    env: ENV,
  });
  const adminOrdersHandler = createAdminOrdersHandler({
    getDb: async () => db,
    verifyToken,
    sendMail: async () => ({ trackingId: "t1", transport: "smtp" }),
    env: ENV,
  });
  const inventoryHandler = createInventoryHandler({ getDb: async () => db, verifyToken, env: ENV });
  return { db, placeHandler, adminOrdersHandler, inventoryHandler };
}

test("order state machine allows new->shipping and completed->cancelled, and blocks paymentStatus on cancelled orders", async () => {
  assert.ok(NEXT_ORDER_STATUSES.new.includes("shipping"));
  assert.ok(NEXT_ORDER_STATUSES.completed.includes("cancelled"));

  const { db, placeHandler, adminOrdersHandler } = await seedOrderEnv();
  const id1 = "11111111-1111-4111-8111-111111111111";
  const createRes = makeRes();
  await placeHandler(makeReq({
    auth: false,
    body: {
      requestId: id1, productId: "p1", quantity: 2,
      name: "Nguyen A", phone: "0901234567", email: "a@example.com",
      address: "123 Le Loi, TP.HCM",
      paymentMethod: "cod", consent: true,
    },
  }), createRes);
  assert.equal(createRes.statusCode, 201);
  assert.equal((await db.collection("inventory").doc("p1").get()).data().reserved, 2);

  // Cancel unpaid order -> releases reserved
  const cancelRes = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: id1, status: "cancelled" } }), cancelRes);
  assert.equal(cancelRes.statusCode, 200);
  assert.equal((await db.collection("inventory").doc("p1").get()).data().reserved, 0);

  // Attempt to mark cancelled order as paid -> 409
  const payCancelled = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: id1, paymentStatus: "paid" } }), payCancelled);
  assert.equal(payCancelled.statusCode, 409);

  // Attempt to send both status: "cancelled" and paymentStatus: "paid" -> 409
  const payCancelledBoth = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: id1, status: "cancelled", paymentStatus: "paid" } }), payCancelledBoth);
  assert.equal(payCancelledBoth.statusCode, 409);
  assert.equal((await db.collection("orders").doc(id1).get()).data().paymentStatus, "unpaid");

  // Second order: new -> shipping directly (deducts stock, clears reserved) -> completed -> cancelled -> restock
  const id2 = "22222222-2222-4222-8222-222222222222";
  const create2 = makeRes();
  await placeHandler(makeReq({
    auth: false,
    body: {
      requestId: id2, productId: "p1", quantity: 3,
      name: "Nguyen B", phone: "0909876543", email: "b@example.com",
      address: "456 Nguyen Hue, TP.HCM",
      paymentMethod: "cod", consent: true,
    },
  }), create2);
  assert.equal(create2.statusCode, 201);
  assert.equal((await db.collection("inventory").doc("p1").get()).data().reserved, 3);

  const shipRes = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: id2, status: "shipping" } }), shipRes);
  assert.equal(shipRes.statusCode, 200);
  let stock = (await db.collection("inventory").doc("p1").get()).data();
  assert.equal(stock.quantity, 7);
  assert.equal(stock.reserved, 0);

  const completeRes = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: id2, status: "completed" } }), completeRes);
  assert.equal(completeRes.statusCode, 200);

  // Return flow: completed -> cancelled -> restockOrder
  const cancelCompleted = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: id2, status: "cancelled" } }), cancelCompleted);
  assert.equal(cancelCompleted.statusCode, 200);

  const restockRes = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { action: "restockOrder", id: id2 } }), restockRes);
  assert.equal(restockRes.statusCode, 200);
  stock = (await db.collection("inventory").doc("p1").get()).data();
  assert.equal(stock.quantity, 10);
  assert.equal(stock.reserved, 0);
});

test("GET /api/inventory?lowStock=1 returns only low-stock counted products in a single request", async () => {
  const { inventoryHandler } = await seedOrderEnv();
  const res = makeRes();
  await inventoryHandler(makeReq({ method: "GET", query: { lowStock: "1" } }), res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body.items, [{ id: "p2", name: "Mist", quantity: 2 }]);
});

test("receiptLines includes order date, payment status, and support contact", () => {
  const lines = receiptLines(
    {
      code: "OR-001",
      createdAt: "2026-11-19T10:00:00.000Z",
      productName: "Gel",
      quantity: 1,
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      subtotal: 200000,
      shippingFee: 20000,
      totalAmount: 220000,
      recipient: { name: "An", phone: "0901234567", address: "TP.HCM" },
    },
    { footerPhone: "0900112233" },
  );
  assert.ok(lines.some((line) => line.startsWith("Ngày đặt:")));
  assert.ok(lines.some((line) => line === "Tình trạng: Chưa thanh toán"));
  assert.ok(lines.some((line) => line === "Liên hệ ORORA: 0900112233"));
});

test("GET /api/admin-orders supports server-side status filter and direct code/phone/email lookup", async () => {
  const { placeHandler, adminOrdersHandler } = await seedOrderEnv();
  const idA = crypto.randomUUID();
  const resA = makeRes();
  await placeHandler(makeReq({
    auth: false,
    body: {
      requestId: idA, productId: "p1", quantity: 1,
      name: "Khach A", phone: "0912345678", email: "khacha@example.com",
      address: "123 Duong A, Quan 1, TP.HCM", paymentMethod: "cod", consent: true,
    },
  }), resA);
  assert.equal(resA.statusCode, 201);
  const codeA = resA.body.code;

  const idB = crypto.randomUUID();
  const resB = makeRes();
  await placeHandler(makeReq({
    auth: false,
    body: {
      requestId: idB, productId: "p1", quantity: 1,
      name: "Khach B", phone: "0987654321", email: "khachb@example.com",
      address: "456 Duong B, Quan 3, TP.HCM", paymentMethod: "cod", consent: true,
    },
  }), resB);
  assert.equal(resB.statusCode, 201);

  await adminOrdersHandler(makeReq({ method: "POST", body: { id: idB, status: "shipping" } }), makeRes());

  const shippingRes = makeRes();
  await adminOrdersHandler(makeReq({ method: "GET", query: { status: "shipping" } }), shippingRes);
  assert.equal(shippingRes.statusCode, 200);
  assert.deepEqual(shippingRes.body.orders.map((o) => o.id), [idB]);

  const byCode = makeRes();
  await adminOrdersHandler(makeReq({ method: "GET", query: { q: codeA.toLowerCase() } }), byCode);
  assert.equal(byCode.statusCode, 200);
  assert.deepEqual(byCode.body.orders.map((o) => o.id), [idA]);

  const byPhone = makeRes();
  await adminOrdersHandler(makeReq({ method: "GET", query: { q: "0987 654 321" } }), byPhone);
  assert.equal(byPhone.statusCode, 200);
  assert.deepEqual(byPhone.body.orders.map((o) => o.id), [idB]);

  const byEmail = makeRes();
  await adminOrdersHandler(makeReq({ method: "GET", query: { q: "KHACHA@example.com" } }), byEmail);
  assert.equal(byEmail.statusCode, 200);
  assert.deepEqual(byEmail.body.orders.map((o) => o.id), [idA]);
});

test("multi-item reserved fallback, first stock sync, multi-item deduction quantity, and GET /api/inventory reserved", async () => {
  const { db, placeHandler, adminOrdersHandler, inventoryHandler } = await seedOrderEnv();
  // Remove reserved field on p2 and add p3 uncounted to simulate legacy/first-time stock entry
  await db.collection("products").doc("p3").set({ name: "Cream", active: true, price: "300000" });
  await db.collection("inventory").doc("p2").set({ quantity: 5, version: 1 });

  // Place a multi-item order containing p3 (2) and p2 (1) while p3 is uncounted and p2 has no reserved field
  const multiId = crypto.randomUUID();
  const multiRes = makeRes();
  await placeHandler(makeReq({
    auth: false,
    body: {
      requestId: multiId,
      items: [{ productId: "p3", quantity: 2 }, { productId: "p2", quantity: 1 }],
      name: "Khach Multi", phone: "0905556666", email: "multi@example.com",
      address: "10 Le Loi, Quan 1, TP.HCM", paymentMethod: "cod", consent: true,
    },
  }), multiRes);
  assert.equal(multiRes.statusCode, 201);
  // p2 reserved must be 1 (only p2's item quantity, not total order quantity 3)
  assert.equal((await db.collection("inventory").doc("p2").get()).data().reserved, 1);

  // Admin enters stock for p3 for the first time -> reserved must sync to 2
  const p3Stock = (await db.collection("inventory").doc("p3").get()).data();
  const adjustRes = makeRes();
  await inventoryHandler(makeReq({ method: "POST", body: { id: "p3", quantity: 10, version: p3Stock?.version || 0 } }), adjustRes);
  assert.equal(adjustRes.statusCode, 200);
  assert.equal(adjustRes.body.item.reserved, 2);

  // GET /api/inventory returns reserved for each product
  const listRes = makeRes();
  await inventoryHandler(makeReq({ method: "GET" }), listRes);
  assert.equal(listRes.statusCode, 200);
  const p3Item = listRes.body.items.find((item) => item.id === "p3");
  assert.equal(p3Item.reserved, 2);

  // Shipping multi-item order records total deducted quantity (3) in inventory snapshot
  const shipRes = makeRes();
  await adminOrdersHandler(makeReq({ method: "POST", body: { id: multiId, status: "shipping" } }), shipRes);
  assert.equal(shipRes.statusCode, 200);
  assert.equal(shipRes.body.inventory.quantity, 3);
  assert.equal((await db.collection("inventory").doc("p3").get()).data().quantity, 8);
  assert.equal((await db.collection("inventory").doc("p3").get()).data().reserved, 0);
});

test("order mail templates accept {{trackingUrl}} and {{total}} tokens", async () => {
  const { validateOrderTemplate, renderOrderMessage } = await import("../server/order-mail.js");
  const template = validateOrderTemplate({
    subject: "Đơn {{orderCode}} - {{total}}",
    text: "Tra cứu đơn tại: {{trackingUrl}}\nTổng: {{total}}",
  });
  const rendered = renderOrderMessage(template, {
    code: "OW_999C",
    customer: { name: "An", phone: "0901234567", email: "an@example.com", address: "HCM" },
    product: { name: "Gel" },
    quantity: 1,
    subtotal: 200000,
    shippingFee: 20000,
    totalAmount: 220000,
    paymentMethod: "cod",
  }, { NEWSLETTER_SITE_ORIGIN: "https://ororavn.com" });
  assert.ok(rendered.subject.includes("220.000"));
  assert.ok(rendered.text.includes("https://ororavn.com/tra-cuu-don-hang"));
});


