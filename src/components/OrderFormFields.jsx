import {useState} from 'react';
import ProductPurchaseSelection from './ProductPurchaseSelection';
import AddressSelect from './AddressSelect';
import {PAYMENT_LABELS,formatVnd} from '../lib/commerce';
import {toCss} from '../lib/typography';
import {CHECKOUT_COPY} from '../lib/checkout-presentation';
import '../styles/checkout.css';

export default function OrderFormFields({product,items=null,subtotal,options,variantId,quantity,onVariantChange,onQuantityChange,addresses,provinceCode,wardCode,onProvinceChange,onWardChange,methods,unitPrice,shipping,total,appearance={},busy=false,error,onSubmit,preview=false}){
 const [addressError,setAddressError]=useState(false);
 const [variantError,setVariantError]=useState(false);
 const isMulti=Array.isArray(items)&&items.length>1;
 const copy={...CHECKOUT_COPY,...appearance.formLabels},headingStyle=toCss(appearance.formHeadingStyle);
 for (const key of ["recipientHeading","addressHeading","paymentHeading","summaryHeading"]) {
  if (typeof copy[key] !== "string" || !copy[key].trim()) copy[key]=CHECKOUT_COPY[key];
 }
 const effectiveSubtotal=subtotal!==undefined?subtotal:(unitPrice===null?null:unitPrice*(Number(quantity)||0));
 const itemTotal=effectiveSubtotal===null?'Shop liên hệ báo giá':formatVnd(effectiveSubtotal);
 const focusFirstMissing=form=>{
  if(!form)return;
  if(!isMulti&&options.length>0&&!variantId){
   const target=form.querySelector('.checkout-selection-fieldset button, .checkout-selection-fieldset input');
   target?.scrollIntoView?.({behavior:'smooth',block:'center'});
   target?.focus?.();
   return;
  }
  if(!provinceCode||!wardCode||shipping.blocked){
   const comboboxes=form.querySelectorAll('.order-address-row [role="combobox"]');
   const target=!provinceCode?comboboxes[0]:comboboxes[1]||comboboxes[0];
   target?.scrollIntoView?.({behavior:'smooth',block:'center'});
   target?.focus?.();
  }
 };
 return <form className="website-order checkout-form" aria-busy={busy} aria-label={copy.title?.trim()||CHECKOUT_COPY.title} style={toCss(appearance.formTextStyle)} onKeyDown={event=>{
  if(!preview&&event.key==="Enter"&&event.target.tagName==="INPUT"&&!(event.target.getAttribute("aria-expanded")==="true"&&event.target.getAttribute("aria-activedescendant"))){
   if(!isMulti&&options.length>0&&!variantId){event.preventDefault();setVariantError(true);focusFirstMissing(event.currentTarget);return;}
   if(!provinceCode||!wardCode||shipping.blocked){event.preventDefault();setAddressError(true);focusFirstMissing(event.currentTarget);}
  }
 }} onSubmit={event=>{
  if(preview){event.preventDefault();return;}
  if(!isMulti&&options.length>0&&!variantId){event.preventDefault();setVariantError(true);focusFirstMissing(event.currentTarget);return;}
  if(!provinceCode||!wardCode||shipping.blocked){event.preventDefault();setAddressError(true);focusFirstMissing(event.currentTarget);return;}
  setVariantError(false);
  setAddressError(false);
  onSubmit?.(event);
 }}>
  <div className="checkout-product-card">
   <div className="checkout-product-header">
    <div>
     <p className="order-product-name">{isMulti?`Giỏ hàng (${items.length} sản phẩm)`:product.name}</p>
     {copy.intro&&<p className="order-help">{copy.intro}</p>}
    </div>
    <strong className="checkout-item-price" aria-label="Giá sản phẩm">{itemTotal}</strong>
   </div>
   {isMulti ? (
    <ul className="checkout-items-list" aria-label="Danh sách sản phẩm đặt mua">
     {items.map((item,idx)=><li key={`${item.productId}:${item.variantId}:${idx}`}>
      <span>{item.name}{item.variantLabel?` (${item.variantLabel})`:''} <small>× {item.quantity}</small></span>
      <strong>{item.unitPrice===null?'Liên hệ':formatVnd(item.unitPrice*item.quantity)}</strong>
     </li>)}
    </ul>
   ) : (
    <>
     <fieldset className="checkout-selection-fieldset" disabled={busy||preview}>
      <ProductPurchaseSelection options={options} variantId={variantId} quantity={quantity} onVariantChange={next=>{setVariantError(false);onVariantChange(next);}} onQuantityChange={onQuantityChange} disabled={busy||preview} required/>
     </fieldset>
     {variantError&&options.length>0&&!variantId&&<p className="order-error" role="alert">Vui lòng chọn dung tích sản phẩm để tiếp tục.</p>}
    </>
   )}
  </div>
  <fieldset className="checkout-fields-stack" disabled={busy||preview}>
   <section className="checkout-section checkout-card"><h3 style={headingStyle}>{copy.recipientHeading}</h3>
    <div className="order-field-row"><label>Họ và tên<input name="name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Nguyễn Văn A"/></label><label>Số điện thoại<input name="phone" type="tel" required maxLength={25} autoComplete="tel" inputMode="tel" placeholder="09xx xxx xxx"/></label></div>
    <label>Email nhận xác nhận đơn<input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" placeholder="email@domain.com"/></label>
   </section>
   <section className="checkout-section checkout-card"><h3 style={headingStyle}>{copy.addressHeading}</h3>
    <div className="order-field-row order-address-row">
     <AddressSelect label="Tỉnh / Thành phố" name="provinceCode" required value={provinceCode} options={addresses.provinces} disabled={preview||!addresses.provinces.length} loading={addresses.loadingProvinces} placeholder="Chọn tỉnh/thành" onChange={code=>{setAddressError(false);onProvinceChange(code);}}/>
     <AddressSelect label="Phường / Xã" name="wardCode" required value={wardCode} options={addresses.wards} disabled={preview||!provinceCode||!addresses.wards.length} loading={addresses.loadingWards} placeholder="Chọn phường/xã" onChange={code=>{setAddressError(false);onWardChange(code);}}/>
    </div>
    {addresses.error&&<p className="order-error" role="alert">{addresses.error} <button type="button" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
    <label>Số nhà, tên đường<textarea name="addressDetail" rows={2} required minLength={5} maxLength={350} autoComplete="street-address" placeholder="Số nhà, tên đường, tòa nhà, hẻm…"/></label>
    {addressError&&(!provinceCode||!wardCode||shipping.blocked)&&<p className="order-error" role="alert">{!provinceCode||!wardCode?"Vui lòng chọn tỉnh/thành và phường/xã để tiếp tục.":shipping.reason||"Chưa tính được phí giao hàng cho địa chỉ này."}</p>}
    {shipping.reason&&!addressError&&<p className="order-help checkout-shipping-note">{shipping.reason}</p>}
   </section>
   <section className="checkout-section checkout-card"><h3 style={headingStyle}>{copy.paymentHeading}</h3>
    <label>Phương thức thanh toán<select aria-label="Phương thức thanh toán" name="paymentMethod" required defaultValue={methods[0]||''}>{methods.map(key=><option key={key} value={key}>{PAYMENT_LABELS[key]}</option>)}</select></label>
    <details className="checkout-note"><summary>{copy.noteLabel}</summary><label>Ghi chú (không bắt buộc)<textarea name="note" rows={2} maxLength={1000} placeholder="Lời nhắn giao hàng hoặc khung giờ nhận thuận tiện…"/></label></details>
   </section>
   <section className="checkout-summary" aria-label={copy.summaryHeading||'Thanh toán'}>
    <div className="order-summary"><span>Phí giao hàng</span><strong>{shipping.fee===null?'Theo khu vực giao':formatVnd(shipping.fee)}</strong></div>
    <div className="order-summary checkout-total"><span>Tổng thanh toán</span><strong>{total===null?(effectiveSubtotal===null?'ORORA sẽ xác nhận':`${itemTotal} (+ phí giao hàng)`):formatVnd(total)}</strong></div>
    <p className="order-help checkout-payment-hint">Chưa thu tiền tại bước đặt đơn. ORORA sẽ hướng dẫn thanh toán sau khi tiếp nhận.</p>
   </section>
   <label className="order-consent"><input name="consent" type="checkbox" required/><span>Tôi đồng ý để ORORA liên hệ, gửi email xác nhận và xử lý đơn hàng theo thông tin đã cung cấp.</span></label>
   {!methods.length&&<p role="status">Website đang tạm ngưng nhận đơn. Vui lòng liên hệ ORORA hoặc mua qua các kênh bên trên.</p>}
   {error&&<p className="order-error" role="alert">{error}</p>}
   <div className="checkout-sticky"><div className="checkout-submit"><button className="website-order-submit" aria-busy={busy} style={{...toCss(busy?appearance.loadingStyle:appearance.orderSubmitStyle),textDecoration:(busy?appearance.loadingStyle:appearance.orderSubmitStyle)?.textDecoration}} disabled={preview||busy||!methods.length}>{busy?appearance.orderBusyLabel?.trim()||'Đang gửi đơn hàng…':appearance.orderSubmitLabel?.trim()||'Đặt hàng ngay'}</button></div></div>
  </fieldset>
 </form>;
}
