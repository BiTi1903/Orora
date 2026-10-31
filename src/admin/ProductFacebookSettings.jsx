import { useEffect, useState } from "react";
import ImageField from "./ImageField";
import { explainError, getHomeContent, saveHomeContent } from "../lib/api";
import { facebookFollowUrl } from "../lib/commerce";
export default function ProductFacebookSettings() {
  const [form, setForm] = useState({ enabled: true, image: "", url: "", label: "Facebook +" });
  const [fallbackUrl, setFallbackUrl] = useState(""); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false); const [uploading, setUploading] = useState(false); const [notice, setNotice] = useState(null);
  useEffect(() => { let alive = true; getHomeContent().then((home) => { if (alive) { setForm((current) => ({ ...current, ...home?.productFacebook })); setFallbackUrl(home?.shopLinks?.facebookUrl || ""); } }).catch((error) => { if (alive) { setFailed(true); setNotice({ error: true, text: explainError(error) }); } }).finally(() => { if (alive) setLoading(false); }); return () => { alive = false; }; }, []);
  return <form className="admin-card admin-form" style={{ marginBottom: 20 }} onSubmit={async (event) => {
    event.preventDefault(); if (loading || failed || busy || uploading) return;
    if ((form.url.trim() && !facebookFollowUrl(form.url)) || (form.enabled && form.image.trim() && !facebookFollowUrl(form.url.trim() || fallbackUrl))) { setNotice({ error: true, text: "Nhập link HTTPS của fanpage Facebook; không dùng link Messenger hoặc website khác." }); return; }
    setBusy(true); setNotice(null);
    try { await saveHomeContent({ productFacebook: { ...form, image: form.image.trim(), url: form.url.trim(), label: form.label.trim() || "Facebook +" } }); setNotice({ text: "Đã lưu khối Facebook trên trang sản phẩm." }); }
    catch (error) { setNotice({ error: true, text: explainError(error) }); }
    finally { setBusy(false); }
  }}><h2>Khối Facebook dưới cam kết</h2><p className="admin-muted">Thay ảnh thương hiệu ORORA và link fanpage. Nút mở Facebook để khách tự chọn Theo dõi; không tự theo dõi hoặc hiển thị số người theo dõi.</p>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    <fieldset className="writer-fields" disabled={loading || failed || busy}>
      <label className="admin-check"><input type="checkbox" checked={form.enabled !== false} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />Hiển thị khối Facebook</label>
      <ImageField label="Ảnh ORORA trong khối Facebook" value={form.image} onChange={(image) => setForm((current) => ({ ...current, image }))} onBusyChange={setUploading} width={800} />
      <div className="admin-field"><label htmlFor="product-facebook-url">Link fanpage Facebook</label><input id="product-facebook-url" type="url" value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} placeholder={fallbackUrl || "https://www.facebook.com/..."} /><small className="admin-muted">Để trống để dùng link Facebook đã lưu ở Kênh mua hàng. Khối chỉ hiện khi có ảnh và link hợp lệ.</small></div>
      <div className="admin-field"><label htmlFor="product-facebook-label">Chữ trên nút Facebook</label><input id="product-facebook-label" value={form.label} maxLength={60} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} /></div>
      <div><button className="admin-btn primary" disabled={uploading}>Lưu khối Facebook</button></div>
    </fieldset>
  </form>;
}
