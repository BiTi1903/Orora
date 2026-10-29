import { useEffect, useRef, useState } from "react";
import { PAYMENT_LABELS, formatVnd } from "../lib/commerce";
import { orderRequest, MAIL_STATES } from "./order-api";
const STATUSES = { new: "Mới nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" };
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
export default function OrdersAdmin({ onOpenEmailMarketing }) {
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);
  const sequence = useRef({ value: 0 });
  const panel = useRef(null);
  useEffect(() => { const tracker = sequence.current; let alive = true; orderRequest().then((data) => { if (alive) { setOrders(data.orders); setCursor(data.nextCursor); setReady(true); } }).catch((error) => { if (alive) setNotice({ error: true, text: error.message }); }); return () => { alive = false; tracker.value++; }; }, []);
  useEffect(() => { if (detail?.order.id) panel.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [detail?.order.id]);
  const perform = async (work) => { if (busy) return; setBusy(true); setNotice(null); try { await work(); } catch (error) { setNotice({ error: true, text: error.message }); } finally { setBusy(false); } };
  const showDetail = async (order) => {
    const current = ++sequence.current.value;
    setDetail({ order, mails: [], loading: true });
    try { const data = await orderRequest(null, { id: order.id }); if (current === sequence.current.value) { setDetail({ ...data, loading: false }); setOrders((items) => items.map((item) => item.id === order.id ? data.order : item)); } }
    catch (error) { if (current === sequence.current.value) { setDetail((value) => ({ ...value, loading: false })); setNotice({ error: true, text: error.message }); } }
  };
  const patchLocal = (id, patch) => {
    setOrders((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item));
    setDetail((value) => value?.order.id === id ? { ...value, order: { ...value.order, ...patch } } : value);
  };
  const update = (order, patch) => perform(async () => {
    const previous = Object.fromEntries(Object.keys(patch).map((key) => [key, order[key]]));
    patchLocal(order.id, patch);
    try { const result = await orderRequest({ id: order.id, ...patch }); setNotice({ text: result.message }); }
    catch (error) { patchLocal(order.id, previous); throw error; }
  });
  const selected = detail?.order;
  return <section>
    <div className="admin-top"><div><h1>Đơn hàng</h1><p className="admin-muted">Chọn một đơn để xem thông tin người mua, thanh toán và lịch sử gửi thư.</p></div><button className="admin-btn" disabled={busy} onClick={() => perform(async () => { const data = await orderRequest(); setOrders(data.orders); setCursor(data.nextCursor); setReady(true); })}>Tải lại</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    {!ready ? <p className="admin-muted">Đang chờ dữ liệu đơn hàng.</p> : <>
      <div className="admin-card admin-order-list-scroll"><table className="admin-table"><thead><tr><th>Mã đơn / Ngày đặt</th><th>Người mua</th><th>Tạm tính</th><th>Trạng thái</th><th>Thư xác nhận</th><th /></tr></thead><tbody>
        {orders.map((order) => <tr key={order.id}><td><strong>{order.code}</strong><br /><small>{date(order.createdAt)}</small></td><td>{order.customer.name}</td><td>{order.subtotal === null ? "Cần báo giá" : formatVnd(order.subtotal)}</td><td><label className="order-status-check"><input type="checkbox" aria-label={`Xác nhận đơn ${order.code}`} checked={["confirmed", "shipping", "completed"].includes(order.status)} disabled={busy || detail?.loading || !["new", "confirmed"].includes(order.status)} onChange={(event) => update(order, { status: event.target.checked ? "confirmed" : "new" })} /><span>{STATUSES[order.status] || order.status}</span></label></td><td>{MAIL_STATES[order.confirmationMail?.state] || "Chưa có lịch sử"}</td><td><button className="admin-btn" type="button" onClick={() => showDetail(order)}>Xem đơn {order.code}</button></td></tr>)}
      </tbody></table>{!orders.length && <p className="admin-muted">Chưa có đơn hàng.</p>}</div>
      {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { const data = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...data.orders].map((item) => [item.id, item])).values()]); setCursor(data.nextCursor); })}>Tải thêm đơn</button>}
    </>}
    {selected && <article className="admin-card admin-order-detail" ref={panel} aria-label={`Chi tiết đơn ${selected.code}`}>
      <div className="admin-order-heading"><h2>Đơn {selected.code}</h2><button type="button" className="admin-btn" onClick={() => { sequence.current.value++; setDetail(null); }}>Đóng chi tiết</button></div>
      <p className="admin-muted">Đặt lúc {date(selected.createdAt)}</p>
      <div className="admin-form-grid"><div><h3>Thông tin người mua</h3><p>{selected.customer.name}</p><p><a href={`tel:${selected.customer.phone}`}>{selected.customer.phone}</a></p><p>{selected.customer.email ? <a href={`mailto:${selected.customer.email}`}>{selected.customer.email}</a> : "Đơn cũ chưa có email"}</p><p className="order-preserve-text">{selected.customer.address}</p><p className="order-preserve-text">Ghi chú: {selected.customer.note || "—"}</p></div>
      <div><h3>Sản phẩm và thanh toán</h3><p>{selected.product.name} × {selected.quantity}</p><p>Đơn giá: {selected.product.priceText || "Cần báo giá"}</p><p>Tạm tính: {selected.subtotal === null ? "Cần báo giá" : formatVnd(selected.subtotal)}</p><p>Phí giao hàng: {selected.shippingFee == null ? "Xác nhận sau" : formatVnd(selected.shippingFee)}</p><p>{PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</p><label className="admin-check"><input type="checkbox" checked={selected.paymentStatus === "paid"} disabled={busy || detail.loading} onChange={(event) => update(selected, { paymentStatus: event.target.checked ? "paid" : "unpaid" })} />Đã thanh toán</label></div></div>
      <fieldset className="order-status-options" disabled={busy || detail.loading}><legend>Trạng thái xử lý đơn</legend>{Object.entries(STATUSES).map(([key, label]) => <label key={key}><input type="radio" name={`status-${selected.id}`} checked={selected.status === key} onChange={() => update(selected, { status: key })} />{label}</label>)}</fieldset>
      <h3>Lịch sử email của đơn</h3>
      <div className="admin-actions"><button type="button" className="admin-btn" onClick={() => showDetail(selected)}>Tải lại lịch sử</button>{onOpenEmailMarketing && <button className="admin-btn" type="button" onClick={onOpenEmailMarketing}>Mẫu thư và gửi thư trong Email marketing</button>}</div>
      {detail.loading ? <p>Đang tải chi tiết…</p> : !detail.mails.length ? <p className="admin-muted">Chưa có lịch sử gửi thư.</p> : detail.mails.map((mail) => <details className="order-mail-event" key={mail.id}><summary>{mail.subject} · {MAIL_STATES[mail.state] || mail.state}</summary><p>Gửi tới: {mail.recipient}</p><p>{mail.manual ? "Gửi từ admin" : "Tự động khi đặt hàng"} · {date(mail.createdAt)}</p>{mail.errorCode && <p className="admin-error">Mã lỗi: {mail.errorCode}</p>}<pre>{mail.text}</pre></details>)}
      <p className="admin-muted">“Microsoft đã nhận” là chấp nhận yêu cầu gửi, chưa bảo đảm thư vào hộp thư khách. Chỉ đánh dấu thanh toán sau khi kiểm tra tiền thực nhận.</p>
    </article>}
  </section>;
}
