import { useEffect, useState } from "react";
import { getProducts } from "../lib/api";
import { defaultProducts } from "../data/content";

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    getProducts()
      .then((list) => {
        if (alive) setProducts(list.filter((p) => p.active !== false));
      })
      .catch(() => {
        // Firestore lỗi thì vẫn hiện sản phẩm mẫu để web không bị trống
        if (alive) setProducts(defaultProducts);
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