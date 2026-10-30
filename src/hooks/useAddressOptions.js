import { useEffect, useState } from "react";
import { getAddressOptions } from "../lib/address-api";
export default function useAddressOptions(provinceCode) {
  const [provinces, setProvinces] = useState(null); const [provinceError, setProvinceError] = useState(""); const [wardState, setWardState] = useState(null); const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    getAddressOptions().then((items) => { if (alive) { setProvinces(items); setProvinceError(""); } }).catch(() => { if (alive) setProvinceError("Chưa tải được tỉnh/thành. Hãy thử lại."); });
    return () => { alive = false; };
  }, [reload]);
  useEffect(() => {
    if (!provinceCode) return;
    let alive = true;
    getAddressOptions(provinceCode).then((items) => { if (alive) setWardState({ code: provinceCode, items }); }).catch(() => { if (alive) setWardState({ code: provinceCode, error: "Chưa tải được phường/xã. Hãy thử lại.", items: [] }); });
    return () => { alive = false; };
  }, [provinceCode, reload]);
  return { provinces: provinces || [], wards: wardState?.code === provinceCode ? wardState.items : [], loadingProvinces: !provinces && !provinceError, loadingWards: Boolean(provinceCode && wardState?.code !== provinceCode), error: provinceError || (wardState?.code === provinceCode ? wardState.error || "" : ""), retry: () => setReload((value) => value + 1) };
}
