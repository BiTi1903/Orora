import ModalDialog from "./ModalDialog";
import OrderTrackingDetails from "./OrderTrackingDetails";
import useHomeContent from "../hooks/useHomeContent";
import OrderTrackingSearch from "./OrderTrackingSearch";
import { trackingCopy,trackingTheme,trackingStyle,trackingTemplate } from "../lib/order-tracking-copy";
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ORDER_STATUSES } from '../lib/order-tracking';
import { formatVnd, PAYMENT_LABELS } from '../lib/commerce';
const date = value => value == null ? 'Chưa cập nhật' : new Date(value).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh'});
export default function OrderTracking() {
  const location = useLocation();
  const home = useHomeContent();
  const copy = trackingCopy(home.orderTrackingText);
  const styles=home.orderTrackingText?.styles||{},css=key=>trackingStyle(styles,key);
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
  const switchMode=key=>{request.current?.abort();sequence.current++;setBusy(false);setOrders([]);setNextCursor(null);setSelectedCode(null);setStatus('all');setPage(1);setError('');setMode(key);};
  return <section className={`order-tracking-page${orders.length?" has-results":""}`} style={trackingTheme(styles)}><Link className="order-tracking-back" to="/" style={css('help')}>← {copy.backLabel}</Link>
  <header className="order-tracking-heading"><p className="product-eyebrow" style={css('eyebrow')}>{copy.eyebrow}</p><h1 style={css('title')}>{copy.title}</h1><p style={css('intro')}>{copy.intro}</p></header>
  <OrderTrackingSearch copy={copy} styles={styles} mode={mode} code={code} phone={phone} busy={busy} error={error} onMode={switchMode} onCode={edit(setCode)} onPhone={edit(setPhone)} onSubmit={event=>{event.preventDefault();if(!(mode==='code'?code.trim():phone.trim())){setError('Nhập mã đơn hoặc số điện thoại để tra cứu.');return;}lookup();}}/>
  {orders.length > 0 && <div ref={result} tabIndex={-1} className="order-tracking-list" style={css("resultBody")}>
    <h2 style={css("resultTitle")}>{copy.resultTitle}</h2>
    <p className="order-tracking-help" role="status">{trackingTemplate(copy.resultSummary,{count:orders.length})}</p>
    <div className="order-tracking-statuses" role="group" aria-label="Lọc theo tình trạng đơn hàng">{[['all',copy.allLabel],...Object.entries(ORDER_STATUSES),...(orders.some(order => !ORDER_STATUSES[order.status]) ? [['unknown','Đang cập nhật']] : [])].map(([key,label]) => <button type="button" key={key} aria-pressed={status === key} onClick={() => {setStatus(key);setPage(1);}}>{label}<span>{key === 'all' ? orders.length : orders.filter(order => (ORDER_STATUSES[order.status] ? order.status : 'unknown') === key).length}</span></button>)}</div>
    <div className="order-tracking-summaries">{pageOrders.map(order => <article key={order.code} className="order-tracking-summary" style={css("resultBody")}><div><strong>{order.code}</strong><small>{date(order.createdAt)}</small></div><div className="order-tracking-summary-product"><span>{order.productName}</span><small>{[order.variantLabel,order.quantity != null ? `${copy.quantityLabel}: ${order.quantity}` : ''].filter(Boolean).join(' · ')}</small></div><div className="order-tracking-summary-state"><strong>{ORDER_STATUSES[order.status] || 'Đang cập nhật'}</strong><span>{order.totalAmount == null ? copy.pendingTotalLabel : formatVnd(order.totalAmount)}</span><small className="order-tracking-payment" aria-label={copy.paymentLabel}>{[order.paymentStatus === "paid" ? copy.paidLabel : order.paymentStatus === "refunded" ? copy.refundedLabel : copy.unpaidLabel, PAYMENT_LABELS[order.paymentMethod]].filter(Boolean).join(" · ")}</small></div><button type="button" onClick={() => setSelectedCode(order.code)} aria-label={`Xem chi tiết đơn ${order.code}`}>{copy.detailLabel}</button></article>)}</div>
    {!filtered.length && <p className="order-tracking-help">{copy.emptyFilterLabel}</p>}
    {pageCount > 1 && <div className="order-tracking-pagination"><button type="button" disabled={activePage === 1} onClick={() => setPage(activePage-1)}>{copy.previousLabel}</button><span>{trackingTemplate(copy.pageLabel,{page:activePage,pages:pageCount})}</span><button type="button" disabled={activePage === pageCount} onClick={() => setPage(activePage+1)}>{copy.nextLabel}</button></div>}
    {nextCursor && <><p className="order-tracking-help">{copy.moreHelp}</p><button className="order-tracking-more" aria-busy={busy} type="button" disabled={busy} onClick={() => lookup(nextCursor)}>{busy ? copy.moreLoadingLabel : copy.moreLabel}</button></>}
  </div>}
  {selected && <ModalDialog title={`Đơn hàng ${selected.code}`} className="order-tracking-modal" onClose={() => setSelectedCode(null)}><OrderTrackingDetails order={selected} copy={copy} /></ModalDialog>}
  </section>;
}
