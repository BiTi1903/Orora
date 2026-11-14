import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import useProducts from "../hooks/useProducts";
import { pageSeo } from "../lib/seo";

export default function Seo() {
  const { pathname } = useLocation();
  const home = useHomeContent();
  const { products, loading, error } = useProducts({enabled:pathname.startsWith("/product/")});
  const seo = pageSeo(pathname, home, products, loading || Boolean(error));
  const serialized = JSON.stringify(seo);
  useEffect(() => {
    const current = JSON.parse(serialized);
    document.title = "ORORA";
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
  }, [serialized]);
  return null;
}
