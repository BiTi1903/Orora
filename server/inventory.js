import { randomUUID } from "node:crypto";
import { requireAdmin } from "./admin-auth.js";
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,150}$/.test(value);
const validQuantity = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
const fail = (message, status = 409) => Object.assign(new Error(message), { status });

export function waitingQuantity(order) {
  return order.paymentStatus !== "paid" && !["cancelled", "shipping", "completed"].includes(order.status) && !["deducted", "restocked", "legacy_paid"].includes(order.inventory?.state) && Number.isInteger(order.quantity) && order.quantity > 0 ? order.quantity : 0;
}
export async function reserveOrderInventory(tx, db, productId, quantity, stockSnapshot) {
  const ref = db.collection("inventory").doc(productId);
  // Order creation supplies the stock snapshot from its initial batched reads.
  const stock = stockSnapshot || await tx.get(ref);
  const current = stock.data() || {};
  let nextReserved = Number.isSafeInteger(current.reserved) && current.reserved >= 0 ? current.reserved : null;
  // Uncounted stock intentionally accepts orders. Scanning historical orders in
  // that case cannot change the decision and only adds a database round trip.
  if (validQuantity(current.quantity)) {
    if (nextReserved === null) {
      const pending = await tx.get(db.collection("orders").where("product.id", "==", productId));
      nextReserved = pending.docs.reduce((sum, doc) => sum + waitingQuantity(doc.data()), 0);
    }
    if (current.quantity - nextReserved < quantity) throw fail("Sản phẩm không đủ số lượng còn có thể đặt. Vui lòng giảm số lượng hoặc liên hệ ORORA.");
  }
  // Serialize reservations against stock adjustments and other orders. Physical
  // quantity stays unchanged until payment or shipping is confirmed.
  tx.set(ref, { quantity: current.quantity ?? null, ...(nextReserved !== null ? { reserved: nextReserved + quantity } : {}), version: (current.version || 0) + 1, updatedAt: new Date() }, { merge: true });
}
// Called inside the order update transaction, before any writes.
export async function settleOrderInventory(tx, db, order, nextPaymentStatus, orderId, userId, nextStatus) {
  if (["deducted", "restocked", "legacy_paid"].includes(order.inventory?.state)) return {};
  if (order.paymentStatus === "paid" || order.status === "shipping" || order.status === "completed") return { inventory: { state: "legacy_paid" } };
  const wasWaiting = waitingQuantity(order);
  if (nextStatus === "cancelled") {
    const productId = order.product?.id;
    if (wasWaiting > 0 && validId(productId)) {
      const stockRef = db.collection("inventory").doc(productId);
      const stock = await tx.get(stockRef);
      const current = stock.data();
      if (stock.exists && Number.isSafeInteger(current?.reserved)) {
        tx.set(stockRef, { reserved: Math.max(0, current.reserved - wasWaiting), version: (current.version || 0) + 1, updatedAt: new Date(), updatedBy: userId }, { merge: true });
      }
    }
    return {};
  }
  if (nextPaymentStatus !== "paid" && nextStatus !== "shipping") return {};
  const productId = order.product?.id;
  if (!validId(productId) || !Number.isInteger(order.quantity) || order.quantity < 1) throw fail("Đơn thiếu ID sản phẩm hoặc số lượng hợp lệ. Kiểm tra đơn trước khi xác nhận.");
  const stockRef = db.collection("inventory").doc(productId);
  const stock = await tx.get(stockRef);
  const current = stock.data();
  if (!stock.exists || !validQuantity(current.quantity)) throw fail("Chưa nhập tồn kho cho sản phẩm này. Vào Kiểm Hàng nhập số lượng trước khi xác nhận thanh toán hoặc giao hàng.");
  if (current.quantity < order.quantity) throw fail(`Tồn kho chỉ còn ${current.quantity}, không đủ ${order.quantity} sản phẩm của đơn. Kiểm tra và cập nhật Kiểm Hàng trước.`);
  const updatedAt = new Date();
  tx.set(stockRef, {
    quantity: current.quantity - order.quantity,
    ...(Number.isSafeInteger(current.reserved) ? { reserved: Math.max(0, current.reserved - wasWaiting) } : {}),
    version: (current.version || 0) + 1,
    updatedAt,
    updatedBy: userId,
  }, { merge: true });
  tx.set(db.collection("inventoryMovements").doc(`order-${orderId}`), { type: "order_out", productId, orderId, orderCode: order.code || "", change: -order.quantity, before: current.quantity, after: current.quantity - order.quantity, createdAt: updatedAt, actor: userId });
  return { inventory: { state: "deducted", productId, quantity: order.quantity, deductedAt: updatedAt } };
}

