import ProductCard from "./ProductCard";
import { Reveal } from "./Extras";
import useProducts from "../hooks/useProducts";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";

function Collection() {
  const { products, loading } = useProducts();

  /* đọc trực tiếp từ Firestore, admin lưu là trang tự cập nhật */
  const home = useHomeContent();

  const collectionLabel = home.collectionLabel || "COLLECTION";
  const collectionTitle = home.collectionTitle || "Explore";
  const collectionHighlight = home.collectionHighlight || "the details.";

  const headStyles = home.collectionStyles || {};
  const cardStyles = home.productCardStyles || {};

  return (
    <section className="collection" id="shop">

      {/* HEADER */}
      <div className="collection-header">
        <p className="collection-label" style={toCss(headStyles.label)}>
          {collectionLabel}
        </p>

        <h2>
          <span
            className="collection-title-line"
            style={toCss(headStyles.title)}
          >
            {collectionTitle}
          </span>

          <span
            className="collection-title-line"
            style={toCss(headStyles.highlight)}
          >
            {collectionHighlight}
          </span>
        </h2>
      </div>

      {/* PRODUCTS */}
      <div className="gallery">
        {products.map((product, i) => (
          <Reveal key={product.id} delay={i * 120}>
            <ProductCard
              image={product.image}
              number={product.number}
              name={product.name}
              description={product.description}
              price={product.price}
              slug={product.slug || product.id}
              styles={cardStyles}
            />
          </Reveal>
        ))}
      </div>

      {!loading && products.length === 0 && (
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