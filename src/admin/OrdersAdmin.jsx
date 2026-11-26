import { NEXT_ORDER_STATUSES } from "../lib/order-flow";
import { useConfirm } from "./confirm-context";
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
import { effectiveMailState } from "../lib/mail-state";
import { orderRequest, MAIL_STATES } from "./order-api";
import { fetchOrdersCached, getAdminCache, setAdminCache } from "./admin-cache";
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
const STATUS_RANK = { new: 0, confirmed: 1, shipping: 2, completed: 3, cancelled: 4 };
const QUICK_STATUS_ACTIONS = {
  new: [["confirmed", "Xác nhận đơn", true], ["shipping", "Giao ngay", false], ["cancelled", "Hủy đơn", false]],
  confirmed: [["shipping", "Bắt đầu giao", true], ["completed", "Hoàn tất đơn", false], ["cancelled", "Hủy đơn", false]],
  shipping: [["completed", "Hoàn tất đơn", true], ["cancelled", "Hủy đơn", false]],
  completed: [["cancelled", "Hủy đơn (khách trả hàng)", false]],
  cancelled: [],
};
export default function OrdersAdmin({ onOpenEmailTemplates, initialMailDraft, refreshKey = 0, pendingRequest, onOrderChanged, statusCounts, canUseNewsletter = true }) {
  const confirm = useConfirm();
  const cachedOrders = getAdminCache("orders");
  const [mailPreview, setMailPreview] = useState(null);
  const [filters, setFilters] = useState(EMPTY_ORDER_FILTERS);
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [customerEmail, setCustomerEmail] = useState("");
  const startAutomation = canUseNewsletter && initialMailDraft?.purpose === "automation";
  const [view, setView] = useState(startAutomation ? "automation" : "orders");
  const navigate = (key) => setView(key);
  const [mailRevision, setMailRevision] = useState(0);
  const [composer, setComposer] = useState(initialMailDraft && initialMailDraft.purpose !== "automation" ? { draft: initialMailDraft } : null);
  const [page, setPage] = useState(1);
  const [lastFilterKey, setLastFilterKey] = useState("");
  const [search, setSearch] = useState("");
  const [bouncedIds, setBouncedIds] = useState([]);
  const [mailFilter, setMailFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState(pendingRequest && !pendingRequest.allStatuses ? "new" : "all");
  const [lastPendingRequest, setLastPendingRequest] = useState(pendingRequest);
  const [orders, setOrders] = useState(() => cachedOrders?.orders || []);
  const [cursor, setCursor] = useState(() => cachedOrders?.nextCursor ?? null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(() => Boolean(cachedOrders));
  const [notice, setNotice] = useState(null);
  const [detail, setDetail] = useState(null);
  const extended = useRef(false);
  const workRevision = useRef(0);
  const working = useRef(false);
  const sequence = useRef({ value: 0 });
  if (lastPendingRequest !== pendingRequest) {
    setLastPendingRequest(pendingRequest);
    if (pendingRequest) { setView("orders"); setStatusFilter(pendingRequest?.allStatuses ? "all" : "new"); setSearch(""); setCustomerEmail(""); setFilters(EMPTY_ORDER_FILTERS); setMailFilter("all"); }
  }
  useEffect(() => { const tracker = sequence.current; return () => { tracker.value++; }; }, []);
  const mergeOrders = (incoming) => setOrders((items) => {
    const merged = new Map(items.map((item) => [item.id, item]));
    incoming.forEach((item) => merged.set(item.id, item));
    return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  });
  useEffect(() => {
    let alive = true; const startedRevision = workRevision.current;
    fetchOrdersCached({ force: refreshKey > 0 || Boolean(getAdminCache("orders")) }).then((data) => {
      if (!alive) return;
      setOrders((items) => {
        // A background read must not overwrite a status/payment change in progress.
        const protectLoaded = working.current || startedRevision !== workRevision.current;
        const merged = new Map(items.map((item) => [item.id, item]));
        data.orders.forEach((item) => { if (!protectLoaded || !merged.has(item.id)) merged.set(item.id, item); });
        const next = [...merged.values()].sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
        setAdminCache("orders", { orders: next, nextCursor: extended.current ? (getAdminCache("orders")?.nextCursor ?? null) : data.nextCursor });
        return next;
      });
      if (!extended.current) setCursor(data.nextCursor);
      setReady(true);
    }).catch((error) => { if (alive) setNotice({ error: true, text: error.message }); });
    return () => { alive = false; };
  }, [refreshKey]);
  useEffect(() => {
    if (statusFilter === "all") return;
    const controller = new AbortController();
    orderRequest(null, { status: statusFilter }, { signal: controller.signal }).then((data) => {
      if (!controller.signal.aborted && Array.isArray(data?.orders)) mergeOrders(data.orders);
    }).catch(() => {});
    return () => controller.abort();
  }, [statusFilter]);
  useEffect(() => {
    if (!pendingRequest?.allStatuses || !pendingRequest.id) return;
    const requestId = ++sequence.current.value;
    const controller = new AbortController();
    orderRequest(null, { id: pendingRequest.id }, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted && requestId === sequence.current.value) {
        setDetail({ ...data, loading: false });
      }
    }).catch(error => {
      if (!controller.signal.aborted && requestId === sequence.current.value) setNotice({ error: true, text: error.message });
    });
    return () => controller.abort();
  }, [pendingRequest]);
  const perform = async (work) => {
    if (working.current) return;
    working.current = true; workRevision.current++; setBusy(true); setNotice(null);
    try { await work(); }
    catch (error) { setNotice({ error: true, text: error.message }); }
    finally { working.current = false; workRevision.current++; setBusy(false); }
  };
  const searchOnServer = (raw = search) => {
    const keyword = String(raw || "").trim();
    if (!keyword) return;
    perform(async () => {
      const data = await orderRequest(null, { q: keyword });
      if (Array.isArray(data?.orders) && data.orders.length) {
        mergeOrders(data.orders);
        setNotice({ text: `Tìm thấy ${data.orders.length} đơn khớp trên máy chủ.` });
      } else {
        setNotice({ text: "Không tìm thấy thêm đơn nào trên máy chủ theo mã đơn / SĐT / email này." });
      }
    });
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
  const update = async (order, patch) => {
    if (patch.status === "cancelled" && order.status !== "cancelled") {
      if (!await confirm(`Hủy đơn ${order.code}? Đơn đã hủy không thể mở lại.`, { title: "Xác nhận hủy đơn", confirmLabel: "Hủy đơn", danger: true })) return;
    } else if (patch.status === "completed" && order.status !== "completed") {
      if (!await confirm(`Đánh dấu hoàn tất đơn ${order.code}? Thao tác này sẽ ghi nhận đã thanh toán, trừ kho (nếu chưa trừ) và không thể lùi trạng thái.`, { title: "Xác nhận hoàn tất đơn", confirmLabel: "Hoàn tất" })) return;
    }
    return perform(async () => {
      if (patch.status === "completed") patch = { ...patch, paymentStatus: "paid" };
      const previous = Object.fromEntries(Object.keys(patch).map((key) => [key, order[key]]));
      patchLocal(order.id, patch);
      try { const result = await orderRequest({ id: order.id, ...patch }); if (result.inventory) patchLocal(order.id, { inventory: result.inventory });
        if (result.activity) setDetail((value) => value?.order.id === order.id ? { ...value, activities: [result.activity, ...(value.activities || []).filter((item) => item.id !== result.activity.id)] } : value);
        onOrderChanged?.(); setNotice({ text: result.message }); }
      catch (error) { patchLocal(order.id, previous); throw error; }
    });
  };
  const quickResendMail = async (order) => {
    const state = effectiveMailState(order.confirmationMail);
    if (state === "stuck") {
      if (!await confirm(`Email đơn ${order.code} đang bị kẹt quá 5 phút. Bước này sẽ chuyển sang "Chưa rõ kết quả" (chưa gửi thêm email) để bạn kiểm tra Outlook trước khi bấm gửi lại.`, { title: "Gỡ kẹt email xác nhận", confirmLabel: "Chuyển sang Chưa rõ kết quả" })) return;
      return perform(async () => {
        const result = await orderRequest({ action: "sendOrderEmail", id: order.id, requestId: crypto.randomUUID(), recoverOnly: true });
        if (result.state && result.state !== "unchanged") patchLocal(order.id, { confirmationMail: { ...(order.confirmationMail || {}), state: result.state, updatedAt: Date.now() } });
        setMailRevision((v) => v + 1);
        if (detail?.order.id === order.id) await showDetail(order);
        onOrderChanged?.();
        setNotice({ error: result.state === "failed", text: result.message });
      });
    }
    if (state === "unknown") {
      if (!await confirm(`Kết quả gửi trước của đơn ${order.code} chưa rõ. Bạn đã kiểm tra thư đã gửi trên Outlook để tránh gửi trùng chưa?`, { title: "Xác nhận gửi lại email", confirmLabel: "Vẫn gửi lại" })) return;
    }
    return perform(async () => {
      const result = await orderRequest({ action: "sendOrderEmail", id: order.id, requestId: crypto.randomUUID(), confirmResend: state === "unknown" });
      if (result.state) patchLocal(order.id, { confirmationMail: { ...(order.confirmationMail || {}), state: result.state, updatedAt: Date.now() } });
      setMailRevision((v) => v + 1);
      if (detail?.order.id === order.id) await showDetail(order);
      onOrderChanged?.();
      setNotice({ error: result.state === "failed" || result.state === "unknown", text: result.message });
    });
  };
  const selected = detail?.order;
  const query = search.trim().toLocaleLowerCase("vi");
  useEffect(() => {
    if (mailFilter !== "error") return;
    const controller = new AbortController();
    orderRequest(null, { mailBounceSummary: "1" }, { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted) setBouncedIds((result.bounced || []).map(mail => mail.orderId));
    }).catch(() => {});
    return () => controller.abort();
  }, [mailFilter, mailRevision, refreshKey]);
  const matchesMail = order => {
    const state = effectiveMailState(order.confirmationMail);
    if (mailFilter === "error") return state === "failed" || state === "stuck" || state === "unknown" || bouncedIds.includes(order.id);
    if (mailFilter === "unsent") return state === "none" || state === "pending";
    return true;
  };
  const toggleSort = (col) => {
    if (sortCol === col) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(col);
      setSortDir(col === "date" || col === "amount" ? "desc" : "asc");
    }
  };
  const filteredOrders = filterOrderDetails(orders.filter((order) => matchesMail(order) && (statusFilter === "all" || order.status === statusFilter) && (!customerEmail || String(order.customer.email || "").trim().toLowerCase() === customerEmail) && [order.id, order.code, order.customer.name, order.customer.phone, order.customer.email, orderProductName(order.product)].some((value) => String(value || "").toLocaleLowerCase("vi").includes(query))), filters);
  const visibleOrders = [...filteredOrders].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1;
    const textCmp = (x, y) => String(x || "").localeCompare(String(y || ""), "vi", { sensitivity: "base" });
    let diff = 0;
    if (sortCol === "date") diff = (a.createdAt || 0) - (b.createdAt || 0);
    else if (sortCol === "customer") diff = textCmp(a.customer?.name, b.customer?.name);
    else if (sortCol === "product") diff = textCmp(orderProductName(a.product), orderProductName(b.product));
    else if (sortCol === "amount") diff = (a.totalAmount ?? a.subtotal ?? -1) - (b.totalAmount ?? b.subtotal ?? -1);
    else if (sortCol === "status") diff = (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99);
    else if (sortCol === "payment") diff = textCmp(orderPaymentLabel(a), orderPaymentLabel(b));
    else if (sortCol === "mail") diff = textCmp(MAIL_STATES[effectiveMailState(a.confirmationMail)], MAIL_STATES[effectiveMailState(b.confirmationMail)]);
    return diff !== 0 ? diff * dir : (b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  });
  const sortColumns = [
    ["date", "Mã đơn / Ngày đặt"],
    ["customer", "Người mua"],
    ["product", "Sản phẩm"],
    ["amount", "Giá trị đơn"],
    ["status", "Trạng thái"],
    ["payment", "Thanh toán"],
    ["mail", "Thư xác nhận"],
  ];
  const filterKey = JSON.stringify([search, statusFilter, customerEmail, filters, mailFilter]);
  if (filterKey !== lastFilterKey) { setLastFilterKey(filterKey); setPage(1); }
  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / 25));
  const activePage = Math.min(page, pageCount);
  const pageOrders = visibleOrders.slice((activePage - 1) * 25, activePage * 25);
  const sectionTabs = [
    ["orders", "Danh sách đơn"],
    ["customers", "Khách hàng"],
    ["history", "Lịch sử email"],
    ...(canUseNewsletter ? [["automation", "Thư tự động"]] : []),
  ];
  const [checkingAllMails, setCheckingAllMails] = useState(false);
  const [mailScanSummary, setMailScanSummary] = useState(null);
  const [metaDraft, setMetaDraft] = useState({ id: "", trackingCode: "", internalNote: "" });
  const activeMeta = selected
    ? (metaDraft.id === selected.id ? metaDraft : { id: selected.id, trackingCode: selected.trackingCode || "", internalNote: selected.internalNote || "" })
    : { id: "", trackingCode: "", internalNote: "" };
  const saveOrderMeta = () => {
    if (!selected) return;
    perform(async () => {
      const result = await orderRequest({ action: "updateOrderMeta", id: selected.id, trackingCode: activeMeta.trackingCode, internalNote: activeMeta.internalNote });
      patchLocal(selected.id, { trackingCode: result.trackingCode, internalNote: result.internalNote });
      setMetaDraft({ id: selected.id, trackingCode: result.trackingCode, internalNote: result.internalNote });
      setNotice({ text: result.message || "Đã lưu mã vận đơn và ghi chú nội bộ." });
    });
  };
  const exportCsv = () => {
    if (!visibleOrders.length) return setNotice({ error: true, text: "Không có đơn hàng nào để xuất CSV." });
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["Mã đơn", "Ngày đặt", "Trạng thái", "Khách hàng", "SĐT", "Email", "Địa chỉ", "Sản phẩm", "SL", "Tạm tính", "Phí ship", "Tổng tiền", "Phương thức", "Thanh toán", "Mã vận đơn", "Ghi chú khách", "Ghi chú nội bộ"];
    const rows = visibleOrders.map((o) => [
      o.code,
      date(o.createdAt),
      STATUSES[o.status] || o.status,
      o.customer?.name || "",
      o.customer?.phone || "",
      o.customer?.email || "",
      o.customer?.address || "",
      Array.isArray(o.items) && o.items.length > 1 ? o.items.map((it) => `${orderProductName(it)} x${it.quantity}`).join(" | ") : orderProductName(o.product),
      o.quantity ?? "",
      o.subtotal ?? "",
      o.shippingFee ?? "",
      o.totalAmount ?? "",
      PAYMENT_LABELS[o.paymentMethod] || o.paymentMethod || "",
      orderPaymentLabel(o),
      o.trackingCode || "",
      o.customer?.note || "",
      o.internalNote || "",
    ].map(esc).join(","));
    const csv = `\uFEFF${headers.map(esc).join(",")}\r\n${rows.join("\r\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orora-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice({ text: `Đã xuất ${visibleOrders.length} đơn hàng ra file CSV.` });
  };
  const checkAllMails = async () => {
    if (checkingAllMails || busy) return;
    setCheckingAllMails(true);
    setNotice(null);
    setMailScanSummary(null);
    try {
      const result = await orderRequest({ action: "checkAllOrderOutlook", limit: 20 });
      const newBouncedIds = [...new Set([...(bouncedIds || []), ...(result.bounced || []).map((item) => item.orderId)])];
      setBouncedIds(newBouncedIds);
      setMailScanSummary(result);
      setMailRevision((v) => v + 1);
      const hasIssues = (result.bounced?.length || 0) + (result.failed?.length || 0) + (result.delayed?.length || 0) > 0;
      setNotice({ error: hasIssues, text: result.message });
    } catch (error) {
      setNotice({ error: true, text: error.message });
    } finally {
      setCheckingAllMails(false);
    }
  };
  return <section aria-busy={busy || checkingAllMails}>
    <div className="admin-top"><div><h1>Đơn hàng</h1><p className="admin-muted">Tìm đơn theo mã, SĐT hoặc email; bấm vào tiêu đề cột để sắp xếp nhanh.</p></div>{view === "orders" && <div className="admin-actions"><button type="button" className="admin-btn" disabled={busy || !visibleOrders.length} onClick={exportCsv}>Xuất CSV ({visibleOrders.length})</button><button type="button" className="admin-btn" aria-busy={checkingAllMails} disabled={busy || checkingAllMails} onClick={checkAllMails}>{checkingAllMails ? "Đang kiểm tra mail…" : "Kiểm tra toàn bộ mail"}</button><button className="admin-btn" disabled={busy || checkingAllMails} onClick={() => perform(async () => { const data = await fetchOrdersCached({ force: true }); extended.current = false; setOrders(data.orders); setCursor(data.nextCursor); setReady(true); onOrderChanged?.(); })}>Tải lại</button></div>}</div>
    <nav className="admin-section-tabs" aria-label="Các mục đơn hàng">{sectionTabs.map(([key, label]) => <button key={key} type="button" aria-current={view === key ? "page" : undefined} onClick={() => navigate(key)}>{label}</button>)}</nav>
    {view === "automation" && canUseNewsletter && <OrderEmails canUseNewsletter={canUseNewsletter} initialDraft={initialMailDraft?.purpose === "automation" ? initialMailDraft : null} onManageTemplates={onOpenEmailTemplates} />}
    {view === "history" && <OrderMailHistory refreshKey={mailRevision} onReuse={(draft, original) => setComposer({ draft, reused: true, original })} />}
    {view === "customers" && <OrderCustomers onViewOrders={(email, allOrders) => { extended.current = true; setOrders(allOrders); setCursor(null); setSearch(email); setFilters(EMPTY_ORDER_FILTERS); setMailFilter("all"); setCustomerEmail(email); setStatusFilter("all"); sequence.current.value++; setDetail(null); setReady(true); setView("orders"); }} />}
    {view === "orders" && <>
    {notice && !selected && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}{mailScanSummary && ((mailScanSummary.bounced?.length || 0) + (mailScanSummary.failed?.length || 0) > 0) && mailFilter !== "error" && <>{" "}<button type="button" className="admin-btn" style={{ marginLeft: 8, minHeight: 28, padding: "2px 10px", fontSize: 12 }} onClick={() => setMailFilter("error")}>Lọc xem thư lỗi</button></>}</p>}
    {!ready ? <p className="admin-muted">Đang tải dữ liệu đơn hàng…</p> : <>
      <div className="order-status-tabs" role="group" aria-label="Lọc trạng thái đơn hàng">{[["all", "Tất cả"], ...Object.entries(STATUSES)].map(([key, label]) => <button key={key} type="button" aria-pressed={statusFilter === key} onClick={() => setStatusFilter(key)}>{label}<span>{statusCounts?.[key] ?? (key === "all" ? orders.length : orders.filter((order) => order.status === key).length)}</span></button>)}</div>
      <div className="admin-order-filter-bar">
        <div className="admin-field"><label htmlFor="order-search">Tìm đơn hàng</label><input id="order-search" type="search" placeholder="Mã đơn OW_..., SĐT, email hoặc tên" value={search} onChange={(event) => { setSearch(event.target.value); setCustomerEmail(""); }} onKeyDown={(event) => { if (event.key === "Enter" && search.trim()) { event.preventDefault(); searchOnServer(); } }} /></div>
        <div className="admin-field"><label htmlFor="order-filter-payment">Thanh toán</label><select id="order-filter-payment" value={filters.payment} onChange={(event) => setFilters({ ...filters, payment: event.target.value })}><option value="all">Tất cả thanh toán</option><option value="paid">Đã thanh toán</option><option value="unpaid">Chưa thu tiền</option></select></div>
        <div className="admin-actions order-mail-quick-filters" role="group" aria-label="Lọc nhanh email">
          {search.trim() && <button type="button" className="admin-btn" disabled={busy} onClick={() => searchOnServer()}>Tìm trên máy chủ</button>}
          {[["all","Mọi email"],["error","Mail lỗi"],["unsent","Chưa gửi mail"]].map(([id,label])=><button key={id} type="button" className={`admin-btn ${mailFilter===id?"primary":""}`} aria-pressed={mailFilter===id} onClick={()=>setMailFilter(id)}>{label}</button>)}
          {(search || customerEmail || statusFilter !== "all" || mailFilter !== "all" || Object.keys(EMPTY_ORDER_FILTERS).some((key) => filters[key] !== EMPTY_ORDER_FILTERS[key])) && <button type="button" className="admin-btn" onClick={() => { setFilters(EMPTY_ORDER_FILTERS); setSearch(""); setCustomerEmail(""); setStatusFilter("all"); setMailFilter("all"); }}>Xóa bộ lọc</button>}
        </div>
      </div>
      {mailFilter === "error" && <p className="admin-muted">Mail bị trả lại chỉ hiện với các đơn gần đây đã kiểm tra Outlook.</p>}
      <details className="admin-filter-panel"><summary>Bộ lọc nâng cao{(filters.min || filters.max || filters.from || filters.to || filters.method !== "all") ? " · Đang áp dụng" : ""}</summary>
        <div className="admin-form-grid">
          {[["min", "Từ số tiền (đ)"], ["max", "Đến số tiền (đ)"]].map(([key, label]) => <div className="admin-field" key={key}><label htmlFor={`order-filter-${key}`}>{label}</label><input id={`order-filter-${key}`} type="number" min="0" step="1" value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} /></div>)}
          {[["from", "Từ ngày đặt"], ["to", "Đến ngày đặt"]].map(([key, label]) => <div className="admin-field" key={key}><label htmlFor={`order-filter-${key}`}>{label}</label><input id={`order-filter-${key}`} type="date" value={filters[key]} onChange={(event) => setFilters({ ...filters, [key]: event.target.value })} /></div>)}
          <div className="admin-field"><label htmlFor="order-filter-method">Phương thức thanh toán</label><select id="order-filter-method" value={filters.method} onChange={(event) => setFilters({ ...filters, method: event.target.value })}><option value="all">Tất cả phương thức</option>{Object.entries(PAYMENT_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        </div>
      </details>
      {(invalidMoneyRange(filters.min, filters.max) || (filters.from && filters.to && filters.from > filters.to)) && <p className="admin-error" role="alert">Khoảng tiền hoặc khoảng ngày chưa hợp lệ.</p>}
      <p className="admin-muted">Hiển thị {visibleOrders.length} / {orders.length} đơn đã tải{cursor ? ". Nhập mã đơn/SĐT rồi bấm Enter để tìm trực tiếp trên máy chủ, hoặc bấm Tải thêm đơn ở cuối bảng." : "."}</p>
      <div className="admin-card admin-order-list-scroll"><table className="admin-table"><thead><tr>{sortColumns.map(([key, label]) => <th key={key} aria-sort={sortCol === key ? (sortDir === "asc" ? "ascending" : "descending") : "none"}><button type="button" className={`admin-sort-btn${sortCol === key ? " is-active" : ""}`} onClick={() => toggleSort(key)}><span>{label}</span><span className="admin-sort-icon" aria-hidden="true">{sortCol === key ? (sortDir === "asc" ? "↑" : "↓") : "↕"}</span></button></th>)}<th /></tr></thead><tbody>
        {pageOrders.map((order) => { const mailState = effectiveMailState(order.confirmationMail); return <tr key={order.id}><td data-label="Mã đơn"><strong>{order.code}</strong><br /><small>{date(order.createdAt)}</small></td><td data-label="Người mua">{order.customer.name}{order.customer.phone && <small className="order-summary-note"><a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a></small>}</td><td data-label="Sản phẩm"><span>{orderProductName(order.product)}</span><small className="order-summary-note">SL: {order.quantity}</small></td><td data-label="Giá trị đơn">{order.totalAmount != null ? formatVnd(order.totalAmount) : order.subtotal != null ? <>{formatVnd(order.subtotal)}<small className="order-summary-note">Chưa chốt phí ship</small></> : "Cần báo giá"}</td><td data-label="Trạng thái"><span className={`order-state-badge ${order.status}`}>{STATUSES[order.status] || order.status}</span></td><td data-label="Thanh toán">{orderPaymentLabel(order)}</td><td data-label="Thư xác nhận"><span>{MAIL_STATES[mailState] || "Chưa có lịch sử"}</span>{order.customer?.email && ["failed", "unknown", "stuck"].includes(mailState) && <div className="admin-order-phone"><button type="button" className="admin-btn" disabled={busy} onClick={() => quickResendMail(order)}>{mailState === "stuck" ? "Gỡ kẹt mail" : "Gửi lại mail"}</button></div>}</td><td><button className="admin-btn" type="button" aria-label={`Xem đơn ${order.code}`} aria-expanded={selected?.id === order.id} onClick={() => showDetail(order)}>Xem chi tiết</button></td></tr>; })}
      </tbody></table>{!visibleOrders.length && <p className="admin-muted">{orders.length ? "Không có đơn phù hợp với bộ lọc." : "Chưa có đơn hàng."}</p>}</div>
      {pageCount > 1 && <div className="admin-pagination" aria-label="Phân trang đơn hàng"><span>Trang {activePage} / {pageCount} · {visibleOrders.length} đơn phù hợp</span><div className="admin-actions"><button type="button" className="admin-btn" disabled={activePage <= 1} onClick={() => setPage(activePage - 1)}>Trang trước</button><button type="button" className="admin-btn" disabled={activePage >= pageCount} onClick={() => setPage(activePage + 1)}>Trang sau</button></div></div>}
      {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => { extended.current = true; const data = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...data.orders].map((item) => [item.id, item])).values()]); setCursor(data.nextCursor); })}>Tải thêm đơn</button>}
    </>}
    {selected && <ModalDialog title={`Đơn ${selected.code}`} className="admin-order-modal admin-order-fullscreen" onClose={() => { sequence.current.value++; setDetail(null); }}><article aria-busy={busy || detail.loading} className="admin-order-detail" aria-label={`Chi tiết đơn ${selected.code}`}>
      {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
      <div className="order-detail-heading"><span className={`order-state-badge ${selected.status}`}>{STATUSES[selected.status] || selected.status}</span><span className="admin-muted">{date(selected.createdAt)}</span><button type="button" className="admin-btn" style={{ marginLeft: "auto", minHeight: 30, padding: "4px 10px", fontSize: 12 }} onClick={() => { navigator.clipboard?.writeText(selected.code).then(() => setNotice({ text: `Đã sao chép mã đơn ${selected.code}.` })).catch(() => {}); }}>Sao chép mã đơn</button></div>
      <div className="admin-order-detail-columns">
        <div className="admin-order-detail-col">
          <div className="admin-detail-box">
            <h3>Sản phẩm & thanh toán</h3>
            {Array.isArray(selected.items) && selected.items.length > 1
              ? <ul className="admin-order-items">{selected.items.map((item, idx) => <li key={`${item.id || idx}:${item.variantId || ""}`}>{orderProductName(item)} × {item.quantity} — {formatProductPrice(item.priceText) || "Cần báo giá"}</li>)}</ul>
              : <><p><strong>{orderProductName(selected.product)}</strong> × {selected.quantity}</p><p>Đơn giá: {formatProductPrice(selected.product.priceText) || "Cần báo giá"}</p></>}
            <p>Tạm tính: {selected.subtotal === null ? "Cần báo giá" : formatVnd(selected.subtotal)}</p>
            <p>Phí giao hàng: {selected.shippingFee == null ? "Xác nhận sau" : formatVnd(selected.shippingFee)}</p>
            <p><strong>Tổng tiền: {selected.totalAmount == null ? "Chưa chốt tổng tiền" : formatVnd(selected.totalAmount)}</strong></p>
            <p>Phương thức: {PAYMENT_LABELS[selected.paymentMethod] || selected.paymentMethod} · {orderPaymentLabel(selected)}</p>
            <label className="admin-check"><input type="checkbox" checked={selected.paymentStatus === "paid"} disabled={busy || detail.loading || selected.status === "completed" || selected.status === "cancelled" || (selected.paymentStatus === "paid" && selected.inventory?.state === "deducted")} onChange={(event) => update(selected, { paymentStatus: event.target.checked ? "paid" : "unpaid" })} />Đã thanh toán</label>
          </div>
          <div className="admin-detail-box">
            <h3>Xử lý đơn hàng</h3>
            {(QUICK_STATUS_ACTIONS[selected.status]?.length > 0) && (
              <div className="admin-actions" style={{ marginBottom: 10 }}>
                {QUICK_STATUS_ACTIONS[selected.status].map(([nextKey, label, isPrimary]) => (
                  <button key={nextKey} type="button" className={`admin-btn ${nextKey === "cancelled" ? "danger" : isPrimary ? "primary" : ""}`} disabled={busy || detail.loading} onClick={() => update(selected, { status: nextKey })}>{label}</button>
                ))}
              </div>
            )}
            <fieldset className="order-status-options" aria-busy={busy} disabled={busy || detail.loading || selected.status === "cancelled"}><legend>Trạng thái xử lý đơn</legend>{Object.entries(STATUSES).map(([key, label]) => <label key={key}><input type="radio" name={`status-${selected.id}`} checked={selected.status === key} disabled={key !== selected.status && !NEXT_ORDER_STATUSES[selected.status]?.includes(key)} onChange={() => update(selected, { status: key })} />{label}</label>)}</fieldset>
            {selected.status === "cancelled" && selected.inventory?.state === "deducted" && <button type="button" className="admin-btn danger" disabled={busy} onClick={async () => {
              if (!await confirm("Bạn đã thực tế nhận lại đủ hàng của đơn này? Xác nhận sẽ cộng lại số lượng vào kho một lần.", { title: "Hoàn kho", confirmLabel: "Hoàn kho", danger: true })) return;
              perform(async () => { const result = await orderRequest({ action: "restockOrder", id: selected.id }); await showDetail(selected); onOrderChanged?.(); setNotice({ text: result.message }); });
            }}>Đã nhận hàng trả — Hoàn kho</button>}
            {selected.inventory?.state === "restocked" && <p className="admin-muted">Đã nhận hàng trả và hoàn kho.</p>}
          </div>
          <div className="admin-detail-box">
            <h3>Vận đơn & ghi chú nội bộ</h3>
            <div className="admin-field" style={{ marginBottom: 10 }}>
              <label htmlFor="order-tracking-code">Mã vận đơn (GHTK / GHN / J&T / ViettelPost…)</label>
              <input id="order-tracking-code" maxLength={120} value={activeMeta.trackingCode} onChange={(event) => setMetaDraft({ ...activeMeta, id: selected.id, trackingCode: event.target.value })} placeholder="Nhập mã vận đơn để tra cứu…" />
            </div>
            <div className="admin-field" style={{ marginBottom: 10 }}>
              <label htmlFor="order-internal-note">Ghi chú nội bộ (chỉ admin thấy)</label>
              <textarea id="order-internal-note" rows={3} maxLength={1000} value={activeMeta.internalNote} onChange={(event) => setMetaDraft({ ...activeMeta, id: selected.id, internalNote: event.target.value })} placeholder="Ghi chú xác nhận, hẹn giao lại, khách VIP…" />
            </div>
            <button type="button" className="admin-btn primary" disabled={busy || detail.loading} onClick={saveOrderMeta}>Lưu vận đơn & ghi chú</button>
          </div>
        </div>
        <div className="admin-order-detail-col">
          <div className="admin-detail-box">
            <h3>Thông tin người mua</h3>
            <p><strong>{selected.customer.name}</strong></p>
            <p><a href={`tel:${selected.customer.phone}`}>{selected.customer.phone}</a></p>
            <p>{selected.customer.email ? <a href={`mailto:${selected.customer.email}`}>{selected.customer.email}</a> : "Đơn cũ chưa có email"}</p>
            <p className="order-preserve-text">{selected.customer.address}</p>
            {selected.customer.note && <p className="order-preserve-text">Ghi chú: {selected.customer.note}</p>}
            <div className="admin-actions" style={{ marginTop: 10 }}>
              {selected.customer.phone && <a className="admin-btn" href={`tel:${selected.customer.phone}`}>Gọi khách</a>}
              {selected.customer.phone && <button type="button" className="admin-btn" onClick={() => { navigator.clipboard?.writeText(selected.customer.phone).then(() => setNotice({ text: `Đã sao chép SĐT ${selected.customer.phone}.` })).catch(() => {}); }}>Chép SĐT</button>}
              {selected.customer.address && <button type="button" className="admin-btn" onClick={() => { navigator.clipboard?.writeText(selected.customer.address).then(() => setNotice({ text: "Đã sao chép địa chỉ giao hàng." })).catch(() => {}); }}>Chép địa chỉ</button>}
              <button type="button" className="admin-btn primary" disabled={detail.loading || !selected.customer.email} onClick={() => { setComposer({ orderId: selected.id }); sequence.current.value++; setDetail(null); }}>Gửi email riêng</button>
            </div>
          </div>
          <div className="admin-detail-box">
            <h3>Email xác nhận ({detail.mails.length})</h3>
            <div className="admin-actions" style={{ marginBottom: 8 }}>
              <button type="button" className="admin-btn" onClick={() => showDetail(selected)}>Tải lại</button>
              {selected.customer?.email && ["failed", "unknown", "stuck"].includes(effectiveMailState(selected.confirmationMail)) && <button type="button" className="admin-btn primary" disabled={busy} onClick={() => quickResendMail(selected)}>{effectiveMailState(selected.confirmationMail) === "stuck" ? "Gỡ kẹt mail" : "Gửi lại mail"}</button>}
            </div>
            {detail.loading ? <p className="admin-muted">Đang tải…</p> : !detail.mails.length ? <p className="admin-muted">Chưa có lịch sử gửi thư.</p> : detail.mails.map((mail) => <div className="order-mail-event" key={mail.id}><button type="button" className="admin-template-link" onClick={() => setMailPreview(mail)}>{mail.subject} · {MAIL_STATES[effectiveMailState(mail)] || mail.state}</button><p>{mailActorLabel(mail)} · {date(mail.createdAt)}</p><OutlookCheck outlook={mail.outlook} label={`${selected.code} · ${mail.recipient}`} check={() => orderRequest({ action: "checkOrderOutlook", id: selected.id, eventId: mail.id })} /></div>)}
          </div>
        </div>
      </div>
      <details className="admin-filter-panel"><summary>Nhật ký xử lý ({detail.activities?.length || 0})</summary>
        <OrderActivity activities={detail.activities} nextCursor={detail.nextActivityCursor} loading={detail.loading || busy} statuses={STATUSES} onReload={() => showDetail(selected)} onMore={() => {
          const id = selected.id; const requestSequence = sequence.current.value;
          perform(async () => {
            const data = await orderRequest(null, { id, activityCursor: detail.nextActivityCursor });
            if (sequence.current.value !== requestSequence) return;
            setDetail((value) => value?.order.id === id ? { ...value, activities: [...new Map([...(value.activities || []), ...data.activities].map((item) => [item.id, item])).values()], nextActivityCursor: data.nextActivityCursor } : value);
          });
        }} />
      </details>
      <details className="admin-filter-panel"><summary>Quy tắc tồn kho & mã lưu trữ</summary><p className="admin-muted">ID: {selected.id}</p><p className="admin-muted">Đơn chờ giữ số lượng, chưa trừ tồn thực tế. Xác nhận thanh toán, bắt đầu giao hoặc Hoàn tất sẽ trừ kho một lần. Hủy đơn chưa xuất giải phóng hàng chờ; đơn đã xuất chỉ hoàn kho khi xác nhận nhận lại hàng.</p></details>
    </article></ModalDialog>}
    </>}
    {composer && <ModalDialog title="Gửi email đơn hàng" className="admin-order-modal" onClose={() => setComposer(null)}>{composer.reused && <p className="admin-context-note">{composer.original ? "Đã chép mẫu vào thư mới. Chọn đơn và kiểm tra nội dung trước khi gửi." : "Nội dung được chép từ thư cũ. Kiểm tra lại tên khách, mã đơn, địa chỉ và số tiền trước khi gửi."}</p>}<OrderEmails purpose="send" canUseNewsletter={canUseNewsletter} initialDraft={composer.draft} initialOrderId={composer.orderId || ""} onSent={(order) => { patchLocal(order.id, order); setMailRevision((value) => value + 1); }} onManageTemplates={onOpenEmailTemplates ? () => { setComposer(null); onOpenEmailTemplates(); } : undefined} /></ModalDialog>}
    {mailPreview && <MailPreviewDialog title="Thư của đơn hàng" message={mailPreview} onClose={() => setMailPreview(null)} metadata={<><p>Gửi tới: {mailPreview.recipient}</p><p>Tài khoản thao tác: {mailActorLabel(mailPreview)}</p>{mailPreview.errorCode && <p className="admin-error">Mã lỗi: {mailPreview.errorCode}{mailPreview.errorMessage ? ` · ${mailPreview.errorMessage}` : ""}</p>}</>} />}
  </section>;
}
