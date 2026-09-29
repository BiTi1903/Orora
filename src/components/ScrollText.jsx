import { useEffect, useRef } from "react";
import "../styles/scroll-text.css";

const TEXT =
  "TRÂN TRỌNG TỪNG CHÚT YÊU THƯƠNG DÀNH CHO CHÍNH MÌNH.";

function ScrollText() {
  const secRef = useRef(null);
  const words = TEXT.split(" ");

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
  }, []);

  return (
    <section className="scroll-text" ref={secRef}>
      <p className="scroll-text-label">✦ TRIẾT LÝ CỦA CHÚNG TÔI ✦</p>
      <p className="scroll-text-body">
        {words.map((w, i) => (
          <span key={i} className="st-word">{w} </span>
        ))}
      </p>
    </section>
  );
}

export default ScrollText;