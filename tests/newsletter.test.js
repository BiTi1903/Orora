import test from "node:test";
import assert from "node:assert/strict";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";
import { createSubscribeHandler } from "../server/newsletter.js";
import { createUnsubscribeHandler } from "../server/unsubscribe.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { sendWelcomeMessage, subscriberId, unsubscribeLink } from "../server/newsletter-content.js";
import { memoryDb, response } from "./firestore-memory.js";

const env = {
  NEWSLETTER_SITE_ORIGIN: "https://orora.example",
  NEWSLETTER_ADMIN_UIDS: "owner-uid",
  NEWSLETTER_UNSUBSCRIBE_SECRET: "test-only-signing-secret-at-least-32-characters",
  MS_TENANT_ID: "test-tenant", MS_CLIENT_ID: "test-client", MS_CLIENT_SECRET: "test-secret",
};
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, authorization: "Bearer test-token", "content-type": "application/json" };
const message = { subject: "Ưu đãi ORORA", text: "Chào bạn! Khám phá sản phẩm mới." };
const person = (email) => ({ email, status: "active", consentAt: new Date(1000), createdAt: new Date(1000) });

function admin(db, overrides = {}) {
  const sent = [];
  const handler = createNewsletterAdminHandler({
    getDb: async () => db, verifyToken: async () => ({ uid: "owner-uid", email: "owner@example.com" }),
    sendMail: async (...args) => { sent.push(args); }, env, ...overrides,
  });
  return { sent, call: async (body, request = {}) => {
    const res = response(); await handler({ method: "POST", headers, body, ...request }, res); return res;
  } };
}

async function seed(db, count) {
  for (let i = 0; i < count; i++) {
    const email = `customer${i}@example.com`;
    await db.collection("newsletterSubscribers").doc(subscriberId(email)).set(person(email));
  }
}

test("admin API rejects missing token and non-admin user before accessing data", async () => {
  const db = memoryDb();
  assert.equal((await admin(db).call({}, { headers: {} })).statusCode, 401);
  const other = admin(db, { verifyToken: async () => ({ uid: "another-user" }) });
  assert.equal((await other.call({ action: "createCampaign", id: "x", ...message })).statusCode, 403);
  assert.equal((await admin(db).call({}, { headers: { ...headers, origin: "https://evil.example" } })).statusCode, 403);
});

test("campaign creation is idempotent; resumes in batches and never resends a completed campaign", async () => {
  const db = memoryDb(); await seed(db, 5); const { call, sent } = admin(db);
  const body = { action: "createCampaign", id: "campaign-1", ...message };
  assert.equal((await call(body)).statusCode, 200); assert.equal((await call(body)).statusCode, 200);
  assert.equal(sent.length, 0);
  assert.equal((await call({ ...body, text: "Other content" })).statusCode, 409);
  let result = await call({ action: "sendBatch", id: body.id });
  assert.equal(result.body.completed, false); assert.equal(sent.length, 2);
  for (let i = 0; i < 4 && !result.body.completed; i++) result = await call({ action: "sendBatch", id: body.id });
  assert.equal(result.body.completed, true); assert.equal(result.body.campaign.accepted, 5);
  await call({ action: "sendBatch", id: body.id });
  assert.equal(new Set(sent.map(([email]) => email)).size, 5); assert.equal(sent.length, 5);
  assert.equal(sent[0][1].text, message.text);
});

test("unsubscribed recipients and contacts who consent after creation are excluded", async () => {
  const db = memoryDb(); const { call, sent } = admin(db); await seed(db, 1);
  await call({ action: "createCampaign", id: "campaign", ...message });
  const original = db.collection("newsletterSubscribers").doc(subscriberId("customer0@example.com"));
  await original.set({ status: "unsubscribed" }, { merge: true });
  await db.collection("newsletterSubscribers").doc(subscriberId("new@example.com")).set({ ...person("new@example.com"), consentAt: new Date(Date.now() + 10000) });
  const result = await call({ action: "sendBatch", id: "campaign" });
  assert.equal(result.body.completed, true); assert.equal(sent.length, 0);
});

