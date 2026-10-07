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
  preview = false,
  selectedElement = "",
  onSelect,
}) {
  const frameRef = useRef(null);

  /* màu tên đi qua biến CSS để giữ hiệu ứng đổi màu khi rê chuột */
  const { color: nameColor, rest: nameRest } = splitColor(styles.name);
  const nameStyle = nameColor
    ? { ...nameRest, "--pc-name": nameColor }
    : nameRest;

  const handleMove = (e) => {
    if (preview) return;
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
    if (preview) return;
    const el = frameRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const ImageWrap = preview ? "div" : Link;
  const imageProps = preview
    ? {}
    : { to: `/product/${slug}` };

  const ButtonWrap = preview ? "span" : Link;
  const buttonProps = preview
    ? {}
    : { to: `/product/${slug}` };

  return (
    <div className={`gallery-item ${preview ? "gallery-item--preview" : ""}`}>
      <div
        className="gallery-image tilt"
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <span className="tilt-shine" aria-hidden="true" />

        <ImageWrap {...imageProps}>
          <img src={image} alt={name} />
        </ImageWrap>
      </div>

      <div className="gallery-info">
        <span
          className={selectedClass("cardNumber")}
          data-builder-key={preview ? "cardNumber" : undefined}
          onClick={select("cardNumber")}
          style={toCss(styles.number, { responsive: !preview })}
        >
          {number}
        </span>
        <p
          className={selectedClass("cardName")}
          data-builder-key={preview ? "cardName" : undefined}
          onClick={select("cardName")}
          style={nameStyle}
        >
          {name}
        </p>
      </div>

      <div className="product-details">
        <p
          className={`product-description ${selectedClass("cardDescription")}`}
          data-builder-key={preview ? "cardDescription" : undefined}
          onClick={select("cardDescription")}
          style={toCss(styles.description, { responsive: !preview })}
        >
          {description}
        </p>

        <div className="product-bottom">
          <span
            className={`product-price ${selectedClass("cardPrice")}`}
            data-builder-key={preview ? "cardPrice" : undefined}
            onClick={select("cardPrice")}
            style={toCss(styles.price, { responsive: !preview })}
          >
            {price}
          </span>

          <ButtonWrap
            {...buttonProps}
            className={`buy-button ${selectedClass("cardButton")}`}
            data-builder-key={preview ? "cardButton" : undefined}
            onClick={select("cardButton")}
            style={toCss(styles.button, { responsive: !preview })}
          >
            Xem chi tiết
            <span>↗</span>
          </ButtonWrap>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;