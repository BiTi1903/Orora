import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import { Reveal } from "./Extras";
import useProducts from "../hooks/useProducts";
import { getHomeContent } from "../lib/api";

function Collection() {
  const { products, loading } = useProducts();
  const [home, setHome] = useState(null);

  useEffect(() => {
    getHomeContent()
      .then((data) => {
        if (data) {
          setHome(data);
        }
      })
      .catch((err) => {
        console.error("Không thể tải nội dung Collection:", err);
      });
  }, []);

  const collectionLabel =
    home?.collectionLabel || "COLLECTION";

  const collectionTitle =
    home?.collectionTitle || "Explore";

  const collectionHighlight =
    home?.collectionHighlight || "the details.";

  return (
    <section className="collection" id="shop">

      {/* HEADER */}
      <div className="collection-header">
        <p className="collection-label">
          {collectionLabel}
        </p>

        <h2>
          <span className="collection-title-line">
            {collectionTitle}
          </span>

          <span className="collection-title-line">
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