test("known send failure pauses batch; retry does not resend failed or ambiguous deliveries", async () => {
  const db = memoryDb(); await seed(db, 3); let attempts = 0;
  const { call } = admin(db, { sendMail: async () => {
    attempts++; if (attempts === 1) throw new Error("mail_send_failed");
    if (attempts === 2) throw new Error("timeout_after_acceptance");
  } });
  await call({ action: "createCampaign", id: "campaign", ...message });
  const first = await call({ action: "sendBatch", id: "campaign" });
  assert.equal(first.body.paused, true); assert.equal(first.body.campaign.failed, 1);
  const second = await call({ action: "sendBatch", id: "campaign" });
  assert.equal(second.body.campaign.unknown, 1);
  const third = await call({ action: "sendBatch", id: "campaign" });
  assert.equal(third.body.completed, true); assert.equal(attempts, 3);
  assert.equal(third.body.campaign.accepted, 1);
});

test("concurrent requests cannot send the same campaign twice", async () => {
  const db = memoryDb(); await seed(db, 1); let release; let started;
  const startedPromise = new Promise((resolve) => { started = resolve; });
  const { call } = admin(db, { sendMail: async () => { started(); await new Promise((resolve) => { release = resolve; }); } });
  await call({ action: "createCampaign", id: "campaign", ...message });
  const running = call({ action: "sendBatch", id: "campaign" }); await startedPromise;
  assert.equal((await call({ action: "sendBatch", id: "campaign" })).statusCode, 409);
  release(); assert.equal((await running).body.campaign.accepted, 1);
});

test("a delivery reserved before a crash is marked unknown and never sent again", async () => {
  const db = memoryDb(); await seed(db, 1); const { call, sent } = admin(db);
  await call({ action: "createCampaign", id: "campaign", ...message });
  await db.collection("newsletterCampaigns").doc("campaign").collection("deliveries").doc(subscriberId("customer0@example.com")).set({ status: "sending" });
  const result = await call({ action: "sendBatch", id: "campaign" });
  assert.equal(result.body.campaign.unknown, 1); assert.equal(sent.length, 0);
});

test("welcome template is sent exactly as saved without appended footer", async () => {
  const db = memoryDb(); const { call } = admin(db); let received;
  assert.equal((await call({ action: "saveWelcome", ...message })).statusCode, 200);
  await sendWelcomeMessage("a@example.com", { getDb: async () => db, env, sendMail: async (email, text) => { received = { email, text }; } });
  assert.deepEqual(received.text, message);
  assert.equal((await call({ action: "saveWelcome", subject: "\n", text: "" })).statusCode, 400);
});

test("unsubscribe GET requires confirmation; POST disables contact; tampered signature is rejected", async () => {
  const db = memoryDb(); const id = subscriberId("customer@example.com");
  const ref = db.collection("newsletterSubscribers").doc(id); await ref.set(person("customer@example.com"));
  const url = new URL(unsubscribeLink(id, env)); const query = Object.fromEntries(url.searchParams);
  const handler = createUnsubscribeHandler({ getDb: async () => db, env });
  const get = response(); await handler({ method: "GET", query }, get);
  assert.equal(get.statusCode, 200); assert.equal((await ref.get()).data().status, "active");
  const bad = response(); await handler({ method: "POST", query: { ...query, token: "0".repeat(64) } }, bad); assert.equal(bad.statusCode, 400);
  const post = response(); await handler({ method: "POST", query }, post);
  assert.equal(post.statusCode, 200); assert.equal((await ref.get()).data().status, "unsubscribed");
});

test("subscription stores consent, deduplicates welcome delivery and validates consent/origin", async () => {
  const db = memoryDb(); let sent = 0;
  const handler = createSubscribeHandler({ getDb: async () => db, sendWelcome: async () => { sent++; }, env });
  const req = { method: "POST", headers, body: { email: " CUSTOMER@example.com ", consent: true }, socket: { remoteAddress: "127.0.0.1" } };
  const one = response(); await handler(req, one); assert.equal(one.statusCode, 200);
  const saved = (await db.collection("newsletterSubscribers").doc(subscriberId("customer@example.com")).get()).data();
  assert.equal(saved.status, "active"); assert.equal(saved.consentVersion, "newsletter-v1");
  const two = response(); await handler(req, two); assert.equal(two.statusCode, 200); assert.equal(sent, 1);
  const noConsent = response(); await handler({ ...req, body: { email: "other@example.com" } }, noConsent); assert.equal(noConsent.statusCode, 400);
  const badOrigin = response(); await handler({ ...req, headers: { ...headers, origin: "https://evil.example" } }, badOrigin); assert.equal(badOrigin.statusCode, 403);
});

