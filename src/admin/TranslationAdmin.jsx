import {useEffect, useState} from "react";
import {dirtyRegistry} from "../lib/dirty-registry";
import {collection, doc, getDocFromServer, getDocsFromServer, runTransaction} from "firebase/firestore";
import {db} from "../lib/firebase";

import {translationHeaders, translationRows} from "../lib/translation-rows";
import {excelCells} from "./email-export";

const languages = ["en", "ja"];
async function readCurrentRows() {
  const [home, products] = await Promise.all([
    getDocFromServer(doc(db, "settings", "home")),
    getDocsFromServer(collection(db, "products")),
  ]);
  return [...translationRows("home", home.data() || {}),
    ...products.docs.flatMap(product => translationRows(product.id, product.data()))];
}

export default function TranslationAdmin() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    readCurrentRows().then(setRows).catch(error => setMessage(error.message)).finally(() => setBusy(false));
  }, []);
  const changes = rows.filter(r => languages.some(lang => draft[r.key]?.[lang]?.trim() && draft[r.key][lang].trim() !== r[lang]));
  useEffect(() => {
    dirtyRegistry.set("translations", changes.length > 0);
    return () => dirtyRegistry.set("translations", false);
  }, [changes.length]);
  async function run(action) {
    setBusy(true);
    setMessage("");
    try { await action(); } catch (error) { setMessage(error.message); } finally { setBusy(false); }
  }
  async function download() {
    const {default: write} = await import("write-excel-file/browser");
    const saved = await readCurrentRows();
    const values = saved.map(r => [r.key, r.where, r.vi, r.en, r.ja]);
    await write(excelCells({headers:translationHeaders, rows:values}), {columns:[34,42,70,70,70].map(width=>({width}))}).toFile("ORORA-ban-dich.xlsx");
  }
  async function load(file) {
    const {readSheet} = await import("read-excel-file/browser");
    const [header, ...lines] = await readSheet(file, {trim:false});
    if ((header?.length !== 4 && header?.length !== 5) || !translationHeaders.slice(0, header.length).every((h,i)=>header?.[i] === h)) throw Error("Sai tiêu đề cột. Hãy dùng file xuất từ ORORA.");
    const current = new Map(rows.map(r => [r.key,r]));
    const seen = new Set();
    const edits = {...draft};
    for (const [key,,vi,en,ja] of lines) {
      if (![en,ja].some(value => String(value ?? "").trim())) continue;
      if (!current.has(key) || current.get(key).vi !== vi || seen.has(key)) throw Error("Mã bị trùng hoặc nội dung gốc đã đổi: " + key);
      seen.add(key);
      edits[key] = {...edits[key]};
      if (String(en ?? "").trim()) edits[key].en = String(en);
      if (String(ja ?? "").trim()) edits[key].ja = String(ja);
    }
    setDraft(previous => ({...previous,...edits}));
    setMessage("Đã nhập để xem lại. Bấm Lưu bản dịch khi hoàn tất.");
  }
  async function save() {
    const groups = new Map();
    for (const row of changes) {
      const [id] = JSON.parse(row.key);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(row);
    }
    await runTransaction(db, async tx => {
      const docs = await Promise.all([...groups.keys()].map(id => tx.get(id === "home" ? doc(db,"settings","home") : doc(db,"products",id))));
      for (const snap of docs) {
        const data = snap.data();
        if (!data) throw Error("Nội dung đã bị xóa.");
        const current = new Map(translationRows(snap.id,data).map(r=>[r.key,r]));
        const sheet = {...data.translationSheet};
        for (const row of groups.get(snap.id)) {
          const live = current.get(row.key);
          if (live?.vi !== row.vi || languages.some(lang => live[lang] !== row[lang])) throw Error("Nội dung đã thay đổi. Hãy tải lại trước khi lưu.");
          sheet[row.key] = {vi:row.vi};
          for (const lang of languages) sheet[row.key][lang] = draft[row.key]?.[lang]?.trim() || live[lang];
        }
        tx.update(snap.ref,{translationSheet:sheet});
      }
    });
    setRows(rows.map(row => ({...row, en:draft[row.key]?.en?.trim() || row.en, ja:draft[row.key]?.ja?.trim() || row.ja})));
    setDraft({});
    setMessage("Đã lưu bản dịch.");
  }
  return <section><h1>Bản dịch</h1><p>Điền cột English và 日本語 trong Excel hoặc sửa trực tiếp bên dưới. Ô trống sẽ được bỏ qua.</p>
    <fieldset disabled={busy}><button onClick={()=>run(download)}>Tải dữ liệu đã lưu (.xlsx)</button>
    <label> Nhập Excel <input type="file" accept=".xlsx" onChange={e=>{const f=e.target.files[0];e.target.value="";if(f)run(()=>load(f));}}/></label>
    <button disabled={!changes.length} onClick={()=>run(save)}>Lưu bản dịch ({changes.length})</button></fieldset>
    <p role="status">{busy ? "Đang xử lý…" : message}</p>
    {rows.map(row=><div className="builder-field" key={row.key}><small>{row.where}</small><span>{row.vi}</span>
      {languages.map(lang => <label key={lang}>{lang === "en" ? "English" : "日本語"}
        <textarea disabled={busy} value={draft[row.key]?.[lang] ?? row[lang]} onChange={e=>setDraft({...draft,[row.key]:{...draft[row.key],[lang]:e.target.value}})}/>
      </label>)}</div>)}
  </section>;
}
