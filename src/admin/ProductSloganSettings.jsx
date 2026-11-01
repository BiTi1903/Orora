import { useEffect, useState } from "react";
import { explainError, getHomeContent, saveHomeContent } from "../lib/api";

export default function ProductSloganSettings() {
  const [form, setForm] = useState({ enabled: true, title: "Slogan", text: "" });
  const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  useEffect(() => {
    let alive = true;
    getHomeContent().then((home) => { if (alive && home?.productSlogan) setForm((current) => ({ ...current, ...home.productSlogan, title: typeof home.productSlogan.title === "string" ? home.productSlogan.title : "Slogan", text: typeof home.productSlogan.text === "string" ? home.productSlogan.text : "" })); })
      .catch((error) => { if (alive) { setFailed(true); setNotice({ error: true, text: explainError(error) }); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return <form className="admin-card admin-form" onSubmit={async (event) => {
    event.preventDefault(); if (loading || failed || busy) return;
    if (form.title.length > 80 || form.text.length > 2000) { setNotice({ error: true, text: "Tiêu đề tối đa 80 ký tự, nội dung Slogan tối đa 2.000 ký tự." }); return; }
    setBusy(true); setNotice(null);
    try { await saveHomeContent({ productSlogan: { ...form, title: form.title.trim() || "Slogan", text: form.text } }); setNotice({ text: "Đã lưu Slogan trên trang chi tiết sản phẩm." }); }
    catch (error) { setNotice({ error: true, text: explainError(error) }); }
    finally { setBusy(false); }
  }}>
    <h2>Slogan trên chi tiết sản phẩm</h2><p className="admin-muted">Dùng chung cho các sản phẩm, nằm dưới khối cam kết. Nội dung riêng, không thay đổi Triết lý trang chủ. Chưa nhập nội dung thì khối này chưa hiển thị.</p>
    {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    <fieldset className="writer-fields" disabled={loading || failed || busy}>
      <label className="admin-check"><input type="checkbox" checked={form.enabled !== false} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />Hiển thị Slogan trên chi tiết sản phẩm</label>
      <div className="admin-field"><label htmlFor="product-slogan-title">Tiêu đề Slogan</label><input id="product-slogan-title" maxLength={80} value={form.title} placeholder="Slogan" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
      <div className="admin-field"><label htmlFor="product-slogan-text">Nội dung Slogan</label><textarea id="product-slogan-text" rows={5} maxLength={2000} value={form.text} placeholder="Nhập Slogan của cửa hàng…" onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} /><small className="admin-muted">Enter để xuống dòng. Chỉnh font, màu và cỡ chữ tại Trang chủ → Chi tiết SP.</small></div>
      <div><button className="admin-btn primary">{busy ? "Đang lưu…" : "Lưu Slogan"}</button></div>
    </fieldset>
  </form>;
}
