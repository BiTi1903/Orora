import { Link } from "react-router-dom";

function ProductCard({
  image,
  number,
  name,
  description,
  price,
  slug,
}) {
  return (
    <div className="gallery-item">

      <div className="gallery-image">

        <Link to={`/product/${slug}`}>
          <img
            src={image}
            alt={name}
          />
        </Link>

      </div>

      <div className="gallery-info">

        <span>
          {number}
        </span>

        <p>
          {name}
        </p>

      </div>

      <div className="product-details">

        <p className="product-description">
          {description}
        </p>

        <div className="product-bottom">

          <span className="product-price">
            {price}
          </span>

          <Link
            to={`/product/${slug}`}
            className="buy-button"
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