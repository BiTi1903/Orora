import { createReadFlight } from "./read-flight.js";
import { findProductByRoute, nextProductSequence, productSlug } from "./product-identity.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  runTransaction,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

const needDb = () => {
  if (!db) throw new Error("Firebase chưa được cấu hình.");
};

const productsRead = createReadFlight();
const homeRead = createReadFlight();

export function getProducts() {
  if (!db) return Promise.resolve([]);
  return productsRead.run(async () => {
    const snap = await getDocs(collection(db, "products"));

    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .sort((a, b) =>
        String(a.number || "").localeCompare(
          String(b.number || ""),
          undefined,
          { numeric: true }
        )
      );
  });
}

let productCatalogCache = null;
export function getPublicProducts() {
  if (!db) return Promise.reject(new Error("Firebase chưa được cấu hình."));
  if (productCatalogCache && Date.now() - productCatalogCache.at < 30_000) return productCatalogCache.promise;
  const entry = { at: Date.now() };
  entry.promise = fetch("/api/storefront/catalog").then(async response=>{
    if(!response.ok)throw new Error("Chưa tải được danh mục sản phẩm.");
    const data=await response.json();
    if(!Array.isArray(data.products))throw new Error("Danh mục sản phẩm không hợp lệ.");
    return data.products;
  }).catch((error) => { if (productCatalogCache === entry) productCatalogCache = null; throw error; });
  productCatalogCache = entry;
  return entry.promise;
}
export async function getProduct(identifier) {
  if (!identifier) return null;
  needDb();
  const products = await getPublicProducts();
  // Use the cached object so a legacy-to-canonical redirect does not replay page animations.
  const match = findProductByRoute(products, identifier);
  return match ? products.find((product) => product.id === match.id) : null;
}

// tên khác của getProduct, để các file gọi bằng tên nào cũng chạy
export const getProductBySlug = getProduct;

export async function saveProduct(product, { create = false } = {}) {
  needDb();
  if (create) {
    const catalog = await getProducts();
    const counter = doc(db, "settings", "productSequence");
    const id = await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(counter);
      const number = nextProductSequence(catalog, snapshot.data()?.lastNumber);
      const id = String(number);
      const target = doc(db, "products", id);
      if ((await transaction.get(target)).exists()) throw new Error("Mã sản phẩm vừa được dùng. Tải lại danh sách rồi thử lại.");
      const record = { ...product, id, number: id.padStart(2, "0") };
      record.slug = productSlug(record, catalog);
      transaction.set(target, record);
      transaction.set(counter, { lastNumber: number }, { merge: true });
      return id;
    });
    productsRead.invalidate();
    productCatalogCache = null;
    return id;
  }
  const id = product.id;
  if (!id) throw new Error("Sản phẩm cần có mã dữ liệu.");
  await setDoc(doc(db, "products", id), { ...product, id }, { merge: true });
  productsRead.invalidate();
  productCatalogCache = null;
  return id;
}

export async function removeProduct(id) {
  needDb();

  await deleteDoc(doc(db, "products", id));
  productsRead.invalidate();
  productCatalogCache = null;
}

export function getHomeContent() {
  if (!db) return Promise.resolve(null);
  return homeRead.run(async () => {
    const snap = await getDoc(doc(db, "settings", "home"));
    return snap.exists() ? snap.data() : null;
  });
}

export async function saveHomeContent(content) {
  needDb();

  await setDoc(
    doc(db, "settings", "home"),
    content,
    { merge: true }
  );
  homeRead.invalidate();
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

export async function deleteCategory(id) {
  needDb();
  if (!id || typeof id !== "string") throw new Error("Danh mục không hợp lệ.");
  await runTransaction(db, async (transaction) => {
    const ref = doc(db, "settings", "productCategories");
    const snapshot = await transaction.get(ref);
    const items = snapshot.data()?.items || [];
    transaction.set(ref, { items: items.filter((item) => item.id !== id) }, { merge: true });
  });
}

export async function setProductCategory(id, categoryId) {
  needDb();
  if (!id || typeof categoryId !== "string") throw new Error("Danh mục không hợp lệ.");
  await updateDoc(doc(db, "products", id), { categoryId });
  productsRead.invalidate();
  productCatalogCache = null;
}