test("email remains stored if Microsoft is not configured; no false success reported", async () => {
  const db = memoryDb(); const handler = createSubscribeHandler({ getDb: async () => db, sendWelcome: createMicrosoftMailer({}), env });
  const res = response(); await handler({ method: "POST", headers, body: { email: "a@example.com", consent: true } }, res);
  assert.equal(res.statusCode, 503);
  assert.equal((await db.collection("newsletterSubscribers").doc(subscriberId("a@example.com")).get()).data().mailStatus, "failed");
});

test("Microsoft adapter caches access token and sends a private message to each customer", async () => {
  const calls = []; const mail = createMicrosoftMailer(env, async (url, options) => {
    calls.push({ url, options });
    return url.includes('/token') ? { ok: true, json: async () => ({ access_token: "test-access-token", expires_in: 3600 }) } : { status: 202 };
  });
  await mail("a@example.com", message); await mail("b@example.com", message);
  assert.equal(calls.filter((call) => call.url.includes('/token')).length, 1);
  const payload = JSON.parse(calls[1].options.body);
  assert.equal(payload.message.subject, message.subject);
  assert.equal(payload.message.toRecipients.length, 1);
  assert.equal(payload.message.toRecipients[0].emailAddress.address, "a@example.com");
  assert.ok(calls[1].url.includes("sales%40ororavn.com"));
});

test("test send defaults to authenticated admin and preserves the message body", async () => {
  const { call, sent } = admin(memoryDb());
  assert.equal((await call({ action: "sendTest", ...message, email: "unrelated@example.com" })).statusCode, 200);
  assert.equal(sent[0][0], "owner@example.com");
  assert.deepEqual(sent[0][1], message);
});

test("campaign scans past a full page of inactive contacts and resumes at the saved cursor", async () => {
  const db = memoryDb();
  for (let i = 0; i < 21; i++) await db.collection("newsletterSubscribers").doc(i.toString(16).padStart(64, "0")).set({ ...person(`person${i}@example.com`), status: i < 20 ? "unsubscribed" : "active" });
  const { call, sent } = admin(db);
  await call({ action: "createCampaign", id: "paged", ...message });
  const first = await call({ action: "sendBatch", id: "paged" });
  assert.equal(first.body.completed, false); assert.equal(sent.length, 0);
  const second = await call({ action: "sendBatch", id: "paged" });
  assert.equal(second.body.completed, true); assert.equal(sent[0][0], "person20@example.com");
});

test("mail configuration and message validation fail before creating a campaign", async () => {
  const db = memoryDb(); const { call } = admin(db, { env: { ...env, MS_CLIENT_SECRET: "" } });
  assert.equal((await call({ action: "createCampaign", id: "bad", ...message })).statusCode, 503);
  assert.equal((await db.collection("newsletterCampaigns").doc("bad").get()).exists, false);
  const configured = admin(db);
  assert.equal((await configured.call({ action: "createCampaign", id: "bad", subject: "Injected\nSubject", text: "Content" })).statusCode, 400);
});

test("server credential failures are not misreported as an expired login", async () => {
  const privateError = "DO-NOT-EXPOSE-PRIVATE-CREDENTIAL";
  for (const code of ["firebase_server_configuration_missing", "firebase_server_configuration_invalid", "app/invalid-credential", "auth/insufficient-permission", "auth/internal-error"]) {
    const { call } = admin(memoryDb(), { verifyToken: async () => { throw Object.assign(new Error(privateError), { code }); } });
    const result = await call({});
    assert.equal(result.statusCode, 503);
    assert.ok(result.body.code);
    assert.equal(JSON.stringify(result.body).includes(privateError), false);
  }
});

