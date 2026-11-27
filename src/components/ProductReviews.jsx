import useHomeContent from '../hooks/useHomeContent';
import {reviewCardStyle} from '../lib/review-card-style';
import { publishedProductReviews } from "../lib/product-content";
export default function ProductReviews({ product, preview = false, styles = {}, textProps = () => ({}) }) {
  const home=useHomeContent();
  const published = publishedProductReviews(product);
  const reviews = preview && !published.length
    ? [{id: "preview", name: "Khách hàng mẫu", rating: 5, text: "Nội dung mẫu để xem trước kiểu chữ và khung đánh giá."}]
    : published;
  const title = styles.reviewTitle?.text?.trim() || "Đánh giá sản phẩm";
  return <section id="product-reviews" className="product-reviews" aria-label={title} style={preview && styles.visibility?.reviews === false ? {opacity: 0.45} : undefined}><div className="product-reviews-heading"><div><span className="product-eyebrow">CHIA SẺ TRẢI NGHIỆM</span><h2 {...textProps("pdReviewTitle", "reviewTitle")}>{title}</h2></div>{reviews.length > 0 && <span className="product-demo-badge">Nội dung minh họa</span>}</div>
    {!reviews.length ? <p className="product-review-empty">Chưa có đánh giá từ khách hàng.</p> : <><p className="product-review-disclosure">Các đánh giá dưới đây là nội dung minh họa, không phải phản hồi đã xác minh từ người mua.</p><div className="product-reviews-grid">{reviews.map((review, index) => <article style={reviewCardStyle({...home.testimonialsStyles?.card, ...styles.reviewCard})} className="product-review-card" key={review.id || index}><div className="product-review-top"><strong {...textProps("pdReviewName", "reviewName")}>{review.name}</strong><span className="product-demo-badge">Minh họa</span></div><div className="product-review-stars" role="img" aria-label={`${review.rating}/5 sao · minh họa`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></div><p {...textProps("pdReviewBody", "reviewBody")}>{review.text}</p></article>)}</div></>}
  </section>;
}
