import {useState} from 'react';
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
 paymentMethod:'bank_transfer',
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
 const [copiedKey,setCopiedKey]=useState('');
 const copyValue=(key,val)=>{
  if(preview||!val)return;
  navigator.clipboard?.writeText(String(val)).then(()=>{
   setCopiedKey(key);
   window.setTimeout(()=>setCopiedKey(cur=>cur===key?'':cur),2200);
  }).catch(()=>{});
 };
 const copy={...CHECKOUT_RECEIPT_COPY};
 const text=(key)=>appearance[key]?.trim()||copy[key];
 const pick=(key,event)=>{if(!preview)return;event?.stopPropagation?.();onSelect?.(key);};
 const mark=(key,base='')=>preview?{'data-builder-key':key,className:`${base}${selectedElement===key?' builder-selected':''}`.trim()||undefined,onClick:event=>{event.preventDefault();pick(key,event);}}:{className:base||undefined};
 const textStyle=toCss(appearance.receiptTextStyle,{responsive:true});
 const codeLabelStyle=toCss(appearance.receiptCodeLabelStyle,{responsive:true});
 const codeStyle=toCss(appearance.receiptCodeStyle,{responsive:true});
 const messageStyle=toCss(appearance.receiptMessageStyle,{responsive:true});
 const cardHeadingStyle=toCss(appearance.receiptCardHeadingStyle,{responsive:true});
 const bodyStyle=toCss(appearance.receiptBodyStyle,{responsive:true});
 const recipientBodyStyle=toCss(appearance.receiptRecipientStyle||appearance.receiptBodyStyle,{responsive:true});
 const bankTextStyle=toCss(appearance.receiptBankTextStyle,{responsive:true});
 const nextStepsStyle=toCss(appearance.receiptNextStepsStyle,{responsive:true});
 const emailNoteStyle=toCss(appearance.receiptEmailNoteStyle,{responsive:true});
 const totalStyle=toCss(appearance.receiptTotalStyle,{responsive:true});
 const trackingStyle=toCss(appearance.receiptTrackingStyle,{responsive:true});
 const closeStyle=toCss(appearance.receiptCloseStyle,{responsive:true});
 const displayMessage=appearance.receiptMessage?.trim()||order.message||SAMPLE_ORDER.message;
 const transferNote=(appearance.bankTransferNote||copy.bankTransferNote).replace(/\{\{code\}\}/g,order.code);
 const mailNote=appearance.receiptEmailNote?.trim()
  ||(order.mailStatus==='accepted'
   ?'Vui lòng kiểm tra email xác nhận và mục thư rác.'
   :order.mailStatus==='failed'
    ?'Đơn đã được nhận nhưng chưa gửi được email xác nhận. Bạn có thể liên hệ ORORA với mã đơn bên trên.'
    :copy.receiptEmailNote);

 return (
  <section className="order-received" aria-label="Thông tin đơn đã nhận" style={textStyle}>
   <div className="order-received-banner">
    <div className="order-received-check" aria-hidden="true">
     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
    </div>
    <div {...mark('osCode','order-received-code-wrap')}>
     <span className="order-received-code-label" style={codeLabelStyle}>{text('receiptCodeLabel')}</span>
     <div className="order-received-code-row">
      <strong className="order-received-code" style={codeStyle}>{order.code}</strong>
      {!preview&&<button type="button" className="order-copy-pill" onClick={()=>copyValue('code',order.code)}>{copiedKey==='code'?'✓ Đã chép':'Sao chép'}</button>}
     </div>
    </div>
    <p {...mark('osMessage','order-received-msg')} style={messageStyle}>{displayMessage}</p>
   </div>
   <OrderReceiptActions order={order} home={home} appearance={appearance} preview={preview} selectedElement={selectedElement} onSelect={onSelect}/>
   <div {...mark('osDetails','order-received-details checkout-card')}>
    <h3 style={cardHeadingStyle}>{text('receiptDetailsHeading')}</h3>
    <dl style={bodyStyle}>
     {Array.isArray(order.items)&&order.items.length>1
      ?<div className="order-received-items-row"><dt>{text('receiptProductLabel')} ({order.items.length})</dt><dd><ul className="order-received-items">{order.items.map((item,idx)=><li key={`${item.id||item.productId||idx}:${item.variantId||''}`}>{item.name}{item.variantLabel?` (${item.variantLabel})`:''} × {item.quantity}</li>)}</ul></dd></div>
      :<div><dt>{text('receiptProductLabel')}</dt><dd>{order.productName}{order.variantLabel?` (${order.variantLabel})`:''} × {order.quantity}</dd></div>}
     <div><dt>{text('receiptPaymentLabel')}</dt><dd>{PAYMENT_LABELS[order.paymentMethod]||order.paymentMethod}</dd></div>
     <div><dt>{text('receiptSubtotalLabel')}</dt><dd>{order.subtotal==null?'ORORA sẽ báo giá khi xác nhận':formatVnd(order.subtotal)}</dd></div>
     <div><dt>{text('receiptShippingLabel')}</dt><dd>{order.shippingFee==null?'Xác nhận sau':formatVnd(order.shippingFee)}</dd></div>
     <div className="order-received-total" style={totalStyle}><dt>{text('receiptTotalLabel')}</dt><dd>{order.totalAmount==null?'ORORA sẽ xác nhận tổng tiền':formatVnd(order.totalAmount)}</dd></div>
    </dl>
   </div>
   <details {...mark('osRecipient','order-received-details checkout-card')} open>
    <summary style={cardHeadingStyle}>{text('receiptRecipientHeading')}</summary>
    <dl style={recipientBodyStyle}>
     {[['Họ và tên',order.recipient.name],['Số điện thoại',order.recipient.phone],['Email',order.recipient.email],['Địa chỉ nhận hàng',order.recipient.address],['Ghi chú',order.recipient.note]].filter(([,value])=>value).map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
   </details>
   {(order.paymentMethod==='bank_transfer'||preview)&&(
    <div {...mark('osBank','order-received-details checkout-card order-bank-card')} style={bankTextStyle}>
     <h3 style={cardHeadingStyle}>{text('bankHeading')}</h3>
     {appearance.bankName||appearance.bankAccountNumber||appearance.bankAccountName?(
      <dl>
       {appearance.bankName&&<div><dt>Ngân hàng</dt><dd>{appearance.bankName}</dd></div>}
       {appearance.bankAccountNumber&&<div><dt>Số tài khoản</dt><dd className="order-copy-dd"><span>{appearance.bankAccountNumber}</span>{!preview&&<button type="button" className="order-copy-pill" onClick={()=>copyValue('bank',appearance.bankAccountNumber)}>{copiedKey==='bank'?'✓ Đã chép':'Sao chép'}</button>}</dd></div>}
       {appearance.bankAccountName&&<div><dt>Chủ tài khoản</dt><dd>{appearance.bankAccountName}</dd></div>}
       <div><dt>Nội dung chuyển khoản</dt><dd className="order-copy-dd"><span>{transferNote}</span>{!preview&&<button type="button" className="order-copy-pill" onClick={()=>copyValue('note',transferNote)}>{copiedKey==='note'?'✓ Đã chép':'Sao chép'}</button>}</dd></div>
      </dl>
     ):(
      <p className="order-help" style={bankTextStyle}>ORORA sẽ gửi thông tin tài khoản ngân hàng ngay khi xác nhận đơn hàng của bạn. Nội dung chuyển khoản: <strong>{order.code}</strong>.</p>
     )}
    </div>
   )}
   {text('receiptNextStepsBody')&&(
    <div {...mark('osNextSteps','order-received-details checkout-card')}>
     <h3 style={cardHeadingStyle}>{text('receiptNextStepsHeading')}</h3>
     <ol className="order-progress-steps" aria-label="Tiến trình đơn hàng">
      <li className="is-done"><span>1</span><strong>Đã tiếp nhận</strong></li>
      <li><span>2</span><strong>Xác nhận & đóng gói</strong></li>
      <li><span>3</span><strong>Giao tận nơi</strong></li>
     </ol>
     <p className="order-help" style={nextStepsStyle}>{text('receiptNextStepsBody')}</p>
    </div>
   )}
   <p {...mark('osEmailNote','order-help order-email-note')} style={emailNoteStyle}>{mailNote}</p>
   <div className="order-received-footer">
    {preview
     ?<a href="#tra-cuu-don-hang" style={trackingStyle} {...mark('osTracking','order-tracking-link')}>{text('receiptTrackingLabel')}</a>
     :<Link className="order-tracking-link" to="/tra-cuu-don-hang" state={{code:order.code,phone:order.recipient.phone}} style={trackingStyle} onClick={onClose}>{text('receiptTrackingLabel')}</Link>}
    <button type="button" style={closeStyle} {...(preview?mark('osCloseBtn'):{onClick:onClose})}>{text('receiptCloseLabel')}</button>
   </div>
  </section>
 );
}

export default function OrderSuccessPreview({appearance={},selectedElement,onSelect}){
 const title=appearance.receiptTitle?.trim()||CHECKOUT_RECEIPT_COPY.receiptTitle;
 const pick=(key,event)=>{event?.stopPropagation?.();onSelect?.(key);};
 const mark=(key,base='')=>({'data-builder-key':key,className:`${base}${selectedElement===key?' builder-selected':''}`.trim()||undefined,onClick:event=>{event.preventDefault();pick(key,event);}});
 return (
  <section
   aria-label="Xem trước Form đã đặt hàng"
   className="orora-modal order-success-modal is-preview"
   style={receiptModalStyle(appearance)}
  >
   <div className="orora-modal-heading">
    <h2 {...mark('osTitle')} style={toCss(appearance.receiptTitleStyle,{responsive:true})}>{title}</h2>
    <button type="button" aria-label="Đóng cửa sổ" {...mark('osCloseIcon')}>×</button>
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
