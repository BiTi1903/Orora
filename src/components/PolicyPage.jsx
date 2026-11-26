import {DEFAULT_RETURN_POLICY} from "../lib/return-policy";
import {shippingPolicy,shippingOffer,policyDescription} from "../lib/shipping";
import { Link } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import { footerCopy } from "../lib/footer-copy";
import "../styles/order-tracking.css";

export default function PolicyPage({preview} = {}) {
  const saved = useHomeContent();
  const home = preview ? {...saved,...preview} : saved;
  const footer = footerCopy(home || {});
  const items = Array.isArray(home?.productPolicies)
    ? home.productPolicies.filter((item) => item && item.enabled !== false && typeof item.title==="string" && item.title.trim() && typeof item.content==="string" && item.content.trim())
    : [];

  const returns = items.filter((item) => item.kind === "returns");
  const custom = home?.policyPageContent || {};
  const returnsText = typeof custom.returnsText === "string" && custom.returnsText.trim()
    ? custom.returnsText.trim()
    : (returns.length ? returns.map((item) => item.content).join(" ") : DEFAULT_RETURN_POLICY);
  const paymentText = typeof custom.paymentText === "string" && custom.paymentText.trim()
    ? custom.paymentText.trim()
    : "";
  const privacyText = typeof custom.privacyText === "string" && custom.privacyText.trim()
    ? custom.privacyText.trim()
    : "Thông tin họ tên, số điện thoại, email và địa chỉ nhận hàng của quý khách chỉ được ORORA sử dụng để xác nhận đơn, gửi thông báo trạng thái đơn hàng, giao nhận và hỗ trợ sau bán hàng. ORORA không chia sẻ thông tin cá nhân cho bên thứ ba ngoài đơn vị vận chuyển phục vụ chính đơn hàng của quý khách.";

  return (
    <section className="policy-page">
      {!preview && <Link to="/" className="order-tracking-back">← Về trang chủ</Link>}
      <header className="policy-header">
        <p className="product-eyebrow">ORORA · CHÍNH SÁCH & BẢO MẬT</p>
        <h1 className="page-heading">Điều khoản, Chính sách đổi trả & Bảo mật</h1>
        <p className="policy-lead">
          ORORA cam kết minh bạch thông tin sản phẩm, phí giao hàng và bảo mật dữ liệu khách hàng trong suốt quá trình đặt hàng và chăm sóc sau bán.
        </p>
      </header>

      <div className="policy-cards">
        {items.some((item) => item.kind !== "returns") && (
          <section className="policy-card" aria-labelledby="policy-commitments">
            <h2 id="policy-commitments">Cam kết từ ORORA</h2>
            <ul className="policy-list">
              {items.filter((item) => item.kind !== "returns").map((item, index) => (
                <li key={item.id || index}>
                  {item.title && <strong>{item.title}: </strong>}
                  <span>{policyDescription(item,home.shippingSettings)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section id="doi-tra" className="policy-card" aria-labelledby="policy-return">
          <h2 id="policy-return">1. Chính sách kiểm hàng & đổi trả</h2>
          <p style={{ whiteSpace: "pre-line" }}>{returnsText}</p>
        </section>

        <section id="thanh-toan" className="policy-card" aria-labelledby="policy-payment">
          <h2 id="policy-payment">2. Đặt hàng, thanh toán & vận chuyển</h2>
          {paymentText ? (
            <p style={{ whiteSpace: "pre-line" }}>{paymentText}</p>
          ) : (
            <p>
              Mỗi đơn hàng trên website đều được cấp mã đơn riêng để tra cứu tại trang <Link to="/tra-cuu-don-hang">Tra cứu đơn hàng</Link>. {shippingPolicy(home.shippingSettings?.enabled)}
            </p>
          )}
        </section>

        {shippingOffer(home.shippingSettings)&&<p>{shippingOffer(home.shippingSettings)}</p>}
        <section id="bao-mat" className="policy-card" aria-labelledby="policy-privacy">
          <h2 id="policy-privacy">3. Chính sách bảo mật thông tin</h2>
          <p style={{ whiteSpace: "pre-line" }}>{privacyText}</p><p>Mã QR chuyển khoản được tạo trên thiết bị từ thông tin tài khoản nhận, số tiền và nội dung thanh toán.</p>
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
