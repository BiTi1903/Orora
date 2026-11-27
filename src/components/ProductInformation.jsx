import { createPortal } from "react-dom";
import { useEffect, useId, useRef, useState } from "react";
import ProductImageLightbox from "./ProductImageLightbox";
import ProductContent from "./ProductContent";
import { informationMediaShadow, informationTabSettings, isLongSpecification } from "../lib/product-information";
import { groupedProductSections, isProductContentGroupVisible, normalizeProductBlockText, PRODUCT_CONTENT_GROUPS } from "../lib/product-content";
import { responsiveImage } from "../lib/image-cdn";
import { toCss } from "../lib/typography";
import { useLocale, translatePhrase } from "../lib/i18n";

const tabKeys = {
  description: "pdTabDescription",
  specifications: "pdTabSpecifications",
  usage: "pdTabUsage",
};

function InformationImage({ src, alt, imageName, preview, selectedClass, onSelect, eager = false }) {
  const [state, setState] = useState("loading");
  const [open, setOpen] = useState(null);
  const imgRef = useRef(null);
  const touchInput = useRef(false);

  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) {
      setState("ready");
    }
  }, [src]);

  return (
    <div
      className={`product-information-image ${selectedClass("pdInfoMedia")}`}
      data-image-state={state}
      data-builder-key={preview ? "pdInfoMedia" : undefined}
      onClick={preview ? onSelect("pdInfoMedia") : undefined}
      aria-busy={state === "loading" ? "true" : undefined}
    >
      {state === "error" ? (
        <p>Chưa tải được ảnh.</p>
      ) : (
        <img
          ref={imgRef}
          {...responsiveImage(src, { width: 1920, widths: [480, 960, 1440, 1920], sizes: "(max-width: 768px) 100vw, 75vw" })}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          width={1920}
          height={1280}
          onLoad={() => setState("ready")}
          onError={() => setState("error")}
        />
      )}
      {!preview && state === "ready" && (
        <button type="button" className="product-information-zoom" aria-label={`Xem ảnh lớn: ${imageName}`}
          aria-haspopup="dialog"
          onPointerDown={(event) => { touchInput.current = event.pointerType === "touch"; }}
          onClick={(event) => {
            const image = imgRef.current;
            const box = image.getBoundingClientRect();
            const fromTouch = event.nativeEvent.pointerType === "touch" ||
              (event.detail > 0 && touchInput.current);
            touchInput.current = false;
            const fit = getComputedStyle(image).objectFit;
            const scale = fit === "contain"
              ? Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight)
              : Math.max(box.width / image.naturalWidth, box.height / image.naturalHeight);
            const width = fit === "fill" ? box.width : image.naturalWidth * scale;
            const height = fit === "fill" ? box.height : image.naturalHeight * scale;
            setOpen({
              point: fromTouch ? {
                x: Math.min(1, Math.max(0, 0.5 + (event.clientX - box.left - box.width / 2) / width)),
                y: Math.min(1, Math.max(0, 0.5 + (event.clientY - box.top - box.height / 2) / height)),
              } : null,
            });
          }} />
      )}
      {open && createPortal(<ProductImageLightbox imageActions initialPoint={open.point} src={src} name={imageName} onClose={() => setOpen(null)} />, document.body)}
    </div>
  );
}

