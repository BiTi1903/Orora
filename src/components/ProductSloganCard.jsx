import { sloganAppearance, sloganTextStyle } from "../lib/product-slogan";
import SloganSymbol from "./SloganSymbol";

export default function ProductSloganCard({ home = {}, styles = {}, textProps = () => ({}), cardProps = {} }) {
  const settings = home.productSlogan;
  const text = typeof settings?.text === "string" ? settings.text : "";
  if (home.loading || settings?.enabled === false || !text.trim()) return null;
  const title = typeof settings?.title === "string" ? settings.title.trim() : "";
  const appearance = sloganAppearance(styles.sloganCard);
  const titleProps = textProps("pdSloganTitle", "sloganTitle");
  const bodyProps = textProps("pdSloganBody", "sloganBody");
  const symbol = appearance.symbol !== "none" && <span className="product-slogan-symbol" style={appearance.symbolStyle} data-effect={appearance.symbolEffect} aria-hidden="true"><span className="slogan-symbol-glyph"><SloganSymbol name={appearance.symbol} solid={appearance.solid} custom={appearance.customSymbol} /></span></span>;
  return <aside {...cardProps} className={`product-slogan-card ${cardProps.className || ""}`} aria-label="Slogan" style={{ ...appearance.style, ...cardProps.style }}>
    {appearance.decorations !== "none" && appearance.symbol !== "none" && <div className={`product-slogan-decorations is-${appearance.decorations}`} style={appearance.decorationStyle} aria-hidden="true">{Array.from({ length: appearance.decorations === "corners" ? 2 : 4 }, (_, index) => <span key={index}><SloganSymbol name={appearance.symbol} solid={appearance.solid} custom={appearance.customSymbol} /></span>)}</div>}
    <div className="product-slogan-content">
      {appearance.symbolPosition === "top" && symbol}
      {(appearance.showTitle || (appearance.symbolPosition === "heading" && symbol)) && <div className="product-slogan-heading">
        {appearance.symbolPosition === "heading" && symbol}
        {appearance.showTitle && <h2 {...titleProps} style={{ ...sloganTextStyle(styles.sloganTitle), ...titleProps.style }}>{title || "Slogan"}</h2>}
      </div>}
      {appearance.divider !== "none" && <span className="product-slogan-divider" style={{ borderTopStyle: appearance.divider, borderTopColor: appearance.dividerColor }} aria-hidden="true" />}
      <p {...bodyProps} style={{ ...sloganTextStyle(styles.sloganBody), ...bodyProps.style }}>{text}</p>
      {appearance.symbolPosition === "bottom" && symbol}
    </div>
  </aside>;
}
