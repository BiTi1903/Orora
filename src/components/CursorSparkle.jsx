import { useEffect } from "react";
import "../styles/cursor-sparkle.css";

function CursorSparkle({ enabled = false }) {
  useEffect(() => {
    if (!enabled) return;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || reduce || navigator.connection?.saveData || window.matchMedia("(max-width: 768px)").matches) return;

    let last = 0;

    const spawn = (x, y) => {
      const s = document.createElement("i");
      const size = 12 + Math.random() * 16;
      s.className = "cursor-sparkle";
      if (Math.random() > 0.5) s.classList.add("deep");
      s.style.width = s.style.height = `${size}px`;
      s.style.left = `${x + (Math.random() - 0.5) * 24}px`;
      s.style.top = `${y + (Math.random() - 0.5) * 24}px`;
      s.style.setProperty("--dx", `${(Math.random() - 0.5) * 70}px`);
      s.style.setProperty("--dy", `${30 + Math.random() * 50}px`);
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1200);
    };

    const onMove = (e) => {
      const now = performance.now();
      if (now - last < 25) return;
      last = now;
      spawn(e.clientX, e.clientY);
      spawn(e.clientX, e.clientY);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enabled]);

  return null;
}

export default CursorSparkle;