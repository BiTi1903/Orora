import { useState } from 'react';
import { Link } from 'react-router-dom';
import useHomeContent from '../hooks/useHomeContent';
import useProducts from '../hooks/useProducts';
import { DEFAULT_PRODUCT_NEEDS, productsForNeed, faqForProduct } from '../lib/product-discovery';
import { sloganAppearance, sloganTextStyle } from '../lib/product-slogan';
import { productPath } from '../lib/product-identity';
import { formatProductPrice } from '../lib/commerce';

function Divider({ appearance }) {
  return appearance.divider !== 'none' ? <span className="product-slogan-divider" style={{ borderTopStyle: appearance.divider, borderTopColor: appearance.dividerColor }} aria-hidden="true" /> : null;
}

export function ProductNeedsView({ value, products = [], loading = false, preview = false }) {
  const s = value ?? DEFAULT_PRODUCT_NEEDS;
  const [selectedId, setSelectedId] = useState('');
  const items = (s.items || []).filter(item => item.enabled !== false && item.title?.trim());
  const selected = items.find(item => item.id === selectedId);
  if (s.enabled === false || !items.length) return null;
  const results = productsForNeed(selected, products);
  const frame = sloganAppearance(s.card), itemFrame = sloganAppearance(s.itemCard);
  return <section className="product-discovery product-needs" aria-label="Chọn sản phẩm theo nhu cầu" style={frame.style}>
    {frame.showTitle && s.title && <h2 style={sloganTextStyle(s.heading)}>{s.title}</h2>}
    <Divider appearance={frame} />
    {s.text && <p style={sloganTextStyle(s.body)}>{s.text}</p>}
    <div className="product-need-options" role="group" aria-label="Nhu cầu chăm sóc">{items.map(item => <button type="button" key={item.id} aria-pressed={selectedId === item.id} onClick={() => setSelectedId(item.id)} style={sloganTextStyle(s.itemHeading)}>{item.title}</button>)}</div>
    {selected && <div className="product-need-results" aria-live="polite" aria-busy={loading}>
      {selected.text && <p style={sloganTextStyle(s.itemBody)}>{selected.text}</p>}
      {loading ? <p>Đang tải sản phẩm…</p> : results.length ? <div className="product-need-grid">{results.map(product => <Link className="product-need-card" key={product.id} to={productPath(product)} aria-label={product.name} onClick={preview ? event => event.preventDefault() : undefined} style={itemFrame.style}>{product.image && <img src={product.image} alt={product.name || ''} loading="lazy" />}{itemFrame.showTitle && <strong style={sloganTextStyle(s.itemHeading)}>{product.name}</strong>}<Divider appearance={itemFrame} /><span style={sloganTextStyle(s.itemBody)}>{formatProductPrice(product.price)}</span></Link>)}</div> : s.emptyText && <p style={sloganTextStyle(s.itemBody)}>{s.emptyText}</p>}
    </div>}
    <a className="product-discovery-all" href="#shop" onClick={preview ? event => event.preventDefault() : undefined} style={sloganTextStyle(s.linkStyle)}>{s.linkLabel ?? 'Xem tất cả sản phẩm'}</a>
  </section>;
}
export default function ProductNeeds() {
  const home = useHomeContent();
  const { products, loading } = useProducts({ enabled: !home.loading && home.productNeeds?.enabled !== false });
  if (home.loading) return null;
  return <ProductNeedsView value={home.productNeeds} products={products} loading={loading} />;
}
export function ProductFaq({ value, product, preview = false }) {
  const s = value || {};
  const items = preview ? (s.items || []).filter(item => item.title?.trim() && item.text?.trim() && item.enabled !== false) : faqForProduct(s, product);
  if (s.enabled === false || !items.length) return null;
  const frame = sloganAppearance(s.card), itemFrame = sloganAppearance(s.itemCard);
  return <section className="product-discovery product-faq" aria-label="Câu hỏi thường gặp" style={frame.style}>
    {frame.showTitle && s.title && <h2 style={sloganTextStyle(s.heading)}>{s.title}</h2>}
    <Divider appearance={frame} />
    {s.text && <p style={sloganTextStyle(s.body)}>{s.text}</p>}
    <div className="product-faq-list">{items.map(item => <details key={item.id} style={itemFrame.style}><summary style={sloganTextStyle(s.itemHeading)}>{item.title}</summary><Divider appearance={itemFrame} /><p style={sloganTextStyle(s.itemBody)}>{item.text}</p></details>)}</div>
  </section>;
}
