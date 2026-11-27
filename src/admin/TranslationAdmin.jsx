import "./translations.css";
import {normalizeSearch} from "../lib/catalog-filters";
import {useEffect, useRef, useState} from "react";
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
  const fileInput = useRef(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
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
  const changedKeys = new Set(changes.map(row => row.key));
  const search = normalizeSearch(query);
  const filtered = rows.filter(row => {
    if (filter === "changed" && !changedKeys.has(row.key)) return false;
    if (languages.includes(filter) && row[filter]) return false;
    return normalizeSearch([row.vi, row.where, row.en, row.ja].join(" ")).includes(search);
  });
  const pageSize = 8;
  const pages = Math.ceil(filtered.length / pageSize);
  const current = Math.min(page, Math.max(0, pages - 1));
  return <section className="translations-admin">
    <header><h1>Bản dịch</h1><div className="translation-actions">
      <button className="admin-btn" disabled={busy} onClick={()=>run(download)}>Xuất Excel</button>
      <button className="admin-btn" disabled={busy} onClick={()=>fileInput.current.click()}>Nhập Excel</button>
      <input ref={fileInput} hidden type="file" accept=".xlsx" onChange={event=>{
        const file = event.target.files[0];
        event.target.value = "";
        if (file) run(()=>load(file));
      }}/>
      <button className="admin-btn primary" disabled={busy || !changes.length} onClick={()=>run(save)}>
        {changes.length ? `Lưu ${changes.length} mục` : "Lưu thay đổi"}
      </button>
    </div></header>
    <div className="translation-filters">
      <input type="search" aria-label="Tìm bản dịch" placeholder="Tìm câu, tên sản phẩm hoặc vị trí…" value={query}
        onChange={event=>{setQuery(event.target.value); setPage(0);}}/>
      <select aria-label="Lọc bản dịch" value={filter} onChange={event=>{setFilter(event.target.value); setPage(0);}}>
        <option value="all">Tất cả trạng thái</option><option value="en">Chưa lưu tiếng Anh</option>
        <option value="ja">Chưa lưu tiếng Nhật</option><option value="changed">Đã sửa, chưa lưu</option>
      </select>
    </div>
    <p role="status">{busy ? "Đang xử lý…" : message}</p>
    {filtered.slice(current * pageSize, (current + 1) * pageSize).map(row => {
      const open = expanded === row.key;
      return <article key={row.key}>
        <button className="translation-row" aria-expanded={open} onClick={()=>setExpanded(open ? null : row.key)}>
          <span><small>{row.where}</small><strong>{row.vi}</strong></span>
          <span>{changedKeys.has(row.key) ? "Chưa lưu" : open ? "Thu gọn" : "Sửa"}</span>
        </button>
        {open && <div className="translation-editor">
          <div className="translation-original"><b>Tiếng Việt</b><p>{row.vi}</p></div>
          {languages.map(lang => <label key={lang}>{lang === "en" ? "Tiếng Anh" : "Tiếng Nhật"}
            <textarea lang={lang} rows={4} disabled={busy} value={draft[row.key]?.[lang] ?? row[lang]}
              onChange={event=>setDraft({...draft,[row.key]:{...draft[row.key],[lang]:event.target.value}})}/>
          </label>)}
        </div>}
      </article>;
    })}
    {!busy && !filtered.length && <p>Không tìm thấy nội dung phù hợp.</p>}
    {pages > 0 && <footer><span>{current * pageSize + 1}–{Math.min((current + 1) * pageSize, filtered.length)} / {filtered.length} mục</span>
      <button className="admin-btn" disabled={!current} onClick={()=>setPage(current-1)}>Trước</button>
      <button className="admin-btn" disabled={current+1 >= pages} onClick={()=>setPage(current+1)}>Sau</button>
    </footer>}
  </section>;
}
