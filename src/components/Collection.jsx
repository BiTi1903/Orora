import { useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import useProducts from "../hooks/useProducts";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";
import { defaultProducts } from "../data/content";

function usePerView() {
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w <= 560 ? 1 : w <= 1000 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perView;
}

function ProductCarousel({ products, cardStyles, preview, selectedElement, onSelect, keyMap }) {
  const perView = usePerView();
  const viewRef = useRef(null);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = products.length;
  const looping = count > 1;
  const pad = Math.max(perView, 1);
  const clones = [];
  if (looping) {
    while (clones.length < pad) clones.push(...products);
  }
  const slides = looping ? [...products, ...clones.slice(0, pad)] : products;
  const gap = perView === 1 ? 0 : 30;

  const setSlide = (next) => {
    indexRef.current = next;
    setIndex(next);
  };

  const stepSize = () => {
    const view = viewRef.current;
    if (!view) return 240;
    return (view.clientWidth - (perView - 1) * gap) / perView + gap;
  };

  const goNext = () => {
    setAnimating(true);
    setSlide(indexRef.current + 1);
  };

  const goPrev = () => {
    if (indexRef.current > 0) {
      setAnimating(true);
      setSlide(indexRef.current - 1);
      return;
    }
    setAnimating(false);
    setSlide(count);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimating(true);
        setSlide(count - 1);
      });
    });
  };

  useEffect(() => {
    setAnimating(false);
    setSlide(0);
    const id = window.requestAnimationFrame(() => setAnimating(true));
    return () => window.cancelAnimationFrame(id);
  }, [count, perView]);

  useEffect(() => {
    if (!looping || paused || dragging) return undefined;
    const id = window.setInterval(goNext, 3000);
    return () => window.clearInterval(id);
  }, [looping, paused, dragging, count, perView]);

  useEffect(() => {
    if (!looping || index < count) return undefined;
    const id = window.setTimeout(() => {
      setAnimating(false);
      setSlide(0);
    }, 820);
    return () => window.clearTimeout(id);
  }, [index, looping, count]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el || !looping) return undefined;

    const start = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest(".gallery-dots, .gallery-nav")) return;
      dragRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      movedRef.current = false;
      setPaused(true);
      setDragging(true);
    };

    const move = (e) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) > 5) movedRef.current = true;
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
      setDragX(dx);
    };

    const end = (e) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      dragRef.current = null;
      setDragging(false);
      setDragX(0);
      setPaused(false);
      const threshold = Math.min(48, stepSize() * 0.12);
      if (dx <= -threshold) goNext();
      else if (dx >= threshold) goPrev();
    };

    el.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [looping, count, perView]);

  const slideWidth = `calc((100% - ${(perView - 1) * gap}px) / ${perView})`;
  const offset = `calc(${index} * (-1 * (${slideWidth} + ${gap}px)) + ${dragX}px)`;

  return (
    <div
      className={`gallery-viewport${dragging ? " is-dragging" : ""}`}
      ref={viewRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { if (!dragRef.current) setPaused(false); }}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (!movedRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        movedRef.current = false;
      }}
    >
      {looping && (
        <button type="button" className="gallery-nav prev" aria-label="Sản phẩm trước" onClick={goPrev}>
          ‹
        </button>
      )}
      <div
        className={`gallery-track${animating && !dragging ? " is-animating" : ""}`}
        style={{ gap, transform: `translateX(${offset})` }}
      >
{slides.map((product, i) => (
          <div
            className="gallery-slide"
            style={{ width: slideWidth }}
            key={`${product.id}-${i}`}
          >
            <ProductCard
              image={product.image}
              image2={product.image2}
              image3={product.image3}
              image4={product.image4}
              image5={product.image5}
              image6={product.image6}
              number={product.number}
              name={product.name}
              description={product.description}
              price={product.price}
              slug={product.slug || product.id}
              styles={cardStyles}
              preview={preview}
              selectedElement={selectedElement}
              onSelect={onSelect}
              keyMap={keyMap}
                            groupLayout={!!keyMap}

            />
          </div>
        ))}
      </div>

      {looping && (
        <button type="button" className="gallery-nav next" aria-label="Sản phẩm sau" onClick={goNext}>
          ›
        </button>
      )}

      {looping && (
        <div className="gallery-dots" aria-hidden="true">
          {products.map((product, i) => (
            <button
              key={product.id}
              type="button"
              className={i === index % count ? "is-active" : ""}
              onClick={() => {
                setAnimating(true);
                setSlide(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Collection({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
  sampleProducts = null,
  /** Loại trừ sản phẩm hiện tại (trang chi tiết → "Sản phẩm khác") */
  excludeId = null,
  /** Ghi đè tiêu đề khi dùng làm block liên quan */
  forceLabel = null,
  forceTitle = null,
  forceHighlight = null,
  /** class thêm (vd: related products dưới chi tiết) */
  className = "",
  /** Kiểu chữ riêng (ghi đè từng phần kiểu của Collection trang chủ) */
  headStylesOverride = null,
  cardStylesOverride = null,
    /** Gộp tiêu đề thành 1 ô (Enter = xuống dòng) + đổi màu N chữ cuối */
  singleTitle = false,
  titleAccent = null,
  /** Đổi tên key khi chọn trong builder (colTitle → relTitle, ...) */
  keyMap = null,
}) {
  const k = (name) => keyMap?.[name] || name;
  const mergeGroup = (base, over) => {
    const out = { ...(base || {}) };
    Object.keys(over || {}).forEach((key) => {
      out[key] = { ...(base?.[key] || {}), ...(over[key] || {}) };
    });
    return out;
  };
  const { products: liveProducts, loading } = useProducts();
  const liveHome = useHomeContent();

  const home = preview && previewData ? previewData : liveHome || {};
  const rawProducts = preview
    ? sampleProducts || defaultProducts.slice(0, 3)
    : liveProducts;

  const products = excludeId
    ? rawProducts.filter(
        (p) => p.id !== excludeId && p.slug !== excludeId
      )
    : rawProducts;

  const collectionLabel =
    forceLabel ?? home.collectionLabel ?? "COLLECTION";
  const collectionTitle =
    forceTitle ?? home.collectionTitle ?? "Explore";
  const collectionHighlight =
    forceHighlight ?? home.collectionHighlight ?? "the details.";

  const headStyles = mergeGroup(home.collectionStyles, headStylesOverride);
  const cardStyles = mergeGroup(home.productCardStyles, cardStylesOverride);

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

    /* Trang chi tiết (có keyMap): nhãn + tiêu đề luôn nằm giữa màn hình */
  // const centered = !!keyMap;
  // const centeredHeader = centered
  //   ? {
  //       flexDirection: "column",
  //       alignItems: "center",
  //       justifyContent: "center",
  //       textAlign: "center",
  //       gap: 16,
  //     }
  //   : {};
  // const centeredTitle = centered
  //   ? { width: "100%", alignItems: "center", textAlign: "center" }
  //   : undefined;
  /* Chỉ cho chọn khối tiêu đề / khu vực khi trang cha có keyMap (trang chi tiết) */
  const extra = (name) =>
    keyMap?.[name]
      ? {
          "data-builder-key": preview ? keyMap[name] : undefined,
          onClick: select(keyMap[name]),
        }
      : {};
  const extraClass = (name) =>
    keyMap?.[name] ? selectedClass(keyMap[name]) : "";

  /* Tách theo ký tự hiển thị để chữ tiếng Việt có dấu không bị cắt đôi */
  const splitChars = (text) =>
    typeof Intl !== "undefined" && Intl.Segmenter
      ? Array.from(
          new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text),
          (s) => s.segment
        )
      : Array.from(text);

  const withBreaks = (text, keyBase) =>
    text.split("\n").flatMap((part, i) =>
      i === 0 ? [part] : [<br key={`${keyBase}-${i}`} />, part]
    );

  const renderTitle = (text, count, color) => {
    const chars = splitChars(text || "");
    let remaining = Math.max(0, Number(count) || 0);
    let start = chars.length;
    for (let i = chars.length - 1; i >= 0 && remaining > 0; i--) {
      if (chars[i] !== "\n") remaining--;
      start = i;
    }
    const head = chars.slice(0, start).join("");
    const tail = chars.slice(start).join("");
    return (
      <>
        {withBreaks(head, "h")}
        {tail && <span style={{ color }}>{withBreaks(tail, "t")}</span>}
      </>
    );
  };

  return (
        <section
      className={`collection ${preview ? "collection--preview" : ""} ${className} ${extraClass("colSection")}`.trim()}
      id={preview || excludeId ? undefined : "shop"}
      style={toCss(headStyles.section, { responsive: !preview })}
      {...extra("colSection")}
    >
      {/* HEADER */}
      <div
        className={`collection-header ${extraClass("colHeader")}`.trim()}
                  style={toCss(headStyles.header, { responsive: !preview })}      {...extra("colHeader")}
      >
        <p
          className={`collection-label ${selectedClass(k("colLabel"))}`}
          data-builder-key={preview ? k("colLabel") : undefined}
          onClick={select(k("colLabel"))}
          style={toCss(headStyles.label, { responsive: !preview })}
        >
          {collectionLabel}
        </p>

        <h2>          {singleTitle ? (
            <span
              className={`collection-title-line ${selectedClass(k("colTitle"))}`}
              data-builder-key={preview ? k("colTitle") : undefined}
              onClick={select(k("colTitle"))}
              style={toCss(headStyles.title, { responsive: !preview })}
            >
              {renderTitle(
                collectionTitle,
                titleAccent?.count,
                titleAccent?.color || headStyles.highlight?.color
              )}
            </span>
          ) : (
            <>
              <span
                className={`collection-title-line ${selectedClass(k("colTitle"))}`}
                data-builder-key={preview ? k("colTitle") : undefined}
                onClick={select(k("colTitle"))}
                style={toCss(headStyles.title, { responsive: !preview })}
              >
                {collectionTitle}
              </span>

              <span
                className={`collection-title-line ${selectedClass(k("colHighlight"))}`}
                data-builder-key={preview ? k("colHighlight") : undefined}
                onClick={select(k("colHighlight"))}
                style={toCss(headStyles.highlight, { responsive: !preview })}
              >
                {collectionHighlight}
              </span>
            </>
          )}
        </h2>
      </div>

      {/* PRODUCTS */}
      {preview ? (
        <div className="gallery">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard
                image={product.image}
                image2={product.image2}
                image3={product.image3}
                image4={product.image4}
                image5={product.image5}
                image6={product.image6}
                number={product.number}
                name={product.name}
                description={product.description}
                price={product.price}
                slug={product.slug || product.id}
                styles={cardStyles}
                preview={preview}
                selectedElement={selectedElement}
                onSelect={onSelect}
                keyMap={keyMap}
                
                              groupLayout={!!keyMap}
              />
            </div>
          ))}
        </div>
      ) : (
        <ProductCarousel
          products={products}
          cardStyles={cardStyles}
          preview={preview}
          selectedElement={selectedElement}
          onSelect={onSelect}
          keyMap={keyMap}
        />
      )}

      {!preview && !loading && products.length === 0 && (
        <p
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 2,
            opacity: 0.6,
          }}
        >
          Sản phẩm sẽ sớm được cập nhật.
        </p>
      )}
    </section>
  );
}

export default Collection;