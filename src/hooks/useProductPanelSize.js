import { useLayoutEffect } from "react";

// Size the gallery from natural purchase content, never stretch the purchase card to a photo.
export default function useProductPanelSize(rootRef, product) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!product || !root || !window.ResizeObserver) return;
    const layout = root.querySelector(".product-detail-content");
    const gallery = root.querySelector(".product-detail-gallery");
    const image = root.querySelector(".product-detail-image");
    const card = root.querySelector(".product-detail-info");
    const content = root.querySelector(".product-purchase-content");
    if (!layout || !gallery || !image || !card || !content) return;
    const viewport = root.ownerDocument.defaultView || window;
    const media = viewport.matchMedia("(min-width: 901px)"); let frame;
    const clear = () => { layout.style.removeProperty("--balanced-image-height"); };
    const measure = () => {
      if (!media.matches) { clear(); return; }
      const style = viewport.getComputedStyle(card);
      const extra = ["paddingTop", "paddingBottom", "borderTopWidth", "borderBottomWidth"].reduce((sum, key) => sum + (Number.parseFloat(style[key]) || 0), 0);
      const galleryExtras = gallery.offsetHeight - image.offsetHeight;
      const height = `${Math.max(1, Math.ceil(content.offsetHeight + extra - galleryExtras))}px`;
      if (layout.style.getPropertyValue("--balanced-image-height") !== height) layout.style.setProperty("--balanced-image-height", height);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const observer = new ResizeObserver(schedule); observer.observe(gallery); observer.observe(image); observer.observe(content);
    media.addEventListener("change", schedule); measure();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); media.removeEventListener("change", schedule); clear(); };
  }, [rootRef, product]);
}
