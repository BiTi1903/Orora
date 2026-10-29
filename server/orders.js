import { sendOrderConfirmation, validOrderEmail } from "./order-mail.js";
import { createHash, randomUUID } from "node:crypto";
import { parseVndPrice, availablePaymentMethods, PAYMENT_LABELS } from "../src/lib/commerce.js";
import { firebaseAuthFailure } from "./firebase-auth-error.js";

const uuid = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
function readBody(req, env) {
  const expected = new URL(env.NEWSLETTER_SITE_ORIGIN || "https://ororavn.com").origin;
  if (req.headers.origin !== expected) throw Object.assign(new Error("Vui lòng đặt hàng trực tiếp trên website."), { status: 403 });
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) throw Object.assign(new Error("Chỉ nhận dữ liệu JSON."), { status: 415 });
  if (Number(req.headers["content-length"] || 0) > 8000) throw Object.assign(new Error("Nội dung quá dài."), { status: 413 });
  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { throw Object.assign(new Error("Dữ liệu không hợp lệ."), { status: 400 }); }
  if (!body || Buffer.byteLength(JSON.stringify(body)) > 8000) throw Object.assign(new Error("Dữ liệu không hợp lệ."), { status: 400 });
  return body;
}
export function createOrderHandler({ getDb, sendMail, env = process.env, now = () => Date.now() }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ message: "Chỉ nhận đơn bằng POST." }); }
    try {
      const body = readBody(req, env);
      const customer = Object.fromEntries(["name", "phone", "email", "address", "note"].map((key) => [key, typeof body[key] === "string" ? body[key].trim() : ""]));
      customer.email = customer.email.toLowerCase();
      customer.phone = customer.phone.replace(/[\s().-]/g, "");
      if (!uuid(body.requestId) || typeof body.productId !== "string" || !/^[a-zA-Z0-9_-]{1,150}$/.test(body.productId) || !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 20 || customer.name.length < 2 || customer.name.length > 100 || !/^\+?\d{7,15}$/.test(customer.phone) || !validOrderEmail(customer.email) || customer.address.length < 10 || customer.address.length > 500 || customer.note.length > 1000 || body.consent !== true || !Object.hasOwn(PAYMENT_LABELS, body.paymentMethod) || body.website) {
        return res.status(400).json({ message: "Kiểm tra họ tên, số điện thoại, email, địa chỉ, số lượng và xác nhận đồng ý." });
      }
      const digest = hash(JSON.stringify({ productId: body.productId, quantity: body.quantity, paymentMethod: body.paymentMethod, customer }));
      const db = await getDb();
      const order = db.collection("orders").doc(body.requestId);
      const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
      const rate = db.collection("orderRateLimits").doc(hash(ip));
      const globalRate = db.collection("orderRateLimits").doc("global");
      const createdAt = new Date(now());
      const result = await db.runTransaction(async (tx) => {
        const [existing, product, settings, perIp, site] = await tx.getAll(order, db.collection("products").doc(body.productId), db.collection("settings").doc("home"), rate, globalRate);
        if (existing.exists) {
          if (existing.data().requestHash !== digest) throw Object.assign(new Error("Đơn này đã được tiếp nhận. Vui lòng liên hệ ORORA nếu muốn thay đổi thông tin."), { status: 409 });
          return existing.data();
        }
        if (!product.exists || product.data().active === false) throw Object.assign(new Error("Sản phẩm hiện không nhận đặt hàng."), { status: 404 });
        const allowed = (snapshot, windowMs, limit) => {
          const data = snapshot.data() || {};
          const current = now() - millis(data.windowStart) < windowMs ? data : { count: 0, windowStart: createdAt };
          if (current.count >= limit) throw Object.assign(new Error("Bạn đã gửi nhiều yêu cầu. Vui lòng thử lại sau."), { status: 429 });
          return { count: (current.count || 0) + 1, windowStart: current.windowStart || createdAt };
        };
        const ipRate = allowed(perIp, 10 * 60 * 1000, 5);
        const siteRate = allowed(site, 60 * 60 * 1000, 300);
        if (!availablePaymentMethods(settings.data() || {}).includes(body.paymentMethod)) throw Object.assign(new Error("Phương thức thanh toán đã thay đổi. Hãy tải lại trang và chọn lại."), { status: 400 });
        const data = product.data();
        const unitPrice = parseVndPrice(data.price);
        if (body.expectedPriceText !== undefined && String(body.expectedPriceText).trim() !== String(data.price ?? "").trim()) throw Object.assign(new Error("Giá sản phẩm vừa thay đổi. Hãy tải lại trang để xem giá mới trước khi đặt."), { status: 409 });
        const record = {
          code: `OR-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
          customer, quantity: body.quantity, product: { id: product.id, name: String(data.name || ""), image: String(data.image || ""), priceText: String(data.price ?? ""), unitPrice },
          subtotal: unitPrice === null ? null : unitPrice * body.quantity,
          paymentMethod: body.paymentMethod,
          confirmationMail: { state: "pending", updatedAt: createdAt }, paymentStatus: "unpaid", shippingFee: null, status: "new", channel: "website", createdAt, requestHash: digest,
        };
        tx.set(order, record); tx.set(rate, ipRate); tx.set(globalRate, siteRate);
        return record;
      });
      let mailStatus = result.confirmationMail?.state || "pending";
      try { const outcome = await sendOrderConfirmation({ db, orderId: body.requestId, sendMail }); mailStatus = outcome.state || mailStatus; } catch { /* Order remains accepted; admin can inspect the send state. */ }
      return res.status(201).json({ code: result.code, mailStatus, subtotal: result.subtotal, paymentMethod: result.paymentMethod, message: "Đã nhận đơn hàng. ORORA sẽ liên hệ xác nhận sản phẩm, phí giao hàng và cách thanh toán." });
    } catch (error) {
      return res.status(error.status || 503).json({ message: error.status ? error.message : "Chưa xác nhận được đơn. Vui lòng thử gửi lại hoặc liên hệ ORORA." });
    }
  };
}
export function createAdminOrdersHandler({ getDb, verifyToken, sendMail, env = process.env }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ message: "Phương thức không được hỗ trợ." }); }
    const admins = String(env.ORDER_ADMIN_UIDS || env.NEWSLETTER_ADMIN_UIDS || "").split(",").map((value) => value.trim()).filter(Boolean);
    if (!admins.length) return res.status(503).json({ message: "Chưa cấu hình tài khoản quản lý đơn hàng trên máy chủ." });
    let user;
    try {
      const token = /^Bearer (.+)$/.exec(req.headers.authorization || "")?.[1];
      user = token ? await verifyToken(token) : null;
    } catch (error) { const failure = firebaseAuthFailure(error); return res.status(failure.status).json({ message: failure.message }); }
    if (!user) return res.status(401).json({ message: "Vui lòng đăng nhập lại." });
    if (!admins.includes(user.uid)) return res.status(403).json({ message: "Tài khoản này chưa được cấp quyền quản lý đơn hàng." });
    try {
      const db = await getDb();
      const orders = db.collection("orders");
      if (req.method === "GET" && req.query?.id) {
        if (!uuid(req.query.id)) return res.status(400).json({ message: "Đơn hàng không hợp lệ." });
        const ref = orders.doc(req.query.id);
        const [order, history] = await Promise.all([ref.get(), ref.collection("mailEvents").orderBy("createdAt", "desc").limit(50).get()]);
        if (!order.exists) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        const data = { ...order.data() }; delete data.requestHash;
        return res.status(200).json({ order: { id: order.id, ...data, createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt) }, mails: history.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: millis(doc.data().createdAt), updatedAt: millis(doc.data().updatedAt) })) });
      }
      if (req.method === "GET") {
        let query = orders.orderBy("createdAt", "desc").limit(50);
        if (req.query?.cursor) {
          if (!uuid(req.query.cursor)) return res.status(400).json({ message: "Trang không hợp lệ." });
          const last = await orders.doc(req.query.cursor).get();
          if (last.exists) query = query.startAfter(last);
          else return res.status(400).json({ message: "Không tìm thấy mốc phân trang. Hãy tải lại danh sách." });
        }
        const page = await query.get();
        return res.status(200).json({ orders: page.docs.map((doc) => {
          const { requestHash: _private, ...data } = doc.data();
          void _private;
          return { id: doc.id, ...data, createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt) };
        }), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      const body = readBody(req, env);
      if (body.action === "sendOrderEmail") {
        if (!uuid(body.id) || !uuid(body.requestId)) return res.status(400).json({ message: "Yêu cầu gửi thư không hợp lệ." });
        const result = await sendOrderConfirmation({ db, orderId: body.id, sendMail, manual: true, requestId: body.requestId, confirmResend: body.confirmResend === true, actor: user.uid });
        return res.status(200).json({ ...result, message: result.state === "failed" ? "Gửi thư bị lỗi. Xem lịch sử của đơn hàng." : result.state === "unknown" ? "Chưa rõ kết quả gửi. Kiểm tra Microsoft trước khi gửi lại." : "Đã xử lý yêu cầu gửi thư cho đơn hàng." });
      }
      if (!uuid(body.id) || (body.status !== undefined ? !["new", "confirmed", "shipping", "completed", "cancelled"].includes(body.status) : !["unpaid", "paid"].includes(body.paymentStatus))) return res.status(400).json({ message: "Đơn hàng hoặc trạng thái không hợp lệ." });
      await db.runTransaction(async (tx) => {
        const ref = orders.doc(body.id); const current = await tx.get(ref);
        if (!current.exists) throw Object.assign(new Error("Không tìm thấy đơn hàng."), { status: 404 });
        tx.set(ref, { ...(body.status !== undefined ? { status: body.status } : { paymentStatus: body.paymentStatus }), updatedAt: new Date(), updatedBy: user.uid }, { merge: true });
      });
      return res.status(200).json({ message: "Đã cập nhật trạng thái đơn hàng." });
    } catch (error) { return res.status(error.status || 503).json({ message: error.status ? error.message : "Không tải hoặc cập nhật được đơn hàng." }); }
  };
}
