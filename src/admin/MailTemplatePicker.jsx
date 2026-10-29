import { hasOrderTokens } from "../lib/template-kinds";
import { TEMPLATE_KINDS, templateUsageLabel } from "../lib/mail-templates";
import { useEffect, useState } from "react";
import MailPreviewDialog from "./MailPreviewDialog";
export default function MailTemplatePicker({ request, kind, onUse, onClose, onManage, orderContext = false }) {
  const [search, setSearch] = useState("");
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
  const query = search.trim().toLowerCase();
  const items = saved.filter((item) => item.kind === kind && (kind !== "private" || orderContext || !hasOrderTokens(item)) && [item.name, item.subject].some((value) => value.toLowerCase().includes(query)));
  return <MailPreviewDialog title={selected ? selected.name : `Chọn mẫu: ${TEMPLATE_KINDS[kind]}`} message={selected} onClose={onClose} metadata={!selected && <><p className="admin-muted">Chỉ hiển thị mẫu loại <strong>{TEMPLATE_KINDS[kind]}</strong>. Các loại khác không bị mất.</p>{kind === "private" && !orderContext && <p className="admin-muted">Mẫu gửi riêng có biến đơn hàng chỉ xuất hiện khi chọn mẫu cho một đơn cụ thể.</p>}<p className="admin-muted">{Object.entries(TEMPLATE_KINDS).map(([key, label]) => `${label}: ${saved.filter((item) => item.kind === key).length}`).join(" · ")}</p><div className="admin-field"><label htmlFor="template-picker-search">Tìm mẫu trong danh sách</label><input id="template-picker-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nhập tên hoặc tiêu đề mẫu…" /></div>{loading && <p>Đang tải mẫu đã lưu…</p>}{error && <p className="admin-error">{error}</p>}<div className="mail-library-list">{items.map((item, index) => <div className="mail-library-row" key={item.id || index}><button type="button" className="admin-template-link" onClick={() => setSelected(item)}>{item.name}</button><p className="admin-muted">{item.subject}</p><span className="mail-usage-badge">{item.saved ? templateUsageLabel(item) : "Mẫu tự động đang áp dụng"}</span></div>)}</div>{!loading && !items.length && <p className="admin-muted">Chưa có mẫu thuộc loại này. Tạo mẫu mới hoặc đổi loại mẫu trong Mẫu Thư.</p>}</>}>
    {!selected && onManage && <button type="button" className="admin-btn" onClick={onManage}>Quản lý Mẫu Thư</button>}
    {selected && <><button type="button" className="admin-btn" onClick={() => setSelected(null)}>Quay lại danh sách mẫu</button><button type="button" className="admin-btn primary" onClick={() => onUse(selected)}>Dùng mẫu này</button></>}
  </MailPreviewDialog>;
}
