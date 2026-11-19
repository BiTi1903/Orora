import OrderReceiptActions from './OrderReceiptActions';
import { toCss } from "../lib/typography";
import { Link } from "react-router-dom";
import OrderFormFields from "./OrderFormFields";
import {checkoutStyle,CHECKOUT_COPY} from "../lib/checkout-presentation";
import {defaultPurchaseVariant} from "../lib/purchase-defaults";
import { MAX_ORDER_QUANTITY, productVolumeOptions, selectedVolumeOption, volumePriceText } from "../lib/product-options";
import ModalDialog from "./ModalDialog";
import useAddressOptions from "../hooks/useAddressOptions";
import { shippingFeeFor } from "../lib/shipping";
import { useCallback, useMemo, useRef, useState } from "react";
import { availablePaymentMethods, PAYMENT_LABELS, parseVndPrice, formatVnd } from "../lib/commerce";

export default function OrderForm({ product, home, onClose, selection, initialVariantId = "", initialQuantity = 1, onSelectionChange }) {
  const options = useMemo(()=>productVolumeOptions(product),[product]);
  const [localSelection, setLocalSelection] = useState(() => ({ variantId: selectedVolumeOption(options,initialVariantId)?.id||defaultPurchaseVariant(product,options)?.id||"", quantity: Number.isInteger(initialQuantity) && initialQuantity >= 1 && initialQuantity <= MAX_ORDER_QUANTITY ? initialQuantity : 1 }));
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
  const changeProvince=useCallback(code=>{setProvinceCode(code);setWardCode("");},[setProvinceCode,setWardCode]);
  const [busy, setBusy] = useState(false);
  const submitting=useRef(false);
  const appearance=home.productDetailStyles?.purchaseOptions||{};
  const [result, setResult] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const methods = availablePaymentMethods(home);
  const unitPrice = parseVndPrice(priceText);
  const shipping = shippingFeeFor(home.shippingSettings, provinceCode, wardCode);
  const total = unitPrice === null || shipping.fee === null ? null : unitPrice * (Number(quantity) || 0) + shipping.fee;
  if (result?.code) return <ModalDialog key="success" title="Đã nhận đơn hàng" onClose={onClose} className="order-success-modal" style={{...checkoutStyle(appearance),'--receipt-size':`${Math.max(12,Math.min(16,Number(appearance.receiptFontSize)||13))}px`}}><section className="order-received" aria-label="Thông tin đơn đã nhận">
    <div className="order-received-banner">
      <span className="order-received-code-label">Mã đơn hàng</span>
      <strong className="order-received-code">{result.code}</strong>
      <p className="order-received-msg">{result.message}</p>
    </div>
    <OrderReceiptActions order={result} home={home} appearance={appearance}/>
    <div className="order-received-details checkout-card"><h3>Chi tiết đơn hàng</h3><dl>
      <div><dt>Sản phẩm</dt><dd>{result.productName}{result.variantLabel ? ` (${result.variantLabel})` : ""} × {result.quantity}</dd></div>
      <div><dt>Thanh toán</dt><dd>{PAYMENT_LABELS[result.paymentMethod] || result.paymentMethod}</dd></div>
      <div><dt>Tiền sản phẩm</dt><dd>{result.subtotal == null ? "ORORA sẽ báo giá khi xác nhận" : formatVnd(result.subtotal)}</dd></div>
      <div><dt>Phí giao hàng</dt><dd>{result.shippingFee == null ? "Xác nhận sau" : formatVnd(result.shippingFee)}</dd></div>
      <div className="order-received-total"><dt>Tổng thanh toán</dt><dd>{result.totalAmount == null ? "ORORA sẽ xác nhận tổng tiền" : formatVnd(result.totalAmount)}</dd></div>
    </dl></div>
    <details className="order-received-details checkout-card"><summary>Thông tin người nhận</summary><dl>
      {[["Họ và tên", result.recipient.name], ["Số điện thoại", result.recipient.phone], ["Email", result.recipient.email], ["Địa chỉ nhận hàng", result.recipient.address], ["Ghi chú", result.recipient.note]].filter(([, value]) => value).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl></details>
    <p className="order-help">{result.mailStatus === "accepted" ? "Vui lòng kiểm tra email xác nhận và mục thư rác." : result.mailStatus === "failed" ? "Đơn đã được nhận nhưng chưa gửi được email xác nhận. Bạn có thể liên hệ ORORA với mã đơn bên trên." : "ORORA sẽ gửi email xác nhận trong ít phút; nếu không thấy hãy kiểm tra thư rác hoặc tra cứu đơn."}</p>
    <div className="order-received-footer">
      <Link className="order-tracking-link" to="/tra-cuu-don-hang" state={{ code: result.code, phone: result.recipient.phone }} onClick={onClose}>Tra cứu trạng thái đơn</Link>
      <button type="button" onClick={onClose}>Đóng</button>
    </div>
  </section></ModalDialog>;
  return <ModalDialog key="form" title={appearance.formLabels?.title?.trim()||CHECKOUT_COPY.title} onClose={onClose} closeDisabled={busy} className="order-form-modal" style={{...checkoutStyle(appearance),background:appearance.formBackground,borderColor:appearance.formBorderColor}} headingStyle={toCss(appearance.formHeadingStyle)}><OrderFormFields product={product} options={options} variantId={variantId} quantity={quantity} onVariantChange={changeVariant} onQuantityChange={changeQuantity} addresses={addresses} provinceCode={provinceCode} wardCode={wardCode} onProvinceChange={changeProvince} onWardChange={setWardCode} methods={methods} unitPrice={unitPrice} shipping={{...shipping,blocked:home.shippingSettings?.enabled===true&&shipping.fee===null}} total={total} appearance={appearance} busy={busy} error={result?.error} onSubmit={async (event) => {
    event.preventDefault();
    if (submitting.current || busy || (options.length > 0 && !variant) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ORDER_QUANTITY || !methods.length || !provinceCode || !wardCode || (home.shippingSettings?.enabled === true && shipping.fee === null)) return;
    const data = new FormData(event.currentTarget);
    const recipient = Object.fromEntries(["name", "phone", "email", "address", "note"].map((key) => [key, String(data.get(key) || "").trim()]));
    const province = addresses.provinces.find((item) => item.code === provinceCode);
    const ward = addresses.wards.find((item) => item.code === wardCode);
    recipient.address = `${String(data.get("addressDetail") || "").trim()}, ${ward?.name || ""}, ${province?.name || ""}`;
    recipient.email = recipient.email.toLowerCase();
    recipient.phone = recipient.phone.replace(/[\s().-]/g, "");
    const orderedProduct = { productName: product.name, variantLabel: variant?.label || "", quantity };
    submitting.current=true;setBusy(true); setResult(null);
    const controller=new AbortController(),timeout=window.setTimeout(()=>controller.abort(),20_000);
    try {
      const response = await fetch("/api/orders", { signal:controller.signal, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        requestId: requestId.current, productId: product.id || product.slug, quantity, variantId, expectedVariantLabel: variant?.label || "", expectedPriceText: priceText,
        name: data.get("name"), phone: data.get("phone"), email: data.get("email"), provinceCode, wardCode, addressDetail: data.get("addressDetail"), expectedShippingFee: shipping.fee, note: data.get("note"),
        paymentMethod: data.get("paymentMethod"), consent: data.get("consent") === "on",
      }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Chưa gửi được đơn hàng.");
      if (!json.code) throw new Error("Chưa xác nhận được mã đơn. Vui lòng thử gửi lại.");
      window.dispatchEvent(new CustomEvent("orora-cart-remove", { detail: { id: product.id || product.slug, variantId } }));
      setResult({ ...orderedProduct, ...json, recipient });
    } catch (error) { setResult({ error: error.name === "AbortError" ? appearance.orderTimeoutLabel?.trim() || "Chưa nhận được phản hồi. Bạn có thể thử gửi lại với cùng thông tin hoặc tra cứu đơn hàng để kiểm tra." : error instanceof TypeError || error instanceof SyntaxError ? "Kết nối bị gián đoạn. Hãy thử gửi lại hoặc liên hệ ORORA." : error.message || "Chưa gửi được đơn. Vui lòng thử lại." }); }
    finally { window.clearTimeout(timeout);submitting.current=false;setBusy(false); }
  }}/></ModalDialog>;
}
