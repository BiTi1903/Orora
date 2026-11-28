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
  MS_MAIL_TRANSPORT: "graph",
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
  assert.ok(sent[0][1].text.startsWith(message.text));
  assert.ok(sent[0][1].text.includes(unsubscribeLink(subscriberId(sent[0][0]), env)));
  assert.equal(sent[0][1].unsubscribeUrl, unsubscribeLink(subscriberId(sent[0][0]), env));
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

test("welcome template appends signed unsubscribe link when configured", async () => {
  const db = memoryDb(); const { call } = admin(db); let received;
  assert.equal((await call({ action: "saveWelcome", ...message })).statusCode, 200);
  await sendWelcomeMessage("a@example.com", { getDb: async () => db, env, sendMail: async (email, text) => { received = { email, text }; } });
  const expectedUrl = unsubscribeLink(subscriberId("a@example.com"), env);
  assert.equal(received.text.subject, message.subject);
  assert.equal(received.text.unsubscribeUrl, expectedUrl);
  assert.ok(received.text.text.startsWith(message.text));
  assert.ok(received.text.text.includes(expectedUrl));
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
  const alerts = [];
  const handler = createSubscribeHandler({ notifyStore: async (_ref, event) => alerts.push(event), getDb: async () => db, sendWelcome: async () => { sent++; }, env });
  const req = { method: "POST", headers, body: { email: " CUSTOMER@example.com ", consent: true }, socket: { remoteAddress: "127.0.0.1" } };
  const one = response(); await handler(req, one); assert.equal(one.statusCode, 200);
  const saved = (await db.collection("newsletterSubscribers").doc(subscriberId("customer@example.com")).get()).data();
  assert.equal(saved.status, "active"); assert.equal(saved.consentVersion, "newsletter-v1");
  const two = response(); await handler(req, two); assert.equal(two.statusCode, 200); assert.equal(sent, 1);
  assert.equal(alerts.length, 1);
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
  assert.equal(sent[0][1].subject, message.subject);
  assert.equal(sent[0][1].text, message.text);
  assert.ok(sent[0][1].html.includes("ORORA"));
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

test("welcome, test and campaign messages preserve custom body spacing and fail closed when unsubscribe secret is missing", async () => {
  const db = memoryDb(); const { call, sent } = admin(db);
  const custom = { subject: "My content", text: "\nNội dung riêng của tôi.\n\nGiữ nguyên dòng trống.  \n" };
  await call({ action: "saveWelcome", ...custom });
  await sendWelcomeMessage("welcome@example.com", { getDb: async () => db, sendMail: async (email, body) => sent.push([email, body]), env });
  assert.equal((await call({ action: "sendTest", ...custom })).statusCode, 200);
  await seed(db, 1);
  assert.equal((await call({ action: "createCampaign", id: "with-footer", ...custom })).statusCode, 200);
  await call({ action: "sendBatch", id: "with-footer" });
  assert.equal(sent.length, 3);
  assert.equal(sent[1][1].subject, custom.subject);
  assert.equal(sent[1][1].text, custom.text);
  assert.ok(sent[1][1].html.includes("ORORA"));
  assert.ok(sent[0][1].text.startsWith(custom.text.trimEnd()) && sent[0][1].unsubscribeUrl);
  assert.ok(sent[2][1].text.startsWith(custom.text.trimEnd()) && sent[2][1].unsubscribeUrl);

  const missingEnv = { ...env, NEWSLETTER_UNSUBSCRIBE_SECRET: "" };
  await assert.rejects(() => sendWelcomeMessage("welcome@example.com", { getDb: async () => db, sendMail: async () => { throw new Error("should_not_send"); }, env: missingEnv }), /unsubscribe_configuration_missing/);
  const db2 = memoryDb(); await seed(db2, 1);
  const { call: callMissing, sent: sentMissing } = admin(db2, { env: missingEnv });
  assert.equal((await callMissing({ action: "createCampaign", id: "no-secret", ...custom })).statusCode, 200);
  const batchRes = await callMissing({ action: "sendBatch", id: "no-secret" });
  assert.equal(batchRes.statusCode, 503);
  assert.equal(sentMissing.length, 0);
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
  assert.equal(sent.length, 4); assert.ok(sent[0][1].text.startsWith(message.text)); assert.ok(sent[0][1].text.includes("/api/unsubscribe?id="));
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
  await sendWelcomeMessage("new@example.com", { getDb: () => db, sendMail: async (...args) => sent.push(args), env });
  assert.ok(sent[0][1].text.startsWith(welcome.text));
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

test("seeding the five built-in customer journey templates is idempotent, preserves settings, upgrades v1 stores and respects deletion", async () => {
  const db = memoryDb(); const { call, sent } = admin(db);
  const welcome = { subject: "Chào mừng đã lưu", text: "Nội dung chào mừng của shop" };
  const order = { subject: "Đơn {{orderCode}}", text: "Nội dung xác nhận hiện tại {{customerName}}" };
  await db.collection("newsletterSettings").doc("welcome").set(welcome);
  await db.collection("newsletterSettings").doc("orderConfirmation").set(order);
  const res = await call({ action: "ensureDefaultTemplates" }); assert.equal(res.statusCode, 200); assert.equal(res.body.created.length, 5);
  const page = await call(null, { method: "GET", query: { templates: "1" } });
  assert.equal(page.body.templates.length, 5);
  assert.equal(page.body.templates.find((item) => item.kind === "welcome_auto").text, welcome.text);
  assert.equal(page.body.templates.find((item) => item.kind === "order_auto").text, order.text);
  assert.ok(page.body.templates.some((item) => item.id === "builtin-order-shipping" && item.kind === "private"));
  assert.ok(page.body.templates.some((item) => item.id === "builtin-order-thankyou" && item.kind === "private"));
  await Promise.all([call({ action: "ensureDefaultTemplates" }), call({ action: "ensureDefaultTemplates" })]);
  assert.equal((await db.collection("newsletterTemplates").get()).docs.length, 5);
  await call({ action: "deleteLibraryTemplate", id: "builtin-welcome" });
  await call({ action: "ensureDefaultTemplates" });
  assert.equal((await db.collection("newsletterTemplates").doc("builtin-welcome").get()).exists, false);
  // Simulate upgrading an older v1 store where seededIds was not yet recorded and builtin-welcome was deleted
  await db.collection("newsletterSettings").doc("libraryDefaultsSeed").set({ seededAt: 100 });
  await db.collection("newsletterTemplates").doc("builtin-order-shipping").delete();
  await db.collection("newsletterTemplates").doc("builtin-order-thankyou").delete();
  const upgraded = await call({ action: "ensureDefaultTemplates" });
  assert.deepEqual(upgraded.body.created.sort(), ["builtin-order-shipping", "builtin-order-thankyou"]);
  assert.equal((await db.collection("newsletterTemplates").doc("builtin-welcome").get()).exists, false);
  assert.deepEqual((await db.collection("newsletterSettings").doc("welcome").get()).data(), welcome);
  assert.deepEqual((await db.collection("newsletterSettings").doc("orderConfirmation").get()).data(), order);
  assert.equal(sent.length, 0);
});

test("order test mail renders the current draft but sends only to the entered test address without touching orders", async () => {
  const db = memoryDb(); const { call, sent } = admin(db);
  const order = { code: "OR-REAL", customer: { name: "Buyer", email: "real-buyer@example.com", address: "Hà Nội", phone: "0900000000" }, product: { name: "Serum" }, quantity: 2, subtotal: 500000, paymentMethod: "cod", confirmationMail: { state: "pending" } };
  await db.collection("orders").doc("test-order").set(order);
  const draft = { action: "sendTest", mailType: "order", orderId: "test-order", testEmail: "test@example.com", subject: "Đơn {{orderCode}}", text: "Chào {{customerName}}: {{productName}}" };
  assert.equal((await call(draft)).statusCode, 200);
  assert.equal(sent.length, 1); assert.equal(sent[0][0], "test@example.com"); assert.equal(sent[0][1].subject, "Đơn OR-REAL"); assert.equal(sent[0][1].text, "Chào Buyer: Serum");
  assert.deepEqual((await db.collection("orders").doc("test-order").get()).data(), order);
  assert.equal((await db.collection("orders").doc("test-order").collection("mailEvents").get()).docs.length, 0);
  assert.equal((await call({ ...draft, orderId: undefined })).statusCode, 200);
  assert.match(sent[1][1].subject, /OR-GUI-THU/);
  assert.equal((await call({ ...draft, mailType: "registration" })).statusCode, 400);
  const restricted = admin(db, { env: { ...env, ORDER_ADMIN_UIDS: "another-admin" } });
  assert.equal((await restricted.call(draft)).statusCode, 403);
});

test("custom template types persist once and validate template categorization", async () => {
  const db = memoryDb(); const { call } = admin(db);
  const result = await call({ action: "addTemplateType", name: "Chăm sóc khách" });
  assert.equal(result.statusCode, 200); const type = result.body.type;
  assert.equal((await call({ action: "addTemplateType", name: " CHĂM SÓC KHÁCH " })).body.type.id, type.id);
  assert.equal((await db.collection("newsletterTemplateTypes").get()).docs.length, 1);
  assert.equal((await call({ action: "saveLibraryTemplate", id: "custom-category", name: "Hỏi thăm", kind: "private", categoryId: type.id, ...message })).statusCode, 200);
  const page = await call(null, { method: "GET", query: { templates: "1" } });
  assert.equal(page.body.types[0].name, "Chăm sóc khách"); assert.equal(page.body.templates[0].categoryName, "Chăm sóc khách");
  assert.equal((await call({ action: "saveLibraryTemplate", id: "bad-category", name: "Bad", kind: "order_auto", categoryId: type.id, ...message })).statusCode, 400);
  assert.equal((await call({ action: "saveLibraryTemplate", id: "missing-category", name: "Bad", kind: "private", categoryId: "missing", ...message })).statusCode, 400);
});

test("Outlook statuses on campaign deliveries and registration mail do not send mail or alter submission counts", async () => {
  const db = memoryDb(); const id = subscriberId("customer@example.com");
  await db.collection("newsletterCampaigns").doc("outlook-campaign").set({ accepted: 1, subject: "Sent subject" });
  await db.collection("newsletterCampaigns").doc("outlook-campaign").collection("deliveries").doc(id).set({ email: "customer@example.com", status: "accepted" });
  await db.collection("newsletterSubscribers").doc(id).set({ email: "customer@example.com", mailStatus: "accepted" });
  const { call, sent } = admin(db, { checkOutlook: async () => ({ state: "sent_item", checkedAt: new Date().toISOString() }) });
  const page = await call({ action: "campaignDeliveryStatuses", id: "outlook-campaign" }); assert.equal(page.body.deliveries.length, 1);
  assert.equal((await call({ action: "checkCampaignOutlook", id: "outlook-campaign", deliveryId: id })).body.outlook.state, "sent_item");
  assert.equal((await call({ action: "checkWelcomeOutlook", id })).body.outlook.state, "sent_item");
  assert.equal((await db.collection("newsletterCampaigns").doc("outlook-campaign").get()).data().accepted, 1);
  assert.equal((await db.collection("newsletterSubscribers").doc(id).get()).data().mailStatus, "accepted");
  assert.equal(sent.length, 0);
});

test("registration returns after saving while welcome sends in background, and double clicks do not send duplicate mail", async () => {
  const db = memoryDb(); const tasks = []; let sent = 0; let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const handler = createSubscribeHandler({ getDb: () => db, env, schedule: (task) => tasks.push(task), sendWelcome: async () => { sent++; await gate; } });
  const req = { method: "POST", headers, body: { email: "background@example.com", consent: true } };
  const first = response(); await handler(req, first);
  assert.equal(first.statusCode, 200); assert.match(first.body.message, /thành công/);
  const ref = db.collection("newsletterSubscribers").doc(subscriberId(req.body.email));
  assert.equal((await ref.get()).data().mailStatus, "pending"); assert.equal(tasks.length, 1);
  const duplicate = response(); await handler(req, duplicate); assert.equal(duplicate.statusCode, 200); assert.equal(sent, 1); assert.equal(tasks.length, 1);
  release(); await tasks[0]; assert.equal((await ref.get()).data().mailStatus, "accepted");
});

test("background SMTP failure remains an admin issue rather than failing the saved signup", async () => {
  const db = memoryDb(); const tasks = [];
  const handler = createSubscribeHandler({ getDb: () => db, env, schedule: (task) => tasks.push(task), sendWelcome: async () => { throw Error("mail_auth_failed"); } });
  const result = response(); await handler({ method: "POST", headers, body: { email: "saved@example.com", consent: true } }, result);
  assert.equal(result.statusCode, 200); await tasks[0];
  const person = (await db.collection("newsletterSubscribers").doc(subscriberId("saved@example.com")).get()).data();
  assert.equal(person.status, "active"); assert.equal(person.mailStatus, "failed");
});

test("old IP/site limits, hidden website field and prior failure cooldown no longer block valid registrations", async () => {
  const db = memoryDb(); let sent = 0;
  const limit = { count: 99999, resetAt: Date.now() + 86400000 };
  await db.collection("newsletterLimits").doc("global").set(limit);
  await db.collection("newsletterSubscribers").doc(subscriberId("retry-now@example.com")).set({ email: "retry-now@example.com", status: "active", mailStatus: "failed", nextAttemptAt: Date.now() + 86400000 });
  const handler = createSubscribeHandler({ getDb: () => db, env, sendWelcome: async () => { sent++; } });
  for (const email of ["retry-now@example.com", ...Array.from({ length: 7 }, (_, i) => `same-ip-${i}@example.com`)]) {
    const result = response(); await handler({ method: "POST", headers, socket: { remoteAddress: "127.0.0.1" }, body: { email, consent: true, website: "not-blocked" } }, result);
    assert.equal(result.statusCode, 200);
  }
  assert.equal(sent, 8); assert.deepEqual((await db.collection("newsletterLimits").doc("global").get()).data(), limit);
});

test("subscribe rate limits by email (3/hour) and IP (5/min) with Retry-After", async () => {
  const db = memoryDb();
  const handler = createSubscribeHandler({
    getDb: () => db,
    env: { ...env, CHAT_RATE_LIMIT_SALT: "test-salt" },
    clock: () => 1700000000000,
    sendWelcome: async () => {},
  });
  const call = async (ip, email) => {
    const res = response();
    await handler({ method: "POST", headers: { ...headers, "x-forwarded-for": ip }, body: { email, consent: true } }, res);
    return res;
  };
  for (let i = 0; i < 3; i++) assert.equal((await call(`203.0.113.${i + 1}`, "victim@example.com")).statusCode, 200);
  const emailBlocked = await call("203.0.113.4", "victim@example.com");
  assert.equal(emailBlocked.statusCode, 429);
  assert.ok(Number(emailBlocked.headers["Retry-After"]) > 0);
  for (let i = 0; i < 5; i++) assert.equal((await call("198.51.100.9", `sub-${i}@example.com`)).statusCode, 200);
  const ipBlocked = await call("198.51.100.9", "sub-5@example.com");
  assert.equal(ipBlocked.statusCode, 429);
  assert.ok(Number(ipBlocked.headers["Retry-After"]) > 0);
});

test("newsletter admin rejects order-only UIDs and disabled adminUsers records", async () => {
  const db = memoryDb();
  await db.collection("adminUsers").doc("disabled-mail-admin").set({ enabled: false });
  const splitEnv = { ...env, ORDER_ADMIN_UIDS: "order-only", NEWSLETTER_ADMIN_UIDS: "mail-only" };
  const callAs = async (uid) => {
    const handler = createNewsletterAdminHandler({ getDb: async () => db, verifyToken: async () => ({ uid }), sendMail: async () => {}, env: splitEnv });
    const res = response();
    await handler({ method: "GET", headers: { authorization: "Bearer token" }, query: {} }, res);
    return res;
  };
  assert.equal((await callAs("order-only")).statusCode, 403);
  assert.equal((await callAs("disabled-mail-admin")).statusCode, 403);
  assert.equal((await callAs("mail-only")).statusCode, 200);

  await db.collection("adminUsers").doc("fs-full").set({ enabled: true });
  await db.collection("orders").doc("order-1").set({ code: "OW_1111C", customer: { name: "An", email: "an@example.com", phone: "0900000000", address: "HN" }, product: { name: "Serum" }, quantity: 1, subtotal: 200000, paymentMethod: "cod" });
  const sendOrderTest = async (userObj) => {
    const handler = createNewsletterAdminHandler({ getDb: async () => db, verifyToken: async () => userObj, sendMail: async () => {}, env: splitEnv });
    const res = response();
    await handler({ method: "POST", headers: { ...headers, authorization: "Bearer token" }, body: { action: "sendTest", mailType: "order", orderId: "order-1", testEmail: "qa@example.com", subject: "Đơn {{orderCode}}", text: "Xin chào {{customerName}}" } }, res);
    return res;
  };
  assert.equal((await sendOrderTest({ uid: "fs-full" })).statusCode, 200);
  assert.equal((await sendOrderTest({ uid: "claim-full", admin: true })).statusCode, 200);
  assert.equal((await sendOrderTest({ uid: "mail-only" })).statusCode, 403);
});

test("re-subscribing an unsubscribed or bounced email keeps its status and sends no welcome email", async () => {
  const db = memoryDb();
  let welcomed = 0;
  const unsubId = subscriberId("opted-out@example.com");
  const bouncedId = subscriberId("hard-bounce@example.com");
  await db.collection("newsletterSubscribers").doc(unsubId).set({ email: "opted-out@example.com", status: "unsubscribed", mailStatus: "accepted", unsubscribedAt: new Date(1000) });
  await db.collection("newsletterSubscribers").doc(bouncedId).set({ email: "hard-bounce@example.com", status: "bounced", mailStatus: "failed", bouncedAt: new Date(1000) });

  const handler = createSubscribeHandler({
    getDb: () => db,
    env: { ...env, CHAT_RATE_LIMIT_SALT: "test-salt" },
    sendWelcome: async () => { welcomed += 1; },
  });
  for (const email of ["opted-out@example.com", "hard-bounce@example.com"]) {
    const res = response();
    await handler({ method: "POST", headers: { ...headers, "x-forwarded-for": "203.0.113.55" }, body: { email, consent: true } }, res);
    assert.equal(res.statusCode, 200);
  }
  assert.equal(welcomed, 0);
  assert.equal((await db.collection("newsletterSubscribers").doc(unsubId).get()).data().status, "unsubscribed");
  assert.equal((await db.collection("newsletterSubscribers").doc(bouncedId).get()).data().status, "bounced");
});

test("sendBatch pauses on bare 550 sender error, but continues and marks bounced on 5.1.x recipient error", async () => {
  const db1 = memoryDb(); await seed(db1, 2);
  const { call: callBare550 } = admin(db1, {
    sendMail: async () => {
      const err = new Error("mail_send_failed");
      err.smtp = { responseCode: 550, enhancedCode: "5.7.60" };
      throw err;
    },
  });
  await callBare550({ action: "createCampaign", id: "bare-550", ...message });
  const r1 = await callBare550({ action: "sendBatch", id: "bare-550" });
  assert.equal(r1.body.paused, true);
  assert.equal(r1.body.campaign.failed, 1);
  assert.equal((await db1.collection("newsletterSubscribers").doc(subscriberId("customer0@example.com")).get()).data().status, "active");

  const db2 = memoryDb(); await seed(db2, 2);
  const delivered = [];
  const { call: call511 } = admin(db2, {
    sendMail: async (email) => {
      if (email === "customer0@example.com") {
        const err = new Error("mail_send_failed");
        err.smtp = { responseCode: 550, enhancedCode: "5.1.1" };
        throw err;
      }
      delivered.push(email);
    },
  });
  await call511({ action: "createCampaign", id: "rcpt-511", ...message });
  const r2 = await call511({ action: "sendBatch", id: "rcpt-511" });
  assert.equal(r2.body.paused, false);
  assert.equal(r2.body.completed, true);
  assert.deepEqual(delivered, ["customer1@example.com"]);
  assert.equal((await db2.collection("newsletterSubscribers").doc(subscriberId("customer0@example.com")).get()).data().status, "bounced");
  assert.equal((await db2.collection("newsletterSubscribers").doc(subscriberId("customer1@example.com")).get()).data().status, "active");
});

test("checkCampaignBatchOutlook batch-checks campaign deliveries and marks bounced subscribers", async () => {
  const db = memoryDb(); await seed(db, 2);
  const id0 = subscriberId("customer0@example.com");
  const id1 = subscriberId("customer1@example.com");
  await db.collection("newsletterCampaigns").doc("camp-batch").set({ ...message, status: "completed", createdAt: new Date(1000) });
  await db.collection("newsletterCampaigns").doc("camp-batch").collection("deliveries").doc(id0).set({ email: "customer0@example.com", status: "accepted", messageId: "<m0@orora>", sentAt: new Date(2000) });
  await db.collection("newsletterCampaigns").doc("camp-batch").collection("deliveries").doc(id1).set({ email: "customer1@example.com", status: "accepted", messageId: "<m1@orora>", sentAt: new Date(2000) });

  const checkOutlook = async () => ({ state: "sent_item" });
  checkOutlook.checkBatch = async (records) => records.map((rec) =>
    rec.recipient === "customer0@example.com"
      ? { state: "bounced", diagnosticCode: "5.1.1", checkedAt: new Date(3000) }
      : { state: "sent_item", checkedAt: new Date(3000) }
  );
  const { call } = admin(db, { checkOutlook });
  const res = await call({ action: "checkCampaignBatchOutlook", id: "camp-batch" });
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.checked, 2);
  assert.equal(res.body.bouncedCount, 1);
  assert.equal((await db.collection("newsletterSubscribers").doc(id0).get()).data().status, "bounced");
  assert.equal((await db.collection("newsletterSubscribers").doc(id1).get()).data().status, "active");
});



test("queued campaigns wait for their time and run without an admin tab", async () => {
  const db=memoryDb();
  const {call,sent}=admin(db,{env:{...env,CRON_SECRET:"test-worker"}});
  await seed(db,1);
  await call(null,{method:"GET",headers:{authorization:"Bearer test-worker"},query:{dispatchCampaign:"1"}});
  const scheduledAt=Date.now()+60000;
  const created=await call({action:"createCampaign",id:"future",background:true,scheduledAt,...message});
  assert.equal(created.statusCode,200);
  const tick=(token)=>call(null,{method:"GET",headers:{authorization:"Bearer "+token},query:{dispatchCampaign:"1"}});
  assert.equal((await tick("wrong")).statusCode,403);
  assert.equal((await tick("test-worker")).body.idle,true);
  await db.collection("newsletterCampaigns").doc("future").set({scheduledAt:1,nextSendAt:1},{merge:true});
  assert.equal((await tick("test-worker")).body.completed,true);
  assert.equal((await tick("test-worker")).body.idle,true);
  assert.equal(sent.length,1);
});
