import { useCallback, useEffect, useState } from "react";
import { auth } from "../lib/firebaseAuth";
import { PAYMENT_LABELS, formatVnd } from "../lib/commerce";

const STATUSES = { new: "Mới nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" };
async function request(body, cursor) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const response = await fetch(`/api/admin-orders${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, {
    method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error("Chưa kết nối được API đơn hàng. Kiểm tra deployment Vercel."); }
  if (!response.ok) throw new Error(data.message || "Chưa xử lý được đơn hàng.");
  return data;
}
export default function OrdersAdmin() {
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const load = useCallback(async () => {
    const data = await request(); setOrders(data.orders); setCursor(data.nextCursor); setReady(true);
  }, []);
  useEffect(() => { let alive = true; request().then((data) => { if (alive) { setOrders(data.orders); setCursor(data.nextCursor); setReady(true); } }).catch((error) => { if (alive) setNotice({ error: true, text: error.message }); }); return () => { alive = false; }; }, []);
  const perform = async (work) => {
    if (busy) return;
    setBusy(true); setNotice(null);
    try { await work(); } catch (error) { setNotice({ error: true, text: error.message }); } finally { setBusy(false); }
  };
  const update = (order, patch) => perform(async () => {
    const result = await request({ id: order.id, ...patch });
    setOrders((items) => items.map((item) => item.id === order.id ? { ...item, ...patch } : item));
    setNotice({ text: result.message });
  });
  return <section>
    <div className="admin-top"><div><h1>Đơn hàng</h1><p className="admin-muted">Đơn đặt trực tiếp trên website. Liên hệ khách để xác nhận sản phẩm, phí giao hàng và thanh toán.</p></div><button className="admin-btn" disabled={busy} onClick={() => perform(load)}>Tải lại</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    {!ready ? <p className="admin-muted">Đang chờ dữ liệu đơn hàng.</p> : <>
      {!orders.length && <div className="admin-card">Chưa có đơn đặt hàng trên website.</div>}
      <div className="admin-orders-list">{orders.map((order) => <article className="admin-card admin-order" key={order.id}>
        <div className="admin-order-heading"><h2>{order.code}</h2><span className="admin-muted">{new Date(order.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</span></div>
        <p><strong>{order.product.name}</strong> × {order.quantity}</p>
        <p>Tạm tính: {order.subtotal === null ? "Cần báo giá" : formatVnd(order.subtotal)} · Phí giao hàng: xác nhận sau</p>
        <p>Phương thức: {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</p>
        <div className="admin-form-grid">
          <div className="admin-field"><label htmlFor={`order-status-${order.id}`}>Trạng thái đơn</label><select id={`order-status-${order.id}`} value={order.status} disabled={busy} onChange={(event) => update(order, { status: event.target.value })}>{Object.entries(STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className="admin-field"><label htmlFor={`order-payment-${order.id}`}>Trạng thái thanh toán</label><select id={`order-payment-${order.id}`} value={order.paymentStatus} disabled={busy} onChange={(event) => update(order, { paymentStatus: event.target.value })}><option value="unpaid">Chưa thanh toán</option><option value="paid">Đã thanh toán</option></select></div>
        </div>
        <details><summary>Thông tin người mua</summary><div className="admin-order-customer"><p><strong>{order.customer.name}</strong> · <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></p><p>{order.customer.address}</p>{order.customer.note && <p>Ghi chú: {order.customer.note}</p>}</div></details>
      </article>)}</div>
      <p className="admin-muted">Chỉ đánh dấu đã thanh toán sau khi kiểm tra tiền thực nhận.</p>
      {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { const data = await request(null, cursor); setOrders((items) => [...new Map([...items, ...data.orders].map((item) => [item.id, item])).values()]); setCursor(data.nextCursor); })}>Tải thêm đơn</button>}
    </>}
  </section>;
}
