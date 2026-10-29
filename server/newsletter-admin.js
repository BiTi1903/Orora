import { mailActor, resolveMailActors } from "./mail-actor.js";
import { DEFAULT_ORDER_MESSAGE, validateOrderTemplate } from "./order-mail.js";
import { firebaseAuthFailure } from "./firebase-auth-error.js";
import { randomUUID } from "node:crypto";
import { DEFAULT_WELCOME, validateMessage } from "./newsletter-content.js";

const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
const publicContact = (doc) => ({
  id: doc.id, email: doc.data().email, status: doc.data().status,
  mailStatus: doc.data().mailStatus || "", createdAt: millis(doc.data().createdAt),
});
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);

export function createNewsletterAdminHandler({ getDb, verifyToken, sendMail, lookupUser, env = process.env }) {
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
      if (req.method === "GET" && req.query?.templates === "1") {
        const cursor = req.query.cursor;
        if (cursor && !validId(cursor)) return reply(400, { message: "Trang mẫu thư không hợp lệ." });
        let query = db.collection("newsletterTemplates").orderBy("__name__").limit(50);
        if (cursor) query = query.startAfter(cursor);
        const page = await query.get();
        return reply(200, { templates: page.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: millis(doc.data().createdAt), updatedAt: millis(doc.data().updatedAt) })), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      if (req.method === "GET") {
        const cursor = req.query?.cursor;
        if (cursor && !/^[a-f0-9]{64}$/.test(cursor)) return reply(400, { message: "Trang không hợp lệ." });
        let query = contacts.orderBy("__name__").limit(50);
        if (cursor) query = query.startAfter(cursor);
        const [page, welcome, history, orderTemplate] = await Promise.all([
          query.get(), settings.get(), campaigns.orderBy("createdAt", "desc").limit(20).get(),
          db.collection("newsletterSettings").doc("orderConfirmation").get(),
        ]);
        const emailCache = new Map();
        const campaignHistory = await Promise.all(history.docs.map(async (doc) => {
          const data = doc.data();
          let recipientEmails = data.recipientEmails;
          if (data.recipientIds && !Array.isArray(recipientEmails)) {
            recipientEmails = await Promise.all(data.recipientIds.map(async (id) => {
              if (!emailCache.has(id)) emailCache.set(id, contacts.doc(id).get().then((person) => person.data()?.email || ""));
              return emailCache.get(id);
            }));
          }
          return { id: doc.id, ...data, ...(recipientEmails ? { recipientEmails } : {}), actor: data.actor || data.createdBy || "", manual: true, createdAt: millis(data.createdAt) };
        }));
        return reply(200, {
          contacts: page.docs.map(publicContact),
          nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null,
          orderTemplate: orderTemplate.exists ? { subject: String(orderTemplate.data().subject || ""), text: String(orderTemplate.data().text || "") } : DEFAULT_ORDER_MESSAGE,
          welcome: welcome.exists ? validateMessage(welcome.data()) : DEFAULT_WELCOME,
          campaigns: await resolveMailActors(campaignHistory, lookupUser),
        });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || JSON.stringify(body).length > 40000) return reply(400, { message: "Dữ liệu không hợp lệ." });
      if (body.action === "saveLibraryTemplate") {
        if (!validId(body.id) || typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100 || !["general", "order"].includes(body.kind)) return reply(400, { message: "Nhập tên mẫu (tối đa 100 ký tự) và chọn loại mẫu hợp lệ." });
        const message = body.kind === "order" ? validateOrderTemplate(body) : validateMessage(body);
        const ref = db.collection("newsletterTemplates").doc(body.id);
        await db.runTransaction(async (tx) => {
          const saved = await tx.get(ref); const updatedAt = new Date();
          tx.set(ref, { name: body.name.trim(), kind: body.kind, ...message, ...mailActor(user), createdAt: saved.exists ? saved.data().createdAt : updatedAt, updatedAt });
        });
        return reply(200, { id: body.id, message: "Đã lưu vào Mẫu Thư. Chưa gửi email hoặc thay đổi mẫu tự động." });
      }
      if (body.action === "saveOrderTemplate") {
        let message;
        try { message = validateOrderTemplate(body); } catch { return reply(400, { message: "Kiểm tra tiêu đề, nội dung và tên biến trong mẫu thư đơn hàng." }); }
        await db.collection("newsletterSettings").doc("orderConfirmation").set({ ...message, updatedAt: new Date(), updatedBy: user.uid });
        return reply(200, { message: "Đã lưu mẫu thư xác nhận đơn hàng." });
      }
      if (body.action === "saveWelcome") {
        const message = validateMessage(body);
        await settings.set({ ...message, updatedAt: new Date(), updatedBy: user.uid });
        return reply(200, { message: "Đã lưu mẫu thư gửi cho người đăng ký mới." });
      }
      if (body.action === "manageContacts") {
        const operations = { activate: "active", pause: "paused", delete: "deleted" };
        if (!Object.hasOwn(operations, body.operation) || !Array.isArray(body.ids) || !body.ids.length || body.ids.length > 100 || body.ids.some((id) => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id))) {
          return reply(400, { message: "Chọn thao tác hợp lệ và từ 1 đến 100 email mỗi lần." });
        }
        const ids = [...new Set(body.ids)];
        const updated = await db.runTransaction(async (tx) => {
          const refs = ids.map((id) => contacts.doc(id));
          const snapshots = await tx.getAll(...refs);
          const changed = [];
          snapshots.forEach((snapshot, index) => {
            if (!snapshot.exists) return;
            if (body.operation === "delete") tx.delete(refs[index]);
            else tx.set(refs[index], { status: operations[body.operation], updatedAt: new Date(), updatedBy: user.uid }, { merge: true });
            changed.push({ id: ids[index], status: operations[body.operation] });
          });
          return changed;
        });
        const labels = { activate: "chuyển sang hoạt động", pause: "tạm ngưng", delete: "xóa khỏi danh sách" };
        return reply(200, { updated, message: `Đã ${labels[body.operation]} ${updated.length} email.` });
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
          return reply(400, { message: "Nhập một địa chỉ email hợp lệ để nhận thư." });
        }
        await sendMail(email, validateMessage(body));
        return reply(200, { message: `Microsoft đã nhận thư gửi tới ${email}. Kiểm tra cả mục thư rác.` });
      }
      if (!["createCampaign", "sendBatch"].includes(body.action) || !validId(body.id)) return reply(400, { message: "Thao tác không hợp lệ." });
      if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) return reply(503, { message: "Chưa cấu hình Microsoft 365 trên máy chủ." });
      const campaign = campaigns.doc(body.id);
      if (body.action === "createCampaign") {
        const message = validateMessage(body);
        const recipientIds = body.recipientIds === undefined ? null : body.recipientIds;
        if (recipientIds !== null && (!Array.isArray(recipientIds) || !recipientIds.length || recipientIds.length > 100 || recipientIds.some((id) => typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)))) return reply(400, { message: "Chọn từ 1 đến 100 email đang hoạt động." });
        const recipients = recipientIds === null ? null : [...new Set(recipientIds)].sort();
        await db.runTransaction(async (tx) => {
          const existing = await tx.get(campaign);
          if (existing.exists) {
            const saved = existing.data();
            if (saved.subject !== message.subject || saved.text !== message.text || JSON.stringify(saved.recipientIds || null) !== JSON.stringify(recipients)) throw new Error("campaign_conflict");
            return;
          }
          let recipientEmails = null;
          if (recipients) {
            const people = await tx.getAll(...recipients.map((id) => contacts.doc(id)));
            if (people.some((person) => !person.exists || person.data().status !== "active")) throw new Error("invalid_recipients");
            recipientEmails = people.map((person) => person.data().email);
          }
          tx.set(campaign, { ...message, recipientIds: recipients, recipientEmails, createdAt: new Date(), createdBy: user.uid, ...mailActor(user), status: "draft", cursor: null, accepted: 0, failed: 0, unknown: 0 });
        });
        return reply(200, { id: body.id, message: "Đã tạo thư. Chưa gửi email." });
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
        const page = state.recipientIds
          ? { docs: await Promise.all(state.recipientIds.filter((id) => !state.cursor || id > state.cursor).slice(0, 20).map((id) => contacts.doc(id).get())) }
          : await query.get();
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
              await sendMail(claim.email, validateMessage(state));
            } catch (error) {
              // A timeout may happen AFTER Microsoft accepts a message. Never resend it automatically.
              result = ["mail_auth_failed", "mail_send_failed", "mail_configuration_missing", "mail_smtp_auth_failed", "mail_smtp_connection_failed", "mail_transport_invalid"].includes(error.message) ? "failed" : "unknown";
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
          if (paused || sent >= (env.MS_MAIL_TRANSPORT?.trim().toLowerCase() === "smtp" ? 1 : 2)) break;
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
      if (error.message === "mail_smtp_auth_failed" && error.smtp) {
        const hints = {
          smtp_auth_disabled: "Microsoft báo SMTP AUTH vẫn bị vô hiệu hóa. Đối chiếu cấu hình hộp thư và chính sách tổ chức trước khi thay đổi.",
          security_policy: "Microsoft báo bị chặn bởi chính sách bảo mật. Không tự tắt MFA hoặc bảo mật toàn tổ chức.",
          access_token_invalid: "Microsoft báo token không hợp lệ hoặc hết hạn. Kiểm tra quyền SMTP của ứng dụng.",
          authentication_rejected: "Kiểm tra SMTP.SendAsApp, consent, service principal và quyền hộp thư trong Exchange.",
        };
        const codes = [error.smtp.responseCode, error.smtp.enhancedCode].filter(Boolean).join(" ");
        console.error("Newsletter SMTP authentication rejected", error.smtp);
        return reply(503, {
          code: "mail_smtp_auth_failed",
          smtp: error.smtp,
          message: `SMTP OAuth2 bị từ chối${codes ? ` (${codes})` : ""}. ${hints[error.smtp.reason] || hints.authentication_rejected}`,
        });
      }
      const messages = {
        mail_transport_invalid: [503, "MS_MAIL_TRANSPORT phải là smtp hoặc graph."],
        mail_smtp_auth_failed: [503, "SMTP OAuth2 bị từ chối. Kiểm tra Application SMTP.SendAsApp, admin consent, service principal và quyền hộp thư trong Exchange, cùng SMTP AUTH của hộp thư."],
        mail_smtp_connection_failed: [503, "Chưa kết nối được smtp.office365.com:587 bằng STARTTLS. Kiểm tra kết nối đi ra từ máy chủ."],
        mail_smtp_outcome_unknown: [503, "Kết nối SMTP bị gián đoạn, chưa rõ thư đã được nhận hay chưa. Kiểm tra hộp thư trước khi gửi lại."],
        mail_auth_failed: [503, "Microsoft từ chối xác thực. Kiểm tra Tenant ID, Client ID và Client Secret (giá trị, không phải Secret ID)."],
        mail_send_failed: [503, "Microsoft chưa chấp nhận gửi thư. Kiểm tra quyền của phương thức gửi đang chọn, admin consent, phạm vi hộp thư và hạn mức gửi."],
        mail_configuration_missing: [503, "Thiếu cấu hình Microsoft 365 trên máy chủ."],
        invalid_order_token: [400, "Tên biến trong mẫu đơn hàng chưa hợp lệ."],
        invalid_message: [400, "Nhập tiêu đề (tối đa 200 ký tự) và nội dung (tối đa 20.000 ký tự)."],
        invalid_recipients: [400, "Một email đã ngừng hoạt động hoặc bị xóa. Tải lại danh sách người nhận trước khi gửi."],
        campaign_conflict: [409, "Mã thư đã dùng cho nội dung khác."],
        campaign_missing: [404, "Không tìm thấy thư."],
        campaign_busy: [409, "Thư đang được gửi ở một phiên khác. Vui lòng chờ tối đa 2 phút rồi tải lại."],
        unsubscribe_configuration_missing: [503, "Chưa cấu hình NEWSLETTER_UNSUBSCRIBE_SECRET (ít nhất 32 ký tự)."],
      };
      const [status, message] = messages[error.message] || [503, "Chưa thực hiện được. Kiểm tra cấu hình Firebase/Microsoft trên máy chủ và thử lại."];
      return reply(status, { message });
    }
  };
}
