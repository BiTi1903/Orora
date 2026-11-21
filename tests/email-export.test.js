import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { buildEmailExport, excelCells } from "../src/admin/email-export.js";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";
import { createAdminOrdersHandler } from "../server/orders.js";
import { memoryDb, response } from "./firestore-memory.js";
const env = { NEWSLETTER_ADMIN_UIDS: "owner", NEWSLETTER_SITE_ORIGIN: "https://orora.example" };
const headers = { authorization: "Bearer test", origin: env.NEWSLETTER_SITE_ORIGIN, "content-type": "application/json" };
function client(handler) { return async (body, query) => { const res = response(); await handler({ method: body ? "POST" : "GET", headers, body, query }, res); if (res.statusCode !== 200) throw new Error(res.body.message); return res.body; }; }
test("Excel sources fetch all contact, campaign/delivery and order history pages without changing records", async () => {
  const db = memoryDb(); const verifyToken = async () => ({ uid: "owner" });
  const request = client(createNewsletterAdminHandler({ getDb: () => db, verifyToken, env }));
  const orderRequest = client(createAdminOrdersHandler({ getDb: () => db, verifyToken, env }));
  for (let i = 0; i < 53; i++) await db.collection("newsletterSubscribers").doc(i.toString(16).padStart(64, "0")).set({ email: `person${i}@example.com`, status: "active", createdAt: new Date(i + 1), mailStatus: "accepted" });
  for (let i = 0; i < 52; i++) {
    const campaign = db.collection("newsletterCampaigns").doc(randomUUID());
    await campaign.set({ subject: `Subject ${i}`, text: "Frozen content", templateName: "Original template", templateRevision: 2, actorName: "Linh", createdAt: new Date(i + 1), secret: "NEVER-EXPORT" });
    for (let j = 0; j < (i === 0 ? 51 : 1); j++) await campaign.collection("deliveries").doc(j.toString(16).padStart(64, "0")).set({ email: `person${j}@example.com`, status: j ? "failed" : "accepted", outlook: { state: "sent_item" } });
  }
  for (let i = 0; i < 21; i++) {
    const order = db.collection("orders").doc(randomUUID()); await order.set({ code: `OR-${i}`, customer: { name: "Buyer" }, createdAt: new Date(i + 1) });
    await order.collection("mailEvents").doc("confirmation-auto").set({ recipient: "buyer@example.com", subject: "Receipt", text: "Old receipt content", templateName: "Receipt v1", templateRevision: 1, state: "accepted", manual: false, outlook: { state: "bounced", diagnosticCode: "5.1.1" }, createdAt: new Date(i + 1) });
  }
  const sources = { request, orderRequest };
  const contacts = await buildEmailExport("contacts", sources); assert.equal(contacts.rows.length, 53); assert.ok(contacts.rows.every((row) => row[2] === "Đã gửi đi"));
  const sent = await buildEmailExport("sent", sources); assert.equal(sent.rows.length, 102); assert.ok(sent.rows.every((row) => row[4] === "Original template" && row[6] === "Linh" && row[9] === "Đã gửi đi"));
  const orders = await buildEmailExport("orders", sources); assert.equal(orders.rows.length, 21); assert.ok(orders.rows.every((row) => row[12].includes("5.1.1")));
  assert.ok(!JSON.stringify(sent).includes("NEVER-EXPORT"));
  assert.equal((await db.collection("newsletterSubscribers").get()).docs.length, 53);
});
test("exports abort on missing pages, permission failures and repeated cursors instead of creating partial files", async () => {
  await assert.rejects(buildEmailExport("orders", { orderRequest: async () => { throw new Error("No order access"); } }), /No order access/);
  await assert.rejects(buildEmailExport("contacts", { request: async () => ({ contacts: [{ id: "1", email: "a@example.com" }], nextCursor: "same" }) }), /Không tải đủ/);
  await assert.rejects(buildEmailExport("contacts", { request: async () => ({}) }), /không đầy đủ/);
  await assert.rejects(buildEmailExport("invalid", {}), /Chọn danh sách/);
  const db = memoryDb(); const handler = createNewsletterAdminHandler({ getDb: () => db, verifyToken: async () => ({ uid: "outsider" }), env });
  await assert.rejects(client(handler)(null, { campaignHistory: "1" }), /chưa được cấp quyền/);
});
test("Excel cells preserve user input as strings, including formula-like text and Vietnamese", () => {
  const cells = excelCells({ headers: ["Nội dung"], rows: [["=HYPERLINK(\"example\")"], ["Chào bạn"], [undefined]] });
  assert.equal(cells[1][0].type, String); assert.equal(cells[1][0].value, '=HYPERLINK("example")'); assert.equal(cells[2][0].value, "Chào bạn"); assert.equal(cells[3][0].value, "");
});
