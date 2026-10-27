import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";

const EMPTY = { subject: "", text: "" };
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
      <p className="admin-muted">Thư được gửi dạng văn bản. Website và liên kết hủy đăng ký sẽ được thêm tự động ở cuối thư.</p>
    </>
  );
}

export default function NewsletterAdmin() {
  const [welcome, setWelcome] = useState(EMPTY);
  const [draft, setDraft] = useState(EMPTY);
  const [testEmail, setTestEmail] = useState(() => auth?.currentUser?.email || "");
  const [contacts, setContacts] = useState([]);
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

  const run = async (id) => {
    stop.current = false;
    setSending(true);
    try {
      while (!stop.current) {
        const result = await request({ action: "sendBatch", id });
        if (!alive.current) return;
        setCampaigns((items) => items.map((item) => item.id === id ? result.campaign : item));
        if (result.paused) {
          setNotice({ error: true, text: "Đã tạm dừng do có thư gửi lỗi hoặc chưa rõ kết quả. Kiểm tra cấu hình Microsoft trước khi tiếp tục. Các địa chỉ đã xử lý sẽ không tự gửi lại trong chiến dịch này." });
          return;
        }
        if (result.completed) {
          setNotice({ text: "Chiến dịch đã xử lý xong. “Microsoft đã nhận” chưa có nghĩa thư đã vào hộp thư khách." });
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
      }
      if (alive.current) setNotice({ text: "Đã tạm dừng. Bạn có thể tiếp tục từ lịch sử chiến dịch." });
    } finally { if (alive.current) setSending(false); }
  };

  const sendCampaign = (event) => {
    event.preventDefault();
    if (!window.confirm(`Gửi “${draft.subject}” đến tất cả khách đang đăng ký trước thời điểm tạo chiến dịch? Mỗi khách nhận một thư riêng.`)) return;
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
        <div><h1>Email marketing</h1><p className="admin-muted">Lưu người đăng ký, gửi thư tự động và gửi chiến dịch từ sales@ororavn.com.</p></div>
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
            <h2>Gửi thử mẫu thư</h2>
            <div className="admin-field">
              <label htmlFor="newsletter-test-email">Email nhận thư thử</label>
              <input id="newsletter-test-email" type="email" required maxLength={254} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} disabled={busy} />
            </div>
            <p className="admin-muted">Nhập hộp thư bạn có thể mở để kiểm tra mẫu thư bên trên. Thao tác này gửi một thư đến địa chỉ đã nhập, không gửi đến danh sách khách.</p>
            <button className="admin-btn" disabled={busy || !welcome.subject.trim() || !welcome.text.trim()}>Gửi thư thử</button>
          </form>
          <form className="admin-card admin-form" onSubmit={sendCampaign}>
            <h2>Soạn chiến dịch mới</h2>
            <MessageFields prefix="campaign" value={draft} onChange={setDraft} disabled={busy} />
            <details><summary>Xem trước nội dung</summary><h3>{draft.subject}</h3><p style={{ whiteSpace: "pre-wrap" }}>{draft.text}</p><p>Website ORORA và liên kết hủy đăng ký sẽ nằm ở cuối thư.</p></details>
            <p className="admin-muted">Giữ trang này mở trong lúc gửi. Có thể tạm dừng và tiếp tục bằng chiến dịch cũ để tránh gửi trùng.</p>
            <button className="admin-btn primary" disabled={busy}>Gửi đến khách đang đăng ký</button>
          </form>
          <div className="admin-card">
            <h2>Lịch sử 20 chiến dịch gần nhất</h2>
            <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Tiêu đề</th><th>Trạng thái</th><th>Microsoft đã nhận</th><th>Lỗi</th><th>Chưa rõ</th><th>Thao tác</th></tr></thead>
              <tbody>{campaigns.map((item) => <tr key={item.id}>
                <td>{item.subject}</td><td>{STATUS[item.status] || item.status}</td><td>{item.accepted || 0}</td><td>{item.failed || 0}</td><td>{item.unknown || 0}</td>
                <td>{item.status !== "completed" && <button className="admin-btn" disabled={busy} onClick={() => {
                  if (window.confirm(`Tiếp tục gửi chiến dịch “${item.subject}”?`)) perform(() => run(item.id));
                }}>Tiếp tục gửi</button>}</td>
              </tr>)}</tbody></table></div>
            <p className="admin-muted">Thư bị lỗi hoặc chưa rõ kết quả không được tự gửi lại. “Hoàn tất” nghĩa là đã quét xong danh sách, không bảo đảm mọi thư gửi thành công.</p>
          </div>
          <div className="admin-card">
            <h2>Email đã đăng ký ({contacts.length} đã tải)</h2>
            <div style={{ overflowX: "auto" }}><table className="admin-table"><thead><tr><th>Email</th><th>Đăng ký</th><th>Thư tự động</th><th>Thao tác</th></tr></thead>
              <tbody>{contacts.map((item) => <tr key={item.id}><td>{item.email}</td><td>{item.status === "active" ? "Đang nhận tin" : "Đã hủy"}</td><td>{{ accepted: "Microsoft đã nhận", pending: "Đang xử lý", failed: "Lỗi", unknown: "Chưa rõ" }[item.mailStatus] || "—"}</td>
                <td>{item.status === "active" && <button className="admin-btn" disabled={busy} onClick={() => {
                  if (window.confirm(`Ngừng gửi thư tới ${item.email}?`)) perform(async () => { await request({ action: "unsubscribe", id: item.id }); await load(); });
                }}>Ngừng gửi</button>}</td>
              </tr>)}</tbody></table></div>
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
