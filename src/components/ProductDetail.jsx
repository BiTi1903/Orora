import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import gsap from "gsap";
import { getProduct } from "../lib/api";
import { defaultProducts } from "../data/content";

function ProductDetail() {
  const { id } = useParams();
  const pageRef = useRef(null);

  // undefined = đang tải, null = không tìm thấy
  const [product, setProduct] = useState(undefined);

  /* ---------- lấy sản phẩm từ Firestore ---------- */
  useEffect(() => {
    let alive = true;
    setProduct(undefined);
    window.scrollTo({ top: 0 });

    const fallback = () => defaultProducts.find((p) => p.slug === id) || null;

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
  }, [id]);

  /* ---------- hiệu ứng GSAP (giữ nguyên) ---------- */
  useLayoutEffect(() => {
    if (!product) return;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { ease: "power4.out" },
      });

      timeline
        .from(".product-back", { y: -20, opacity: 0, duration: 0.7 })
        .from(
          ".product-detail-image",
          { scale: 1.12, opacity: 0, duration: 1.2 },
          "-=0.3"
        )
        .from(
          ".product-detail-number",
          { y: 30, opacity: 0, duration: 0.6 },
          "-=0.7"
        )
        .from(
          ".product-detail-info h1",
          { y: 80, opacity: 0, duration: 0.9 },
          "-=0.5"
        )
        .from(
          ".product-detail-price",
          { y: 30, opacity: 0, duration: 0.6 },
          "-=0.5"
        )
        .from(
          ".product-detail-description",
          { y: 30, opacity: 0, duration: 0.7 },
          "-=0.4"
        )
        .from(
          ".product-section",
          { y: 50, opacity: 0, duration: 0.8, stagger: 0.15 },
          "-=0.4"
        );
    }, pageRef);

    return () => ctx.revert();
  }, [product]);

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

  const rows = [
    ["Material", product.material],
    ["Size", product.size],
    ["Color", product.color],
    ["Origin", product.origin],
  ].filter(([, value]) => value);

  return (
    <main className="product-detail" ref={pageRef}>

      <div className="product-detail-top">
        <Link to="/" className="product-back">
          ← Back to Collection
        </Link>
      </div>

      <section className="product-detail-content">

        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>

        <div className="product-detail-info">

          <p className="product-detail-number">{product.number}</p>

          <h1>{product.name}</h1>

          <p className="product-detail-price">{product.price}</p>

          <p className="product-detail-description">{product.description}</p>

          {product.story && (
            <div className="product-section">
              <h2>About the product</h2>
              <p>{product.story}</p>
            </div>
          )}

          {rows.length > 0 && (
            <div className="product-section">
              <h2>Details</h2>
              {rows.map(([label, value]) => (
                <div className="product-detail-row" key={label}>
                  <span>{label}</span>
                  <p>{value}</p>
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