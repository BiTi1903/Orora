import { MAX_ORDER_QUANTITY, productVolumeOptions, selectedVolumeOption, validateVolumeOptions, volumePriceText } from "../src/lib/product-options.js";
import { recordOrderActivity } from "./order-activity.js";
import { resolveDeliveryAddress } from "./addresses.js";
import { shippingFeeFor } from "../src/lib/shipping.js";
import { allocateOrderCode } from "./order-code.js";
import { reserveOrderInventory, settleOrderInventory } from "./inventory.js";
import { syncOutlookStatus, OUTLOOK_ERROR_MESSAGES } from "./outlook-status.js";
import { templateIdentity } from "./template-snapshot.js";
import { mailActor, resolveMailActors } from "./mail-actor.js";
import { sendOrderConfirmation, validOrderEmail } from "./order-mail.js";
import { createHash } from "node:crypto";
import { parseVndPrice, sameVndPrice, availablePaymentMethods, PAYMENT_LABELS } from "../src/lib/commerce.js";
import { requireAdmin } from "./admin-auth.js";
import { rateLimitSalt, reserveBudgetOrAllow } from "./request-limits.js";

const uuid = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
function readBody(req, env, maxBytes = 8000) {
  const expected = new URL(env.NEWSLETTER_SITE_ORIGIN || "https://ororavn.com").origin;
  if (req.headers.origin !== expected) throw Object.assign(new Error("Vui lòng đặt hàng trực tiếp trên website."), { status: 403 });
  if (!String(req.headers["content-type"] || "").startsWith("application/json")) throw Object.assign(new Error("Chỉ nhận dữ liệu JSON."), { status: 415 });
  if (Number(req.headers["content-length"] || 0) > maxBytes) throw Object.assign(new Error("Nội dung quá dài."), { status: 413 });
  let body;
  try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { throw Object.assign(new Error("Dữ liệu không hợp lệ."), { status: 400 }); }
  if (!body || Buffer.byteLength(JSON.stringify(body)) > maxBytes) throw Object.assign(new Error("Dữ liệu không hợp lệ."), { status: 400 });
  return body;
}
const NEXT_ORDER_STATUSES = {
  new: ["confirmed", "cancelled"],
  confirmed: ["shipping", "completed", "cancelled"],
  shipping: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
const orderCreatedPayload = (result, mailStatus) => ({
  code: result.code,
  productName: result.product.name,
  quantity: result.quantity,
  variantLabel: result.product.variantLabel || "",
  variantId: result.product.variantId || "",
  mailStatus,
  subtotal: result.subtotal,
  shippingFee: result.shippingFee ?? null,
  totalAmount: result.totalAmount ?? null,
  paymentMethod: result.paymentMethod,
  message: result.shippingFee == null ? "Đã nhận đơn hàng. ORORA sẽ liên hệ xác nhận sản phẩm, phí giao hàng và cách thanh toán." : "Đã nhận đơn hàng. ORORA sẽ liên hệ xác nhận và hỗ trợ thanh toán.",
});
export function createOrderHandler({ getDb, sendMail, schedule, env = process.env, now = () => Date.now(), chooseCodeIndex }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ message: "Chỉ nhận đơn bằng POST." }); }
    try {
      const body = readBody(req, env);
      const customer = Object.fromEntries(["name", "phone", "email", "address", "note"].map((key) => [key, typeof body[key] === "string" ? body[key].trim() : ""]));
      const delivery = await resolveDeliveryAddress(body);
      if (delivery) Object.assign(customer, delivery);
      customer.email = customer.email.toLowerCase();
      customer.phone = customer.phone.replace(/[\s().-]/g, "");
      if (!uuid(body.requestId) || typeof body.productId !== "string" || !/^[a-zA-Z0-9_-]{1,150}$/.test(body.productId) || !Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > MAX_ORDER_QUANTITY || customer.name.length < 2 || customer.name.length > 100 || !/^\+?\d{7,15}$/.test(customer.phone) || !validOrderEmail(customer.email) || customer.address.length < 10 || customer.address.length > 500 || customer.note.length > 1000 || body.consent !== true || !Object.hasOwn(PAYMENT_LABELS, body.paymentMethod)) {
        return res.status(400).json({ message: "Kiểm tra họ tên, số điện thoại, email, địa chỉ, số lượng và xác nhận đồng ý." });
      }
      if (body.variantId !== undefined && (typeof body.variantId !== "string" || (body.variantId && !/^[a-zA-Z0-9_-]{1,100}$/.test(body.variantId)))) return res.status(400).json({ message: "Chọn dung tích hợp lệ." });
      const digest = hash(JSON.stringify({ ...(body.variantId ? { variantId: body.variantId } : {}), productId: body.productId, quantity: body.quantity, paymentMethod: body.paymentMethod, customer }));
      const db = await getDb();
      const order = db.collection("orders").doc(body.requestId);
      const priorOrder = await order.get();
      if (priorOrder.exists) {
        const saved = priorOrder.data();
        if (saved.requestHash !== digest) return res.status(409).json({ message: "Đơn này đã được tiếp nhận. Vui lòng liên hệ ORORA nếu muốn thay đổi thông tin." });
        return res.status(201).json(orderCreatedPayload(saved, saved.confirmationMail?.state || "pending"));
      }
      const salt = rateLimitSalt(env);
      if (salt) {
        const clock = now();
        const wait = await reserveBudgetOrAllow(db, req, { scope: "orders", cost: 1, budget: 8, now: clock, salt })
          || await reserveBudgetOrAllow(db, req, { scope: "orders-email", cost: 1, budget: 5, windowMs: 86400000, now: clock, salt, key: customer.email });
        if (wait) { res.setHeader("Retry-After", String(wait)); return res.status(429).json({ message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút hoặc liên hệ ORORA." }); }
      }
      const createdAt = new Date(now());
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(createdAt).map(({ type, value }) => [type, value]));
      const orderDate = `${parts.year}-${parts.month}-${parts.day}`;
      const codePool = db.collection("orderCodePools").doc(body.paymentMethod === "cod" ? "C" : "B");
      const result = await db.runTransaction(async (tx) => {
        const [existing, product, settings, pool, stock] = await tx.getAll(order, db.collection("products").doc(body.productId), db.collection("settings").doc("home"), codePool, db.collection("inventory").doc(body.productId));
        if (existing.exists) {
          if (existing.data().requestHash !== digest) throw Object.assign(new Error("Đơn này đã được tiếp nhận. Vui lòng liên hệ ORORA nếu muốn thay đổi thông tin."), { status: 409 });
          return existing.data();
        }
        if (!product.exists || product.data().active === false) throw Object.assign(new Error("Sản phẩm hiện không nhận đặt hàng."), { status: 404 });
        if (!availablePaymentMethods(settings.data() || {}).includes(body.paymentMethod)) throw Object.assign(new Error("Phương thức thanh toán đã thay đổi. Hãy tải lại trang và chọn lại."), { status: 400 });
        const data = product.data();
        if (data.volumeOptions !== undefined && validateVolumeOptions(data.volumeOptions)) throw Object.assign(new Error("Dung tích sản phẩm chưa được cấu hình hợp lệ. Vui lòng liên hệ ORORA."), { status: 409 });
        const options = productVolumeOptions(data);
        const variant = selectedVolumeOption(options, body.variantId);
        if ((body.variantId && variant?.id !== body.variantId) || (options.length && !variant)) throw Object.assign(new Error("Chọn dung tích hợp lệ trước khi đặt hàng."), { status: 400 });
        if (body.expectedVariantLabel !== undefined && body.expectedVariantLabel !== (variant?.label || "")) throw Object.assign(new Error("Dung tích vừa thay đổi. Hãy tải lại trang và chọn lại."), { status: 409 });
        const priceText = volumePriceText(data, variant);
        const unitPrice = parseVndPrice(priceText);
        if (body.expectedPriceText !== undefined && !sameVndPrice(body.expectedPriceText, priceText)) throw Object.assign(new Error("Giá sản phẩm vừa thay đổi. Hãy tải lại trang để xem giá mới trước khi đặt."), { status: 409 });
        const shipping = shippingFeeFor(settings.data()?.shippingSettings, delivery?.provinceCode, delivery?.wardCode);
        if (settings.data()?.shippingSettings?.enabled === true && shipping.fee === null) throw Object.assign(new Error(shipping.reason), { status: 400 });
        if (body.expectedShippingFee !== undefined && body.expectedShippingFee !== shipping.fee) throw Object.assign(new Error("Phí giao hàng vừa thay đổi. Hãy tải lại trang để kiểm tra tổng tiền trước khi đặt."), { status: 409 });
        const subtotal = unitPrice === null ? null : unitPrice * body.quantity;
        const totalAmount = subtotal === null || shipping.fee === null ? null : subtotal + shipping.fee;
        const allocated = allocateOrderCode(pool.data(), body.paymentMethod, chooseCodeIndex);
        const record = {
          code: allocated.code,
          orderDate,
          customer, quantity: body.quantity, product: { id: product.id, name: String(data.name || ""), image: String(data.image || ""), priceText, unitPrice, ...(variant ? { variantId: variant.id, variantLabel: variant.label } : {}) },
          subtotal, totalAmount,
          paymentMethod: body.paymentMethod,
          confirmationMail: { state: "pending", updatedAt: createdAt }, paymentStatus: "unpaid", shippingFee: shipping.fee, status: "new", channel: "website", createdAt, requestHash: digest,
        };
        await reserveOrderInventory(tx, db, product.id, body.quantity, stock);
        tx.set(order, record); tx.set(codePool, { ...allocated.pool, updatedAt: createdAt });
        return record;
      });
      let mailStatus = result.confirmationMail?.state || "pending";
      const completeMail = async () => {
        try { const outcome = await sendOrderConfirmation({ db, orderId: body.requestId, sendMail }); mailStatus = outcome.state || mailStatus; }
        catch { console.error("Order accepted; confirmation mail processing did not finish"); }
      };
      const task = completeMail();
      if (schedule) {
        try { schedule(task); } catch { await task; }
      } else await task;
      return res.status(201).json(orderCreatedPayload(result, mailStatus));
    } catch (error) {
      return res.status(error.status || 503).json({ message: error.status ? error.message : "Chưa xác nhận được đơn. Vui lòng thử gửi lại hoặc liên hệ ORORA." });
    }
  };
}
export function createAdminOrdersHandler({ getDb, verifyToken, sendMail, lookupUser, checkOutlook, env = process.env, clock = () => Date.now() }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ message: "Phương thức không được hỗ trợ." }); }
    let user;
    try {
      user = await requireAdmin(req, { verifyToken, getDb, env, primaryEnvKey: "ORDER_ADMIN_UIDS", deniedMessage: "Tài khoản này chưa được cấp quyền quản lý đơn hàng." });
    } catch (error) {
      return res.status(error.status || 403).json({ message: error.message });
    }
    if (req.method === "GET" && req.query?.whoami === "1") {
      return res.status(200).json({ ok: true, uid: user.uid, email: user.email || "" });
    }
    try {
      const db = await getDb();
      const orders = db.collection("orders");
      if (req.method === "GET" && req.query?.summary === "1") {
        const statuses = ["new", "confirmed", "shipping", "completed", "cancelled"];
        const [statusCounts, latest] = await Promise.all([
          Promise.all(statuses.map((status) => orders.where("status", "==", status).count().get())),
          orders.orderBy("createdAt", "desc").limit(1).get(),
        ]);
        const counts = Object.fromEntries(statuses.map((status, index) => [status, statusCounts[index].data().count]));
        counts.all = statuses.reduce((sum, status) => sum + counts[status], 0);
        const doc = latest.docs[0];
        return res.status(200).json({ pendingCount: counts.new, counts, latestOrder: doc ? { id: doc.id, code: doc.data().code || "", status: doc.data().status, createdAt: millis(doc.data().createdAt) } : null, checkedAt: clock() });
      }
      if (req.method === "GET" && req.query?.id) {
        if (!uuid(req.query.id) || (req.query.activityCursor && !uuid(req.query.activityCursor))) return res.status(400).json({ message: "Đơn hàng hoặc trang nhật ký không hợp lệ." });
        const ref = orders.doc(req.query.id);
        let activityQuery = ref.collection("activityEvents").orderBy("createdAt", "desc").limit(30);
        if (req.query.activityCursor) {
          const last = await ref.collection("activityEvents").doc(req.query.activityCursor).get();
          if (!last.exists) return res.status(400).json({ message: "Không tìm thấy mốc nhật ký. Hãy tải lại chi tiết đơn." });
          activityQuery = activityQuery.startAfter(last);
        }
        const [order, activityPage, history] = await Promise.all([
          ref.get(), activityQuery.get(), req.query.activityCursor ? Promise.resolve(null) : ref.collection("mailEvents").orderBy("createdAt", "desc").limit(50).get(),
        ]);
        if (!order.exists) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        const activity = { activities: activityPage.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: millis(doc.data().createdAt) })), nextActivityCursor: activityPage.docs.length === 30 ? activityPage.docs.at(-1).id : null };
        if (req.query.activityCursor) return res.status(200).json(activity);
        const data = { ...order.data() }; delete data.requestHash;
        return res.status(200).json({ order: { id: order.id, ...data, createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt) }, mails: await resolveMailActors(history.docs.map((doc) => ({ id: doc.id, ...doc.data(), createdAt: millis(doc.data().createdAt), updatedAt: millis(doc.data().updatedAt) })), lookupUser), ...activity });
      }
      if (req.method === "GET") {
        const historyOnly = req.query?.mailHistory === "1";
        const bounceOnly = req.query?.mailBounceSummary === "1";
        const pageSize = historyOnly || bounceOnly ? 20 : 50;
        let query = orders.orderBy("createdAt", "desc").limit(pageSize);
        if (req.query?.cursor) {
          if (!uuid(req.query.cursor)) return res.status(400).json({ message: "Trang không hợp lệ." });
          const last = await orders.doc(req.query.cursor).get();
          if (last.exists) query = query.startAfter(last);
          else return res.status(400).json({ message: "Không tìm thấy mốc phân trang. Hãy tải lại danh sách." });
        }
        const page = await query.get();
        if (bounceOnly) {
          const bounced = await Promise.all(page.docs.map(async order => {
            const history = await orders.doc(order.id).collection("mailEvents")
              .where("outlook.state", "==", "bounced").limit(1).select().get();
            return history.docs.length ? { orderId: order.id, orderCode: order.data().code } : null;
          }));
          return res.status(200).json({ bounced: bounced.filter(Boolean), scannedOrders: page.docs.length });
        }
        if (historyOnly) {
          const histories = await Promise.all(page.docs.map(async (order) => {
            const history = await orders.doc(order.id).collection("mailEvents").orderBy("createdAt", "desc").limit(50).get();
            return history.docs.map((event) => ({ id: `${order.id}/${event.id}`, orderId: order.id, orderCode: order.data().code, customerName: order.data().customer?.name || "", ...templateIdentity(event.data()), actor: event.data().actor || "", actorName: event.data().actorName || "", actorEmail: event.data().actorEmail || "", ...(typeof event.data().templateSubject === "string" && typeof event.data().templateText === "string" ? { templateSubject: event.data().templateSubject, templateText: event.data().templateText } : {}), subject: event.data().subject || "", text: event.data().text || "", recipient: event.data().recipient || "", outlook: event.data().outlook || null, state: event.data().state || "unknown", manual: event.data().manual === true, errorCode: event.data().errorCode || "", errorMessage: event.data().errorMessage || "", createdAt: millis(event.data().createdAt), updatedAt: millis(event.data().updatedAt) }));
          }));
          return res.status(200).json({ mails: await resolveMailActors(histories.flat(), lookupUser), scannedOrders: page.docs.length, nextCursor: page.docs.length === pageSize ? page.docs.at(-1).id : null });
        }
        return res.status(200).json({ orders: page.docs.map((doc) => {
          const { requestHash: _private, ...data } = doc.data();
          void _private;
          return { id: doc.id, ...data, createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt) };
        }), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      const body = readBody(req, env, 40000);
      if (body.action === "checkOrderOutlook") {
        if (!uuid(body.id) || !/^(confirmation-auto|manual-[a-f0-9-]{36})$/i.test(body.eventId || "")) return res.status(400).json({ message: "Bản ghi gửi thư không hợp lệ." });
        const outlook = await syncOutlookStatus(orders.doc(body.id).collection("mailEvents").doc(body.eventId), checkOutlook);
        return res.status(200).json({ outlook });
      }
      if (body.action === "sendOrderEmail") {
        if (!uuid(body.id) || !uuid(body.requestId)) return res.status(400).json({ message: "Yêu cầu gửi thư không hợp lệ." });
        const result = await sendOrderConfirmation({ db, orderId: body.id, sendMail, manual: true, requestId: body.requestId, confirmResend: body.confirmResend === true, recoverOnly: body.recoverOnly === true, ...mailActor(user), message: body.message, templateRef: body.templateRef });
        return res.status(200).json({ ...result, message: result.errorMessage || (result.state === "failed" ? "Gửi thư bị lỗi. Xem lịch sử của đơn hàng." : result.state === "unknown" ? "Chưa rõ kết quả gửi. Kiểm tra Microsoft trước khi gửi lại." : "Đã xử lý yêu cầu gửi thư cho đơn hàng.") });
      }
      if (body.action === "restockOrder") {
        if (!uuid(body.id)) throw Object.assign(new Error("Đơn không hợp lệ."), { status: 400 });
        const activity = await db.runTransaction(async (tx) => {
          const ref = orders.doc(body.id); const saved = await tx.get(ref); const order = saved.data();
          if (!saved.exists || order.status !== "cancelled") throw Object.assign(new Error("Chỉ hoàn kho cho đơn đã hủy và đã nhận lại hàng."), { status: 409 });
          if (order.inventory?.state === "restocked") return;
          if (order.inventory?.state !== "deducted") throw Object.assign(new Error("Đơn này chưa có lần trừ kho để hoàn lại."), { status: 409 });
          const stockRef = db.collection("inventory").doc(order.inventory.productId); const stock = (await tx.get(stockRef)).data();
          if (!stock || !Number.isSafeInteger(stock.quantity) || stock.quantity < 0 || stock.quantity + order.inventory.quantity > 1_000_000_000) throw Object.assign(new Error("Kiểm tra số tồn kho hiện tại trước khi hoàn hàng."), { status: 409 });
          const now = new Date(clock());
          tx.set(stockRef, { quantity: stock.quantity + order.inventory.quantity, version: (stock.version || 0) + 1, updatedAt: now, updatedBy: user.uid }, { merge: true });
          tx.set(db.collection("inventoryMovements").doc(`return-${body.id}`), { type: "order_return", productId: order.inventory.productId, orderId: body.id, change: order.inventory.quantity, before: stock.quantity, after: stock.quantity + order.inventory.quantity, createdAt: now, actor: user.uid });
          const nextInventory = { ...order.inventory, state: "restocked", restockedAt: now };
          tx.set(ref, { inventory: nextInventory, updatedAt: now, updatedBy: user.uid }, { merge: true });
          return recordOrderActivity(tx, ref, { before: order, after: { ...order, inventory: nextInventory }, user, createdAt: now, action: "stock_returned", quantity: order.inventory.quantity });
        });
        return res.status(200).json({ activity: activity || null, message: "Đã ghi nhận nhận lại hàng và hoàn kho." });
      }
      if (!uuid(body.id) || (body.status !== undefined ? !["new", "confirmed", "shipping", "completed", "cancelled"].includes(body.status) : !["unpaid", "paid"].includes(body.paymentStatus))) return res.status(400).json({ message: "Đơn hàng hoặc trạng thái không hợp lệ." });
      const result = await db.runTransaction(async (tx) => {
        const ref = orders.doc(body.id); const current = await tx.get(ref);
        if (!current.exists) throw Object.assign(new Error("Không tìm thấy đơn hàng."), { status: 404 });
        const cur = current.data();
        if (body.status !== undefined && body.status !== cur.status) {
          if (cur.status === "cancelled") throw Object.assign(new Error("Đơn đã hủy không mở lại. Tạo đơn mới để số lượng và lịch sử kho được ghi nhận đúng."), { status: 409 });
          if (!NEXT_ORDER_STATUSES[cur.status]?.includes(body.status)) throw Object.assign(new Error("Không thể chuyển sang trạng thái này từ trạng thái hiện tại."), { status: 409 });
        }
        if (body.status === undefined && body.paymentStatus === "unpaid") {
          if (cur.status === "completed") throw Object.assign(new Error("Đơn đã hoàn tất không thể bỏ đánh dấu đã thanh toán."), { status: 409 });
          if (cur.inventory?.state === "deducted") throw Object.assign(new Error("Đơn đã trừ kho không thể bỏ đánh dấu đã thanh toán. Nếu khách trả hàng, hãy hủy đơn và hoàn kho."), { status: 409 });
        }
        const nextPaymentStatus = body.status === "completed" ? "paid" : body.status !== undefined ? cur.paymentStatus : body.paymentStatus;
        const stockPatch = await settleOrderInventory(tx, db, cur, nextPaymentStatus, body.id, user.uid, body.status ?? cur.status);
        const patch = { ...stockPatch, ...(body.status !== undefined ? { status: body.status, ...(body.status === "completed" ? { paymentStatus: "paid" } : {}) } : { paymentStatus: body.paymentStatus }), updatedAt: new Date(clock()), updatedBy: user.uid };
        const activity = recordOrderActivity(tx, ref, { before: cur, after: { ...cur, ...patch }, user, createdAt: patch.updatedAt, quantity: stockPatch.inventory?.state === "deducted" ? stockPatch.inventory.quantity : undefined });
        tx.set(ref, patch, { merge: true });
        return { inventory: stockPatch.inventory || cur.inventory || null, activity };
      });
      return res.status(200).json({ ...result, message: body.status === "completed" ? "Đã hoàn tất đơn hàng và ghi nhận đã thanh toán." : "Đã cập nhật trạng thái đơn hàng." });
    } catch (error) { if (OUTLOOK_ERROR_MESSAGES[error.message]) return res.status(503).json({ code: error.message, message: OUTLOOK_ERROR_MESSAGES[error.message] }); return res.status(error.status || 503).json({ message: error.message === "template_changed" ? "Mẫu đã được sửa hoặc xóa. Chọn lại mẫu hiện tại hoặc soạn nội dung riêng." : error.status ? error.message : "Không tải hoặc cập nhật được đơn hàng." }); }
  };
}
