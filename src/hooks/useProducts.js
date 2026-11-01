import { useEffect, useState } from "react";
import { getPublicProducts } from "../lib/api";

export default function useProducts({ enabled = true } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    getPublicProducts()
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
  }, [enabled]);

  return { products, loading };
}