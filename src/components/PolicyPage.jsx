import { Link } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import { footerCopy } from "../lib/footer-copy";

export default function PolicyPage() {
  const home = useHomeContent();
  const footer = footerCopy(home || {});
  const items = Array.isArray(home?.productPolicies)
    ? home.productPolicies.filter((item) => item && item.enabled !== false && (item.title || item.content))
    : [];

  return (
    <section className="policy-page" style={{ maxWidth: 820, margin: "0 auto", padding: "110px 20px 72px", lineHeight: 1.7 }}>
      <p style={{ marginBottom: 12 }}>
        <Link to="/" style={{ textDecoration: "none", fontWeight: 500 }}>← Về trang chủ</Link>
      </p>
      <h1 className="page-heading" style={{ marginBottom: 12 }}>Điều khoản, Chính sách đổi trả & Bảo mật</h1>
      <p style={{ opacity: 0.8, marginBottom: 28 }}>
        ORORA cam kết minh bạch thông tin sản phẩm, phí giao hàng và bảo mật dữ liệu khách hàng trong suốt quá trình đặt hàng và chăm sóc sau bán.
      </p>

      {items.length > 0 && (
        <section aria-labelledby="policy-commitments" style={{ marginBottom: 32 }}>
          <h2 id="policy-commitments" style={{ fontSize: "1.25rem", marginBottom: 12 }}>Cam kết từ ORORA</h2>
          <ul style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 10 }}>
            {items.map((item, index) => (
              <li key={item.id || index}>
                {item.title && <strong>{item.title}: </strong>}
                <span>{item.content}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="doi-tra" aria-labelledby="policy-return" style={{ marginBottom: 32 }}>
        <h2 id="policy-return" style={{ fontSize: "1.25rem", marginBottom: 10 }}>1. Chính sách kiểm hàng & đổi trả</h2>
        <p>
          Quý khách được kiểm tra ngoại quan kiện hàng khi nhận. Nếu sản phẩm bị lỗi từ nhà sản xuất, hư hỏng do vận chuyển hoặc giao sai phân loại, vui lòng liên hệ ORORA trong vòng 7 ngày kể từ ngày nhận hàng kèm mã đơn để được hỗ trợ đổi mới hoặc hoàn tiền.
        </p>
      </section>

      <section id="thanh-toan" aria-labelledby="policy-payment" style={{ marginBottom: 32 }}>
        <h2 id="policy-payment" style={{ fontSize: "1.25rem", marginBottom: 10 }}>2. Đặt hàng, thanh toán & vận chuyển</h2>
        <p>
          Mỗi đơn hàng trên website đều được cấp mã đơn riêng để tra cứu tại trang <Link to="/tra-cuu-don-hang">Tra cứu đơn hàng</Link>. Phí giao hàng được tính tự động theo Tỉnh/Thành phố và Phường/Xã trước khi quý khách xác nhận đặt đơn.
        </p>
      </section>

      <section id="bao-mat" aria-labelledby="policy-privacy" style={{ marginBottom: 32 }}>
        <h2 id="policy-privacy" style={{ fontSize: "1.25rem", marginBottom: 10 }}>3. Chính sách bảo mật thông tin</h2>
        <p>
          Thông tin họ tên, số điện thoại, email và địa chỉ nhận hàng của quý khách chỉ được ORORA sử dụng để xác nhận đơn, gửi thông báo trạng thái đơn hàng, giao nhận và hỗ trợ sau bán hàng. ORORA không chia sẻ thông tin cá nhân cho bên thứ ba ngoài đơn vị vận chuyển phục vụ chính đơn hàng của quý khách.
        </p>
      </section>

      <section aria-labelledby="policy-contact" style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(184, 68, 109, 0.18)" }}>
        <h2 id="policy-contact" style={{ fontSize: "1.1rem", marginTop: 0, marginBottom: 8 }}>Liên hệ hỗ trợ</h2>
        <p style={{ margin: 0 }}>
          {[
            footer.footerPhone && `Điện thoại / Zalo: ${footer.footerPhone}`,
            footer.footerEmail && `Email: ${footer.footerEmail}`,
            footer.footerAddress && `Địa chỉ: ${footer.footerAddress}`,
          ].filter(Boolean).join(" · ") || "Email: sales@ororavn.com"}
        </p>
      </section>
    </section>
  );
}
