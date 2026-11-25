import { useEffect, useId, useRef, useState } from "react";
import ProductContent from "./ProductContent";
import { informationMediaShadow, informationTabSettings, isLongSpecification } from "../lib/product-information";
import { groupedProductSections, normalizeProductBlockText, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";
import { responsiveImage } from "../lib/image-cdn";
import { toCss } from "../lib/typography";
import { useLocale, translatePhrase } from "../lib/i18n";

const tabKeys = {
  description: "pdTabDescription",
  specifications: "pdTabSpecifications",
  usage: "pdTabUsage",
};

function InformationImage({ src, alt, preview, selectedClass, onSelect, forceLoading = false }) {
  const [state, setState] = useState("loading");
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setState("ready");
    }
  }, [src]);

  const effectiveState = forceLoading ? "loading" : state;

  return (
    <div
      className={`product-information-image ${selectedClass("pdInfoMedia")}`}
      data-image-state={effectiveState}
      data-image-reveal=""
      data-builder-key={preview ? "pdInfoMedia" : undefined}
      onClick={preview ? onSelect("pdInfoMedia") : undefined}
      aria-busy={effectiveState === "loading" ? "true" : undefined}
    >
      {effectiveState === "error" ? (
        <p>Chưa tải được ảnh.</p>
      ) : (
        <img
          ref={imgRef}
          {...responsiveImage(src, { width: 1920, widths: [480, 960, 1440, 1920], sizes: "(max-width: 768px) 100vw, 75vw" })}
          alt={alt}
          loading="lazy"
          decoding="async"
          width={1920}
          height={1280}
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
        />
      )}
    </div>
  );
}

