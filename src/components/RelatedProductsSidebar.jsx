import { Link } from "react-router-dom";
import useProducts from "../hooks/useProducts";
import { compactRelatedProducts } from "../lib/product-content";
import { cdnSrc, THUMB } from "../lib/cloudinary";
import { toCss } from "../lib/typography";

const compactStyle = (style, maximum) => {
  const result = toCss(style);
  // Keep saved colors/fonts, but constrain old full-page heading sizes to the narrow rail.
  if (result.fontSize) result.fontSize = `min(${result.fontSize}, ${maximum}px)`;
  if (result["--mobile-font-size"]) result["--mobile-font-size"] = `min(${result["--mobile-font-size"]}, ${maximum}px)`;
  delete result.maxWidth;
  for (const key of Object.keys(result)) if (/^(margin|padding)/.test(key)) delete result[key];
  return result;
};
// Older full-width buttons may have saved white text. Give it a contrasting surface.
const moreButtonStyle = (saved) => {
  const style = compactStyle(saved, 16);
  const color = String(style.color || "").trim().toLowerCase();
  const hex = color.match(/^#([a-f0-9]{3}|[a-f0-9]{6})$/i);
  const expanded = hex && (hex[1].length === 3 ? hex[1].split("").map((part) => part + part).join("") : hex[1]);
  const rgb = expanded ? [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16)) : color.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/)?.slice(1, 4).map(Number);
  const light = color === "white" || (rgb && rgb[0] * .299 + rgb[1] * .587 + rgb[2] * .114 > 160);
  return { ...style, background: light ? "#65243f" : "#fff0f5" };
};
export default function RelatedProductsSidebar({ product, preview = false, previewProducts = [], styles = {}, selectedElement = "", onSelect }) {
  const { products, loading } = useProducts({ enabled: !preview });
  const items = compactRelatedProducts(preview ? previewProducts : products, product);
  if (!loading && !items.length) return null;
  const pick = (key) => (event) => { if (!preview || !onSelect) return; event.preventDefault(); event.stopPropagation(); onSelect(key); };
  const selection = (key) => preview && selectedElement === key ? "builder-selected" : "";
  return <aside className="related-product-sidebar" aria-label="Sản phẩm khác">
    <h2 className={selection("relTitle")} data-builder-key={preview ? "relTitle" : undefined} onClick={pick("relTitle")} style={compactStyle(styles.relTitle, 24)}>{styles.relTitle?.text?.trim() || "Sản phẩm khác"}</h2>
    {loading && !preview ? <p className="related-product-loading" role="status">Đang tải sản phẩm…</p> : <div className="related-product-list">{items.map((item) => <Link key={item.id || item.slug} to={`/product/${encodeURIComponent(item.slug || item.id)}`} className="related-product-mini" title={item.name} aria-label={`Xem ${item.name}`} onClick={preview ? pick("relName") : undefined}>
      <span className={`related-product-image ${selection("relImage")}`} data-builder-key={preview ? "relImage" : undefined} onClick={preview ? pick("relImage") : undefined}>{item.image ? <img src={cdnSrc(item.image, THUMB)} alt="" loading="lazy" width="64" height="64" /> : <span aria-hidden="true">◇</span>}</span>
      <span className="related-product-copy"><strong className={selection("relName")} data-builder-key={preview ? "relName" : undefined} style={compactStyle(styles.relName, 15)}>{item.name}</strong><span className={`related-product-price ${selection("relPrice")}`} data-builder-key={preview ? "relPrice" : undefined} style={compactStyle(styles.relPrice, 14)} onClick={preview ? pick("relPrice") : undefined}>{item.price || "Liên hệ"}</span></span>
    </Link>)}</div>}
    <Link to="/#shop" style={moreButtonStyle(styles.relButton)} data-builder-key={preview ? "relButton" : undefined} className={`related-product-more ${selection("relButton")}`} onClick={preview ? pick("relButton") : undefined}>Xem tất cả sản phẩm <span aria-hidden="true">→</span></Link>
  </aside>;
}
