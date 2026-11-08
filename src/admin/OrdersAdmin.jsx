import OrderTrackingSettings from "./OrderTrackingSettings";
import { ORDER_STATUSES as STATUSES } from "../lib/order-tracking";
import { orderProductName } from "../lib/product-options";
import OrderActivity from "./OrderActivity";
import OrderMailHistory from "./OrderMailHistory";
import OrderEmails from "./OrderEmails";
import ModalDialog from "../components/ModalDialog";
import OutlookCheck from "./OutlookCheck";
import MailPreviewDialog from "./MailPreviewDialog";
import { mailActorLabel } from "../lib/mail-templates";
import { EMPTY_ORDER_FILTERS, filterOrderDetails, invalidMoneyRange } from "../lib/order-filters";
import OrderCustomers from "./OrderCustomers";
import { orderPaymentLabel } from "../lib/order-summary";
import { useEffect, useRef, useState } from "react";
import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "../lib/commerce";
import { orderRequest, MAIL_STATES } from "./order-api";
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
export default function OrdersAdmin({ onOpenEmailTemplates, initialMailDraft, refreshKey = 0, pendingRequest, onOrderChanged }) {
  const [mailPreview, setMailPreview] = useState(null);
  const [filters, setFilters] = useState(EMPTY_ORDER_FILTERS);
  const [customerEmail, setCustomerEmail] = useState("");
  const [view, setView] = useState(initialMailDraft?.purpose === "automation" ? "automation" : "orders");
  const [openedViews, setOpenedViews] = useState(initialMailDraft?.purpose === "automation" ? ["orders", "automation"] : ["orders"]);
  const navigate = (key) => { setOpenedViews((items) => items.includes(key) ? items : [...items, key]); setView(key); };
  const [mailRevision, setMailRevision] = useState(0);
  const [composer, setComposer] = useState(initialMailDraft && initialMailDraft.purpose !== "automation" ? { draft: initialMailDraft } : null);
  const [detailTab, setDetailTab] = useState("summary");
  const [page, setPage] = useState(1);
  const [lastFilterKey, setLastFilterKey] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(pendingRequest ? "new" : "all");
  const [lastPendingRequest, setLastPendingRequest] = useState(pendingRequest);
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);
  const extended = useRef(false);
  const workRevision = useRef(0);
  const working = useRef(false);
  const sequence = useRef({ value: 0 });
  if (lastPendingRequest !== pendingRequest) {
    setLastPendingRequest(pendingRequest);
    if (pendingRequest) { setView("orders"); setStatusFilter("new"); setSearch(""); setCustomerEmail(""); setFilters(EMPTY_ORDER_FILTERS); }
  }
  useEffect(() => { const tracker = sequence.current; return () => { tracker.value++; }; }, []);
  useEffect(() => {
    let alive = true; const startedRevision = workRevision.current;
    orderRequest().then((data) => {
      if (!alive) return;
      setOrders((items) => {
        // A background read must not overwrite a status/payment change in progress.
        const protectLoaded = working.current || startedRevision !== workRevision.current;
        const merged = new Map(items.map((item) => [item.id, item]));
        data.orders.forEach((item) => { if (!protectLoaded || !merged.has(item.id)) merged.set(item.id, item); });
        return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
      });
      if (!extended.current) setCursor(data.nextCursor);
      setReady(true);
    }).catch((error) => { if (alive) setNotice({ error: true, text: error.message }); });
    return () => { alive = false; };
  }, [refreshKey]);
  const perform = async (work) => {
    if (working.current) return;
    working.current = true; workRevision.current++; setBusy(true); setNotice(null);
    try { await work(); }
    catch (error) { setNotice({ error: true, text: error.message }); }
    finally { working.current = false; workRevision.current++; setBusy(false); }
  };
  const showDetail = async (order) => {
    const current = ++sequence.current.value;
    setDetail({ order, mails: [], activities: [], nextActivityCursor: null, loading: true });
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
    try { const result = await orderRequest({ id: order.id, ...patch }); if (result.inventory) patchLocal(order.id, { inventory: result.inventory });
      if (result.activity) setDetail((value) => value?.order.id === order.id ? { ...value, activities: [result.activity, ...(value.activities || []).filter((item) => item.id !== result.activity.id)] } : value);
      onOrderChanged?.(); setNotice({ text: result.message }); }
    catch (error) { patchLocal(order.id, previous); throw error; }
  });
  const selected = detail?.order;
  const query = search.trim().toLocaleLowerCase("vi");
  const visibleOrders = filterOrderDetails(orders.filter((order) => (statusFilter === "all" || order.status === statusFilter) && (!customerEmail || String(order.customer.email || "").trim().toLowerCase() === customerEmail) && [order.id, order.code, order.customer.name, order.customer.phone, order.customer.email, orderProductName(order.product)].some((value) => String(value || "").toLocaleLowerCase("vi").includes(query))), filters);
  const filterKey = JSON.stringify([search, statusFilter, customerEmail, filters]);
  if (filterKey !== lastFilterKey) { setLastFilterKey(filterKey); setPage(1); }
  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / 10));
  const activePage = Math.min(page, pageCount);
  const pageOrders = visibleOrders.slice((activePage - 1) * 10, activePage * 10);
  return <section>
    <div className="admin-top"><div><h1>Đơn hàng</h1><p className="admin-muted">Chọn một đơn để xem thông tin người mua, thanh toán và lịch sử gửi thư.</p></div>{view === "orders" && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { const data = await orderRequest(); extended.current = false; setOrders(data.orders); setCursor(data.nextCursor); setReady(true); onOrderChanged?.(); })}>Tải lại</button>}</div>
    <nav className="admin-section-tabs" aria-label="Các mục đơn hàng">{[["orders", "Danh sách đơn"], ["customers", "Khách hàng"], ["history", "Lịch sử email"], ["automation", "Thư tự động"], ["tracking", "Chữ trang tra cứu"]].map(([key, label]) => <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => navigate(key)}>{label}</button>)}</nav>
    {openedViews.includes("tracking") && <div hidden={view !== "tracking"}><OrderTrackingSettings /></div>}
    {openedViews.includes("automation") && <div hidden={view !== "automation"}><OrderEmails initialDraft={initialMailDraft?.purpose === "automation" ? initialMailDraft : null} onManageTemplates={onOpenEmailTemplates} /></div>}
    {openedViews.includes("history") && <div hidden={view !== "history"}><OrderMailHistory refreshKey={mailRevision} onReuse={(draft, original) => setComposer({ draft, reused: true, original })} /></div>}
    {openedViews.includes("customers") && <div hidden={view !== "customers"}><OrderCustomers onViewOrders={(email, allOrders) => { setOrders(allOrders); setCursor(null); setSearch(email); setFilters(EMPTY_ORDER_FILTERS); setCustomerEmail(email); setStatusFilter("all"); sequence.current.value++; setDetail(null); setReady(true); setView("orders"); }} /></div>}
    <div hidden={view !== "orders"}>
    {notice && !selected && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    {!ready ? <p className="admin-muted">Đang chờ dữ liệu đơn hàng.</p> : <>
      <div className="order-status-tabs" role="group" aria-label="Lọc trạng thái đơn hàng">{[["all", "Tất cả"], ...Object.entries(STATUSES)].map(([key, label]) => <button key={key} type="button" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{label}<span>{key === "all" ? orders.length : orders.filter((order) => order.status === key).length}</span></button>)}</div>
      <div className="admin-order-toolbar">
        <div className="admin-field"><label htmlFor="order-search">Tìm đơn hàng</label><input id="order-search" type="search" placeholder="Mã/ID đơn, tên, điện thoại hoặc email" value={search} onChange={(event) => { setSearch(event.target.value); setCustomerEmail(""); }} /></div>

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
      {cursor && <button type="button" className="admin-btn" disabled={busy} onClick={() => perform(async () => {
        extended.current = true;
        const items = new Map(orders.map((order) => [order.id, order])); const seen = new Set(); let next = cursor;
        while (next) {
          if (seen.has(next)) throw new Error("Không tải đủ đơn hàng. Vui lòng tải lại.");
          seen.add(next); const page = await orderRequest(null, { cursor: next });
          page.orders.forEach((order) => items.set(order.id, order)); next = page.nextCursor;
          setOrders([...items.values()]); setCursor(next);
        }
      })}>Tải toàn bộ đơn để lọc</button>}
      </details>
      {(search || customerEmail || statusFilter !== "all" || Object.keys(EMPTY_ORDER_FILTERS).some((key) => filters[key] !== EMPTY_ORDER_FILTERS[key])) && <button type="button" className="admin-btn" onClick={() => { setFilters(EMPTY_ORDER_FILTERS); setSearch(""); setCustomerEmail(""); setStatusFilter("all"); }}>Xóa bộ lọc đơn</button>}
      {(invalidMoneyRange(filters.min, filters.max) || (filters.from && filters.to && filters.from > filters.to)) && <p className="admin-error" role="alert">Khoảng tiền hoặc khoảng ngày chưa hợp lệ.</p>}
      <p className="admin-muted">Hiển thị {visibleOrders.length} / {orders.length} đơn đã tải{cursor ? ". Tải thêm để tìm trong các đơn cũ hơn." : "."}</p>
      <div className="admin-card admin-order-list-scroll"><table className="admin-table"><thead><tr><th>Mã đơn / Ngày đặt</th><th>Người mua</th><th>Giá trị đơn</th><th>Trạng thái</th><th>Thanh toán</th><th>Thư xác nhận</th><th /></tr></thead><tbody>
        {pageOrders.map((order) => <tr key={order.id}><td data-label="Mã đơn"><strong>{order.code}</strong><br /><small>{date(order.createdAt)}</small></td><td data-label="Người mua">{order.customer.name}<small className="order-summary-note">{order.customer.phone}</small></td><td data-label="Giá trị đơn">{order.totalAmount != null ? formatVnd(order.totalAmount) : order.subtotal != null ? <>{formatVnd(order.subtotal)}<small className="order-summary-note">Chưa chốt phí ship</small></> : "Cần báo giá"}</td><td data-label="Trạng thái"><span className={`order-state-badge ${order.status}`}>{STATUSES[order.status] || order.status}</span></td><td data-label="Thanh toán">{orderPaymentLabel(order)}</td><td data-label="Thư xác nhận">{MAIL_STATES[order.confirmationMail?.state] || "Chưa có lịch sử"}</td><td><button className="admin-btn" type="button" aria-label={`Xem đơn ${order.code}`} aria-expanded={selected?.id === order.id} onClick={() => { setDetailTab("summary"); showDetail(order); }}>Xem chi tiết</button></td></tr>)}
      </tbody></table>{!visibleOrders.length && <p className="admin-muted">{orders.length ? "Không có đơn phù hợp với bộ lọc." : "Chưa có đơn hàng."}</p>}</div>
      {pageCount > 1 && <div className="admin-pagination" aria-label="Phân trang đơn hàng"><span>Trang {activePage} / {pageCount} · {visibleOrders.length} đơn phù hợp</span><div className="admin-actions"><button type="button" className="admin-btn" disabled={activePage <= 1} onClick={() => setPage(activePage - 1)}>Trang trước</button><button type="button" className="admin-btn" disabled={activePage >= pageCount} onClick={() => setPage(activePage + 1)}>Trang sau</button></div></div>}
      {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { extended.current = true; const data = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...data.orders].map((item) => [item.id, item])).values()]); setCursor(data.nextCursor); })}>Tải thêm đơn</button>}
    </>}
    {selected && <ModalDialog title={`Đơn ${selected.code}`} className="admin-order-modal" onClose={() => { sequence.current.value++; setDetail(null); }}><article className="admin-order-detail" aria-label={`Chi tiết đơn ${selected.code}`}>
      {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
      <div className="order-detail-heading"><span className={`order-state-badge ${selected.status}`}>{STATUSES[selected.status] || selected.status}</span><span className="admin-muted">{date(selected.createdAt)}</span><button type="button" className="admin-btn primary" disabled={detail.loading || !selected.customer.email} onClick={() => { setComposer({ orderId: selected.id }); sequence.current.value++; setDetail(null); }}>Gửi email cho khách</button></div>
      <nav className="admin-section-tabs" aria-label="Chi tiết đơn hàng"><button type="button" aria-current={detailTab === "summary" ? "page" : undefined} onClick={() => setDetailTab("summary")}>Thông tin & xử lý</button><button type="button" aria-current={detailTab === "emails" ? "page" : undefined} onClick={() => setDetailTab("emails")}>Email của đơn ({detail.mails.length})</button><button type="button" aria-current={detailTab === "activity" ? "page" : undefined} onClick={() => setDetailTab("activity")}>Nhật ký xử lý</button></nav>
      <div hidden={detailTab !== "summary"}>
      <div className="admin-form-grid order-detail-grid"><div><h3>Thông tin người mua</h3><p>{selected.customer.name}</p><p><a href={`tel:${selected.customer.phone}`}>{selected.customer.phone}</a></p><p>{selected.customer.email ? <a href={`mailto:${selected.customer.email}`}>{selected.customer.email}</a> : "Đơn cũ chưa có email"}</p><p className="order-preserve-text">{selected.customer.address}</p><p className="order-preserve-text">Ghi chú: {selected.customer.note || "—"}</p></div>
      <div><h3>Sản phẩm và thanh toán</h3><p>{orderProductName(selected.product)} × {selected.quantity}</p><p>Đơn giá: {formatProductPrice(selected.product.priceText) || "Cần báo giá"}</p><p>Tạm tính: {selected.subtotal === null ? "Cần báo giá" : formatVnd(selected.subtotal)}</p><p>Phí giao hàng: {selected.shippingFee == null ? "Xác nhận sau" : formatVnd(selected.shippingFee)}</p><p>Tổng tiền: {selected.totalAmount == null ? "Chưa chốt tổng tiền" : formatVnd(selected.totalAmount)}</p><p>Phương thức: {PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod}</p><p>Thanh toán: {orderPaymentLabel(selected)}</p><label className="admin-check"><input type="checkbox" checked={selected.paymentStatus === "paid"} disabled={busy || detail.loading} onChange={(event) => update(selected, { paymentStatus: event.target.checked ? "paid" : "unpaid" })} />Đã thanh toán</label></div></div>
      <p className="admin-muted">Khách có thể xem trạng thái này tại trang Tra cứu đơn hàng bằng mã đơn hoặc số điện thoại đã đặt.</p>
      <fieldset className="order-status-options" disabled={busy || detail.loading || selected.status === "cancelled"}><legend>Trạng thái xử lý đơn</legend>{Object.entries(STATUSES).map(([key, label]) => <label key={key}><input type="radio" name={`status-${selected.id}`} checked={selected.status === key} onChange={() => update(selected, { status: key })} />{label}</label>)}</fieldset>
      <p className="admin-muted">Chọn Hoàn tất sẽ ghi nhận đã thanh toán. Đổi sang trạng thái khác không tự xóa ghi nhận tiền; dùng ô Đã thanh toán để điều chỉnh.</p>
      <details className="admin-filter-panel"><summary>Quy tắc tồn kho & mã lưu trữ</summary><p className="admin-muted">ID: {selected.id}</p><p className="admin-muted">Đơn chờ giữ số lượng, chưa trừ tồn thực tế. Xác nhận thanh toán, bắt đầu giao hoặc Hoàn tất sẽ trừ kho một lần. Hủy đơn chưa xuất giải phóng hàng chờ; đơn đã xuất chỉ hoàn kho khi xác nhận nhận lại hàng.</p></details>
      {selected.status === "cancelled" && selected.inventory?.state === "deducted" && <button type="button" className="admin-btn" disabled={busy} onClick={() => {
        if (!window.confirm("Bạn đã thực tế nhận lại đủ hàng của đơn này? Xác nhận sẽ cộng lại số lượng vào kho một lần.")) return;
        perform(async () => { const result = await orderRequest({ action: "restockOrder", id: selected.id }); await showDetail(selected); onOrderChanged?.(); setNotice({ text: result.message }); });
      }}>Đã nhận hàng trả — Hoàn kho</button>}
      {selected.inventory?.state === "restocked" && <p className="admin-muted">Đã nhận hàng trả và hoàn kho.</p>}
      </div><div hidden={detailTab !== "emails"}><h3>Lịch sử email của đơn</h3>
      <div className="admin-actions"><button type="button" className="admin-btn" onClick={() => showDetail(selected)}>Tải lại lịch sử</button></div>
      {detail.loading ? <p>Đang tải chi tiết…</p> : !detail.mails.length ? <p className="admin-muted">Chưa có lịch sử gửi thư.</p> : detail.mails.map((mail) => <div className="order-mail-event" key={mail.id}><button type="button" className="admin-template-link" onClick={() => setMailPreview(mail)}>{mail.subject} · {MAIL_STATES[mail.state] || mail.state}</button><p>{mailActorLabel(mail)} · {date(mail.createdAt)}</p><OutlookCheck outlook={mail.outlook} label={`${selected.code} · ${mail.recipient}`} check={() => orderRequest({ action: "checkOrderOutlook", id: selected.id, eventId: mail.id })} /></div>)}
      <p className="admin-muted">“Đã nhận” là chấp nhận yêu cầu gửi, chưa bảo đảm thư vào hộp thư khách. Chỉ đánh dấu thanh toán sau khi kiểm tra tiền thực nhận.</p>
    </div><div hidden={detailTab !== "activity"}><OrderActivity activities={detail.activities} nextCursor={detail.nextActivityCursor} loading={detail.loading || busy} statuses={STATUSES} onReload={() => showDetail(selected)} onMore={() => {
      const id = selected.id; const requestSequence = sequence.current.value;
      perform(async () => {
        const data = await orderRequest(null, { id, activityCursor: detail.nextActivityCursor });
        if (sequence.current.value !== requestSequence) return;
        setDetail((value) => value?.order.id === id ? { ...value, activities: [...new Map([...(value.activities || []), ...data.activities].map((item) => [item.id, item])).values()], nextActivityCursor: data.nextActivityCursor } : value);
      });
    }} /></div></article></ModalDialog>}
    </div>
    {composer && <ModalDialog title="Gửi email đơn hàng" className="admin-order-modal" onClose={() => setComposer(null)}>{composer.reused && <p className="admin-context-note">{composer.original ? "Đã chép mẫu vào thư mới. Chọn đơn và kiểm tra nội dung trước khi gửi." : "Nội dung được chép từ thư cũ. Kiểm tra lại tên khách, mã đơn, địa chỉ và số tiền trước khi gửi."}</p>}<OrderEmails purpose="send" initialDraft={composer.draft} initialOrderId={composer.orderId || ""} onSent={(order) => { patchLocal(order.id, order); setMailRevision((value) => value + 1); }} onManageTemplates={onOpenEmailTemplates ? () => { setComposer(null); onOpenEmailTemplates(); } : undefined} /></ModalDialog>}
    {mailPreview && <MailPreviewDialog title="Thư của đơn hàng" message={mailPreview} onClose={() => setMailPreview(null)} metadata={<><p>Gửi tới: {mailPreview.recipient}</p><p>Tài khoản thao tác: {mailActorLabel(mailPreview)}</p>{mailPreview.errorCode && <p className="admin-error">Mã lỗi: {mailPreview.errorCode}{mailPreview.errorMessage ? ` · ${mailPreview.errorMessage}` : ""}</p>}</>} />}
  </section>;
}
