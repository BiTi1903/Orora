import { firebaseAuthFailure } from "./firebase-auth-error.js";
import { randomUUID } from "node:crypto";
import { DEFAULT_WELCOME, subscriberId, validateMessage, withUnsubscribe } from "./newsletter-content.js";

const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
const publicContact = (doc) => ({
  id: doc.id, email: doc.data().email, status: doc.data().status,
  mailStatus: doc.data().mailStatus || "", createdAt: millis(doc.data().createdAt),
});
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);

export function createNewsletterAdminHandler({ getDb, verifyToken, sendMail, env = process.env }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const reply = (status, data) => res.status(status).json(data);
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return reply(405, { message: "Phương thức không được hỗ trợ." });
    }
    const admins = (env.NEWSLETTER_ADMIN_UIDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (!admins.length) return reply(503, { message: "Chưa cấu hình NEWSLETTER_ADMIN_UIDS trên máy chủ." });
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
    let user;
    try {
      user = token ? await verifyToken(token) : null;
    } catch (error) {
      const failure = firebaseAuthFailure(error);
      const sdkCode = /^(auth|app)\/[a-z0-9-]+$/.test(error.code || "") ? error.code : undefined;
      console.error("Newsletter authentication failed", { code: failure.code, sdkCode });
      return reply(failure.status, { code: failure.code, message: failure.message });
    }
    if (!user) return reply(401, { message: "Vui lòng đăng nhập lại." });
    if (!admins.includes(user.uid)) return reply(403, { message: "Tài khoản này chưa được cấp quyền gửi email." });
    if (req.method === "POST") {
      let origin;
      try { origin = new URL(env.NEWSLETTER_SITE_ORIGIN).origin; } catch { return reply(503, { message: "Thiếu NEWSLETTER_SITE_ORIGIN." }); }
      if (req.headers.origin !== origin) return reply(403, { message: "Tên miền gửi yêu cầu không hợp lệ." });
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) return reply(415, { message: "Chỉ nhận dữ liệu JSON." });
      if (Number(req.headers["content-length"] || 0) > 40000) return reply(413, { message: "Nội dung quá dài." });
    }
    try {
      const db = await getDb();
      const settings = db.collection("newsletterSettings").doc("welcome");
      const campaigns = db.collection("newsletterCampaigns");
      const contacts = db.collection("newsletterSubscribers");
      if (req.method === "GET") {
        const cursor = req.query?.cursor;
        if (cursor && !/^[a-f0-9]{64}$/.test(cursor)) return reply(400, { message: "Trang không hợp lệ." });
        let query = contacts.orderBy("__name__").limit(50);
        if (cursor) query = query.startAfter(cursor);
        const [page, welcome, history] = await Promise.all([
          query.get(), settings.get(), campaigns.orderBy("createdAt", "desc").limit(20).get(),
        ]);
        return reply(200, {
          contacts: page.docs.map(publicContact),
          nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null,
          welcome: welcome.exists ? validateMessage(welcome.data()) : DEFAULT_WELCOME,
          campaigns: history.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: millis(doc.data().createdAt) })),
        });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || JSON.stringify(body).length > 40000) return reply(400, { message: "Dữ liệu không hợp lệ." });
      if (body.action === "saveWelcome") {
        const message = validateMessage(body);
        await settings.set({ ...message, updatedAt: new Date(), updatedBy: user.uid });
        return reply(200, { message: "Đã lưu mẫu thư gửi cho người đăng ký mới." });
      }
      if (body.action === "unsubscribe") {
        if (!/^[a-f0-9]{64}$/.test(body.id || "")) return reply(400, { message: "Email không hợp lệ." });
        const ref = contacts.doc(body.id);
        await db.runTransaction(async (tx) => {
          if ((await tx.get(ref)).exists) tx.set(ref, { status: "unsubscribed", unsubscribedAt: new Date(), updatedAt: new Date() }, { merge: true });
        });
        return reply(200, { message: "Đã ngừng gửi đến email này." });
      }
      if (body.action === "sendTest") {
        const rawEmail = body.testEmail === undefined ? user.email : body.testEmail;
        const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
        if (email.length > 254 || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email)) {
          return reply(400, { message: "Nhập một địa chỉ email hợp lệ để nhận thư thử." });
        }
        await sendMail(email, withUnsubscribe(validateMessage(body), subscriberId(email), env));
        return reply(200, { message: `Microsoft đã nhận thư thử gửi tới ${email}. Kiểm tra cả mục thư rác.` });
      }
      if (!["createCampaign", "sendBatch"].includes(body.action) || !validId(body.id)) return reply(400, { message: "Thao tác không hợp lệ." });
      if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) return reply(503, { message: "Chưa cấu hình Microsoft 365 trên máy chủ." });
      // Validate signing/origin settings before reserving a recipient or creating a campaign.
      withUnsubscribe(DEFAULT_WELCOME, "0".repeat(64), env);
      const campaign = campaigns.doc(body.id);
      if (body.action === "createCampaign") {
        const message = validateMessage(body);
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(campaign);
          if (existing.exists) {
            const saved = existing.data();
            if (saved.subject !== message.subject || saved.text !== message.text) throw new Error("campaign_conflict");
            return;
          }
          tx.set(campaign, { ...message, createdAt: new Date(), createdBy: user.uid, status: "draft", cursor: null, accepted: 0, failed: 0, unknown: 0 });
        });
        return reply(200, { id: body.id, message: "Đã tạo chiến dịch. Chưa gửi email." });
      }
      const lease = randomUUID();
      const state = await db.runTransaction(async (tx) => {
        const saved = await tx.get(campaign);
        if (!saved.exists) throw new Error("campaign_missing");
        const data = saved.data();
        if (data.status === "completed") return data;
        if (data.leaseUntil > Date.now()) throw new Error("campaign_busy");
        tx.set(campaign, { lease, leaseUntil: Date.now() + 120000, status: "sending" }, { merge: true });
        return data;
      });
      if (state.status === "completed") return reply(200, { completed: true, campaign: { id: body.id, ...state } });
      let query = contacts.orderBy("__name__").limit(20);
      if (state.cursor) query = query.startAfter(state.cursor);
      let sent = 0;
      let paused = false;
      let cursor = state.cursor;
      try {
        const page = await query.get();
        for (const doc of page.docs) {
          const delivery = campaign.collection("deliveries").doc(doc.id);
          const claim = await db.runTransaction(async (tx) => {
            const [current, prior, person] = await tx.getAll(campaign, delivery, contacts.doc(doc.id));
            if (current.data().lease !== lease) throw new Error("campaign_busy");
            if (prior.exists) {
              if (prior.data().status === "sending") {
                tx.set(delivery, { status: "unknown", updatedAt: new Date() }, { merge: true });
                tx.set(campaign, { unknown: (current.data().unknown || 0) + 1 }, { merge: true });
              }
              return null;
            }
            const contact = person.data();
            if (!contact || contact.status !== "active" || millis(contact.consentAt || contact.createdAt) > millis(state.createdAt)) return null;
            tx.set(delivery, { status: "sending", email: contact.email, startedAt: new Date() });
            return contact;
          });
          if (claim) {
            let result = "accepted";
            try {
              await sendMail(claim.email, withUnsubscribe(state, doc.id, env));
            } catch (error) {
              // A timeout may happen AFTER Microsoft accepts a message. Never resend it automatically.
              result = ["mail_auth_failed", "mail_send_failed", "mail_configuration_missing"].includes(error.message) ? "failed" : "unknown";
              paused = true;
            }
            await db.runTransaction(async (tx) => {
              const current = await tx.get(campaign);
              if (current.data().lease !== lease) throw new Error("campaign_busy");
              tx.set(delivery, { status: result, updatedAt: new Date() }, { merge: true });
              tx.set(campaign, { [result]: (current.data()[result] || 0) + 1 }, { merge: true });
            });
            sent += 1;
          }
          cursor = doc.id;
          if (paused || sent >= 2) break;
        }
        const completed = !paused && page.docs.length < 20 && (!page.docs.length || cursor === page.docs.at(-1).id);
        await db.runTransaction(async (tx) => {
          const current = await tx.get(campaign);
          if (current.data().lease !== lease) throw new Error("campaign_busy");
          tx.set(campaign, { cursor, status: completed ? "completed" : "paused", leaseUntil: 0, updatedAt: new Date() }, { merge: true });
        });
        const saved = (await campaign.get()).data();
        return reply(200, { completed, paused, campaign: { id: body.id, ...saved } });
      } catch (error) {
        // Release only our lease. Reserved deliveries remain non-retryable if their outcome is unknown.
        await db.runTransaction(async (tx) => {
          const current = await tx.get(campaign);
          if (current.data()?.lease === lease) tx.set(campaign, { status: "paused", leaseUntil: 0 }, { merge: true });
        });
        throw error;
      }
    } catch (error) {
      const messages = {
        mail_auth_failed: [503, "Microsoft từ chối xác thực. Kiểm tra Tenant ID, Client ID và Client Secret (giá trị, không phải Secret ID)."],
        mail_send_failed: [503, "Microsoft chưa chấp nhận gửi thư. Kiểm tra quyền Application Mail.Send, admin consent, phạm vi hộp thư và hạn mức gửi."],
        mail_configuration_missing: [503, "Thiếu cấu hình Microsoft 365 trên máy chủ."],
        invalid_message: [400, "Nhập tiêu đề (tối đa 200 ký tự) và nội dung (tối đa 20.000 ký tự)."],
        campaign_conflict: [409, "Mã chiến dịch đã dùng cho nội dung khác."],
        campaign_missing: [404, "Không tìm thấy chiến dịch."],
        campaign_busy: [409, "Chiến dịch đang gửi ở một phiên khác. Vui lòng chờ tối đa 2 phút rồi tải lại."],
        unsubscribe_configuration_missing: [503, "Chưa cấu hình NEWSLETTER_UNSUBSCRIBE_SECRET (ít nhất 32 ký tự)."],
      };
      const [status, message] = messages[error.message] || [503, "Chưa thực hiện được. Kiểm tra cấu hình Firebase/Microsoft trên máy chủ và thử lại."];
      return reply(status, { message });
    }
  };
}
