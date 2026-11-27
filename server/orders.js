import {validOrderPhone} from "../src/lib/order-phone.js";
import { MAX_ORDER_QUANTITY, productVolumeOptions, selectedVolumeOption, validateVolumeOptions, volumePriceText } from "../src/lib/product-options.js";
import { recordOrderActivity } from "./order-activity.js";
import { resolveDeliveryAddress } from "./addresses.js";
import { shippingFeeFor } from "../src/lib/shipping.js";
import { allocateOrderCode } from "./order-code.js";
import { inventoryDocId, prepareOrderInventoryReservation, settleOrderInventory } from "./inventory.js";
import { syncOutlookStatus, syncOutlookBatch, OUTLOOK_ERROR_MESSAGES } from "./outlook-status.js";
import { effectiveMailState } from "../src/lib/mail-state.js";
import { templateIdentity } from "./template-snapshot.js";
import { mailActor, resolveMailActors } from "./mail-actor.js";
import { sendOrderConfirmation, validOrderEmail } from "./order-mail.js";
import { createHash } from "node:crypto";
import { parseVndPrice, sameVndPrice, availablePaymentMethods, PAYMENT_LABELS } from "../src/lib/commerce.js";
import { requireAdmin, resolveAdminPermissions } from "./admin-auth.js";
import { rateLimitSalt, reserveBudgetOrAllow } from "./request-limits.js";
import { normalizeTrackingPhone } from "../src/lib/order-tracking.js";
import { analyticsDay } from "../src/lib/analytics.js";

