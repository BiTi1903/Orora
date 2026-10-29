import OutlookCheck from "./OutlookCheck";
import MailPreviewDialog from "./MailPreviewDialog";
import { mailActorLabel } from "../lib/mail-templates";
import { EMPTY_ORDER_FILTERS, filterOrderDetails, invalidMoneyRange } from "../lib/order-filters";
import OrderCustomers from "./OrderCustomers";
import { orderPaymentLabel } from "../lib/order-summary";
import { useEffect, useRef, useState } from "react";
import { PAYMENT_LABELS, formatVnd } from "../lib/commerce";
import { orderRequest, MAIL_STATES } from "./order-api";
const STATUSES = { new: "Mới nhận", confirmed: "Đã xác nhận", shipping: "Đang giao", completed: "Hoàn tất", cancelled: "Đã hủy" };
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
export default function OrdersAdmin({ onOpenEmailMarketing }) {
  const [mailPreview, setMailPreview] = useState(null);
  const [filters, setFilters] = useState(EMPTY_ORDER_FILTERS);
  const [customerEmail, setCustomerEmail] = useState("");
  const [view, setView] = useState("orders");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
    if (patch.status === "completed") patch = { ...patch, paymentStatus: "paid" };
    const previous = Object.fromEntries(Object.keys(patch).map((key) => [key, order[key]]));
    patchLocal(order.id, patch);
    try { const result = await orderRequest({ id: order.id, ...patch }); setNotice({ text: result.message }); }
    catch (error) { patchLocal(order.id, previous); throw error; }
  });
  const selected = detail?.order;
  const query = search.trim().toLocaleLowerCase("vi");
  const visibleOrders = filterOrderDetails(orders.filter((order) => (statusFilter === "all" || order.status === statusFilter) && (!customerEmail || String(order.customer.email || "").trim().toLowerCase() === customerEmail) && [order.id, order.code, order.customer.name, order.customer.phone, order.customer.email].some((value) => String(value || "").toLocaleLowerCase("vi").includes(query))), filters);
  return <section>
    <div className="admin-top"><div><h1>Đơn hàng</h1><p className="admin-muted">Chọn một đơn để xem thông tin người mua, thanh toán và lịch sử gửi thư.</p></div>{view === "orders" && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { const data = await orderRequest(); setOrders(data.orders); setCursor(data.nextCursor); setReady(true); })}>Tải lại</button>}</div>
    <nav className="admin-section-tabs" aria-label="Các mục đơn hàng"><button type="button" aria-current={view === "orders" ? "page" : undefined} onClick={() => setView("orders")}>Danh sách đơn</button><button type="button" aria-current={view === "customers" ? "page" : undefined} onClick={() => setView("customers")}>Khách hàng theo email</button></nav>
    {view === "customers" && <OrderCustomers onViewOrders={(email, allOrders) => { setOrders(allOrders); setCursor(null); setSearch(email); setFilters(EMPTY_ORDER_FILTERS); setCustomerEmail(email); setStatusFilter("all"); sequence.current.value++; setDetail(null); setReady(true); setView("orders"); }} />}
    <div hidden={view !== "orders"}>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    {!ready ? <p className="admin-muted">Đang chờ dữ liệu đơn hàng.</p> : <>
      <div className="admin-order-toolbar">
        <div className="admin-field"><label htmlFor="order-search">Tìm đơn hàng</label><input id="order-search" type="search" placeholder="Mã/ID đơn, tên, điện thoại hoặc email" value={search} onChange={(event) => { setSearch(event.target.value); setCustomerEmail(""); }} /></div>
        <div className="admin-field"><label htmlFor="order-filter">Trạng thái đơn</label><select id="order-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Tất cả trạng thái</option>{Object.entries(STATUSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
      </div>
      <details className="admin-filter-panel"><summary>Bộ lọc nâng cao{Object.keys(EMPTY_ORDER_FILTERS).some((key) => filters[key] !== EMPTY_ORDER_FILTERS[key]) ? " · Đang áp dụng" : ""}</summary>
        <div className="admin-form-grid">
          {[["min", "Từ số tiền (đ)"], ["max", "Đến số tiền (đ)"]].map(([key, label]) => <div className="admin-field" key={key}><label htmlFor={`order-filter-${key}`}>{label}</label><input id={`order-filter-${key}`} type="number" min="0" step="1" value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} /></div>)}
          {[["from", "Từ ngày đặt"], ["to", "Đến ngày đặt"]].map(([key, label]) => <div className="admin-field" key={key}><label htmlFor={`order-filter-${key}`}>{label}</label><input id={`order-filter-${key}`} type="date" value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} /></div>)}
          <div className="admin-field"><label htmlFor="order-filter-payment">Thanh toán</label><select id="order-filter-payment" value={filters.payment} onChange={(event) => setFilters({ ...filters, payment: event.target.value })}><option value="all">Tất cả thanh toán</option><option value="paid">Đã thanh toán</option><option value="unpaid">Chưa thu tiền</option></select></div>
          <div className="admin-field"><label htmlFor="order-filter-method">Phương thức thanh toán</label><select id="order-filter-method" value={filters.method} onChange={(event) => setFilters({ ...filters, method: event.target.value })}><option value="all">Tất cả phương thức</option>{Object.entries(PAYMENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
          <div className="admin-field"><label htmlFor="order-filter-sort">Sắp xếp đơn</label><select id="order-filter-sort" value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value })}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="amountDesc">Số tiền cao đến thấp</option><option value="amountAsc">Số tiền thấp đến cao</option></select></div>
        </div>
        <p className="admin-muted">Khoảng tiền tính theo tạm tính sản phẩm, chưa gồm phí giao hàng. Đơn chờ báo giá không thuộc khoảng tiền; ngày tính theo giờ Việt Nam.</p>
      </details>
      <button type="button" className="admin-btn" onClick={() => { setFilters(EMPTY_ORDER_FILTERS); setSearch(""); setCustomerEmail(""); setStatusFilter("all"); }}>Xóa bộ lọc đơn</button>
      {cursor && <button type="button" className="admin-btn" disabled={busy} onClick={() => perform(async () => {
        const items = new Map(orders.map((order) => [order.id, order])); const seen = new Set(); let next = cursor;
        while (next) {
          if (seen.has(next)) throw new Error("Không tải đủ đơn hàng. Vui lòng tải lại.");
          seen.add(next); const page = await orderRequest(null, { cursor: next });
          page.orders.forEach((order) => items.set(order.id, order)); next = page.nextCursor;
          setOrders([...items.values()]); setCursor(next);
        }
      })}>Tải toàn bộ đơn để lọc</button>}
      {(invalidMoneyRange(filters.min, filters.max) || (filters.from && filters.to && filters.from > filters.to)) && <p className="admin-error" role="alert">Khoảng tiền hoặc khoảng ngày chưa hợp lệ.</p>}
      <p className="admin-muted">Hiển thị {visibleOrders.length} / {orders.length} đơn đã tải{cursor ? ". Tải thêm để tìm trong các đơn cũ hơn." : "."}</p>
      <div className="admin-card admin-order-list-scroll"><table className="admin-table"><thead><tr><th>Mã đơn / Ngày đặt</th><th>Người mua</th><th>Tạm tính</th><th>Trạng thái</th><th>Thanh toán</th><th>Thư xác nhận</th><th /></tr></thead><tbody>
        {visibleOrders.map((order) => <tr key={order.id}><td data-label="Mã đơn"><strong>{order.code}</strong><br /><small>{date(order.createdAt)}</small></td><td data-label="Người mua">{order.customer.name}</td><td data-label="Tạm tính">{order.subtotal === null ? "Cần báo giá" : formatVnd(order.subtotal)}</td><td data-label="Trạng thái"><label className="order-status-check"><input type="checkbox" aria-label={`Xác nhận đơn ${order.code}`} checked={["confirmed", "shipping", "completed"].includes(order.status)} disabled={busy || detail?.loading || !["new", "confirmed"].includes(order.status)} onChange={(event) => update(order, { status: event.target.checked ? "confirmed" : "new" })} /><span>{STATUSES[order.status] || order.status}</span></label></td><td data-label="Thanh toán">{orderPaymentLabel(order)}</td><td data-label="Thư xác nhận">{MAIL_STATES[order.confirmationMail?.state] || "Chưa có lịch sử"}</td><td><button className="admin-btn" type="button" aria-label={`Xem đơn ${order.code}`} aria-expanded={selected?.id === order.id} onClick={() => showDetail(order)}>Xem chi tiết</button></td></tr>)}
      </tbody></table>{!visibleOrders.length && <p className="admin-muted">{orders.length ? "Không có đơn phù hợp với bộ lọc." : "Chưa có đơn hàng."}</p>}</div>
      {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { const data = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...data.orders].map((item) => [item.id, item])).values()]); setCursor(data.nextCursor); })}>Tải thêm đơn</button>}
    </>}
    {selected && <article className="admin-card admin-order-detail" ref={panel} aria-label={`Chi tiết đơn ${selected.code}`}>
      <div className="admin-order-heading"><h2>Đơn {selected.code}</h2><button type="button" className="admin-btn" onClick={() => { sequence.current.value++; setDetail(null); }}>Đóng chi tiết</button></div>
      <p className="admin-muted">Đặt lúc {date(selected.createdAt)}</p><p className="admin-muted">ID: {selected.id}</p>
      <div className="admin-form-grid order-detail-grid"><div><h3>Thông tin người mua</h3><p>{selected.customer.name}</p><p><a href={`tel:${selected.customer.phone}`}>{selected.customer.phone}</a></p><p>{selected.customer.email ? <a href={`mailto:${selected.customer.email}`}>{selected.customer.email}</a> : "Đơn cũ chưa có email"}</p><p className="order-preserve-text">{selected.customer.address}</p><p className="order-preserve-text">Ghi chú: {selected.customer.note || "—"}</p></div>
      <div><h3>Sản phẩm và thanh toán</h3><p>{selected.product.name} × {selected.quantity}</p><p>Đơn giá: {selected.product.priceText || "Cần báo giá"}</p><p>Tạm tính: {selected.subtotal === null ? "Cần báo giá" : formatVnd(selected.subtotal)}</p><p>Phí giao hàng: {selected.shippingFee == null ? "Xác nhận sau" : formatVnd(selected.shippingFee)}</p><p>Phương thức: {PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</p><p>Thanh toán: {orderPaymentLabel(selected)}</p><label className="admin-check"><input type="checkbox" checked={selected.paymentStatus === "paid"} disabled={busy || detail.loading} onChange={(event) => update(selected, { paymentStatus: event.target.checked ? "paid" : "unpaid" })} />Đã thanh toán</label></div></div>
      <fieldset className="order-status-options" disabled={busy || detail.loading}><legend>Trạng thái xử lý đơn</legend>{Object.entries(STATUSES).map(([key, label]) => <label key={key}><input type="radio" name={`status-${selected.id}`} checked={selected.status === key} onChange={() => update(selected, { status: key })} />{label}</label>)}</fieldset>
      <p className="admin-muted">Chọn Hoàn tất sẽ ghi nhận đã thanh toán. Đổi sang trạng thái khác không tự xóa ghi nhận tiền; dùng ô Đã thanh toán để điều chỉnh.</p>
      <h3>Lịch sử email của đơn</h3>
      <div className="admin-actions"><button type="button" className="admin-btn" onClick={() => showDetail(selected)}>Tải lại lịch sử</button>{onOpenEmailMarketing && <button className="admin-btn" type="button" onClick={onOpenEmailMarketing}>Mẫu thư và gửi thư trong Email marketing</button>}</div>
      {detail.loading ? <p>Đang tải chi tiết…</p> : !detail.mails.length ? <p className="admin-muted">Chưa có lịch sử gửi thư.</p> : detail.mails.map((mail) => <div className="order-mail-event" key={mail.id}><button type="button" className="admin-template-link" onClick={() => setMailPreview(mail)}>{mail.subject} · {MAIL_STATES[mail.state] || mail.state}</button><p>{mailActorLabel(mail)} · {date(mail.createdAt)}</p><OutlookCheck outlook={mail.outlook} label={`${selected.code} · ${mail.recipient}`} check={() => orderRequest({ action: "checkOrderOutlook", id: selected.id, eventId: mail.id })} /></div>)}
      <p className="admin-muted">“MS đã nhận” là chấp nhận yêu cầu gửi, chưa bảo đảm thư vào hộp thư khách. Chỉ đánh dấu thanh toán sau khi kiểm tra tiền thực nhận.</p>
    </article>}
    </div>
    {mailPreview && <MailPreviewDialog title="Thư của đơn hàng" message={mailPreview} onClose={() => setMailPreview(null)} metadata={<><p>Gửi tới: {mailPreview.recipient}</p><p>Tài khoản thao tác: {mailActorLabel(mailPreview)}</p>{mailPreview.errorCode && <p className="admin-error">Mã lỗi: {mailPreview.errorCode}{mailPreview.errorMessage ? ` · ${mailPreview.errorMessage}` : ""}</p>}</>} />}
  </section>;
}
