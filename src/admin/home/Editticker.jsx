import { useEffect, useState } from "react";
import useHomeForm from "./Usehomeform";
import { toLines } from "./Defaults";
import { SectionShell } from "./Ui";
import { StyleList } from "./StyleEditor";

const ELEMENTS = [
  {
    key: "text",
    title: "Kiểu chữ — Câu chạy",
    sample: "Dịu nhẹ cho da",
    defaults: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 28,
      fontWeight: 400,
      fontStyle: "italic",
      color: "#3a1526",
    },
  },
  {
    key: "star",
    title: "Kiểu chữ — Dấu ✦ ngăn cách",
    sample: "✦",
    fields: ["fontFamily", "fontSize", "fontWeight", "color"],
    defaults: {
      fontSize: 14,
      fontWeight: 400,
      color: "#e2678f",
    },
  },
];

export default function EditTicker() {
  const h = useHomeForm(["marqueeWords", "marqueeStyles"]);
  const [text, setText] = useState("");
  const styles = h.form.marqueeStyles || {};

  useEffect(() => {
    if (!h.loading) setText((h.form.marqueeWords || []).join("\n"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [h.loading]);

  const setStyles = (next) => {
    const background = styles.background;
    h.set("marqueeStyles", background ? { ...next, background } : next);
  };

  return (
    <SectionShell
      title="Dải chữ chạy"
      hint="Các câu chạy ngang dưới phần Hero. Màu và font áp dụng ngay trên website sau khi lưu."
      {...h}
      onSubmit={(e) => h.save(e, { marqueeWords: toLines(text) })}
    >
      <div className="admin-field">
        <label>Nội dung (mỗi dòng một câu)</label>
        <textarea rows="7" value={text} onChange={(e) => setText(e.target.value)} />
      </div>

      <div className="admin-field">
        <label>Màu nền dải</label>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            type="color"
            value={styles.background || "#fffafc"}
            onChange={(e) => h.set("marqueeStyles", { ...styles, background: e.target.value })}
            style={{ width: 42, height: 42, padding: 0, border: "1px solid #ead9e0", borderRadius: 10, background: "#fff", cursor: "pointer" }}
          />
          <span className="admin-muted" style={{ fontSize: 12, textTransform: "uppercase" }}>
            {styles.background || "Mặc định"}
          </span>
          {styles.background && (
            <button
              type="button"
              className="admin-btn"
              onClick={() => {
                const next = { ...styles };
                delete next.background;
                h.set("marqueeStyles", next);
              }}
            >
              ↺ Mặc định
            </button>
          )}
        </div>
      </div>

      <StyleList elements={ELEMENTS} value={styles} onChange={setStyles} />
    </SectionShell>
  );
}