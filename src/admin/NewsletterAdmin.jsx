import MailTemplateLibrary from "./MailTemplateLibrary";
import MailPreviewDialog from "./MailPreviewDialog";
import MailTemplatePicker from "./MailTemplatePicker";
import { mailActorLabel, groupMailTemplates } from "../lib/mail-templates";
import OrderMailHistory from "./OrderMailHistory";
import OrderEmailSettings from "./OrderEmailSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";

const EMPTY = { subject: "", text: "" };
const CONTACT_STATUS = { active: "Hoạt động", paused: "Tạm ngưng", unsubscribed: "Đã hủy đăng ký" };
const STATUS = { draft: "Chưa gửi", sending: "Đang xử lý", paused: "Tạm dừng", completed: "Hoàn tất" };

async function request(body, cursor) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const params = new URLSearchParams(typeof cursor === "string" ? { cursor } : cursor || {}).toString();
  const response = await fetch(`/api/newsletter${params ? `?${params}` : ""}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error("Chưa kết nối được API email. Hãy triển khai trên Vercel theo docs/EMAIL-SETUP.md."); }
  if (!response.ok) throw new Error(data.message || "Chưa thực hiện được.");
  return data;
}

function MessageFields({ value, onChange, disabled, prefix }) {
  return (
    <>
      <div className="admin-field">
        <label htmlFor={`${prefix}-subject`}>Tiêu đề email</label>
        <input id={`${prefix}-subject`} required maxLength={200} value={value.subject} onChange={(e) => onChange({ ...value, subject: e.target.value })} disabled={disabled} />
      </div>
      <div className="admin-field">
        <label htmlFor={`${prefix}-text`}>Nội dung thư</label>
        <textarea id={`${prefix}-text`} required rows={9} maxLength={20000} value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} disabled={disabled} />
      </div>
      <p className="admin-muted">Thư dạng văn bản, giữ nguyên nội dung bạn nhập.</p>
    </>
  );
}

function ContactActions({ label, disabled, onApply }) {
  const [action, setAction] = useState("");
  return (
    <div className="newsletter-contact-actions">
      <select aria-label={label} value={action} onChange={(event) => setAction(event.target.value)} disabled={disabled}>
        <option value="">Chọn thao tác</option>
        <option value="activate">Hoạt động</option>
        <option value="pause">Tạm ngưng</option>
        <option value="delete">Xóa email</option>
      </select>
      <button type="button" className="admin-btn" aria-label={`Áp dụng: ${label}`} disabled={disabled || !action} onClick={() => {
        onApply(action);
        setAction("");
      }}>Áp dụng</button>
    </div>
  );
}

export default function NewsletterAdmin({ initialView = "contacts" }) {
  const [librarySeed, setLibrarySeed] = useState(null);
  const [preview, setPreview] = useState(null);
  const [picker, setPicker] = useState(null);
  const [view, setView] = useState(initialView);
  const [recipientMode, setRecipientMode] = useState("selected");
  const [recipientIds, setRecipientIds] = useState([]);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [reusedOrderTemplate, setReusedOrderTemplate] = useState(null);
  const [orderTemplate, setOrderTemplate] = useState(null);
  const [welcome, setWelcome] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [testEmail, setTestEmail] = useState(() => auth?.currentUser?.email || "");
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [contactFilter, setContactFilter] = useState("all");
  const [emailSearch, setEmailSearch] = useState("");
  const [campaigns, setCampaigns] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const stop = useRef(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    const data = await request();
    if (!alive.current) return;
    setContacts(data.contacts);
    setSelectedContacts([]);
    setCursor(data.nextCursor);
    setCampaigns(data.campaigns);
    setWelcome(data.welcome);
    setOrderTemplate(data.orderTemplate);
    setReady(true);
  }, []);

  useEffect(() => {
    alive.current = true;
    load().catch((error) => { if (alive.current) setNotice({ error: true, text: error.message }); });
    return () => { alive.current = false; stop.current = true; };
  }, [load]);

  const perform = async (action) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    try { await action(); } catch (error) { if (alive.current) setNotice({ error: true, text: error.message }); }
    finally { if (alive.current) setBusy(false); }
  };

  const filterContacts = (items) => items.filter((item) =>
    (contactFilter === "all" || item.status === contactFilter) &&
    item.email.toLowerCase().includes(emailSearch.trim().toLowerCase()));
  const visibleContacts = filterContacts(contacts);

  const loadRemainingContacts = async () => {
    let items = contacts;
    let next = cursor;
    while (next) {
      const page = await request(null, next);
      if (!alive.current) return null;
      items = [...new Map([...items, ...page.contacts].map((item) => [item.id, item])).values()];
      next = page.nextCursor;
      setContacts(items);
      setCursor(next);
    }
    return items;
  };

  const exportContacts = () => perform(async () => {
    const items = await loadRemainingContacts();
    if (!items) return;
    const rows = filterContacts(items);
    if (!rows.length) {
      setNotice({ text: "Không có email phù hợp để xuất." });
      return;
    }
    const { default: writeXlsxFile } = await import("write-excel-file/browser");
    const data = [
      ["Email", "Trạng thái", "Thư tự động"].map((value) => ({ value, fontWeight: "bold" })),
      ...rows.map((item) => [item.email, CONTACT_STATUS[item.status] || item.status,
        { accepted: "Microsoft đã nhận", pending: "Đang xử lý", failed: "Lỗi", unknown: "Chưa rõ" }[item.mailStatus] || "—"
      ].map((value) => ({ type: String, value }))),
    ];
    await writeXlsxFile(data, {
      columns: [{ width: 42 }, { width: 24 }, { width: 24 }],
    }).toFile(`ORORA-email-${new Date().toISOString().slice(0, 10)}.xlsx`);
    if (alive.current) setNotice({ text: `Đã xuất ${rows.length} email ra Excel.` });
  });
  const allVisibleSelected = visibleContacts.length > 0 && visibleContacts.every((item) => selectedContacts.includes(item.id));

  const manageContacts = (ids, operation) => {
    if (busy || !ids.length) return;
    if (ids.length > 100) {
      setNotice({ error: true, text: "Chọn tối đa 100 email cho mỗi lần thao tác." });
      return;
    }
    if (operation === "delete" && !window.confirm(`Xóa ${ids.length} email khỏi danh sách? Không thể hoàn tác thao tác này. Lịch sử thư đã gửi vẫn được giữ.`)) return;
    perform(async () => {
      const result = await request({ action: "manageContacts", operation, ids });
      if (!alive.current) return;
      const changed = new Map(result.updated.map((item) => [item.id, item.status]));
      setContacts((items) => items.filter((item) => changed.get(item.id) !== "deleted").map((item) => changed.has(item.id) ? { ...item, status: changed.get(item.id) } : item));
      setSelectedContacts((selected) => selected.filter((id) => !ids.includes(id)));
      setNotice({ text: result.message });
    });
  };

  const run = async (id) => {
    stop.current = false;
    setSending(true);
    try {
      while (!stop.current) {
        const result = await request({ action: "sendBatch", id });
        if (!alive.current) return;
        setCampaigns((items) => items.map((item) => item.id === id ? result.campaign : item));
        if (result.paused) {
          setNotice({ error: true, text: "Đã tạm dừng do có thư gửi lỗi hoặc chưa rõ kết quả. Kiểm tra cấu hình Microsoft trước khi tiếp tục. Các địa chỉ đã xử lý sẽ không tự gửi lại trong lần gửi này." });
          return;
        }
        if (result.completed) {
          setNotice({ text: "Đã xử lý xong thư. “Microsoft đã nhận” chưa có nghĩa thư đã vào hộp thư khách." });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
      }
      if (alive.current) setNotice({ text: "Đã tạm dừng. Bạn có thể tiếp tục từ lịch sử thư." });
    } finally { if (alive.current) setSending(false); }
  };

  const campaignTemplates = groupMailTemplates(campaigns);
  const availableTemplates = [{ id: "current-welcome", name: "Thư chào mừng đang dùng", kind: "general", ...welcome }, ...(orderTemplate ? [{ id: "current-order", name: "Thư đơn hàng đang dùng", kind: "order", ...orderTemplate }] : []), ...campaignTemplates.templates.map((item) => ({ id: `campaign-${item.id}`, name: item.label, kind: "general", ...item.message }))];
  const prepareTemplate = (message, kind = "general", name = "Mẫu thư mới") => { setLibrarySeed({ id: crypto.randomUUID(), message: { name, kind, ...message } }); setView("templates"); };
  const applyTemplate = (item) => {
    if (item.kind === "order") { setReusedOrderTemplate({ id: crypto.randomUUID(), message: { subject: item.subject, text: item.text } }); setView("orders"); }
    else { if ((draft.subject || draft.text) && !window.confirm("Thay nội dung đang soạn bằng mẫu này?")) return; setDraft({ subject: item.subject, text: item.text }); setView("compose"); }
    setPicker(null); setPreview(null); setNotice({ text: "Đã chép mẫu vào thư đang soạn. Kiểm tra người nhận và nội dung trước khi gửi." });
  };
  const activeContacts = contacts.filter((item) => item.status === "active");
  const eligibleIds = recipientIds.filter((id) => activeContacts.some((item) => item.id === id));
  const recipientOptions = activeContacts.filter((item) => item.email.toLowerCase().includes(recipientSearch.trim().toLowerCase()));
  const chooseRecipients = (ids, checked) => {
    const next = checked ? [...new Set([...eligibleIds, ...ids])] : eligibleIds.filter((id) => !ids.includes(id));
    if (next.length > 100) { setNotice({ error: true, text: "Chọn tối đa 100 người nhận cho mỗi thư. Bạn có thể dùng chế độ gửi toàn bộ danh sách." }); return; }
    setRecipientIds(next);
  };
  const sendCampaign = (event) => {
    event.preventDefault();
    if (recipientMode === "selected" && !eligibleIds.length) return;
    if (!window.confirm(`Gửi “${draft.subject}” đến ${recipientMode === "selected" ? `${eligibleIds.length} email đã chọn:\n${eligibleIds.map((id) => activeContacts.find((item) => item.id === id)?.email).join("\n")}\n` : "toàn bộ email đang hoạt động trước thời điểm tạo thư"}? Mỗi khách nhận một thư riêng.`)) return;
    perform(async () => {
      const id = crypto.randomUUID();
      await request({ action: "createCampaign", id, ...draft, ...(recipientMode === "selected" ? { recipientIds: eligibleIds } : {}) });
      await load();
      await run(id);
    });
  };

  return (
    <section>
      <div className="admin-top">
        <div><h1>Email marketing</h1><p className="admin-muted">Lưu người đăng ký, gửi thư tự động và gửi thư từ sales@ororavn.com.</p></div>
        <button className="admin-btn" disabled={busy} onClick={() => perform(load)}>Tải lại</button>
      </div>
      {notice && <div role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</div>}
      {sending && <button className="admin-btn" onClick={() => { stop.current = true; }}>Tạm dừng sau đợt hiện tại</button>}
      {!ready ? <p className="admin-muted">Cần kết nối API email để tải dữ liệu. Nếu có lỗi, kiểm tra cấu hình rồi bấm Tải lại.</p> : (
        <>
          <nav className="admin-section-tabs" aria-label="Các mục email marketing">
            {[["contacts", "Danh sách email"], ["compose", "Soạn và gửi thư"], ["welcome", "Thư chào mừng"], ["orders", "Thư đơn hàng"], ["orderHistory", "Thư đơn hàng đã gửi"], ["templates", "Mẫu Thư"]].map(([key, label]) => <button type="button" key={key} aria-current={view === key ? "page" : undefined} onClick={() => setView(key)}>{label}</button>)}
          </nav>
          {view === "orderHistory" && <OrderMailHistory onSaveTemplate={(message, name) => prepareTemplate(message, "order", name)} onReuse={(message, original) => { setReusedOrderTemplate({ id: crypto.randomUUID(), message }); setView("orders"); setNotice({ text: original ? "Đã chép mẫu vào nội dung gửi riêng. Kiểm tra và chọn đơn trước khi gửi; mẫu tự động không thay đổi." : "Đã chép nội dung thư cũ vào nội dung gửi riêng. Hãy sửa thông tin khách và mã đơn cũ trước khi gửi." }); }} />}
          <div hidden={view !== "templates"}><MailTemplateLibrary key={librarySeed?.id || "library"} request={request} seed={librarySeed} available={availableTemplates} onUse={applyTemplate} /></div>
          <div className="admin-email-panel" hidden={view !== "orders"}>
          <OrderEmailSettings key={JSON.stringify(orderTemplate)} initialTemplate={orderTemplate} reuseTemplate={reusedOrderTemplate} onChooseTemplate={() => setPicker("order")} onSaveLibrary={(message) => prepareTemplate(message, "order")} onSave={(message) => request({ action: "saveOrderTemplate", ...message })} />
          </div>
          <div className="admin-email-panel" hidden={view !== "welcome"}>
          <form className="admin-card admin-form" onSubmit={(event) => {
            event.preventDefault();
            perform(async () => {
              const result = await request({ action: "saveWelcome", ...welcome });
              setNotice({ text: result.message });
            });
          }}>
            <h2>Thư tự động sau khi đăng ký</h2><div className="admin-actions"><button type="button" className="admin-btn" onClick={() => setPreview({ title: "Mẫu thư chào mừng", message: welcome, kind: "general" })}>Xem mẫu chào mừng</button><button type="button" className="admin-btn" onClick={() => prepareTemplate(welcome, "general", "Mẫu thư chào mừng")}>Lưu thành mẫu riêng</button></div>
            <MessageFields prefix="welcome" value={welcome} onChange={setWelcome} disabled={busy} />
            <button className="admin-btn primary" disabled={busy}>Lưu mẫu thư tự động</button>
          </form>
          <form className="admin-card admin-form" onSubmit={(event) => {
            event.preventDefault();
            perform(async () => {
              const result = await request({ action: "sendTest", ...welcome, testEmail });
              setNotice({ text: result.message });
            });
          }}>
            <h2>Gửi mẫu chào mừng</h2>
            <div className="admin-field">
              <label htmlFor="newsletter-test-email">Email nhận thư</label>
              <input id="newsletter-test-email" type="email" required maxLength={254} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} disabled={busy} />
            </div>
            <p className="admin-muted">Nhập hộp thư bạn có thể mở để kiểm tra mẫu thư bên trên. Thao tác này gửi một thư đến địa chỉ đã nhập, không gửi đến danh sách khách.</p>
            <button className="admin-btn" disabled={busy || !welcome.subject.trim() || !welcome.text.trim()}>Gửi thư</button>
          </form>
          </div>
          <div className="admin-email-panel" hidden={view !== "compose"}>
          <form className="admin-card admin-form" onSubmit={sendCampaign}>
            <h2>Soạn thư mới</h2><div className="admin-actions"><button type="button" className="admin-btn" disabled={busy} onClick={() => setPicker("general")}>Chọn mẫu thư</button><button type="button" className="admin-btn" disabled={busy} onClick={() => prepareTemplate(draft)}>Lưu nội dung thành mẫu</button></div>
            <fieldset className="newsletter-recipient-picker" disabled={busy}>
              <legend>Người nhận thư</legend>
              <label className="admin-check"><input type="radio" name="recipient-mode" checked={recipientMode === "selected"} onChange={() => setRecipientMode("selected")} />Chọn email cụ thể</label>
              <label className="admin-check"><input type="radio" name="recipient-mode" checked={recipientMode === "all"} onChange={() => setRecipientMode("all")} />Toàn bộ email đang hoạt động</label>
              {recipientMode === "selected" ? <>
                <div className="admin-field"><label htmlFor="recipient-search">Tìm người nhận</label><input id="recipient-search" type="search" placeholder="Nhập email…" value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} onFocus={() => { if (cursor && !busy) perform(loadRemainingContacts); }} /></div>
                <label className="admin-check"><input type="checkbox" checked={recipientOptions.length > 0 && recipientOptions.every((item) => eligibleIds.includes(item.id))} disabled={!recipientOptions.length} onChange={(event) => chooseRecipients(recipientOptions.map((item) => item.id), event.target.checked)} />Chọn tất cả email đang hiển thị</label>
                <div className="newsletter-recipient-list" role="region" aria-label="Chọn người nhận thư" tabIndex={0}>
                  {recipientOptions.map((item) => <label className="admin-check" key={item.id}><input type="checkbox" checked={eligibleIds.includes(item.id)} onChange={(event) => chooseRecipients([item.id], event.target.checked)} />{item.email}</label>)}
                  {!recipientOptions.length && <p className="admin-muted">Không có email đang hoạt động phù hợp.</p>}
                </div>
                <div className="admin-actions"><span className="admin-muted" role="status">Đã chọn {eligibleIds.length} người nhận (tối đa 100).</span><button type="button" className="admin-btn" disabled={!eligibleIds.length} onClick={() => setRecipientIds([])}>Bỏ chọn tất cả</button>{cursor && <button type="button" className="admin-btn" onClick={() => perform(loadRemainingContacts)}>Tải toàn bộ email</button>}</div>
                <div className="newsletter-selected-recipients" role="region" aria-label="Email đã chọn để gửi"><strong>Email đã chọn ({eligibleIds.length})</strong><div className="newsletter-selected-list">{eligibleIds.map((id) => { const email = activeContacts.find((item) => item.id === id)?.email; return <span className="newsletter-recipient-chip" key={id}><span>{email}</span><button type="button" aria-label={`Bỏ chọn ${email}`} onClick={() => chooseRecipients([id], false)}>×</button></span>; })}{!eligibleIds.length && <p className="admin-muted">Chưa chọn người nhận.</p>}</div></div>
                <p className="admin-muted">Chỉ gửi đến email đã chọn, kể cả khi bạn đổi từ khóa tìm kiếm. Email tạm ngưng hoặc hủy đăng ký không nhận thư.</p>
              </> : <p className="admin-muted">Gửi đến toàn bộ email đang hoạt động, gồm cả email chưa tải trên màn hình. Danh sách được kiểm tra lại khi gửi.</p>}
            </fieldset>
            <MessageFields prefix="campaign" value={draft} onChange={setDraft} disabled={busy} />
            <button type="button" className="admin-btn" onClick={() => setPreview({ title: "Xem trước nội dung", message: draft, kind: "general" })}>Xem trước nội dung</button>
            <p className="admin-muted">Giữ trang này mở trong lúc gửi. Có thể tạm dừng và tiếp tục bằng thư đã tạo để tránh gửi trùng.</p>
            <button className="admin-btn primary" disabled={busy || (recipientMode === "selected" && !eligibleIds.length)}>{recipientMode === "selected" ? `Gửi tới ${eligibleIds.length} email đã chọn` : "Gửi đến toàn bộ email hoạt động"}</button>
          </form>

          <div className="admin-card">
            <h2>Lịch sử gửi đến danh sách đăng ký</h2>
            <p className="admin-muted">20 thư gần nhất. Lịch sử thư xác nhận mua hàng nằm trong chi tiết từng đơn.</p>

            <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Tiêu đề</th><th>Mẫu thư</th><th>Tài khoản thao tác</th><th>Người nhận</th><th>Trạng thái</th><th>Microsoft đã nhận</th><th>Lỗi</th><th>Chưa rõ</th><th>Thao tác</th></tr></thead>
              <tbody>{campaigns.map((item) => <tr key={item.id}>
                <td className="mail-history-subject" title={item.subject}>{item.subject}</td><td><button type="button" className="admin-template-link" onClick={() => setPreview({ title: campaignTemplates.byMail.get(item.id)?.label || "Mẫu thư đã gửi", message: { subject: item.subject, text: item.text }, kind: "general" })}>{campaignTemplates.byMail.get(item.id)?.label || "Xem mẫu"}</button></td><td>{mailActorLabel(item)}</td><td>{item.recipientIds ? <details className="newsletter-history-recipients"><summary>{item.recipientIds.length} email đã chọn</summary><ul>{item.recipientIds.map((id, index) => <li key={id}>{item.recipientEmails?.[index] || `Email cũ không còn trong danh sách (${id.slice(0, 8)}…)`}</li>)}</ul></details> : "Toàn bộ email hoạt động"}</td><td>{STATUS[item.status] || item.status}</td><td>{item.accepted || 0}</td><td>{item.failed || 0}</td><td>{item.unknown || 0}</td>
                <td>{item.status !== "completed" && <button className="admin-btn" disabled={busy} onClick={() => {
                  if (window.confirm(`Tiếp tục gửi thư “${item.subject}”?`)) perform(() => run(item.id));
                }}>Tiếp tục gửi</button>}</td>
              </tr>)}</tbody></table></div>
            <p className="admin-muted">Thư bị lỗi hoặc chưa rõ kết quả không được tự gửi lại. “Hoàn tất” nghĩa là đã quét xong danh sách, không bảo đảm mọi thư gửi thành công.</p>
          </div>
          </div>
          <div hidden={view !== "contacts"} className="admin-card">
            <h2>Email đã đăng ký ({contacts.length} đã tải)</h2>
            <div className="newsletter-search-toolbar">
              <div className="admin-field">
                <label htmlFor="newsletter-email-search">Tìm kiếm email</label>
                <input id="newsletter-email-search" type="search" placeholder="Nhập email cần tìm…" value={emailSearch}
                  onFocus={() => { if (cursor && !busy) perform(loadRemainingContacts); }}
                  onChange={(event) => { setEmailSearch(event.target.value); setSelectedContacts([]); }} />
              </div>
              <button type="button" className="admin-btn" disabled={busy} onClick={exportContacts}>Xuất Excel</button>
            </div>
            <div className="newsletter-bulk-toolbar">
              <ContactActions label="Thao tác cho email đã chọn" disabled={busy || !selectedContacts.length} onApply={(operation) => manageContacts(selectedContacts, operation)} />
              <span className="admin-muted">Đã chọn {selectedContacts.length}</span>
              <select className="newsletter-contact-filter" aria-label="Lọc trạng thái email đã tải" value={contactFilter} disabled={busy} onChange={(event) => {
                setContactFilter(event.target.value); setSelectedContacts([]);
              }}>
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Hoạt động</option>
                <option value="paused">Tạm ngưng</option>
                <option value="unsubscribed">Đã hủy đăng ký</option>
              </select>
            </div>
            <p className="admin-muted">Chọn tối đa 100 email mỗi lần. Chỉ email Hoạt động được nhận thư. Tìm kiếm và xuất Excel sẽ tải toàn bộ danh sách, áp dụng từ khóa và bộ lọc trạng thái hiện tại.</p>
            <p className="admin-muted" role="status">{busy ? "Đang xử lý…" : `Hiển thị ${visibleContacts.length} email`}</p>
            <div className="newsletter-contact-scroll" role="region" aria-label="Danh sách email đã đăng ký" tabIndex={0}><table className="admin-table newsletter-contact-table"><thead><tr>
              <th><input type="checkbox" aria-label="Chọn tất cả email đang hiển thị" disabled={busy || !visibleContacts.length} checked={allVisibleSelected} onChange={(event) => {
                const ids = visibleContacts.map((item) => item.id);
                setSelectedContacts((selected) => event.target.checked ? [...new Set([...selected, ...ids])] : selected.filter((id) => !ids.includes(id)));
              }} /></th>
              <th>Email</th><th>Trạng thái</th><th>Thư tự động</th><th>Thao tác</th></tr></thead>
              <tbody>{visibleContacts.map((item) => <tr key={item.id}>
                <td><input type="checkbox" aria-label={`Chọn ${item.email}`} disabled={busy} checked={selectedContacts.includes(item.id)} onChange={(event) => {
                  setSelectedContacts((selected) => event.target.checked ? [...selected, item.id] : selected.filter((id) => id !== item.id));
                }} /></td>
                <td>{item.email}</td>
                <td><span className={`newsletter-contact-status ${item.status}`}>{CONTACT_STATUS[item.status] || item.status}</span></td>
                <td>{{ accepted: "Microsoft đã nhận", pending: "Đang xử lý", failed: "Lỗi", unknown: "Chưa rõ" }[item.mailStatus] || "—"}</td>
                <td><ContactActions label={`Thao tác cho ${item.email}`} disabled={busy} onApply={(operation) => manageContacts([item.id], operation)} /></td>
              </tr>)}</tbody></table></div>
            {!visibleContacts.length && <p className="admin-muted">Không có email phù hợp.</p>}
            {cursor && <button className="admin-btn" disabled={busy} onClick={() => perform(async () => {
              const page = await request(null, cursor);
              setContacts((items) => [...items, ...page.contacts]); setCursor(page.nextCursor);
            })}>Tải thêm email</button>}
          </div>
        </>
      )}
      {picker && <MailTemplatePicker request={request} kind={picker} available={availableTemplates} onUse={applyTemplate} onClose={() => setPicker(null)} />}
      {preview && <MailPreviewDialog title={preview.title} message={preview.message} onClose={() => setPreview(null)}><button type="button" className="admin-btn" onClick={() => { prepareTemplate(preview.message, preview.kind, preview.title); setPreview(null); }}>Lưu thành mẫu mới</button><button type="button" className="admin-btn" onClick={() => applyTemplate({ ...preview.message, kind: preview.kind })}>Dùng mẫu này</button></MailPreviewDialog>}
    </section>
  );
}