test("wrong Firebase project is reported without accepting token or exposing its claims", async () => {
  let accessedDb = false;
  const { call } = admin(memoryDb(), {
    getDb: async () => { accessedDb = true; throw new Error("must not read data"); },
    verifyToken: async () => { throw Object.assign(new Error('Firebase ID token has incorrect "aud" (audience) claim. Private metadata here.'), { code: "auth/argument-error" }); },
  });
  const result = await call({});
  assert.equal(result.statusCode, 503);
  assert.equal(result.body.code, "firebase_project_mismatch");
  assert.equal(accessedDb, false);
  assert.equal(result.body.message.includes("Private metadata"), false);
});

test("expired or revoked sessions still fail closed with 401", async () => {
  for (const code of ["auth/id-token-expired", "auth/id-token-revoked", "auth/user-disabled"]) {
    const { call } = admin(memoryDb(), { verifyToken: async () => { throw Object.assign(new Error("private metadata"), { code }); } });
    const result = await call({});
    assert.equal(result.statusCode, 401);
    assert.equal(result.body.code, code);
  }
});

test("authorized admin can choose a single test mailbox distinct from Firebase login", async () => {
  const { call, sent } = admin(memoryDb());
  const result = await call({ action: "sendTest", ...message, testEmail: " Admin@Ororavn.onmicrosoft.com " });
  assert.equal(result.statusCode, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0][0], "admin@ororavn.onmicrosoft.com");
  assert.match(result.body.message, /admin@ororavn\.onmicrosoft\.com/);
  assert.equal(sent[0][1].text, message.text);
});

test("test mailbox selection rejects invalid/multiple recipients and remains admin-only", async () => {
  const { call, sent } = admin(memoryDb());
  for (const testEmail of ["", "not-an-email", "a@example.com,b@example.com", ["a@example.com"], "a@example.com\r\nBcc:b@example.com"]) {
    assert.equal((await call({ action: "sendTest", ...message, testEmail })).statusCode, 400);
  }
  assert.equal(sent.length, 0);
  const unprivileged = admin(memoryDb(), { verifyToken: async () => ({ uid: "not-admin" }) });
  assert.equal((await unprivileged.call({ action: "sendTest", ...message, testEmail: "admin@ororavn.onmicrosoft.com" })).statusCode, 403);
  assert.equal(unprivileged.sent.length, 0);
});

test("admin can pause and reactivate selected contacts without rewriting consent", async () => {
  const db = memoryDb(); await seed(db, 3); const { call, sent } = admin(db);
  const ids = [subscriberId("customer0@example.com"), subscriberId("customer1@example.com")];
  const consent = (await db.collection("newsletterSubscribers").doc(ids[0]).get()).data().consentAt;
  const paused = await call({ action: "manageContacts", operation: "pause", ids: [...ids, ids[0]] });
  assert.equal(paused.statusCode, 200); assert.equal(paused.body.updated.length, 2);
  assert.equal((await db.collection("newsletterSubscribers").doc(ids[0]).get()).data().status, "paused");
  await call({ action: "createCampaign", id: "paused-filter", ...message });
  const campaign = await call({ action: "sendBatch", id: "paused-filter" });
  assert.equal(campaign.body.completed, true);
  assert.deepEqual(sent.map(([email]) => email), ["customer2@example.com"]);
  const active = await call({ action: "manageContacts", operation: "activate", ids });
  assert.equal(active.statusCode, 200);
  const person = (await db.collection("newsletterSubscribers").doc(ids[0]).get()).data();
  assert.equal(person.status, "active"); assert.deepEqual(person.consentAt, consent);
});

test("delete removes contacts from subsequent campaigns while preserving existing campaign history", async () => {
  const db = memoryDb(); await seed(db, 1); const { call, sent } = admin(db);
  const id = subscriberId("customer0@example.com");
  await call({ action: "createCampaign", id: "historical", ...message });
  await call({ action: "sendBatch", id: "historical" });
  const deletion = await call({ action: "manageContacts", operation: "delete", ids: [id] });
  assert.equal(deletion.statusCode, 200);
  assert.equal((await db.collection("newsletterSubscribers").doc(id).get()).exists, false);
  assert.equal((await db.collection("newsletterCampaigns").doc("historical").collection("deliveries").doc(id).get()).exists, true);
  await call({ action: "createCampaign", id: "after-delete", ...message });
  await call({ action: "sendBatch", id: "after-delete" });
  assert.equal(sent.length, 1);
});

