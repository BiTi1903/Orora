import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import { formatProductPrice } from "../lib/commerce";
import { cdnSrc, THUMB } from "../lib/image-cdn";
import { productPath } from "../lib/product-identity";
import { toCss } from "../lib/typography";

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

export default function RecentlyViewedProducts({
  currentId,
  preview = false,
  previewProducts = [],
  settings = {},
  selectedClass,
  select,
  tr = (text) => text,
}) {
  const s = settings || {};
  const enabled = s.enabled !== false;
  const limit = Math.max(1, Math.min(4, Number(s.limit) || 4));

  const filteredIds = useMemo(
    () => (preview ? [] : readRecentIds().filter((id) => id && id !== currentId).slice(0, limit)),
    [currentId, preview, limit],
  );
  const { products } = useProducts({ enabled: !preview && enabled && filteredIds.length > 0 });

  useEffect(() => {
    if (preview || !currentId) return;
    recordRecentlyViewed(currentId);
  }, [currentId, preview]);

  if (!enabled && !preview) return null;

  const catalog = preview ? previewProducts : products;
  const items = preview
    ? (previewProducts.filter((product) => product?.id !== currentId).length
        ? previewProducts.filter((product) => product?.id !== currentId)
        : previewProducts
      ).slice(0, limit)
    : filteredIds
        .map((id) => products.find((product) => product.id === id && product.active !== false))
        .filter(Boolean);

  if (!items.length) return null;

  const eyebrowText = tr(s.eyebrow?.trim() || "GỢI Ý CHO BẠN");
  const titleText = tr(s.title?.trim() || "Sản phẩm vừa xem");

  const sectionStyle = {
    ...(s.background ? { background: s.background } : {}),
    ...(s.borderColor ? { borderColor: s.borderColor } : {}),
    ...(s.borderRadius != null ? { borderRadius: `${s.borderRadius}px` } : {}),
    ...(s.padding != null ? { padding: `${s.padding}px` } : {}),
    ...(preview && !enabled ? { opacity: 0.42 } : {}),
  };

  const gridStyle = s.gap != null ? { gap: `${s.gap}px` } : undefined;
  const cardStyle = {
    ...(s.cardBackground ? { background: s.cardBackground } : {}),
    ...(s.cardBorderColor ? { borderColor: s.cardBorderColor } : {}),
    ...(s.cardRadius != null ? { borderRadius: `${s.cardRadius}px` } : {}),
  };
  const thumbStyle = s.thumbRadius != null ? { borderRadius: `${s.thumbRadius}px` } : undefined;
  const eyebrowCss = toCss(s.eyebrowStyle);
  const titleCss = toCss(s.titleStyle);
  const nameCss = toCss(s.nameStyle);
  const priceCss = toCss(s.priceStyle);

  return (
    <section
      className={`product-recently-viewed ${selectedClass ? selectedClass("pdRecentlyViewed") : ""}`}
      aria-label={titleText}
      data-builder-key={preview ? "pdRecentlyViewed" : undefined}
      onClick={preview && select ? select("pdRecentlyViewed") : undefined}
      style={sectionStyle}
    >
      <div className="product-recently-viewed-head">
        {eyebrowText && (
          <span className="product-eyebrow" style={eyebrowCss}>
            {eyebrowText}
          </span>
        )}
        <h2 style={titleCss}>{titleText}</h2>
      </div>
      <div className="product-recently-viewed-grid" style={gridStyle}>
        {items.map((item) => (
          <Link
            key={item.id}
            to={preview ? "#" : productPath(item, catalog)}
            className="product-recent-card"
            style={cardStyle}
            onClick={(event) => {
              if (preview) {
                event.preventDefault();
              }
            }}
          >
            <div className="product-recent-thumb" style={thumbStyle}>
              {item.image ? (
                <img src={cdnSrc(item.image, THUMB)} alt={item.name} loading="lazy" decoding="async" />
              ) : (
                <span className="product-recent-placeholder" aria-hidden="true" />
              )}
            </div>
            <div className="product-recent-meta">
              <strong style={nameCss}>{item.name}</strong>
              <span style={priceCss}>{formatProductPrice(item.price) || tr("Liên hệ")}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
