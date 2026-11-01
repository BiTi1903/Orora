import { toCss } from "../lib/typography";

const compactTypography = (value, maximum) => {
  const saved = toCss(value);
  const style = {};
  for (const key of ["fontFamily", "fontWeight", "fontStyle", "color", "textTransform"]) if (saved[key]) style[key] = saved[key];
  if (Number(value?.fontSize) > 0) style.fontSize = `${Math.min(Number(value.fontSize), maximum)}px`;
  return style;
};

export default function ProductPhilosophyCard({ home = {}, textProps = () => ({}) }) {
  const text = home.philosophyBody || home.philosophyText || "";
  if (home.loading || home.sectionVisibility?.philosophy === false || !text.trim()) return null;
  const labelProps = textProps("pdPhilosophyTitle", "philosophyTitle");
  const bodyProps = textProps("pdPhilosophyBody", "philosophyBody");
  const styles = home.philosophyStyles || {};
  const parsed = Number.parseInt(home.philosophyAccentCount, 10);
  const count = Number.isFinite(parsed) ? Math.max(0, parsed) : 4;
  const tokens = text.split(/(\s+)/);
  const words = tokens.filter((token) => token.trim()).length;
  let position = 0;
  return <aside className="product-philosophy-card" aria-label="Triết lý ORORA">
    <span className="product-philosophy-symbol" aria-hidden="true">✦</span>
    <h2 {...labelProps} style={{ ...compactTypography(styles.label, 13), ...labelProps.style }}>{home.philosophyLabel?.trim() || "Triết lý ORORA"}</h2>
    <p {...bodyProps} style={{ ...compactTypography(styles.text, 26), ...bodyProps.style }}>{tokens.map((token, index) => {
      if (!token.trim()) return token;
      const accent = position++ >= words - count;
      return <span key={index} className={accent ? "product-philosophy-accent" : undefined} style={accent ? compactTypography(styles.accent, 26) : undefined}>{token}</span>;
    })}</p>
  </aside>;
}
