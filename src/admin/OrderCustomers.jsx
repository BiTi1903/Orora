import { invalidMoneyRange } from "../lib/order-filters";
import { useEffect, useState } from "react";
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
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    async function load() {
      setBusy(true); setError("");
      try {
        const items = new Map(); let cursor; const seen = new Set();
        do {
          const page = await orderRequest(null, cursor ? { cursor } : {});
          if (!alive) return;
          page.orders.forEach((order) => items.set(order.id, order));
          cursor = page.nextCursor;
          if (cursor && seen.has(cursor)) throw new Error("Không tải đủ danh sách đơn hàng. Vui lòng tải lại.");
          if (cursor) seen.add(cursor);
          setOrders([...items.values()]);
        } while (cursor);
      } catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setBusy(false); }
    }
    load(); return () => { alive = false; };
  }, [version]);
  const { customers, missingEmail } = summarizeOrderCustomers(orders);
  const query = search.trim().toLowerCase();
  const visible = (invalidMoneyRange(min, max) ? [] : customers.filter((item) => (item.email.includes(query) || item.name.toLowerCase().includes(query)) && (min === "" || item.total >= Number(min)) && (max === "" || item.total <= Number(max)))).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name, "vi") : (b[sort === "total" ? "total" : sort === "paid" ? "paid" : "orderCount"] - a[sort === "total" ? "total" : sort === "paid" ? "paid" : "orderCount"] || a.email.localeCompare(b.email)));
  return <div>
    <div className="admin-top"><div><h2>Khách hàng theo email</h2><p className="admin-muted">Tổng hợp toàn bộ đơn trên website theo email người mua.</p></div><button className="admin-btn" disabled={busy} onClick={() => setVersion((value) => value + 1)}>Cập nhật thống kê</button></div>
    {error && <p className="admin-error" role="alert">{error} Thống kê chưa đầy đủ.</p>}
    {busy ? <p className="admin-muted" role="status">Đang tổng hợp toàn bộ đơn… Đã tải {orders.length} đơn.</p> : !error && <>
      <p className="admin-muted">{customers.length} email · {orders.length} đơn{missingEmail ? ` · ${missingEmail} đơn cũ chưa có email, chưa được gộp vào khách hàng` : ""}.</p>
      <div className="admin-field"><label htmlFor="customer-order-search">Tìm khách hàng theo email hoặc tên</label><input id="customer-order-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập email hoặc tên…" /></div>
      <details className="admin-filter-panel"><summary>Lọc tổng tiền và sắp xếp khách hàng{min || max || sort !== "count" ? " · Đang áp dụng" : ""}</summary><div className="admin-form-grid">
        <div className="admin-field"><label htmlFor="customer-total-min">Tổng giá trị từ (đ)</label><input id="customer-total-min" type="number" min="0" value={min} onChange={(event) => setMin(event.target.value)} /></div>
        <div className="admin-field"><label htmlFor="customer-total-max">Tổng giá trị đến (đ)</label><input id="customer-total-max" type="number" min="0" value={max} onChange={(event) => setMax(event.target.value)} /></div>
        <div className="admin-field"><label htmlFor="customer-sort">Sắp xếp khách hàng</label><select id="customer-sort" value={sort} onChange={(event) => setSort(event.target.value)}><option value="count">Nhiều đơn nhất</option><option value="total">Tổng giá trị cao nhất</option><option value="paid">Đã thanh toán cao nhất</option><option value="name">Tên A–Z</option></select></div>
      </div></details>
      <button className="admin-btn" onClick={() => { setSearch(""); setMin(""); setMax(""); setSort("count"); }}>Xóa bộ lọc khách hàng</button>
      {invalidMoneyRange(min, max) && <p className="admin-error" role="alert">Khoảng tiền chưa hợp lệ.</p>}
      <div className="admin-card admin-customer-order-scroll"><table className="admin-table"><thead><tr><th>Khách hàng</th><th>Số đơn</th><th>Tổng giá trị</th><th>Đã thanh toán</th><th>Chưa thu</th><th /></tr></thead><tbody>{visible.map((item) => <tr key={item.email}>
        <td><strong>{item.email}</strong><br /><small>{item.name}</small></td><td>{item.orderCount}{item.cancelledCount > 0 && <small className="order-summary-note">{item.cancelledCount} đơn hủy</small>}{item.quoteCount > 0 && <small className="order-summary-note">{item.quoteCount} đơn chờ báo giá</small>}</td><td>{formatVnd(item.total)}</td><td>{formatVnd(item.paid)}</td><td>{formatVnd(item.awaitingPayment)}</td><td><button className="admin-btn" onClick={() => onViewOrders(item.email, orders)}>Xem đơn của {item.email}</button></td>
      </tr>)}</tbody></table>{!visible.length && <p className="admin-muted">Không có khách hàng phù hợp.</p>}</div>
      <p className="admin-muted">Số đơn gồm cả đơn hủy. Các cột tiền chỉ tính tạm tính sản phẩm của đơn chưa hủy, chưa gồm phí giao hàng; đơn chờ báo giá chưa cộng vào tiền. COD chưa thu tiền vẫn nằm trong “Chưa thu”. “Đã thanh toán” dựa trên ô xác nhận nhận tiền của admin.</p>
    </>}
  </div>;
}
