import {useState} from 'react';
import {contactLinks} from '../lib/contact';
import {socialShopUrl} from '../lib/commerce';
import {downloadOrderReceipt} from '../lib/order-receipt';
export default function OrderReceiptActions({order,home={},appearance={},preview=false}){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const links=contactLinks(home,'',home.productDetailStyles?.contactActions||{});
 const facebook=socialShopUrl(home.shopLinks?.facebookUrl||home.footerFacebook,'facebook');
 const zaloLabel=appearance.receiptZaloLabel||'Xác nhận qua Zalo',fbLabel=appearance.receiptFacebookLabel||'Xác nhận qua Facebook',saveLabel=appearance.receiptSaveLabel||'Lưu ảnh đơn hàng';
 return <div className="order-receipt-actions" style={{'--receipt-accent':appearance.receiptAccent||'#b8446d','--receipt-surface':appearance.receiptBackground||'#fff5f8'}}>
 {(links.zalo||facebook)&&<div className="order-receipt-contact"><div><strong>{appearance.receiptContactLabel||'Xác nhận đơn nhanh'}</strong><small>{appearance.receiptContactHint||'Gửi mã đơn cho ORORA qua'}</small></div>
 <div className="order-receipt-socials">{facebook&&<a className="receipt-social receipt-facebook" aria-label={fbLabel} title={fbLabel} href={preview?undefined:facebook} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 22v-9h3l.5-4H14V7c0-1.2.4-2 2-2h2V1.4A25 25 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v9z"/></svg></a>}
 {links.zalo&&<a className="receipt-social receipt-zalo" aria-label={zaloLabel} title={zaloLabel} href={preview?undefined:links.zalo} target="_blank" rel="noopener noreferrer"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M26 20a12 12 0 1 0-18 6l-3 4 7-2a12 12 0 0 0 14-8Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><text x="5" y="19" fontSize="10" fontWeight="700" fill="currentColor">Zalo</text></svg></a>}</div></div>}
 <div className="order-receipt-save"><div><strong>{saveLabel}</strong><small>{appearance.receiptSaveHint||'Giữ lại thông tin để tiện tra cứu'}</small></div>
 <button className="receipt-download" type="button" aria-label={busy?'Đang tạo ảnh…':saveLabel} title={saveLabel} aria-busy={busy} disabled={busy||preview} onClick={async()=>{setBusy(true);setError('');try{await downloadOrderReceipt(order);}catch{setError('Chưa lưu được ảnh. Vui lòng thử lại.');}finally{setBusy(false);}}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/></svg></button></div>
 <small className="receipt-download-note">Ảnh có thông tin người nhận. Trên iPhone, xem trong Tệp → Tải về.</small>{error&&<p role="alert">{error}</p>}
 </div>;
}
