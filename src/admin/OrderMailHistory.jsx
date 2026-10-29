import { useEffect, useState } from "react";
import { orderRequest, MAIL_STATES } from "./order-api";
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";

export default function OrderMailHistory() {
  const [mails, setMails] = useState([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");
  const [state, setState] = useState("all");
  const [version, setVersion] = useState(0);
  const [visibleCount, setVisibleCount] = useState(30);
  useEffect(() => {
    let alive = true;
    async function load() {
      setBusy(true); setError(""); setCount(0); setMails([]);
      const items = new Map(); const seen = new Set(); let cursor; let scanned = 0;
      try {
        do {
          const page = await orderRequest(null, { mailHistory: "1", ...(cursor ? { cursor } : {}) });
          if (!alive) return;
          page.mails.forEach((mail) => items.set(mail.id, mail)); scanned += page.scannedOrders;
          setCount(scanned); setMails([...items.values()].sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id)));
          cursor = page.nextCursor;
          if (cursor && seen.has(cursor)) throw new Error("Không tải đủ lịch sử. Vui lòng tải lại.");
          if (cursor) seen.add(cursor);
        } while (cursor);
      } catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setBusy(false); }
    }
    load(); return () => { alive = false; };
  }, [version]);
  const query = search.trim().toLowerCase();
  const filtered = mails.filter((mail) => (kind === "all" || (kind === "manual" ? mail.manual : !mail.manual)) && (state === "all" || mail.state === state) && [mail.recipient, mail.orderId, mail.orderCode, mail.subject, mail.customerName].some((value) => String(value || "").toLowerCase().includes(query)));
  return <div>
    <div className="admin-top"><div><h2>Thư đơn hàng đã gửi</h2><p className="admin-muted">Thư xác nhận mua hàng tự động và thư gửi riêng từ admin, tách khỏi thư gửi danh sách đăng ký.</p></div><button className="admin-btn" disabled={busy} onClick={() => { setVisibleCount(30); setVersion((value) => value + 1); }}>Tải lại lịch sử thư</button></div>
    <div className="admin-form-grid order-mail-history-filters">
      <div className="admin-field"><label htmlFor="order-mail-history-search">Tìm thư đơn hàng</label><input id="order-mail-history-search" type="search" placeholder="Email, mã/ID đơn, tên khách hoặc tiêu đề" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(30); }} /></div>
      <div className="admin-field"><label htmlFor="order-mail-history-kind">Cách gửi</label><select id="order-mail-history-kind" value={kind} onChange={(event) => { setKind(event.target.value); setVisibleCount(30); }}><option value="all">Tất cả cách gửi</option><option value="manual">Gửi riêng từ admin</option><option value="automatic">Tự động khi đặt hàng</option></select></div>
      <div className="admin-field"><label htmlFor="order-mail-history-state">Kết quả gửi</label><select id="order-mail-history-state" value={state} onChange={(event) => { setState(event.target.value); setVisibleCount(30); }}><option value="all">Tất cả kết quả</option>{Object.entries(MAIL_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    </div>
    <p className="admin-muted" role="status">{busy ? `Đang tải lịch sử… Đã kiểm tra ${count} đơn.` : `Có ${filtered.length} thư phù hợp · Đã kiểm tra ${count} đơn.`}</p>
    {error && <p className="admin-error" role="alert">{error} Lịch sử đang hiển thị chưa đầy đủ.</p>}
    <div className="order-mail-history-list">{filtered.slice(0, visibleCount).map((mail) => <details key={mail.id} className="order-mail-event">
      <summary><strong>{mail.subject}</strong><span className="order-summary-note">{mail.recipient} · {mail.orderCode} · {MAIL_STATES[mail.state] || mail.state}</span><span className="order-summary-note">{mail.manual ? "Gửi riêng từ admin" : "Tự động khi đặt hàng"} · {date(mail.createdAt)}</span></summary>
      <p>Người nhận: {mail.customerName} · {mail.recipient}</p><p>Mã đơn: {mail.orderCode}</p><p>Cập nhật: {date(mail.updatedAt)}</p>{mail.errorCode && <p className="admin-error">Mã lỗi: {mail.errorCode}</p>}<pre>{mail.text}</pre>
    </details>)}</div>
    {!busy && !error && !filtered.length && <p className="admin-muted">Chưa có thư đơn hàng phù hợp.</p>}
    {filtered.length > visibleCount && <button className="admin-btn" onClick={() => setVisibleCount((value) => value + 30)}>Hiển thị thêm thư</button>}
    <p className="admin-muted">“Microsoft đã nhận” chưa bảo đảm thư đã tới hộp thư khách. Lịch sử này gồm thư gửi từ website; thư soạn trực tiếp trong Outlook không được đồng bộ.</p>
  </div>;
}
