import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createMicrosoftSmtpMailer } from "../server/microsoft-smtp.js";
import { sendWelcomeMessage, subscriberId } from "../server/newsletter-content.js";
import { createSubscribeHandler } from "../server/newsletter.js";
import { createNewsletterAdminHandler } from "../server/newsletter-admin.js";
import { createAdminOrdersHandler } from "../server/orders.js";
import { describeMailError } from "../server/mail-error.js";
import { memoryDb, response } from "./firestore-memory.js";
const env = { NEWSLETTER_SITE_ORIGIN: "https://orora.example", NEWSLETTER_ADMIN_UIDS: "owner", NEWSLETTER_UNSUBSCRIBE_SECRET: "test-only-signing-secret-at-least-32-characters", MS_TENANT_ID: "tenant", MS_CLIENT_ID: "client", MS_CLIENT_SECRET: "secret", MS_SENDER_EMAIL: "sales@ororavn.com", MS_MAIL_TRANSPORT: "smtp" };
const headers = { origin: env.NEWSLETTER_SITE_ORIGIN, "content-type": "application/json", authorization: "Bearer test" };
for (const reject of [false, true]) test(`registration, manual order and private mail share SMTP sender and expose rejection safely: ${reject}`, async () => {
  const db = memoryDb(); const submissions = []; const tasks = [];
  const sendMail = createMicrosoftSmtpMailer(env, async () => ({ ok: true, json: async () => ({ access_token: "test-token" }) }), () => ({
    async sendMail(mail) {
      submissions.push(mail);
      if (reject) throw Object.assign(new Error("DO-NOT-EXPOSE-SECRET"), { responseCode: 550, response: "550 5.7.708 DO-NOT-EXPOSE-SECRET" });
      return { accepted: mail.envelope.to };
    }, close() {},
  }));
  const getDb = async () => db;
  const verifyToken = async () => ({ uid: "owner", email: "owner@example.com" });
  const admin = createNewsletterAdminHandler({ getDb, verifyToken, sendMail, env });
  const orderAdmin = createAdminOrdersHandler({ getDb, verifyToken, sendMail, env });
  const call = async (handler, body) => { const res = response(); await handler({ method: "POST", headers, body }, res); return res; };
  const email = "buyer@example.com";
  const signup = createSubscribeHandler({ getDb, env, schedule: (task) => tasks.push(task), sendWelcome: (email) => sendWelcomeMessage(email, { getDb, sendMail, env }) });
  assert.equal((await call(signup, { email, consent: true })).statusCode, 200);
  await Promise.all(tasks);
  const id = subscriberId(email);
  assert.equal((await db.collection("newsletterSubscribers").doc(id).get()).data().mailStatus, reject ? "failed" : "accepted");
  const orderId = randomUUID();
  await db.collection("orders").doc(orderId).set({ code: "OR-TEST", customer: { name: "Buyer", email, phone: "0900000000", address: "Test" }, product: { name: "Product" }, quantity: 1, subtotal: 100000, paymentMethod: "cod", createdAt: new Date() });
  const orderResult = await call(orderAdmin, { action: "sendOrderEmail", id: orderId, requestId: randomUUID(), message: { subject: "Đơn {{orderCode}}", text: "Chào {{customerName}}" } });
  assert.equal(orderResult.statusCode, 200);
  assert.equal(orderResult.body.state, reject ? "failed" : "accepted");
  const campaignId = randomUUID();
  assert.equal((await call(admin, { action: "createCampaign", id: campaignId, subject: "Thư riêng", text: "Chào bạn", recipientIds: [id] })).statusCode, 200);
  const campaignResult = await call(admin, { action: "sendBatch", id: campaignId });
  assert.equal(campaignResult.statusCode, 200);
  assert.equal(campaignResult.body.campaign[reject ? "failed" : "accepted"], 1);
  assert.equal(submissions.length, 3);
  for (const mail of submissions) assert.deepEqual(mail.envelope, { from: "sales@ororavn.com", to: [email] });
  assert.equal(submissions[1].subject, "Đơn OR-TEST");
  if (reject) {
    assert.match(orderResult.body.message, /550 5\.7\.708/);
    assert.match(campaignResult.body.message, /550 5\.7\.708/);
    const delivery = await call(admin, { action: "campaignDeliveryStatuses", id: campaignId });
    assert.match(delivery.body.deliveries[0].errorMessage, /550 5\.7\.708/);
    assert.ok(!JSON.stringify([orderResult.body, campaignResult.body, delivery.body]).includes("DO-NOT-EXPOSE"));
  }
});
test("unknown mail errors never expose provider response or arbitrary diagnostic fields", () => {
  const result = describeMailError(Object.assign(new Error("SECRET"), { smtp: { responseCode: 550, enhancedCode: "SECRET" }, secret: "SECRET" }));
  assert.equal(result.errorCode, "mail_outcome_unknown");
  assert.ok(!JSON.stringify(result).includes("SECRET"));
});
