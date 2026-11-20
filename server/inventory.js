import { randomUUID } from "node:crypto";
import { requireAdmin } from "./admin-auth.js";
import { LOW_STOCK_THRESHOLD } from "../src/lib/stock.js";
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,150}$/.test(value);
const validQuantity = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
const fail = (message, status = 409) => Object.assign(new Error(message), { status });

export function waitingQuantity(order) {
  return order.paymentStatus !== "paid" && !["cancelled", "shipping", "completed"].includes(order.status) && !["deducted", "restocked", "legacy_paid"].includes(order.inventory?.state) && Number.isInteger(order.quantity) && order.quantity > 0 ? order.quantity : 0;
}
function orderProductQuantities(order) {
  const counts = new Map();
  if (Array.isArray(order.items) && order.items.length) {
    for (const item of order.items) {
      if (validId(item?.id) && Number.isInteger(item.quantity) && item.quantity > 0) {
        counts.set(item.id, (counts.get(item.id) || 0) + item.quantity);
      }
    }
    return counts;
  }
  if (validId(order.product?.id) && Number.isInteger(order.quantity) && order.quantity > 0) {
    counts.set(order.product.id, order.quantity);
  }
  return counts;
}
async function countWaitingForProduct(tx, db, productId) {
  const pending = await tx.get(
    db.collection("orders")
      .where("status", "in", ["new", "confirmed"])
      .select("product", "items", "quantity", "status", "paymentStatus", "inventory"),
  );
  return pending.docs.reduce((sum, doc) => {
    const order = doc.data();
    if (waitingQuantity(order) <= 0) return sum;
    return sum + (orderProductQuantities(order).get(productId) || 0);
  }, 0);
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
      nextReserved = await countWaitingForProduct(tx, db, productId);
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
  const wasWaiting = waitingQuantity(order) > 0;
  const qtyByProduct = orderProductQuantities(order);
  if (nextStatus === "cancelled") {
    if (wasWaiting && qtyByProduct.size) {
      const entries = [...qtyByProduct.entries()];
      const refs = entries.map(([productId]) => db.collection("inventory").doc(productId));
      const stocks = await tx.getAll(...refs);
      const updatedAt = new Date();
      entries.forEach(([, qty], index) => {
        const stock = stocks[index];
        const current = stock.data();
        if (stock.exists && Number.isSafeInteger(current?.reserved)) {
          tx.set(refs[index], { reserved: Math.max(0, current.reserved - qty), version: (current.version || 0) + 1, updatedAt, updatedBy: userId }, { merge: true });
        }
      });
    }
    return {};
  }
  if (nextPaymentStatus !== "paid" && nextStatus !== "shipping") return {};
  if (!qtyByProduct.size) throw fail("Đơn thiếu ID sản phẩm hoặc số lượng hợp lệ. Kiểm tra đơn trước khi xác nhận.");
  const entries = [...qtyByProduct.entries()];
  const refs = entries.map(([productId]) => db.collection("inventory").doc(productId));
  const stocks = await tx.getAll(...refs);
  entries.forEach(([, qty], index) => {
    const stock = stocks[index];
    const current = stock.data();
    if (!stock.exists || !validQuantity(current.quantity)) throw fail("Chưa nhập tồn kho cho sản phẩm này. Vào Kiểm Hàng nhập số lượng trước khi xác nhận thanh toán hoặc giao hàng.");
    if (current.quantity < qty) throw fail(`Tồn kho chỉ còn ${current.quantity}, không đủ ${qty} sản phẩm của đơn. Kiểm tra và cập nhật Kiểm Hàng trước.`);
  });
  const updatedAt = new Date();
  let totalDeducted = 0;
  entries.forEach(([productId, qty], index) => {
    totalDeducted += qty;
    const current = stocks[index].data();
    tx.set(refs[index], {
      quantity: current.quantity - qty,
      ...(wasWaiting && Number.isSafeInteger(current.reserved) ? { reserved: Math.max(0, current.reserved - qty) } : {}),
      version: (current.version || 0) + 1,
      updatedAt,
      updatedBy: userId,
    }, { merge: true });
    const movementId = entries.length === 1 ? `order-${orderId}` : `order-${orderId}-${productId}`;
    tx.set(db.collection("inventoryMovements").doc(movementId), { type: "order_out", productId, orderId, orderCode: order.code || "", change: -qty, before: current.quantity, after: current.quantity - qty, createdAt: updatedAt, actor: userId });
  });
  return {
    inventory: entries.length === 1
      ? { state: "deducted", productId: entries[0][0], quantity: entries[0][1], deductedAt: updatedAt }
      : { state: "deducted", quantity: totalDeducted, items: entries.map(([productId, quantity]) => ({ productId, quantity })), deductedAt: updatedAt },
  };
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
        let query = db.collection("orders")
          .where("status", "in", ["new", "confirmed"])
          .select("product", "items", "quantity", "status", "paymentStatus", "inventory")
          .orderBy("__name__")
          .limit(100);
        if (req.query?.cursor) {
          if (!validId(req.query.cursor)) throw fail("Trang không hợp lệ.", 400);
          query = query.startAfter(req.query.cursor);
        }
        const page = await query.get(); const pending = Object.create(null);
        for (const doc of page.docs) {
          const order = doc.data();
          const isWaiting = waitingQuantity(order) > 0;
          for (const [productId, qty] of orderProductQuantities(order)) {
            pending[productId] = (pending[productId] || 0) + (isWaiting ? qty : 0);
          }
        }
        return res.status(200).json({ pending, nextCursor: page.docs.length === 100 ? page.docs.at(-1).id : null });
      }
      if (req.method === "GET" && req.query?.lowStock === "1") {
        const lowSnap = await db.collection("inventory")
          .where("quantity", "<=", LOW_STOCK_THRESHOLD)
          .orderBy("quantity")
          .limit(20)
          .get();
        const validDocs = lowSnap.docs.filter((doc) => Number.isSafeInteger(doc.data()?.quantity) && doc.data().quantity >= 0);
        const prodRefs = validDocs.map((doc) => db.collection("products").doc(doc.id));
        const prodDocs = !prodRefs.length ? [] : typeof db.getAll === "function" ? await db.getAll(...prodRefs) : await Promise.all(prodRefs.map((ref) => ref.get()));
        const items = validDocs.flatMap((doc, index) => {
          const prod = prodDocs[index];
          if (!prod?.exists) return [];
          return [{ id: doc.id, name: String(prod.data().name || ""), quantity: doc.data().quantity }];
        });
        return res.status(200).json({ items });
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
          const reserved = Number.isSafeInteger(stock?.reserved) && stock.reserved >= 0 ? stock.reserved : null;
          return { id: product.id, name: String(product.data().name || ""), ...(product.data().number ? { number: String(product.data().number) } : {}), quantity: stock?.quantity ?? null, ...(reserved !== null ? { reserved } : {}), version: stock?.version || 0, updatedAt: stock?.updatedAt?.toMillis?.() ?? (stock?.updatedAt ? new Date(stock.updatedAt).getTime() : null) };
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
        const syncedReserved = Number.isSafeInteger(previous.reserved) && previous.reserved >= 0
          ? previous.reserved
          : await countWaitingForProduct(tx, db, body.id);
        const updatedAt = new Date(); const version = body.version + 1;
        tx.set(ref, { quantity: body.quantity, reserved: syncedReserved, version, updatedAt, updatedBy: user.uid }, { merge: true });
        tx.set(movement, { type: "adjustment", productId: body.id, before: previous.quantity ?? null, after: body.quantity, change: body.quantity - (previous.quantity || 0), actor: user.uid, createdAt: updatedAt });
        return { id: body.id, name: String(product.data().name || ""), ...(product.data().number ? { number: String(product.data().number) } : {}), quantity: body.quantity, reserved: syncedReserved, version, updatedAt: updatedAt.getTime() };
      });
      return res.status(200).json({ item, message: "Đã cập nhật tồn kho." });
    } catch (error) { return res.status(error.status || 503).json({ message: error.status ? error.message : "Chưa tải hoặc cập nhật được Kiểm Hàng. Vui lòng thử lại." }); }
  };
}
