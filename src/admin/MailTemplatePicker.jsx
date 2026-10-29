import { useEffect, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
export default function MailTemplatePicker({ request, kind, available, onUse, onClose }) {
  const [saved, setSaved] = useState([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [selected, setSelected] = useState(null);
  useEffect(() => {
    let alive = true;
    async function load() {
      try { let cursor; const items = new Map(); const seen = new Set(); do { const page = await request(null, { templates: "1", ...(cursor ? { cursor } : {}) }); if (!alive) return; page.templates.forEach((item) => items.set(item.id, item)); cursor = page.nextCursor; if (cursor && seen.has(cursor)) throw Error("Không tải đủ mẫu."); if (cursor) seen.add(cursor); } while (cursor); setSaved([...items.values()]); }
      catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [request]);
  const items = [...saved, ...available].filter((item) => item.kind === kind);
  return <MailPreviewDialog title={selected ? selected.name : "Chọn mẫu thư"} message={selected} onClose={onClose} metadata={!selected && <>{loading && <p>Đang tải mẫu đã lưu…</p>}{error && <p className="admin-error">{error}</p>}<div className="mail-library-list">{items.map((item, index) => <div className="mail-library-row" key={item.id || index}><button type="button" className="admin-template-link" onClick={() => setSelected(item)}>{item.name}</button><p className="admin-muted">{item.subject}</p></div>)}</div></>}>
    {selected && <><button type="button" className="admin-btn" onClick={() => setSelected(null)}>Quay lại danh sách mẫu</button><button type="button" className="admin-btn primary" onClick={() => onUse(selected)}>Dùng mẫu này</button></>}
  </MailPreviewDialog>;
}
