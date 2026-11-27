import {normalizeSearch} from "../lib/catalog-filters";
import {useEffect, useState} from "react";
import {doc, getDocFromServer, runTransaction} from "firebase/firestore";
import {db} from "../lib/firebase";
import {phraseKey} from "../lib/phrase-overrides";

export default function PhraseTranslationForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const [entries, setEntries] = useState(null);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(8);
  const [editing, setEditing] = useState(null);
  useEffect(() => {
    let active = true;
    getDocFromServer(doc(db, "settings", "home")).then(snapshot => {
      if (active) setEntries(snapshot.data()?.phraseOverrides || {});
    }).catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, []);

  async function save(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const vi = phraseKey(data.get("vi"));
    const en = data.get("en").trim();
    const ja = data.get("ja").trim();
    if (!vi || (!en && !ja)) {
      setMessage("Nhập tiếng Việt và ít nhất một bản dịch.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const ref = doc(db, "settings", "home");
      const latest = await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        const entries = snapshot.data()?.phraseOverrides || {};
        const key = JSON.stringify(vi);
        const previous = entries[key];
        const updated = {...entries, [key]: {
          vi,
          en: en && en !== editing.en ? en : previous?.en || "",
          ja: ja && ja !== editing.ja ? ja : previous?.ja || "",
        }};
        tx.set(ref, {phraseOverrides: updated}, {merge: true});
        return updated;
      });
      setEntries(latest);
      setEditing(null);
      setQuery("");
      setLimit(8);
      setMessage("Đã lưu cụm từ.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  const matches = Object.values(entries || {}).filter(entry =>
    normalizeSearch([entry.vi,entry.en,entry.ja].join(" ")).includes(normalizeSearch(query)));
  return <div className="translation-panel">
    <div className="translation-toolbar">
      <h2>Cụm từ đã lưu</h2>
      <button className="admin-btn primary" disabled={busy || editing !== null} onClick={()=>setEditing({})}>Thêm cụm từ</button>
    </div>
    {editing && <form className="translation-phrase-editor" key={editing.vi || "new"} onSubmit={save}>
      <h3>{editing.vi ? "Sửa cụm từ" : "Thêm cụm từ"}</h3>
      <p>Dán nguyên câu còn hiện tiếng Việt trên website. Ô dịch để trống giữ nội dung đã lưu.</p>
      <fieldset className="translation-editor" disabled={busy}>
        <label className="translation-original">Tiếng Việt
          <textarea name="vi" defaultValue={editing.vi} readOnly={Boolean(editing.vi)} required rows={2} maxLength={1000}/>
        </label>
        <label>Tiếng Anh<textarea name="en" defaultValue={editing.en} rows={2} maxLength={2000}/></label>
        <label>Tiếng Nhật<textarea name="ja" defaultValue={editing.ja} rows={2} maxLength={2000}/></label>
        <div className="translation-actions"><button className="admin-btn" type="button" onClick={()=>setEditing(null)}>Hủy</button>
        <button className="admin-btn primary" type="submit">{busy ? "Đang lưu…" : "Lưu cụm từ"}</button></div>
      </fieldset>
    </form>}
    <div className="translation-filters"><input type="search" aria-label="Tìm cụm từ" placeholder="Tìm theo VI, EN hoặc JP…" value={query} onChange={event=>{setQuery(event.target.value); setLimit(8);}}/></div>
    {message && <p role="status">{message}</p>}
    {!entries && !message && <p role="status">Đang tải cụm từ…</p>}
    {entries && !matches.length && <p>{query ? "Không tìm thấy cụm từ phù hợp." : "Chưa có cụm từ nào."}</p>}
    {matches.slice(0, limit).map(entry=><article className="translation-phrase-row" key={entry.vi}>
      <div><small>Tiếng Việt</small><strong>{entry.vi}</strong></div>
      <div><small>Tiếng Anh</small><span>{entry.en || "Chưa dịch"}</span></div>
      <div><small>Tiếng Nhật</small><span>{entry.ja || "Chưa dịch"}</span></div>
      <button className="admin-btn" disabled={busy || editing !== null} onClick={()=>setEditing(entry)}>Sửa</button>
    </article>)}
    {matches.length > limit && <footer><button className="admin-btn" onClick={()=>setLimit(limit+8)}>Xem thêm</button></footer>}
  </div>;
}
