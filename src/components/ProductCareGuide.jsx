import { sloganAppearance, sloganTextStyle } from '../lib/product-slogan';
import { DEFAULT_CARE_GUIDE } from "../lib/product-care-guide";
export default function ProductCareGuide({ value }) {
  const s = value ?? DEFAULT_CARE_GUIDE;
  if (s.enabled === false) return null;
  const items = Array.isArray(s.items) ? s.items : [];
  if (!s.title?.trim() && !s.text?.trim() && !items.length) return null;
  const card = sloganAppearance(s.card);
  const itemCard = sloganAppearance(s.itemCard);
  const divider = a => a.divider !== 'none' && <span className="product-slogan-divider" style={{ borderTopStyle:a.divider,borderTopColor:a.dividerColor }} aria-hidden="true" />;
  const link = (url) => /^(https?:\/\/|\/(?!\/)|#)/i.test(url || '') ? url : null;
  return <section className="product-care-guide" style={card.style} aria-label="Cách chăm sóc">
    {card.showTitle && s.title && <h2 style={sloganTextStyle(s.heading)}>{s.title}</h2>}
    {divider(card)}
    {s.text && <p style={sloganTextStyle(s.body)}>{s.text}</p>}
    <div className="product-care-grid">{items.map((item, i) => <div className="product-care-item" key={item.id || i} style={itemCard.style}>
      {itemCard.showTitle && item.title && <h3 style={sloganTextStyle(s.itemHeading)}>{item.title}</h3>}
      {divider(itemCard)}
      {item.text && <p style={sloganTextStyle(s.itemBody)}>{item.text}</p>}
      {item.label && link(item.url) && <a href={link(item.url)} style={sloganTextStyle(s.linkStyle)}>{item.label}</a>}
    </div>)}</div>
  </section>;
}
