import { useLayoutEffect } from "react";

// Match the purchase card to the main photo, without counting thumbnail rows.
export default function useProductPanelSize(rootRef, product) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!product || !root || !window.ResizeObserver) return;
    const layout = root.querySelector(".product-detail-content");
    const image = root.querySelector(".product-detail-image");
    const card = root.querySelector(".product-detail-info");
    const content = root.querySelector(".product-purchase-content");
    if (!layout || !image || !card || !content) return;
    const media = window.matchMedia("(min-width: 901px)"); let frame;
    const clear = () => { layout.style.removeProperty("--purchase-content-height"); layout.style.removeProperty("--photo-panel-height"); };
    const measure = () => {
      if (!media.matches) { clear(); return; }
      const style = getComputedStyle(card);
      const extra = ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"].reduce((sum, key) => sum + (Number.parseFloat(style[key]) || 0), 0);
      const minimum = `${Math.ceil(content.offsetHeight + extra)}px`;
      if (layout.style.getPropertyValue("--purchase-content-height") !== minimum) layout.style.setProperty("--purchase-content-height", minimum);
      const height = `${image.offsetHeight}px`;
      if (layout.style.getPropertyValue("--photo-panel-height") !== height) layout.style.setProperty("--photo-panel-height", height);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule); observer.observe(image); observer.observe(content);
    media.addEventListener("change", schedule); measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); media.removeEventListener("change", schedule); clear(); };
  }, [rootRef, product]);
}