export function createInventoryHandler({ getDb, verifyToken, env = process.env }) {
  return async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!["GET", "POST"].includes(req.method)) { res.setHeader("Allow", "GET, POST"); return res.status(405).json({ message: "Phương thức không được hỗ trợ." }); }
    let user;
    try {
      user = await requireAdmin(req, { verifyToken, getDb, env, primaryEnvKey: "ORDER_ADMIN_UIDS", deniedMessage: "Tài khoản chưa có quyền quản lý Kiểm Hàng." });
    } catch (error) {
      return res.status(error.status || 403).json({ message: error.message });
    }
    try {
      const db = await getDb();
      if (req.method === "GET" && req.query?.pending === "1") {
        let query = db.collection("orders").orderBy("__name__").limit(100);
        if (req.query?.cursor) {
          if (!validId(req.query.cursor)) throw fail("Trang không hợp lệ.", 400);
          query = query.startAfter(req.query.cursor);
        }
        const page = await query.get(); const pending = Object.create(null);
        for (const doc of page.docs) { const order = doc.data(); if (validId(order.product?.id)) pending[order.product.id] = (pending[order.product.id] || 0) + waitingQuantity(order); }
        return res.status(200).json({ pending, nextCursor: page.docs.length === 100 ? page.docs.at(-1).id : null });
      }
      if (req.method === "GET") {
        let query = db.collection("products").orderBy("__name__").limit(50);
        const cursor = req.query?.cursor;
        if (cursor) { if (!validId(cursor)) throw fail("Trang không hợp lệ.", 400); query = query.startAfter(cursor); }
        const page = await query.get();
        const refs = page.docs.map((product) => db.collection("inventory").doc(product.id));
        const stockDocs = !refs.length ? [] : typeof db.getAll === "function" ? await db.getAll(...refs) : await Promise.all(refs.map((ref) => ref.get()));
        const items = page.docs.map((product, index) => {
          const stock = stockDocs[index]?.data?.();
          return { id: product.id, name: String(product.data().name || ""), ...(product.data().number ? { number: String(product.data().number) } : {}), quantity: stock?.quantity ?? null, version: stock?.version || 0, updatedAt: stock?.updatedAt?.toMillis?.() ?? (stock?.updatedAt ? new Date(stock.updatedAt).getTime() : null) };
        });
        return res.status(200).json({ items, nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      if (req.headers.origin !== new URL(env.NEWSLETTER_SITE_ORIGIN || "https://ororavn.com").origin) throw fail("Tên miền không hợp lệ.", 403);
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) throw fail("Chỉ nhận dữ liệu JSON.", 415);
      if (Number(req.headers["content-length"] || 0) > 2048) throw fail("Nội dung quá dài.", 413);
      let body;
      try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { throw fail("Dữ liệu không hợp lệ.", 400); }
      if (!body || Buffer.byteLength(JSON.stringify(body)) > 2048 || !validId(body.id) || !validQuantity(body.quantity) || !Number.isSafeInteger(body.version) || body.version < 0) throw fail("Nhập số lượng nguyên không âm và tải lại tồn kho hiện tại.", 400);
      const ref = db.collection("inventory").doc(body.id); const movement = db.collection("inventoryMovements").doc(randomUUID());
      const item = await db.runTransaction(async (tx) => {
        const [product, stock] = await tx.getAll(db.collection("products").doc(body.id), ref);
        if (!product.exists) throw fail("Sản phẩm không còn tồn tại. Hãy tải lại.", 404);
        const previous = stock.data() || {};
        if ((previous.version || 0) !== body.version) throw fail("Tồn kho vừa thay đổi do đơn hàng hoặc người khác cập nhật. Tải lại rồi kiểm tra trước khi lưu.");
        const updatedAt = new Date(); const version = body.version + 1;
        tx.set(ref, { quantity: body.quantity, version, updatedAt, updatedBy: user.uid }, { merge: true });
        tx.set(movement, { type: "adjustment", productId: body.id, before: previous.quantity ?? null, after: body.quantity, change: body.quantity - (previous.quantity || 0), actor: user.uid, createdAt: updatedAt });
        return { id: body.id, name: String(product.data().name || ""), ...(product.data().number ? { number: String(product.data().number) } : {}), quantity: body.quantity, version, updatedAt: updatedAt.getTime() };
      });
      return res.status(200).json({ item, message: "Đã cập nhật tồn kho." });
    } catch (error) { return res.status(error.status || 503).json({ message: error.status ? error.message : "Chưa tải hoặc cập nhật được Kiểm Hàng. Vui lòng thử lại." }); }
  };
}
