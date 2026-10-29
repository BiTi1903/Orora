import { TEMPLATE_KINDS, templateUsageLabel } from "../lib/mail-templates";
import { useEffect, useRef, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
const empty = { name: "", kind: "private", subject: "", text: "" };
export default function MailTemplateLibrary({ request, onUse, active = true }) {
  const pendingId = useRef(null);
  const [draft, setDraft] = useState(empty);
  const [id, setId] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!active) return;
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        let cursor; const all = new Map(); const seen = new Set();
        do {
          const page = await request(null, { templates: "1", ...(cursor ? { cursor } : {}) });
          if (!alive) return;
          page.templates.forEach((item) => all.set(item.id, item)); cursor = page.nextCursor;
          if (cursor && seen.has(cursor)) throw new Error("Không tải đủ mẫu thư. Vui lòng tải lại.");
          if (cursor) seen.add(cursor);
        } while (cursor);
        setTemplates([...all.values()].sort((a, b) => b.updatedAt - a.updatedAt));
      } catch (error) { if (alive) setNotice({ error: true, text: error.message }); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [request, version, active]);
  const edit = (item) => { pendingId.current = null; setId(item.id); setDraft({ name: item.name, kind: item.kind, subject: item.subject, text: item.text }); setPreview(null); setNotice({ text: "Đang chỉnh mẫu đã lưu." }); };
  const remove = async (item) => {
    if (busy || !window.confirm(`Xóa mẫu “${item.name}” khỏi kho? Mẫu tự động và lịch sử thư đã gửi vẫn được giữ.`)) return;
    setBusy(true); setNotice(null);
    try {
      const result = await request({ action: "deleteLibraryTemplate", id: item.id });
      setTemplates((items) => items.filter((template) => template.id !== item.id));
      if (id === item.id) { setId(null); pendingId.current = null; setDraft(empty); }
      if (preview?.id === item.id) setPreview(null);
      setNotice({ text: result.message });
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setBusy(false); }
  };
  const query = search.trim().toLowerCase();
  const visible = templates.filter((item) => [item.name, item.subject].some((value) => value.toLowerCase().includes(query)));
  const card = (item) => <div className="mail-library-row" key={item.id || item.name}><div><button type="button" className="admin-template-link" onClick={() => setPreview({ ...item, saved: true })}>{item.name}</button><p className="admin-muted">{TEMPLATE_KINDS[item.kind] || item.kind} · v{item.revision || 1}</p><span className={`mail-usage-badge ${item.usedRevisions?.includes(item.revision || 1) ? "sent" : ""}`}>{templateUsageLabel(item)}</span><p className="admin-muted">{item.subject}</p></div><div className="admin-actions"><button type="button" className="admin-btn" disabled={busy} onClick={() => edit(item)}>Chỉnh sửa</button><button type="button" className="admin-btn danger" disabled={busy} aria-label={`Xóa mẫu ${item.name}`} onClick={() => remove(item)}>Xóa mẫu</button></div></div>;
  return <div>
    <div className="admin-top"><div><h2>Mẫu Thư</h2><p className="admin-muted">Một danh sách mẫu chung. Khi lưu, chọn mục đích sử dụng trong ô Loại mẫu thư.</p></div><button type="button" className="admin-btn" disabled={loading || busy} onClick={() => setVersion((value) => value + 1)}>Tải lại mẫu</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    <div className="mail-library-layout">
      <form className="admin-card admin-form" onSubmit={async (event) => {
        event.preventDefault(); if (busy) return; setBusy(true); setNotice(null);
        try { const templateId = id || pendingId.current || crypto.randomUUID(); pendingId.current = templateId; const result = await request({ action: "saveLibraryTemplate", id: templateId, ...draft }); setId(templateId); setNotice({ text: result.message }); setVersion((value) => value + 1); }
        catch (error) { setNotice({ error: true, text: error.message }); }
        finally { setBusy(false); }
      }}>
        <h3>{id ? "Chỉnh mẫu đã lưu" : "Soạn mẫu mới"}</h3>
        <div className="admin-field"><label htmlFor="library-name">Tên mẫu thư</label><input id="library-name" required maxLength={100} disabled={busy} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ví dụ: Xác nhận đơn, Cảm ơn khách hàng…" /></div>
        <div className="admin-field"><label htmlFor="library-kind">Loại mẫu thư</label><select id="library-kind" className="mail-template-select" disabled={busy} value={draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value })}>{Object.entries(TEMPLATE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>
        <div className="admin-field"><label htmlFor="library-subject">Tiêu đề mẫu thư</label><input id="library-subject" required maxLength={200} disabled={busy} value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></div>
        <div className="admin-field"><label htmlFor="library-text">Nội dung mẫu thư</label><textarea id="library-text" required rows={10} maxLength={20000} disabled={busy} value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} /></div>
        {draft.kind !== "welcome_auto" && <p className="admin-muted">Biến đơn hàng: {"{{customerName}}, {{orderCode}}, {{productName}}, {{quantity}}, {{subtotal}}, {{paymentMethod}}, {{address}}, {{phone}}, {{email}}"}.</p>}
        <div className="admin-actions"><button className="admin-btn primary" disabled={busy}>{id ? "Lưu thay đổi mẫu" : "Lưu mẫu thư"}</button><button type="button" className="admin-btn" disabled={busy} onClick={() => { pendingId.current = null; setId(null); setDraft(empty); }}>Tạo mẫu mới</button></div>
      </form>
      <div className="admin-card"><h3>Mẫu đã lưu ({templates.length})</h3><div className="admin-field"><label htmlFor="library-search">Tìm mẫu đã lưu</label><input id="library-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>{loading ? <p>Đang tải mẫu…</p> : <div className="mail-library-list">{visible.map(card)}{!visible.length && <p className="admin-muted">Chưa có mẫu phù hợp. Tạo mẫu, nhập nội dung và chọn loại ngay trong form bên cạnh.</p>}</div>}</div>
    </div>
    {preview && <MailPreviewDialog title={preview.name} message={preview} onClose={() => setPreview(null)}><button type="button" className="admin-btn" onClick={() => edit(preview)}>Chỉnh sửa mẫu</button><button type="button" className="admin-btn primary" onClick={() => { onUse(preview); setPreview(null); }}>{preview.kind !== "private" ? "Chọn cho thư tự động" : "Dùng để soạn thư"}</button></MailPreviewDialog>}
  </div>;
}
