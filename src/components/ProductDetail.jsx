import { useLayoutEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import gsap from "gsap";

function ProductDetail() {
  const { id } = useParams();
  const pageRef = useRef(null);

  const products = {
    "first-story": {
      image: "/gallery1.jpg",
      number: "01",
      name: "First Story",
      price: "1.290.000đ",
      description:
        "A beautiful piece created for your everyday moments.",
      story:
        "First Story is created with a simple idea in mind — bringing beauty into everyday life. Every detail is carefully considered to create a timeless and elegant feeling.",
      material:
        "Premium material with a soft and refined finish.",
      size:
        "Designed with a comfortable and balanced form.",
      color:
        "Soft and natural tones.",
      origin:
        "Designed and created with care.",
    },

    "second-story": {
      image: "/gallery2.jpg",
      number: "02",
      name: "Second Story",
      price: "1.490.000đ",
      description:
        "Simple, elegant and designed to stand out.",
      story:
        "Second Story combines a modern feeling with timeless simplicity. It is designed for people who appreciate subtle details and a clean aesthetic.",
      material:
        "Carefully selected material with a smooth finish.",
      size:
        "Balanced proportions designed for everyday use.",
      color:
        "Elegant and contemporary tones.",
      origin:
        "Designed with attention to every detail.",
    },

    "third-story": {
      image: "/gallery3.jpg",
      number: "03",
      name: "Third Story",
      price: "1.690.000đ",
      description:
        "A timeless design with a soft and modern feeling.",
      story:
        "Third Story brings together softness, simplicity and a modern perspective. The design focuses on creating a calm and beautiful experience.",
      material:
        "High-quality material selected for durability and appearance.",
      size:
        "Modern proportions with a comfortable design.",
      color:
        "Soft, warm and modern tones.",
      origin:
        "Designed and developed with care.",
    },
  };

  const product = products[id];

  useLayoutEffect(() => {
    if (!product) return;

    const ctx = gsap.context(() => {

      const timeline = gsap.timeline({
        defaults: {
          ease: "power4.out",
        },
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

  }, [product]);

  if (!product) {
    return (
      <div className="product-not-found">

        <h1>
          Product not found
        </h1>

      </div>
    );
  }

  return (
    <main
      className="product-detail"
      ref={pageRef}
    >

      <div className="product-detail-top">

        <Link
          to="/"
          className="product-back"
        >
          ← Back to Collection
        </Link>

      </div>

      <section className="product-detail-content">

        <div className="product-detail-image">

          <img
            src={product.image}
            alt={product.name}
          />

        </div>

        <div className="product-detail-info">

          <p className="product-detail-number">
            {product.number}
          </p>

          <h1>
            {product.name}
          </h1>

          <p className="product-detail-price">
            {product.price}
          </p>

          <p className="product-detail-description">
            {product.description}
          </p>

          <div className="product-section">

            <h2>
              About the product
            </h2>

            <p>
              {product.story}
            </p>

          </div>

          <div className="product-section">

            <h2>
              Details
            </h2>

            <div className="product-detail-row">
              <span>Material</span>
              <p>{product.material}</p>
            </div>

            <div className="product-detail-row">
              <span>Size</span>
              <p>{product.size}</p>
            </div>

            <div className="product-detail-row">
              <span>Color</span>
              <p>{product.color}</p>
            </div>

            <div className="product-detail-row">
              <span>Origin</span>
              <p>{product.origin}</p>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}

export default ProductDetail;