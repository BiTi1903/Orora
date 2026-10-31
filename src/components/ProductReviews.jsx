import { publishedProductReviews } from "../lib/product-content";
export default function ProductReviews({ product, textProps = () => ({}) }) {
  const reviews = publishedProductReviews(product);
  return <section className="product-reviews" aria-label="Đánh giá sản phẩm"><div className="product-reviews-heading"><div><span className="product-eyebrow">CHIA SẺ TRẢI NGHIỆM</span><h2 {...textProps("pdReviewTitle", "reviewTitle")}>Đánh giá sản phẩm</h2></div>{reviews.length > 0 && <span className="product-demo-badge">Nội dung minh họa</span>}</div>
    {!reviews.length ? <p className="product-review-empty">Chưa có đánh giá từ khách hàng.</p> : <><p className="product-review-disclosure">Các đánh giá dưới đây là nội dung minh họa, không phải phản hồi đã xác minh từ người mua.</p><div className="product-reviews-grid">{reviews.map((review, index) => <article className="product-review-card" key={review.id || index}><div className="product-review-top"><strong {...textProps("pdReviewName", "reviewName")}>{review.name}</strong><span className="product-demo-badge">Minh họa</span></div><div className="product-review-stars" role="img" aria-label={`${review.rating}/5 sao · minh họa`}>{"★".repeat(review.rating)}<span aria-hidden="true">{"☆".repeat(5 - review.rating)}</span></div><p {...textProps("pdReviewBody", "reviewBody")}>{review.text}</p></article>)}</div></>}
  </section>;
}
