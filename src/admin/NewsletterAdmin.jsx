import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";

const EMPTY = { subject: "", text: "" };
const CONTACT_STATUS = { active: "Hoạt động", paused: "Tạm ngưng", unsubscribed: "Đã hủy đăng ký" };
const STATUS = { draft: "Chưa gửi", sending: "Đang xử lý", paused: "Tạm dừng", completed: "Hoàn tất" };

async function request(body, cursor) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const response = await fetch(`/api/newsletter${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, {
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

export default function NewsletterAdmin() {
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

  const sendCampaign = (event) => {
    event.preventDefault();
    if (!window.confirm(`Gửi “${draft.subject}” đến tất cả khách đang đăng ký trước thời điểm tạo thư? Mỗi khách nhận một thư riêng.`)) return;
    perform(async () => {
      const id = crypto.randomUUID();
      await request({ action: "createCampaign", id, ...draft });
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
          <form className="admin-card admin-form" onSubmit={(event) => {
            event.preventDefault();
            perform(async () => {
              const result = await request({ action: "saveWelcome", ...welcome });
              setNotice({ text: result.message });
            });
          }}>
            <h2>Thư tự động sau khi đăng ký</h2>
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
            <h2>Gửi thư</h2>
            <div className="admin-field">
              <label htmlFor="newsletter-test-email">Email nhận thư</label>
              <input id="newsletter-test-email" type="email" required maxLength={254} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} disabled={busy} />
            </div>
            <p className="admin-muted">Nhập hộp thư bạn có thể mở để kiểm tra mẫu thư bên trên. Thao tác này gửi một thư đến địa chỉ đã nhập, không gửi đến danh sách khách.</p>
            <button className="admin-btn" disabled={busy || !welcome.subject.trim() || !welcome.text.trim()}>Gửi thư</button>
          </form>
          <form className="admin-card admin-form" onSubmit={sendCampaign}>
            <h2>Soạn thư mới</h2>
            <MessageFields prefix="campaign" value={draft} onChange={setDraft} disabled={busy} />
            <details><summary>Xem trước nội dung</summary><h3>{draft.subject}</h3><p style={{ whiteSpace: "pre-wrap" }}>{draft.text}</p></details>
            <p className="admin-muted">Giữ trang này mở trong lúc gửi. Có thể tạm dừng và tiếp tục bằng thư đã tạo để tránh gửi trùng.</p>
            <button className="admin-btn primary" disabled={busy}>Gửi đến khách đang đăng ký</button>
          </form>
          <div className="admin-card">
            <h2>Lịch sử 20 thư gần nhất</h2>
            <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Tiêu đề</th><th>Trạng thái</th><th>Microsoft đã nhận</th><th>Lỗi</th><th>Chưa rõ</th><th>Thao tác</th></tr></thead>
              <tbody>{campaigns.map((item) => <tr key={item.id}>
                <td>{item.subject}</td><td>{STATUS[item.status] || item.status}</td><td>{item.accepted || 0}</td><td>{item.failed || 0}</td><td>{item.unknown || 0}</td>
                <td>{item.status !== "completed" && <button className="admin-btn" disabled={busy} onClick={() => {
                  if (window.confirm(`Tiếp tục gửi thư “${item.subject}”?`)) perform(() => run(item.id));
                }}>Tiếp tục gửi</button>}</td>
              </tr>)}</tbody></table></div>
            <p className="admin-muted">Thư bị lỗi hoặc chưa rõ kết quả không được tự gửi lại. “Hoàn tất” nghĩa là đã quét xong danh sách, không bảo đảm mọi thư gửi thành công.</p>
          </div>
          <div className="admin-card">
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
    </section>
  );
}
