import { recordTemplateUse } from "./template-snapshot.js";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { renderBrandedEmailHtml, renderWelcomeEmailHtml } from "../src/lib/mail-html.js";

export const DEFAULT_WELCOME = {
  subject: "Chào mừng bạn đến với ORORA – Hành trình nâng niu làn da",
  text: "Chào bạn,\n\nCảm ơn bạn đã đăng ký nhận bản tin từ ORORA. Chúng mình rất vui được đồng hành cùng bạn trên hành trình chăm sóc làn da dịu nhẹ và tinh tế mỗi ngày.\n\nKhi là thành viên nhận tin từ ORORA, bạn sẽ nhận được:\n- Thông tin sớm nhất về các dòng sản phẩm chăm sóc da mới ra mắt\n- Ưu đãi và quà tặng dành riêng cho người đăng ký\n- Gợi ý chu trình dưỡng da và hướng dẫn chăm sóc phù hợp\n\nNếu bạn cần tư vấn chọn sản phẩm phù hợp với làn da của mình, chỉ cần trả lời trực tiếp email này — đội ngũ ORORA luôn sẵn sàng lắng nghe.\n\nThân mến,\nORORA Vietnam\nsales@ororavn.com",
};

export const subscriberId = (email) => createHash("sha256").update(email).digest("hex");

import { mailDesign } from "../src/lib/mail-design.js";

export function validateMessage(value) {
  const subject = typeof value?.subject === "string" ? value.subject.trim() : "";
  const text = typeof value?.text === "string" ? value.text : "";
  if (!subject || subject.length > 200 || /[\r\n]/.test(subject) || !text.trim() || text.length > 20000) {
    throw new Error("invalid_message");
  }
  const design=value.design ? mailDesign(value.design) : null;
  for (const card of design?.products || []) {
    if (!card.name.trim() || !URL.canParse(card.url) || new URL(card.url).protocol !== "https:" ||
        (card.image && (!URL.canParse(card.image) || new URL(card.image).protocol !== "https:"))) throw new Error("invalid_product_card");
  }
  return { subject, text, ...(design ? {design} : {}) };
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

export function withUnsubscribe(message, id, env = process.env, { kind = "campaign" } = {}) {
  if (!id || !env?.NEWSLETTER_UNSUBSCRIBE_SECRET || env.NEWSLETTER_UNSUBSCRIBE_SECRET.length < 32 || !env?.NEWSLETTER_SITE_ORIGIN) {
    throw new Error("unsubscribe_configuration_missing");
  }
  let link;
  let origin;
  try {
    origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin;
    link = unsubscribeLink(id, env);
  } catch { throw new Error("unsubscribe_configuration_missing"); }
  const productText = (message.design?.products || []).map(card=>[card.name,card.description,card.showPrice && card.price,card.url].filter(Boolean).join("\n")).join("\n\n");
  const bodyText = [message.text.trimEnd(),productText].filter(Boolean).join("\n\n");
  const text = message.text.includes(link) ? message.text : `${bodyText}\n\n---\nHủy đăng ký nhận tin từ ORORA: ${link}`;
  const contactEmail = env.MS_SENDER_EMAIL || "sales@ororavn.com";
  const html = message.html || (kind === "welcome"
    ? renderWelcomeEmailHtml({ ...message, unsubscribeUrl: link, siteOrigin: origin, contactEmail })
    : renderBrandedEmailHtml({ ...message, unsubscribeUrl: link, siteOrigin: origin, contactEmail }));
  return { ...message, text, html, unsubscribeUrl: link };
}

export async function sendWelcomeMessage(email, { getDb, sendMail, env = process.env }) {
  const db = await getDb();
  const saved = await db.collection("newsletterSettings").doc("welcome").get();
  const base = saved.exists ? validateMessage(saved.data()) : DEFAULT_WELCOME;
  const message = withUnsubscribe(base, subscriberId(String(email || "").trim().toLowerCase()), env, { kind: "welcome" });
  const result = await sendMail(email, message);
  if (saved.data()?.templateId) {
    try { await db.runTransaction((tx) => recordTemplateUse(tx, db, saved.data())); }
    catch { console.error("Welcome template usage could not be recorded"); }
  }
  return result?.trackingId ? { ...result, subject: message.subject, createdAt: new Date().toISOString() } : result;
}
