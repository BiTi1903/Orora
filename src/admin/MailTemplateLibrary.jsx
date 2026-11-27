import { useConfirm } from "./confirm-context";
import { renderWelcomeEmailHtml, renderOrderEmailHtml, renderBrandedEmailHtml } from "../lib/mail-html";
import MailHtmlEditor from "./MailHtmlEditor";
import MailBodyBlocks from "./MailBodyBlocks";
import MailDesignFields from "./MailDesignFields";
import { TEMPLATE_KINDS, templateUsageLabel } from "../lib/mail-templates";
import { useEffect, useRef, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
const empty = { categoryId: "", name: "", kind: "private", subject: "", text: "" };
export default function MailTemplateLibrary({ request, onUse, active = true }) {
  const confirm = useConfirm();
  const pendingId = useRef(null);
  const [draft, setDraft] = useState(empty);
  const [id, setId] = useState(null);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState("");
  const [newType, setNewType] = useState("");
  const [templates, setTemplates] = useState([]);
  const [busyAction,setBusyAction]=useState("");
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
          if (page.types) setTypes(page.types);
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
  const edit = (item) => { pendingId.current = null; setId(item.id); setDraft({ name: item.name, kind: item.kind, categoryId: item.categoryId || "", design: item.design, subject: item.subject, text: item.text }); setPreview(null); setNotice({ text: "Đang chỉnh mẫu đã lưu." }); };
  const remove = async (item) => {
    if (busy || !await confirm(`Xóa mẫu “${item.name}” khỏi kho? Mẫu tự động và lịch sử thư đã gửi vẫn được giữ.`, { title: "Xóa mẫu thư", confirmLabel: "Xóa", danger: true })) return;
    setBusy(true);setBusyAction(`delete:${item.id}`);setNotice(null);
    try {
      const result = await request({ action: "deleteLibraryTemplate", id: item.id });
      setTemplates((items) => items.filter((template) => template.id !== item.id));
      if (id === item.id) { setId(null); pendingId.current = null; setDraft(empty); }
      if (preview?.id === item.id) setPreview(null);
      setNotice({ text: result.message });
    } catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setBusy(false);setBusyAction(""); }
  };
  const query = search.trim().toLowerCase();
  const visible = templates.filter((item) => selectedType && (selectedType.startsWith("custom:") ? item.categoryId === selectedType.slice(7) : item.kind === selectedType && !item.categoryId) && [item.name, item.subject].some((value) => value.toLowerCase().includes(query)));
  const card = (item) => <div className="mail-library-row" key={item.id || item.name}><div><button type="button" className="admin-template-link" onClick={() => setPreview({ ...item, saved: true })}>{item.name}</button><p className="admin-muted">{item.categoryName || TEMPLATE_KINDS[item.kind] || item.kind} · v{item.revision || 1}</p><span className={`mail-usage-badge ${item.usedRevisions?.includes(item.revision || 1) ? "sent" : ""}`}>{templateUsageLabel(item)}</span><p className="admin-muted">{item.subject}</p></div><div className="admin-actions"><button type="button" className="admin-btn" disabled={busy} onClick={() => edit(item)}>Chỉnh sửa</button><button type="button" className="admin-btn danger" aria-busy={busy && busyAction === `delete:${item.id}`} disabled={busy} aria-label={`Xóa mẫu ${item.name}`} onClick={() => remove(item)}>Xóa mẫu</button></div></div>;
  return <div>
    <div className="admin-top"><div><h2>Mẫu Thư</h2><p className="admin-muted">Một danh sách mẫu chung. Khi lưu, chọn mục đích sử dụng trong ô Loại mẫu thư.</p></div><button type="button" className="admin-btn" disabled={loading || busy} onClick={() => setVersion((value) => value + 1)}>Tải lại mẫu</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    <div className="mail-library-layout">
      <form aria-busy={busy && ["save","type"].includes(busyAction)} className="admin-card admin-form" onSubmit={async (event) => {
        event.preventDefault(); if (busy) return; setBusy(true);setBusyAction("save");setNotice(null);
        try { const templateId = id || pendingId.current || crypto.randomUUID(); pendingId.current = templateId; const result = await request({ action: "saveLibraryTemplate", id: templateId, ...draft }); setId(templateId); setNotice({ text: result.message }); setVersion((value) => value + 1); }
        catch (error) { setNotice({ error: true, text: error.message }); }
        finally { setBusy(false);setBusyAction(""); }
      }}>
        <h3>{id ? "Chỉnh mẫu đã lưu" : "Soạn mẫu mới"}</h3>
        <div className="admin-field"><label htmlFor="library-name">Tên mẫu thư</label><input id="library-name" required maxLength={100} disabled={busy} value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Ví dụ: Xác nhận đơn, Cảm ơn khách hàng…" /></div>
        <div className="admin-field"><label htmlFor="library-kind">Loại mẫu thư</label><select id="library-kind" className="mail-template-select" disabled={busy} value={draft.categoryId ? `custom:${draft.categoryId}` : draft.kind} onChange={(event) => setDraft({ ...draft, kind: event.target.value.startsWith("custom:") ? "private" : event.target.value, categoryId: event.target.value.startsWith("custom:") ? event.target.value.slice(7) : "" })}>{Object.entries(TEMPLATE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}{types.map((type) => <option key={type.id} value={`custom:${type.id}`}>{type.name}</option>)}</select></div>
        <details><summary>Thêm loại mẫu</summary><div className="admin-field"><label htmlFor="library-new-type">Tên loại mẫu mới</label><input id="library-new-type" maxLength={60} disabled={busy} value={newType} onChange={(event) => setNewType(event.target.value)} /></div><button type="button" className="admin-btn" aria-busy={busy && busyAction === "type"} disabled={busy || !newType.trim()} onClick={async () => { setBusy(true);setBusyAction("type");try { const result = await request({ action: "addTemplateType", name: newType }); setTypes((items) => [...new Map([...items, result.type].map((item) => [item.id, item])).values()]); setDraft({ ...draft, kind: "private", categoryId: result.type.id }); setNewType(""); setNotice({ text: result.message }); } catch (error) { setNotice({ error: true, text: error.message }); } finally { setBusy(false);setBusyAction(""); } }}>Thêm loại</button></details>
        <div className="admin-field"><label htmlFor="library-subject">Tiêu đề mẫu thư</label><input id="library-subject" required maxLength={200} disabled={busy} value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} /></div>
        <div className="admin-field"><label htmlFor="library-text">Nội dung mẫu thư</label><textarea id="library-text" required rows={10} maxLength={20000} disabled={busy} value={draft.text} onChange={(event) => setDraft({ ...draft, text: event.target.value })} /></div>
        <MailHtmlEditor value={draft.design} disabled={busy} onChange={design => setDraft({ ...draft, design })} />
          <MailBodyBlocks text={draft.text} disabled={busy} onChange={text => setDraft({ ...draft, text })} />
          <MailDesignFields kind={draft.kind} value={draft.design} disabled={busy} onChange={design => setDraft({ ...draft, design })} />
        <details className="admin-filter-panel"><summary>Xem trước giao diện mẫu</summary>
          <iframe className="mail-preview-frame" sandbox="" title="Giao diện mẫu thư đang chỉnh" srcDoc={
            (draft.kind === "order_auto" ? renderOrderEmailHtml : draft.kind === "welcome_auto" ? renderWelcomeEmailHtml : renderBrandedEmailHtml)(draft)
          } />
        </details>
        {draft.kind !== "welcome_auto" && <p className="admin-muted">Biến đơn hàng: {"{{customerName}}, {{orderCode}}, {{productName}}, {{variantLabel}}, {{quantity}}, {{subtotal}}, {{paymentMethod}}, {{address}}, {{phone}}, {{email}}"}.</p>}
        <div className="admin-actions"><button className="admin-btn primary" aria-busy={busy && busyAction === "save"} disabled={busy}>{id ? "Lưu thay đổi mẫu" : "Lưu mẫu thư"}</button><button type="button" className="admin-btn" disabled={busy} onClick={() => { pendingId.current = null; setId(null); setDraft(empty); }}>Tạo mẫu mới</button></div>
      </form>
      <div className="admin-card"><h3>Mẫu đã lưu</h3><div className="admin-field"><label htmlFor="library-filter-type">Chọn loại để xem mẫu</label><select id="library-filter-type" className="mail-template-select" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}><option value="">Chưa chọn loại</option>{Object.entries(TEMPLATE_KINDS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}{types.map((type) => <option key={type.id} value={`custom:${type.id}`}>{type.name}</option>)}</select></div>{!selectedType ? <p className="admin-muted">Chọn một loại ở trên để hiển thị các mẫu đã soạn.</p> : <><div className="admin-field"><label htmlFor="library-search">Tìm mẫu đã lưu</label><input id="library-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} /></div>{loading ? <p>Đang tải mẫu…</p> : <div className="mail-library-list">{visible.map(card)}{!visible.length && <p className="admin-muted">Chưa có mẫu phù hợp. Tạo mẫu, nhập nội dung và chọn loại ngay trong form bên cạnh.</p>}</div>}</>}</div>
    </div>
    {preview && <MailPreviewDialog title={preview.name} message={preview} onClose={() => setPreview(null)}><button type="button" className="admin-btn" onClick={() => edit(preview)}>Chỉnh sửa mẫu</button><button type="button" className="admin-btn primary" onClick={() => { onUse(preview); setPreview(null); }}>{preview.kind !== "private" ? "Chọn cho thư tự động" : "Dùng để soạn thư"}</button></MailPreviewDialog>}
  </div>;
}
