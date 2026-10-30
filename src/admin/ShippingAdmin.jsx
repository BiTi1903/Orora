import AddressSelect from "../components/AddressSelect";
import { getAddressOptions } from "../lib/address-api";
import { useEffect, useState } from "react";
import { getHomeContent, saveHomeContent } from "../lib/api";
import useAddressOptions from "../hooks/useAddressOptions";
import { validShippingFee } from "../lib/shipping";
import { formatVnd } from "../lib/commerce";
export default function ShippingAdmin() {
  const [settings, setSettings] = useState({ enabled: false, provinces: {} }); const [enabled, setEnabled] = useState(false); const [provinceCode, setProvinceCode] = useState(""); const [wardCode, setWardCode] = useState(""); const [drafts, setDrafts] = useState({}); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  const addresses = useAddressOptions(provinceCode);
  const [wardNames, setWardNames] = useState({}); const [feeSearch, setFeeSearch] = useState("");
  const savedProvinceCodes = Object.keys(settings.provinces || {}).sort().join(",");
  useEffect(() => {
    let alive = true;
    const codes = savedProvinceCodes ? savedProvinceCodes.split(",") : [];
    Promise.allSettled(codes.map((code) => getAddressOptions(code))).then((results) => {
      if (alive) setWardNames(Object.fromEntries(results.flatMap((result) => result.status === "fulfilled" ? result.value.map((ward) => [ward.code, ward.name]) : [])));
    });
    return () => { alive = false; };
  }, [savedProvinceCodes]);
  const savedFees = Object.entries(settings.provinces || {}).flatMap(([code, region]) => {
    const provinceName = addresses.provinces.find((item) => item.code === code)?.name || `Mã tỉnh ${code}`;
    return [...(validShippingFee(region.fee) ? [{ provinceCode: code, provinceName, wardCode: "", wardName: "Toàn tỉnh/thành", fee: region.fee }] : []), ...Object.entries(region.wardFees || {}).filter(([, fee]) => validShippingFee(fee)).map(([wardCode, fee]) => ({ provinceCode: code, provinceName, wardCode, wardName: wardNames[wardCode] || `Mã phường/xã ${wardCode}`, fee }))];
  }).filter((item) => `${item.provinceName} ${item.wardName} ${item.provinceCode} ${item.wardCode}`.toLocaleLowerCase("vi").includes(feeSearch.trim().toLocaleLowerCase("vi")));
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
  return <section className="shipping-settings"><div className="admin-top"><div><h1>Phí vận chuyển</h1><p className="admin-muted">Địa chỉ hai cấp: tỉnh/thành phố và phường/xã theo dữ liệu mới.</p></div></div>
    <div className="admin-card admin-form"><h2>Tính ship theo địa chỉ</h2><label className="admin-check"><input type="checkbox" checked={enabled} disabled={loading || failed || busy} onChange={(event) => setEnabled(event.target.checked)} />Tự tính phí ship khi khách đặt hàng</label><p className="admin-muted">Nhập phí trước khi bật. Địa chỉ chưa có mức phí sẽ chưa nhận đơn khi đang bật tính ship; số 0 là miễn phí.</p><div><button className="admin-btn" disabled={loading || failed || busy} onClick={async () => {
      if (enabled && !Object.values(settings.provinces || {}).some((item) => validShippingFee(item.fee) || Object.values(item.wardFees || {}).some(validShippingFee))) return setNotice({ error: true, text: "Lưu ít nhất một mức phí trước khi bật tính ship." });
      if (await save({ enabled }, "Đã lưu trạng thái tính phí ship.")) setSettings((value) => ({ ...value, enabled }));
    }}>Lưu trạng thái tính ship</button></div></div>
    <div className="admin-card admin-form"><h2>Phí theo khu vực</h2>
      <AddressSelect label="Tỉnh / Thành phố" value={provinceCode} options={addresses.provinces.map((item) => ({ ...item, meta: validShippingFee(settings.provinces?.[item.code]?.fee) ? formatVnd(settings.provinces[item.code].fee) : "Chưa có phí chung" }))} disabled={loading || failed || busy} loading={addresses.loadingProvinces} placeholder="Tìm và chọn tỉnh/thành" onChange={(code) => { setProvinceCode(code); setWardCode(""); }} />
      {addresses.error && <p role="alert" className="admin-error">{addresses.error} <button type="button" className="admin-btn" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
      {provinceCode && <>
        <form className="admin-form" onSubmit={async (event) => {
          event.preventDefault(); const amount = fee.trim() === "" ? null : Number(fee);
          if (amount !== null && !validShippingFee(amount)) return setNotice({ error: true, text: "Nhập phí là số nguyên không âm, hoặc để trống để ngừng dùng phí chung." });
          if (await save({ provinces: { [provinceCode]: { fee: amount } } }, "Đã lưu phí chung cho tỉnh/thành.")) { setSettings((value) => ({ ...value, provinces: { ...value.provinces, [provinceCode]: { ...current, fee: amount } } })); setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], fee: undefined } })); }
        }}><div className="admin-field"><label htmlFor="shipping-base-fee">Phí chung toàn tỉnh/thành (đ)</label><input id="shipping-base-fee" type="number" min="0" max="1000000000" step="1" value={fee} disabled={loading || failed || busy} placeholder="Để trống nếu chưa nhận giao" onChange={(event) => patchDraft({ fee: event.target.value })} /></div><div><button className="admin-btn" disabled={loading || failed || busy}>Lưu phí tỉnh/thành</button></div></form>
        <AddressSelect label="Phường / Xã có phí riêng (không bắt buộc)" value={wardCode} options={addresses.wards} disabled={busy} loading={addresses.loadingWards} placeholder="Tìm và chọn phường/xã" onChange={setWardCode} />
        {wardCode && <form className="admin-form" onSubmit={async (event) => {
          event.preventDefault(); const amount = override.trim() === "" ? null : Number(override);
          if (amount !== null && !validShippingFee(amount)) return setNotice({ error: true, text: "Nhập phí phường/xã là số nguyên không âm." });
          if (await save({ provinces: { [provinceCode]: { wardFees: { [wardCode]: amount } } } }, amount === null ? "Đã dùng lại phí chung của tỉnh/thành." : "Đã lưu phí riêng cho phường/xã.")) { setSettings((value) => ({ ...value, provinces: { ...value.provinces, [provinceCode]: { ...current, wardFees: { ...current.wardFees, [wardCode]: amount } } } })); setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], wardFees: { ...all[provinceCode]?.wardFees, [wardCode]: undefined } } })); }
        }}><div className="admin-field"><label htmlFor="shipping-ward-fee">Phí riêng phường/xã (đ)</label><input id="shipping-ward-fee" type="number" min="0" max="1000000000" step="1" value={override} disabled={busy} placeholder="Để trống để dùng phí chung" onChange={(event) => patchDraft({ wardFees: { ...draft.wardFees, [wardCode]: event.target.value } })} /></div><div><button className="admin-btn" disabled={busy}>Lưu phí phường/xã</button></div></form>}
        <p className="admin-muted">Phí chung đang lưu: {current.fee == null ? "Chưa nhập" : formatVnd(current.fee)}. Phí riêng của phường/xã được ưu tiên; để trống và lưu để dùng lại phí chung.</p>
      </>}
    </div>
    <div className="admin-card admin-form shipping-saved-fees"><h2>Phí vận chuyển đã lưu</h2><p className="admin-muted">Đây là các mức phí đã lưu, chưa gồm bản đang sửa. Phí riêng phường/xã được ưu tiên hơn phí chung.</p><div className="admin-field"><label htmlFor="shipping-fee-search">Tìm khu vực đã nhập phí</label><input id="shipping-fee-search" type="search" value={feeSearch} onChange={(event) => setFeeSearch(event.target.value)} placeholder="Tỉnh/thành hoặc phường/xã" /></div><div className="shipping-fee-table"><table className="admin-table"><thead><tr><th>Tỉnh / Thành phố</th><th>Phạm vi</th><th>Phí giao hàng</th><th /></tr></thead><tbody>{savedFees.map((item) => <tr key={`${item.provinceCode}-${item.wardCode}`}><td data-label="Tỉnh / Thành phố">{item.provinceName}</td><td data-label="Phạm vi">{item.wardName}</td><td data-label="Phí giao hàng"><strong>{item.fee === 0 ? "Miễn phí" : formatVnd(item.fee)}</strong></td><td><button type="button" className="admin-btn" disabled={busy} onClick={(event) => { const doc = event.currentTarget.ownerDocument; setProvinceCode(item.provinceCode); setWardCode(item.wardCode); requestAnimationFrame(() => doc.getElementById(item.wardCode ? "shipping-ward-fee" : "shipping-base-fee")?.focus()); }}>Chỉnh phí</button></td></tr>)}</tbody></table></div>{!loading && !savedFees.length && <p className="admin-muted">Chưa có mức phí phù hợp.</p>}</div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </section>;
}
