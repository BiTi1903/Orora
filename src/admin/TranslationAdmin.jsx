import TranslationHelp from "./TranslationHelp";
import PhraseTranslationForm from "./PhraseTranslationForm";
import "./translations.css";
import {normalizeSearch} from "../lib/catalog-filters";
import {translatePhrase} from "../lib/i18n";
import {useEffect, useRef, useState} from "react";
import {dirtyRegistry} from "../lib/dirty-registry";
import {collection, doc, getDocFromServer, getDocsFromServer, runTransaction} from "firebase/firestore";
import {db} from "../lib/firebase";

import {translationHeaders, translationRows} from "../lib/translation-rows";
import {excelCells} from "./email-export";

const languages = ["en", "ja"];
const SAVE_BATCH_SIZE = 5;

function hasLangChange(row, draftRow, lang) {
  if (!draftRow || !Object.hasOwn(draftRow, lang)) return false;
  return draftRow[lang].trim() !== row[lang];
}

function targetDocRef(id) {
  if (id === "home") return doc(db, "settings", "home");
  if (id === "categories") return doc(db, "settings", "productCategories");
  return doc(db, "products", id);
}

function autoSuggestion(vi, lang) {
  const translated = translatePhrase(vi, lang);
  return translated && translated !== vi ? translated : "";
}

async function readCurrentRows() {
  const [home, categories, products] = await Promise.all([
    getDocFromServer(doc(db, "settings", "home")),
    getDocFromServer(doc(db, "settings", "productCategories")),
    getDocsFromServer(collection(db, "products")),
  ]);
  return [
    ...translationRows("home", home.data() || {}),
    ...translationRows("categories", categories.data() || {}),
    ...products.docs.flatMap(product => translationRows(product.id, product.data())),
  ];
}