test("contact operations require admin access and reject invalid identifiers and oversized selections", async () => {
  const db = memoryDb(); await seed(db, 1); const { call } = admin(db);
  const id = subscriberId("customer0@example.com");
  for (const body of [
    { operation: "invalid", ids: [id] }, { operation: "delete", ids: [] },
    { operation: "delete", ids: ["../settings"] }, { operation: "delete", ids: Array(101).fill(id) },
  ]) assert.equal((await call({ action: "manageContacts", ...body })).statusCode, 400);
  const stranger = admin(db, { verifyToken: async () => ({ uid: "stranger" }) });
  assert.equal((await stranger.call({ action: "manageContacts", operation: "delete", ids: [id] })).statusCode, 403);
  assert.equal((await db.collection("newsletterSubscribers").doc(id).get()).exists, true);
  const missing = subscriberId("missing@example.com");
  await call({ action: "manageContacts", operation: "activate", ids: [missing] });
  assert.equal((await db.collection("newsletterSubscribers").doc(missing).get()).exists, false);
});

test("welcome, test and campaign messages preserve custom body spacing and add no footer", async () => {
  const db = memoryDb(); const { call, sent } = admin(db, { env: { ...env, NEWSLETTER_UNSUBSCRIBE_SECRET: "" } });
  const custom = { subject: "My content", text: "\nNội dung riêng của tôi.\n\nGiữ nguyên dòng trống.  \n" };
  await call({ action: "saveWelcome", ...custom });
  await sendWelcomeMessage("welcome@example.com", { getDb: async () => db, sendMail: async (email, body) => sent.push([email, body]) });
  assert.equal((await call({ action: "sendTest", ...custom })).statusCode, 200);
  await seed(db, 1);
  assert.equal((await call({ action: "createCampaign", id: "no-footer", ...custom })).statusCode, 200);
  await call({ action: "sendBatch", id: "no-footer" });
  assert.equal(sent.length, 3);
  for (const [, body] of sent) assert.deepEqual(body, custom);
});

test("chosen-recipient campaigns send only to their saved selection and keep that selection on resume", async () => {
  const db = memoryDb(); await seed(db, 25); const { call, sent } = admin(db);
  const ids = Array.from({ length: 22 }, (_, i) => subscriberId(`customer${i}@example.com`));
  const body = { action: "createCampaign", id: "chosen", ...message, recipientIds: [...ids, ids[0]] };
  assert.equal((await call(body)).statusCode, 200);
  assert.equal((await call({ ...body, recipientIds: [...ids].reverse() })).statusCode, 200);
  assert.equal((await call({ ...body, recipientIds: [ids[0]] })).statusCode, 409);
  assert.equal((await call({ action: "createCampaign", id: "chosen", ...message })).statusCode, 409);
  await db.collection("newsletterSubscribers").doc(ids[0]).set({ status: "paused" }, { merge: true });
  await db.collection("newsletterSubscribers").doc(ids[1]).delete();
  let result;
  for (let i = 0; i < 20; i++) { result = await call({ action: "sendBatch", id: "chosen" }); if (result.body.completed) break; }
  assert.equal(result.body.completed, true);
  assert.equal(sent.length, 20);
  assert.deepEqual(new Set(sent.map(([email]) => email)), new Set(Array.from({ length: 20 }, (_, i) => `customer${i + 2}@example.com`)));
  await call({ action: "sendBatch", id: "chosen" }); assert.equal(sent.length, 20);
});

test("chosen-recipient campaigns reject empty, malformed, oversized or inactive selections before creation", async () => {
  const db = memoryDb(); await seed(db, 1); const { call } = admin(db);
  const id = subscriberId("customer0@example.com");
  for (const recipientIds of [[], "all", ["not-a-contact"], Array(101).fill(id), [subscriberId("missing@example.com")]]) {
    assert.equal((await call({ action: "createCampaign", id: "invalid-selection", ...message, recipientIds })).statusCode, 400);
  }
  await db.collection("newsletterSubscribers").doc(id).set({ status: "unsubscribed" }, { merge: true });
  assert.equal((await call({ action: "createCampaign", id: "invalid-selection", ...message, recipientIds: [id] })).statusCode, 400);
  assert.equal((await db.collection("newsletterCampaigns").doc("invalid-selection").get()).exists, false);
});

