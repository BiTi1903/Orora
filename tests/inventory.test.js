import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createInventoryHandler } from "../server/inventory.js";
import { createOrderHandler, createAdminOrdersHandler } from "../server/orders.js";
import { memoryDb, response } from "./firestore-memory.js";
const env = { NEWSLETTER_ADMIN_UIDS: "owner", NEWSLETTER_SITE_ORIGIN: "https://orora.example" };
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, authorization: "Bearer test", "content-type": "application/json" };
const orderBody = (quantity = 2) => ({ requestId: randomUUID(), productId: "serum", quantity, name: "Buyer", email: "buyer@example.com", phone: "0900000000", address: "Test address in Vietnam", paymentMethod: "cod", consent: true });
async function setup(quantity = null) {
  const db = memoryDb(); await db.collection("products").doc("serum").set({ name: "Serum", price: "250.000đ", image: "Do not return", active: true });
  if (quantity !== null) await db.collection("inventory").doc("serum").set({ quantity, version: 1 });
  const common = { getDb: () => db, verifyToken: async () => ({ uid: "owner" }), env };
  const handlers = { inventory: createInventoryHandler(common), orders: createAdminOrdersHandler(common), place: createOrderHandler({ ...common, sendMail: async () => {} }) };
  const call = async (which, body, query, patch = {}) => { const res = response(); await handlers[which]({ method: body ? "POST" : "GET", headers, body, query, ...patch }, res); return res; };
  return { db, call };
}
const stock = async (db) => (await db.collection("inventory").doc("serum").get()).data();
test("inventory is private, lists only existing product identity and stock, and validates manual adjustments", async () => {
  const { db, call } = await setup();
  assert.equal((await call("inventory", null, null, { headers: {} })).statusCode, 401);
  const outsider = createInventoryHandler({ getDb: () => db, verifyToken: async () => ({ uid: "other" }), env }); const res = response(); await outsider({ method: "GET", headers }, res); assert.equal(res.statusCode, 403);
  const page = await call("inventory"); assert.deepEqual(page.body.items[0], { id: "serum", name: "Serum", quantity: null, version: 0, updatedAt: null });
  for (const quantity of [-1, 1.5, "10", 1000000001]) assert.equal((await call("inventory", { id: "serum", quantity, version: 0 })).statusCode, 400);
  assert.equal((await call("inventory", { id: "missing", quantity: 5, version: 0 })).statusCode, 404);
  assert.equal((await call("inventory", { id: "serum", quantity: 5, version: 0 }, null, { headers: { ...headers, origin: "https://evil.example" } })).statusCode, 403);
  const saved = await call("inventory", { id: "serum", quantity: 10, version: 0 }); assert.equal(saved.statusCode, 200); assert.equal(saved.body.item.quantity, 10);
  assert.equal((await call("inventory", { id: "serum", quantity: 100, version: 0 })).statusCode, 409); assert.equal((await stock(db)).quantity, 10);
  assert.equal((await db.collection("products").doc("serum").get()).data().price, "250.000đ");
});
test("new orders hold quantities, paid/completed updates deduct once, and stale stock edits cannot undo sales", async () => {
  const { db, call } = await setup(10); const data = orderBody(3);
  assert.equal((await call("place", data)).statusCode, 201); assert.equal((await stock(db)).quantity, 10);
  assert.equal((await call("inventory", null, { pending: "1" })).body.pending.serum, 3);
  assert.equal((await call("orders", { id: data.requestId, paymentStatus: "paid" })).statusCode, 200); assert.equal((await stock(db)).quantity, 7);
  assert.equal((await call("inventory", null, { pending: "1" })).body.pending.serum, 0);
  await call("orders", { id: data.requestId, status: "completed" }); await call("orders", { id: data.requestId, paymentStatus: "unpaid" }); await call("orders", { id: data.requestId, paymentStatus: "paid" });
  assert.equal((await stock(db)).quantity, 7); assert.equal((await db.collection("inventoryMovements").get()).docs.length, 1);
  assert.equal((await call("inventory", { id: "serum", quantity: 10, version: 1 })).statusCode, 409);
});
test("cancelled waiting orders release holds; concurrent orders cannot reserve the same last units", async () => {
  const { db, call } = await setup(3); const a = orderBody(2); const b = orderBody(2);
  const results = await Promise.all([call("place", a), call("place", b)]); assert.deepEqual(results.map((res) => res.statusCode).sort(), [201, 409]); assert.equal((await stock(db)).quantity, 3);
  const accepted = results[0].statusCode === 201 ? a : b;
  await call("orders", { id: accepted.requestId, status: "cancelled" }); assert.equal((await call("inventory", null, { pending: "1" })).body.pending.serum, 0);
  assert.equal((await call("place", orderBody(3))).statusCode, 201);
});
test("COD shipment deducts stock before payment; returns require explicit receipt and are idempotent", async () => {
  const { db, call } = await setup(10); const data = orderBody(2); await call("place", data);
  await call("orders", { id: data.requestId, status: "shipping" }); assert.equal((await stock(db)).quantity, 8);
  let order = (await db.collection("orders").doc(data.requestId).get()).data(); assert.equal(order.paymentStatus, "unpaid"); assert.equal(order.inventory.state, "deducted");
  assert.equal((await call("orders", { action: "restockOrder", id: data.requestId })).statusCode, 409);
  await call("orders", { id: data.requestId, status: "cancelled" }); assert.equal((await stock(db)).quantity, 8);
  await Promise.all([call("orders", { action: "restockOrder", id: data.requestId }), call("orders", { action: "restockOrder", id: data.requestId })]); assert.equal((await stock(db)).quantity, 10);
  order = (await db.collection("orders").doc(data.requestId).get()).data(); assert.equal(order.inventory.state, "restocked");
  assert.equal((await call("orders", { id: data.requestId, status: "confirmed" })).statusCode, 409);
});
test("unset stock allows collecting orders but cannot mark them shipped/paid until stock is counted", async () => {
  const { db, call } = await setup(); const data = orderBody(2); await call("place", data);
  assert.equal((await stock(db)).quantity, null); assert.equal((await call("inventory", null, { pending: "1" })).body.pending.serum, 2);
  assert.equal((await call("orders", { id: data.requestId, paymentStatus: "paid" })).statusCode, 409);
  assert.equal((await db.collection("orders").doc(data.requestId).get()).data().paymentStatus, "unpaid");
  await call("inventory", { id: "serum", quantity: 1, version: (await stock(db)).version });
  assert.equal((await call("orders", { id: data.requestId, status: "completed" })).statusCode, 409); assert.equal((await stock(db)).quantity, 1);
});
test("legacy paid orders are never retroactively deducted and pending counts paginate without customer data", async () => {
  const { db, call } = await setup(20);
  const id = randomUUID(); await db.collection("orders").doc(id).set({ code: "OLD", product: { id: "serum" }, quantity: 5, paymentStatus: "paid", status: "completed" });
  await call("orders", { id, paymentStatus: "paid" }); await call("orders", { id, paymentStatus: "unpaid" }); await call("orders", { id, paymentStatus: "paid" }); assert.equal((await stock(db)).quantity, 20);
  for (let i = 0; i < 105; i++) await db.collection("orders").doc(randomUUID()).set({ product: { id: "serum" }, quantity: 2, paymentStatus: "unpaid", status: "new", customer: { email: "PRIVATE" } });
  let cursor; let total = 0; let pages = 0;
  do { const res = await call("inventory", null, { pending: "1", ...(cursor ? { cursor } : {}) }); assert.equal(res.statusCode, 200); assert.ok(!JSON.stringify(res.body).includes("PRIVATE")); total += res.body.pending.serum || 0; cursor = res.body.nextCursor; pages++; } while (cursor);
  assert.equal(total, 210); assert.equal(pages, 2);
});