export default function TranslationAdmin() {
  const [view, setView] = useState("content");
  const [openedPhrases, setOpenedPhrases] = useState(false);
  const [area, setArea] = useState("all");
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState({});
  const [notice, setNotice] = useState({ text: "", kind: "status" });
  const [busy, setBusy] = useState(true);
  const fileInput = useRef(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    readCurrentRows()
      .then(setRows)
      .catch(error => setNotice({ text: error.message || "Không tải được danh sách bản dịch.", kind: "error" }))
      .finally(() => setBusy(false));
  }, []);

  const changes = rows.filter(r => languages.some(lang => hasLangChange(r, draft[r.key], lang)));

  useEffect(() => {
    dirtyRegistry.set("translations", changes.length > 0);
    return () => dirtyRegistry.set("translations", false);
  }, [changes.length]);

  async function run(action) {
    setBusy(true);
    setNotice({ text: "", kind: "status" });
    try {
      await action();
    } catch (error) {
      setNotice({ text: error.message || "Đã xảy ra lỗi khi xử lý.", kind: "error" });
    } finally {
      setBusy(false);
    }
  }

  function reload() {
    if (changes.length && !window.confirm("Tải lại bản dịch từ máy chủ và bỏ các thay đổi chưa lưu?")) return;
    run(async () => {
      const latest = await readCurrentRows();
      setRows(latest);
      setDraft({});
      setPage(0);
      if (filter === "changed") setFilter("all");
      setNotice({ text: "Đã tải bản dịch mới nhất từ máy chủ.", kind: "success" });
    });
  }

  async function download() {
    const {default: write} = await import("write-excel-file/browser");
    const saved = await readCurrentRows();
    const values = saved.map(r => [r.key, r.where, r.vi, r.en, r.ja]);
    await write(excelCells({headers: translationHeaders, rows: values}), {columns: [34, 42, 70, 70, 70].map(width => ({width}))}).toFile("ORORA-ban-dich.xlsx");
    setNotice({ text: `Đã xuất ${saved.length} mục ra file ORORA-ban-dich.xlsx.`, kind: "success" });
  }

  async function load(file) {
    const {readSheet} = await import("read-excel-file/browser");
    const [header, ...lines] = await readSheet(file, {trim: false});
    if ((header?.length !== 4 && header?.length !== 5) || !translationHeaders.slice(0, header.length).every((h, i) => header?.[i] === h)) {
      throw Error("Sai tiêu đề cột. Hãy dùng file xuất từ ORORA.");
    }
    const current = new Map(rows.map(r => [r.key, r]));
    const seen = new Set();
    const edits = {...draft};
    for (const [key, , vi, en, ja] of lines) {
      if (![en, ja].some(value => String(value ?? "").trim())) continue;
      if (!current.has(key) || current.get(key).vi !== vi || seen.has(key)) {
        throw Error("Mã bị trùng hoặc nội dung gốc đã đổi: " + key);
      }
      seen.add(key);
      edits[key] = {...edits[key]};
      if (String(en ?? "").trim()) edits[key].en = String(en);
      if (String(ja ?? "").trim()) edits[key].ja = String(ja);
    }
    setDraft(previous => ({...previous, ...edits}));
    setNotice({ text: "Đã nhập để xem lại. Bấm Lưu bản dịch khi hoàn tất.", kind: "success" });
  }

  async function save() {
    const groups = new Map();
    for (const row of changes) {
      const [id] = JSON.parse(row.key);
      if (!groups.has(id)) groups.set(id, []);
      groups.get(id).push(row);
    }
    const entries = [...groups.entries()];
    const savedKeys = new Set();
    const errors = [];

    for (let i = 0; i < entries.length; i += SAVE_BATCH_SIZE) {
      const batch = entries.slice(i, i + SAVE_BATCH_SIZE);
      await Promise.all(batch.map(async ([id, groupRows]) => {
        try {
          await runTransaction(db, async tx => {
            const ref = targetDocRef(id);
            const snap = await tx.get(ref);
            const data = snap.data();
            if (!data) throw Error("Nội dung đã bị xóa.");
            const current = new Map(translationRows(id, data).map(r => [r.key, r]));
            const sheet = {...data.translationSheet};
            for (const row of groupRows) {
              const live = current.get(row.key);
              if (live?.vi !== row.vi || languages.some(lang => live[lang] !== row[lang])) {
                throw Error("Nội dung đã thay đổi. Hãy tải lại trước khi lưu.");
              }
              const nextEntry = { vi: row.vi };
              for (const lang of languages) {
                nextEntry[lang] = hasLangChange(row, draft[row.key], lang)
                  ? draft[row.key][lang].trim()
                  : live[lang];
              }
              if (!nextEntry.en && !nextEntry.ja) delete sheet[row.key];
              else sheet[row.key] = nextEntry;
            }
            tx.update(ref, { translationSheet: sheet });
          });
          for (const row of groupRows) savedKeys.add(row.key);
        } catch (err) {
          errors.push(err?.message || `Không thể lưu mục ${id}.`);
        }
      }));
    }

    if (savedKeys.size > 0) {
      setRows(prev => prev.map(row => {
        if (!savedKeys.has(row.key)) return row;
        const d = draft[row.key];
        return {
          ...row,
          en: hasLangChange(row, d, "en") ? d.en.trim() : row.en,
          ja: hasLangChange(row, d, "ja") ? d.ja.trim() : row.ja,
        };
      }));
      setDraft(prev => {
        const next = { ...prev };
        for (const k of savedKeys) delete next[k];
        return next;
      });
    }

    if (errors.length > 0) {
      const prefix = savedKeys.size > 0 ? `Đã lưu ${savedKeys.size} mục, nhưng có ${errors.length} nhóm bị lỗi: ` : "";
      throw Error(prefix + errors[0]);
    }
    setNotice({ text: `Đã lưu ${savedKeys.size} bản dịch.`, kind: "success" });
  }

  const changedKeys = new Set(changes.map(row => row.key));
  const search = normalizeSearch(query);
  const filtered = rows.filter(row => {
    const docId = JSON.parse(row.key)[0];
    if (area === "home" && docId !== "home") return false;
    if (area === "categories" && docId !== "categories") return false;
    if (area === "products" && (docId === "home" || docId === "categories")) return false;
    if (filter === "changed" && !changedKeys.has(row.key)) return false;
    if (languages.includes(filter) && row[filter]) return false;
    return normalizeSearch([row.vi, row.where, row.en, row.ja].join(" ")).includes(search);
  });
  const priority = row => languages.reduce((score, lang) => {
    if (row[lang]?.trim()) return score;
    return score + (autoSuggestion(row.vi, lang) ? 1 : 3);
  }, 0);
  const priorities = new Map(filtered.map(row => [row.key, priority(row)]));
  filtered.sort((a, b) => priorities.get(b.key) - priorities.get(a.key));

  const total = rows.length;
  const enDone = rows.filter(row => Boolean(row.en)).length;
  const jaDone = rows.filter(row => Boolean(row.ja)).length;
  const enPct = total ? Math.round((enDone / total) * 100) : 0;
  const jaPct = total ? Math.round((jaDone / total) * 100) : 0;

  const pageSize = 8;
  const pages = Math.ceil(filtered.length / pageSize);
  const current = Math.min(page, Math.max(0, pages - 1));

  return <section className="translations-admin">
    <header><h1>Bản dịch</h1></header>
    <nav className="translation-tabs" aria-label="Khu vực bản dịch">
      <button type="button" aria-pressed={view === "content"} onClick={() => setView("content")}>Nội dung website</button>
      <button type="button" aria-pressed={view === "phrases"} onClick={() => { setOpenedPhrases(true); setView("phrases"); }}>Dịch theo cụm từ</button>
    </nav>
    {openedPhrases && <div hidden={view !== "phrases"}><PhraseTranslationForm /></div>}
    <div hidden={view !== "content"} className="admin-card translation-panel">
      <div className="translation-toolbar">
        <div className="translation-progress">
          <div className="translation-counts">
            <span>Đã dịch <strong>{enDone}/{total}</strong> mục EN ({enPct}%)</span>
            <span>Đã dịch <strong>{jaDone}/{total}</strong> mục JP ({jaPct}%)</span>
          </div>
          <div className="translation-bars" aria-hidden="true">
            <div className="translation-bar"><span style={{ width: `${enPct}%` }} /></div>
            <div className="translation-bar is-jp"><span style={{ width: `${jaPct}%` }} /></div>
          </div>
        </div>
        <div className="translation-actions">
          <button type="button" className="admin-btn" disabled={busy} onClick={reload}>Tải lại bản dịch</button>
          <TranslationHelp label="tải lại bản dịch">Lấy nội dung mới đã lưu từ máy chủ. Nếu vừa đổi câu tiếng Việt ở Sản phẩm, dùng nút này để thấy câu mới.</TranslationHelp>
          <button type="button" className="admin-btn" disabled={busy} onClick={() => run(download)}>Xuất Excel</button>
          <TranslationHelp label="xuất excel">Tải nội dung và bản dịch đã lưu. Giữ nguyên mã và câu tiếng Việt trong file.</TranslationHelp>
          <button type="button" className="admin-btn" disabled={busy} onClick={() => fileInput.current.click()}>Nhập Excel</button>
          <TranslationHelp label="nhập excel">Điền English hoặc 日本語 trong file xuất từ admin. Sau khi nhập, xem lại rồi bấm Lưu để áp dụng. Ô trống sẽ được bỏ qua.</TranslationHelp>
          <input ref={fileInput} hidden type="file" accept=".xlsx" onChange={event => {
            const file = event.target.files[0];
            event.target.value = "";
            if (file) run(() => load(file));
          }}/>
          <button type="button" className="admin-btn primary" disabled={busy || !changes.length} onClick={() => run(save)}>
            {changes.length ? `Lưu ${changes.length} mục` : "Lưu thay đổi"}
          </button>
        </div>
      </div>

      <div className="translation-filters">
        <input type="search" aria-label="Tìm bản dịch" placeholder="Tìm câu, tên sản phẩm hoặc vị trí…" value={query}
          onChange={event => { setQuery(event.target.value); setPage(0); }}/>
        <select aria-label="Khu vực nội dung" value={area} onChange={event => { setArea(event.target.value); setPage(0); }}>
          <option value="all">Mọi khu vực</option>
          <option value="home">Trang chủ và cấu hình</option>
          <option value="categories">Danh mục sản phẩm</option>
          <option value="products">Sản phẩm</option>
        </select>
        <select aria-label="Lọc bản dịch" value={filter} onChange={event => { setFilter(event.target.value); setPage(0); }}>
          <option value="all">Tất cả trạng thái</option>
          <option value="en">Chưa có bản dịch EN</option>
          <option value="ja">Chưa có bản dịch JP</option>
          <option value="changed">Đã sửa, chưa lưu</option>
        </select>
      </div>

      {!busy && notice.kind === "error" && notice.text
        ? <p className="admin-error translation-notice" role="alert">{notice.text}</p>
        : <p className={notice.kind === "success" && !busy ? "admin-success translation-notice" : "translation-notice"} role="status">{busy ? "Đang xử lý…" : notice.text}</p>}

      {filtered.slice(current * pageSize, (current + 1) * pageSize).map(row => {
        const open = expanded === row.key;
        const dirty = changedKeys.has(row.key);
        const enAuto = !row.en && Boolean(autoSuggestion(row.vi, "en"));
        const jaAuto = !row.ja && Boolean(autoSuggestion(row.vi, "ja"));
        return <article key={row.key}>
          <button type="button" className="translation-row" aria-expanded={open} onClick={() => setExpanded(open ? null : row.key)}>
            <span className="translation-row-text"><small>{row.where}</small><strong>{row.vi}</strong></span>
            <span className="translation-row-meta">
              <span className={`translation-badge ${row.en ? "is-saved" : enAuto ? "is-auto" : "is-missing"}`}>
                {row.en ? "EN ✓" : enAuto ? "EN Tự động" : "EN —"}
              </span>
              <span className={`translation-badge ${row.ja ? "is-saved" : jaAuto ? "is-auto" : "is-missing"}`}>
                {row.ja ? "JP ✓" : jaAuto ? "JP Tự động" : "JP —"}
              </span>
              {dirty && <span className="translation-badge is-dirty">Chưa lưu</span>}
              <span className="translation-row-toggle">{open ? "Thu gọn" : "Sửa"}</span>
            </span>
          </button>
          {open && <div className="translation-editor">
            <div className="translation-original"><b>Tiếng Việt</b><p>{row.vi}</p></div>
            {languages.map(lang => {
              const auto = autoSuggestion(row.vi, lang);
              const val = draft[row.key]?.[lang] ?? row[lang];
              return <div className="translation-field" key={lang}>
                <label>{lang === "en" ? "Tiếng Anh" : "Tiếng Nhật"}
                  <textarea
                    lang={lang}
                    rows={4}
                    disabled={busy}
                    value={val}
                    placeholder={auto ? `Mặc định tự động: ${auto}` : `Nhập bản dịch ${lang === "en" ? "EN" : "JP"}…`}
                    onChange={event => setDraft({ ...draft, [row.key]: { ...draft[row.key], [lang]: event.target.value } })}
                  />
                </label>
                {val && <button
                  type="button"
                  className="translation-clear-btn"
                  disabled={busy}
                  onClick={() => setDraft({ ...draft, [row.key]: { ...draft[row.key], [lang]: "" } })}
                >
                  Xóa về mặc định
                </button>}
              </div>;
            })}
          </div>}
        </article>;
      })}
      {!busy && !filtered.length && <p className="admin-muted">Không tìm thấy nội dung phù hợp.</p>}
      {pages > 0 && <footer>
        <span>{current * pageSize + 1}–{Math.min((current + 1) * pageSize, filtered.length)} / {filtered.length} mục</span>
        <button type="button" className="admin-btn" disabled={!current} onClick={() => setPage(current - 1)}>Trước</button>
        <button type="button" className="admin-btn" disabled={current + 1 >= pages} onClick={() => setPage(current + 1)}>Sau</button>
      </footer>}
    </div>
  </section>;
}
