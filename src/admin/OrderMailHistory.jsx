import OutlookCheck from "./OutlookCheck";
import MailPreviewDialog from "./MailPreviewDialog";
import { groupMailTemplates, mailActorLabel } from "../lib/mail-templates";
import { useEffect, useState } from "react";
import { orderRequest, MAIL_STATES } from "./order-api";
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";

export default function OrderMailHistory({ onReuse, refreshKey = 0 }) {
  const [selected, setSelected] = useState(null);
  const [templateFilter, setTemplateFilter] = useState("all");
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
      setBusy(true); setError(""); setCount(0); setMails([]); setSelected(null); setTemplateFilter("all");
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
  }, [version, refreshKey]);
  const { templates, byMail } = groupMailTemplates(mails);
  const query = search.trim().toLowerCase();
  const filtered = mails.filter((mail) => (templateFilter === "all" || byMail.get(mail.id)?.id === templateFilter) && (kind === "all" || (kind === "manual" ? mail.manual : !mail.manual)) && (state === "all" || mail.state === state) && [mail.recipient, mail.orderId, mail.orderCode, mail.subject, mail.templateName, mail.customerName, mail.actorName, mail.actorEmail, mail.actor].some((value) => String(value || "").toLowerCase().includes(query)));
  return <div>
    <div className="admin-top"><div><h2>Lịch sử email đơn hàng</h2><p className="admin-muted">Thư xác nhận mua hàng tự động và thư gửi riêng từ tài khoản đăng nhập, tách khỏi thư gửi danh sách đăng ký.</p></div><button className="admin-btn" disabled={busy} onClick={() => { setVisibleCount(30); setVersion((value) => value + 1); }}>Tải lại lịch sử thư</button></div>
    <div className="admin-form-grid order-mail-history-filters">
      <div className="admin-field"><label htmlFor="order-mail-history-search">Tìm thư đơn hàng</label><input id="order-mail-history-search" type="search" placeholder="Email, mã/ID đơn, tên khách hoặc tiêu đề" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(30); }} /></div>
      <div className="admin-field"><label htmlFor="order-mail-history-kind">Cách gửi</label><select id="order-mail-history-kind" value={kind} onChange={(event) => { setKind(event.target.value); setVisibleCount(30); }}><option value="all">Tất cả cách gửi</option><option value="manual">Gửi bởi tài khoản</option><option value="automatic">Tự động khi đặt hàng</option></select></div>
      <div className="admin-field"><label htmlFor="order-mail-history-state">Kết quả gửi</label><select id="order-mail-history-state" value={state} onChange={(event) => { setState(event.target.value); setVisibleCount(30); }}><option value="all">Tất cả kết quả</option>{Object.entries(MAIL_STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
    <div className="admin-field"><label htmlFor="order-mail-template-filter">Lọc mẫu thư</label><select id="order-mail-template-filter" className="mail-template-select" value={templateFilter} onChange={(event) => { setTemplateFilter(event.target.value); setVisibleCount(30); }}><option value="all">Tất cả mẫu thư</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.label} · {template.count} lượt gửi</option>)}</select></div>
    </div>
    <p className="admin-muted" role="status">{busy ? `Đang tải lịch sử… Đã kiểm tra ${count} đơn.` : `Có ${filtered.length} thư phù hợp · Đã kiểm tra ${count} đơn.`}</p>
    {error && <p className="admin-error" role="alert">{error} Lịch sử đang hiển thị chưa đầy đủ.</p>}

    <>

      <div>
      <div className="admin-card mail-history-table-scroll"><table className="admin-table"><thead><tr><th>Thời gian / Mã đơn</th><th>Người nhận</th><th>Tài khoản thao tác</th><th>Mẫu lúc gửi</th><th>Kết quả gửi</th><th /></tr></thead><tbody>{filtered.slice(0, visibleCount).map((mail) => <tr key={mail.id}><td>{date(mail.createdAt)}<br /><small>{mail.orderCode}</small></td><td>{mail.recipient}</td><td>{mailActorLabel(mail)}{mail.actorName && mail.actorEmail && <small className="order-summary-note">{mail.actorEmail}</small>}</td><td><button className="admin-template-link" onClick={() => setSelected({ template: byMail.get(mail.id) })}>{byMail.get(mail.id)?.label}</button></td><td>{MAIL_STATES[mail.state] || mail.state}{mail.outlook?.state === "bounced" && <small className="mail-result-error">Trả lại{mail.outlook.diagnosticCode ? ` · ${mail.outlook.diagnosticCode}` : ""}</small>}</td><td><button className="admin-btn" onClick={() => setSelected({ mail, template: byMail.get(mail.id) })}>Xem thư</button></td></tr>)}</tbody></table></div>

      </div>
    </>
    {selected && <MailPreviewDialog title={selected.mail ? "Bản thư đã gửi — giữ nguyên lúc gửi" : `Mẫu tại thời điểm gửi: ${selected.template.label}`} message={selected.mail || selected.template.message} onClose={() => setSelected(null)} metadata={selected.mail && <><p>Người nhận: {selected.mail.recipient} · {selected.mail.orderCode}</p><p>Tài khoản thao tác: {mailActorLabel(selected.mail)}</p><OutlookCheck outlook={selected.mail.outlook} label={`${selected.mail.orderCode} · ${selected.mail.recipient}`} check={() => orderRequest({ action: "checkOrderOutlook", id: selected.mail.orderId, eventId: selected.mail.id.slice(selected.mail.orderId.length + 1) })} />{selected.mail.errorCode && <p className="admin-error">Mã lỗi: {selected.mail.errorCode}{selected.mail.errorMessage ? ` · ${selected.mail.errorMessage}` : ""}</p>}</>}>
      {onReuse && <button className="admin-btn" onClick={() => { onReuse(selected.template.message, selected.template.original); setSelected(null); }}>Soạn thư mới từ bản này</button>}
    </MailPreviewDialog>}
    {!busy && !error && !filtered.length && <p className="admin-muted">Chưa có thư đơn hàng phù hợp.</p>}
    {filtered.length > visibleCount && <button className="admin-btn" onClick={() => setVisibleCount((value) => value + 30)}>Hiển thị thêm thư</button>}
    <p className="admin-muted">“Đã nhận” chưa bảo đảm thư vào hộp thư khách. Mở “Xem thư” để Check hoặc dùng lại nội dung. Chỉ gồm thư gửi từ website.</p>
  </div>;
}
