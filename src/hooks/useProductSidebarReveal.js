import { useLayoutEffect } from "react";
import gsap from "gsap";

// Observe individual cards: mobile uses display: contents on the sidebar wrapper.
export default function useProductSidebarReveal(pageRef, product, preview) {
  useLayoutEffect(() => {
    if (preview || !product || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !window.IntersectionObserver) return;
    const sidebar = pageRef.current?.querySelector(".product-side-column");
    if (!sidebar) return;
    const seen = new WeakSet();
    const context = gsap.context(() => {}, sidebar);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target);
      visible.sort((a, b) => Array.from(sidebar.children).indexOf(a) - Array.from(sidebar.children).indexOf(b));
      context.add(() => {
        gsap.to(visible, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.1, ease: "power2.out", clearProps: "transform,opacity,visibility" });
      });
      visible.forEach((node) => observer.unobserve(node));
    }, { threshold: 0.05 });
    const observeCards = () => {
      Array.from(sidebar.children).forEach((node) => {
        if (seen.has(node)) return;
        seen.add(node);
        context.add(() => gsap.set(node, { y: 18, autoAlpha: 0 }));
        observer.observe(node);
      });
    };
    observeCards();
    // Facebook/policies may arrive after the product when home settings finish loading.
    const mutations = new MutationObserver(observeCards);
    mutations.observe(sidebar, { childList: true });
    return () => { mutations.disconnect(); observer.disconnect(); context.revert(); };
  }, [pageRef, product, preview]);
}