export default function ProductInformation({
  sections,
  visibility,
  css,
  preview,
  select = () => () => {},
  selectedClass = () => "",
  textProps = () => ({}),
  settings = {},
}) {
  const locale = useLocale();
  const tr = (value) => (!preview && locale !== "vi" ? translatePhrase(value, locale) : value);
  const groups = groupedProductSections(sections);
  const id = useId();
  const config = informationTabSettings(settings);
  const [active, setActive] = useState(config.defaultTab);
  const [replayTick, setReplayTick] = useState(0);
  const [replayingSkeleton, setReplayingSkeleton] = useState(false);
  const keys = Object.keys(PRODUCT_CONTENT_GROUPS).filter((key) => visibility?.[key] !== false);
  const selected = keys.includes(active) ? active : keys[0];
  const panel = useRef(null);

  useEffect(() => {
    if (!preview) return;
    let timer = 0;
    const onReplay = () => {
      window.clearTimeout(timer);
      setReplayingSkeleton(true);
      setReplayTick((tick) => tick + 1);
      timer = window.setTimeout(() => {
        setReplayingSkeleton(false);
        setReplayTick((tick) => tick + 1);
      }, 750);
    };
    window.addEventListener("orora:replay-info-motion", onReplay);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("orora:replay-info-motion", onReplay);
    };
  }, [preview]);

  useEffect(() => {
    const root = panel.current;
    if (!root) return;
    const targets = [...root.querySelectorAll("[data-text-effect], [data-image-reveal]")];
    if (!targets.length) return;
    if (!window.IntersectionObserver || preview) {
      targets.forEach((element) => {
        element.dataset.revealed = "true";
      });
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const { target, isIntersecting } of entries) {
          if (!isIntersecting) continue;
          target.dataset.revealed = "true";
          observer.unobserve(target);
        }
      },
      { threshold: 0.05 },
    );
    targets.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [sections, selected, preview, replayTick]);

  if (!selected) return null;

  const handleKey = (event) => {
    const current = keys.indexOf(selected);
    const next =
      event.key === "ArrowRight"
        ? (current + 1) % keys.length
        : event.key === "ArrowLeft"
          ? (current + keys.length - 1) % keys.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? keys.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setActive(keys[next]);
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[next]?.focus({ preventScroll: true });
  };

  const captionTitleCss = toCss(config.captionTitleStyle, { responsive: true });
  const captionBodyCss = toCss(config.captionStyle, { responsive: true });
  const containerVars = {
    "--spec-columns": config.specColumns,
    "--spec-radius": `${config.cardRadius}px`,
    "--info-img-ratio": "3 / 2",
    "--info-img-fit": config.imageFit,
    "--info-img-radius": `${config.imageRadius}px`,
    "--info-img-border-w": `${config.imageBorderWidth}px`,
    "--info-img-border-color": config.imageBorderColor,
    "--info-img-bg": config.imageBg,
    "--info-img-shadow": informationMediaShadow(config.imageShadow),
    "--info-block-gap": `${config.blockGap}px`,
    "--info-caption-bg": config.captionBg,
    "--info-caption-border-w": `${config.captionBorderWidth}px`,
    "--info-caption-border-color": config.captionBorderColor,
    "--info-caption-radius": `${config.captionRadius}px`,
    "--info-caption-px": `${config.captionPaddingX}px`,
    "--info-caption-py": `${config.captionPaddingY}px`,
    "--info-caption-align": config.captionAlign,
    "--info-skeleton-base": config.skeletonBaseColor,
    "--info-skeleton-highlight": config.skeletonHighlightColor,
    "--info-motion-ms": `${config.motionDuration}ms`,
  };

  return (
    <div
      className="product-detail-sections product-information"
      aria-label="Thông tin chi tiết sản phẩm"
      data-skeleton-effect={config.skeletonEffect}
      data-tab-transition={config.tabTransition}
      data-reveal-effect={config.revealEffect}
      style={containerVars}
    >
      <div className="product-information-nav" role="tablist" aria-label="Nội dung sản phẩm">
        {keys.map((key) => (
          <button
            type="button"
            role="tab"
            key={key}
            id={`${id}-tab-${key}`}
            aria-selected={selected === key}
            aria-controls={`${id}-${key}`}
            tabIndex={selected === key ? 0 : -1}
            onClickCapture={() => setActive(key)}
            onKeyDown={handleKey}
          >
            <strong {...textProps(tabKeys[key], "navigation")}>{tr(config.labels[key])}</strong>
          </button>
        ))}
      </div>
      {keys.map((key) => {
        const hasImages = groups[key].some((section) => section.image?.trim?.());
        return (
          <section
            key={key}
            ref={selected === key ? panel : null}
            id={`${id}-${key}`}
            data-content-group={key}
            role="tabpanel"
            hidden={selected !== key}
            aria-labelledby={`${id}-tab-${key}`}
            tabIndex={0}
            className="product-section product-information-section"
          >
            <div className="product-information-heading">
              <h2
                className={selectedClass("pdAboutTitle")}
                data-builder-key={preview ? "pdAboutTitle" : undefined}
                onClick={select("pdAboutTitle")}
                style={{ ...css("sectionTitle"), ...css("aboutTitle") }}
              >
                {tr(config.labels[key])}
              </h2>
            </div>
            {selected === key && (
              <div key={`${key}-body-${replayTick}`} className="product-information-panel-body">
                {!groups[key].length && <p className="product-information-empty">{tr(config.emptyText)}</p>}
                {groups[key].length > 0 && (
                  <div
                    className={
                      hasImages
                        ? "product-information-media"
                        : key === "specifications"
                          ? "product-specification-grid"
                          : "product-information-prose"
                    }
                  >
                    {groups[key].map((section, index) => {
                      const image = section.image?.trim?.();
                      const blockKey = section.id || index;
                      if (!hasImages && key === "specifications") {
                        return (
                          <div
                            className={`product-detail-row${isLongSpecification(section) ? " product-detail-row--long" : ""}${section.title?.trim() ? "" : " product-detail-row--unlabeled"}`}
                            key={blockKey}
                          >
                            {section.title?.trim() && (
                              <span
                                {...textProps("pdRowLabel", "rowLabel")}
                                style={{ ...css("rowLabel"), ...captionTitleCss }}
                              >
                                {tr(section.title)}
                              </span>
                            )}
                            <div
                              {...textProps("pdRowValue", "rowValue")}
                              className={`product-detail-value ${selectedClass("pdRowValue")}`}
                              style={{ ...css("rowValue"), ...captionBodyCss }}
                            >
                              <ProductContent text={tr(normalizeProductBlockText(section.content))} />
                            </div>
                          </div>
                        );
                      }
                      const title = section.title?.trim();
                      const showTitle =
                        title && title.toLocaleLowerCase("vi") !== PRODUCT_CONTENT_GROUPS[key].toLocaleLowerCase("vi");
                      const showCaption = section.showText !== false && Boolean(showTitle || section.content?.trim());
                      const effect = image && config.captionEffect !== "none" ? config.captionEffect : undefined;

                      return (
                        <div className="product-information-copy" key={blockKey}>
                          {image && (
                            <InformationImage
                              key={image}
                              src={image}
                              alt={showTitle ? tr(title) : ""}
                              preview={preview}
                              selectedClass={selectedClass}
                              onSelect={select}
                              forceLoading={replayingSkeleton}
                            />
                          )}
                          {showCaption && (
                            <div
                              className={`${hasImages ? "product-information-media-text" : ""} ${selectedClass("pdInfoCaption")}`.trim()}
                              data-text-effect={effect}
                              data-builder-key={preview ? "pdInfoCaption" : undefined}
                              onClick={preview ? select("pdInfoCaption") : undefined}
                            >
                              {showTitle && (
                                <h3
                                  {...textProps("pdSubheading", "subheading")}
                                  style={{ ...css("subheading"), ...captionTitleCss }}
                                >
                                  {tr(title)}
                                </h3>
                              )}
                              {section.content?.trim() && (
                                <div
                                  {...textProps("pdBody", "body")}
                                  className={`product-section-content ${selectedClass("pdBody")}`}
                                  style={{ ...css("body"), ...captionBodyCss }}
                                >
                                  <ProductContent text={tr(normalizeProductBlockText(section.content))} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
