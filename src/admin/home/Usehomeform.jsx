import { useEffect, useState } from "react";
import { defaultHomeContent } from "../../data/content";
import { explainError, getHomeContent, saveHomeContent } from "../../lib/api";
import { defaultExtras, mergeExtras } from "./Defaults";

/* fields = danh sách trường mà mục này được phép ghi */
export default function useHomeForm(fields) {
  const [form, setForm] = useState({ ...defaultHomeContent, ...defaultExtras });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let alive = true;
    getHomeContent()
      .then((v) => {
        if (alive && v) setForm({ ...defaultHomeContent, ...defaultExtras, ...v, ...mergeExtras(v) });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const updateItem = (list, i, key, value) =>
    setForm((f) => ({ ...f, [list]: f[list].map((it, idx) => (idx === i ? { ...it, [key]: value } : it)) }));
  const addItem = (list, blank) => setForm((f) => ({ ...f, [list]: [...f[list], { ...blank }] }));
  const removeItem = (list, i) => setForm((f) => ({ ...f, [list]: f[list].filter((_, idx) => idx !== i) }));

  const save = async (e, overrides = {}) => {
    e?.preventDefault();
    if (loading) return;
    setBusy(true);
    setMessage(null);
    try {
      const payload = {};
      fields.forEach((k) => {
        if (form[k] !== undefined) payload[k] = form[k]; // Firestore không nhận undefined
      });
      Object.assign(payload, overrides);
      await saveHomeContent(payload);
      setForm((f) => ({ ...f, ...payload }));
      setMessage({ type: "success", text: "Đã lưu phần này." });
    } catch (err) {
      setMessage({ type: "error", text: explainError(err) });
    }
    setBusy(false);
  };

  return { form, loading, busy, message, change, set, updateItem, addItem, removeItem, save };
}