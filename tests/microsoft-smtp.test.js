import test from "node:test";
import assert from "node:assert/strict";
import { createMicrosoftSmtpMailer } from "../server/microsoft-smtp.js";
import { createMicrosoftMailer } from "../server/microsoft-mail.js";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";
import { memoryDb, response } from "./firestore-memory.js";
import { subscriberId } from "../server/newsletter-content.js";

const env = {
  MS_TENANT_ID: "test-tenant", MS_CLIENT_ID: "test-client", MS_CLIENT_SECRET: "test-secret",
  MS_SENDER_EMAIL: "sales@ororavn.com", MS_MAIL_TRANSPORT: "smtp",
};
const message = { subject: "SMTP test", text: "Test message" };
const tokenResponse = async () => ({ ok: true, json: async () => ({ access_token: "smtp-test-token", expires_in: 3600 }) });

test("SMTP OAuth2 uses the Exchange token scope, enforced STARTTLS and a private recipient", async () => {
  const requests = [];
  const options = [];
  const messages = [];
  let closed = 0;
  const mail = createMicrosoftSmtpMailer(env, async (url, init) => {
    requests.push({ url, init }); return tokenResponse();
  }, (config) => {
    options.push(config);
    return { sendMail: async (body) => { messages.push(body); return { accepted: body.envelope.to }; }, close() { closed++; } };
  });
  await mail("customer@example.com", message);
  await mail("other@example.com", message);
  assert.equal(requests.length, 1, "unexpired token should be reused");
  assert.equal(requests[0].init.body.get("scope"), "https://outlook.office365.com/.default");
  assert.equal(options[0].host, "smtp.office365.com");
  assert.equal(options[0].port, 587);
  assert.equal(options[0].requireTLS, true);
  assert.equal(options[0].tls.rejectUnauthorized, true);
  assert.equal(options[0].tls.minVersion, "TLSv1.2");
  assert.deepEqual(options[0].auth, { type: "OAuth2", user: "sales@ororavn.com", accessToken: "smtp-test-token" });
  assert.equal("pass" in options[0].auth, false);
  assert.deepEqual(messages[0].envelope, { from: "sales@ororavn.com", to: ["customer@example.com"] });
  assert.deepEqual(messages[0].to, [{ address: "customer@example.com" }]);
  assert.equal(messages[0].text, message.text);
  assert.equal(messages[0].subject, message.subject);
  assert.equal(closed, 2);
});

test("SMTP authentication rejection invalidates cached token without automatically resending", async () => {
  let tokens = 0;
  let submissions = 0;
  const mail = createMicrosoftSmtpMailer(env, async () => { tokens++; return tokenResponse(); }, () => ({
    sendMail: async () => {
      submissions++;
      if (submissions === 1) throw Object.assign(new Error("private server details"), { code: "EAUTH", responseCode: 535 });
      return { accepted: ["customer@example.com"] };
    },
  }));
  await assert.rejects(mail("customer@example.com", message), { message: "mail_smtp_auth_failed" });
  assert.equal(submissions, 1);
  await mail("customer@example.com", message);
  assert.equal(tokens, 2);
});

test("SMTP separates explicit rejection, connection failure and ambiguous DATA timeout", async () => {
  for (const [error, expected] of [
    [Object.assign(new Error("550 blocked"), { responseCode: 550, command: "DATA" }), "mail_send_failed"],
    [Object.assign(new Error("connection timeout"), { code: "ETIMEDOUT", command: "CONN" }), "mail_smtp_connection_failed"],
    [Object.assign(new Error("timeout after DATA"), { code: "ETIMEDOUT", command: "DATA" }), "mail_smtp_outcome_unknown"],
  ]) {
    let attempts = 0;
    const mail = createMicrosoftSmtpMailer(env, tokenResponse, () => ({ sendMail: async () => { attempts++; throw error; } }));
    await assert.rejects(mail("customer@example.com", message), { message: expected });
    assert.equal(attempts, 1);
  }
  const rejected = createMicrosoftSmtpMailer(env, tokenResponse, () => ({ sendMail: async () => ({ accepted: [], rejected: ["customer@example.com"] }) }));
  await assert.rejects(rejected("customer@example.com", message), { message: "mail_send_failed" });
});

