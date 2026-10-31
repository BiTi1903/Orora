import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createAdminOrdersHandler } from "../server/orders.js";
import { memoryDb, response } from "./firestore-memory.js";
const env = { NEWSLETTER_ADMIN_UIDS: "owner", NEWSLETTER_SITE_ORIGIN: "https://orora.example" };
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, authorization: "Bearer token", "content-type": "application/json" };
const record = (extra = {}) => ({ code: "OW_1234C", status: "new", paymentStatus: "unpaid", quantity: 2, customer: { name: "Buyer", email: "private@example.com" }, product: { id: "serum", name: "Serum" }, createdAt: new Date(1), requestHash: "PRIVATE-HASH", ...extra });
async function setup() {
  const db = memoryDb(); const user = { uid: "owner", name: "Linh", email: "linh@example.com" };
  const handler = createAdminOrdersHandler({ getDb: () => db, verifyToken: async () => user, env, clock: () => 1793404800000 });
  const call = async (body, query, patch = {}) => { const res = response(); await handler({ method: body ? "POST" : "GET", body, query, headers, ...patch }, res); return res; };
  const id = randomUUID(); await db.collection("orders").doc(id).set(record());
  await db.collection("inventory").doc("serum").set({ quantity: 10, version: 1 });
  return { db, user, id, call };
}
test("private order summary counts beyond the first page and returns no customer or request data", async () => {
  const { db, call } = await setup();
  for (let i = 1; i < 65; i++) await db.collection("orders").doc(randomUUID()).set(record({ createdAt: new Date(i + 1) }));
  const latest = randomUUID(); await db.collection("orders").doc(latest).set(record({ status: "confirmed", createdAt: new Date(1000) }));
  const summary = await call(null, { summary: "1" }); assert.equal(summary.statusCode, 200); assert.equal(summary.body.pendingCount, 65); assert.equal(summary.body.latestOrder.id, latest);
  assert.equal((await call()).body.orders.length, 50);
  for (const value of ["private@example.com", "Buyer", "PRIVATE-HASH", "quantity", "product"]) assert.ok(!JSON.stringify(summary.body).includes(value));
  assert.equal(summary.headers["Cache-Control"], "no-store");
  assert.equal((await call(null, { summary: "1" }, { headers: {} })).statusCode, 401);
  let openedDb = false; const outsider = createAdminOrdersHandler({ getDb: () => { openedDb = true; return db; }, verifyToken: async () => ({ uid: "other" }), env });
  const denied = response(); await outsider({ method: "GET", headers, query: { summary: "1" } }, denied); assert.equal(denied.statusCode, 403); assert.equal(openedDb, false);
});
test("audit snapshots the verified actor and real field changes with stock deduction; retries/no-ops add no duplicate event", async () => {
  const { db, user, id, call } = await setup();
  const changed = await call({ id, status: "completed", actor: "spoof", actorName: "Forged", actorEmail: "evil@example.com" }); assert.equal(changed.statusCode, 200);
  assert.deepEqual(changed.body.activity.changes, { status: { before: "new", after: "completed" }, paymentStatus: { before: "unpaid", after: "paid" }, inventory: { before: "", after: "deducted" } });
  assert.equal(changed.body.activity.actorName, "Linh"); assert.equal(changed.body.activity.actor, "owner"); assert.equal(changed.body.activity.actorEmail, "linh@example.com");
  assert.equal((await db.collection("inventory").doc("serum").get()).data().quantity, 8);
  user.name = "New profile name";
  const detail = await call(null, { id }); assert.equal(detail.body.activities[0].actorName, "Linh"); assert.equal(detail.body.activities[0].createdAt, 1793404800000); assert.ok(!Object.hasOwn(detail.body.order, "requestHash"));
  const retry = await call({ id, status: "completed" }); assert.equal(retry.body.activity, null); assert.equal((await call(null, { id })).body.activities.length, 1);
  await call({ id, status: "cancelled" }); const returned = await call({ id, action: "restockOrder" });
  assert.equal(returned.body.activity.action, "stock_returned"); assert.equal(returned.body.activity.quantity, 2); assert.deepEqual(returned.body.activity.changes.inventory, { before: "deducted", after: "restocked" });
  assert.equal((await call({ id, action: "restockOrder" })).body.activity, null);
  assert.equal((await db.collection("inventory").doc("serum").get()).data().quantity, 10);
  assert.equal((await call({ id, status: "confirmed" })).statusCode, 409); assert.equal((await call(null, { id })).body.activities.length, 3);
});
test("rejected operations and failed audit writes cannot commit payment or stock changes", async () => {
  const { db, id, call } = await setup();
  await db.collection("inventory").doc("serum").set({ quantity: 1, version: 1 });
  assert.equal((await call({ id, paymentStatus: "paid" })).statusCode, 409); assert.equal((await call(null, { id })).body.activities.length, 0);
  await db.collection("inventory").doc("serum").set({ quantity: 10, version: 2 });
  const run = db.runTransaction;
  db.runTransaction = (work) => run((tx) => work({ ...tx, set: (ref, ...args) => { if (ref.path.includes("/activityEvents/")) throw Error("storage failure"); tx.set(ref, ...args); } }));
  assert.equal((await call({ id, paymentStatus: "paid" })).statusCode, 503);
  assert.equal((await db.collection("inventory").doc("serum").get()).data().quantity, 10);
  assert.equal((await db.collection("orders").doc(id).get()).data().paymentStatus, "unpaid");
  assert.equal((await call(null, { id })).body.activities.length, 0);
});
test("old orders have no invented log and activity pagination keeps every event even with equal timestamps", async () => {
  const { id, call } = await setup(); assert.deepEqual((await call(null, { id })).body.activities, []);
  for (let i = 0; i < 35; i++) assert.equal((await call({ id, status: i % 2 ? "new" : "confirmed" })).statusCode, 200);
  const first = await call(null, { id }); assert.equal(first.body.activities.length, 30);
  const second = await call(null, { id, activityCursor: first.body.nextActivityCursor }); assert.equal(second.body.activities.length, 5); assert.equal(second.body.nextActivityCursor, null);
  assert.equal(new Set([...first.body.activities, ...second.body.activities].map((item) => item.id)).size, 35);
  assert.equal((await call(null, { id, activityCursor: randomUUID() })).statusCode, 400);
  assert.equal((await call(null, { id, activityCursor: "bad" })).statusCode, 400);
  assert.equal((await call(null, { id: randomUUID() })).statusCode, 404);
});
