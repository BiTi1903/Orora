import { useEffect, useRef, useState } from "react";
import { availablePaymentMethods, PAYMENT_LABELS, parseVndPrice, formatVnd } from "../lib/commerce";

export default function OrderForm({ product, home, onClose }) {
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const formRef = useRef(null);
  useEffect(() => { formRef.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); }, []);
  const methods = availablePaymentMethods(home);
  const unitPrice = parseVndPrice(product.price);
  if (result?.code) return <section className="website-order order-received" role="status">
    <h2>Đã nhận đơn hàng</h2><p>Mã đơn: <strong>{result.code}</strong></p>
    <p>{result.message}</p><p>{result.mailStatus === "accepted" ? "Vui lòng kiểm tra email xác nhận và mục thư rác." : result.mailStatus === "failed" ? "Đơn đã được nhận nhưng chưa gửi được email xác nhận. Bạn có thể liên hệ ORORA với mã đơn bên trên." : "Email xác nhận đang được xử lý."}</p><p>Tạm tính: {result.subtotal === null ? "ORORA sẽ báo giá khi xác nhận" : formatVnd(result.subtotal)}</p><button type="button" onClick={onClose}>Đóng</button>
  </section>;
  return <form ref={formRef} className="website-order" aria-label="Đặt hàng trên website" onSubmit={async (event) => {
    event.preventDefault();
    if (busy || !methods.length) return;
    const data = new FormData(event.currentTarget);
    setBusy(true); setResult(null);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        requestId: requestId.current, productId: product.id || product.slug, quantity, expectedPriceText: String(product.price ?? ""),
        name: data.get("name"), phone: data.get("phone"), email: data.get("email"), address: data.get("address"), note: data.get("note"),
        paymentMethod: data.get("paymentMethod"), consent: data.get("consent") === "on", website: data.get("website"),
      }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Chưa gửi được đơn hàng.");
      if (!json.code) throw new Error("Chưa xác nhận được mã đơn. Vui lòng thử gửi lại.");
      setResult(json);
    } catch (error) { setResult({ error: error instanceof TypeError || error instanceof SyntaxError ? "Kết nối bị gián đoạn. Hãy thử gửi lại hoặc liên hệ ORORA." : error.message || "Chưa gửi được đơn. Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }}>
    <div className="order-form-heading"><h2>Đặt hàng trên website</h2><button type="button" onClick={onClose} disabled={busy} aria-label="Đóng form đặt hàng">×</button></div>
    <p className="order-product-name">{product.name}</p>
    <fieldset disabled={busy}>
      <div className="order-field-row">
        <label>Họ và tên<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
        <label>Số điện thoại<input name="phone" type="tel" required maxLength={25} autoComplete="tel" /></label>
      </div>
      <label>Email nhận xác nhận đơn<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <label>Địa chỉ nhận hàng<textarea name="address" rows={2} required minLength={10} maxLength={500} autoComplete="street-address" placeholder="Số nhà, đường, phường/xã, tỉnh/thành phố" /></label>
      <div className="order-field-row">
        <label>Số lượng<input name="quantity" type="number" min={1} max={20} required value={quantity} onChange={(event) => setQuantity(event.target.value === "" ? "" : Number(event.target.value))} /></label>
        <label>Phương thức thanh toán<select aria-label="Phương thức thanh toán" name="paymentMethod" required defaultValue={methods[0] || ""}>{methods.map((key) => <option key={key} value={key}>{PAYMENT_LABELS[key]}</option>)}</select></label>
      </div>
      <label>Ghi chú (không bắt buộc)<textarea name="note" rows={2} maxLength={1000} /></label>
      <div className="order-summary"><span>Tạm tính</span><strong>{unitPrice === null ? "Shop sẽ liên hệ báo giá" : formatVnd(unitPrice * (Number(quantity) || 0))}</strong></div>
      <p className="order-help">Phí giao hàng và thông tin thanh toán sẽ được ORORA xác nhận khi liên hệ. Form này không thu tiền trực tuyến.</p>
      <label className="order-consent"><input name="consent" type="checkbox" required /><span>Tôi đồng ý để ORORA liên hệ, gửi email xác nhận và xử lý đơn hàng theo thông tin đã cung cấp.</span></label>
      <label hidden aria-hidden="true">Website<input name="website" autoComplete="off" tabIndex={-1} /></label>
      {!methods.length && <p role="status">Website đang tạm ngưng nhận đơn. Vui lòng liên hệ ORORA hoặc mua qua các kênh bên trên.</p>}
      <button className="website-order-submit" disabled={busy || !methods.length}>{busy ? "Đang lưu đơn…" : "Đặt hàng ngay"}</button>
    </fieldset>
    {result?.error && <p className="order-error" role="alert">{result.error}</p>}
  </form>;
}
