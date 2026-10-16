import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import gsap from "gsap";
import { getProduct } from "../lib/api";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";
import { defaultProducts } from "../data/content";
import Collection from "./Collection";

function ProductDetail({
  preview = false,
  previewStyles = null,
  previewProduct = null,
  selectedElement = "",
  onSelect,
}) {
  const { id } = useParams();
  const pageRef = useRef(null);

  const home = useHomeContent();
  const ps = preview && previewStyles
    ? previewStyles
    : {
        ...(home?.productDetailStyles || {}),
        detailLabels: {
          ...(home?.detailLabels || {}),
          ...(home?.productDetailStyles?.detailLabels || {}),
        },
      };

  // undefined = đang tải, null = không tìm thấy
  const [product, setProduct] = useState(
    preview ? previewProduct || defaultProducts[0] : undefined
  );

  /* ---------- lấy sản phẩm từ Firestore ---------- */
  useEffect(() => {
    if (preview) {
      setProduct(previewProduct || defaultProducts[0]);
      return;
    }

    let alive = true;
    setProduct(undefined);
    window.scrollTo({ top: 0 });

    const fallback = () =>
      defaultProducts.find((p) => p.slug === id) || null;

    getProduct(id)
      .then((p) => {
        if (!alive) return;
        if (p) setProduct(p.active === false ? null : p);
        else setProduct(fallback());
      })
      .catch(() => {
        if (alive) setProduct(fallback());
      });

    return () => {
      alive = false;
    };
  }, [id, preview, previewProduct]);

  /* ---------- hiệu ứng GSAP ---------- */
  useLayoutEffect(() => {
    if (preview || !product) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "power4.out" },
      });

      timeline
        .from(".product-back", {
          y: -20,
          opacity: 0,
          duration: 0.7,
        })
        .from(
          ".product-detail-image",
          {
            scale: 1.12,
            opacity: 0,
            duration: 1.2,
          },
          "-=0.3"
        )
        .from(
          ".product-detail-number",
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.7"
        )
        .from(
          ".product-detail-info h1",
          {
            y: 80,
            opacity: 0,
            duration: 0.9,
          },
          "-=0.5"
        )
        .from(
          ".product-detail-price",
          {
            y: 30,
            opacity: 0,
            duration: 0.6,
          },
          "-=0.5"
        )
        .from(
          ".product-detail-description",
          {
            y: 30,
            opacity: 0,
            duration: 0.7,
          },
          "-=0.4"
        )
                .from(
          ".product-section",
          {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.15,
          },
          "-=0.4"
        );

      /* Ảnh phụ: lần lượt trượt lên + phóng nhẹ ra, sau khi ảnh chính hiện ra */
      const thumbs = Array.from(
        pageRef.current?.querySelectorAll(".product-detail-thumb") || []
      );
      if (thumbs.length) {
        // Tắt transition CSS trong lúc chạy hiệu ứng để GSAP không bị giật
        thumbs.forEach((el) => {
          el.style.transition = "none";
        });
        gsap.from(thumbs, {
          y: 50,
          scale: 0.8,
          opacity: 0,
          duration: 0.75,
          stagger: 0.14,
          delay: 1.0,
          ease: "back.out(1.6)",
          onComplete: () => {
            thumbs.forEach((el) => {
              el.style.transition = "";
            });
            gsap.set(thumbs, { clearProps: "transform,opacity" });
          },
        });
      }
      gsap.from(".product-detail-thumb-nav", {
        opacity: 0,
        scale: 0.6,
        duration: 0.5,
        delay: 1.5,
        ease: "back.out(2)",
        clearProps: "transform,opacity",
      });
    }, pageRef);

    return () => ctx.revert();
  }, [product, preview]);

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  // Hàng đợi vòng: order[0] = khung lớn; order[1..] = dưới (ảnh vừa rời khung lớn → cuối hàng)
  const [order, setOrder] = useState([]);
  const [thumbStart, setThumbStart] = useState(0);

  useEffect(() => {
    if (!product) return;
    const main = (product.image || "").trim();
    const sides = [
      product.image2,
      product.image3,
      product.image4,
      product.image5,
      product.image6,
    ]
      .map((src) => (src || "").trim())
      .filter(Boolean);
    setOrder([main, ...sides].filter(Boolean));
    setThumbStart(0);
  }, [product?.id, product?.slug, product?.image]);

  /* ---------- đang tải ---------- */
  if (product === undefined) {
    return (
      <div className="product-not-found">
        <p>Loading...</p>
      </div>
    );
  }

  /* ---------- không tìm thấy ---------- */
  if (product === null) {
    return (
      <div className="product-not-found">
        <h1>Product not found</h1>
        <Link to="/">← Back to Collection</Link>
      </div>
    );
  }

  const detailLabels = ps.detailLabels || {};
  const rows = [
    ["material", detailLabels.material || ps.materialLabel?.text || "Material", product.material],
    ["size", detailLabels.size || ps.sizeLabel?.text || "Size", product.size],
    ["color", detailLabels.color || ps.colorLabel?.text || "Color", product.color],
    ["origin", detailLabels.origin || ps.originLabel?.text || "Origin", product.origin],
  ].filter(([, , value]) => value || preview);

  const css = (key) => toCss(ps[key], { responsive: !preview });

  // Kiểu riêng cho mục "Sản phẩm khác" (admin chỉnh ở Visual Builder → Chi tiết SP)
    const relTitleStyle = ps.relTitle || {};
  // Dữ liệu cũ (tiêu đề tách 2 dòng) vẫn hiển thị đúng cho tới khi admin lưu lại
  const legacyHl = relTitleStyle.accentCount == null ? ps.relHighlight : null;
  const relTitleText = legacyHl
    ? `${relTitleStyle.text || "Khám phá"}\n${legacyHl.text || "thêm nữa"}`
    : relTitleStyle.text ?? "Khám phá\nthêm nữa";
  const relAccentCount =
    relTitleStyle.accentCount ??
    (legacyHl
      ? Array.from(legacyHl.text || "thêm nữa").length
      : relTitleStyle.text == null
      ? 8
      : 0);
  const relAccentColor = relTitleStyle.accentColor || legacyHl?.color;

  const relatedHeadStyles = {
    label: ps.relLabel,
    title: ps.relTitle,
    header: ps.relHeader,
    section: ps.relSection,
  };
  const relatedCardStyles = {
    number: ps.relNumber,
    name: ps.relName,
    description: ps.relDescription,
    price: ps.relPrice,
    button: ps.relButton,
    imageLayout: ps.relImage,
  };
  const relatedKeyMap = {
    colLabel: "relLabel",
    colTitle: "relTitle",
    colHeader: "relHeader",
    colSection: "relSection",    cardNumber: "relNumber",
    cardName: "relName",
    cardDescription: "relDescription",
    cardPrice: "relPrice",
    cardButton: "relButton",
    cardImage: "relImage",
  };

  // order[0] = đang hiện khung lớn; còn lại = hàng đợi dưới (xoay 2 ảnh, ảnh vừa rời khung lớn nằm cuối)
  const mainImage = (product.image || "").trim();
  const secondaryImages = [
    product.image2,
    product.image3,
    product.image4,
    product.image5,
    product.image6,
  ]
    .map((src) => (src || "").trim())
    .filter(Boolean);

  const displaySrc = order[0] || mainImage;
  const thumbPool = order.length > 1 ? order.slice(1) : secondaryImages;

  const promoteToMain = (src) => {
    if (!src || src === displaySrc) return;
    setOrder((prev) => {
      const list = prev.length
        ? prev
        : [mainImage, ...secondaryImages].filter(Boolean);
      const oldMain = list[0];
      const rest = list.slice(1).filter((s) => s !== src);
      // Ảnh được chọn lên đầu; ảnh chính cũ xuống cuối hàng đợi
      return [src, ...rest, oldMain].filter(Boolean);
    });
  };

  // Layout từ Visual Builder — ngang/margin/padding cả khối; dọc chỉ khung ảnh chính
  const imageLayout = ps.imageLayout || {};
  const thumbsLayout = ps.thumbsLayout || {};
  const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const px = (v) => `${n(v)}px`;

  const widthPercent = Math.min(
    100,
    Math.max(20, n(imageLayout.widthPercent) || 100)
  );
  const mL = n(imageLayout.marginLeft);
  const mR = n(imageLayout.marginRight);
  const mT = n(imageLayout.marginTop);
  const mB = n(imageLayout.marginBottom);
  const fixedHeight =
    imageLayout.height != null && n(imageLayout.height) > 0
      ? n(imageLayout.height)
      : null;

  const galleryWidth =
    mL || mR
      ? `calc(${widthPercent}% - ${mL + mR}px)`
      : `${widthPercent}%`;

  // Cả khối gallery (ảnh chính + ảnh phụ) đi cùng nhau
  const galleryStyle = {
    width: galleryWidth,
    maxWidth: imageLayout.maxWidth != null && n(imageLayout.maxWidth) > 0
      ? px(imageLayout.maxWidth)
      : "100%",
    boxSizing: "border-box",
    marginTop: px(mT),
    marginRight: px(mR),
    marginBottom: px(mB),
    marginLeft: px(mL),
    gap: px(imageLayout.gap ?? 14),
  };

  const mainImageBoxStyle = {
    width: "100%",
    ["--pd-height"]: fixedHeight != null ? `${fixedHeight}px` : "auto",
    ["--pd-aspect"]:
      fixedHeight != null
        ? "auto"
        : imageLayout.aspectRatio || "3 / 4",
    height: fixedHeight != null ? `${fixedHeight}px` : undefined,
    minHeight: fixedHeight != null ? `${fixedHeight}px` : undefined,
    maxHeight: fixedHeight != null ? `${fixedHeight}px` : undefined,
    aspectRatio:
      fixedHeight != null
        ? "auto"
        : imageLayout.aspectRatio || undefined,
    borderRadius: imageLayout.radius != null ? px(imageLayout.radius) : undefined,
    borderWidth:
      imageLayout.borderWidth != null ? px(imageLayout.borderWidth) : undefined,
    borderColor: imageLayout.borderColor || undefined,
    borderStyle:
      imageLayout.borderWidth != null && n(imageLayout.borderWidth) > 0
        ? "solid"
        : undefined,
    paddingTop: px(imageLayout.paddingTop),
    paddingRight: px(imageLayout.paddingRight),
    paddingBottom: px(imageLayout.paddingBottom),
    paddingLeft: px(imageLayout.paddingLeft),
    boxSizing: "border-box",
  };

  const objectFitValue = imageLayout.objectFit || "cover";

  const thumbsWrapStyle = {
    marginTop: px(thumbsLayout.marginTop),
    marginRight: px(thumbsLayout.marginRight),
    marginBottom: px(thumbsLayout.marginBottom),
    marginLeft: px(thumbsLayout.marginLeft),
    paddingTop: px(thumbsLayout.paddingTop),
    paddingRight: px(thumbsLayout.paddingRight),
    paddingBottom: px(thumbsLayout.paddingBottom),
    paddingLeft: px(thumbsLayout.paddingLeft),
    boxSizing: "border-box",
  };

  const thumbsGridStyle = {
    "--thumb-count": undefined, // set later
    gap: px(thumbsLayout.gap) ?? "10px",
  };

  const thumbFixedH =
    thumbsLayout.height != null && Number(thumbsLayout.height) > 0
      ? Number(thumbsLayout.height)
      : null;

  const thumbBtnBaseStyle = {
    borderRadius: px(thumbsLayout.radius),
    borderWidth: px(thumbsLayout.borderWidth),
    borderStyle:
      thumbsLayout.borderWidth != null && Number(thumbsLayout.borderWidth) > 0
        ? "solid"
        : "solid",
    borderColor: thumbsLayout.borderColor || "transparent",
    height: thumbFixedH != null ? `${thumbFixedH}px` : undefined,
    aspectRatio: thumbFixedH != null ? "auto" : "1",
  };

  // Cửa sổ 2 ảnh trong vòng (chính + phụ), xoay nếu > 2
  const visibleThumbs = (() => {
    if (thumbPool.length <= 2) return thumbPool;
    return [0, 1].map(
      (offset) => thumbPool[(thumbStart + offset) % thumbPool.length]
    );
  })();

  const canSlideThumbs = thumbPool.length > 2;
  const goThumbPrev = () => {
    if (!canSlideThumbs) return;
    setThumbStart((s) => (s - 1 + thumbPool.length) % thumbPool.length);
  };
  const goThumbNext = () => {
    if (!canSlideThumbs) return;
    setThumbStart((s) => (s + 1) % thumbPool.length);
  };

  return (
    <main
      className={`product-detail ${preview ? "product-detail--preview" : ""}`}
      ref={pageRef}
    >
      <div className="product-detail-top">
        {preview ? (
          <span className="product-back">← Back to Collection</span>
        ) : (
          <Link to="/" className="product-back">
            ← Back to Collection
          </Link>
        )}
      </div>

      <section className="product-detail-content">
        <div className="product-detail-gallery" style={galleryStyle}>
          <div
            className={`product-detail-image ${selectedClass("pdImage")}${
              fixedHeight != null ? " product-detail-image--fixed-h" : ""
            }`}
            style={{
              ...mainImageBoxStyle,
              ["--pd-object-fit"]: objectFitValue,
            }}
            data-builder-key={preview ? "pdImage" : undefined}
            onClick={preview ? select("pdImage") : undefined}
          >
            {displaySrc ? (
              <img
                key={displaySrc}
                src={displaySrc}
                alt={product.name}
                className="product-detail-main-img"
                style={{ objectFit: objectFitValue }}
              />
            ) : (
              <div className="product-detail-image-placeholder" aria-hidden="true" />
            )}
          </div>

          {secondaryImages.length > 0 && (
            <div
              className={`product-detail-thumbs-wrap ${selectedClass("pdThumbs")}`}
              style={thumbsWrapStyle}
              data-builder-key={preview ? "pdThumbs" : undefined}
              onClick={preview ? select("pdThumbs") : undefined}
            >
              {canSlideThumbs && (
                <button
                  type="button"
                  className="product-detail-thumb-nav prev"
                  aria-label="Ảnh phụ trước"
                  onClick={(e) => {
                    e.stopPropagation();
                    goThumbPrev();
                  }}
                >
                  ‹
                </button>
              )}

              <div
                className="product-detail-thumbs"
                role="tablist"
                aria-label="Ảnh phụ"
                style={{
                  ...thumbsGridStyle,
                  "--thumb-count": visibleThumbs.length,
                }}
              >
                {visibleThumbs.map((src, i) => {
                  const isActive = displaySrc === src;
                  const activeColor =
                    thumbsLayout.activeBorderColor || "#b8446d";
                  const idleColor =
                    thumbsLayout.borderColor || "transparent";
                  return (
                    <button
                      key={`${src}-${i}-${thumbStart}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`product-detail-thumb${isActive ? " is-active" : ""}`}
                      style={{
                        ...thumbBtnBaseStyle,
                        borderColor: isActive ? activeColor : idleColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        promoteToMain(src);
                        if (preview && onSelect) onSelect("pdThumbs");
                      }}
                    >
                      <img src={src} alt="" />
                    </button>
                  );
                })}
              </div>

              {canSlideThumbs && (
                <button
                  type="button"
                  className="product-detail-thumb-nav next"
                  aria-label="Ảnh phụ sau"
                  onClick={(e) => {
                    e.stopPropagation();
                    goThumbNext();
                  }}
                >
                  ›
                </button>
              )}
            </div>
          )}
        </div>

        <div className="product-detail-info">
          <p
            className={`product-detail-number ${selectedClass("pdNumber")}`}
            data-builder-key={preview ? "pdNumber" : undefined}
            onClick={select("pdNumber")}
            style={css("number")}
          >
            {product.number}
          </p>

          <h1
            className={selectedClass("pdName")}
            data-builder-key={preview ? "pdName" : undefined}
            onClick={select("pdName")}
            style={css("name")}
          >
            {product.name}
          </h1>

          <p
            className={`product-detail-price ${selectedClass("pdPrice")}`}
            data-builder-key={preview ? "pdPrice" : undefined}
            onClick={select("pdPrice")}
            style={css("price")}
          >
            {product.price}
          </p>

          <p
            className={`product-detail-description ${selectedClass("pdDescription")}`}
            data-builder-key={preview ? "pdDescription" : undefined}
            onClick={select("pdDescription")}
            style={css("description")}
          >
            {product.description}
          </p>

          {(product.story || preview) && (
            <div className="product-section">
              <h2
                className={selectedClass("pdAboutTitle")}
                data-builder-key={preview ? "pdAboutTitle" : undefined}
                onClick={select("pdAboutTitle")}
                style={css("aboutTitle")}
              >
                {ps.aboutTitle?.text || "About the product"}
              </h2>
              <p
                className={selectedClass("pdBody")}
                data-builder-key={preview ? "pdBody" : undefined}
                onClick={select("pdBody")}
                style={css("body")}
              >
                {product.story}
              </p>
            </div>
          )}

          {(rows.length > 0 || preview) && (
            <div className="product-section">
              <h2
                className={selectedClass("pdDetailsTitle")}
                data-builder-key={preview ? "pdDetailsTitle" : undefined}
                onClick={select("pdDetailsTitle")}
                style={css("detailsTitle")}
              >
                {ps.detailsTitle?.text || "Details"}
              </h2>

              {rows.map(([key, label, value]) => (
                <div className="product-detail-row" key={key}>
                  <span
                    className={selectedClass(`pdLabel:${key}`)}
                    data-builder-key={preview ? `pdLabel:${key}` : undefined}
                    onClick={select(`pdLabel:${key}`)}
                    style={{ ...css("rowLabel"), cursor: preview ? "pointer" : undefined }}
                  >
                    {label}
                  </span>
                  <p
                    className={selectedClass("pdRowValue")}
                    data-builder-key={preview ? "pdRowValue" : undefined}
                    onClick={select("pdRowValue")}
                    style={{ ...css("rowValue"), cursor: preview ? "pointer" : undefined }}
                  >
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Sản phẩm khác — dùng lại Collection, bỏ sản phẩm đang xem */}
      <Collection
        preview={preview}
        selectedElement={selectedElement}
        onSelect={onSelect}
        excludeId={product.id || product.slug || id}
        forceLabel={ps.relLabel?.text || "SẢN PHẨM KHÁC"}
        forceTitle={relTitleText}
        singleTitle
        titleAccent={{ count: relAccentCount, color: relAccentColor }}
        headStylesOverride={relatedHeadStyles}
        cardStylesOverride={relatedCardStyles}
        keyMap={relatedKeyMap}
        className="product-detail-related"
        sampleProducts={
          preview
            ? defaultProducts
                .filter(
                  (p) =>
                    p.id !== (product.id || product.slug) &&
                    p.slug !== (product.id || product.slug)
                )
                .slice(0, 3)
            : null
        }
      />
    </main>
  );
}

export default ProductDetail;