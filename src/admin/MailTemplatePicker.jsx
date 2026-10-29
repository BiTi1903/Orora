import { TEMPLATE_KINDS, templateUsageLabel } from "../lib/mail-templates";
import { useEffect, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
export default function MailTemplatePicker({ request, kind, available, onUse, onClose, onManage }) {
  const [saved, setSaved] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [selected, setSelected] = useState(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try { let cursor; const items = new Map(); const seen = new Set(); do { const page = await request(null, { templates: "1", ...(cursor ? { cursor } : {}) }); if (!alive) return; page.templates.forEach((item) => items.set(item.id, item)); cursor = page.nextCursor; if (cursor && seen.has(cursor)) throw Error("Không tải đủ mẫu."); if (cursor) seen.add(cursor); } while (cursor); setSaved([...items.values()].map((item) => ({ ...item, saved: true }))); }
      catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [request]);
  const sources = available.filter((item) => !saved.some((template) => template.kind === item.kind && template.subject === item.subject && template.text === item.text));
  const items = [...saved, ...sources].filter((item) => item.kind === kind);
  return <MailPreviewDialog title={selected ? selected.name : `Chọn mẫu: ${TEMPLATE_KINDS[kind]}`} message={selected} onClose={onClose} metadata={!selected && <><p className="admin-muted">Chỉ hiển thị mẫu loại <strong>{TEMPLATE_KINDS[kind]}</strong>. Các loại khác không bị mất.</p><p className="admin-muted">{Object.entries(TEMPLATE_KINDS).map(([key, label]) => `${label}: ${saved.filter((item) => item.kind === key).length}`).join(" · ")}</p>{loading && <p>Đang tải mẫu đã lưu…</p>}{error && <p className="admin-error">{error}</p>}<div className="mail-library-list">{items.map((item, index) => <div className="mail-library-row" key={item.id || index}><button type="button" className="admin-template-link" onClick={() => setSelected(item)}>{item.name}</button><p className="admin-muted">{item.subject}</p><span className="mail-usage-badge">{item.saved ? templateUsageLabel(item) : "Mẫu tự động đang áp dụng"}</span></div>)}</div>{!loading && !items.length && <p className="admin-muted">Chưa có mẫu thuộc loại này. Tạo mẫu mới hoặc đổi loại mẫu trong Mẫu Thư.</p>}</>}>
    {!selected && onManage && <button type="button" className="admin-btn" onClick={onManage}>Quản lý Mẫu Thư</button>}
    {selected && <><button type="button" className="admin-btn" onClick={() => setSelected(null)}>Quay lại danh sách mẫu</button><button type="button" className="admin-btn primary" onClick={() => onUse(selected)}>Dùng mẫu này</button></>}
  </MailPreviewDialog>;
}
