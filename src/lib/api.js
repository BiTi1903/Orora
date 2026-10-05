import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
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

/* ---------- LẤY SẢN PHẨM THEO SLUG ---------- */

export async function getProduct(slug) {
  if (!db || !slug) return null;

  // Cách 1: thử document ID = slug
  try {
    const directSnap = await getDoc(doc(db, "products", slug));

    if (directSnap.exists()) {
      return {
        id: directSnap.id,
        ...directSnap.data(),
      };
    }
  } catch (error) {
    console.warn("Không thể lấy product theo document ID:", error);
  }

  // Cách 2: tìm theo field slug
  try {
    const q = query(
      collection(db, "products"),
      where("slug", "==", slug)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      const item = snap.docs[0];

      return {
        id: item.id,
        ...item.data(),
      };
    }
  } catch (error) {
    console.error("Không thể tìm product theo slug:", error);
  }

  return null;
}

// tên khác của getProduct
export const getProductBySlug = getProduct;

export async function saveProduct(product) {
  needDb();

  const id = product.id || product.slug;

  if (!id) {
    throw new Error("Sản phẩm cần có slug.");
  }

  await setDoc(
    doc(db, "products", id),
    {
      ...product,
      id,
    },
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