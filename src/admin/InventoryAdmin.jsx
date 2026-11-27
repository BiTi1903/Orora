import TranslationHelp from "./TranslationHelp";
import { useConfirm } from "./confirm-context";
import useDraftGuard from "../hooks/useDraftGuard";
import { productNumber, withProductIdentity } from "../lib/product-identity";
import { useEffect, useState } from "react";
import { fetchInventoryCached, getAdminCache, inventoryApiRequest, setAdminCache } from "./admin-cache";
export default function InventoryAdmin() {
  const confirm = useConfirm();
  const cached = getAdminCache("inventory");
  const [pendingQuantities, setPendingQuantities] = useState(() => cached?.pendingQuantities || {});
  const [items, setItems] = useState(() => cached?.items || []); const [drafts, setDrafts] = useState({}); const [loading, setLoading] = useState(() => !cached); const [saving, setSaving] = useState(""); const [notice, setNotice] = useState(null); const [search, setSearch] = useState(""); const [version, setVersion] = useState(0);
  const guard=useDraftGuard(null,{enabled:!loading,busy:Boolean(saving),dirty:Object.values(drafts).some(value=>String(value).trim()!=="")});
  useEffect(() => {
    let alive = true;
    async function load() {
      const hasCached = Boolean(getAdminCache("inventory"));
      if (!hasCached) setLoading(true);
      setNotice(null);
      try {
        const data = await fetchInventoryCached({ force: version > 0 || hasCached });
        if (alive) {
          setItems(data.items);
          setPendingQuantities(data.pendingQuantities);
          if (version > 0 || !hasCached) setDrafts({});
        }
      } catch (error) { if (alive) setNotice({ error: true, text: error.message }); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [version]);
  const pendingDraftEntries = items
    .filter((item) => drafts[item.id] !== undefined && String(drafts[item.id]).trim() !== "")
    .map((item) => ({ item, raw: String(drafts[item.id]).trim(), quantity: Number(drafts[item.id]) }));
  const saveAll = async () => {
    if (saving || !pendingDraftEntries.length) return;
    const invalid = pendingDraftEntries.find((entry) => !Number.isSafeInteger(entry.quantity) || entry.quantity < 0 || entry.quantity > 1_000_000_000);
    if (invalid) { setNotice({ error: true, text: `Số lượng của "${invalid.item.name}" phải là số nguyên không âm.` }); return; }
    setSaving("__all__"); setNotice(null);
    let savedCount = 0;
    try {
      for (const entry of pendingDraftEntries) {
        const result = await inventoryApiRequest({ id: entry.item.id, quantity: entry.quantity, version: entry.item.version });
        setItems((current) => {
          const next = withProductIdentity(current.map((row) => row.id === entry.item.id ? { ...row, ...result.item } : row));
          setAdminCache("inventory", { items: next, pendingQuantities });
          return next;
        });
        setDrafts((current) => { const next = { ...current }; delete next[entry.item.id]; return next; });
        savedCount += 1;
      }
      setNotice({ text: `Đã lưu tồn kho cho ${savedCount} mục.` });
    } catch (error) {
      setNotice({ error: true, text: savedCount ? `Đã lưu ${savedCount} mục, dừng do lỗi: ${error.message}` : error.message });
    } finally {
      setSaving("");
    }
  };
  const visible = items.filter((item) => `${item.name} ${productNumber(item)} ${item.id}`.toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
  return <section><div className="admin-top"><div><h1>Kiểm Hàng</h1><p className="admin-muted">Nhập số lượng tồn thực tế cho từng sản phẩm hoặc từng dung tích.</p></div><div className="admin-actions">{pendingDraftEntries.length > 0 && <button type="button" className="admin-btn primary" aria-busy={saving === "__all__"} disabled={loading || Boolean(saving)} onClick={saveAll}>{saving === "__all__" ? "Đang lưu tất cả…" : `Lưu tất cả (${pendingDraftEntries.length})`}</button>}<button className="admin-btn" disabled={loading || Boolean(saving)} onClick={async () => {if(!guard.hasChanges()||await confirm("Bạn có số lượng chưa lưu. Tải lại và bỏ các thay đổi này?", { title: "Tải lại tồn kho", confirmLabel: "Bỏ thay đổi và tải lại", danger: true }))setVersion((value) => value + 1);}}>Tải lại tồn kho</button></div></div>
    <p className="admin-muted">Đơn mới đặt giữ số lượng ở Chờ xác nhận, chưa trừ tồn thực tế. Tồn được trừ một lần khi ghi nhận thanh toán, bắt đầu giao hoặc hoàn tất đơn. Hủy đơn chờ sẽ giải phóng số lượng; hàng đã xuất chỉ hoàn kho khi xác nhận đã nhận hàng trả. Số còn có thể bán = tồn thực tế − hàng chờ.</p>
    <div className="admin-field inventory-search"><label htmlFor="inventory-search">Tìm sản phẩm</label><input id="inventory-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tên, dung tích hoặc mã sản phẩm" /></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    {loading ? <p>Đang tải tồn kho…</p> : <div className="admin-card inventory-table"><table className="admin-table"><thead><tr><th>Sản phẩm</th><th>Mã SP</th><th>Tồn thực tế</th><th>Chờ xác nhận</th><th>Còn có thể bán</th><th>Nhập tồn thực tế <TranslationHelp label="nhập tồn thực tế">Nhập số đếm thực tế của đúng sản phẩm và dung tích. Cột Chờ xác nhận cho biết số đang giữ cho đơn.</TranslationHelp></th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td data-label="Sản phẩm">{item.name}</td><td data-label="Mã SP"><small>#{productNumber(item)}</small></td><td data-label="Tồn thực tế">{item.quantity === null ? "Chưa nhập" : item.quantity}</td><td data-label="Chờ xác nhận">{pendingQuantities[item.id] || 0}</td><td data-label="Còn có thể bán">{item.quantity === null ? "Chưa nhập tồn" : item.quantity >= (pendingQuantities[item.id] || 0) ? item.quantity - (pendingQuantities[item.id] || 0) : `Thiếu ${(pendingQuantities[item.id] || 0) - item.quantity}`}</td><td data-label="Nhập tồn thực tế"><form aria-busy={saving === item.id} className="inventory-stock-form" onSubmit={async (event) => {
      event.preventDefault(); if (saving) return;
      const value = drafts[item.id] ?? ""; const quantity = Number(value);
      if (!value.trim() || !Number.isSafeInteger(quantity) || quantity < 0 || quantity > 1_000_000_000) { setNotice({ error: true, text: "Nhập số lượng nguyên không âm." }); return; }
      setSaving(item.id); setNotice(null);
      try { const result = await inventoryApiRequest({ id: item.id, quantity, version: item.version }); setItems((current) => { const next = withProductIdentity(current.map((entry) => entry.id === item.id ? { ...entry, ...result.item } : entry)); setAdminCache("inventory", { items: next, pendingQuantities }); return next; }); setDrafts((current) => { const next = { ...current }; delete next[item.id]; return next; }); setNotice({ text: `${result.item.name}: tồn kho ${result.item.quantity}.` }); }
      catch (error) { setNotice({ error: true, text: error.message }); }
      finally { setSaving(""); }
    }}><input type="number" aria-label={`Số lượng tồn của ${item.name}`} min="0" max="1000000000" step="1" required placeholder={item.quantity === null ? "Nhập số lượng" : String(item.quantity)} value={drafts[item.id] ?? ""} disabled={Boolean(saving)} onChange={(event) => setDrafts((current) => ({ ...current, [item.id]: event.target.value }))} /><button className="admin-btn" aria-busy={saving === item.id} disabled={Boolean(saving) || drafts[item.id] === undefined}>{saving === item.id ? "Đang lưu…" : "Lưu"}</button></form></td></tr>)}</tbody></table>{!visible.length && <p className="admin-muted">Không có sản phẩm phù hợp.</p>}</div>}
  </section>;
}
