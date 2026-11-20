import { Link } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import { footerCopy } from "../lib/footer-copy";
import "../styles/order-tracking.css";

export default function PolicyPage() {
  const home = useHomeContent();
  const footer = footerCopy(home || {});
  const items = Array.isArray(home?.productPolicies)
    ? home.productPolicies.filter((item) => item && item.enabled !== false && (item.title || item.content))
    : [];

  return (
    <section className="policy-page">
      <Link to="/" className="order-tracking-back">← Về trang chủ</Link>
      <header className="policy-header">
        <p className="product-eyebrow">ORORA · CHÍNH SÁCH & BẢO MẬT</p>
        <h1 className="page-heading">Điều khoản, Chính sách đổi trả & Bảo mật</h1>
        <p className="policy-lead">
          ORORA cam kết minh bạch thông tin sản phẩm, phí giao hàng và bảo mật dữ liệu khách hàng trong suốt quá trình đặt hàng và chăm sóc sau bán.
        </p>
      </header>

      <div className="policy-cards">
        {items.length > 0 && (
          <section className="policy-card" aria-labelledby="policy-commitments">
            <h2 id="policy-commitments">Cam kết từ ORORA</h2>
            <ul className="policy-list">
              {items.map((item, index) => (
                <li key={item.id || index}>
                  {item.title && <strong>{item.title}: </strong>}
                  <span>{item.content}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="doi-tra" className="policy-card" aria-labelledby="policy-return">
          <h2 id="policy-return">1. Chính sách kiểm hàng & đổi trả</h2>
          <p>
            Quý khách được kiểm tra ngoại quan kiện hàng khi nhận. Nếu sản phẩm bị lỗi từ nhà sản xuất, hư hỏng do vận chuyển hoặc giao sai phân loại, vui lòng liên hệ ORORA trong vòng 7 ngày kể từ ngày nhận hàng kèm mã đơn để được hỗ trợ đổi mới hoặc hoàn tiền.
          </p>
        </section>

        <section id="thanh-toan" className="policy-card" aria-labelledby="policy-payment">
          <h2 id="policy-payment">2. Đặt hàng, thanh toán & vận chuyển</h2>
          <p>
            Mỗi đơn hàng trên website đều được cấp mã đơn riêng để tra cứu tại trang <Link to="/tra-cuu-don-hang">Tra cứu đơn hàng</Link>. Phí giao hàng được tính tự động theo Tỉnh/Thành phố và Phường/Xã trước khi quý khách xác nhận đặt đơn.
          </p>
        </section>

        <section id="bao-mat" className="policy-card" aria-labelledby="policy-privacy">
          <h2 id="policy-privacy">3. Chính sách bảo mật thông tin</h2>
          <p>
            Thông tin họ tên, số điện thoại, email và địa chỉ nhận hàng của quý khách chỉ được ORORA sử dụng để xác nhận đơn, gửi thông báo trạng thái đơn hàng, giao nhận và hỗ trợ sau bán hàng. ORORA không chia sẻ thông tin cá nhân cho bên thứ ba ngoài đơn vị vận chuyển phục vụ chính đơn hàng của quý khách.
          </p>
        </section>

        <section className="policy-card policy-contact-card" aria-labelledby="policy-contact">
          <h2 id="policy-contact">Liên hệ hỗ trợ</h2>
          <p>
            {[
              footer.footerPhone && `Điện thoại / Zalo: ${footer.footerPhone}`,
              footer.footerEmail && `Email: ${footer.footerEmail}`,
              footer.footerAddress && `Địa chỉ: ${footer.footerAddress}`,
            ].filter(Boolean).join(" · ") || "Email: sales@ororavn.com"}
          </p>
        </section>
      </div>
    </section>
  );
}
