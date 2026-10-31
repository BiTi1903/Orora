import { useEffect, useState } from "react";
import { auth } from "../lib/firebaseAuth";
async function inventoryRequest(body, cursor, pending = false) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const response = await fetch(`/api/inventory?${new URLSearchParams({ ...(cursor ? { cursor } : {}), ...(pending ? { pending: "1" } : {}) })}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let result; try { result = await response.json(); } catch { throw new Error("Chưa kết nối được API Kiểm Hàng."); }
  if (!response.ok) throw new Error(result.message || "Chưa cập nhật được Kiểm Hàng.");
  return result;
}
export default function InventoryAdmin() {
  const [pendingQuantities, setPendingQuantities] = useState({});
  const [items, setItems] = useState([]); const [drafts, setDrafts] = useState({}); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(""); const [notice, setNotice] = useState(null); const [search, setSearch] = useState(""); const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true); setNotice(null);
      try {
        const [all, pending] = await Promise.all([
          (async () => {
            const all = new Map(); const seen = new Set(); let cursor;
            do { const page = await inventoryRequest(null, cursor); page.items.forEach((item) => all.set(item.id, item)); cursor = page.nextCursor; if (cursor && seen.has(cursor)) throw new Error("Không tải đủ sản phẩm. Hãy tải lại."); if (cursor) seen.add(cursor); } while (cursor);
            return all;
          })(),
          (async () => {
            const pending = Object.create(null); const seen = new Set(); let cursor;
            do { const page = await inventoryRequest(null, cursor, true); for (const [id, quantity] of Object.entries(page.pending)) pending[id] = (pending[id] || 0) + quantity; cursor = page.nextCursor; if (cursor && seen.has(cursor)) throw new Error("Không tải đủ hàng đang chờ. Hãy tải lại."); if (cursor) seen.add(cursor); } while (cursor);
            return pending;
          })(),
        ]);
        if (alive) { setItems([...all.values()]); setPendingQuantities(pending); setDrafts({}); }
      } catch (error) { if (alive) setNotice({ error: true, text: error.message }); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [version]);
  const visible = items.filter((item) => `${item.name} ${item.id}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
  return <section><div className="admin-top"><div><h1>Kiểm Hàng</h1><p className="admin-muted">Nhập số lượng tồn thực tế cho sản phẩm đã tạo.</p></div><button className="admin-btn" disabled={loading || Boolean(saving)} onClick={() => setVersion((value) => value + 1)}>Tải lại tồn kho</button></div>
    <p className="admin-muted">Đơn mới đặt giữ số lượng ở Chờ xác nhận, chưa trừ tồn thực tế. Tồn được trừ một lần khi ghi nhận thanh toán, bắt đầu giao hoặc hoàn tất đơn. Hủy đơn chờ sẽ giải phóng số lượng; hàng đã xuất chỉ hoàn kho khi xác nhận đã nhận hàng trả. Số còn có thể bán = tồn thực tế − hàng chờ.</p>
    <div className="admin-field inventory-search"><label htmlFor="inventory-search">Tìm sản phẩm</label><input id="inventory-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên hoặc ID sản phẩm" /></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    {loading ? <p>Đang tải tồn kho…</p> : <div className="admin-card inventory-table"><table className="admin-table"><thead><tr><th>Sản phẩm</th><th>ID sản phẩm</th><th>Tồn thực tế</th><th>Chờ xác nhận</th><th>Còn có thể bán</th><th>Nhập tồn thực tế</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td data-label="Sản phẩm">{item.name}</td><td data-label="ID sản phẩm"><small>{item.id}</small></td><td data-label="Tồn thực tế">{item.quantity === null ? "Chưa nhập" : item.quantity}</td><td data-label="Chờ xác nhận">{pendingQuantities[item.id] || 0}</td><td data-label="Còn có thể bán">{item.quantity === null ? "Chưa nhập tồn" : item.quantity >= (pendingQuantities[item.id] || 0) ? item.quantity - (pendingQuantities[item.id] || 0) : `Thiếu ${(pendingQuantities[item.id] || 0) - item.quantity}`}</td><td data-label="Nhập tồn thực tế"><form className="inventory-stock-form" onSubmit={async (event) => {
      event.preventDefault(); if (saving) return;
      const value = drafts[item.id] ?? ""; const quantity = Number(value);
      if (!value.trim() || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1_000_000_000) { setNotice({ error: true, text: "Nhập số lượng nguyên không âm." }); return; }
      setSaving(item.id); setNotice(null);
      try { const result = await inventoryRequest({ id: item.id, quantity, version: item.version }); setItems((current) => current.map((entry) => entry.id === item.id ? result.item : entry)); setDrafts((current) => { const next = { ...current }; delete next[item.id]; return next; }); setNotice({ text: `${result.item.name}: tồn kho ${result.item.quantity}.` }); }
      catch (error) { setNotice({ error: true, text: error.message }); }
      finally { setSaving(""); }
    }}><input type="number" aria-label={`Số lượng tồn của ${item.name}`} min="0" max="1000000000" step="1" required placeholder={item.quantity === null ? "Nhập số lượng" : String(item.quantity)} value={drafts[item.id] ?? ""} disabled={Boolean(saving)} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} /><button className="admin-btn" disabled={Boolean(saving) || drafts[item.id] === undefined}>{saving === item.id ? "Đang lưu…" : "Lưu"}</button></form></td></tr>)}</tbody></table>{!visible.length && <p className="admin-muted">Không có sản phẩm phù hợp.</p>}</div>}
  </section>;
}
