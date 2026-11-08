import useHomeContent from "../hooks/useHomeContent";
import { trackingCopy } from "../lib/order-tracking-copy";
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ORDER_STATUSES } from '../lib/order-tracking';
import { formatVnd, PAYMENT_LABELS } from '../lib/commerce';
const date = value => value == null ? 'Chưa cập nhật' : new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
export default function OrderTracking() {
  const location = useLocation();
  const home = useHomeContent();
  const copy = trackingCopy(home.orderTrackingText);
  const [code,setCode] = useState(typeof location.state?.code === 'string' ? location.state.code : '');
  const [mode,setMode] = useState(location.state?.code ? 'code' : 'phone');
  const [phone,setPhone] = useState(''),[busy,setBusy] = useState(false),[orders,setOrders] = useState([]),[nextCursor,setNextCursor] = useState(null),[error,setError] = useState('');
  const request = useRef(null), sequence = useRef(0), result = useRef(null);
  useEffect(() => () => { sequence.current++;request.current?.abort(); },[]);
  const edit = setter => event => { request.current?.abort();sequence.current++;setBusy(false);setOrders([]);setNextCursor(null);setError('');setter(event.target.value); };
  const steps = ['new','confirmed','shipping','completed'];
  const lookup = async (cursor = null) => {
      if (busy) return;request.current?.abort();const controller = new AbortController();request.current = controller;const id = ++sequence.current;setBusy(true);setError('');if (!cursor) { setOrders([]);setNextCursor(null); }const timer = setTimeout(()=>controller.abort(),20000);
      try { const response = await fetch('/api/order-tracking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:mode === 'code' ? code.trim() : '',phone:mode === 'phone' ? phone.trim() : '', ...(cursor ? {cursor} : {})}),cache:'no-store',signal:controller.signal});const data = await response.json().catch(()=>({message:"Chưa thể tra cứu lúc này. Vui lòng thử lại sau."}));if (!response.ok || !Array.isArray(data.orders) && !data.order) throw new Error(data.message || 'Chưa thể tra cứu. Vui lòng thử lại.');if (id === sequence.current) {setOrders(previous => cursor ? [...previous,...data.orders] : (data.orders || [data.order]));setNextCursor(data.nextCursor || null);if (!cursor) requestAnimationFrame(()=>result.current?.focus());} } catch (cause) { if (id === sequence.current) setError(cause.name === 'AbortError' ? 'Tra cứu mất quá nhiều thời gian. Vui lòng thử lại.' : cause instanceof TypeError ? 'Chưa thể kết nối. Vui lòng kiểm tra mạng và thử lại.' : cause.message || 'Chưa thể tra cứu. Vui lòng thử lại.'); } finally { clearTimeout(timer);if (id === sequence.current) setBusy(false); }

  };
  return <section className="order-tracking-page"><div className="order-tracking-panel"><p className="product-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.intro}</p>
    <form onSubmit={event => { event.preventDefault();if (!(mode === 'code' ? code.trim() : phone.trim())) { setError('Nhập mã đơn hoặc số điện thoại để tra cứu.');return; }lookup(); }} aria-label="Tra cứu đơn hàng" aria-busy={busy}>
      <div className="order-tracking-modes" role="group" aria-label="Tra cứu theo">{[['phone',copy.phoneTab],['code',copy.codeTab]].map(([key,label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => { request.current?.abort();sequence.current++;setBusy(false);setOrders([]);setNextCursor(null);setError('');setMode(key); }}>{label}</button>)}</div>
      {mode === 'code' ? <label htmlFor="lookup-code">{copy.codeLabel}<input id="lookup-code" value={code} onChange={edit(setCode)} required minLength={4} maxLength={40} autoCapitalize="characters" autoCorrect="off" spellCheck={false} placeholder={copy.codePlaceholder} /></label> :
      <label htmlFor="lookup-phone">{copy.phoneLabel}<input id="lookup-phone" type="tel" value={phone} onChange={edit(setPhone)} required minLength={7} maxLength={32} autoComplete="tel" placeholder={copy.phonePlaceholder} /></label>}
      <button type="submit" disabled={busy}>{busy ? copy.loadingLabel : copy.submitLabel}</button>
    </form>
    {error && <p className="order-tracking-error" role="alert">{error}</p>}
    <p className="order-tracking-help">{copy.help}</p><Link to="/#contact">{copy.contactLabel}</Link>
  </div>
  {orders.length > 0 && <div ref={result} tabIndex={-1}><p role="status">Đã tìm thấy {orders.length} đơn hàng{nextCursor ? " · còn đơn để xem thêm" : ""}.</p>{orders.map(order => <div key={order.code} className="order-tracking-result" aria-label={`Kết quả tra cứu đơn ${order.code}`}><div className="order-tracking-result-heading"><h2>Đơn hàng {order.code}</h2><strong>{ORDER_STATUSES[order.status] || 'Đang cập nhật'}</strong></div>
    <p>Đặt lúc: {date(order.createdAt)}</p><p>Cập nhật: {date(order.updatedAt)}</p>
    {order.status !== 'cancelled' && steps.includes(order.status) && <ol className="order-tracking-steps" aria-label="Tiến trình đơn hàng">{steps.map((step,index) => <li key={step} className={index <= steps.indexOf(order.status) ? 'is-reached' : ''} aria-current={step === order.status ? 'step' : undefined}>{ORDER_STATUSES[step]}</li>)}</ol>}
    {order.status === 'cancelled' && <p className="order-tracking-error">Đơn hàng đã được hủy. Vui lòng liên hệ ORORA nếu bạn cần hỗ trợ.</p>}
    <dl>{[['Sản phẩm',order.productName],...(order.variantLabel ? [['Dung tích',order.variantLabel]] : []),['Số lượng',order.quantity ?? 'Chưa cập nhật'],['Phương thức thanh toán',PAYMENT_LABELS[order.paymentMethod] || 'Chưa cập nhật'],['Thanh toán',order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'refunded' ? 'Đã hoàn tiền' : 'Chưa thanh toán'],['Tiền sản phẩm',order.subtotal == null ? 'ORORA sẽ xác nhận' : formatVnd(order.subtotal)],['Phí giao hàng',order.shippingFee == null ? 'ORORA sẽ xác nhận' : formatVnd(order.shippingFee)],['Tổng tiền',order.totalAmount == null ? 'ORORA sẽ xác nhận' : formatVnd(order.totalAmount)]].map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="order-tracking-help">{copy.statusHelp}</p>
  </div>)}{nextCursor && <button className="order-tracking-more" type="button" disabled={busy} onClick={() => lookup(nextCursor)}>{busy ? copy.moreLoadingLabel : copy.moreLabel}</button>}</div>}
  </section>;
}
