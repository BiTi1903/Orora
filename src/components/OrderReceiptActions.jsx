import {useState} from 'react';
import {contactLinks} from '../lib/contact';
import {socialShopUrl} from '../lib/commerce';
import {downloadOrderReceipt} from '../lib/order-receipt';
export default function OrderReceiptActions({order,home={},appearance={},preview=false}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const links=contactLinks(home,'',home.productDetailStyles?.contactActions||{});
 const facebook=socialShopUrl(home.shopLinks?.facebookUrl||home.footerFacebook,'facebook');
 return <div className="order-receipt-actions">
 <p>{appearance.receiptContactLabel||'Liên hệ và gửi mã đơn để ORORA xác nhận nhanh hơn.'}</p>
 <div className="order-receipt-buttons">{links.zalo&&<a href={preview?undefined:links.zalo} target="_blank" rel="noopener noreferrer">{appearance.receiptZaloLabel||'Xác nhận qua Zalo'}</a>}{facebook&&<a href={preview?undefined:facebook} target="_blank" rel="noopener noreferrer">{appearance.receiptFacebookLabel||'Xác nhận qua Facebook'}</a>}
 <button type="button" disabled={busy||preview} onClick={async()=>{setBusy(true);setError('');try{await downloadOrderReceipt(order);}catch{setError('Chưa lưu được ảnh. Vui lòng thử lại.');}finally{setBusy(false);}}}>{busy?'Đang tạo ảnh…':appearance.receiptSaveLabel||'Lưu ảnh đơn hàng'}</button></div>
 <small>Ảnh có thông tin người nhận. Trên iPhone, ảnh có thể được lưu trong Tệp → Tải về.</small>{error&&<p role="alert">{error}</p>}
 </div>;
}
