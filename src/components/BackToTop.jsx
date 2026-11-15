import useHomeContent from "../hooks/useHomeContent";
import { useEffect, useRef, useState } from "react";
import "../styles/back-to-top.css";

const R = 20;
const C = 2 * Math.PI * R;

function BackToTop() {
  const surfaces=useHomeContent().navStyles?.surfaces||{};
  const offset=(value,fallback,max)=>Math.max(8,Math.min(max,Number(value??fallback)||fallback));
  const [visible, setVisible] = useState(false);
  const ring = useRef(null);

  useEffect(() => {
    let frame = 0, previous = -1;
    const measure = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.max(0, Math.min(window.scrollY / max, 1)) : 0;
      if (progress !== previous) {
        ring.current?.setAttribute("stroke-dashoffset", String(C * (1 - progress)));
        previous = progress;
      }
      // React only changes when the button becomes visible/hidden, not per pixel.
      setVisible(progress > .06);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = window.ResizeObserver ? new ResizeObserver(schedule) : null;
    observer?.observe(document.documentElement);
    return () => {
      cancelAnimationFrame(frame);observer?.disconnect();
      window.removeEventListener("scroll", schedule);window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <button
      style={{"--back-top-offset":`${offset(surfaces.backToTopOffset,24,80)}px`,"--back-top-mobile-offset":`${offset(surfaces.backToTopMobileOffset,12,40)}px`}}
      type="button"
      className={`back-to-top ${visible ? "show" : ""}`}
      tabIndex={visible?0:-1}
      aria-hidden={!visible}
      onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth" })}
      aria-label="Lên đầu trang"
    >
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle className="btt-track" cx="24" cy="24" r={R} />
        <circle
          ref={ring}
          className="btt-bar"
          cx="24"
          cy="24"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C}
        />
      </svg>
      <span>↑</span>
    </button>
  );
}

export default BackToTop;