export default function ProductInformation({
  sections,
  visibility,
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
  const [tabSwitches, setTabSwitches] = useState(0);
  const [replayTick, setReplayTick] = useState(0);
  const keys = Object.keys(PRODUCT_CONTENT_GROUPS).filter((key) =>
    preview ? visibility?.[key] !== false : isProductContentGroupVisible(visibility, key),
  );
  const selected = keys.includes(active) ? active : keys[0];
  const panel = useRef(null);

  const selectTab = (nextKey) => {
    if (nextKey !== selected) setTabSwitches((count) => count + 1);
    setActive(nextKey);
  };

  useEffect(() => {
    if (!preview) return;
    const onReplay = () => {
      setTabSwitches((count) => count + 1);
      setReplayTick((tick) => tick + 1);
    };
    window.addEventListener("orora:replay-info-motion", onReplay);
    return () => window.removeEventListener("orora:replay-info-motion", onReplay);
  }, [preview]);

  useEffect(() => {
    const root = panel.current;
    if (!root) return;
    const targets = [...root.querySelectorAll("[data-text-effect]")];
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
    selectTab(keys[next]);
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
    "--info-motion-ms": `${config.motionDuration}ms`,
    ...(config.tabBarBg ? { "--info-tab-bar-bg": config.tabBarBg } : {}),
    ...(config.tabActiveBg ? { "--info-tab-active-bg": config.tabActiveBg } : {}),
    ...(config.tabActiveColor ? { "--info-tab-active-color": config.tabActiveColor } : {}),
    ...(config.tabInactiveColor ? { "--info-tab-inactive-color": config.tabInactiveColor } : {}),
  };

  return (
    <div
      className="product-detail-sections product-information"
      aria-label="Thông tin chi tiết sản phẩm"
      data-tab-transition={config.tabTransition}
      style={containerVars}
    >
      <div
        className="product-information-nav"
        data-tab-count={keys.length}
        role="tablist"
        aria-label="Nội dung sản phẩm"
      >
        {keys.map((key) => (
          <button
            type="button"
            role="tab"
            key={key}
            id={`${id}-tab-${key}`}
            aria-selected={selected === key}
            aria-controls={`${id}-${key}`}
            tabIndex={selected === key ? 0 : -1}
            onClickCapture={() => selectTab(key)}
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
            {selected === key && (
              <div
                key={`${key}-body-${replayTick}`}
                className={`product-information-panel-body${tabSwitches > 0 ? " is-tab-switching" : ""}`}
              >
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
                            className={`product-detail-row${isLongSpecification(section) ? " product-detail-row--long" : ""}${section.title?.trim() ? "" : " product-detail-row--unlabeled"} ${selectedClass("pdInfoCaption")}`.trim()}
                            data-builder-key={preview ? "pdInfoCaption" : undefined}
                            onClick={preview ? select("pdInfoCaption") : undefined}
                            key={blockKey}
                          >
                            {section.title?.trim() && (
                              <span
                                style={captionTitleCss}
                                onClick={
                                  preview
                                    ? (event) => {
                                        window.__ororaPendingCaptionSub = "title";
                                        window.dispatchEvent(new CustomEvent("orora:info-caption-sub", { detail: "title" }));
                                        select("pdInfoCaption")(event);
                                      }
                                    : undefined
                                }
                              >
                                {tr(section.title)}
                              </span>
                            )}
                            <div
                              className="product-detail-value"
                              style={captionBodyCss}
                              onClick={
                                preview
                                  ? (event) => {
                                      window.__ororaPendingCaptionSub = "body";
                                      window.dispatchEvent(new CustomEvent("orora:info-caption-sub", { detail: "body" }));
                                      select("pdInfoCaption")(event);
                                    }
                                  : undefined
                              }
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
                              alt={section.imageAlt?.trim() || (showTitle ? tr(title) : "")}
                              imageName={section.imageAlt?.trim() || (showTitle ? tr(title) : `${tr(PRODUCT_CONTENT_GROUPS[key])} · Ảnh ${index + 1}`)}
                              preview={preview}
                              selectedClass={selectedClass}
                              onSelect={select}
                              eager={!preview && index === groups[key].findIndex(item => item.image?.trim?.())}
                            />
                          )}
                          {showCaption && (
                            <div
                              className={`${hasImages ? "product-information-media-text" : ""} ${selectedClass("pdInfoCaption")}`.trim()}
                              data-text-effect={effect}
                              data-builder-key={preview ? "pdInfoCaption" : undefined}
                              onClick={
                                preview
                                  ? (event) => {
                                      if (event.target === event.currentTarget) {
                                        window.__ororaPendingCaptionSub = "box";
                                        window.dispatchEvent(new CustomEvent("orora:info-caption-sub", { detail: "box" }));
                                      }
                                      select("pdInfoCaption")(event);
                                    }
                                  : undefined
                              }
                            >
                              {showTitle && (
                                <h3
                                  style={captionTitleCss}
                                  onClick={
                                    preview
                                      ? (event) => {
                                          window.__ororaPendingCaptionSub = "title";
                                          window.dispatchEvent(new CustomEvent("orora:info-caption-sub", { detail: "title" }));
                                          select("pdInfoCaption")(event);
                                        }
                                      : undefined
                                  }
                                >
                                  {tr(title)}
                                </h3>
                              )}
                              {section.content?.trim() && (
                                <div
                                  className="product-section-content"
                                  style={captionBodyCss}
                                  onClick={
                                    preview
                                      ? (event) => {
                                          window.__ororaPendingCaptionSub = "body";
                                          window.dispatchEvent(new CustomEvent("orora:info-caption-sub", { detail: "body" }));
                                          select("pdInfoCaption")(event);
                                        }
                                      : undefined
                                  }
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
