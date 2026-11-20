import {Link} from 'react-router-dom';
import OrderReceiptActions from './OrderReceiptActions';
import {PAYMENT_LABELS,formatVnd} from '../lib/commerce';
import {CHECKOUT_RECEIPT_COPY,receiptModalStyle} from '../lib/checkout-presentation';
import {toCss} from '../lib/typography';
import '../styles/checkout.css';

const SAMPLE_ORDER={
 code:'OR-20261119-01',
 message:'Cảm ơn bạn đã đặt hàng tại ORORA. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất.',
 productName:'Deodorant Mist - Bodyplex',
 variantLabel:'220ml',
 quantity:1,
 items:[
  {id:'sample-1',name:'Deodorant Mist - Bodyplex',variantLabel:'220ml',quantity:1},
  {id:'sample-2',name:'White Gel - Bodyplex',variantLabel:'',quantity:1},
 ],
 paymentMethod:'cod',
 subtotal:1009000,
 shippingFee:25000,
 totalAmount:1034000,
 mailStatus:'accepted',
 recipient:{
  name:'Nguyễn Minh Anh',
  phone:'0901234567',
  email:'minhanh@example.com',
  address:'123 Nguyễn Huệ, Phường Bến Nghé, TP. Hồ Chí Minh',
  note:'Giao giờ hành chính giúp mình nhé.',
 },
};

