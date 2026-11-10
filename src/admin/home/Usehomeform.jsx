import useDraftGuard from "../../hooks/useDraftGuard";
import { changedValues, mergeSavedValues } from "../builder/save-sections";
import { useEffect, useRef, useState } from "react";
import { defaultHomeContent } from "../../data/content";
import { explainError, getHomeContent, saveHomeContent } from "../../lib/api";
import { defaultExtras, mergeExtras } from "./Defaults";

/* fields = danh sách trường mà mục này được phép ghi */
export default function useHomeForm(fields) {
  const [form, setForm] = useState({ ...defaultHomeContent, ...defaultExtras });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const baseline = useRef(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;
    getHomeContent()
      .then((v) => {
        if (alive) {
          const loaded = { ...defaultHomeContent, ...defaultExtras, ...(v || {}), ...mergeExtras(v || {}) };
          baseline.current = loaded;
          setForm(loaded);
        }
      })
      .catch((err) => { if (alive) { setLoadError(true); setMessage({ type: "error", text: `Không tải được cấu hình: ${explainError(err)}. Hãy tải lại trước khi lưu.` }); } })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const markSaved=useDraftGuard(Object.fromEntries(fields.map(key=>[key,form[key]])),{enabled:!loading&&!loadError,busy});
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (list, i, key, value) =>
    setForm((f) => ({ ...f, [list]: f[list].map((it, idx) => (idx === i ? { ...it, [key]: value } : it)) }));
  const addItem = (list, blank) => setForm((f) => ({ ...f, [list]: [...f[list], { ...blank }] }));
  const removeItem = (list, i) => setForm((f) => ({ ...f, [list]: f[list].filter((_, idx) => idx !== i) }));

  const save = async (e, overrides = {}) => {
    e?.preventDefault();
    if (loading || loadError || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {};
      fields.forEach((k) => {
        if (form[k] !== undefined) payload[k] = form[k]; // Firestore không nhận undefined
      });
      Object.assign(payload, overrides);
      const patch = changedValues(baseline.current || {}, payload);
      if (!Object.keys(patch).length) { setMessage({ type: "success", text: "Chưa có thay đổi để lưu." }); return; }
      await saveHomeContent(patch);
      markSaved({...Object.fromEntries(fields.map(key=>[key,form[key]])),...overrides});
      baseline.current = mergeSavedValues(baseline.current || {}, patch);
      setForm((f) => mergeSavedValues(f, patch));
      setMessage({ type: "success", text: "Đã lưu phần này." });
    } catch (err) {
      setMessage({ type: "error", text: explainError(err) });
    } finally { setBusy(false); }
  };

  return { form, loading, loadError, busy, message, change, set, updateItem, addItem, removeItem, save };
}