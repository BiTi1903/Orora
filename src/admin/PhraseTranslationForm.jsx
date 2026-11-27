import {useState} from "react";
import {doc, runTransaction} from "firebase/firestore";
import {db} from "../lib/firebase";
import {phraseKey} from "../lib/phrase-overrides";

export default function PhraseTranslationForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      await runTransaction(db, async tx => {
        const snapshot = await tx.get(ref);
        const entries = snapshot.data()?.phraseOverrides || {};
        const key = JSON.stringify(vi);
        const previous = entries[key];
        tx.set(ref, {phraseOverrides: {...entries, [key]: {
          vi, en: en || previous?.en || "", ja: ja || previous?.ja || "",
        }}}, {merge: true});
      });
      form.reset();
      setMessage("Đã lưu cụm từ.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <details className="translation-phrases">
    <summary>Dịch theo cụm từ</summary>
    <form onSubmit={save}>
      <p>Dán nguyên văn câu đang thấy trên website. Muốn cập nhật bản dịch, nhập lại cùng câu tiếng Việt.</p>
      <fieldset className="translation-editor" disabled={busy}>
        <label className="translation-original">Tiếng Việt
          <textarea name="vi" required rows={2} maxLength={1000}/>
        </label>
        <label>Tiếng Anh<textarea name="en" rows={2} maxLength={2000}/></label>
        <label>Tiếng Nhật<textarea name="ja" rows={2} maxLength={2000}/></label>
        <button className="admin-btn primary" type="submit">{busy ? "Đang lưu…" : "Lưu cụm từ"}</button>
      </fieldset>
      {message && <p role="status">{message}</p>}
    </form>
  </details>;
}