test("chosen campaign history preserves email addresses even if contacts are deleted later", async () => {
  const db = memoryDb(); await seed(db, 2); const { call } = admin(db);
  const ids = [subscriberId("customer1@example.com"), subscriberId("customer0@example.com")];
  assert.equal((await call({ action: "createCampaign", id: "recipient-snapshot", ...message, recipientIds: ids })).statusCode, 200);
  await db.collection("newsletterSubscribers").doc(ids[0]).delete();
  const history = await call(null, { method: "GET", query: {} });
  const item = history.body.campaigns.find((entry) => entry.id === "recipient-snapshot");
  assert.deepEqual(new Set(item.recipientEmails), new Set(["customer0@example.com", "customer1@example.com"]));
  item.recipientIds.forEach((id, index) => assert.equal(subscriberId(item.recipientEmails[index]), id));
});

test("template library saves and edits reusable messages without sending or replacing automatic settings", async () => {
  const db = memoryDb(); const { call, sent } = admin(db);
  const welcome = { subject: "Welcome", text: "Original welcome" }; const order = { subject: "Order", text: "Original order" };
  await db.collection("newsletterSettings").doc("welcome").set(welcome);
  await db.collection("newsletterSettings").doc("orderConfirmation").set(order);
  const body = { action: "saveLibraryTemplate", id: "saved-template", name: "Xác nhận", kind: "order", subject: "Đơn {{orderCode}}", text: "Chào {{customerName}}", actorName: "Forged" };
  assert.equal((await call(body)).statusCode, 200);
  const original = (await db.collection("newsletterTemplates").doc(body.id).get()).data();
  assert.equal(original.actor, "owner-uid"); assert.notEqual(original.actorName, "Forged");
  assert.equal((await call({ ...body, name: "Đã sửa", text: "Nội dung mới {{orderCode}}" })).statusCode, 200);
  const page = await call(null, { method: "GET", query: { templates: "1" } });
  assert.equal(page.body.templates.length, 1); assert.equal(page.body.templates[0].name, "Đã sửa");
  assert.equal(page.body.templates[0].createdAt, original.createdAt.getTime());
  assert.deepEqual((await db.collection("newsletterSettings").doc("welcome").get()).data(), welcome);
  assert.deepEqual((await db.collection("newsletterSettings").doc("orderConfirmation").get()).data(), order);
  assert.equal(sent.length, 0);
  for (const patch of [{ name: "" }, { kind: "invalid" }, { subject: "Injected\nSubject" }, { text: "{{notAnOrderVariable}}" }]) assert.equal((await call({ ...body, ...patch })).statusCode, 400);
  assert.equal((await admin(db, { verifyToken: async () => ({ uid: "other" }) }).call(body)).statusCode, 403);
  assert.equal((await admin(db, { verifyToken: async () => ({ uid: "other" }) }).call(null, { method: "GET", query: { templates: "1" } })).statusCode, 403);
});

test("deleting a library template preserves automatic templates and sent history and is safe to retry", async () => {
  const db = memoryDb(); const { call } = admin(db);
  const original = { subject: "Order", text: "Existing automatic content" };
  await db.collection("newsletterSettings").doc("orderConfirmation").set(original);
  await db.collection("newsletterCampaigns").doc("sent-before").set({ subject: "Old", text: "Sent content", createdAt: new Date() });
  await call({ action: "saveLibraryTemplate", id: "delete-me", name: "Delete me", kind: "general", subject: "Sample", text: "Draft" });
  const deletion = { action: "deleteLibraryTemplate", id: "delete-me" };
  assert.equal((await admin(db, { verifyToken: async () => ({ uid: "other" }) }).call(deletion)).statusCode, 403);
  assert.equal((await db.collection("newsletterTemplates").doc("delete-me").get()).exists, true);
  assert.equal((await call({ ...deletion, id: "../welcome" })).statusCode, 400);
  assert.equal((await call(deletion)).statusCode, 200); assert.equal((await call(deletion)).statusCode, 200);
  assert.equal((await db.collection("newsletterTemplates").doc("delete-me").get()).exists, false);
  assert.deepEqual((await db.collection("newsletterSettings").doc("orderConfirmation").get()).data(), original);
  assert.equal((await db.collection("newsletterCampaigns").doc("sent-before").get()).data().text, "Sent content");
});

