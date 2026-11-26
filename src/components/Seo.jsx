import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import useProducts from "../hooks/useProducts";
import useStorefrontStock from "../hooks/useStorefrontStock";
import { findProductByRoute } from "../lib/product-identity";
import { pageSeo } from "../lib/seo";

export default function Seo() {
  const { pathname } = useLocation();
  const home = useHomeContent();
  const isProductRoute = pathname.startsWith("/product/");
  const { products, loading, error } = useProducts({ enabled: isProductRoute });
  const matchedProduct = isProductRoute ? findProductByRoute(products, decodeURIComponent(pathname.slice(9))) : null;
  const stockMap = useStorefrontStock(matchedProduct?.id ? [matchedProduct.id] : [], isProductRoute && Boolean(matchedProduct?.id));
  const stockState = matchedProduct?.id ? stockMap[matchedProduct.id] : undefined;
  const seo = pageSeo(pathname, home, products, loading || Boolean(error), stockState);
  const serialized = JSON.stringify(seo);
  useEffect(() => {
    const current = JSON.parse(serialized);
    if (!pathname.startsWith("/admin")) document.title = current.title || "ORORA";
    document.documentElement.lang = "vi";
    const meta = (attribute, name, content) => {
      let element = document.head.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) { element = document.createElement("meta"); element.setAttribute(attribute, name); document.head.append(element); }
      element.content = content;
    };
    meta("name", "description", current.description);
    meta("name", "robots", current.noindex ? "noindex, follow" : "index, follow");
    meta("property", "og:title", current.title);
    meta("property", "og:description", current.description);
    meta("property", "og:url", current.url);
    meta("property", "og:image", current.image);
    meta("property", "og:image:alt", current.title);
    meta("name", "twitter:title", current.title);
    meta("name", "twitter:description", current.description);
    meta("name", "twitter:image", current.image);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.append(canonical); }
    canonical.href = current.url;
    let data = document.getElementById("orora-structured-data");
    if (!data) { data = document.createElement("script"); data.id = "orora-structured-data"; data.type = "application/ld+json"; document.head.append(data); }
    data.textContent = JSON.stringify(current.structuredData);
  }, [serialized, pathname]);
  return null;
}
