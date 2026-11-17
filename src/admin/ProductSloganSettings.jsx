import useDraftGuard from "../hooks/useDraftGuard";
import { useEffect, useRef, useState } from "react";
import { explainError, getHomeContent, saveHomeContent } from "../lib/api";
import { changedValues, mergeSavedValues } from "./builder/save-sections";
import ProductSloganCard from "../components/ProductSloganCard";
import { SloganAppearanceEditor, SloganTypographyEditor } from "./ProductSloganDesign";

export default function ProductSloganSettings() {
  const [form, setForm] = useState({ enabled: true, title: "", text: "" });
  const [styles, setStyles] = useState({});
  const baseline = useRef({});
  const [panel, setPanel] = useState("content");
  const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  useEffect(() => {
    let alive = true;
    getHomeContent().then((home) => {
      if (!alive) return;
      const productSlogan = { enabled: true, ...home?.productSlogan, title: typeof home?.productSlogan?.title === "string" ? home.productSlogan.title : "", text: typeof home?.productSlogan?.text === "string" ? home.productSlogan.text : "" };
      const productDetailStyles = Object.fromEntries(["sloganCard", "sloganTitle", "sloganBody"].map((key) => [key, home?.productDetailStyles?.[key] || {}]));
      baseline.current = { productSlogan, productDetailStyles };
      setForm(productSlogan); setStyles(productDetailStyles);
    })
      .catch((error) => { if (alive) { setFailed(true); setNotice({ error: true, text: explainError(error) }); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const markSaved=useDraftGuard({form,styles},{enabled:!loading&&!failed,busy});
  const updateStyle = (key, patch) => setStyles((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  return <form aria-busy={busy} className="admin-card admin-form slogan-settings-form" onInvalidCapture={(event) => {
    const target = event.target;
    const nextPanel = target.closest("[data-slogan-panel]")?.dataset.sloganPanel;
    if (nextPanel) { setPanel(nextPanel); requestAnimationFrame(() => target.focus()); }
  }} onSubmit={async (event) => {
    event.preventDefault(); if (loading || failed || busy) return;
    if (form.title.length > 80 || form.text.length > 2000) { setNotice({ error: true, text: "Tiêu đề tối đa 80 ký tự, nội dung Slogan tối đa 2.000 ký tự." }); return; }
    setBusy(true); setNotice(null);
    try {
      const payload = { productSlogan: { ...form, title: form.title.trim(), text: form.text }, productDetailStyles: styles };
      const patch = changedValues(baseline.current, payload);
      if (Object.keys(patch).length) { await saveHomeContent(patch); baseline.current = mergeSavedValues(baseline.current, patch); }
      markSaved();setNotice({ text: "Đã lưu Slogan trên trang chi tiết sản phẩm." });
    }
    catch (error) { setNotice({ error: true, text: explainError(error) }); }
    finally { setBusy(false); }
  }}>
    <div className="slogan-settings-toolbar"><div><h2>Slogan trên chi tiết sản phẩm</h2><p className="admin-muted">Nhập nội dung, tùy chỉnh kiểu chữ và khung Slogan. Tiêu đề có thể bật hoặc tắt.</p></div><button type="submit" className="admin-btn primary" aria-busy={busy} disabled={loading || failed || busy}>{busy ? "Đang lưu…" : "Lưu Slogan"}</button></div>
    {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    <fieldset className="writer-fields" disabled={loading || failed || busy}>
      <div className="slogan-settings-layout"><div className="slogan-settings-controls">
        <nav className="slogan-settings-tabs" aria-label="Các phần chỉnh Slogan">{[["content", "Nội dung"], ["text", "Kiểu chữ"], ["card", "Khung thẻ"]].map(([key, label]) => <button key={key} type="button" aria-pressed={panel === key} onClick={() => setPanel(key)}>{label}</button>)}</nav>
        <div hidden={panel !== "content"} data-slogan-panel="content" className="slogan-content-fields">
          <label className="admin-check"><input type="checkbox" role="switch" checked={form.enabled !== false} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />Hiển thị Slogan trên chi tiết sản phẩm</label>
          <label className="admin-check"><input type="checkbox" role="switch" checked={styles.sloganCard?.showTitle !== false} onChange={(event) => updateStyle("sloganCard", { showTitle: event.target.checked })} />Hiển thị tiêu đề</label>
          <small className="admin-muted">Tắt để chỉ hiện nội dung. Tiêu đề đã nhập vẫn được giữ để dùng lại.</small>
          <div className="admin-field"><label htmlFor="product-slogan-title">Tiêu đề Slogan</label><input id="product-slogan-title" disabled={styles.sloganCard?.showTitle === false} maxLength={80} value={form.title} placeholder="Ví dụ: Triết lý của ORORA (không bắt buộc)" onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} /></div>
          <div className="admin-field"><label htmlFor="product-slogan-text">Nội dung Slogan</label><textarea id="product-slogan-text" rows={5} maxLength={2000} value={form.text} placeholder="Nhập Slogan của cửa hàng…" onChange={(event) => setForm((current) => ({ ...current, text: event.target.value }))} /><small className="admin-muted">Enter để xuống dòng. Chưa nhập nội dung thì thẻ chưa hiển thị trên website.</small></div>
        </div>
        <div hidden={panel !== "text"} data-slogan-panel="text"><SloganTypographyEditor title="Chữ tiêu đề" value={styles.sloganTitle} onChange={(patch) => updateStyle("sloganTitle", patch)} /><SloganTypographyEditor title="Chữ nội dung" body value={styles.sloganBody} onChange={(patch) => updateStyle("sloganBody", patch)} /></div>
        <div hidden={panel !== "card"} data-slogan-panel="card"><SloganAppearanceEditor value={styles.sloganCard} onChange={(patch) => updateStyle("sloganCard", patch)} /></div>
      </div><div className="slogan-settings-preview"><span className="slogan-preview-label">Xem trước{form.enabled === false ? " · đang tắt trên website" : ""}</span>{form.text.trim() ? <ProductSloganCard home={{ productSlogan: { ...form, enabled: true } }} styles={styles} /> : <p className="admin-muted slogan-preview-empty">Nhập nội dung để xem trước Slogan.</p>}<small className="admin-muted">Thay đổi chỉ áp dụng sau khi bấm Lưu Slogan.</small></div></div>
    </fieldset>
  </form>;
}
