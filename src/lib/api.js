import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
} from "firebase/firestore";

import { db } from "./firebase";

const needDb = () => {
  if (!db) throw new Error("Firebase chưa được cấu hình.");
};

export async function getProducts() {
  if (!db) return [];

  const snap = await getDocs(collection(db, "products"));

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) =>
      String(a.number || "").localeCompare(
        String(b.number || ""),
        undefined,
        { numeric: true }
      )
    );
}

export async function getProduct(slug) {
  if (!db || !slug) return null;

  const snap = await getDoc(doc(db, "products", slug));

  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// tên khác của getProduct, để các file gọi bằng tên nào cũng chạy
export const getProductBySlug = getProduct;

export async function saveProduct(product) {
  needDb();

  const id = product.id || product.slug;

  if (!id) throw new Error("Sản phẩm cần có slug.");

  await setDoc(
    doc(db, "products", id),
    { ...product, id },
    { merge: true }
  );

  return id;
}

export async function removeProduct(id) {
  needDb();

  await deleteDoc(doc(db, "products", id));
}

export async function getHomeContent() {
  if (!db) return null;

  const snap = await getDoc(doc(db, "settings", "home"));

  return snap.exists() ? snap.data() : null;
}

export async function saveHomeContent(content) {
  needDb();

  await setDoc(
    doc(db, "settings", "home"),
    content,
    { merge: true }
  );
}

export const explainError = (err) =>
  err?.code === "permission-denied"
    ? "Tài khoản này chưa có quyền ghi. Kiểm tra lại UID trong Firestore Rules."
    : err?.message || "Có lỗi xảy ra.";
export async function saveCategory({ id, name }) {
  needDb();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 80) throw new Error("Tên danh mục cần từ 1 đến 80 ký tự.");
  const categoryId = id || crypto.randomUUID();
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "settings", "productCategories");
    const snapshot = await transaction.get(ref);
    const items = snapshot.data()?.items || [];
    if (items.some((item) => item.id !== categoryId && item.name.toLocaleLowerCase("vi") === trimmed.toLocaleLowerCase("vi"))) {
      throw new Error("Tên danh mục đã tồn tại.");
    }
    const category = { id: categoryId, name: trimmed };
    transaction.set(ref, { items: items.some((item) => item.id === categoryId)
      ? items.map((item) => item.id === categoryId ? category : item)
      : [...items, category] }, { merge: true });
  });
  return categoryId;
}
