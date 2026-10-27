import test from "node:test";
import assert from "node:assert/strict";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";
import { createSubscribeHandler } from "../server/newsletter.js";
import { createUnsubscribeHandler } from "../server/unsubscribe.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { DEFAULT_WELCOME, sendWelcomeMessage, subscriberId, unsubscribeLink, withUnsubscribe } from "../server/newsletter-content.js";
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
  assert.match(sent[0][1].text, /Hủy đăng ký: https:\/\/orora.example\/api\/unsubscribe/);
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

test("welcome template can be saved and is applied with a signed unsubscribe link", async () => {
  const db = memoryDb(); const { call } = admin(db); let received;
  assert.equal((await call({ action: "saveWelcome", ...message })).statusCode, 200);
  await sendWelcomeMessage("a@example.com", { getDb: async () => db, env, sendMail: async (email, text) => { received = { email, text }; } });
  assert.equal(received.text.subject, message.subject); assert.match(received.text.text, /api\/unsubscribe\?id=/);
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

test("test send goes only to authenticated admin's email; text footer is appended", async () => {
  const { call, sent } = admin(memoryDb());
  assert.equal((await call({ action: "sendTest", ...message, email: "unrelated@example.com" })).statusCode, 200);
  assert.equal(sent[0][0], "owner@example.com");
  assert.match(withUnsubscribe(DEFAULT_WELCOME, subscriberId("a@example.com"), env).text, /Hủy đăng ký/);
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
  assert.match(sent[0][1].text, new RegExp(subscriberId("admin@ororavn.onmicrosoft.com")));
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
