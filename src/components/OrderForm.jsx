import { Link } from "react-router-dom";
import ProductPurchaseSelection from "./ProductPurchaseSelection";
import { MAX_ORDER_QUANTITY, productVolumeOptions, selectedVolumeOption, volumePriceText } from "../lib/product-options";
import AddressSelect from "./AddressSelect";
import ModalDialog from "./ModalDialog";
import useAddressOptions from "../hooks/useAddressOptions";
import { shippingFeeFor } from "../lib/shipping";
import { useRef, useState } from "react";
import { availablePaymentMethods, PAYMENT_LABELS, parseVndPrice, formatVnd } from "../lib/commerce";

export default function OrderForm({ product, home, onClose, selection, initialVariantId = "", initialQuantity = 1, onSelectionChange }) {
  const options = productVolumeOptions(product);
  const [localSelection, setLocalSelection] = useState(() => ({ variantId: initialVariantId, quantity: Number.isInteger(initialQuantity) && initialQuantity >= 1 && initialQuantity <= MAX_ORDER_QUANTITY ? initialQuantity : 1 }));
  const currentSelection = selection || localSelection;
  const variant = selectedVolumeOption(options, currentSelection.variantId);
  const variantId = variant?.id || "";
  const quantity = currentSelection.quantity;
  const updateSelection = (patch) => {
    if (!selection) setLocalSelection((previous) => ({ ...previous, ...patch }));
    onSelectionChange?.(patch);
  };
  const changeVariant = (variantId) => updateSelection({ variantId });
  const changeQuantity = (quantity) => updateSelection({ quantity });
  const priceText = volumePriceText(product, variant);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const addresses = useAddressOptions(provinceCode);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const methods = availablePaymentMethods(home);
  const unitPrice = parseVndPrice(priceText);
  const shipping = shippingFeeFor(home.shippingSettings, provinceCode, wardCode);
  const total = unitPrice === null || shipping.fee === null ? null : unitPrice * (Number(quantity) || 0) + shipping.fee;
  if (result?.code) return <ModalDialog key="success" title="Đã nhận đơn hàng" onClose={onClose} className="order-success-modal"><section className="order-received" aria-label="Thông tin đơn đã nhận"><p>Mã đơn: <strong>{result.code}</strong></p>
    <p>{result.message}</p>
    <div className="order-received-details"><h3>Thông tin người nhận</h3><dl>
      {[["Họ và tên", result.recipient.name], ["Số điện thoại", result.recipient.phone], ["Email", result.recipient.email], ["Địa chỉ nhận hàng", result.recipient.address], ["Ghi chú", result.recipient.note]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></div>
    <div className="order-received-details"><h3>Thông tin đơn hàng</h3><dl>
      <div><dt>Sản phẩm</dt><dd>{result.productName}</dd></div>
      {result.variantLabel && <div><dt>Dung tích</dt><dd>{result.variantLabel}</dd></div>}
      <div><dt>Số lượng</dt><dd>{result.quantity}</dd></div>
      <div><dt>Thanh toán</dt><dd>{PAYMENT_LABELS[result.paymentMethod] || result.paymentMethod}</dd></div>
      <div><dt>Tiền sản phẩm</dt><dd>{result.subtotal === null ? "ORORA sẽ báo giá khi xác nhận" : formatVnd(result.subtotal)}</dd></div>
      <div><dt>Phí giao hàng</dt><dd>{result.shippingFee == null ? "Xác nhận sau" : formatVnd(result.shippingFee)}</dd></div>
      <div><dt>Tổng tiền</dt><dd>{result.totalAmount == null ? "ORORA sẽ xác nhận tổng tiền" : formatVnd(result.totalAmount)}</dd></div>
    </dl></div>
    <p><Link to="/tra-cuu-don-hang" state={{ code: result.code }} onClick={onClose}>Tra cứu trạng thái đơn hàng</Link></p>
    <p className="order-help">Nếu thông tin chưa đúng, vui lòng liên hệ ORORA và cung cấp mã đơn để được hỗ trợ.</p>
    <p>{result.mailStatus === "accepted" ? "Vui lòng kiểm tra email xác nhận và mục thư rác." : result.mailStatus === "failed" ? "Đơn đã được nhận nhưng chưa gửi được email xác nhận. Bạn có thể liên hệ ORORA với mã đơn bên trên." : "Email xác nhận đang được xử lý."}</p><button type="button" onClick={onClose}>Đóng</button>
  </section></ModalDialog>;
  return <ModalDialog key="form" title="Đặt hàng trên website" onClose={onClose} closeDisabled={busy} className="order-form-modal"><form className="website-order" aria-label="Đặt hàng trên website" onSubmit={async (event) => {
    event.preventDefault();
    if (busy || (options.length > 0 && !variant) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ORDER_QUANTITY || !methods.length || !provinceCode || !wardCode || (home.shippingSettings?.enabled === true && shipping.fee === null)) return;
    const data = new FormData(event.currentTarget);
    const recipient = Object.fromEntries(["name", "phone", "email", "address", "note"].map((key) => [key, String(data.get(key) || "").trim()]));
    const province = addresses.provinces.find((item) => item.code === provinceCode);
    const ward = addresses.wards.find((item) => item.code === wardCode);
    recipient.address = `${String(data.get("addressDetail") || "").trim()}, ${ward?.name || ""}, ${province?.name || ""}`;
    recipient.email = recipient.email.toLowerCase();
    recipient.phone = recipient.phone.replace(/[\s().-]/g, "");
    const orderedProduct = { productName: product.name, variantLabel: variant?.label || "", quantity };
    setBusy(true); setResult(null);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        requestId: requestId.current, productId: product.id || product.slug, quantity, variantId, expectedVariantLabel: variant?.label || "", expectedPriceText: priceText,
        name: data.get("name"), phone: data.get("phone"), email: data.get("email"), provinceCode, wardCode, addressDetail: data.get("addressDetail"), expectedShippingFee: shipping.fee, note: data.get("note"),
        paymentMethod: data.get("paymentMethod"), consent: data.get("consent") === "on",
      }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Chưa gửi được đơn hàng.");
      if (!json.code) throw new Error("Chưa xác nhận được mã đơn. Vui lòng thử gửi lại.");
      setResult({ ...orderedProduct, ...json, recipient });
    } catch (error) { setResult({ error: error instanceof TypeError || error instanceof SyntaxError ? "Kết nối bị gián đoạn. Hãy thử gửi lại hoặc liên hệ ORORA." : error.message || "Chưa gửi được đơn. Vui lòng thử lại." }); }
    finally { setBusy(false); }
  }}>
    <p className="order-product-name">{product.name}</p>
    <fieldset disabled={busy}>
      <ProductPurchaseSelection options={options} variantId={variantId} quantity={quantity} onVariantChange={changeVariant} onQuantityChange={changeQuantity} disabled={busy} required />
      <div className="order-field-row">
        <label>Họ và tên<input name="name" required minLength={2} maxLength={100} autoComplete="name" /></label>
        <label>Số điện thoại<input name="phone" type="tel" required maxLength={25} autoComplete="tel" /></label>
      </div>
      <label>Email nhận xác nhận đơn<input name="email" type="email" required maxLength={254} autoComplete="email" /></label>
      <div className="order-field-row order-address-row">
        <AddressSelect label="Tỉnh / Thành phố" name="provinceCode" required value={provinceCode} options={addresses.provinces} disabled={!addresses.provinces.length} loading={addresses.loadingProvinces} placeholder="Chọn tỉnh/thành" onChange={(code) => { setProvinceCode(code); setWardCode(""); }} />
        <AddressSelect label="Phường / Xã" name="wardCode" required value={wardCode} options={addresses.wards} disabled={!provinceCode || !addresses.wards.length} loading={addresses.loadingWards} placeholder="Chọn phường/xã" onChange={setWardCode} />
      </div>
      {addresses.error && <p className="order-error" role="alert">{addresses.error} <button type="button" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
      <label>Số nhà, tên đường<textarea name="addressDetail" rows={2} required minLength={5} maxLength={350} autoComplete="street-address" placeholder="Số nhà, tên đường, tòa nhà…" /></label>
      <div className="order-payment-row">
        <label>Phương thức thanh toán<select aria-label="Phương thức thanh toán" name="paymentMethod" required defaultValue={methods[0] || ""}>{methods.map((key) => <option key={key} value={key}>{PAYMENT_LABELS[key]}</option>)}</select></label>
      </div>
      <label>Ghi chú (không bắt buộc)<textarea name="note" rows={2} maxLength={1000} /></label>
      <div className="order-summary"><span>Tạm tính</span><strong>{unitPrice === null ? "Shop sẽ liên hệ báo giá" : formatVnd(unitPrice * (Number(quantity) || 0))}</strong></div>
      <div className="order-summary"><span>Phí giao hàng</span><strong>{shipping.fee === null ? "Chưa xác định" : formatVnd(shipping.fee)}</strong></div>
      <div className="order-summary"><span>Tổng tiền</span><strong>{total === null ? "ORORA sẽ xác nhận" : formatVnd(total)}</strong></div>
      {shipping.reason && <p className="order-help">{shipping.reason}</p>}
      <p className="order-help">Chưa thu tiền tại bước đặt đơn. ORORA sẽ hướng dẫn thanh toán sau khi tiếp nhận.</p>
      <label className="order-consent"><input name="consent" type="checkbox" required /><span>Tôi đồng ý để ORORA liên hệ, gửi email xác nhận và xử lý đơn hàng theo thông tin đã cung cấp.</span></label>
      {!methods.length && <p role="status">Website đang tạm ngưng nhận đơn. Vui lòng liên hệ ORORA hoặc mua qua các kênh bên trên.</p>}
      <button className="website-order-submit" disabled={busy || (options.length > 0 && !variant) || !methods.length || !provinceCode || !wardCode || (home.shippingSettings?.enabled === true && shipping.fee === null)}>{busy ? "Đang lưu đơn…" : "Đặt hàng ngay"}</button>
    </fieldset>
    {result?.error && <p className="order-error" role="alert">{result.error}</p>}
  </form></ModalDialog>;
}
