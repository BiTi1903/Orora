import TranslationHelp from "./TranslationHelp";
import {normalizeSearch} from "../lib/catalog-filters";
import {useEffect, useState} from "react";
import {doc, getDocFromServer, runTransaction} from "firebase/firestore";
import {db} from "../lib/firebase";
import {phraseKey} from "../lib/phrase-overrides";

export default function PhraseTranslationForm() {
  const [notice, setNotice] = useState({ text: "", kind: "status" });
  const [busy, setBusy] = useState(false);

  const [entries, setEntries] = useState(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(8);
  const [editing, setEditing] = useState(null);
  useEffect(() => {
    let active = true;
    getDocFromServer(doc(db, "settings", "home")).then(snapshot => {
      if (active) setEntries(snapshot.data()?.phraseOverrides || {});
    }).catch(error => {
      if (active) setNotice({ text: error.message || "Không tải được danh sách cụm từ.", kind: "error" });
    });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const vi = phraseKey(data.get("vi"));
    const en = String(data.get("en") ?? "").trim();
    const ja = String(data.get("ja") ?? "").trim();
    if (!vi || (!en && !ja)) {
      setNotice({ text: "Nhập tiếng Việt và ít nhất một bản dịch (hoặc bấm Xóa nếu muốn gỡ cụm từ).", kind: "error" });
      return;
    }
    setBusy(true);
    setNotice({ text: "", kind: "status" });
    try {
      const ref = doc(db, "settings", "home");
      const isEditingExisting = Boolean(editing?.vi);
      const latest = await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        const currentEntries = snapshot.data()?.phraseOverrides || {};
        const key = JSON.stringify(vi);
        const existingKey = Object.keys(currentEntries).find(k => currentEntries[k]?.vi === vi) || key;
        const previous = currentEntries[existingKey];
        const updated = { ...currentEntries };
        if (existingKey !== key) delete updated[existingKey];
        updated[key] = {
          vi,
          en: isEditingExisting ? en : (en || previous?.en || ""),
          ja: isEditingExisting ? ja : (ja || previous?.ja || ""),
        };
        tx.set(ref, { phraseOverrides: updated }, { merge: true });
        return updated;
      });
      setEntries(latest);
      setEditing(null);
      setQuery("");
      setLimit(8);
      setNotice({ text: "Đã lưu cụm từ.", kind: "success" });
    } catch (error) {
      setNotice({ text: error.message || "Chưa thể lưu cụm từ.", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  async function remove(entry) {
    if (!window.confirm(`Xóa bản dịch cho cụm từ "${entry.vi}"? Website sẽ quay lại bản mặc định.`)) return;
    setBusy(true);
    setNotice({ text: "", kind: "status" });
    try {
      const ref = doc(db, "settings", "home");
      const latest = await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        const currentEntries = snapshot.data()?.phraseOverrides || {};
        const updated = {};
        for (const [k, v] of Object.entries(currentEntries)) {
          if (k !== JSON.stringify(entry.vi) && v?.vi !== entry.vi) updated[k] = v;
        }
        tx.set(ref, { phraseOverrides: updated }, { merge: true });
        return updated;
      });
      setEntries(latest);
      if (editing?.vi === entry.vi) setEditing(null);
      setNotice({ text: "Đã xóa cụm từ.", kind: "success" });
    } catch (error) {
      setNotice({ text: error.message || "Chưa thể xóa cụm từ.", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  const missing = entry => Number(!entry.en?.trim()) + Number(!entry.ja?.trim());
  const matches = Object.values(entries || {}).filter(entry =>
    normalizeSearch([entry.vi, entry.en, entry.ja].join(" ")).includes(normalizeSearch(query)))
    .sort((a, b) => missing(b) - missing(a));
  return <div className="admin-card translation-panel">
    <div className="translation-toolbar">
      <h2>Cụm từ đã lưu ({Object.keys(entries || {}).length})</h2>
      <TranslationHelp label="dịch theo cụm từ">Dùng khi trang EN hoặc JP vẫn hiện nguyên câu tiếng Việt. Dán đúng cả dấu câu. Bản dịch riêng của từng vị trí được áp dụng trước.</TranslationHelp>
      <button type="button" className="admin-btn primary" disabled={busy || editing !== null} onClick={() => setEditing({})}>Thêm cụm từ</button>
    </div>
    {editing && <form className="translation-phrase-editor" key={editing.vi || "new"} onSubmit={save}>
      <h3>{editing.vi ? "Sửa cụm từ" : "Thêm cụm từ"}</h3>
      <p className="admin-muted">Dán nguyên câu còn hiện tiếng Việt trên website. Khi sửa, xóa trắng một ngôn ngữ sẽ bỏ bản dịch ngôn ngữ đó.</p>
      <fieldset className="translation-editor" disabled={busy}>
        <label className="translation-original">Tiếng Việt
          <textarea name="vi" defaultValue={editing.vi} readOnly={Boolean(editing.vi)} required rows={2} maxLength={1000}/>
        </label>
        <label>Tiếng Anh<textarea name="en" defaultValue={editing.en} rows={2} maxLength={2000}/></label>
        <label>Tiếng Nhật<textarea name="ja" defaultValue={editing.ja} rows={2} maxLength={2000}/></label>
        <div className="translation-actions">
          <button className="admin-btn" type="button" onClick={() => setEditing(null)}>Hủy</button>
          <button className="admin-btn primary" type="submit">{busy ? "Đang lưu…" : "Lưu cụm từ"}</button>
        </div>
      </fieldset>
    </form>}
    <div className="translation-filters">
      <input type="search" aria-label="Tìm cụm từ" placeholder="Tìm theo VI, EN hoặc JP…" value={query} onChange={event => { setQuery(event.target.value); setLimit(8); }}/>
    </div>
    {notice.text && (notice.kind === "error"
      ? <p className="admin-error translation-notice" role="alert">{notice.text}</p>
      : <p className="admin-success translation-notice" role="status">{notice.text}</p>)}
    {!entries && !notice.text && <p role="status">Đang tải cụm từ…</p>}
    {entries && !matches.length && <p className="admin-muted">{query ? "Không tìm thấy cụm từ phù hợp." : "Chưa có cụm từ nào."}</p>}
    {matches.slice(0, limit).map(entry => <article className="translation-phrase-row" key={entry.vi}>
      <div><small>Tiếng Việt</small><strong>{entry.vi}</strong></div>
      <div><small>Tiếng Anh (EN)</small><span>{entry.en || "Chưa có bản dịch EN"}</span></div>
      <div><small>Tiếng Nhật (JP)</small><span>{entry.ja || "Chưa có bản dịch JP"}</span></div>
      <div className="translation-phrase-actions">
        <button type="button" className="admin-btn" disabled={busy || editing !== null} onClick={() => setEditing(entry)}>Sửa</button>
        <button type="button" className="admin-btn danger" disabled={busy || editing !== null} onClick={() => remove(entry)}>Xóa</button>
      </div>
    </article>)}
    {matches.length > limit && <footer><button type="button" className="admin-btn" onClick={() => setLimit(limit + 8)}>Xem thêm</button></footer>}
  </div>;
}
