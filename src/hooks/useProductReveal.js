import { useLayoutEffect } from "react";
import gsap from "gsap";

const targets = [
  ".product-back", ".product-detail-gallery",
  ".product-detail-info", ".product-information-nav", ".product-information-section",
  ".product-side-column > *",
].join(",");

// One queue for the whole detail page; never animate a parent and its children twice.
export default function useProductReveal(pageRef, product, preview) {
  useLayoutEffect(() => {
    const root = pageRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (preview || !product || !root || motion.matches || !window.IntersectionObserver) return;
    const seen = new WeakSet();
    const pending = new Set();
    const context = gsap.context(() => {}, root);
    let frame = 0;
    let nextStart = 0;
    const flush = () => {
      frame = 0;
      const nodes = Array.from(pending).filter((node) => node.isConnected);
      pending.clear();
      const ordered = nodes.map((node) => ({ node, box: node.getBoundingClientRect() })).sort((a, b) => Math.abs(a.box.top - b.box.top) > 24 ? a.box.top - b.box.top : a.box.left - b.box.left);
      const now = performance.now();
      context.add(() => ordered.forEach(({ node }) => {
        const start = Math.max(now, nextStart);
        gsap.to(node, { y: 0, opacity: 1, duration: .45, delay: (start - now) / 1000, ease: "power2.out", clearProps: "transform,opacity" });
        nextStart = start + 80;
      }));
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) { pending.delete(target); return; }
        observer.unobserve(target);
        pending.add(target);
      });
      if (pending.size && !frame) frame = requestAnimationFrame(flush);
    }, { threshold: 0 });
    const observe = () => root.querySelectorAll(targets).forEach((node) => {
      if (seen.has(node)) return;
      seen.add(node);
      if (node.matches(".product-detail-gallery, .product-detail-info")) return;
      context.add(() => gsap.set(node, { y: node.matches(".product-detail-info, .product-detail-gallery") ? 0 : 14, opacity: 0 }));
      observer.observe(node);
    });
    observe();
    const focusIn = (event) => {
      if (motion.matches) return;
      const node = event.target.closest?.(targets);
      if (!node || !root.contains(node) || (!node.style.opacity && !node.style.transform)) return;
      observer.unobserve(node); pending.delete(node);
      gsap.killTweensOf(node);
      context.add(() => gsap.set(node, { y: 0, opacity: 1, clearProps: "transform,opacity" }));
    };
    root.addEventListener("focusin", focusIn);
    // Home settings and related products can arrive after the main product.
    const mutations = new MutationObserver(observe);
    mutations.observe(root, { childList: true, subtree: true });
    const stop = () => { mutations.disconnect(); observer.disconnect(); cancelAnimationFrame(frame); pending.clear(); context.revert(); };
    const preferenceChanged = () => { if (motion.matches) stop(); };
    motion.addEventListener("change", preferenceChanged);
    return () => { root.removeEventListener("focusin", focusIn); motion.removeEventListener("change", preferenceChanged); stop(); };
  }, [pageRef, product, preview]);
}
