import { useRef } from "react";
import { Link } from "react-router-dom";

function ProductCard({
  image,
  number,
  name,
  description,
  price,
  slug,
}) {
  const frameRef = useRef(null);

  const handleMove = (e) => {
    const el = frameRef.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };

  const handleLeave = () => {
    const el = frameRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  return (
    <div className="gallery-item">

      <div
        className="gallery-image tilt"
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >

        <span className="tilt-shine" aria-hidden="true" />

        <Link to={`/product/${slug}`}>
          <img src={image} alt={name} />
        </Link>

      </div>

      <div className="gallery-info">
        <span>{number}</span>
        <p>{name}</p>
      </div>

      <div className="product-details">

        <p className="product-description">{description}</p>

        <div className="product-bottom">

          <span className="product-price">{price}</span>

          <Link to={`/product/${slug}`} className="buy-button">
            Xem chi tiết
            <span>↗</span>
          </Link>

        </div>

      </div>

    </div>
  );
}

export default ProductCard;