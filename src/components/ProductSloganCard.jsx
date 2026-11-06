import { sloganAppearance, sloganTextStyle } from "../lib/product-slogan";

export default function ProductSloganCard({ home = {}, styles = {}, textProps = () => ({}), cardProps = {} }) {
  const settings = home.productSlogan;
  const text = typeof settings?.text === "string" ? settings.text : "";
  if (home.loading || settings?.enabled === false || !text.trim()) return null;
  const title = typeof settings?.title === "string" ? settings.title.trim() : "";
  const appearance = sloganAppearance(styles.sloganCard);
  const titleProps = textProps("pdSloganTitle", "sloganTitle");
  const bodyProps = textProps("pdSloganBody", "sloganBody");
  const alignText = (style) => {
    const align = style.textAlign || appearance.style.textAlign;
    return { width: "100%", boxSizing: "border-box", marginLeft: ["center", "right"].includes(align) ? "auto" : 0, marginRight: align === "center" ? "auto" : 0, ...style };
  };
  return <aside {...cardProps} className={`product-slogan-card ${cardProps.className || ""}`} aria-label="Slogan" style={{ ...appearance.style, ...cardProps.style }}>
    <div className="product-slogan-content">
      {appearance.showTitle && title && <div className="product-slogan-heading">
        <h2 {...titleProps} style={alignText({ ...sloganTextStyle(styles.sloganTitle), ...titleProps.style })}>{title}</h2>
      </div>}
      {appearance.divider !== "none" && <span className="product-slogan-divider" style={{ borderTopStyle: appearance.divider, borderTopColor: appearance.dividerColor }} aria-hidden="true" />}
      <p {...bodyProps} style={alignText({ ...sloganTextStyle(styles.sloganBody), ...bodyProps.style })}>{text}</p>
    </div>
  </aside>;
}