const uuid = (value) => typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const millis = (value) => value?.toMillis?.() ?? (value ? new Date(value).getTime() : 0);
function paidContribution(order) {
  if (!order || order.paymentStatus !== "paid" || order.status === "cancelled") {
    return { paidAmount: 0, paidOrders: 0, unpricedPaid: 0 };
  }
  const validAmount = Number.isSafeInteger(order.totalAmount) && order.totalAmount >= 0;
  return {
    paidAmount: validAmount ? order.totalAmount : 0,
    paidOrders: 1,
    unpricedPaid: validAmount ? 0 : 1,
  };
}
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
import { NEXT_ORDER_STATUSES, ORDER_STATUSES } from "../src/lib/order-flow.js";
const orderCreatedPayload = (result, mailStatus) => ({
  code: result.code,
  productName: result.product.name,
  quantity: result.quantity,
  variantLabel: result.product.variantLabel || "",
  variantId: result.product.variantId || "",
  ...(Array.isArray(result.items) && result.items.length ? { items: result.items } : {}),
  mailStatus,
  subtotal: result.subtotal,
  shippingFee: result.shippingFee ?? null,
  totalAmount: result.totalAmount ?? null,
  paymentMethod: result.paymentMethod,
  message: result.shippingFee == null ? "Đã nhận đơn hàng. ORORA sẽ liên hệ xác nhận sản phẩm, phí giao hàng và cách thanh toán." : "Đã nhận đơn hàng. ORORA sẽ liên hệ xác nhận và hỗ trợ thanh toán.",
});
export function createOrderHandler({ getDb, sendMail, notifyStore, schedule, env = process.env, now = () => Date.now(), chooseCodeIndex }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ message: "Chỉ nhận đơn bằng POST." }); }
    try {
      const body = readBody(req, env, 24000);
      const customer = Object.fromEntries(["name", "phone", "email", "address", "note"].map((key) => [key, typeof body[key] === "string" ? body[key].trim() : ""]));
      const delivery = await resolveDeliveryAddress(body);
      if (delivery) Object.assign(customer, delivery);
      customer.email = customer.email.toLowerCase();
      customer.phone = customer.phone.replace(/[\s().-]/g, "");
      const isMulti = Array.isArray(body.items);
      const rawItems = isMulti
        ? body.items
        : [{ productId: body.productId, quantity: body.quantity, variantId: body.variantId, expectedVariantLabel: body.expectedVariantLabel, expectedPriceText: body.expectedPriceText }];
      if (!uuid(body.requestId) || !rawItems.length || rawItems.length > 50 || customer.name.length < 2 || customer.name.length > 100 || !validOrderPhone(customer.phone) || !validOrderEmail(customer.email) || customer.address.length < 10 || customer.address.length > 500 || customer.note.length > 1000 || body.consent !== true || !Object.hasOwn(PAYMENT_LABELS, body.paymentMethod)) {
        return res.status(400).json({ message: "Kiểm tra họ tên, số điện thoại, email, địa chỉ, số lượng và xác nhận đồng ý." });
      }
      for (const item of rawItems) {
        if (!item || typeof item.productId !== "string" || !/^[a-zA-Z0-9_-]{1,150}$/.test(item.productId) || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_ORDER_QUANTITY) {
          return res.status(400).json({ message: "Kiểm tra họ tên, số điện thoại, email, địa chỉ, số lượng và xác nhận đồng ý." });
        }
        if (item.variantId !== undefined && (typeof item.variantId !== "string" || (item.variantId && !/^[a-zA-Z0-9_-]{1,100}$/.test(item.variantId)))) {
          return res.status(400).json({ message: "Chọn dung tích hợp lệ." });
        }
      }
      const digest = isMulti
        ? hash(JSON.stringify({ items: rawItems.map((item) => ({ productId: item.productId, quantity: item.quantity, ...(item.variantId ? { variantId: item.variantId } : {}) })), paymentMethod: body.paymentMethod, customer }))
        : hash(JSON.stringify({ ...(body.variantId ? { variantId: body.variantId } : {}), productId: body.productId, quantity: body.quantity, paymentMethod: body.paymentMethod, customer }));
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
      const uniqueProductIds = [...new Set(rawItems.map((item) => item.productId))];
      const uniqueVariantStockKeys = [...new Set(rawItems.filter((item) => item.variantId).map((item) => inventoryDocId(item.productId, item.variantId)))];
      const { record: result, created } = await db.runTransaction(async (tx) => {
        const productRefs = uniqueProductIds.map((pid) => db.collection("products").doc(pid));
        const stockRefs = uniqueProductIds.map((pid) => db.collection("inventory").doc(pid));
        const variantStockRefs = uniqueVariantStockKeys.map((key) => db.collection("inventory").doc(key));
        const snaps = await tx.getAll(order, db.collection("settings").doc("home"), codePool, ...productRefs, ...stockRefs, ...variantStockRefs);
        const [existing, settings, pool] = snaps;
        const productSnaps = new Map(uniqueProductIds.map((pid, idx) => [pid, snaps[3 + idx]]));
        const stockSnaps = new Map(uniqueProductIds.map((pid, idx) => [pid, snaps[3 + uniqueProductIds.length + idx]]));
        const variantStockSnaps = new Map(uniqueVariantStockKeys.map((key, idx) => [key, snaps[3 + uniqueProductIds.length * 2 + idx]]));
        if (existing.exists) {
          if (existing.data().requestHash !== digest) throw Object.assign(new Error("Đơn này đã được tiếp nhận. Vui lòng liên hệ ORORA nếu muốn thay đổi thông tin."), { status: 409 });
          return { record: existing.data(), created: false };
        }
        const resolvedItems = [];
        const qtyByStockTarget = new Map();
        for (const item of rawItems) {
          const product = productSnaps.get(item.productId);
          if (!product?.exists || product.data().active === false) throw Object.assign(new Error("Sản phẩm hiện không nhận đặt hàng."), { status: 404 });
        }
        if (!availablePaymentMethods(settings.data() || {}).includes(body.paymentMethod)) throw Object.assign(new Error("Phương thức thanh toán đã thay đổi. Hãy tải lại trang và chọn lại."), { status: 400 });
        for (const item of rawItems) {
          const product = productSnaps.get(item.productId);
          const data = product.data();
          if (data.volumeOptions !== undefined && validateVolumeOptions(data.volumeOptions)) throw Object.assign(new Error("Dung tích sản phẩm chưa được cấu hình hợp lệ. Vui lòng liên hệ ORORA."), { status: 409 });
          const options = productVolumeOptions(data);
          const variant = selectedVolumeOption(options, item.variantId);
          if ((item.variantId && variant?.id !== item.variantId) || (options.length && !variant)) throw Object.assign(new Error("Chọn dung tích hợp lệ trước khi đặt hàng."), { status: 400 });
          if (item.expectedVariantLabel !== undefined && item.expectedVariantLabel !== (variant?.label || "")) throw Object.assign(new Error("Dung tích vừa thay đổi. Hãy tải lại trang và chọn lại."), { status: 409 });
          const priceText = volumePriceText(data, variant);
          const unitPrice = parseVndPrice(priceText);
          if (item.expectedPriceText !== undefined && !sameVndPrice(item.expectedPriceText, priceText)) throw Object.assign(new Error("Giá sản phẩm vừa thay đổi. Hãy tải lại trang để xem giá mới trước khi đặt."), { status: 409 });
          resolvedItems.push({
            id: product.id,
            name: String(data.name || ""),
            image: String(data.image || ""),
            priceText,
            unitPrice,
            quantity: item.quantity,
            ...(variant ? { variantId: variant.id, variantLabel: variant.label } : {}),
          });
          const vId = variant?.id || "";
          const vKey = vId ? inventoryDocId(product.id, vId) : product.id;
          const vSnap = vId ? variantStockSnaps.get(vKey) : null;
          const hasVariantStock = Boolean(vId && vSnap?.exists && Number.isSafeInteger(vSnap.data()?.quantity) && vSnap.data().quantity >= 0);
          const targetKey = hasVariantStock ? vKey : product.id;
          const prev = qtyByStockTarget.get(targetKey);
          qtyByStockTarget.set(targetKey, {
            productId: product.id,
            variantId: hasVariantStock ? vId : "",
            quantity: (prev?.quantity || 0) + item.quantity,
            variantSnap: hasVariantStock ? vSnap : null,
          });
        }
        const subtotal = resolvedItems.some((item) => item.unitPrice === null)
          ? null
          : resolvedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
        const shipping = shippingFeeFor(settings.data()?.shippingSettings, delivery?.provinceCode, delivery?.wardCode,subtotal);
        if (settings.data()?.shippingSettings?.enabled === true && shipping.fee === null) throw Object.assign(new Error(shipping.reason), { status: 400 });
        if (body.expectedShippingFee !== undefined && body.expectedShippingFee !== shipping.fee) throw Object.assign(new Error("Phí giao hàng vừa thay đổi. Hãy tải lại trang để kiểm tra tổng tiền trước khi đặt."), { status: 409 });
        const totalQuantity = resolvedItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = subtotal === null || shipping.fee === null ? null : subtotal + shipping.fee;
        const allocated = allocateOrderCode(pool.data(), body.paymentMethod, chooseCodeIndex);
        const first = resolvedItems[0];
        const summaryProduct = resolvedItems.length === 1
          ? { id: first.id, name: first.name, image: first.image, priceText: first.priceText, unitPrice: first.unitPrice, ...(first.variantId ? { variantId: first.variantId, variantLabel: first.variantLabel } : {}) }
          : { id: first.id, name: `${first.name} (+${resolvedItems.length - 1} sản phẩm khác)`, image: first.image, priceText: subtotal === null ? "" : String(subtotal), unitPrice: null };
        const record = {
          code: allocated.code,
          orderDate,
          customer,
          quantity: totalQuantity,
          product: summaryProduct,
          ...(resolvedItems.length > 1 ? { items: resolvedItems } : {}),
          subtotal, totalAmount,
          paymentMethod: body.paymentMethod,
          confirmationMail: { state: "pending", updatedAt: createdAt }, paymentStatus: "unpaid", shippingFee: shipping.fee, status: "new", channel: "website", createdAt, requestHash: digest,
        };
        const reservationPlans = [];
        for (const entry of qtyByStockTarget.values()) {
          reservationPlans.push(await prepareOrderInventoryReservation(tx, db, entry.productId, entry.quantity, stockSnaps.get(entry.productId), entry.variantId, entry.variantSnap));
        }
        const reservedTargets = {};
        for (const plan of reservationPlans) {
          if (plan.targetKey && plan.reservedQty > 0) reservedTargets[plan.targetKey] = (reservedTargets[plan.targetKey] || 0) + plan.reservedQty;
          tx.set(plan.ref, plan.data, { merge: true });
        }
        if (Object.keys(reservedTargets).length) record.reservedTargets = reservedTargets;
        tx.set(order, record); tx.set(codePool, { ...allocated.pool, updatedAt: createdAt });
        return { record, created: true };
      });
      let mailStatus = result.confirmationMail?.state || "pending";
      const completeMail = async () => {
        try { const outcome = await sendOrderConfirmation({ db, orderId: body.requestId, sendMail }); mailStatus = outcome.state || mailStatus; }
        catch { console.error("Order accepted; confirmation mail processing did not finish"); }
      };
      const task = Promise.all([completeMail(), created && notifyStore?.(order, { code: result.code })]);
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
    if (req.method === "GET" && req.query?.whoami === "1") {
      try {
        const { user: who, permissions } = await resolveAdminPermissions(req, { verifyToken, getDb, env });
        return res.status(200).json({ ok: true, uid: who.uid, email: who.email || "", permissions });
      } catch (error) {
        return res.status(error.status || 403).json({ message: error.message });
      }
    }
    let user;
    try {
      user = await requireAdmin(req, { verifyToken, getDb, env, primaryEnvKey: "ORDER_ADMIN_UIDS", deniedMessage: "Tài khoản này chưa được cấp quyền quản lý đơn hàng." });
    } catch (error) {
      return res.status(error.status || 403).json({ message: error.message });
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
        const rawQuery = typeof req.query?.q === "string" ? req.query.q.trim() : "";
        const rawStatus = typeof req.query?.status === "string" ? req.query.status.trim() : "";
        const formatOrderDoc = (doc) => {
          const { requestHash: _private, ...data } = doc.data();
          void _private;
          return { id: doc.id, ...data, createdAt: millis(data.createdAt), updatedAt: millis(data.updatedAt) };
        };
        if (!historyOnly && !bounceOnly && rawQuery) {
          const fold = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase();
          const lookups = [];
          const upper = rawQuery.toUpperCase();
          if (/^[A-Z0-9_-]{3,40}$/i.test(upper)) {
            lookups.push(orders.where("code", "==", upper).limit(25).get());
          }
          if (rawQuery.includes("@")) {
            lookups.push(orders.where("customer.email", "==", rawQuery.toLowerCase()).limit(50).get());
          }
          const normalizedPhone = normalizeTrackingPhone(rawQuery);
          if (normalizedPhone) {
            const variants = [normalizedPhone, `+${normalizedPhone}`];
            if (normalizedPhone.startsWith("0") && [10, 11].includes(normalizedPhone.length)) {
              variants.push(`84${normalizedPhone.slice(1)}`, `+84${normalizedPhone.slice(1)}`);
            }
            lookups.push(orders.where("customer.phone", "in", [...new Set(variants)]).limit(50).get());
          }
          if (uuid(rawQuery)) {
            lookups.push(orders.doc(rawQuery).get().then((snap) => ({ docs: snap.exists ? [snap] : [] })));
          }
          const snaps = lookups.length ? await Promise.all(lookups) : [];
          const found = new Map();
          for (const snap of snaps) {
            for (const doc of snap.docs || []) found.set(doc.id, formatOrderDoc(doc));
          }
          if (!found.size) {
            const needle = fold(rawQuery);
            const recent = await orders.orderBy("createdAt", "desc").limit(200).get();
            for (const doc of recent.docs) {
              const formatted = formatOrderDoc(doc);
              const haystack = [
                formatted.code,
                formatted.customer?.name,
                formatted.customer?.phone,
                formatted.customer?.email,
                formatted.product?.name,
                ...(Array.isArray(formatted.items) ? formatted.items.map((item) => item?.name) : []),
              ].map(fold).join(" ");
              if (haystack.includes(needle)) found.set(doc.id, formatted);
            }
          }
          const list = [...found.values()].sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
          return res.status(200).json({ orders: list, nextCursor: null, serverSearch: true });
        }
        const pageSize = historyOnly || bounceOnly ? 20 : 50;
        const customerEmail = req.query?.customerEmail;
        if (customerEmail && (typeof customerEmail !== "string" || !validOrderEmail(customerEmail))) return res.status(400).json({message:"Email chưa hợp lệ."});
        let query = customerEmail ? orders.where("customer.email", "==", customerEmail.toLowerCase()).limit(pageSize) : orders.orderBy("createdAt", "desc").limit(pageSize);
        if (!historyOnly && !bounceOnly && ORDER_STATUSES.includes(rawStatus)) query=orders.where("status","==",rawStatus).orderBy("createdAt","desc").limit(pageSize);
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
        return res.status(200).json({ orders: page.docs.map(formatOrderDoc), nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      const body = readBody(req, env, 40000);
      if (body.action === "checkOrderOutlook") {
        if (!uuid(body.id) || !/^(confirmation-auto|manual-[a-f0-9-]{36})$/i.test(body.eventId || "")) return res.status(400).json({ message: "Bản ghi gửi thư không hợp lệ." });
        const outlook = await syncOutlookStatus(orders.doc(body.id).collection("mailEvents").doc(body.eventId), checkOutlook);
        return res.status(200).json({ outlook });
      }
      if (body.action === "checkAllOrderOutlook") {
        const limit = Math.max(1, Math.min(30, Number.isInteger(body.limit) ? body.limit : 20));
        const recent = await orders.orderBy("createdAt", "desc").limit(limit).get();
        const tasks = [];
        const failed = [];
        const eventsByOrder = await Promise.all(
          recent.docs.map(async (orderDoc) => {
            const orderData = orderDoc.data();
            const evSnap = await orders.doc(orderDoc.id).collection("mailEvents").orderBy("createdAt", "desc").limit(3).get();
            return { orderDoc, orderData, events: evSnap.docs };
          }),
        );
        for (const { orderDoc, orderData, events } of eventsByOrder) {
          for (const evDoc of events) {
            const ev = evDoc.data();
            const derivedState = effectiveMailState(ev, clock());
            if (["failed", "stuck", "unknown"].includes(derivedState)) {
              failed.push({ orderId: orderDoc.id, orderCode: orderData.code || "", eventId: evDoc.id, recipient: ev.recipient || orderData.customer?.email || "", state: derivedState, errorMessage: ev.errorMessage || "" });
              continue;
            }
            if (ev.state === "sent" || ev.state === "accepted" || ev.trackingId || ev.internetMessageId) {
              tasks.push({ orderId: orderDoc.id, orderCode: orderData.code || "", eventId: evDoc.id, recipient: ev.recipient || orderData.customer?.email || "", ref: orders.doc(orderDoc.id).collection("mailEvents").doc(evDoc.id) });
            }
          }
        }
        const bounced = [];
        const delayed = [];
        const results = {};
        let ok = 0;
        let untracked = 0;
        const maxTasks = tasks.slice(0, 30);
        const batchOutlooks = await syncOutlookBatch(maxTasks, checkOutlook);
        maxTasks.forEach((task, index) => {
          const outlook = batchOutlooks[index];
          results[`${task.orderId}/${task.eventId}`] = outlook;
          if (outlook.state === "bounced") {
            bounced.push({ orderId: task.orderId, orderCode: task.orderCode, eventId: task.eventId, recipient: task.recipient, diagnosticCode: outlook.diagnosticCode || "", webLink: outlook.webLink || "" });
          } else if (outlook.state === "delayed") {
            delayed.push({ orderId: task.orderId, orderCode: task.orderCode, eventId: task.eventId, recipient: task.recipient, diagnosticCode: outlook.diagnosticCode || "" });
          } else if (outlook.state === "untracked" || outlook.state === "not_found") {
            untracked += 1;
          } else {
            ok += 1;
          }
        });
        const issueCount = bounced.length + delayed.length + failed.length;
        const checked = maxTasks.length + failed.length;
        const message = !checked
          ? `Chưa có thư nào trong ${recent.docs.length} đơn gần nhất để kiểm tra.`
          : issueCount > 0
            ? `Đã kiểm tra ${checked} thư (${recent.docs.length} đơn gần nhất): phát hiện ${bounced.length} thư trả lại, ${failed.length} thư lỗi gửi${delayed.length ? `, ${delayed.length} thư gửi chậm` : ""}.`
            : `Đã kiểm tra ${checked} thư (${recent.docs.length} đơn gần nhất): không phát hiện thư lỗi hay bị trả lại.`;
        return res.status(200).json({ checked, scannedOrders: recent.docs.length, ok, untracked, bounced, delayed, failed, results, checkedAt: new Date(clock()).toISOString(), message });
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
          const returnEntries = Array.isArray(order.inventory.items) && order.inventory.items.length
            ? order.inventory.items.map((item) => [item.productId, item.quantity])
            : [[order.inventory.productId, order.inventory.quantity]];
          const stockRefs = returnEntries.map(([productId]) => db.collection("inventory").doc(productId));
          const stockSnaps = typeof tx.getAll === "function" ? await tx.getAll(...stockRefs) : await Promise.all(stockRefs.map((r) => tx.get(r)));
          const now = new Date(clock());
          let totalReturned = 0;
          for (let i = 0; i < returnEntries.length; i++) {
            const [productId, qty] = returnEntries[i];
            const stock = stockSnaps[i]?.data();
            if (!stock || !Number.isSafeInteger(stock.quantity) || stock.quantity < 0 || stock.quantity + qty > 1_000_000_000) throw Object.assign(new Error("Kiểm tra số tồn kho hiện tại trước khi hoàn hàng."), { status: 409 });
            tx.set(stockRefs[i], { quantity: stock.quantity + qty, version: (stock.version || 0) + 1, updatedAt: now, updatedBy: user.uid }, { merge: true });
            tx.set(db.collection("inventoryMovements").doc(returnEntries.length === 1 ? `return-${body.id}` : `return-${body.id}-${productId}`), { type: "order_return", productId, orderId: body.id, change: qty, before: stock.quantity, after: stock.quantity + qty, createdAt: now, actor: user.uid });
            totalReturned += qty;
          }
          const nextInventory = { ...order.inventory, state: "restocked", restockedAt: now };
          tx.set(ref, { inventory: nextInventory, updatedAt: now, updatedBy: user.uid }, { merge: true });
          return recordOrderActivity(tx, ref, { before: order, after: { ...order, inventory: nextInventory }, user, createdAt: now, action: "stock_returned", quantity: totalReturned });
        });
        return res.status(200).json({ activity: activity || null, message: "Đã ghi nhận nhận lại hàng và hoàn kho." });
      }
      if (body.action === "updateOrderMeta") {
        if (!uuid(body.id)) return res.status(400).json({ message: "Đơn hàng không hợp lệ." });
        const internalNote = typeof body.internalNote === "string" ? body.internalNote.trim().slice(0, 1000) : "";
        const trackingCode = typeof body.trackingCode === "string" ? body.trackingCode.trim().slice(0, 120) : "";
        const ref = orders.doc(body.id);
        const snap = await ref.get();
        if (!snap.exists) return res.status(404).json({ message: "Không tìm thấy đơn hàng." });
        const updatedAt = new Date(clock());
        await ref.set({ internalNote, trackingCode, updatedAt, updatedBy: user.uid }, { merge: true });
        return res.status(200).json({ internalNote, trackingCode, message: "Đã lưu mã vận đơn và ghi chú nội bộ." });
      }
      if (!uuid(body.id) || (body.status !== undefined ? !ORDER_STATUSES.includes(body.status) : !["unpaid", "paid"].includes(body.paymentStatus))) return res.status(400).json({ message: "Đơn hàng hoặc trạng thái không hợp lệ." });
      const result = await db.runTransaction(async (tx) => {
        const ref = orders.doc(body.id); const current = await tx.get(ref);
        if (!current.exists) throw Object.assign(new Error("Không tìm thấy đơn hàng."), { status: 404 });
        const cur = current.data();
        if (cur.status === "cancelled" && body.paymentStatus !== undefined && body.paymentStatus !== cur.paymentStatus) {
          throw Object.assign(new Error("Đơn đã hủy không thể cập nhật trạng thái thanh toán."), { status: 409 });
        }
        if (body.status !== undefined && body.status !== cur.status) {
          if (cur.status === "cancelled") throw Object.assign(new Error("Đơn đã hủy không mở lại. Tạo đơn mới để số lượng và lịch sử kho được ghi nhận đúng."), { status: 409 });
          if (!NEXT_ORDER_STATUSES[cur.status]?.includes(body.status)) throw Object.assign(new Error("Không thể chuyển sang trạng thái này từ trạng thái hiện tại."), { status: 409 });
        }
        if (body.status === undefined) {
          if (cur.status === "cancelled") throw Object.assign(new Error("Đơn đã hủy không thể cập nhật trạng thái thanh toán."), { status: 409 });
          if (body.paymentStatus === "unpaid") {
            if (cur.status === "completed") throw Object.assign(new Error("Đơn đã hoàn tất không thể bỏ đánh dấu đã thanh toán."), { status: 409 });
            if (cur.inventory?.state === "deducted") throw Object.assign(new Error("Đơn đã trừ kho không thể bỏ đánh dấu đã thanh toán. Nếu khách trả hàng, hãy hủy đơn và hoàn kho."), { status: 409 });
          }
        }
        const nextStatus = body.status ?? cur.status;
        const nextPaymentStatus = body.status === "completed" ? "paid" : body.status !== undefined ? cur.paymentStatus : body.paymentStatus;
        const beforePaid = paidContribution(cur);
        const afterPaid = paidContribution({ ...cur, status: nextStatus, paymentStatus: nextPaymentStatus });
        const deltaAmount = afterPaid.paidAmount - beforePaid.paidAmount;
        const deltaOrders = afterPaid.paidOrders - beforePaid.paidOrders;
        const deltaUnpriced = afterPaid.unpricedPaid - beforePaid.unpricedPaid;
        const orderTime = millis(cur.createdAt);
        let dailyRef = null;
        let dailySnap = null;
        let revenueDay = "";
        let dayOrdersSnap = null;
        if ((deltaAmount || deltaOrders || deltaUnpriced) && Number.isFinite(orderTime) && orderTime > 0) {
          revenueDay = analyticsDay(orderTime);
          dailyRef = db.collection("siteAnalyticsDaily").doc(revenueDay);
          dailySnap = await tx.get(dailyRef);
          if (dailySnap?.data()?.revenueTracked !== true) {
            const dayStart = new Date(`${revenueDay}T00:00:00+07:00`).getTime();
            dayOrdersSnap = await tx.get(
              db.collection("orders")
                .where("createdAt", ">=", new Date(dayStart))
                .where("createdAt", "<", new Date(dayStart + 86400000))
                .limit(500),
            );
          }
        }
        const stockPatch = await settleOrderInventory(tx, db, cur, nextPaymentStatus, body.id, user.uid, nextStatus);
        const patch = { ...stockPatch, ...(body.status !== undefined ? { status: body.status, ...(body.status === "completed" ? { paymentStatus: "paid" } : {}) } : { paymentStatus: body.paymentStatus }), updatedAt: new Date(clock()), updatedBy: user.uid };
        const activity = recordOrderActivity(tx, ref, { before: cur, after: { ...cur, ...patch }, user, createdAt: patch.updatedAt, quantity: stockPatch.inventory?.state === "deducted" ? stockPatch.inventory.quantity : undefined });
        tx.set(ref, patch, { merge: true });
        if (dailyRef) {
          const prevDaily = dailySnap?.data() || {};
          if (prevDaily.revenueTracked === true) {
            tx.set(dailyRef, {
              day: revenueDay,
              paidAmount: Math.max(0, (Number.isSafeInteger(prevDaily.paidAmount) ? prevDaily.paidAmount : 0) + deltaAmount),
              paidOrders: Math.max(0, (Number.isSafeInteger(prevDaily.paidOrders) ? prevDaily.paidOrders : 0) + deltaOrders),
              unpricedPaid: Math.max(0, (Number.isSafeInteger(prevDaily.unpricedPaid) ? prevDaily.unpricedPaid : 0) + deltaUnpriced),
              revenueTracked: true,
            }, { merge: true });
          } else if (dayOrdersSnap && dayOrdersSnap.docs.length < 500) {
            let paidAmount = 0, paidOrders = 0, unpricedPaid = 0;
            for (const doc of dayOrdersSnap.docs) {
              const item = doc.id === body.id ? { ...cur, ...patch } : doc.data();
              const contrib = paidContribution(item);
              paidAmount += contrib.paidAmount;
              paidOrders += contrib.paidOrders;
              unpricedPaid += contrib.unpricedPaid;
            }
            tx.set(dailyRef, { day: revenueDay, paidAmount, paidOrders, unpricedPaid, revenueTracked: true }, { merge: true });
          }
        }
        return { inventory: stockPatch.inventory || cur.inventory || null, activity };
      });
      return res.status(200).json({ ...result, message: body.status === "completed" ? "Đã hoàn tất đơn hàng và ghi nhận đã thanh toán." : "Đã cập nhật trạng thái đơn hàng." });
    } catch (error) { if (OUTLOOK_ERROR_MESSAGES[error.message]) return res.status(503).json({ code: error.message, message: OUTLOOK_ERROR_MESSAGES[error.message] }); return res.status(error.status || 503).json({ message: error.message === "template_changed" ? "Mẫu đã được sửa hoặc xóa. Chọn lại mẫu hiện tại hoặc soạn nội dung riêng." : error.status ? error.message : "Không tải hoặc cập nhật được đơn hàng." }); }
  };
}
