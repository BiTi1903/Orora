import { mailTransport } from "./mail-transport.js";
import { describeMailError } from "./mail-error.js";
import { safeMailTracking } from "./mail-tracking.js";
import { syncOutlookStatus, OUTLOOK_ERROR_MESSAGES } from "./outlook-status.js";
import { ensureDefaultMailTemplates } from "./default-mail-templates.js";
import { TEMPLATE_KINDS, normalizeTemplateKind, hasOrderTokens } from "../src/lib/template-kinds.js";
import { captureTemplate, recordTemplateUse, templateIdentity } from "./template-snapshot.js";
import { mailActor, resolveMailActors } from "./mail-actor.js";
import { DEFAULT_ORDER_MESSAGE, validateOrderTemplate, renderOrderMessage } from "./order-mail.js";
import { requireAdmin, hasOrderAdminAccess } from "./admin-auth.js";
import { randomUUID, createHash } from "node:crypto";
import { DEFAULT_WELCOME, validateMessage, withUnsubscribe } from "./newsletter-content.js";

const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
const publicContact = (doc) => ({
  id: doc.id, email: doc.data().email, status: doc.data().status,
  mailStatus: doc.data().mailStatus || "", outlook: doc.data().outlook || null, createdAt: millis(doc.data().createdAt),
});
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);

