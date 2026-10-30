import { useEffect, useState } from "react";
import { getHomeContent, saveHomeContent } from "../lib/api";
import useAddressOptions from "../hooks/useAddressOptions";
import { validShippingFee } from "../lib/shipping";
import { formatVnd } from "../lib/commerce";
export default function ShippingAdmin() {
  const [settings, setSettings] = useState({ enabled: false, provinces: {} }); const [enabled, setEnabled] = useState(false); const [provinceCode, setProvinceCode] = useState(""); const [wardCode, setWardCode] = useState(""); const [drafts, setDrafts] = useState({}); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  const addresses = useAddressOptions(provinceCode);
  useEffect(() => {
    let alive = true;
    getHomeContent().then((home) => { if (alive) { const saved = home?.shippingSettings || { enabled: false, provinces: {} }; setSettings(saved); setEnabled(saved.enabled === true); } }).catch(() => { if (alive) { setFailed(true); setNotice({ error: true, text: "Không tải được cấu hình phí ship. Chưa thể lưu; hãy tải lại trang." }); } }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const current = settings.provinces?.[provinceCode] || {};
  const draft = drafts[provinceCode] || {};
  const fee = draft.fee ?? (current.fee == null ? "" : String(current.fee));
  const override = draft.wardFees?.[wardCode] ?? (current.wardFees?.[wardCode] == null ? "" : String(current.wardFees[wardCode]));
  const patchDraft = (patch) => setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], ...patch } }));
  const save = async (patch, message) => {
    if (loading || failed || busy) return false;
    setBusy(true); setNotice(null);
    try { await saveHomeContent({ shippingSettings: patch }); setNotice({ text: message }); return true; }
    catch { setNotice({ error: true, text: "Chưa lưu được phí ship. Vui lòng thử lại." }); return false; }
    finally { setBusy(false); }
  };
  return <section><div className="admin-top"><div><h1>Phí vận chuyển</h1><p className="admin-muted">Địa chỉ hai cấp: tỉnh/thành phố và phường/xã theo dữ liệu mới.</p></div></div>
    <div className="admin-card admin-form"><h2>Tính ship theo địa chỉ</h2><label className="admin-check"><input type="checkbox" checked={enabled} disabled={loading || failed || busy} onChange={(event) => setEnabled(event.target.checked)} />Tự tính phí ship khi khách đặt hàng</label><p className="admin-muted">Nhập phí trước khi bật. Địa chỉ chưa có mức phí sẽ chưa nhận đơn khi đang bật tính ship; số 0 là miễn phí.</p><div><button className="admin-btn" disabled={loading || failed || busy} onClick={async () => {
      if (enabled && !Object.values(settings.provinces || {}).some((item) => validShippingFee(item.fee) || Object.values(item.wardFees || {}).some(validShippingFee))) return setNotice({ error: true, text: "Lưu ít nhất một mức phí trước khi bật tính ship." });
      if (await save({ enabled }, "Đã lưu trạng thái tính phí ship.")) setSettings((value) => ({ ...value, enabled }));
    }}>Lưu trạng thái tính ship</button></div></div>
    <div className="admin-card admin-form"><h2>Phí theo khu vực</h2>
      <div className="admin-field"><label htmlFor="shipping-province">Tỉnh / Thành phố</label><select id="shipping-province" value={provinceCode} disabled={loading || failed || busy || addresses.loadingProvinces} onChange={(event) => { setProvinceCode(event.target.value); setWardCode(""); }}><option value="">Chọn tỉnh/thành</option>{addresses.provinces.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
      {addresses.error && <p role="alert" className="admin-error">{addresses.error} <button type="button" className="admin-btn" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
      {provinceCode && <>
        <form className="admin-form" onSubmit={async (event) => {
          event.preventDefault(); const amount = fee.trim() === "" ? null : Number(fee);
          if (amount !== null && !validShippingFee(amount)) return setNotice({ error: true, text: "Nhập phí là số nguyên không âm, hoặc để trống để ngừng dùng phí chung." });
          if (await save({ provinces: { [provinceCode]: { fee: amount } } }, "Đã lưu phí chung cho tỉnh/thành.")) { setSettings((value) => ({ ...value, provinces: { ...value.provinces, [provinceCode]: { ...current, fee: amount } } })); setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], fee: undefined } })); }
        }}><div className="admin-field"><label htmlFor="shipping-base-fee">Phí chung toàn tỉnh/thành (đ)</label><input id="shipping-base-fee" type="number" min="0" max="1000000000" step="1" value={fee} disabled={loading || failed || busy} placeholder="Để trống nếu chưa nhận giao" onChange={(event) => patchDraft({ fee: event.target.value })} /></div><div><button className="admin-btn" disabled={loading || failed || busy}>Lưu phí tỉnh/thành</button></div></form>
        <div className="admin-field"><label htmlFor="shipping-ward">Phường / Xã có phí riêng (không bắt buộc)</label><select id="shipping-ward" value={wardCode} disabled={busy || addresses.loadingWards} onChange={(event) => setWardCode(event.target.value)}><option value="">{addresses.loadingWards ? "Đang tải phường/xã…" : "Chọn phường/xã để đặt phí riêng"}</option>{addresses.wards.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
        {wardCode && <form className="admin-form" onSubmit={async (event) => {
          event.preventDefault(); const amount = override.trim() === "" ? null : Number(override);
          if (amount !== null && !validShippingFee(amount)) return setNotice({ error: true, text: "Nhập phí phường/xã là số nguyên không âm." });
          if (await save({ provinces: { [provinceCode]: { wardFees: { [wardCode]: amount } } } }, amount === null ? "Đã dùng lại phí chung của tỉnh/thành." : "Đã lưu phí riêng cho phường/xã.")) { setSettings((value) => ({ ...value, provinces: { ...value.provinces, [provinceCode]: { ...current, wardFees: { ...current.wardFees, [wardCode]: amount } } } })); setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], wardFees: { ...all[provinceCode]?.wardFees, [wardCode]: undefined } } })); }
        }}><div className="admin-field"><label htmlFor="shipping-ward-fee">Phí riêng phường/xã (đ)</label><input id="shipping-ward-fee" type="number" min="0" max="1000000000" step="1" value={override} disabled={busy} placeholder="Để trống để dùng phí chung" onChange={(event) => patchDraft({ wardFees: { ...draft.wardFees, [wardCode]: event.target.value } })} /></div><div><button className="admin-btn" disabled={busy}>Lưu phí phường/xã</button></div></form>}
        <p className="admin-muted">Phí chung đang lưu: {current.fee == null ? "Chưa nhập" : formatVnd(current.fee)}. Phí riêng của phường/xã được ưu tiên; để trống và lưu để dùng lại phí chung.</p>
      </>}
    </div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </section>;
}
