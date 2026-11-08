import ModalDialog from "./ModalDialog";
import OrderTrackingDetails from "./OrderTrackingDetails";
import useHomeContent from "../hooks/useHomeContent";
import { trackingCopy } from "../lib/order-tracking-copy";
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ORDER_STATUSES } from '../lib/order-tracking';
import { formatVnd } from '../lib/commerce';
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
  const edit = setter => event => { request.current?.abort();sequence.current++;setBusy(false);setOrders([]);setNextCursor(null);setSelectedCode(null);setStatus('all');setPage(1);setError('');setter(event.target.value); };
  const [status,setStatus] = useState('all'),[page,setPage] = useState(1),[selectedCode,setSelectedCode] = useState(null);
  const priority = Object.keys(ORDER_STATUSES);
  const filtered = orders.filter(order => status === 'all' || (ORDER_STATUSES[order.status] ? order.status : 'unknown') === status).sort((a,b) => {
    const rank = value => priority.includes(value) ? priority.indexOf(value) : priority.length;
    return (status === 'all' ? rank(a.status)-rank(b.status) : 0) || (b.createdAt || 0)-(a.createdAt || 0) || a.code.localeCompare(b.code);
  });
  const pageCount = Math.max(1,Math.ceil(filtered.length/5));
  const activePage = Math.min(page,pageCount);
  const pageOrders = filtered.slice((activePage-1)*5,activePage*5);
  const selected = orders.find(order => order.code === selectedCode);
  const lookup = async (cursor = null) => {
      if (busy) return;request.current?.abort();const controller = new AbortController();request.current = controller;const id = ++sequence.current;setBusy(true);setError('');if (!cursor) { setOrders([]);setNextCursor(null);setSelectedCode(null);setStatus('all');setPage(1); }const timer = setTimeout(()=>controller.abort(),20000);
      try { const response = await fetch('/api/order-tracking',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code:mode === 'code' ? code.trim() : '',phone:mode === 'phone' ? phone.trim() : '', ...(cursor ? {cursor} : {})}),cache:'no-store',signal:controller.signal});const data = await response.json().catch(()=>({message:"Chưa thể tra cứu lúc này. Vui lòng thử lại sau."}));if (!response.ok || !Array.isArray(data.orders) && !data.order) throw new Error(data.message || 'Chưa thể tra cứu. Vui lòng thử lại.');if (id === sequence.current) {setOrders(previous => cursor ? [...previous,...data.orders] : (data.orders || [data.order]));setNextCursor(data.nextCursor || null);if (!cursor) requestAnimationFrame(()=>result.current?.focus());} } catch (cause) { if (id === sequence.current) setError(cause.name === 'AbortError' ? 'Tra cứu mất quá nhiều thời gian. Vui lòng thử lại.' : cause instanceof TypeError ? 'Chưa thể kết nối. Vui lòng kiểm tra mạng và thử lại.' : cause.message || 'Chưa thể tra cứu. Vui lòng thử lại.'); } finally { clearTimeout(timer);if (id === sequence.current) setBusy(false); }

  };
  return <section className="order-tracking-page"><div className="order-tracking-panel"><p className="product-eyebrow">{copy.eyebrow}</p><h1>{copy.title}</h1><p>{copy.intro}</p>
    <form onSubmit={event => { event.preventDefault();if (!(mode === 'code' ? code.trim() : phone.trim())) { setError('Nhập mã đơn hoặc số điện thoại để tra cứu.');return; }lookup(); }} aria-label="Tra cứu đơn hàng" aria-busy={busy}>
      <div className="order-tracking-modes" role="group" aria-label="Tra cứu theo">{[['phone',copy.phoneTab],['code',copy.codeTab]].map(([key,label]) => <button key={key} type="button" aria-pressed={mode === key} onClick={() => { request.current?.abort();sequence.current++;setBusy(false);setOrders([]);setNextCursor(null);setSelectedCode(null);setStatus('all');setPage(1);setError('');setMode(key); }}>{label}</button>)}</div>
      {mode === 'code' ? <label htmlFor="lookup-code">{copy.codeLabel}<input id="lookup-code" value={code} onChange={edit(setCode)} required minLength={4} maxLength={40} autoCapitalize="characters" autoCorrect="off" spellCheck={false} placeholder={copy.codePlaceholder} /></label> :
      <label htmlFor="lookup-phone">{copy.phoneLabel}<input id="lookup-phone" type="tel" value={phone} onChange={edit(setPhone)} required minLength={7} maxLength={32} autoComplete="tel" placeholder={copy.phonePlaceholder} /></label>}
      <button type="submit" disabled={busy}>{busy ? copy.loadingLabel : copy.submitLabel}</button>
    </form>
    {error && <p className="order-tracking-error" role="alert">{error}</p>}
    <p className="order-tracking-help">{copy.help}</p><Link to="/#contact">{copy.contactLabel}</Link>
  </div>
  {orders.length > 0 && <div ref={result} tabIndex={-1} className="order-tracking-list">
    <h2>Đơn hàng của bạn</h2>
    <p className="order-tracking-help" role="status">Đã tải {orders.length} đơn hàng{nextCursor ? ' · còn đơn cũ để xem thêm' : ''}. Chọn tình trạng để lọc danh sách.</p>
    <div className="order-tracking-statuses" role="group" aria-label="Lọc theo tình trạng đơn hàng">{[['all','Tất cả'],...Object.entries(ORDER_STATUSES),...(orders.some(order => !ORDER_STATUSES[order.status]) ? [['unknown','Đang cập nhật']] : [])].map(([key,label]) => <button type="button" key={key} aria-pressed={status === key} onClick={() => {setStatus(key);setPage(1);}}>{label}<span>{key === 'all' ? orders.length : orders.filter(order => (ORDER_STATUSES[order.status] ? order.status : 'unknown') === key).length}</span></button>)}</div>
    <div className="order-tracking-summaries">{pageOrders.map(order => <article key={order.code} className="order-tracking-summary"><div><strong>{order.code}</strong><small>{date(order.createdAt)}</small></div><div className="order-tracking-summary-product"><span>{order.productName}</span><small>{[order.variantLabel,order.quantity != null ? `Số lượng: ${order.quantity}` : ''].filter(Boolean).join(' · ')}</small></div><div className="order-tracking-summary-state"><strong>{ORDER_STATUSES[order.status] || 'Đang cập nhật'}</strong><span>{order.totalAmount == null ? 'Chờ xác nhận tổng tiền' : formatVnd(order.totalAmount)}</span></div><button type="button" onClick={() => setSelectedCode(order.code)} aria-label={`Xem chi tiết đơn ${order.code}`}>Xem chi tiết</button></article>)}</div>
    {!filtered.length && <p className="order-tracking-help">Chưa có đơn thuộc tình trạng này{nextCursor ? ' trong các đơn đã tải. Bạn có thể xem thêm đơn cũ bên dưới' : ''}.</p>}
    {pageCount > 1 && <div className="order-tracking-pagination"><button type="button" disabled={activePage === 1} onClick={() => setPage(activePage-1)}>Trang trước</button><span>Trang {activePage}/{pageCount}</span><button type="button" disabled={activePage === pageCount} onClick={() => setPage(activePage+1)}>Trang sau</button></div>}
    {nextCursor && <><p className="order-tracking-help">Số lượng theo tình trạng tính trên các đơn đã tải. Xem thêm để kiểm tra các đơn cũ hơn.</p><button className="order-tracking-more" type="button" disabled={busy} onClick={() => lookup(nextCursor)}>{busy ? copy.moreLoadingLabel : copy.moreLabel}</button></>}
  </div>}
  {selected && <ModalDialog title={`Đơn hàng ${selected.code}`} className="order-tracking-modal" onClose={() => setSelectedCode(null)}><OrderTrackingDetails order={selected} copy={copy} /></ModalDialog>}
  </section>;
}
