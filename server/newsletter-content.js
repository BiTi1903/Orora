import { recordTemplateUse } from "./template-snapshot.js";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_WELCOME = {
  subject: "Bạn đã đăng ký nhận tin từ ORORA",
  text: `Chào bạn,

Cảm ơn bạn đã đăng ký nhận tin từ ORORA. Từ nay, bạn sẽ nhận được thông tin về sản phẩm chăm sóc cơ thể mới và các chương trình ưu đãi qua địa chỉ email này.

Ghé thăm ORORA tại https://ororavn.com để khám phá các sản phẩm hiện có.

Nếu có câu hỏi về sản phẩm, bạn có thể trả lời email này để được hỗ trợ.

Thân mến,
Đội ngũ ORORA
sales@ororavn.com`,
};

export const subscriberId = (email) => createHash("sha256").update(email).digest("hex");

export function validateMessage(value) {
  const subject = typeof value?.subject === "string" ? value.subject.trim() : "";
  const text = typeof value?.text === "string" ? value.text : "";
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject) || !text.trim() || text.length > 20000) {
    throw new Error("invalid_message");
  }
  return { subject, text };
}

function signature(id, env) {
  if (!env.NEWSLETTER_UNSUBSCRIBE_SECRET || env.NEWSLETTER_UNSUBSCRIBE_SECRET.length < 32) {
    throw new Error("unsubscribe_configuration_missing");
  }
  return createHmac("sha256", env.NEWSLETTER_UNSUBSCRIBE_SECRET).update(id).digest("hex");
}

export function unsubscribeLink(id, env = process.env) {
  const origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin;
  return `${origin}/api/unsubscribe?id=${id}&token=${signature(id, env)}`;
}

export function validUnsubscribe(id, token, env = process.env) {
  if (!/^[a-f0-9]{64}$/.test(id || "") || !/^[a-f0-9]{64}$/.test(token || "")) return false;
  return timingSafeEqual(Buffer.from(signature(id, env), "hex"), Buffer.from(token, "hex"));
}

export function withUnsubscribe(message, id, env = process.env) {
  if (!id || !env?.NEWSLETTER_UNSUBSCRIBE_SECRET || env.NEWSLETTER_UNSUBSCRIBE_SECRET.length < 32 || !env?.NEWSLETTER_SITE_ORIGIN) {
    throw new Error("unsubscribe_configuration_missing");
  }
  let link;
  try { link = unsubscribeLink(id, env); } catch { throw new Error("unsubscribe_configuration_missing"); }
  const text = message.text.includes(link) ? message.text : `${message.text.trimEnd()}\n\n---\nHủy đăng ký nhận tin từ ORORA: ${link}`;
  return { ...message, text, unsubscribeUrl: link };
}

export async function sendWelcomeMessage(email, { getDb, sendMail, env = process.env }) {
  const db = await getDb();
  const saved = await db.collection("newsletterSettings").doc("welcome").get();
  const base = saved.exists ? validateMessage(saved.data()) : DEFAULT_WELCOME;
  const message = withUnsubscribe(base, subscriberId(String(email || "").trim().toLowerCase()), env);
  const result = await sendMail(email, message);
  if (saved.data()?.templateId) {
    try { await db.runTransaction((tx) => recordTemplateUse(tx, db, saved.data())); }
    catch { console.error("Welcome template usage could not be recorded"); }
  }
  return result?.trackingId ? { ...result, subject: message.subject, createdAt: new Date().toISOString() } : result;
}
