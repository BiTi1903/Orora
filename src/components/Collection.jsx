import ProductCard from "./ProductCard";
import { Reveal } from "./Extras";
import useProducts from "../hooks/useProducts";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";
import { defaultProducts } from "../data/content";

function Collection({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
  sampleProducts = null,
}) {
  const { products: liveProducts, loading } = useProducts();
  const liveHome = useHomeContent();

  const home = preview && previewData ? previewData : liveHome || {};
  const products =
    preview
      ? sampleProducts || defaultProducts.slice(0, 3)
      : liveProducts;

  const collectionLabel = home.collectionLabel || "COLLECTION";
  const collectionTitle = home.collectionTitle || "Explore";
  const collectionHighlight = home.collectionHighlight || "the details.";

  const headStyles = home.collectionStyles || {};
  const cardStyles = home.productCardStyles || {};

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const HeaderWrap = ({ children }) => {
    if (preview) return <div className="collection-header">{children}</div>;
    return <div className="collection-header">{children}</div>;
  };

  return (
    <section
      className={`collection ${preview ? "collection--preview" : ""}`}
      id={preview ? undefined : "shop"}
    >
      {/* HEADER */}
      <HeaderWrap>
        <p
          className={`collection-label ${selectedClass("colLabel")}`}
          data-builder-key={preview ? "colLabel" : undefined}
          onClick={select("colLabel")}
          style={toCss(headStyles.label, { responsive: !preview })}
        >
          {collectionLabel}
        </p>

        <h2>
          <span
            className={`collection-title-line ${selectedClass("colTitle")}`}
            data-builder-key={preview ? "colTitle" : undefined}
            onClick={select("colTitle")}
            style={toCss(headStyles.title, { responsive: !preview })}
          >
            {collectionTitle}
          </span>

          <span
            className={`collection-title-line ${selectedClass("colHighlight")}`}
            data-builder-key={preview ? "colHighlight" : undefined}
            onClick={select("colHighlight")}
            style={toCss(headStyles.highlight, { responsive: !preview })}
          >
            {collectionHighlight}
          </span>
        </h2>
      </HeaderWrap>

      {/* PRODUCTS */}
      <div className="gallery">
        {products.map((product, i) => {
          const card = (
            <ProductCard
              key={product.id}
              image={product.image}
              number={product.number}
              name={product.name}
              description={product.description}
              price={product.price}
              slug={product.slug || product.id}
              styles={cardStyles}
              preview={preview}
              selectedElement={selectedElement}
              onSelect={onSelect}
            />
          );

          if (preview) {
            return <div key={product.id}>{card}</div>;
          }

          return (
            <Reveal key={product.id} delay={i * 120}>
              {card}
            </Reveal>
          );
        })}
      </div>

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