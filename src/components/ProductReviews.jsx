import useHomeContent from "../hooks/useHomeContent";
import {reviewCardStyle} from "../lib/review-card-style";
import {publishedProductReviews} from "../lib/product-content";

export default function ProductReviews({product, preview = false, styles = {}, textProps = () => ({}), sectionProps = {}}) {
  const home = useHomeContent();
  const published = publishedProductReviews(product);
  const reviews = preview && !published.length
    ? [{id: "preview", name: "Khách hàng mẫu", rating: 5, text: "Nội dung mẫu để xem trước kiểu chữ và khung đánh giá."}]
    : published;
  const title = styles.reviewTitle?.text?.trim() || "Đánh giá sản phẩm";
  const sectionStyle = styles.reviewSection ? reviewCardStyle(styles.reviewSection) : {};
  const {className, ...selection} = sectionProps;
  const eyebrow = textProps("pdReviewEyebrow", "reviewEyebrow");
  const empty = textProps("pdReviewEmpty", "reviewEmpty");
  const disclosure = textProps("pdReviewDisclosure", "reviewDisclosure");
  const stars = textProps("pdReviewStars", "reviewStars");
  const badge = textProps("pdReviewBadge", "reviewBadge");

  return <section {...selection} id="product-reviews" className={`product-reviews ${className || ""}`} aria-label={title}
    style={{...sectionStyle, opacity: preview && styles.visibility?.reviews === false ? 0.45 : undefined}}>
    <div className="product-reviews-heading">
      <div>
        <span {...eyebrow} className={`product-eyebrow ${eyebrow.className || ""}`}>
          {styles.reviewEyebrow?.text ?? "CHIA SẺ TRẢI NGHIỆM"}
        </span>
        <h2 {...textProps("pdReviewTitle", "reviewTitle")}>{title}</h2>
      </div>
      {reviews.length > 0 && <span {...badge} className={`product-demo-badge ${badge.className || ""}`}>Nội dung minh họa</span>}
    </div>
    {!reviews.length ? <p {...empty} className={`product-review-empty ${empty.className || ""}`}>
      {styles.reviewEmpty?.text?.trim() || "Chưa có đánh giá từ khách hàng."}
    </p> : <>
      <p {...disclosure} className={`product-review-disclosure ${disclosure.className || ""}`}>
        Các đánh giá dưới đây là nội dung minh họa, không phải phản hồi đã xác minh từ người mua.
      </p>
      <div className="product-reviews-grid">{reviews.map((review, index) => (
        <article style={reviewCardStyle({...home.testimonialsStyles?.card, ...styles.reviewCard})}
          className="product-review-card" key={review.id || index}>
          <div className="product-review-top">
            <strong {...textProps("pdReviewName", "reviewName")}>{review.name}</strong>
            <span {...badge} className={`product-demo-badge ${badge.className || ""}`}>Minh họa</span>
          </div>
          <div {...stars} className={`product-review-stars ${stars.className || ""}`} role="img" aria-label={`${review.rating}/5 sao · minh họa`}>
            {"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span>
          </div>
          <p {...textProps("pdReviewBody", "reviewBody")}>{review.text}</p>
        </article>
      ))}</div>
    </>}
  </section>;
}
