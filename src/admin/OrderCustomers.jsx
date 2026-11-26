import { invalidMoneyRange } from "../lib/order-filters";
import { useEffect, useRef, useState } from "react";
import { orderRequest } from "./order-api";
import { summarizeOrderCustomers } from "../lib/order-summary";
import { formatVnd } from "../lib/commerce";

export default function OrderCustomers({ onViewOrders }) {
  const [sort, setSort] = useState("count");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [nextCursor, setNextCursor] = useState(null);
  const [version, setVersion] = useState(0);
  const generation=useRef(0);
  const email = /^\S+@\S+\.\S+$/.test(search.trim()) ? search.trim().toLowerCase() : "";
  useEffect(() => {
    generation.current++;
    let alive = true;
    async function load() {
      setOrders([]);
      setBusy(true); setError(""); setNextCursor(null);
      try {
        const page = await orderRequest(null, email ? {customerEmail:email} : {});
        if (!alive) return;
        setOrders(page.orders || []);
        setNextCursor(page.nextCursor || null);
      } catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setBusy(false); }
    }
    const timer=setTimeout(load,email?300:0); return () => { alive = false;clearTimeout(timer); };
  }, [version,email]);
  const loadMore = async () => {
    const id=generation.current;
    if (!nextCursor || busy) return;
    setBusy(true); setError("");
    try {
      const page = await orderRequest(null, { cursor: nextCursor, ...(email?{customerEmail:email}:{}) });
      if(id!==generation.current)return;
      setOrders((current) => [...new Map([...current, ...(page.orders || [])].map((order) => [order.id, order])).values()]);
      setNextCursor(page.nextCursor || null);
    } catch (cause) { if(id===generation.current)setError(cause.message); }
    finally { if(id===generation.current)setBusy(false); }
  };
  const { customers, missingEmail } = summarizeOrderCustomers(orders);
  const query = search.trim().toLowerCase();
  const visible = (invalidMoneyRange(min, max) ? [] : customers.filter((item) => (item.email.includes(query) || item.name.toLowerCase().includes(query)) && (min === "" || item.total >= Number(min)) && (max === "" || item.total <= Number(max)))).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "vi") : (b[sort === "total" ? "total" : sort === "paid" ? "paid" : "orderCount"] - a[sort === "total" ? "total" : sort === "paid" ? "paid" : "orderCount"] || a.email.localeCompare(b.email)));
  return <div>
    <div className="admin-top"><div><h2>Khách hàng theo email</h2><p className="admin-muted">Mặc định tổng hợp từ 50 đơn gần nhất; bấm Tải thêm đơn cũ hơn nếu cần thống kê sâu hơn.</p></div><button className="admin-btn" aria-busy={busy} disabled={busy} onClick={() => setVersion((value) => value + 1)}>Cập nhật thống kê</button></div>
    {error && <p className="admin-error" role="alert">{error} Thống kê chưa đầy đủ.</p>}

      <p className="admin-muted">{customers.length} email · {orders.length} đơn đã tải{missingEmail ? ` · ${missingEmail} đơn cũ chưa có email, chưa được gộp vào khách hàng` : ""}.</p>
      <div className="admin-order-filter-bar">
        <div className="admin-field"><label htmlFor="customer-order-search">Tìm khách hàng theo email hoặc tên</label><input id="customer-order-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập email hoặc tên…" /></div>
        <div className="admin-field"><label htmlFor="customer-sort">Sắp xếp khách hàng</label><select id="customer-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="count">Nhiều đơn nhất</option><option value="total">Tổng giá trị cao nhất</option><option value="paid">Đã thanh toán cao nhất</option><option value="name">Tên A–Z</option></select></div>
        {(search || min || max || sort !== "count") && <button className="admin-btn" onClick={() => { setSearch(""); setMin(""); setMax(""); setSort("count"); }}>Xóa bộ lọc</button>}
      </div>
      <details className="admin-filter-panel"><summary>Lọc theo tổng tiền{min || max ? " · Đang áp dụng" : ""}</summary><div className="admin-form-grid">
        <div className="admin-field"><label htmlFor="customer-total-min">Tổng giá trị từ (đ)</label><input id="customer-total-min" type="number" min="0" value={min} onChange={(event) => setMin(event.target.value)} /></div>
        <div className="admin-field"><label htmlFor="customer-total-max">Tổng giá trị đến (đ)</label><input id="customer-total-max" type="number" min="0" value={max} onChange={(event) => setMax(event.target.value)} /></div>
      </div></details>
      {invalidMoneyRange(min, max) && <p className="admin-error" role="alert">Khoảng tiền chưa hợp lệ.</p>}
      {busy && !orders.length ? <p className="admin-muted" role="status">Đang tải danh sách khách hàng…</p> : <>
      <div className="admin-card admin-customer-order-scroll"><table className="admin-table"><thead><tr><th>Khách hàng</th><th>Số đơn</th><th>Tổng giá trị</th><th>Đã thanh toán</th><th>Chưa thu</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.email}>
        <td><strong>{item.email}</strong><br /><small>{item.name}</small></td><td>{item.orderCount}{item.cancelledCount > 0 && <small className="order-summary-note">{item.cancelledCount} đơn hủy</small>}{item.quoteCount > 0 && <small className="order-summary-note">{item.quoteCount} đơn chờ báo giá</small>}</td><td>{formatVnd(item.total)}</td><td>{formatVnd(item.paid)}</td><td>{formatVnd(item.awaitingPayment)}</td><td><button className="admin-btn" onClick={() => onViewOrders(item.email, orders)}>Xem đơn của {item.email}</button></td>
      </tr>)}</tbody></table>{!visible.length && <p className="admin-muted">{nextCursor ? `Chưa tìm thấy trong ${orders.length} đơn đã tải.` : "Không có khách hàng phù hợp."}</p>}</div>
      {nextCursor && <button type="button" className="admin-btn" disabled={busy} style={{ marginTop: 10 }} onClick={loadMore}>{busy ? "Đang tải…" : "Tải thêm đơn cũ hơn"}</button>}
      <p className="admin-muted">Số đơn gồm cả đơn hủy. Các cột tiền chỉ tính tạm tính sản phẩm của đơn chưa hủy, chưa gồm phí giao hàng; đơn chờ báo giá chưa cộng vào tiền. COD chưa thu tiền vẫn nằm trong “Chưa thu”. “Đã thanh toán” dựa trên ô xác nhận nhận tiền của admin.</p>
    </>}
  </div>;
}
