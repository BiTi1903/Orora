import { auth } from "../lib/firebaseAuth";
import { withProductIdentity } from "../lib/product-identity";
import { orderRequest } from "./order-api";
import { newsletterRequest } from "./newsletter-api";

const cache = new Map();
const inflight = new Map();
let templatesEnsured = false;

export const getAdminCache = (key) => cache.get(key) || null;
export const setAdminCache = (key, value) => {
  cache.set(key, value);
  return value;
};
export const clearAdminCache = (key) => {
  if (key) {
    cache.delete(key);
    inflight.delete(key);
    return;
  }
  cache.clear();
  inflight.clear();
  templatesEnsured = false;
};

function dedupe(key, fetcher, { force = false } = {}) {
  if (!force && inflight.has(key)) return inflight.get(key);
  const promise = Promise.resolve()
    .then(fetcher)
    .then((data) => {
      cache.set(key, data);
      return data;
    })
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key);
    });
  inflight.set(key, promise);
  return promise;
}

export async function inventoryApiRequest(body, cursor, pending = false) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const response = await fetch(
    `/api/inventory?${new URLSearchParams({ ...(cursor ? { cursor } : {}), ...(pending ? { pending: "1" } : {}) })}`,
    {
      method: body ? "POST" : "GET",
      headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Chưa kết nối được API Kiểm Hàng.");
  }
  if (!response.ok) throw new Error(result.message || "Chưa cập nhật được Kiểm Hàng.");
  return result;
}

export function fetchOrdersCached(options) {
  return dedupe(
    "orders",
    async () => {
      const data = await orderRequest();
      return { orders: data.orders || [], nextCursor: data.nextCursor ?? null };
    },
    options,
  );
}

export function fetchInventoryCached(options) {
  return dedupe(
    "inventory",
    async () => {
      const all = new Map();
      const seen = new Set();
      let cursor;
      do {
        const page = await inventoryApiRequest(null, cursor);
        page.items.forEach((item) => all.set(item.id, item));
        cursor = page.nextCursor;
        if (cursor && seen.has(cursor)) throw new Error("Không tải đủ sản phẩm. Hãy tải lại.");
        if (cursor) seen.add(cursor);
      } while (cursor);
      const list = [...all.values()];
      const needsPendingScan = list.some((item) => !Number.isSafeInteger(item.reserved));
      const pendingQuantities = Object.create(null);
      if (needsPendingScan) {
        const seenPending = new Set();
        let pCursor;
        do {
          const page = await inventoryApiRequest(null, pCursor, true);
          for (const [id, quantity] of Object.entries(page.pending)) {
            pendingQuantities[id] = (pendingQuantities[id] || 0) + quantity;
          }
          pCursor = page.nextCursor;
          if (pCursor && seenPending.has(pCursor)) throw new Error("Không tải đủ hàng đang chờ. Hãy tải lại.");
          if (pCursor) seenPending.add(pCursor);
        } while (pCursor);
      } else {
        for (const item of list) pendingQuantities[item.id] = item.reserved;
      }
      return { items: withProductIdentity(list), pendingQuantities };
    },
    options,
  );
}

export function fetchNewsletterCached(options) {
  return dedupe(
    "newsletter",
    async () => {
      const data = await newsletterRequest();
      return {
        contacts: data.contacts || [],
        nextCursor: data.nextCursor ?? null,
        campaigns: data.campaigns || [],
        welcome: data.welcome || { subject: "", text: "" },
      };
    },
    options,
  );
}

export function ensureNewsletterTemplatesOnce() {
  if (templatesEnsured) return;
  templatesEnsured = true;
  newsletterRequest({ action: "ensureDefaultTemplates" }).catch(() => {
    templatesEnsured = false;
  });
}

export function prefetchAdminTab(tab) {
  if (!auth?.currentUser) return;
  if (tab === "orders") {
    import("./OrdersAdmin").catch(() => {});
    if (!getAdminCache("orders")) fetchOrdersCached().catch(() => {});
  } else if (tab === "inventory") {
    import("./InventoryAdmin").catch(() => {});
    if (!getAdminCache("inventory")) fetchInventoryCached().catch(() => {});
  } else if (tab === "newsletter") {
    import("./NewsletterAdmin").catch(() => {});
    if (!getAdminCache("newsletter")) fetchNewsletterCached().catch(() => {});
  }
}
