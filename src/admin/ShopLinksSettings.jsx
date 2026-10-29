import { useEffect, useState } from "react";
import { getHomeContent, saveHomeContent, explainError } from "../lib/api";
import { socialShopUrl, availablePaymentMethods, PAYMENT_LABELS } from "../lib/commerce";

export default function ShopLinksSettings() {
  const [form, setForm] = useState({ tiktokUrl: "", facebookUrl: "", paymentMethods: ["cod", "bank_transfer"] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => {
    let alive = true;
    getHomeContent().then((data) => { if (alive) setForm({ tiktokUrl: data?.shopLinks?.tiktokUrl || "", facebookUrl: data?.shopLinks?.facebookUrl || "", paymentMethods: availablePaymentMethods(data || {}) }); })
      .catch((error) => { if (alive) { setFailed(true); setNotice({ error: true, text: explainError(error) }); } })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  return <form className="admin-card admin-form" style={{ marginBottom: 20 }} onSubmit={async (event) => {
    event.preventDefault();
    if (loading || failed || busy) return;
    for (const [key, platform] of [["tiktokUrl", "tiktok"], ["facebookUrl", "facebook"]]) {
      if (form[key].trim() && !socialShopUrl(form[key], platform)) return setNotice({ error: true, text: `Link ${platform === "tiktok" ? "TikTok" : "Facebook"} không hợp lệ. Dùng đường dẫn HTTPS của đúng nền tảng.` });
    }
    if (!form.paymentMethods.length) return setNotice({ error: true, text: "Chọn ít nhất một phương thức thanh toán cho đơn web." });
    setBusy(true);
    try {
      await saveHomeContent({ shopLinks: { tiktokUrl: form.tiktokUrl.trim(), facebookUrl: form.facebookUrl.trim(), paymentMethods: form.paymentMethods } });
      setNotice({ text: "Đã lưu kênh mua hàng dùng chung cho tất cả sản phẩm." });
    } catch (error) { setNotice({ error: true, text: explainError(error) }); }
    finally { setBusy(false); }
  }}>
    <h2>Kênh mua hàng dùng chung</h2>
    <p className="admin-muted">Link dùng cho mọi sản phẩm. Để trống thì ẩn nút tương ứng; không thay đổi các link mạng xã hội ở chân trang.</p>
    <fieldset disabled={loading || failed || busy} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <div className="admin-field"><label htmlFor="shop-tiktok">TikTok Shop</label><input id="shop-tiktok" type="url" maxLength={2048} value={form.tiktokUrl} placeholder="https://www.tiktok.com/@..." onChange={(event) => setForm({ ...form, tiktokUrl: event.target.value })} /></div>
      <div className="admin-field"><label htmlFor="shop-facebook">Facebook fanpage / shop</label><input id="shop-facebook" type="url" maxLength={2048} value={form.facebookUrl} placeholder="https://www.facebook.com/..." onChange={(event) => setForm({ ...form, facebookUrl: event.target.value })} /></div>
      <div className="admin-field"><span>Phương thức thanh toán cho đơn web</span>
        {Object.entries(PAYMENT_LABELS).map(([key, label]) => <label key={key} className="admin-check"><input type="checkbox" checked={form.paymentMethods.includes(key)} onChange={(event) => setForm({ ...form, paymentMethods: event.target.checked ? [...form.paymentMethods, key] : form.paymentMethods.filter((value) => value !== key) })} />{label}</label>)}
      </div>
      <button className="admin-btn" disabled={loading || failed || busy}>{busy ? "Đang lưu…" : "Lưu kênh mua hàng"}</button>
    </fieldset>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </form>;
}