test("SMTP token failure never opens a mail connection and does not fall back to Graph", async () => {
  let transports = 0;
  const mail = createMicrosoftSmtpMailer(env, async () => ({ ok: false }), () => { transports++; });
  await assert.rejects(mail("customer@example.com", message), { message: "mail_auth_failed" });
  assert.equal(transports, 0);
  let requests = 0;
  const selected = createMicrosoftMailer(env, async (url, init) => {
    requests++;
    assert.equal(init.body.get("scope"), "https://outlook.office365.com/.default");
    return { ok: false };
  });
  await assert.rejects(selected("customer@example.com", message), { message: "mail_auth_failed" });
  assert.equal(requests, 1);
  await assert.rejects(createMicrosoftMailer({ MS_MAIL_TRANSPORT: "unknown" })("customer@example.com", message), { message: "mail_transport_invalid" });
});

test("SMTP campaigns send one recipient per invocation to fit the serverless timeout", async () => {
  const db = memoryDb();
  const config = { ...env, MS_MAIL_TRANSPORT: undefined, NEWSLETTER_ADMIN_UIDS: "owner", NEWSLETTER_SITE_ORIGIN: "https://orora.example", NEWSLETTER_UNSUBSCRIBE_SECRET: "test-only-secret-at-least-32-characters" };
  for (const email of ["one@example.com", "two@example.com"]) await db.collection("newsletterSubscribers").doc(subscriberId(email)).set({ email, status: "active", consentAt: new Date(1000) });
  let sends = 0;
  const handler = createNewsletterAdminHandler({ getDb: async () => db, verifyToken: async () => ({ uid: "owner" }), sendMail: async () => { sends++; }, env: config });
  const call = async (body) => {
    const res = response();
    await handler({ method: "POST", headers: { origin: config.NEWSLETTER_SITE_ORIGIN, authorization: "Bearer test", "content-type": "application/json" }, body }, res);
    return res;
  };
  assert.equal((await call({ action: "createCampaign", id: "smtp-campaign", ...message })).statusCode, 200);
  const result = await call({ action: "sendBatch", id: "smtp-campaign" });
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.completed, false);
  assert.equal(sends, 1);
  assert.equal((await call({ action: "sendBatch", id: "smtp-campaign" })).body.completed, true);
  assert.equal(sends, 2);
});

test("SMTP auth diagnostic retains server codes without leaking raw responses or credentials", async () => {
  const mail = createMicrosoftSmtpMailer(env, tokenResponse, () => ({
    sendMail: async () => { throw Object.assign(new Error("private server details"), {
      code: "EAUTH", responseCode: 535,
      response: "535 5.7.139 Authentication unsuccessful, SmtpClientAuthentication is disabled for the Tenant. PRIVATE-CONTENT smtp-test-token test-secret",
    }); },
  }));
  let failure;
  try { await mail("customer@example.com", message); } catch (error) { failure = error; }
  assert.equal(failure.message, "mail_smtp_auth_failed");
  assert.deepEqual(failure.smtp, { responseCode: 535, enhancedCode: "5.7.139", reason: "smtp_auth_disabled" });
  assert.doesNotMatch(JSON.stringify(failure), /PRIVATE-CONTENT|smtp-test-token|test-secret/);

  const db = memoryDb();
  const config = { ...env, NEWSLETTER_ADMIN_UIDS: "owner", NEWSLETTER_SITE_ORIGIN: "https://orora.example", NEWSLETTER_UNSUBSCRIBE_SECRET: "test-only-secret-at-least-32-characters" };
  const handler = createNewsletterAdminHandler({ getDb: async () => db, verifyToken: async () => ({ uid: "owner", email: "owner@example.com" }), sendMail: async () => { throw failure; }, env: config });
  const res = response();
  await handler({ method: "POST", headers: { origin: config.NEWSLETTER_SITE_ORIGIN, authorization: "Bearer test", "content-type": "application/json" }, body: { action: "sendTest", ...message } }, res);
  assert.equal(res.statusCode, 503);
  assert.match(res.body.message, /535 5\.7\.139/);
  assert.equal(res.body.smtp.reason, "smtp_auth_disabled");
  assert.doesNotMatch(JSON.stringify(res.body), /PRIVATE-CONTENT|smtp-test-token|test-secret/);
});


test("missing or empty transport keeps SMTP OAuth2; Graph requires explicit selection", async () => {
  for (const value of [undefined, "", "   ", "smtp", " SMTP ", "graph"]) {
    const scopes = [];
    const mail = createMicrosoftMailer({ ...env, MS_MAIL_TRANSPORT: value }, async (_, init) => { scopes.push(init.body.get("scope")); return { ok: false }; });
    await assert.rejects(mail("buyer@example.com", message), { message: "mail_auth_failed" });
    assert.deepEqual(scopes, [value === "graph" ? "https://graph.microsoft.com/.default" : "https://outlook.office365.com/.default"]);
  }
});
