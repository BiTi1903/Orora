import { useRef } from "react";
import { Link } from "react-router-dom";
import { splitColor, toCss } from "../lib/typography";

function ProductCard({
  image,
  number,
  name,
  description,
  price,
  slug,
  styles = {},
}) {
  const frameRef = useRef(null);

  /* màu tên đi qua biến CSS để giữ hiệu ứng đổi màu khi rê chuột */
  const { color: nameColor, rest: nameRest } = splitColor(styles.name);
  const nameStyle = nameColor
    ? { ...nameRest, "--pc-name": nameColor }
    : nameRest;

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
        <span style={toCss(styles.number)}>{number}</span>
        <p style={nameStyle}>{name}</p>
      </div>

      <div className="product-details">

        <p
          className="product-description"
          style={toCss(styles.description)}
        >
          {description}
        </p>

        <div className="product-bottom">

          <span className="product-price" style={toCss(styles.price)}>{price}</span>

          <Link
            to={`/product/${slug}`}
            className="buy-button"
            style={toCss(styles.button)}
          >
            Xem chi tiết
            <span>↗</span>
          </Link>

        </div>

      </div>

    </div>
  );
}

export default ProductCard;