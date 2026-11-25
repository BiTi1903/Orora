import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import { formatProductPrice } from "../lib/commerce";
import { cdnSrc, THUMB } from "../lib/image-cdn";
import { productPath } from "../lib/product-identity";

const STORAGE_KEY = "orora_recently_viewed";
const MAX_STORED = 8;

function readRecentIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((id) => typeof id === "string" && id) : [];
  } catch {
    return [];
  }
}

function recordRecentlyViewed(productId) {
  if (!productId || typeof window === "undefined") return;
  try {
    const next = [productId, ...readRecentIds().filter((id) => id !== productId)].slice(0, MAX_STORED);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota or private-mode errors.
  }
}

export default function RecentlyViewedProducts({ currentId, preview = false }) {
  const filteredIds = useMemo(
    () => (preview ? [] : readRecentIds().filter((id) => id && id !== currentId).slice(0, 4)),
    [currentId, preview],
  );
  const { products } = useProducts({ enabled: !preview && filteredIds.length > 0 });

  useEffect(() => {
    if (preview || !currentId) return;
    recordRecentlyViewed(currentId);
  }, [currentId, preview]);

  if (preview || !filteredIds.length || !products.length) return null;

  const items = filteredIds
    .map((id) => products.find((product) => product.id === id && product.active !== false))
    .filter(Boolean);

  if (!items.length) return null;

  return (
    <section className="product-recently-viewed" aria-label="Sản phẩm vừa xem">
      <div className="product-recently-viewed-head">
        <span className="product-eyebrow">GỢI Ý CHO BẠN</span>
        <h2>Sản phẩm vừa xem</h2>
      </div>
      <div className="product-recently-viewed-grid">
        {items.map((item) => (
          <Link key={item.id} to={productPath(item, products)} className="product-recent-card">
            <div className="product-recent-thumb">
              {item.image ? (
                <img src={cdnSrc(item.image, THUMB)} alt={item.name} loading="lazy" decoding="async" />
              ) : (
                <span className="product-recent-placeholder" aria-hidden="true" />
              )}
            </div>
            <div className="product-recent-meta">
              <strong>{item.name}</strong>
              <span>{formatProductPrice(item.price) || "Liên hệ"}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
