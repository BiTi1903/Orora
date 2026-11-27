import {useEffect, useState} from "react";
import {dirtyRegistry} from "../lib/dirty-registry";
import {doc, runTransaction} from "firebase/firestore";
import {db} from "../lib/firebase";
import {getHomeContent, getProducts} from "../lib/api";
import {translationHeaders, translationRows} from "../lib/translation-rows";
import {excelCells} from "./email-export";

export default function TranslationAdmin() {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    Promise.all([getHomeContent(), getProducts()]).then(([home, products]) => {
      setRows([...translationRows("home", home || {}), ...products.flatMap(p => translationRows(p.id, p))]);
    }).catch(error => setMessage(error.message)).finally(() => setBusy(false));
  }, []);
  const changes = rows.filter(r => draft[r.key]?.trim() && draft[r.key] !== r.en);
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
    const values = rows.map(r => [r.key, r.where, r.vi, draft[r.key] ?? r.en]);
    await write(excelCells({headers:translationHeaders, rows:values}), {columns:[34,42,70,70].map(width=>({width}))}).toFile("ORORA-ban-dich.xlsx");
  }
  async function load(file) {
    const {readSheet} = await import("read-excel-file/browser");
    const [header, ...lines] = await readSheet(file, {trim:false});
    if (!translationHeaders.every((h,i)=>header?.[i] === h)) throw Error("Sai tiêu đề cột. Hãy dùng file xuất từ ORORA.");
    const current = new Map(rows.map(r => [r.key,r]));
    const seen = new Set();
    const edits = {};
    for (const [key,,vi,en] of lines) {
      if (!String(en ?? "").trim()) continue;
      if (!current.has(key) || current.get(key).vi !== vi || seen.has(key)) throw Error("Mã bị trùng hoặc nội dung gốc đã đổi: " + key);
      seen.add(key);
      edits[key] = String(en);
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
          if (live?.vi !== row.vi || live.en !== row.en) throw Error("Nội dung đã thay đổi. Hãy tải lại trước khi lưu.");
          sheet[row.key] = {vi:row.vi,en:draft[row.key].trim()};
        }
        tx.update(snap.ref,{translationSheet:sheet});
      }
    });
    setRows(rows.map(row => draft[row.key]?.trim() ? {...row,en:draft[row.key].trim()} : row));
    setDraft({});
    setMessage("Đã lưu bản dịch.");
  }
  return <section><h1>Bản dịch</h1><p>Điền cột English trong Excel hoặc sửa trực tiếp bên dưới. Ô trống sẽ được bỏ qua.</p>
    <fieldset disabled={busy || !rows.length}><button onClick={()=>run(download)}>Xuất Excel</button>
    <label> Nhập Excel <input type="file" accept=".xlsx" onChange={e=>{const f=e.target.files[0];e.target.value="";if(f)run(()=>load(f));}}/></label>
    <button disabled={!changes.length} onClick={()=>run(save)}>Lưu bản dịch ({changes.length})</button></fieldset>
    <p role="status">{busy ? "Đang xử lý…" : message}</p>
    {rows.map(row=><label className="builder-field" key={row.key}><small>{row.where}</small><span>{row.vi}</span>
      <textarea disabled={busy} value={draft[row.key] ?? row.en} onChange={e=>setDraft({...draft,[row.key]:e.target.value})}/></label>)}
  </section>;
}
