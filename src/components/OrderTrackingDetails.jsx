import "../styles/order-tracking.css";
import { ORDER_STATUSES } from '../lib/order-tracking';
import { formatVnd, PAYMENT_LABELS } from '../lib/commerce';
import {trackingCopy,trackingStyle} from '../lib/order-tracking-copy';
const date = value => value == null ? 'Chưa cập nhật' : new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
const steps = ['new','confirmed','shipping','completed'];
export default function OrderTrackingDetails({ order, copy: suppliedCopy, styles={} }) {
 const nextKey={new:'nextNew',confirmed:'nextConfirmed',shipping:'nextShipping',completed:'nextCompleted'}[order.status];
 const copy=trackingCopy(suppliedCopy);
 const css=key=>trackingStyle(styles,key);
 const money=value=>value==null?copy.pendingTotalLabel:formatVnd(value);
 const paid=order.paymentStatus==='paid',refunded=order.paymentStatus==='refunded';
 const row=(label,value,className)=><div key={label} className={className}><dt>{label}</dt><dd style={className==='is-wide tracking-product-name'?css('detailProduct'):className==='is-total'?css('detailTotal'):undefined}>{value}</dd></div>;
 return <div className="order-tracking-result" aria-label={`Kết quả tra cứu đơn ${order.code}`}>
  <section className="tracking-status-section" aria-label={copy.progressTitle}>
   <div className="order-tracking-result-heading"><strong>{ORDER_STATUSES[order.status]||'Đang cập nhật'}</strong><span className="tracking-order-code">{order.code}</span></div>
   <div className="order-tracking-dates"><p><span>{copy.createdLabel}</span><time>{date(order.createdAt)}</time></p><p><span>{copy.updatedLabel}</span><time>{date(order.updatedAt)}</time></p></div>
   {steps.includes(order.status)&&<ol className="order-tracking-steps" aria-label="Tiến trình đơn hàng">{steps.map((step,index)=><li key={step} className={index<=steps.indexOf(order.status)?'is-reached':''} aria-current={step===order.status?'step':undefined}>{ORDER_STATUSES[step]}</li>)}</ol>}
   {nextKey&&<p className="tracking-next-step"><strong>Bước tiếp theo</strong> {copy[nextKey]}</p>}
   {order.status==='cancelled'&&<p className="order-tracking-error">{copy.cancelledHelp}</p>}
  </section>
  <section className="tracking-detail-section tracking-product-section"><h3 style={css("detailHeading")}>{copy.productSectionTitle}</h3><dl>
   {row(copy.productLabel,order.productName,'is-wide tracking-product-name')}
   {order.variantLabel&&row(copy.volumeLabel,order.variantLabel)}
   {row(copy.quantityLabel,order.quantity??'Chưa cập nhật')}
  </dl></section>
  <section className="tracking-detail-section"><h3 style={css("detailHeading")}>{copy.paymentSectionTitle}</h3><dl>
   {row(copy.methodLabel,PAYMENT_LABELS[order.paymentMethod]||'Chưa cập nhật','is-wide')}
   {row(copy.paymentLabel,<span className={`tracking-payment-badge${paid?' is-paid':''}`}>{paid?copy.paidLabel:refunded?copy.refundedLabel:copy.unpaidLabel}</span>)}
  </dl></section>
  <section className="tracking-detail-section tracking-cost-section"><h3 style={css("detailHeading")}>{copy.costSectionTitle}</h3><dl>
   {row(copy.subtotalLabel,money(order.subtotal))}
   {row(copy.shippingLabel,money(order.shippingFee))}
   {row(copy.totalLabel,money(order.totalAmount),'is-total')}
  </dl></section>
  <p className="order-tracking-help">{copy.statusHelp}</p>
 </div>;
}
