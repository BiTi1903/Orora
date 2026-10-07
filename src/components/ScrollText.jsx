import { useEffect, useRef } from "react";
import useHomeContent from "../hooks/useHomeContent";
import { splitColor, toCss } from "../lib/typography";
import "../styles/scroll-text.css";

const DEFAULT_LABEL = "✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦";
const DEFAULT_TEXT =
  "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.";

function ScrollText() {
  const secRef = useRef(null);
  const c = useHomeContent();

  const label = c.philosophyLabel || DEFAULT_LABEL;
  const text = c.philosophyText || DEFAULT_TEXT;

  const parsed = parseInt(c.philosophyAccentCount, 10);
  const accentCount = Number.isFinite(parsed) ? Math.max(parsed, 0) : 4;

  const words = text.split(/\s+/).filter(Boolean);

  /* kiểu chữ do admin chỉnh (màu đi qua biến CSS vì chữ đổi màu theo cuộn) */
  const st = c.philosophyStyles || {};
  const { color: onColor, rest: bodyRest } = splitColor(st.text);
  const accent = toCss(st.accent);

  const bodyStyle = { ...bodyRest };
  if (onColor) bodyStyle["--st-on"] = onColor;
  if (accent.color) bodyStyle["--st-accent"] = accent.color;
  if (accent.fontStyle) bodyStyle["--st-accent-style"] = accent.fontStyle;

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
    /* chạy lại khi nội dung đổi để danh sách chữ luôn đúng */
  }, [text, accentCount]);

  return (
    <section className="scroll-text" ref={secRef}>
      <p className="scroll-text-label" style={toCss(st.label)}>
        {label}
      </p>
      <p className="scroll-text-body" style={bodyStyle}>
        {words.map((w, i) => (
          <span
            key={i}
            className={`st-word${i >= words.length - accentCount ? " accent" : ""}`}
          >
            {w}{" "}
          </span>
        ))}
      </p>
    </section>
  );
}

export default ScrollText;