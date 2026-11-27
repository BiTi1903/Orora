import { safeMailTracking } from "./mail-tracking.js";
import { syncOutlookBatch } from "./outlook-status.js";

export const reviewCollection = domain => domain === "orders" ? "orderMailReview" : "newsletterMailReview";

export function reviewRecord(kind, recipient, state, tracking, source, code = "") {
  const createdAt = new Date();
  const ids = safeMailTracking(tracking);
  return { kind, recipient, state, source, code, ...ids, createdAt, issueAt: state === "accepted" ? 0 : +createdAt,
    nextCheck: ids.trackingId ? +createdAt + 300000 : null };
}

export async function reviewPage(collection, params) {
  const field = params.all === "1" ? "createdAt" : "issueAt";
  let query = field === "issueAt" ? collection.where(field, ">", 0) : collection;
  query = query.orderBy(field, "desc");
  if (params.cursor) {
    if (!/^[\w-]{1,240}$/.test(params.cursor)) throw Object.assign(new Error("Mốc trang không hợp lệ."), {status:400});
    const cursor = await collection.doc(params.cursor).get();
    if (!cursor.exists) throw Object.assign(new Error("Hãy tải lại danh sách."), {status:400});
    query = query.startAfter(cursor);
  }
  const page = await query.limit(26).get();
  const rows = page.docs.slice(0,25).map(doc => {
    const r = doc.data();
    return { id:doc.id, kind:r.kind, recipient:r.recipient, code:r.code, orderId:r.source?.startsWith("orders/") ? r.source.split("/")[1] : null, state:r.state, outlook:r.outlook || null, trackable:Boolean(r.trackingId), createdAt:r.createdAt.toMillis?.() ?? +r.createdAt };
  });
  return { rows, cursor: page.docs.length > 25 ? rows.at(-1).id : null };
}

export async function checkReview(db, domain, ids, check) {
  if (!Array.isArray(ids) || ids.length > 30 || ids.some(id => typeof id !== "string" || !/^[\w-]{1,240}$/.test(id))) throw Object.assign(new Error("Chọn tối đa 30 thư mỗi lượt."), {status:400});
  const docs = await Promise.all([...new Set(ids)].map(id => db.collection(reviewCollection(domain)).doc(id).get()));
  const tasks = docs.filter(doc => doc.exists && doc.data().trackingId);
  const results = await syncOutlookBatch(tasks.map(doc => ({ref:doc.ref})), check);
  await Promise.all(tasks.map(async (doc,i) => {
    const row = doc.data(), outlook = results[i], now = Date.now();
    const issue = ["bounced","delayed","not_found"].includes(outlook.state) || row.state !== "accepted";
    const patch = { issueAt: issue ? row.issueAt || now : 0, nextCheck: outlook.state !== "bounced" && now - (row.createdAt.toMillis?.() ?? +row.createdAt) < 7*86400000 ? now + 86400000 : null };
    await db.runTransaction(async tx => {
      const latest = await tx.get(doc.ref);
      if (latest.data()?.trackingId !== row.trackingId || latest.data()?.outlook?.checkedAt !== outlook.checkedAt) return;
      const source = db.doc(row.source);
      const saved = await tx.get(source);
      tx.update(doc.ref,patch);
      if (!saved.exists) return;
      if (row.kind === "store") tx.update(source,{"storeNotification.outlook":outlook});
      else if (row.kind === "order" || saved.data()?.welcomeTracking?.trackingId === row.trackingId) {
        tx.update(source, {outlook, ...(row.kind === "welcome" && outlook.state === "bounced" && saved.data().status === "active" ? {status:"bounced",bouncedAt:new Date()} : {})});
      }
    });
  }));
  return {checked:tasks.length};
}
