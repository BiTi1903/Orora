import { useRef } from "react";
import { Link } from "react-router-dom";
import { splitColor, toCss } from "../lib/typography";
import ProductSlideshow from "./ProductSlideshow";

function ProductCard({
  image,
  image2,
  image3,
  image4,
  image5,
  image6,
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

  // Layout cả thẻ (ảnh + thông tin đi cùng nhau)
  const imageLayout = styles.imageLayout || {};
  const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const px = (v) => `${n(v)}px`;

  const widthPercent = Math.min(
    100,
    Math.max(10, n(imageLayout.widthPercent) || 100)
  );
  const mL = n(imageLayout.marginLeft);
  const mR = n(imageLayout.marginRight);
  const mT = n(imageLayout.marginTop);
  const mB = n(imageLayout.marginBottom);
  const pT = n(imageLayout.paddingTop);
  const pR = n(imageLayout.paddingRight);
  const pB = n(imageLayout.paddingBottom);
  const pL = n(imageLayout.paddingLeft);
  const imgHeight =
    imageLayout.height != null && n(imageLayout.height) > 0
      ? n(imageLayout.height)
      : null;

  // Cả thẻ: ngang + margin + padding → ảnh và chữ đi theo
  const cardWidth =
    mL || mR
      ? `calc(${widthPercent}% - ${mL + mR}px)`
      : `${widthPercent}%`;

  const cardStyle = {
    width: cardWidth,
    maxWidth: "100%",
    marginTop: px(mT),
    marginRight: px(mR),
    marginBottom: px(mB),
    marginLeft: px(mL),
    paddingTop: px(pT),
    paddingRight: px(pR),
    paddingBottom: px(pB),
    paddingLeft: px(pL),
    boxSizing: "border-box",
  };

  // Chỉ khung ảnh: chiều dọc / tỷ lệ / viền
  const imageFrameStyle = {
    width: "100%",
    ["--pc-width"]: "100%",
    ["--pc-height"]: imgHeight != null ? `${imgHeight}px` : "auto",
    ["--pc-aspect"]:
      imgHeight != null ? "auto" : imageLayout.aspectRatio || "4 / 5",
    height: imgHeight != null ? `${imgHeight}px` : undefined,
    minHeight: imgHeight != null ? `${imgHeight}px` : undefined,
    maxHeight: imgHeight != null ? `${imgHeight}px` : undefined,
    aspectRatio:
      imgHeight != null ? "auto" : imageLayout.aspectRatio || undefined,
    borderRadius: imageLayout.radius != null ? px(imageLayout.radius) : undefined,
    borderWidth:
      imageLayout.borderWidth != null ? px(imageLayout.borderWidth) : undefined,
    borderColor: imageLayout.borderColor || undefined,
    borderStyle:
      imageLayout.borderWidth != null && n(imageLayout.borderWidth) > 0
        ? "solid"
        : undefined,
    boxSizing: "border-box",
    ["--pc-object-fit"]: imageLayout.objectFit || "cover",
  };

  return (
    <div
      className={`gallery-item ${preview ? "gallery-item--preview" : ""} ${selectedClass("cardImage")}`}
      style={cardStyle}
      data-builder-key={preview ? "cardImage" : undefined}
      onClick={select("cardImage")}
    >
      <div
        className={`gallery-image tilt${imgHeight != null ? " gallery-image--fixed-h" : ""}`}
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={imageFrameStyle}
      >
        <span className="tilt-shine" aria-hidden="true" />

        <ImageWrap className="product-slideshow-link" {...imageProps}>
          <ProductSlideshow
            images={[image, image2, image3, image4, image5, image6]}
            alt={name}
            showDots={false}
          />
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