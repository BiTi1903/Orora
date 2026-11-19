import {useState} from 'react';
import ProductPurchaseSelection from './ProductPurchaseSelection';
import AddressSelect from './AddressSelect';
import {PAYMENT_LABELS,formatVnd} from '../lib/commerce';
import {toCss} from '../lib/typography';
import {CHECKOUT_COPY,checkoutSubmitStyle} from '../lib/checkout-presentation';
import '../styles/checkout.css';

export default function OrderFormFields({product,items=null,subtotal,options,variantId,quantity,onVariantChange,onQuantityChange,addresses,provinceCode,wardCode,onProvinceChange,onWardChange,methods,unitPrice,shipping,total,appearance={},busy=false,error,onSubmit,preview=false,selectedElement,onSelect}){
 const [addressError,setAddressError]=useState(false);
 const [variantError,setVariantError]=useState(false);
 const isMulti=Array.isArray(items)&&items.length>1;
 const copy={...CHECKOUT_COPY,...appearance.formLabels};
 for (const key of ['recipientHeading','addressHeading','paymentHeading','summaryHeading']) {
  if (typeof copy[key] !== 'string' || !copy[key].trim()) copy[key]=CHECKOUT_COPY[key];
 }
 const label=(key)=>typeof copy[key]==='string'&&copy[key].trim()?copy[key]:CHECKOUT_COPY[key];
 const headingStyle=toCss(appearance.formHeadingStyle,{responsive:true});
 const productNameStyle=toCss(appearance.productNameStyle,{responsive:true});
 const pricePillStyle=toCss(appearance.pricePillStyle,{responsive:true});
 const helpTextStyle=toCss(appearance.helpTextStyle,{responsive:true});
 const summaryTotalStyle=toCss(appearance.summaryTotalStyle,{responsive:true});
 const pick=(key,event)=>{if(!preview||!onSelect)return;event?.stopPropagation?.();onSelect(key);};
 const mark=(key,base='')=>preview&&onSelect?{'data-builder-key':key,className:`${base}${selectedElement===key?' builder-selected':''}`.trim(),onClick:event=>pick(key,event)}:{className:base||undefined};
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
 return <form className="website-order checkout-form" aria-busy={busy} aria-label={copy.title?.trim()||CHECKOUT_COPY.title} style={toCss(appearance.formTextStyle,{responsive:true})} onKeyDown={event=>{
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
  <div {...mark('ofProduct','checkout-product-card')}>
   <div className="checkout-product-header">
    <div>
     <p className="order-product-name" style={productNameStyle}>{isMulti?`Giỏ hàng (${items.length} sản phẩm)`:product.name}</p>
     {copy.intro&&<p className="order-help" style={helpTextStyle}>{copy.intro}</p>}
    </div>
    <strong className="checkout-item-price" style={pricePillStyle} aria-label="Giá sản phẩm">{itemTotal}</strong>
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
      <ProductPurchaseSelection options={options} variantId={variantId} quantity={quantity} labels={{volume:label('volumeLabel'),quantity:label('quantityLabel')}} onVariantChange={next=>{setVariantError(false);onVariantChange(next);}} onQuantityChange={onQuantityChange} disabled={busy||preview} required/>
     </fieldset>
     {variantError&&options.length>0&&!variantId&&<p className="order-error" role="alert">Vui lòng chọn dung tích sản phẩm để tiếp tục.</p>}
    </>
   )}
  </div>
  <fieldset className="checkout-fields-stack" disabled={busy||(preview&&!onSelect)}>
   <section {...mark('ofRecipient','checkout-section checkout-card')}><h3 style={headingStyle}>{copy.recipientHeading}</h3>
    <div className="order-field-row"><label>{label('nameLabel')}<input name="name" required minLength={2} maxLength={100} autoComplete="name" readOnly={preview} tabIndex={preview?-1:undefined} placeholder={label('namePlaceholder')}/></label><label>{label('phoneLabel')}<input name="phone" type="tel" required maxLength={25} autoComplete="tel" inputMode="tel" readOnly={preview} tabIndex={preview?-1:undefined} placeholder={label('phonePlaceholder')}/></label></div>
    <label>{label('emailLabel')}<input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email" readOnly={preview} tabIndex={preview?-1:undefined} placeholder={label('emailPlaceholder')}/></label>
   </section>
   <section {...mark('ofAddress','checkout-section checkout-card')}><h3 style={headingStyle}>{copy.addressHeading}</h3>
    <div className="order-field-row order-address-row">
     <AddressSelect label={label('provinceLabel')} name="provinceCode" required value={provinceCode} options={addresses.provinces} disabled={preview||!addresses.provinces.length} loading={addresses.loadingProvinces} placeholder={label('provincePlaceholder')} onChange={code=>{setAddressError(false);onProvinceChange(code);}}/>
     <AddressSelect label={label('wardLabel')} name="wardCode" required value={wardCode} options={addresses.wards} disabled={preview||!provinceCode||!addresses.wards.length} loading={addresses.loadingWards} placeholder={label('wardPlaceholder')} onChange={code=>{setAddressError(false);onWardChange(code);}}/>
    </div>
    {addresses.error&&<p className="order-error" role="alert">{addresses.error} <button type="button" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
    <label>{label('addressDetailLabel')}<textarea name="addressDetail" rows={2} required minLength={5} maxLength={350} autoComplete="street-address" readOnly={preview} tabIndex={preview?-1:undefined} placeholder={label('addressDetailPlaceholder')}/></label>
    {addressError&&(!provinceCode||!wardCode||shipping.blocked)&&<p className="order-error" role="alert">{!provinceCode||!wardCode?"Vui lòng chọn tỉnh/thành và phường/xã để tiếp tục.":shipping.reason||"Chưa tính được phí giao hàng cho địa chỉ này."}</p>}
    {(shipping.reason||(preview&&label('addressHint')))&&!addressError&&<p className="order-help checkout-shipping-note" style={helpTextStyle}>{shipping.reason||label('addressHint')}</p>}
   </section>
   <section {...mark('ofPayment','checkout-section checkout-card')}><h3 style={headingStyle}>{copy.paymentHeading}</h3>
    <label>{label('paymentMethodLabel')}<select aria-label={label('paymentMethodLabel')} name="paymentMethod" required defaultValue={methods[0]||''} tabIndex={preview?-1:undefined}>{methods.map(key=><option key={key} value={key}>{PAYMENT_LABELS[key]}</option>)}</select></label>
    <details className="checkout-note"><summary>{copy.noteLabel}</summary><label>{label('noteFieldLabel')}<textarea name="note" rows={2} maxLength={1000} readOnly={preview} tabIndex={preview?-1:undefined} placeholder={label('notePlaceholder')}/></label></details>
   </section>
   <section {...mark('ofSummary','checkout-summary')} aria-label={copy.summaryHeading||'Thanh toán'}>
    <div className="order-summary"><span>{label('shippingFeeLabel')}</span><strong>{shipping.fee===null?'Theo khu vực giao':formatVnd(shipping.fee)}</strong></div>
    <div className="order-summary checkout-total"><span>{label('totalLabel')}</span><strong style={summaryTotalStyle}>{total===null?(effectiveSubtotal===null?'ORORA sẽ xác nhận':`${itemTotal} (+ phí giao hàng)`):formatVnd(total)}</strong></div>
    <p className="order-help checkout-payment-hint" style={helpTextStyle}>{label('paymentHint')}</p>
   </section>
   <label className="order-consent" onClick={preview&&onSelect?event=>{event.preventDefault();pick('ofSummary',event);}:undefined}><input name="consent" type="checkbox" required tabIndex={preview?-1:undefined}/><span>{label('consentText')}</span></label>
   {!methods.length&&<p role="status">Website đang tạm ngưng nhận đơn. Vui lòng liên hệ ORORA hoặc mua qua các kênh bên trên.</p>}
   {error&&<p className="order-error" role="alert">{error}</p>}
   <div {...mark('ofSubmit','checkout-sticky')}><div className="checkout-submit"><button type={preview?'button':'submit'} className="website-order-submit" aria-busy={busy} style={checkoutSubmitStyle(appearance,busy)} disabled={(preview&&!onSelect)||busy||!methods.length} onClick={preview&&onSelect?event=>{event.preventDefault();pick('ofSubmit',event);}:undefined}>{busy?appearance.orderBusyLabel?.trim()||'Đang gửi đơn hàng…':appearance.orderSubmitLabel?.trim()||'Đặt hàng ngay'}</button></div></div>
  </fieldset>
 </form>;
}
