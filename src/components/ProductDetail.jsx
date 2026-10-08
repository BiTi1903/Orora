import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import gsap from "gsap";
import { getProduct } from "../lib/api";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";
import { defaultProducts } from "../data/content";
import ProductSlideshow from "./ProductSlideshow";

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
        <div className="product-detail-image">
          <ProductSlideshow
            images={[product.image, product.image2, product.image3, product.image4]}
            alt={product.name}
          />
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
    </main>
  );
}

export default ProductDetail;