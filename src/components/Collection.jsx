import ProductCard from "./ProductCard";

function Collection() {

  const products = [
    {
      image: "/gallery1.jpg",
      number: "01",
      name: "First Story",
      description:
        "A beautiful piece created for your everyday moments.",
      price: "1.290.000đ",
      slug: "first-story",
    },

    {
      image: "/gallery2.jpg",
      number: "02",
      name: "Second Story",
      description:
        "Simple, elegant and designed to stand out.",
      price: "1.490.000đ",
      slug: "second-story",
    },

    {
      image: "/gallery3.jpg",
      number: "03",
      name: "Third Story",
      description:
        "A timeless design with a soft and modern feeling.",
      price: "1.690.000đ",
      slug: "third-story",
    },
  ];

  return (
    <section
      className="collection"
      id="shop"
    >

      {/* HEADER */}

      <div className="collection-header">

        <p className="collection-label">
          COLLECTION
        </p>

        <h2>

          <span className="collection-title-line">
            Explore
          </span>

          <span className="collection-title-line">
            the details.
          </span>

        </h2>

      </div>


      {/* PRODUCTS */}

      <div className="gallery">

        {products.map((product) => (

          <ProductCard
            key={product.number}
            image={product.image}
            number={product.number}
            name={product.name}
            description={product.description}
            price={product.price}
            slug={product.slug}
          />

        ))}

      </div>


      {/* BOTTOM */}



    </section>
  );
}

export default Collection;