export function createNewsletterAdminHandler({ getDb, verifyToken, sendMail, lookupUser, checkOutlook, env = process.env }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    const reply = (status, data) => res.status(status).json(data);
    if (!["GET", "POST"].includes(req.method)) {
      res.setHeader("Allow", "GET, POST");
      return reply(405, { message: "Phương thức không được hỗ trợ." });
    }
    let user;
    try {
      user = await requireAdmin(req, {
        verifyToken,
        getDb,
        env,
        envKeys: ["NEWSLETTER_ADMIN_UIDS"],
        deniedMessage: "Tài khoản này chưa được cấp quyền gửi email.",
        logAuthError: (failure, error) => {
          const sdkCode = /^(auth|app)\/[a-z0-9-]+$/.test(error.code || "") ? error.code : undefined;
          console.error("Newsletter authentication failed", { code: failure.code, sdkCode });
        },
      });
    } catch (error) {
      return reply(error.status || 403, { ...(error.code ? { code: error.code } : {}), message: error.message });
    }
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
        const [page, typeList] = await Promise.all([query.get(), db.collection("newsletterTemplateTypes").get()]);
        return reply(200, { types: typeList.docs.map((doc) => ({ id: doc.id, name: doc.data().name })), templates: page.docs.map((doc) => ({ id: doc.id, ...doc.data(), kind: normalizeTemplateKind(doc.data().kind), revision: doc.data().revision || 1, createdAt: millis(doc.data().createdAt), updatedAt: millis(doc.data().updatedAt) })), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      if (req.method === "GET" && req.query?.campaignHistory === "1") {
        let query = campaigns.orderBy("createdAt", "desc").limit(50);
        const cursor = req.query?.cursor;
        if (cursor) {
          if (!validId(cursor)) return reply(400, { message: "Trang không hợp lệ." });
          const last = await campaigns.doc(cursor).get();
          if (!last.exists) return reply(400, { message: "Không tìm thấy mốc lịch sử. Hãy xuất lại." });
          query = query.startAfter(last);
        }
        const page = await query.get();
        return reply(200, { campaigns: page.docs.map((doc) => {
          const item = doc.data();
          return { id: doc.id, subject: item.subject || "", text: item.text || "", templateName: item.templateName || "", templateRevision: item.templateRevision || 0, actor: item.actor || item.createdBy || "", actorName: item.actorName || "", actorEmail: item.actorEmail || "", createdAt: millis(item.createdAt) };
        }), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
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
          orderTemplate: orderTemplate.exists ? { subject: String(orderTemplate.data().subject || ""), text: String(orderTemplate.data().text || ""), ...templateIdentity(orderTemplate.data()) } : DEFAULT_ORDER_MESSAGE,
          welcome: welcome.exists ? { ...validateMessage(welcome.data()), ...templateIdentity(welcome.data()) } : DEFAULT_WELCOME,
          campaigns: await resolveMailActors(campaignHistory, lookupUser),
        });
      }
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || JSON.stringify(body).length > 40000) return reply(400, { message: "Dữ liệu không hợp lệ." });
      if (body.action === "campaignDeliveryStatuses") {
        if (!validId(body.id) || (body.cursor && !/^[a-f0-9]{64}$/.test(body.cursor))) return reply(400, { message: "Thư hoặc trang không hợp lệ." });
        let query = campaigns.doc(body.id).collection("deliveries").orderBy("__name__").limit(50);
        if (body.cursor) query = query.startAfter(body.cursor);
        const page = await query.get();
        return reply(200, { deliveries: page.docs.map((doc) => ({ id: doc.id, email: doc.data().email, status: doc.data().status, errorCode: doc.data().errorCode || "", errorMessage: doc.data().errorMessage || "", outlook: doc.data().outlook || null })), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      if (body.action === "checkCampaignOutlook") {
        if (!validId(body.id) || !/^[a-f0-9]{64}$/.test(body.deliveryId || "")) return reply(400, { message: "Bản ghi gửi thư không hợp lệ." });
        const ref = campaigns.doc(body.id).collection("deliveries").doc(body.deliveryId);
        const outlook = await syncOutlookStatus(ref, checkOutlook, { recipient: (await ref.get()).data()?.email || "" });
        return reply(200, { outlook });
      }
      if (body.action === "checkWelcomeOutlook") {
        if (!/^[a-f0-9]{64}$/.test(body.id || "")) return reply(400, { message: "Email không hợp lệ." });
        const ref = contacts.doc(body.id); const person = await ref.get();
        const outlook = await syncOutlookStatus(ref, checkOutlook, { ...(person.data()?.welcomeTracking || {}), recipient: person.data()?.email || "" });
        return reply(200, { outlook });
      }
      if (body.action === "addTemplateType") {
        const name = typeof body.name === "string" ? body.name.trim() : "";
        if (!name || name.length > 60) return reply(400, { message: "Nhập tên loại mẫu từ 1 đến 60 ký tự." });
        const id = `type-${createHash("sha256").update(name.normalize("NFC").toLowerCase()).digest("hex").slice(0, 24)}`;
        const ref = db.collection("newsletterTemplateTypes").doc(id);
        const type = await db.runTransaction(async (tx) => { const saved = await tx.get(ref); if (saved.exists) return { id, name: saved.data().name }; tx.set(ref, { name, createdAt: new Date(), createdBy: user.uid }); return { id, name }; });
        return reply(200, { type, message: "Đã thêm loại mẫu." });
      }
      if (body.action === "ensureDefaultTemplates") {
        const created = await ensureDefaultMailTemplates(db, user);
        return reply(200, { created, message: "Hai mẫu tự động hiện có đã sẵn sàng trong danh sách." });
      }
      if (body.action === "deleteLibraryTemplate") {
        if (!validId(body.id)) return reply(400, { message: "Mẫu thư không hợp lệ." });
        await db.collection("newsletterTemplates").doc(body.id).delete();
        return reply(200, { id: body.id, message: "Đã xóa mẫu khỏi kho. Mẫu tự động và lịch sử thư vẫn được giữ." });
      }
      if (body.action === "saveLibraryTemplate") {
        if (!validId(body.id) || typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100 || !Object.hasOwn(TEMPLATE_KINDS, normalizeTemplateKind(body.kind))) return reply(400, { message: "Nhập tên mẫu (tối đa 100 ký tự) và chọn loại mẫu hợp lệ." });
        const kind = normalizeTemplateKind(body.kind);
        const message = kind === "welcome_auto" ? validateMessage(body) : validateOrderTemplate(body);
        if (kind === "welcome_auto" && hasOrderTokens(message)) throw new Error("order_context_required");
        const ref = db.collection("newsletterTemplates").doc(body.id);
        await db.runTransaction(async (tx) => {
          const saved = await tx.get(ref);
          let category = null;
          if (body.categoryId) {
            if (kind !== "private" || !validId(body.categoryId)) throw new Error("invalid_template_type");
            const type = await tx.get(db.collection("newsletterTemplateTypes").doc(body.categoryId));
            if (!type.exists) throw new Error("invalid_template_type");
            category = { id: type.id, name: type.data().name };
          }
          const updatedAt = new Date();
          const previous = saved.data() || {};
          const changed = ["name", "kind", "subject", "text", "categoryId"].some((key) => (key === "kind" ? normalizeTemplateKind(previous[key]) : key === "categoryId" ? previous[key] || "" : previous[key]) !== ({ name: body.name.trim(), kind, ...message, categoryId: category?.id || "" })[key]);
          tx.set(ref, { ...previous, name: body.name.trim(), kind, categoryId: category?.id || "", categoryName: category?.name || "", ...message, ...mailActor(user), revision: saved.exists ? (previous.revision || 1) + (changed ? 1 : 0) : 1, usageTracked: saved.exists ? previous.usageTracked === true : true, sentCount: previous.sentCount || 0, usedRevisions: previous.usedRevisions || [], createdAt: saved.exists ? previous.createdAt : updatedAt, updatedAt });
        });
        return reply(200, { id: body.id, message: "Đã lưu vào Mẫu Thư. Chưa gửi email hoặc thay đổi mẫu tự động." });
      }
      if (body.action === "saveOrderTemplate") {
        let message;
        try { message = validateOrderTemplate(body); } catch { return reply(400, { message: "Kiểm tra tiêu đề, nội dung và tên biến trong mẫu thư đơn hàng." }); }
        await db.runTransaction(async (tx) => {
          const current = await tx.get(db.collection("newsletterSettings").doc("orderConfirmation"));
          const snapshot = body.templateRef ? await captureTemplate(tx, db, body.templateRef, message, ["order_auto", "private"]) : current.exists && current.data().subject === message.subject && current.data().text === message.text ? templateIdentity(current.data()) : {};
          tx.set(db.collection("newsletterSettings").doc("orderConfirmation"), { ...message, ...snapshot, updatedAt: new Date(), updatedBy: user.uid });
        });
        return reply(200, { message: "Đã lưu mẫu thư xác nhận đơn hàng." });
      }
      if (body.action === "saveWelcome") {
        const message = validateMessage(body);
        if (hasOrderTokens(message)) throw new Error("order_context_required");
        await db.runTransaction(async (tx) => {
          const current = await tx.get(settings);
          const snapshot = body.templateRef ? await captureTemplate(tx, db, body.templateRef, message, ["welcome_auto", "private"]) : current.exists && current.data().subject === message.subject && current.data().text === message.text ? templateIdentity(current.data()) : {};
          tx.set(settings, { ...message, ...snapshot, updatedAt: new Date(), updatedBy: user.uid });
        });
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
        let message = validateMessage(body);
        if (body.mailType === "order") {
          let order;
          if (body.orderId) {
            if (!(await hasOrderAdminAccess(user, { getDb, env }))) return reply(403, { message: "Tài khoản chưa có quyền xem đơn để gửi thử." });
            if (!validId(body.orderId)) return reply(400, { message: "Đơn gửi thử không hợp lệ." });
            const saved = await db.collection("orders").doc(body.orderId).get();
            if (!saved.exists) return reply(404, { message: "Không tìm thấy đơn gửi thử." });
            order = saved.data();
          } else order = { code: "OR-GUI-THU", customer: { name: "Khách thử nghiệm", email, phone: "0900000000", address: "Địa chỉ minh họa" }, product: { name: "Sản phẩm minh họa" }, quantity: 1, subtotal: 0, paymentMethod: "cod" };
          message = renderOrderMessage(validateOrderTemplate(body), order);
        } else if (body.mailType && hasOrderTokens(message)) throw new Error("order_context_required");
        await sendMail(email, message);
        return reply(200, { message: `MS đã nhận thư gửi tới ${email}. Kiểm tra cả mục thư rác.` });
      }
      if (!["createCampaign", "sendBatch"].includes(body.action) || !validId(body.id)) return reply(400, { message: "Thao tác không hợp lệ." });
      if (!env.MS_TENANT_ID || !env.MS_CLIENT_ID || !env.MS_CLIENT_SECRET) return reply(503, { message: "Chưa cấu hình Microsoft 365 trên máy chủ." });
      const campaign = campaigns.doc(body.id);
      if (body.action === "createCampaign") {
        const message = validateMessage(body);
        if (hasOrderTokens(message)) throw new Error("order_context_required");
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
          const snapshot = await captureTemplate(tx, db, body.templateRef, message, "general");
          tx.set(campaign, { ...message, ...snapshot, templateName: snapshot.templateName || "Thư soạn riêng cho khách", recipientIds: recipients, recipientEmails, createdAt: new Date(), createdBy: user.uid, ...mailActor(user), status: "draft", cursor: null, accepted: 0, failed: 0, unknown: 0 });
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
      let lastError = null;
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
            let result = "accepted"; let tracking = {}; let diagnostic = {};
            try {
              tracking = safeMailTracking(await sendMail(claim.email, withUnsubscribe(validateMessage(state), doc.id, env)));
            } catch (error) {
              tracking = safeMailTracking(error.mailTracking);
              diagnostic = describeMailError(error); lastError = diagnostic;
              // A timeout may happen AFTER Microsoft accepts a message. Never resend it automatically.
              result = ["mail_auth_failed", "mail_send_failed", "mail_configuration_missing", "mail_smtp_auth_failed", "mail_smtp_connection_failed", "mail_transport_invalid"].includes(error.message) ? "failed" : "unknown";
              paused = true;
            }
            await db.runTransaction(async (tx) => {
              const current = await tx.get(campaign);
              if (current.data().lease !== lease) throw new Error("campaign_busy");
              if (result === "accepted" && !(current.data().accepted > 0)) await recordTemplateUse(tx, db, current.data());
              tx.set(delivery, { status: result, ...diagnostic, ...tracking, updatedAt: new Date() }, { merge: true });
              tx.set(campaign, { [result]: (current.data()[result] || 0) + 1 }, { merge: true });
            });
            sent += 1;
          }
          cursor = doc.id;
          if (paused || sent >= (mailTransport(env) === "smtp" ? 1 : 2)) break;
        }
        const completed = !paused && page.docs.length < 20 && (!page.docs.length || cursor === page.docs.at(-1).id);
        await db.runTransaction(async (tx) => {
          const current = await tx.get(campaign);
          if (current.data().lease !== lease) throw new Error("campaign_busy");
          tx.set(campaign, { cursor, status: completed ? "completed" : "paused", leaseUntil: 0, updatedAt: new Date() }, { merge: true });
        });
        const saved = (await campaign.get()).data();
        return reply(200, { completed, paused, ...(lastError ? { message: lastError.errorMessage } : {}), campaign: { id: body.id, ...saved } });
      } catch (error) {
        // Release only our lease. Reserved deliveries remain non-retryable if their outcome is unknown.
        await db.runTransaction(async (tx) => {
          const current = await tx.get(campaign);
          if (current.data()?.lease === lease) tx.set(campaign, { status: "paused", leaseUntil: 0 }, { merge: true });
        });
        throw error;
      }
    } catch (error) {
      if (OUTLOOK_ERROR_MESSAGES[error.message]) return reply(503, { code: error.message, message: OUTLOOK_ERROR_MESSAGES[error.message] });
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
        order_context_required: [400, "Mẫu có biến đơn hàng chỉ dùng khi gửi cho một đơn cụ thể, không dùng cho thư chào mừng hoặc gửi danh sách khách."],
        invalid_template_type: [400, "Loại mẫu đã chọn không hợp lệ. Hãy tải lại danh sách loại."],
        invalid_order_token: [400, "Tên biến trong mẫu đơn hàng chưa hợp lệ."],
        invalid_message: [400, "Nhập tiêu đề (tối đa 200 ký tự) và nội dung (tối đa 20.000 ký tự)."],
        invalid_recipients: [400, "Một email đã ngừng hoạt động hoặc bị xóa. Tải lại danh sách người nhận trước khi gửi."],
        template_changed: [409, "Mẫu đã được sửa hoặc xóa. Chọn lại mẫu hiện tại, hoặc sửa nội dung để gửi như thư soạn riêng."],
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
