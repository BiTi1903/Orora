import { useEffect, useRef } from "react";
import useHomeContent from "../hooks/useHomeContent";
import { splitColor, toCss } from "../lib/typography";
import "../styles/scroll-text.css";

const DEFAULT_TEXT =
  "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦\nTRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.";

function ScrollText({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const secRef = useRef(null);
  const home = useHomeContent();
  const c = preview && previewData ? previewData : home || {};
  const label = c.philosophyLabel || "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦";
  const text = c.philosophyBody || c.philosophyText || "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.";
  const parsed = parseInt(c.philosophyAccentCount, 10);
  const accentCount = Number.isFinite(parsed) ? Math.max(parsed, 0) : 4;
  const lines = text.split("\n");
  const words = lines.flatMap((line) => line.split(/\s+/).filter(Boolean));
  const st = c.philosophyStyles || {};
  const { color: onColor, rest: bodyRest } = splitColor(st.text);
  const accent = toCss(st.accent);
  const bodyStyle = { ...bodyRest, whiteSpace: "pre-line" };
  if (onColor) bodyStyle["--st-on"] = onColor;
  if (accent.color) bodyStyle["--st-accent"] = accent.color;
  if (accent.fontStyle) bodyStyle["--st-accent-style"] = accent.fontStyle;

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  useEffect(() => {
    const sec = secRef.current;
    if (!sec) return;
    const spans = sec.querySelectorAll(".st-word");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      spans.forEach((s) => s.classList.add("on"));
      return;
    }
    let raf = 0;
    const update = () => {
      const r = sec.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(Math.max((vh * 0.8 - r.top) / (r.height * 0.9), 0), 1);
      const count = Math.round(p * spans.length);
      spans.forEach((s, i) => s.classList.toggle("on", i < count));
      raf = 0;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [text, accentCount]);

  let wordIndex = 0;

  return (
    <section className="scroll-text" ref={secRef}>
      <p
        className={`scroll-text-label${preview && selectedElement === "philLabel" ? " builder-selected" : ""}`}
        style={{ ...toCss(st.label, { responsive: !preview }), whiteSpace: "pre-line" }}
        onClick={select("philLabel")}
      >
        {label}
      </p>
      <p
        className={`scroll-text-body${preview && selectedElement === "philText" ? " builder-selected" : ""}`}
        style={bodyStyle}
        onClick={select("philText")}
      >
        {lines.map((line, lineIndex) => {
          const lineWords = line.split(/\s+/).filter(Boolean);
          return (
            <span key={lineIndex} className="st-line">
              {lineWords.map((w) => {
                const i = wordIndex;
                wordIndex += 1;
                return (
                  <span
                    key={`${lineIndex}-${i}`}
                    className={`st-word${i >= words.length - accentCount ? " accent" : ""}`}
                  >
                    {w}{" "}
                  </span>
                );
              })}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          );
        })}
      </p>
    </section>
  );
}

export default ScrollText;
