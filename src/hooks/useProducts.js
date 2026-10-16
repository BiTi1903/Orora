import { useEffect, useState } from "react";
import { getProducts } from "../lib/api";

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