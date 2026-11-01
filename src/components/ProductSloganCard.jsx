export default function ProductSloganCard({ home = {}, textProps = () => ({}) }) {
  const settings = home.productSlogan;
  const text = typeof settings?.text === "string" ? settings.text : "";
  if (home.loading || settings?.enabled === false || !text.trim()) return null;
  const title = typeof settings?.title === "string" ? settings.title.trim() : "";
  return <aside className="product-slogan-card" aria-label="Slogan">
    <span className="product-slogan-symbol" aria-hidden="true">✦</span>
    <h2 {...textProps("pdSloganTitle", "sloganTitle")}>{title || "Slogan"}</h2>
    <p {...textProps("pdSloganBody", "sloganBody")}>{text}</p>
  </aside>;
}
