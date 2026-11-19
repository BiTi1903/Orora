import { createHash, randomUUID } from "node:crypto";
import { safeMailTracking } from "./mail-tracking.js";
import { rateLimitSalt, reserveBudgetOrAllow } from "./request-limits.js";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const SUCCESS_MESSAGE = "Đăng ký nhận tin thành công. Cảm ơn bạn đã quan tâm ORORA!";

export function createSubscribeHandler({ getDb, sendWelcome, schedule, env = process.env, clock = Date.now }) {
  return async function subscribe(req, res) {
    res.setHeader("Cache-Control", "no-store");
    const reply = (status, message) => res.status(status).json({ ok: status === 200, message });
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return reply(405, "Phương thức không được hỗ trợ."); }
    let origin;
    try { origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin; }
    catch { return reply(503, "Tính năng đăng ký chưa được cấu hình."); }
    if (req.headers.origin !== origin) return reply(403, "Vui lòng đăng ký trực tiếp trên website ORORA.");
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) return reply(415, "Dữ liệu đăng ký không hợp lệ.");
    if (Number(req.headers["content-length"] || 0) > 2048) return reply(413, "Dữ liệu quá dài.");
    let body;
    try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; }
    catch { return reply(400, "Dữ liệu đăng ký không hợp lệ."); }
    if (!body || typeof body !== "object" || Buffer.byteLength(JSON.stringify(body)) > 2048) return reply(400, "Dữ liệu đăng ký không hợp lệ.");
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email) || email.length > 254 || body.consent !== true) return reply(400, "Vui lòng nhập email hợp lệ và đồng ý đăng ký nhận tin.");
    const attempt = randomUUID(); let subscriber;
    try {
      const db = await getDb(); subscriber = db.collection("newsletterSubscribers").doc(hash(email));
      const salt = rateLimitSalt(env);
      if (salt) {
        const now = clock();
        const wait = await reserveBudgetOrAllow(db, req, { scope: "subscribe", cost: 1, budget: 5, now, salt })
          || await reserveBudgetOrAllow(db, req, { scope: "subscribe-email", cost: 1, budget: 3, windowMs: 3600000, now, salt, key: email });
        if (wait) { res.setHeader("Retry-After", String(wait)); return reply(429, "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau."); }
      }
      const action = await db.runTransaction(async (tx) => {
        const saved = await tx.get(subscriber); const prior = saved.data() || {};
        // Repeated submissions succeed without duplicating mail already accepted,
        // in progress or with an uncertain outcome. No IP/site cooldown applies.
        if (prior.status === "active" && ["accepted", "pending", "unknown"].includes(prior.mailStatus)) return "exists";
        const now = new Date();
        tx.set(subscriber, { email, status: "active", source: "website-newsletter", consentVersion: "newsletter-v1", consentAt: now, createdAt: prior.createdAt || now, updatedAt: now, mailStatus: "pending", attempt }, { merge: true });
        return "send";
      });
      if (action === "exists") return reply(200, SUCCESS_MESSAGE);
    } catch {
      console.error("Newsletter: database reservation failed");
      return reply(503, "Chưa lưu được đăng ký. Vui lòng thử lại sau.");
    }
    const completeWelcome = async () => {
      try {
        const result = await sendWelcome(email);
        const tracking = safeMailTracking(result);
        try {
          await subscriber.set({ mailStatus: "accepted", ...(tracking.trackingId ? { welcomeTracking: { ...tracking, createdAt: result.createdAt || new Date().toISOString(), ...(result.subject ? { subject: result.subject } : {}) }, outlook: null } : {}), mailAcceptedAt: new Date(), updatedAt: new Date() }, { merge: true });
        } catch { console.error("Newsletter: mail accepted, status update failed"); }
        return { status: 200, message: SUCCESS_MESSAGE };
      } catch (error) {
        const known = ["mail_auth_failed", "mail_send_failed", "mail_configuration_missing", "mail_smtp_auth_failed", "mail_smtp_connection_failed", "mail_transport_invalid", "unsubscribe_configuration_missing", "invalid_message"].includes(error.message);
        const tracking = safeMailTracking(error.mailTracking);
        try { await subscriber.set({ mailStatus: known ? "failed" : "unknown", ...(tracking.trackingId ? { welcomeTracking: { ...tracking, createdAt: new Date().toISOString() }, outlook: null } : {}), updatedAt: new Date() }, { merge: true }); }
        catch { console.error("Newsletter: could not record mail failure"); }
        console.error("Newsletter: mail request failed");
        return { status: 503, message: "Đã lưu email, nhưng chưa xác nhận được việc gửi thư. Vui lòng kiểm tra hộp thư hoặc liên hệ ORORA." };
      }
    };
    const task = completeWelcome();
    if (schedule) {
      try { schedule(task); return reply(200, SUCCESS_MESSAGE); }
      catch { /* If background support is unavailable, finish the same task once. */ }
    }
    const result = await task;
    return reply(result.status, result.message);
  };
}
