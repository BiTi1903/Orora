import { useEffect, useState } from "react";
import { getProducts } from "../lib/api";

/* Nhiều component cùng gọi hook này (Collection, trang chi tiết...) →
   dùng chung 1 lần tải trong 30 giây thay vì mỗi nơi tải lại từ Firestore. */
const CACHE_MS = 30_000;
let cache = null; // { at, promise }

function loadProducts() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.promise;
  const promise = getProducts().catch((err) => {
    cache = null; // lỗi thì lần sau thử lại
    throw err;
  });
  cache = { at: Date.now(), promise };
  return promise;
}

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    loadProducts()
      .then((list) => {
        if (alive) setProducts(list.filter((p) => p.active !== false));
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  return { products, loading };
}