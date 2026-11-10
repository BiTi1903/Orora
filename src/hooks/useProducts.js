import { useEffect, useState } from "react";

export default function useProducts({ enabled = true } = {}) {
  const [products, setProducts] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;

    import("../lib/api").then(({getPublicProducts})=>getPublicProducts())
      .then((list) => {
        if (alive) setProducts(list.filter((p) => p.active !== false));
      })
      .catch(() => {
        if (alive) setProducts([]);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, [enabled]);

  return { products, loading: enabled && !loaded };
}