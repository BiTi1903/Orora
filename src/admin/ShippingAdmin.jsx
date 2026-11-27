import TranslationHelp from "./TranslationHelp";
import AddressSelect from "../components/AddressSelect";
import { getAddressOptions } from "../lib/address-api";
import { useEffect, useState } from "react";
import { getHomeContent, saveHomeContent } from "../lib/api";
import useAddressOptions from "../hooks/useAddressOptions";
import useDraftGuard from "../hooks/useDraftGuard";
import { useConfirm } from "./confirm-context";
import { validShippingFee, shippingPolicy, freeShippingThreshold } from "../lib/shipping";
import { formatVnd } from "../lib/commerce";
export default function ShippingAdmin() {
  const [freeFrom,setFreeFrom]=useState("");
  const confirm = useConfirm();
  const [settings, setSettings] = useState({ enabled: false, provinces: {} }); const [enabled, setEnabled] = useState(false); const [provinceCode, setProvinceCode] = useState(""); const [wardCode, setWardCode] = useState(""); const [drafts, setDrafts] = useState({}); const [loading, setLoading] = useState(true); const [failed, setFailed] = useState(false); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  const [savingAction,setSavingAction]=useState("");
  const [version, setVersion] = useState(0);
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
    async function load() {
      setLoading(true); setNotice(null);
      try {
        const home = await getHomeContent();
        if (alive) { const saved = home?.shippingSettings || { enabled: false, provinces: {} }; setSettings(saved);setFreeFrom(String(freeShippingThreshold(saved)??"")); setEnabled(saved.enabled === true); setDrafts({}); setFailed(false); }
      } catch { if (alive) { setFailed(true); setNotice({ error: true, text: "Không tải được cấu hình phí ship. Chưa thể lưu; hãy bấm Tải lại." }); } }
      finally { if (alive) setLoading(false); }
    }
    load();
    return () => { alive = false; };
  }, [version]);
  const hasUnsavedChanges = freeFrom!==String(freeShippingThreshold(settings)??"") || enabled !== (settings.enabled === true) || Object.entries(drafts).some(([code, regionDraft]) => {
    const savedRegion = settings.provinces?.[code] || {};
    if (regionDraft.fee !== undefined && regionDraft.fee !== (savedRegion.fee == null ? "" : String(savedRegion.fee))) return true;
    return Object.entries(regionDraft.wardFees || {}).some(([wCode, wVal]) => wVal !== undefined && wVal !== (savedRegion.wardFees?.[wCode] == null ? "" : String(savedRegion.wardFees[wCode])));
  });
  useDraftGuard({ enabled, drafts }, { enabled: !loading && !failed, busy, dirty: hasUnsavedChanges });
  const current = settings.provinces?.[provinceCode] || {};
  const draft = drafts[provinceCode] || {};
  const fee = draft.fee ?? (current.fee == null ? "" : String(current.fee));
  const override = draft.wardFees?.[wardCode] ?? (current.wardFees?.[wardCode] == null ? "" : String(current.wardFees[wardCode]));
  const patchDraft = (patch) => setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], ...patch } }));
  const save = async (patch, message, action = "") => {
    if (loading || failed || busy) return false;
    setBusy(true);setSavingAction(action);setNotice(null);
    try { await saveHomeContent({ shippingSettings: patch }); setNotice({ text: message }); return true; }
    catch { setNotice({ error: true, text: "Chưa lưu được phí ship. Vui lòng thử lại." }); return false; }
    finally { setBusy(false);setSavingAction(""); }
  };
  return <section className="shipping-settings"><div className="admin-top"><div><h1>Phí vận chuyển</h1><p className="admin-muted">Địa chỉ hai cấp: tỉnh/thành phố và phường/xã theo dữ liệu mới.</p></div><button type="button" className="admin-btn" disabled={loading || busy} onClick={async () => { if (hasUnsavedChanges && !await confirm("Bạn có thay đổi phí ship chưa lưu. Tải lại và bỏ các thay đổi này?", { title: "Tải lại phí vận chuyển", confirmLabel: "Tải lại", danger: true })) return; setDrafts({}); setVersion((value) => value + 1); }}>Tải lại</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
    <div aria-busy={busy && savingAction === "enabled"} className="admin-card admin-form"><h2>Tính ship theo địa chỉ <TranslationHelp label="tính phí vận chuyển">Phí riêng của phường/xã được ưu tiên. Ngưỡng miễn phí áp dụng khi tạm tính lớn hơn số đã nhập, tại địa chỉ được hỗ trợ.</TranslationHelp></h2><label className="admin-check"><input type="checkbox" role="switch" checked={enabled} disabled={loading || failed || busy} onChange={(event) => setEnabled(event.target.checked)} />Tự tính phí ship khi khách đặt hàng</label><p className="admin-muted">Nhập phí trước khi bật. Địa chỉ chưa có mức phí sẽ chưa nhận đơn khi đang bật tính ship; số 0 là miễn phí.</p><label>Miễn phí khi tạm tính lớn hơn (đ)<input type="number" min="1" step="1" disabled={busy||failed||loading} value={freeFrom} onChange={event=>setFreeFrom(event.target.value)} placeholder="Để trống để tắt"/></label><p>Áp dụng trên tạm tính sản phẩm cho địa chỉ có hỗ trợ giao hàng.</p><p>Khách sẽ thấy sau khi lưu: {shippingPolicy(enabled)}</p><div><button className="admin-btn" aria-busy={busy && savingAction === "enabled"} disabled={loading || failed || busy} onClick={async () => {
      if (enabled && !Object.values(settings.provinces || {}).some((item) => validShippingFee(item.fee) || Object.values(item.wardFees || {}).some(validShippingFee))) return setNotice({ error: true, text: "Lưu ít nhất một mức phí trước khi bật tính ship." });
      const threshold=freeFrom===""?null:Number(freeFrom);
      if(threshold!==null&&(!validShippingFee(threshold)||threshold<=0))return setNotice({error:true,text:"Nhập ngưỡng miễn phí là số nguyên dương."});
      if (await save({ enabled,freeAbove:threshold }, "Đã lưu trạng thái tính phí ship.","enabled")) setSettings((value) => ({ ...value, enabled,freeAbove:threshold }));
    }}>Lưu trạng thái tính ship</button></div></div>
    <div className="admin-card admin-form"><h2>Phí theo khu vực <TranslationHelp label="phí theo khu vực">Nhập 0 nếu muốn miễn phí giao hàng cho khu vực đó. Nếu chọn thêm Phường/Xã và lưu phí riêng, mức phí riêng sẽ ghi đè phí chung của tỉnh/thành.</TranslationHelp></h2>
      <AddressSelect label="Tỉnh / Thành phố" value={provinceCode} options={addresses.provinces.map((item) => ({ ...item, meta: validShippingFee(settings.provinces?.[item.code]?.fee) ? formatVnd(settings.provinces[item.code].fee) : "Chưa có phí chung" }))} disabled={loading || failed || busy} loading={addresses.loadingProvinces} placeholder="Tìm và chọn tỉnh/thành" onChange={(code) => { setProvinceCode(code); setWardCode(""); }} />
      {addresses.error && <p role="alert" className="admin-error">{addresses.error} <button type="button" className="admin-btn" onClick={addresses.retry}>Tải lại địa chỉ</button></p>}
      {provinceCode && <>
        <form aria-busy={busy && savingAction === "province"} className="admin-form" onSubmit={async (event) => {
          event.preventDefault(); const amount = fee.trim() === "" ? null : Number(fee);
          if (amount !== null && !validShippingFee(amount)) return setNotice({ error: true, text: "Nhập phí là số nguyên không âm, hoặc để trống để ngừng dùng phí chung." });
          if (await save({ provinces: { [provinceCode]: { fee: amount } } }, "Đã lưu phí chung cho tỉnh/thành.","province")) { setSettings((value) => ({ ...value, provinces: { ...value.provinces, [provinceCode]: { ...current, fee: amount } } })); setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], fee: undefined } })); }
        }}><div className="admin-field"><label htmlFor="shipping-base-fee">Phí chung toàn tỉnh/thành (đ)</label><input id="shipping-base-fee" type="number" min="0" max="1000000000" step="1" value={fee} disabled={loading || failed || busy} placeholder="Để trống nếu chưa nhận giao" onChange={(event) => patchDraft({ fee: event.target.value })} /></div><div><button className="admin-btn" aria-busy={busy && savingAction === "province"} disabled={loading || failed || busy}>Lưu phí tỉnh/thành</button></div></form>
        <AddressSelect label="Phường / Xã có phí riêng (không bắt buộc)" value={wardCode} options={addresses.wards} disabled={busy} loading={addresses.loadingWards} placeholder="Tìm và chọn phường/xã" onChange={setWardCode} />
        {wardCode && <form aria-busy={busy && savingAction === "ward"} className="admin-form" onSubmit={async (event) => {
          event.preventDefault(); const amount = override.trim() === "" ? null : Number(override);
          if (amount !== null && !validShippingFee(amount)) return setNotice({ error: true, text: "Nhập phí phường/xã là số nguyên không âm." });
          if (await save({ provinces: { [provinceCode]: { wardFees: { [wardCode]: amount } } } }, amount === null ? "Đã dùng lại phí chung của tỉnh/thành." : "Đã lưu phí riêng cho phường/xã.","ward")) { setSettings((value) => ({ ...value, provinces: { ...value.provinces, [provinceCode]: { ...current, wardFees: { ...current.wardFees, [wardCode]: amount } } } })); setDrafts((all) => ({ ...all, [provinceCode]: { ...all[provinceCode], wardFees: { ...all[provinceCode]?.wardFees, [wardCode]: undefined } } })); }
        }}><div className="admin-field"><label htmlFor="shipping-ward-fee">Phí riêng phường/xã (đ)</label><input id="shipping-ward-fee" type="number" min="0" max="1000000000" step="1" value={override} disabled={busy} placeholder="Để trống để dùng phí chung" onChange={(event) => patchDraft({ wardFees: { ...draft.wardFees, [wardCode]: event.target.value } })} /></div><div><button className="admin-btn" aria-busy={busy && savingAction === "ward"} disabled={busy}>Lưu phí phường/xã</button></div></form>}
        <p className="admin-muted">Phí chung đang lưu: {current.fee == null ? "Chưa nhập" : formatVnd(current.fee)}. Phí riêng của phường/xã được ưu tiên; để trống và lưu để dùng lại phí chung.</p>
      </>}
    </div>
    <div className="admin-card admin-form shipping-saved-fees"><h2>Phí vận chuyển đã lưu</h2><p className="admin-muted">Đây là các mức phí đã lưu, chưa gồm bản đang sửa. Phí riêng phường/xã được ưu tiên hơn phí chung.</p><div className="admin-field"><label htmlFor="shipping-fee-search">Tìm khu vực đã nhập phí</label><input id="shipping-fee-search" type="search" value={feeSearch} onChange={(event) => setFeeSearch(event.target.value)} placeholder="Tỉnh/thành hoặc phường/xã" /></div><div className="shipping-fee-table"><table className="admin-table"><thead><tr><th>Tỉnh / Thành phố</th><th>Phạm vi</th><th>Phí giao hàng</th><th /></tr></thead><tbody>{savedFees.map((item) => <tr key={`${item.provinceCode}-${item.wardCode}`}><td data-label="Tỉnh / Thành phố">{item.provinceName}</td><td data-label="Phạm vi">{item.wardName}</td><td data-label="Phí giao hàng"><strong>{item.fee === 0 ? "Miễn phí" : formatVnd(item.fee)}</strong></td><td><button type="button" className="admin-btn" disabled={busy} onClick={(event) => { const doc = event.currentTarget.ownerDocument; setProvinceCode(item.provinceCode); setWardCode(item.wardCode); requestAnimationFrame(() => doc.getElementById(item.wardCode ? "shipping-ward-fee" : "shipping-base-fee")?.focus()); }}>Chỉnh phí</button></td></tr>)}</tbody></table></div>{!loading && !savedFees.length && <p className="admin-muted">Chưa có mức phí phù hợp.</p>}</div>
  </section>;
}
