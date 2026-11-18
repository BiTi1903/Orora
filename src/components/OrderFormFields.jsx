import {useLayoutEffect,useRef,useState} from 'react';
import ProductPurchaseSelection from './ProductPurchaseSelection';
import AddressSelect from './AddressSelect';
import {PAYMENT_LABELS,formatVnd} from '../lib/commerce';
import {toCss} from '../lib/typography';
import {CHECKOUT_COPY} from '../lib/checkout-presentation';
import '../styles/checkout.css';

export default function OrderFormFields({product,options,variantId,quantity,onVariantChange,onQuantityChange,addresses,provinceCode,wardCode,onProvinceChange,onWardChange,methods,unitPrice,shipping,total,appearance={},busy=false,error,onSubmit,preview=false}){
 const [step,setStep]=useState(0);
 const [addressError,setAddressError]=useState(false);
 const formRef=useRef(null);
 const focusStep=useRef(false);
 useLayoutEffect(()=>{
  if(!focusStep.current)return;
  focusStep.current=false;
  formRef.current?.querySelector('[data-checkout-current]')?.focus({preventScroll:true});
 },[step]);
 const copy={...CHECKOUT_COPY,...appearance.formLabels},headingStyle=toCss(appearance.formHeadingStyle);
 for (const key of ["recipientHeading","addressHeading","confirmHeading","continueLabel","backLabel"]) {
  if (typeof copy[key] !== "string" || !copy[key].trim()) copy[key]=CHECKOUT_COPY[key];
 }
 const stepLabels=[copy.recipientHeading,copy.addressHeading,copy.confirmHeading];
 function goTo(next){
  focusStep.current=true;
  setStep(next);
 }
 function advance(){
  if(step===1&&(!provinceCode||!wardCode||shipping.blocked)){
   setAddressError(true);
   return;
  }
  const panel=formRef.current?.querySelector('[data-checkout-step]:not([hidden])');
  const invalid=[...panel.querySelectorAll('input, select, textarea')].find(field=>field.willValidate&&!field.validity.valid);
  if(invalid){invalid.reportValidity();return;}
  setAddressError(false);
  goTo(step+1);
 }
 const hidden=index=>!preview&&step!==index;
 return <form ref={formRef} className="website-order checkout-form" data-checkout-address={!preview&&step===1?"":undefined} aria-busy={busy} aria-label={copy.title?.trim()||CHECKOUT_COPY.title} style={toCss(appearance.formTextStyle)} onKeyDown={event=>{
  if(!preview&&step===1&&event.key==="Enter"&&event.target.tagName==="INPUT"&&!(event.target.getAttribute("aria-expanded")==="true"&&event.target.getAttribute("aria-activedescendant"))&&(!provinceCode||!wardCode||shipping.blocked)){event.preventDefault();advance();}
 }} onSubmit={event=>{
  if(!preview&&step===2&&onSubmit){onSubmit(event);return;}
  event.preventDefault();
  if(!preview)advance();
 }}>
  <div className="checkout-intro"><p className="order-product-name">{product.name}</p>{copy.intro&&<p className="order-help">{copy.intro}</p>}</div>
  {!preview&&<ol className="checkout-steps" aria-label="Các bước đặt hàng">{stepLabels.map((label,index)=><li key={index} aria-current={step===index?'step':undefined} data-checkout-current={step===index?'':undefined} tabIndex={step===index?-1:undefined}>{index+1}. {label}</li>)}</ol>}
  <fieldset disabled={busy||preview}>
   <div data-checkout-step hidden={hidden(0)}>
   <section className="checkout-section"><h3 style={headingStyle}>{copy.productHeading}</h3><ProductPurchaseSelection options={options} variantId={variantId} quantity={quantity} onVariantChange={onVariantChange} onQuantityChange={onQuantityChange} disabled={busy||preview} required/></section>
   <section className="checkout-section"><h3 style={headingStyle}>{copy.recipientHeading}</h3>
    <div className="order-field-row"><label>Họ và tên<input name="name" required minLength={2} maxLength={100} autoComplete="name"/></label><label>Số điện thoại<input name="phone" type="tel" required maxLength={25} autoComplete="tel" inputMode="tel"/></label></div>
    <label>Email nhận xác nhận đơn<input name="email" type="email" required maxLength={254} autoComplete="email" inputMode="email"/></label>
   </section>
   </div>
   <div data-checkout-step hidden={hidden(1)}>
   <section className="checkout-section"><h3 style={headingStyle}>{copy.addressHeading}</h3>
    <div className="order-field-row order-address-row">
     <AddressSelect label="Tỉnh / Thành phố" name="provinceCode" required value={provinceCode} options={addresses.provinces} disabled={preview||!addresses.provinces.length} loading={addresses.loadingProvinces} placeholder="Chọn tỉnh/thành" onChange={onProvinceChange}/>
     <AddressSelect label="Phường / Xã" name="wardCode" required value={wardCode} options={addresses.wards} disabled={preview||!provinceCode||!addresses.wards.length} loading={addresses.loadingWards} placeholder="Chọn phường/xã" onChange={onWardChange}/>
    </div>
    {addresses.error&&<p className="order-error" role="alert">{addresses.error} <button type="button" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
    <label>Số nhà, tên đường<textarea name="addressDetail" rows={2} required minLength={5} maxLength={350} autoComplete="street-address" placeholder="Số nhà, tên đường, tòa nhà…"/></label>
   </section>
   {addressError&&(!provinceCode||!wardCode||shipping.blocked)&&<p className="order-error" role="alert">{!provinceCode||!wardCode?"Vui lòng chọn tỉnh/thành và phường/xã để tiếp tục.":shipping.reason||"Chưa tính được phí giao hàng cho địa chỉ này."}</p>}
   {shipping.reason&&!addressError&&<p className="order-help">{shipping.reason}</p>}
   </div>
   <div data-checkout-step hidden={hidden(2)}>
   <section className="checkout-section"><h3 style={headingStyle}>{copy.paymentHeading}</h3>
    <label>Phương thức thanh toán<select aria-label="Phương thức thanh toán" name="paymentMethod" required defaultValue={methods[0]||''}>{methods.map(key=><option key={key} value={key}>{PAYMENT_LABELS[key]}</option>)}</select></label>
    <details className="checkout-note"><summary>{copy.noteLabel}</summary><label>Ghi chú (không bắt buộc)<textarea name="note" rows={2} maxLength={1000}/></label></details>
   </section>
   <p className="order-help">Chưa thu tiền tại bước đặt đơn. ORORA sẽ hướng dẫn thanh toán sau khi tiếp nhận.</p>
   <label className="order-consent"><input name="consent" type="checkbox" required/><span>Tôi đồng ý để ORORA liên hệ, gửi email xác nhận và xử lý đơn hàng theo thông tin đã cung cấp.</span></label>
   {!methods.length&&<p role="status">Website đang tạm ngưng nhận đơn. Vui lòng liên hệ ORORA hoặc mua qua các kênh bên trên.</p>}
   {error&&<p className="order-error" role="alert">{error}</p>}
   </div>
   <div className="checkout-sticky">
   <section className="checkout-summary"><h3 style={headingStyle}>{copy.summaryHeading}</h3>
    <div className="order-summary"><span>Tạm tính</span><strong>{unitPrice===null?'Shop sẽ liên hệ báo giá':formatVnd(unitPrice*(Number(quantity)||0))}</strong></div>
    <div className="order-summary"><span>Phí giao hàng</span><strong>{shipping.fee===null?'Chưa xác định':formatVnd(shipping.fee)}</strong></div>
    <div className="order-summary checkout-total"><span>Tổng tiền</span><strong>{total===null?'ORORA sẽ xác nhận':formatVnd(total)}</strong></div>
   </section>
    <div className="checkout-submit">
      {!preview&&step>0&&<button type="button" className="checkout-step-back" onClick={()=>goTo(step-1)}>{copy.backLabel}</button>}
      {!preview&&step<2
        ? <button type="button" className="website-order-submit" disabled={step===1&&(!provinceCode||!wardCode||shipping.blocked)} onClick={advance}>{copy.continueLabel}</button>
        : <button className="website-order-submit" aria-busy={busy} style={{...toCss(busy?appearance.loadingStyle:appearance.orderSubmitStyle),textDecoration:(busy?appearance.loadingStyle:appearance.orderSubmitStyle)?.textDecoration}} disabled={preview||busy||(options.length>0&&!variantId)||!methods.length||!provinceCode||!wardCode||shipping.blocked}>{busy?appearance.orderBusyLabel?.trim()||'Đang gửi đơn hàng…':appearance.orderSubmitLabel?.trim()||'Đặt hàng ngay'}</button>}
    </div>
   </div>
  </fieldset>
 </form>;
}
