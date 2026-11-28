import { OrderSuccessContent } from './OrderSuccessView';
import { toCss } from "../lib/typography";
import OrderFormFields from "./OrderFormFields";
import {checkoutStyle,CHECKOUT_COPY,CHECKOUT_RECEIPT_COPY,receiptModalStyle} from "../lib/checkout-presentation";
import {defaultPurchaseVariant} from "../lib/purchase-defaults";
import { MAX_ORDER_QUANTITY, productVolumeOptions, selectedVolumeOption, volumePriceText } from "../lib/product-options";
import ModalDialog from "./ModalDialog";
import useAddressOptions from "../hooks/useAddressOptions";
import { shippingFeeFor } from "../lib/shipping";
import { useCallback, useMemo, useRef, useState } from "react";
import { availablePaymentMethods, parseVndPrice } from "../lib/commerce";
import { useLocale, translatePhrase } from "../lib/i18n";

export default function OrderForm({ product, cartItems, home, onClose, selection, initialVariantId = "", initialQuantity = 1, onSelectionChange, fromCart = false, motionSource }) {
  const [closing, setClosing] = useState(false);
  const dirty = useRef(false);
  const requestClose = useCallback(() => {
    if (dirty.current && !window.confirm("Bỏ thông tin đặt hàng vừa nhập?")) return;
    dirty.current = false;
    if (!motionSource || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onClose?.();
    } else {
      setClosing(true);
    }
  }, [motionSource, onClose]);
  const isMulti = Array.isArray(cartItems) && cartItems.length > 1;
  const activeProduct = product || cartItems?.[0]?.product;
  const startVariantId = initialVariantId || (!isMulti && cartItems?.[0]?.variantId) || "";
  const startQuantity = !isMulti && cartItems?.[0]?.quantity ? cartItems[0].quantity : initialQuantity;
  const options = useMemo(() => (activeProduct ? productVolumeOptions(activeProduct) : []), [activeProduct]);
  const [localSelection, setLocalSelection] = useState(() => ({ variantId: selectedVolumeOption(options, startVariantId)?.id || defaultPurchaseVariant(activeProduct, options)?.id || "", quantity: Number.isInteger(startQuantity) && startQuantity >= 1 && startQuantity <= MAX_ORDER_QUANTITY ? startQuantity : 1 }));
  const currentSelection = selection || localSelection;
  const variant = selectedVolumeOption(options, currentSelection.variantId);
  const variantId = variant?.id || "";
  const quantity = currentSelection.quantity;
  const updateSelection = (patch) => {
    if (!selection) setLocalSelection((previous) => ({ ...previous, ...patch }));
    onSelectionChange?.(patch);
  };
  const changeVariant = (nextVariantId) => updateSelection({ variantId: nextVariantId });
  const changeQuantity = (nextQuantity) => updateSelection({ quantity: nextQuantity });
  const priceText = activeProduct ? volumePriceText(activeProduct, variant) : "";
  const normalizedItems = useMemo(() => {
    if (!isMulti) return null;
    return cartItems.map((entry) => {
      const p = entry.product;
      const opts = productVolumeOptions(p);
      const opt = selectedVolumeOption(opts, entry.variantId);
      const pText = volumePriceText(p, opt);
      return {
        productId: p.id || p.slug,
        name: p.name,
        variantId: opt?.id || "",
        variantLabel: opt?.label || "",
        priceText: pText,
        unitPrice: parseVndPrice(pText),
        quantity: entry.quantity,
      };
    });
  }, [isMulti, cartItems]);
  const [provinceCode, setProvinceCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const addresses = useAddressOptions(provinceCode);
  const changeProvince = useCallback((code) => { setProvinceCode(code); setWardCode(""); }, [setProvinceCode, setWardCode]);
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const appearance = useMemo(() => home.productDetailStyles?.purchaseOptions || {}, [home.productDetailStyles?.purchaseOptions]);
  const [result, setResult] = useState(null);
  const requestId = useRef(crypto.randomUUID());
  const methods = useMemo(() => availablePaymentMethods(home), [home]);
  const unitPrice = isMulti ? null : parseVndPrice(priceText);
  const subtotal = isMulti
    ? (normalizedItems.some((item) => item.unitPrice === null) ? null : normalizedItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))
    : (unitPrice === null ? null : unitPrice * (Number(quantity) || 0));
  const shipping = useMemo(() => shippingFeeFor(home.shippingSettings, provinceCode, wardCode,subtotal), [home.shippingSettings, provinceCode, wardCode,subtotal]);
  const shippingProp = useMemo(() => ({ ...shipping, blocked: home.shippingSettings?.enabled === true && shipping.fee === null }), [shipping, home.shippingSettings?.enabled]);
  const [code,setCode] = useState('');
  const [quote,setQuote] = useState(null);
  const [promoMessage,setPromoMessage] = useState('');
  const [checking,setChecking] = useState(false);
  const applied = quote?.subtotal === subtotal && quote.code === code.trim().toUpperCase() ? quote : null;
  async function applyCode(){
    setChecking(true);setPromoMessage('');setQuote(null);
    try {
      const response=await fetch('/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'quotePromotion',code,subtotal})});
      const data=await response.json();
      if(!response.ok) throw new Error(data.message);
      setQuote({...data,subtotal});
    } catch(error){setPromoMessage(error.message || 'Chưa kiểm tra được mã.');} finally{setChecking(false);}
  }
  const total = subtotal === null || shipping.fee === null ? null : subtotal - (applied?.discount || 0) + shipping.fee;
  const locale = useLocale();
  const tr = (val) => (locale !== "vi" ? translatePhrase(val, locale) : val);
  const modalStyle = useMemo(() => ({ ...checkoutStyle(appearance), background: appearance.formBackground, borderColor: appearance.formBorderColor }), [appearance]);
  const titleStyle = useMemo(() => toCss(appearance.formTitleStyle || appearance.formHeadingStyle, { responsive: true }), [appearance]);
  if (result?.code) return <ModalDialog key="success" title={tr(appearance.receiptTitle?.trim() || CHECKOUT_RECEIPT_COPY.receiptTitle)} motionSource={motionSource} motionDuration={240} motionClosing={closing} onMotionClosed={onClose} onClose={requestClose} className="order-success-modal" style={receiptModalStyle(appearance)} headingStyle={toCss(appearance.receiptTitleStyle, { responsive: true })}><OrderSuccessContent order={result} home={home} appearance={appearance} onClose={requestClose} /></ModalDialog>;
  if (!activeProduct) return null;
  return <ModalDialog key="form" title={tr(appearance.formLabels?.title?.trim() || CHECKOUT_COPY.title)} motionSource={motionSource} motionDuration={240} motionClosing={closing} onMotionClosed={onClose} onClose={requestClose} closeDisabled={busy} className="order-form-modal" style={modalStyle} headingStyle={titleStyle}><OrderFormFields promo={{code,change:value=>{setCode(value);setQuote(null);setPromoMessage('');},apply:applyCode,checking,message:promoMessage,applied}} onEdit={()=>{dirty.current=true;}} product={activeProduct} items={normalizedItems} subtotal={subtotal} options={isMulti ? [] : options} variantId={variantId} quantity={quantity} onVariantChange={changeVariant} onQuantityChange={changeQuantity} addresses={addresses} provinceCode={provinceCode} wardCode={wardCode} onProvinceChange={changeProvince} onWardChange={setWardCode} methods={methods} unitPrice={unitPrice} shipping={shippingProp} total={total} appearance={appearance} busy={busy} error={result?.error} onSubmit={async (event) => {
    event.preventDefault();
    if (submitting.current || busy || !methods.length || !provinceCode || !wardCode || (home.shippingSettings?.enabled === true && shipping.fee === null)) return;
    if (!isMulti && ((options.length > 0 && !variant) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ORDER_QUANTITY)) return;
    const data = new FormData(event.currentTarget);
    const recipient = Object.fromEntries(["name", "phone", "email", "address", "note"].map((key) => [key, String(data.get(key) || "").trim()]));
    const province = addresses.provinces.find((item) => item.code === provinceCode);
    const ward = addresses.wards.find((item) => item.code === wardCode);
    recipient.address = `${String(data.get("addressDetail") || "").trim()}, ${ward?.name || ""}, ${province?.name || ""}`;
    recipient.email = recipient.email.toLowerCase();
    recipient.phone = recipient.phone.replace(/[\s().-]/g, "");
    const orderedProduct = isMulti
      ? { productName: `${normalizedItems[0].name} (+${normalizedItems.length - 1} sản phẩm khác)`, variantLabel: "", quantity: normalizedItems.reduce((sum, i) => sum + i.quantity, 0), items: normalizedItems }
      : { productName: activeProduct.name, variantLabel: variant?.label || "", quantity };
    const payload = isMulti
      ? {
        requestId: requestId.current,
        items: normalizedItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          variantId: item.variantId,
          expectedVariantLabel: item.variantLabel,
          expectedPriceText: item.priceText,
        })),
        name: data.get("name"), phone: data.get("phone"), email: data.get("email"), provinceCode, wardCode, addressDetail: data.get("addressDetail"), expectedShippingFee: shipping.fee, note: data.get("note"),
        paymentMethod: data.get("paymentMethod"), consent: data.get("consent") === "on",
      }
      : {
        requestId: requestId.current, productId: activeProduct.id || activeProduct.slug, quantity, variantId, expectedVariantLabel: variant?.label || "", expectedPriceText: priceText,
        name: data.get("name"), phone: data.get("phone"), email: data.get("email"), provinceCode, wardCode, addressDetail: data.get("addressDetail"), expectedShippingFee: shipping.fee, note: data.get("note"),
        paymentMethod: data.get("paymentMethod"), consent: data.get("consent") === "on",
      };
    if (code.trim() && !applied) {setPromoMessage('Hãy áp dụng mã hoặc xóa mã trước khi đặt hàng.');return;}
    if (applied) Object.assign(payload,{promotionCode:applied.code,expectedDiscount:applied.discount});
    submitting.current = true; setBusy(true); setResult(null);
    const controller = new AbortController(), timeout = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch("/api/orders", { signal: controller.signal, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || "Chưa gửi được đơn hàng.");
      if (!json.code) throw new Error("Chưa xác nhận được mã đơn. Vui lòng thử gửi lại.");
      if (fromCart) {
        if (isMulti) {
          for (const item of normalizedItems) {
            window.dispatchEvent(new CustomEvent("orora-cart-remove", { detail: { id: item.productId, variantId: item.variantId, quantity: item.quantity } }));
          }
        } else {
          window.dispatchEvent(new CustomEvent("orora-cart-remove", { detail: { id: activeProduct.id || activeProduct.slug, variantId: startVariantId || variantId, quantity } }));
        }
      }
      dirty.current=false;
      setResult({ ...orderedProduct, ...json, recipient });
    } catch (error) { setResult({ error: error.name === "AbortError" ? appearance.orderTimeoutLabel?.trim() || "Chưa nhận được phản hồi. Bạn có thể thử gửi lại với cùng thông tin hoặc tra cứu đơn hàng để kiểm tra." : error instanceof TypeError || error instanceof SyntaxError ? "Kết nối bị gián đoạn. Hãy thử gửi lại hoặc liên hệ ORORA." : error.message || "Chưa gửi được đơn. Vui lòng thử lại." }); }
    finally { window.clearTimeout(timeout); submitting.current = false; setBusy(false); }
  }} /></ModalDialog>;
}