test("customer mail records a frozen template snapshot and counts use once per campaign", async () => {
  const db = memoryDb(); await seed(db, 4); const { call, sent } = admin(db);
  const template = { action: "saveLibraryTemplate", id: "customer-template", name: "Tên cũ", kind: "general", ...message };
  await call(template);
  await call({ action: "createCampaign", id: "frozen", ...message, templateRef: { id: template.id, revision: 1 } });
  await call({ ...template, name: "Tên mới", text: "Khác nội dung" });
  let result;
  for (let i = 0; i < 5; i++) { result = await call({ action: "sendBatch", id: "frozen" }); if (result.body.completed) break; }
  assert.equal(sent.length, 4); assert.equal(sent[0][1].text, message.text);
  const campaign = (await db.collection("newsletterCampaigns").doc("frozen").get()).data();
  assert.equal(campaign.templateName, "Tên cũ"); assert.equal(campaign.templateRevision, 1);
  const current = (await db.collection("newsletterTemplates").doc(template.id).get()).data();
  assert.equal(current.name, "Tên mới"); assert.equal(current.sentCount, 1); assert.deepEqual(current.usedRevisions, [1]);
  assert.equal((await call({ action: "createCampaign", id: "wrong-kind", ...message, templateRef: { id: template.id, revision: 1 } })).statusCode, 409);
});

test("unified template types preserve legacy private templates and support a frozen welcome template", async () => {
  const db = memoryDb(); const { call } = admin(db);
  await db.collection("newsletterTemplates").doc("legacy-private").set({ name: "Legacy", kind: "order", ...message, createdAt: new Date(), updatedAt: new Date() });
  const page = await call(null, { method: "GET", query: { templates: "1" } });
  assert.equal(page.body.templates[0].kind, "private");
  assert.equal((await db.collection("newsletterTemplates").doc("legacy-private").get()).data().kind, "order");
  const welcome = { id: "welcome-library", name: "Chào mừng ban đầu", kind: "welcome_auto", subject: "Chào bạn", text: "Cảm ơn đã đăng ký." };
  assert.equal((await call({ action: "saveLibraryTemplate", ...welcome })).statusCode, 200);
  assert.equal((await call({ action: "saveWelcome", ...welcome, templateRef: { id: welcome.id, revision: 1 } })).statusCode, 200);
  await call({ action: "saveLibraryTemplate", ...welcome, name: "Đã đổi tên", text: "Nội dung mới" });
  const sent = [];
  await sendWelcomeMessage("new@example.com", { getDb: () => db, sendMail: async (...args) => sent.push(args) });
  assert.equal(sent[0][1].text, welcome.text);
  const active = (await db.collection("newsletterSettings").doc("welcome").get()).data();
  assert.equal(active.templateName, welcome.name); assert.equal(active.templateRevision, 1);
  const current = (await db.collection("newsletterTemplates").doc(welcome.id).get()).data();
  assert.equal(current.revision, 2); assert.deepEqual(current.usedRevisions, [1]);
});

test("private order placeholders cannot be sent unfilled to a customer list or automatic welcome", async () => {
  const db = memoryDb(); const { call, sent } = admin(db);
  const orderMessage = { subject: "Đơn {{orderCode}}", text: "Chào {{customerName}}" };
  assert.equal((await call({ action: "saveLibraryTemplate", id: "private-order", kind: "private", name: "Riêng", ...orderMessage })).statusCode, 200);
  assert.equal((await call({ action: "createCampaign", id: "bad-context", ...orderMessage })).statusCode, 400);
  assert.equal((await call({ action: "saveLibraryTemplate", id: "bad-welcome", kind: "welcome_auto", name: "Welcome", ...orderMessage })).statusCode, 400);
  assert.equal(sent.length, 0);
});
