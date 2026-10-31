import { randomUUID } from "node:crypto";
import { mailActor } from "./mail-actor.js";

// Written with the order/stock transaction; never trust actor fields from the request.
export function recordOrderActivity(tx, orderRef, { before, after, user, createdAt, action = "order_updated", quantity }) {
  const changes = {};
  for (const field of ["status", "paymentStatus"]) {
    if (before[field] !== after[field]) changes[field] = { before: before[field] || "", after: after[field] || "" };
  }
  if (before.inventory?.state !== after.inventory?.state) changes.inventory = { before: before.inventory?.state || "", after: after.inventory?.state || "" };
  if (!Object.keys(changes).length) return null;
  const id = randomUUID();
  const record = { action, changes, ...mailActor(user), createdAt, ...(Number.isSafeInteger(quantity) ? { quantity } : {}) };
  tx.set(orderRef.collection("activityEvents").doc(id), record);
  return { id, ...record, createdAt: createdAt.getTime() };
}
