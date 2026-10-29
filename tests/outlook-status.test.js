import test from "node:test";
import assert from "node:assert/strict";
import { createOutlookStatusReader, syncOutlookStatus } from "../server/outlook-status.js";
import { memoryDb } from "./firestore-memory.js";
const env = { MS_TENANT_ID: "tenant", MS_CLIENT_ID: "client", MS_CLIENT_SECRET: "secret", MS_SENDER_EMAIL: "sales@example.com" };
const record = { trackingId: "test-tracking-id", transport: "smtp", internetMessageId: "<uuid@example.com>", recipient: "buyer@example.com", createdAt: new Date() };
const ok = (data) => ({ ok: true, status: 200, json: async () => data });
function fixture({ sent = true, reports = [], denied = false, nextLink } = {}) {
  const calls = [];
  const reader = createOutlookStatusReader(env, async (url, options) => {
    calls.push({ url, method: options.method || "GET" });
    if (url.includes("login.microsoftonline.com")) return ok({ access_token: "test-token", expires_in: 3600 });
    if (denied) return { ok: false, status: 403 };
    if (url.includes("/sentitems/")) return ok({ value: sent ? [{ internetMessageId: record.internetMessageId, toRecipients: [{ emailAddress: { address: record.recipient } }], webLink: "https://outlook.office365.com/owa/test" }] : [] });
    return ok({ value: reports, ...(nextLink ? { "@odata.nextLink": nextLink } : {}) });
  });
  return { reader, calls };
}
const ndr = (body) => ({ body: { contentType: "text", content: body }, singleValueExtendedProperties: [{ id: "String 0x001A", value: "REPORT.IPM.Note.NDR" }], webLink: "https://outlook.office365.com/owa/ndr" });

test("an exact NDR overrides sent-items acceptance; matching only subject/recipient is not enough", async () => {
  const failed = await fixture({ reports: [ndr(`buyer@example.com: 550 5.7.708 Original Message-ID: ${record.internetMessageId}`)] }).reader(record);
  assert.equal(failed.state, "bounced"); assert.equal(failed.diagnosticCode, "5.7.708");
  const other = await fixture({ reports: [ndr("buyer@example.com: 550 5.7.708 Original Message-ID: <another@example.com>")] }).reader(record);
  assert.equal(other.state, "sent_item"); assert.notEqual(other.state, "delivered");
  const wrongRecipient = await fixture({ reports: [ndr(`other@example.com: 5.7.708 ${record.internetMessageId}`)] }).reader(record);
  assert.equal(wrongRecipient.state, "sent_item");
});
test("HTML NDRs, delayed reports, missing sent copies and old untracked mail are conservatively distinguished", async () => {
  const html = await fixture({ sent: false, reports: [ndr(`buyer@example.com 4.4.7 &lt;uuid@example.com&gt;`)] }).reader(record);
  assert.equal(html.state, "delayed");
  const absent = await fixture({ sent: false }).reader(record); assert.equal(absent.state, "not_found");
  const legacy = fixture(); assert.equal((await legacy.reader({ recipient: record.recipient })).state, "untracked"); assert.equal(legacy.calls.length, 0);
});
test("read permission failures never change previously saved status; polling is cached and bounce evidence is retained", async () => {
  const db = memoryDb(); const ref = db.collection("orders").doc("order").collection("mailEvents").doc("event");
  const previous = { trackingKey: record.trackingId, state: "bounced", checkedAt: new Date(Date.now() - 120000).toISOString(), diagnosticCode: "5.7.708" };
  await ref.set({ ...record, state: "accepted", outlook: previous });
  await assert.rejects(syncOutlookStatus(ref, fixture({ denied: true }).reader), /outlook_permission_missing/);
  assert.deepEqual((await ref.get()).data().outlook, previous);
  const updated = await syncOutlookStatus(ref, fixture().reader); assert.equal(updated.state, "bounced");
  let count = 0; await syncOutlookStatus(ref, async () => { count++; return {}; }); assert.equal(count, 0);
  assert.equal((await ref.get()).data().state, "accepted");
});
test("Graph tracking headers match exact sent items and external nextLinks never receive an access token", async () => {
  const requests = [];
  const reader = createOutlookStatusReader(env, async (url) => {
    requests.push(url);
    if (url.includes("login.microsoftonline.com")) return ok({ access_token: "token" });
    if (url.includes("sentitems")) return ok({ value: [{ internetMessageId: "<graph-id@example.com>", internetMessageHeaders: [{ name: "x-orora-mail-id", value: record.trackingId }], toRecipients: [{ emailAddress: { address: record.recipient } }] }] });
    return ok({ value: [ndr(`buyer@example.com 5.7.708 <graph-id@example.com>`)] });
  });
  assert.equal((await reader({ ...record, transport: "graph" })).state, "bounced");
  const unsafe = fixture({ reports: [], nextLink: "https://attacker.example/steal-token" });
  await assert.rejects(unsafe.reader(record), /outlook_unavailable/);
  assert.ok(unsafe.calls.every((call) => !call.url.includes("attacker.example")));
  assert.ok(requests.every((url) => !url.includes("sendMail")));
});

test("a new welcome message never inherits the previous message's bounce or cache", async () => {
  const db = memoryDb(); const ref = db.collection("newsletterSubscribers").doc("person");
  await ref.set({ outlook: { state: "bounced", trackingKey: "old-message", checkedAt: new Date().toISOString() } });
  let checks = 0;
  const result = await syncOutlookStatus(ref, async () => { checks++; return { state: "sent_item", checkedAt: new Date().toISOString() }; }, { trackingId: "new-message", recipient: "buyer@example.com" });
  assert.equal(checks, 1); assert.equal(result.state, "sent_item"); assert.equal(result.trackingKey, "new-message");
});
