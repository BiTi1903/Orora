import { useEffect, useId, useRef, useState } from "react";
import ProductContent from "./ProductContent";
import { groupedProductSections, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";

export default function ProductInformation({ sections, css, preview, select, selectedClass, textProps = () => ({}) }) {
  const groups = groupedProductSections(sections); const id = useId(); const root = useRef(null);
  const [active, setActive] = useState("description");
  useEffect(() => {
    if (!window.IntersectionObserver) return;
    const observer = new IntersectionObserver((entries) => {
      const entry = entries.filter((item) => item.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (entry) setActive(entry.target.dataset.contentGroup);
    }, { rootMargin: "-15% 0px -55% 0px", threshold: 0 });
    root.current.querySelectorAll("[data-content-group]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return <div ref={root} className="product-detail-sections product-information" aria-label="Thông tin chi tiết sản phẩm">
    <nav className="product-information-nav" aria-label="Chuyển đến nội dung sản phẩm">{Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, title]) => <a key={key} href={`#${id}-${key}`} aria-label={title} aria-current={active === key ? "location" : undefined} onClick={(event) => { event.preventDefault(); setActive(key); const target = root.current?.ownerDocument.getElementById(`${id}-${key}`); target?.scrollIntoView({ behavior: root.current.ownerDocument.defaultView.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }); target?.focus({ preventScroll: true }); }}><strong {...textProps("pdNavigation", "navigation")}>{title}</strong></a>)}</nav>
    {Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, title]) => <section key={key} id={`${id}-${key}`} data-content-group={key} tabIndex={-1} className="product-section product-information-section" aria-label={title}>
      <div className="product-information-heading"><h2 className={selectedClass("pdAboutTitle")} data-builder-key={preview ? "pdAboutTitle" : undefined} onClick={select("pdAboutTitle")} style={{ ...css("sectionTitle"), ...css("aboutTitle") }}>{title}</h2></div>
      {!groups[key].length && <p className="product-information-empty">Thông tin đang được cập nhật.</p>}
      {groups[key].map((section, index) => key === "specifications" ? <div className={`product-detail-row${section.title?.trim() ? "" : " product-detail-row--unlabeled"}`} key={section.id || index}>{section.title?.trim() && <span className={selectedClass("pdRowLabel")} data-builder-key={preview ? "pdRowLabel" : undefined} onClick={select("pdRowLabel")} style={css("rowLabel")}>{section.title}</span>}<div className={`product-detail-value ${selectedClass("pdRowValue")}`} data-builder-key={preview ? "pdRowValue" : undefined} onClick={select("pdRowValue")} style={css("rowValue")}><ProductContent text={section.content} /></div></div> : <div className="product-information-copy" key={section.id || index}>{section.title && section.title.toLocaleLowerCase("vi").trim() !== title.toLocaleLowerCase("vi") && <h3 {...textProps("pdSubheading", "subheading")}>{section.title}</h3>}<div className={`product-section-content ${selectedClass("pdBody")}`} data-builder-key={preview ? "pdBody" : undefined} onClick={select("pdBody")} style={css("body")}><ProductContent text={section.content} /></div></div>)}
    </section>)}
  </div>;
}
