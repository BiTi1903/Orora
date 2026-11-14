import useHomeContent from "../hooks/useHomeContent";
import { useEffect, useState } from "react";
import "../styles/back-to-top.css";

const R = 20;
const C = 2 * Math.PI * R;

function BackToTop() {
  const surfaces=useHomeContent().navStyles?.surfaces||{};
  const offset=(value,fallback,max)=>Math.max(8,Math.min(max,Number(value??fallback)||fallback));
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visible = progress > 0.06;

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
          className="btt-bar"
          cx="24"
          cy="24"
          r={R}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - progress)}
        />
      </svg>
      <span>↑</span>
    </button>
  );
}

export default BackToTop;