export function OrderSuccessContent({order,home={},appearance={},onClose,preview=false,selectedElement,onSelect}){
 const copy={...CHECKOUT_RECEIPT_COPY};
 const text=(key)=>appearance[key]?.trim()||copy[key];
 const pick=(key,event)=>{if(!preview)return;event?.stopPropagation?.();onSelect?.(key);};
 const mark=(key,base='')=>preview?{'data-builder-key':key,className:`${base}${selectedElement===key?' builder-selected':''}`.trim(),onClick:event=>pick(key,event)}:{className:base||undefined};
 const codeStyle=toCss(appearance.receiptCodeStyle,{responsive:true});
 const messageStyle=toCss(appearance.receiptMessageStyle,{responsive:true});
 const cardHeadingStyle=toCss(appearance.receiptCardHeadingStyle,{responsive:true});
 const totalStyle=toCss(appearance.receiptTotalStyle,{responsive:true});
 const trackingStyle=toCss(appearance.receiptTrackingStyle,{responsive:true});
 const closeStyle=toCss(appearance.receiptCloseStyle,{responsive:true});
 const displayMessage=appearance.receiptMessage?.trim()||order.message||SAMPLE_ORDER.message;
 const mailNote=appearance.receiptEmailNote?.trim()
  ||(order.mailStatus==='accepted'
   ?'Vui lòng kiểm tra email xác nhận và mục thư rác.'
   :order.mailStatus==='failed'
    ?'Đơn đã được nhận nhưng chưa gửi được email xác nhận. Bạn có thể liên hệ ORORA với mã đơn bên trên.'
    :copy.receiptEmailNote);

 return (
  <section className="order-received" aria-label="Thông tin đơn đã nhận">
   <div {...mark('osBanner','order-received-banner')}>
    <span className="order-received-code-label">{text('receiptCodeLabel')}</span>
    <strong className="order-received-code" style={codeStyle}>{order.code}</strong>
    <p className="order-received-msg" style={messageStyle}>{displayMessage}</p>
   </div>
   <div {...mark('osActions')}>
    <OrderReceiptActions order={order} home={home} appearance={appearance} preview={preview}/>
   </div>
   <div {...mark('osDetails','order-received-details checkout-card')}>
    <h3 style={cardHeadingStyle}>{text('receiptDetailsHeading')}</h3>
    <dl>
     {Array.isArray(order.items)&&order.items.length>1
      ?<div className="order-received-items-row"><dt>{text('receiptProductLabel')} ({order.items.length})</dt><dd><ul className="order-received-items">{order.items.map((item,idx)=><li key={`${item.id||item.productId||idx}:${item.variantId||''}`}>{item.name}{item.variantLabel?` (${item.variantLabel})`:''} × {item.quantity}</li>)}</ul></dd></div>
      :<div><dt>{text('receiptProductLabel')}</dt><dd>{order.productName}{order.variantLabel?` (${order.variantLabel})`:''} × {order.quantity}</dd></div>}
     <div><dt>{text('receiptPaymentLabel')}</dt><dd>{PAYMENT_LABELS[order.paymentMethod]||order.paymentMethod}</dd></div>
     <div><dt>{text('receiptSubtotalLabel')}</dt><dd>{order.subtotal==null?'ORORA sẽ báo giá khi xác nhận':formatVnd(order.subtotal)}</dd></div>
     <div><dt>{text('receiptShippingLabel')}</dt><dd>{order.shippingFee==null?'Xác nhận sau':formatVnd(order.shippingFee)}</dd></div>
     <div className="order-received-total" style={totalStyle}><dt>{text('receiptTotalLabel')}</dt><dd>{order.totalAmount==null?'ORORA sẽ xác nhận tổng tiền':formatVnd(order.totalAmount)}</dd></div>
    </dl>
   </div>
   <details className="order-received-details checkout-card" open onClick={preview?event=>pick('osDetails',event):undefined}>
    <summary style={cardHeadingStyle}>{text('receiptRecipientHeading')}</summary>
    <dl>
     {[['Họ và tên',order.recipient.name],['Số điện thoại',order.recipient.phone],['Email',order.recipient.email],['Địa chỉ nhận hàng',order.recipient.address],['Ghi chú',order.recipient.note]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
   </details>
   {(order.paymentMethod==='bank_transfer'||(preview&&(appearance.bankName||appearance.bankAccountNumber||appearance.bankAccountName)))&&(
    <div {...mark('osDetails','order-received-details checkout-card')}>
     <h3 style={cardHeadingStyle}>{text('bankHeading')}</h3>
     {appearance.bankName||appearance.bankAccountNumber||appearance.bankAccountName?(
      <dl>
       {appearance.bankName&&<div><dt>Ngân hàng</dt><dd>{appearance.bankName}</dd></div>}
       {appearance.bankAccountNumber&&<div><dt>Số tài khoản</dt><dd>{appearance.bankAccountNumber}</dd></div>}
       {appearance.bankAccountName&&<div><dt>Chủ tài khoản</dt><dd>{appearance.bankAccountName}</dd></div>}
       <div><dt>Nội dung chuyển khoản</dt><dd>{(appearance.bankTransferNote||copy.bankTransferNote).replace(/\{\{code\}\}/g,order.code)}</dd></div>
      </dl>
     ):(
      <p className="order-help">ORORA sẽ gửi thông tin tài khoản ngân hàng ngay khi xác nhận đơn hàng của bạn. Nội dung chuyển khoản: <strong>{order.code}</strong>.</p>
     )}
    </div>
   )}
   {text('receiptNextStepsBody')&&(
    <div {...mark('osFooter','order-received-details checkout-card')}>
     <h3 style={cardHeadingStyle}>{text('receiptNextStepsHeading')}</h3>
     <p className="order-help">{text('receiptNextStepsBody')}</p>
    </div>
   )}
   <p className="order-help" {...mark('osFooter','order-help')}>{mailNote}</p>
   <div {...mark('osFooter','order-received-footer')}>
    {preview
     ?<a className="order-tracking-link" href="#tra-cuu-don-hang" style={trackingStyle} onClick={event=>{event.preventDefault();pick('osFooter',event);}}>{text('receiptTrackingLabel')}</a>
     :<Link className="order-tracking-link" to="/tra-cuu-don-hang" state={{code:order.code,phone:order.recipient.phone}} style={trackingStyle} onClick={onClose}>{text('receiptTrackingLabel')}</Link>}
    <button type="button" style={closeStyle} onClick={preview?event=>{event.preventDefault();pick('osFooter',event);}:onClose}>{text('receiptCloseLabel')}</button>
   </div>
  </section>
 );
}

export default function OrderSuccessPreview({appearance={},selectedElement,onSelect}){
 const title=appearance.receiptTitle?.trim()||CHECKOUT_RECEIPT_COPY.receiptTitle;
 const pick=(key,event)=>{event?.stopPropagation?.();onSelect?.(key);};
 return (
  <section
   aria-label="Xem trước Form đã đặt hàng"
   data-builder-key="osFrame"
   className={`orora-modal order-success-modal is-preview${selectedElement==='osFrame'?' builder-selected':''}`}
   style={receiptModalStyle(appearance)}
   onClick={event=>pick('osFrame',event)}
  >
   <div
    data-builder-key="osHeader"
    className={`orora-modal-heading${selectedElement==='osHeader'?' builder-selected':''}`}
    onClick={event=>pick('osHeader',event)}
   >
    <h2 style={toCss(appearance.receiptTitleStyle,{responsive:true})}>{title}</h2>
    <button type="button" aria-label="Đóng cửa sổ" onClick={event=>{event.preventDefault();pick('osHeader',event);}}>×</button>
   </div>
   <div className="orora-modal-content">
    <OrderSuccessContent
     preview
     order={SAMPLE_ORDER}
     home={{footerPhone:'0900000000',footerFacebook:'https://www.facebook.com/orora'}}
     appearance={appearance}
     selectedElement={selectedElement}
     onSelect={onSelect}
    />
   </div>
  </section>
 );
}
