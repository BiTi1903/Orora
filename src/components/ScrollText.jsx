import { useEffect, useRef } from "react";
import useHomeContent from "../hooks/useHomeContent";
import { splitColor, toCss } from "../lib/typography";
import "../styles/scroll-text.css";

function ScrollText({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const secRef = useRef(null);
  const home = useHomeContent();
  const c = preview && previewData ? previewData : home || {};
  const label = c.philosophyLabel || "";
  const text = c.philosophyBody || c.philosophyText || "";
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
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0, previousCount = -1, inView = !window.IntersectionObserver;
    const paint = count => {
      if (count === previousCount) return;
      const from = previousCount < 0 ? 0 : Math.min(previousCount, count);
      const to = previousCount < 0 ? spans.length : Math.max(previousCount, count);
      for (let index = from; index < to; index++) spans[index].classList.toggle("on", index < count);
      previousCount = count;
    };
    const update = () => {
      raf = 0;
      if (motion.matches) { paint(spans.length); return; }
      const r = sec.getBoundingClientRect();
      const p = Math.min(Math.max((window.innerHeight * .8 - r.top) / Math.max(1, r.height * .9), 0), 1);
      paint(Math.round(p * spans.length));
    };
    if (preview) { paint(spans.length); return; }
    const schedule = () => { if (!raf) raf = requestAnimationFrame(update); };
    const onScroll = () => { if (inView && !motion.matches) schedule(); };
    const observer = window.IntersectionObserver ? new IntersectionObserver(entries => {
      inView = entries.some(entry => entry.isIntersecting);
      // Enter/exit also paints the fully revealed or unrevealed endpoint.
      schedule();
    }) : null;
    observer?.observe(sec);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    motion.addEventListener("change", schedule);
    return () => {
      observer?.disconnect();cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", schedule);
    };
  }, [text, accentCount, preview]);


  return (
    <section className="scroll-text" ref={secRef}>
      <p
        className={`scroll-text-label${preview && selectedElement === "philLabel" ? " builder-selected" : ""}`}
        style={{ ...toCss(st.label, { responsive: true }), whiteSpace: "pre-line" }}
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
          const offset = lines.slice(0, lineIndex).reduce((sum, previous) => sum + previous.split(/\s+/).filter(Boolean).length, 0);
          return (
            <span key={lineIndex} className="st-line">
              {lineWords.map((w, wordIndex) => {
                const i = offset + wordIndex;
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
