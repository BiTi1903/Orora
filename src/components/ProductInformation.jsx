import { useEffect, useId, useRef, useState } from "react";
import ProductContent from "./ProductContent";
import { informationTabSettings, isLongSpecification } from "../lib/product-information";
import { groupedProductSections, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";
import { responsiveImage } from "../lib/image-cdn";
import { toCss } from "../lib/typography";
import { useLocale, translatePhrase } from "../lib/i18n";

const tabKeys = {
  description: "pdTabDescription",
  specifications: "pdTabSpecifications",
  usage: "pdTabUsage",
};

function InformationImage({ src, alt }) {
  const [state, setState] = useState("loading");
  return <div className="product-information-image" data-image-state={state}>
    {state === "error"
      ? <p>Chưa tải được ảnh.</p>
      : <img {...responsiveImage(src, { width: 1200, widths: [480, 800, 1200, 1920], sizes: "(max-width: 768px) 100vw, 75vw" })}
          alt={alt} loading="lazy" decoding="async" width={1920} height={1280}
          onLoad={() => setState("ready")} onError={() => setState("error")} />}
  </div>;
}

export default function ProductInformation({ sections, visibility, css, preview, select, selectedClass, textProps = () => ({}), settings = {} }) {
  const locale = useLocale();
  const tr = (value) => !preview && locale !== "vi" ? translatePhrase(value, locale) : value;
  const groups = groupedProductSections(sections);
  const id = useId();
  const config = informationTabSettings(settings);
  const [active, setActive] = useState(config.defaultTab);
  const keys = Object.keys(PRODUCT_CONTENT_GROUPS).filter((key) => visibility?.[key] !== false);
  const selected = keys.includes(active) ? active : keys[0];
  const panel = useRef(null);

  useEffect(() => {
    if (!panel.current || !window.IntersectionObserver) return;
    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.dataset.revealed = "true";
        observer.unobserve(target);
      }
    });
    panel.current.querySelectorAll("[data-text-effect]").forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections, selected]);

  if (!selected) return null;
  const handleKey = (event) => {
    const current = keys.indexOf(selected);
    const next = event.key === "ArrowRight" ? (current + 1) % keys.length
      : event.key === "ArrowLeft" ? (current + keys.length - 1) % keys.length
      : event.key === "Home" ? 0 : event.key === "End" ? keys.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    setActive(keys[next]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus({ preventScroll: true });
  };

  return <div className="product-detail-sections product-information" aria-label="Thông tin chi tiết sản phẩm" style={{ "--spec-columns": config.specColumns, "--spec-radius": `${config.cardRadius}px` }}>
    <div className="product-information-nav" role="tablist" aria-label="Nội dung sản phẩm">
      {keys.map((key) => <button type="button" role="tab" key={key} id={`${id}-tab-${key}`} aria-selected={selected === key}
        aria-controls={`${id}-${key}`} tabIndex={selected === key ? 0 : -1} onClickCapture={() => setActive(key)} onKeyDown={handleKey}>
        <strong {...textProps(tabKeys[key], "navigation")}>{tr(config.labels[key])}</strong>
      </button>)}
    </div>
    {keys.map((key) => {
      const hasImages = groups[key].some((section) => section.image?.trim?.());
      return <section key={key} ref={selected === key ? panel : null} id={`${id}-${key}`} data-content-group={key} role="tabpanel" hidden={selected !== key}
        aria-labelledby={`${id}-tab-${key}`} tabIndex={0} className="product-section product-information-section">
        <div className="product-information-heading"><h2 className={selectedClass("pdAboutTitle")} data-builder-key={preview ? "pdAboutTitle" : undefined}
          onClick={select("pdAboutTitle")} style={{ ...css("sectionTitle"), ...css("aboutTitle") }}>{tr(config.labels[key])}</h2></div>
        {!groups[key].length && <p className="product-information-empty">{tr(config.emptyText)}</p>}
        {selected === key && <div className={hasImages ? "product-information-media" : key === "specifications" ? "product-specification-grid" : "product-information-prose"}>
          {groups[key].map((section, index) => {
            const image = section.image?.trim?.();
            const blockKey = section.id || index;
            if (!hasImages && key === "specifications") {
              return <div className={`product-detail-row${isLongSpecification(section) ? " product-detail-row--long" : ""}${section.title?.trim() ? "" : " product-detail-row--unlabeled"}`} key={blockKey}>
                {section.title?.trim() && <span {...textProps("pdRowLabel", "rowLabel")} style={{ ...css("rowLabel"), ...toCss(section.textStyle) }}>{tr(section.title)}</span>}
                <div {...textProps("pdRowValue", "rowValue")} className={`product-detail-value ${selectedClass("pdRowValue")}`} style={{ ...css("rowValue"), ...toCss(section.textStyle) }}><ProductContent text={tr(section.content)} /></div>
              </div>;
            }
            const title = section.title?.trim();
            const showTitle = title && title.toLocaleLowerCase("vi") !== PRODUCT_CONTENT_GROUPS[key].toLocaleLowerCase("vi");
            const hasText = showTitle || section.content?.trim();
            const effect = image && section.effect !== "none" ? section.effect === "rise" ? "rise" : "fade" : undefined;
            return <div className="product-information-copy" key={blockKey}>
              {image && <InformationImage key={image} src={image} alt={section.imageAlt?.trim() || ""} />}
              {hasText && <div className={hasImages ? "product-information-media-text" : undefined} data-text-effect={effect}>
                {showTitle && <h3 {...textProps("pdSubheading", "subheading")} style={{ ...css("subheading"), ...toCss(section.textStyle) }}>{tr(title)}</h3>}
                {section.content?.trim() && <div {...textProps("pdBody", "body")} className={`product-section-content ${selectedClass("pdBody")}`}
                  style={{ ...css("body"), ...toCss(section.textStyle) }}><ProductContent text={tr(section.content)} /></div>}
              </div>}
            </div>;
          })}
        </div>}
      </section>;
    })}
  </div>;
}
