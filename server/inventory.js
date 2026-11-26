import { randomUUID } from "node:crypto";
import { requireAdmin } from "./admin-auth.js";
import { LOW_STOCK_THRESHOLD } from "../src/lib/stock.js";
import { productVolumeOptions } from "../src/lib/product-options.js";
const validId = (value) => typeof value === "string" && /^[a-zA-Z0-9_-]{1,150}$/.test(value);
const validQuantity = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
const fail = (message, status = 409) => Object.assign(new Error(message), { status });

export const inventoryDocId = (productId, variantId = "") => (variantId ? `${productId}__${variantId}` : productId);
export function parseInventoryId(docId) {
  const sep = String(docId || "").indexOf("__");
  return sep > 0 ? { productId: docId.slice(0, sep), variantId: docId.slice(sep + 2) } : { productId: String(docId || ""), variantId: "" };
}

export function waitingQuantity(order) {
  return order.paymentStatus !== "paid" && !["cancelled", "shipping", "completed"].includes(order.status) && !["deducted", "restocked", "legacy_paid"].includes(order.inventory?.state) && Number.isInteger(order.quantity) && order.quantity > 0 ? order.quantity : 0;
}
function orderStockEntries(order) {
  const counts = new Map();
  const add = (productId, variantId, qty) => {
    if (!validId(productId) || !Number.isInteger(qty) || qty <= 0) return;
    const key = inventoryDocId(productId, variantId || "");
    const existing = counts.get(key);
    counts.set(key, { productId, variantId: variantId || "", quantity: (existing?.quantity || 0) + qty });
  };
  if (Array.isArray(order.items) && order.items.length) {
    for (const item of order.items) add(item?.id, item?.variantId, item?.quantity);
    return counts;
  }
  add(order.product?.id, order.product?.variantId, order.quantity);
  return counts;
}
async function countWaitingForStockKey(tx, db, stockKey) {
  const { productId, variantId } = parseInventoryId(stockKey);
  const pending = await tx.get(
    db.collection("orders")
      .where("status", "in", ["new", "confirmed"])
      .select("product", "items", "quantity", "status", "paymentStatus", "inventory")
      .limit(500),
  );
  return pending.docs.reduce((sum, doc) => {
    const order = doc.data();
    if (waitingQuantity(order) <= 0) return sum;
    const entries = orderStockEntries(order);
    if (variantId) return sum + (entries.get(stockKey)?.quantity || 0);
    let matched = 0;
    for (const entry of entries.values()) {
      if (entry.productId === productId) matched += entry.quantity;
    }
    return sum + matched;
  }, 0);
}
export async function prepareOrderInventoryReservation(tx, db, productId, quantity, stockSnapshot, variantId = "", variantSnapshot = null) {
  const variantKey = variantId ? inventoryDocId(productId, variantId) : productId;
  let targetKey = productId;
  let stock = stockSnapshot;
  if (variantId) {
    const variantSnap = variantSnapshot || (await tx.get(db.collection("inventory").doc(variantKey)));
    if (variantSnap?.exists && validQuantity(variantSnap.data()?.quantity)) {
      targetKey = variantKey;
      stock = variantSnap;
    }
  }
  const ref = db.collection("inventory").doc(targetKey);
  if (!stock) stock = await tx.get(ref);
  const current = stock.data() || {};
  let nextReserved = Number.isSafeInteger(current.reserved) && current.reserved >= 0 ? current.reserved : null;
  if (validQuantity(current.quantity)) {
    if (nextReserved === null) {
      nextReserved = await countWaitingForStockKey(tx, db, targetKey);
    }
    if (current.quantity - nextReserved < quantity) throw fail("Sản phẩm không đủ số lượng còn có thể đặt. Vui lòng giảm số lượng hoặc liên hệ ORORA.");
  }
  return {
    targetKey,
    reservedQty: nextReserved !== null ? quantity : 0,
    ref,
    data: { quantity: current.quantity ?? null, ...(nextReserved !== null ? { reserved: nextReserved + quantity } : {}), version: (current.version || 0) + 1, updatedAt: new Date() },
  };
}
export async function reserveOrderInventory(tx, db, productId, quantity, stockSnapshot, variantId = "", variantSnapshot = null) {
  const plan = await prepareOrderInventoryReservation(tx, db, productId, quantity, stockSnapshot, variantId, variantSnapshot);
  tx.set(plan.ref, plan.data, { merge: true });
}
// Called inside the order update transaction, before any writes.
export async function settleOrderInventory(tx, db, order, nextPaymentStatus, orderId, userId, nextStatus) {
  if (["deducted", "restocked", "legacy_paid"].includes(order.inventory?.state)) return {};
  if (order.paymentStatus === "paid" || order.status === "shipping" || order.status === "completed") return { inventory: { state: "legacy_paid" } };
  const wasWaiting = waitingQuantity(order) > 0;
  const rawEntries = [...orderStockEntries(order).values()];
  if (!rawEntries.length) {
    if (nextPaymentStatus === "paid" || nextStatus === "shipping") throw fail("Đơn thiếu ID sản phẩm hoặc số lượng hợp lệ. Kiểm tra đơn trước khi xác nhận.");
    return {};
  }
  const recordedTargets = order.reservedTargets && typeof order.reservedTargets === "object"
    ? Object.entries(order.reservedTargets).filter(([id, qty]) => id && Number.isSafeInteger(qty) && qty > 0)
    : [];
  // Resolve each entry to variant doc if counted, else legacy product doc.
  const candidateIds = [...new Set([
    ...recordedTargets.map(([id]) => id),
    ...rawEntries.flatMap((e) => (e.variantId ? [inventoryDocId(e.productId, e.variantId), e.productId] : [e.productId])),
  ])];
  const candidateRefs = candidateIds.map((id) => db.collection("inventory").doc(id));
  const candidateSnaps = await tx.getAll(...candidateRefs);
  const snapById = new Map(candidateIds.map((id, i) => [id, candidateSnaps[i]]));
  const resolvedByDoc = new Map();
  if (recordedTargets.length && nextStatus === "cancelled") {
    for (const [docId, qty] of recordedTargets) resolvedByDoc.set(docId, qty);
  } else {
    for (const entry of rawEntries) {
      const vKey = entry.variantId ? inventoryDocId(entry.productId, entry.variantId) : entry.productId;
      const vSnap = snapById.get(vKey);
      const chosenId = entry.variantId && vSnap?.exists && (validQuantity(vSnap.data()?.quantity) || Number.isSafeInteger(vSnap.data()?.reserved))
        ? vKey
        : entry.productId;
      resolvedByDoc.set(chosenId, (resolvedByDoc.get(chosenId) || 0) + entry.quantity);
    }
  }
  const entries = [...resolvedByDoc.entries()];
  if (nextStatus === "cancelled") {
    if (wasWaiting && entries.length) {
      const updatedAt = new Date();
      entries.forEach(([docId, qty]) => {
        const stock = snapById.get(docId);
        const current = stock?.data();
        if (stock?.exists && Number.isSafeInteger(current?.reserved)) {
          tx.set(db.collection("inventory").doc(docId), { reserved: Math.max(0, current.reserved - qty), version: (current.version || 0) + 1, updatedAt, updatedBy: userId }, { merge: true });
        }
      });
    }
    return {};
  }
  if (nextPaymentStatus !== "paid" && nextStatus !== "shipping") return {};
  entries.forEach(([docId, qty]) => {
    const stock = snapById.get(docId);
    const current = stock?.data();
    if (!stock?.exists || !validQuantity(current.quantity)) throw fail("Chưa nhập tồn kho cho sản phẩm này. Vào Kiểm Hàng nhập số lượng trước khi xác nhận thanh toán hoặc giao hàng.");
    if (current.quantity < qty) throw fail(`Tồn kho chỉ còn ${current.quantity}, không đủ ${qty} sản phẩm của đơn. Kiểm tra và cập nhật Kiểm Hàng trước.`);
  });
  const updatedAt = new Date();
  let totalDeducted = 0;
  entries.forEach(([docId, qty]) => {
    totalDeducted += qty;
    const current = snapById.get(docId).data();
    tx.set(db.collection("inventory").doc(docId), {
      quantity: current.quantity - qty,
      ...(wasWaiting && Number.isSafeInteger(current.reserved) ? { reserved: Math.max(0, current.reserved - qty) } : {}),
      version: (current.version || 0) + 1,
      updatedAt,
      updatedBy: userId,
    }, { merge: true });
    const movementId = entries.length === 1 ? `order-${orderId}` : `order-${orderId}-${docId}`;
    tx.set(db.collection("inventoryMovements").doc(movementId), { type: "order_out", productId: docId, orderId, orderCode: order.code || "", change: -qty, before: current.quantity, after: current.quantity - qty, createdAt: updatedAt, actor: userId });
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
          for (const [docKey, entry] of orderStockEntries(order)) {
            const addQty = isWaiting ? entry.quantity : 0;
            pending[docKey] = (pending[docKey] || 0) + addQty;
            if (entry.variantId) pending[entry.productId] = (pending[entry.productId] || 0) + addQty;
          }
        }
        return res.status(200).json({ pending, nextCursor: page.docs.length === 100 ? page.docs.at(-1).id : null });
      }
      if (req.method === "GET" && req.query?.lowStock === "1") {
        const invSnap = await db.collection("inventory").limit(200).get();
        const lowDocs = invSnap.docs
          .map((doc) => {
            const data = doc.data() || {};
            if (!validQuantity(data.quantity)) return null;
            const reserved = Number.isSafeInteger(data.reserved) && data.reserved > 0 ? data.reserved : 0;
            const available = Math.max(0, data.quantity - reserved);
            if (available > LOW_STOCK_THRESHOLD) return null;
            const { productId, variantId } = parseInventoryId(doc.id);
            return { id: doc.id, productId, variantId, quantity: data.quantity, reserved, available };
          })
          .filter(Boolean)
          .sort((a, b) => a.available - b.available || a.quantity - b.quantity || a.id.localeCompare(b.id))
          .slice(0, 20);
        const uniqueProdIds = [...new Set(lowDocs.map((entry) => entry.productId))];
        const prodRefs = uniqueProdIds.map((id) => db.collection("products").doc(id));
        const prodDocs = !prodRefs.length ? [] : typeof db.getAll === "function" ? await db.getAll(...prodRefs) : await Promise.all(prodRefs.map((ref) => ref.get()));
        const prodById = new Map(uniqueProdIds.map((id, i) => [id, prodDocs[i]]));
        const items = lowDocs.flatMap((entry) => {
          const prod = prodById.get(entry.productId);
          if (!prod?.exists) return [];
          const pData = prod.data();
          const variant = entry.variantId ? productVolumeOptions(pData).find((v) => v.id === entry.variantId) : null;
          const name = variant ? `${String(pData.name || "")} (${variant.label})` : String(pData.name || "");
          return [{ id: entry.id, name, quantity: entry.quantity, ...(entry.reserved > 0 ? { reserved: entry.reserved, available: entry.available } : {}) }];
        });
        return res.status(200).json({ items });
      }
      if (req.method === "GET") {
        let query = db.collection("products").orderBy("__name__").limit(50);
        const cursor = req.query?.cursor;
        if (cursor) { if (!validId(cursor)) throw fail("Trang không hợp lệ.", 400); query = query.startAfter(cursor); }
        const page = await query.get();
        const rows = page.docs.flatMap((product) => {
          const data = product.data();
          const variants = productVolumeOptions(data);
          if (variants.length) {
            return variants.map((variant) => ({
              id: inventoryDocId(product.id, variant.id),
              productId: product.id,
              variantId: variant.id,
              variantLabel: variant.label,
              name: `${String(data.name || "")} (${variant.label})`,
              ...(data.number ? { number: String(data.number) } : {}),
            }));
          }
          return [{
            id: product.id,
            name: String(data.name || ""),
            ...(data.number ? { number: String(data.number) } : {}),
          }];
        });
        const refs = rows.map((row) => db.collection("inventory").doc(row.id));
        const stockDocs = !refs.length ? [] : typeof db.getAll === "function" ? await db.getAll(...refs) : await Promise.all(refs.map((ref) => ref.get()));
        const items = rows.map((row, index) => {
          const stock = stockDocs[index]?.data?.();
          const reserved = Number.isSafeInteger(stock?.reserved) && stock.reserved >= 0 ? stock.reserved : null;
          return { ...row, quantity: stock?.quantity ?? null, ...(reserved !== null ? { reserved } : {}), version: stock?.version || 0, updatedAt: stock?.updatedAt?.toMillis?.() ?? (stock?.updatedAt ? new Date(stock.updatedAt).getTime() : null) };
        });
        return res.status(200).json({ items, nextCursor: page.docs.length === 50 ? page.docs.at(-1).id : null });
      }
      if (req.headers.origin !== new URL(env.NEWSLETTER_SITE_ORIGIN || "https://ororavn.com").origin) throw fail("Tên miền không hợp lệ.", 403);
      if (!String(req.headers["content-type"] || "").startsWith("application/json")) throw fail("Chỉ nhận dữ liệu JSON.", 415);
      if (Number(req.headers["content-length"] || 0) > 2048) throw fail("Nội dung quá dài.", 413);
      let body;
      try { body = typeof req.body === "string" ? JSON.parse(req.body) : req.body; } catch { throw fail("Dữ liệu không hợp lệ.", 400); }
      if (!body || Buffer.byteLength(JSON.stringify(body)) > 2048 || !validId(body.id) || !validQuantity(body.quantity) || !Number.isSafeInteger(body.version) || body.version < 0) throw fail("Nhập số lượng nguyên không âm và tải lại tồn kho hiện tại.", 400);
      const { productId, variantId } = parseInventoryId(body.id);
      const ref = db.collection("inventory").doc(body.id); const movement = db.collection("inventoryMovements").doc(randomUUID());
      const item = await db.runTransaction(async (tx) => {
        const [product, stock] = await tx.getAll(db.collection("products").doc(productId), ref);
        if (!product.exists) throw fail("Sản phẩm không còn tồn tại. Hãy tải lại.", 404);
        const pData = product.data();
        const variant = variantId ? productVolumeOptions(pData).find((v) => v.id === variantId) : null;
        if (variantId && !variant) throw fail("Dung tích sản phẩm không còn tồn tại. Hãy tải lại.", 404);
        const previous = stock.data() || {};
        if ((previous.version || 0) !== body.version) throw fail("Tồn kho vừa thay đổi do đơn hàng hoặc người khác cập nhật. Tải lại rồi kiểm tra trước khi lưu.");
        const syncedReserved = Number.isSafeInteger(previous.reserved) && previous.reserved >= 0
          ? previous.reserved
          : await countWaitingForStockKey(tx, db, body.id);
        const updatedAt = new Date(); const version = body.version + 1;
        tx.set(ref, { quantity: body.quantity, reserved: syncedReserved, version, updatedAt, updatedBy: user.uid }, { merge: true });
        tx.set(movement, { type: "adjustment", productId: body.id, before: previous.quantity ?? null, after: body.quantity, change: body.quantity - (previous.quantity || 0), actor: user.uid, createdAt: updatedAt });
        const displayName = variant ? `${String(pData.name || "")} (${variant.label})` : String(pData.name || "");
        return { id: body.id, ...(variant ? { productId, variantId, variantLabel: variant.label } : {}), name: displayName, ...(pData.number ? { number: String(pData.number) } : {}), quantity: body.quantity, reserved: syncedReserved, version, updatedAt: updatedAt.getTime() };
      });
      return res.status(200).json({ item, message: "Đã cập nhật tồn kho." });
    } catch (error) { return res.status(error.status || 503).json({ message: error.status ? error.message : "Chưa tải hoặc cập nhật được Kiểm Hàng. Vui lòng thử lại." }); }
  };
}
