import { ORDER_STATUSES } from '../lib/order-tracking';
import { formatVnd, PAYMENT_LABELS } from '../lib/commerce';
const date = value => value == null ? 'Chưa cập nhật' : new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
const steps = ['new','confirmed','shipping','completed'];
export default function OrderTrackingDetails({ order, copy }) {
  return (<div className="order-tracking-result" aria-label={`Kết quả tra cứu đơn ${order.code}`}><div className="order-tracking-result-heading"><strong>{ORDER_STATUSES[order.status] || 'Đang cập nhật'}</strong></div>
    <p>Đặt lúc: {date(order.createdAt)}</p><p>Cập nhật: {date(order.updatedAt)}</p>
    {order.status !== 'cancelled' && steps.includes(order.status) && <ol className="order-tracking-steps" aria-label="Tiến trình đơn hàng">{steps.map((step,index) => <li key={step} className={index <= steps.indexOf(order.status) ? 'is-reached' : ''} aria-current={step === order.status ? 'step' : undefined}>{ORDER_STATUSES[step]}</li>)}</ol>}
    {order.status === 'cancelled' && <p className="order-tracking-error">Đơn hàng đã được hủy. Vui lòng liên hệ ORORA nếu bạn cần hỗ trợ.</p>}
    <dl>{[['Sản phẩm',order.productName],...(order.variantLabel ? [['Dung tích',order.variantLabel]] : []),['Số lượng',order.quantity ?? 'Chưa cập nhật'],['Phương thức thanh toán',PAYMENT_LABELS[order.paymentMethod] || 'Chưa cập nhật'],['Thanh toán',order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'],['Tiền sản phẩm',order.subtotal == null ? 'ORORA sẽ xác nhận' : formatVnd(order.subtotal)],['Phí giao hàng',order.shippingFee == null ? 'ORORA sẽ xác nhận' : formatVnd(order.shippingFee)],['Tổng tiền',order.totalAmount == null ? 'ORORA sẽ xác nhận' : formatVnd(order.totalAmount)]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="order-tracking-help">{copy.statusHelp}</p>
  </div>);
}
