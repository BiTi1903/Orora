import {useEffect,useRef,useState} from 'react';
import {contactLinks} from '../lib/contact';
import {socialShopUrl} from '../lib/commerce';
import {toCss} from '../lib/typography';
import {downloadOrderReceipt,renderOrderReceiptBlob,shareOrderReceiptBlob} from '../lib/order-receipt';
export default function OrderReceiptActions({order,home={},appearance={},preview=false}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[statusNote,setStatusNote]=useState('');
 const [blob,setBlob]=useState(null),[renderFailed,setRenderFailed]=useState(false);
 const shareBroken=useRef(false);
 useEffect(()=>{
  if(preview||!order)return;
  let alive=true;
  renderOrderReceiptBlob(order,home).then(next=>{if(alive)setBlob(next);}).catch(()=>{if(alive)setRenderFailed(true);});
  return()=>{alive=false;};
 },[order,home,preview]);
 const links=contactLinks(home,'',home.productDetailStyles?.contactActions||{});
 const facebook=socialShopUrl(home.shopLinks?.facebookUrl||home.footerFacebook,'facebook');
 const zaloLabel=appearance.receiptZaloLabel||'Xác nhận qua Zalo',fbLabel=appearance.receiptFacebookLabel||'Xác nhận qua Facebook',saveLabel=appearance.receiptSaveLabel||'Lưu ảnh đơn hàng';
 const saveReceipt=async()=>{
  if(preview||busy||!order)return;
  setBusy(true);setError('');
  try{await downloadOrderReceipt(order,blob||undefined);setStatusNote('Đã lưu ảnh đơn hàng vào máy.');}catch{setError('Chưa lưu được ảnh. Vui lòng thử lại.');}finally{setBusy(false);}
 };
 const handleZaloClick=event=>{
  if(preview||!order)return;
  if(busy){event.preventDefault();return;}
  if(!blob&&!renderFailed){event.preventDefault();setStatusNote('Đang chuẩn bị ảnh đơn hàng… vui lòng bấm lại sau giây lát.');return;}
  const sharing=blob&&!shareBroken.current?shareOrderReceiptBlob(order,blob):null;
  if(!sharing){
   setError('');
   setStatusNote('Đang lưu ảnh đơn hàng và mở Zalo…');
   downloadOrderReceipt(order,blob||undefined)
    .then(()=>setStatusNote('Đã lưu ảnh đơn hàng — khi qua Zalo bạn có thể chọn ảnh vừa lưu để gửi ngay.'))
    .catch(()=>{setStatusNote('');setError('Chưa lưu được ảnh đơn hàng. Bạn có thể bấm nút Lưu ảnh đơn hàng bên dưới.');});
   return;
  }
  event.preventDefault();
  setBusy(true);setError('');
  sharing.then(result=>{
   if(result.mode==='shared')setStatusNote('Đã mở chia sẻ kèm ảnh đơn hàng — chọn Zalo để gửi trực tiếp cho ORORA.');
   else if(result.mode==='cancelled')setStatusNote('Đã hủy chia sẻ. Bạn có thể bấm lại hoặc dùng nút Lưu ảnh đơn hàng bên dưới.');
   else{shareBroken.current=true;setStatusNote('Chưa mở được hộp chia sẻ. Bấm Zalo thêm một lần nữa để lưu ảnh và mở Zalo.');}
  }).finally(()=>setBusy(false));
 };
 return <div className="order-receipt-actions" style={{'--receipt-accent':appearance.receiptAccent||'#b8446d','--receipt-surface':appearance.receiptBackground||'#fff5f8',...(appearance.receiptActionsBorderColor?{'--receipt-actions-border':appearance.receiptActionsBorderColor}:{}),...(appearance.receiptZaloBackground?{'--receipt-zalo-bg':appearance.receiptZaloBackground}:{}),...(appearance.receiptZaloColor?{'--receipt-zalo-color':appearance.receiptZaloColor}:{}),...toCss(appearance.receiptActionsTextStyle,{responsive:true})}}>
 {(links.zalo||facebook)&&<div className="order-receipt-contact"><div><strong>{appearance.receiptContactLabel||'Xác nhận đơn nhanh'}</strong><small>{appearance.receiptContactHint||'Gửi ảnh đơn hàng trực tiếp qua Zalo cho ORORA'}</small></div>
 <div className="order-receipt-socials">{facebook&&<a className="receipt-social receipt-facebook" aria-label={fbLabel} title={fbLabel} href={preview?undefined:facebook} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4A25 25 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9z"/></svg></a>}
 {links.zalo&&<a className="receipt-social receipt-zalo receipt-zalo-primary" aria-label={zaloLabel} title={zaloLabel} href={preview?undefined:links.zalo} target="_blank" rel="noopener noreferrer" data-receipt-ready={blob?'true':'false'} onClick={handleZaloClick}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M26 20a12 12 0 1 0-18 6l-3 4 7-2a12 12 0 0 0 14-8Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="5" y="19" fontSize="10" fontWeight="700" fill="currentColor">Zalo</text></svg><span>{zaloLabel}</span></a>}</div></div>}
 <div className="order-receipt-save"><div><strong>{saveLabel}</strong><small>{appearance.receiptSaveHint||'Giữ lại thông tin để tiện tra cứu'}</small></div>
 <button className="receipt-download" type="button" aria-label={busy?'Đang tạo ảnh…':saveLabel} title={saveLabel} aria-busy={busy} disabled={busy||preview} onClick={saveReceipt}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/></svg></button></div>
 <small className="receipt-download-note" role="status">{statusNote||appearance.receiptDownloadNote||'Ảnh có thông tin người nhận. Trên điện thoại hỗ trợ chia sẻ, ấn Zalo sẽ mở hộp chọn gửi kèm ảnh; nếu không hỗ trợ sẽ tải ảnh dự phòng.'}</small>{error&&<p role="alert">{error}</p>}
 </div>;
}
