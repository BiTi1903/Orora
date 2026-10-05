import { useEffect, useState } from "react";
import { defaultHomeContent } from "../data/content";
import { explainError, getHomeContent, saveHomeContent } from "../lib/api";
import ImageField from "./ImageField";

const FIELDS = [
  ["heroEyebrow", "Dòng nhỏ phía trên (Welcome to)"],
  ["heroTitle", "Tiêu đề lớn"],
  ["heroDescription", "Mô tả ngắn"],
  ["heroButtonText", "Chữ nút chính"],
  ["heroButtonLink", "Liên kết nút chính"],
  ["shopButtonText", "Chữ nút phụ"],
  ["shopButtonLink", "Liên kết nút phụ"],
];

export default function HomeAdmin() {
  const [form, setForm] = useState(defaultHomeContent);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rotatorText, setRotatorText] = useState((defaultHomeContent.heroRotator || []).join("\n"));

  useEffect(() => {
    getHomeContent()
      .then((v) => {
        if (!v) return;
        const merged = { ...defaultHomeContent, ...v };
        setForm(merged);
        setRotatorText((merged.heroRotator || []).join("\n"));
      })
      .catch(() => {});
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const heroRotator = rotatorText.split("\n").map((t) => t.trim()).filter(Boolean);
      await saveHomeContent({ ...form, heroRotator });
      setForm((f) => ({ ...f, heroRotator }));
      setMessage({ type: "success", text: "Đã lưu nội dung trang chủ." });
    } catch (err) {
      setMessage({ type: "error", text: explainError(err) });
    }
    setBusy(false);
  };

  return (
    <section>
      <h1>Trang chủ</h1>
      <p className="admin-muted">Chỉnh sửa nội dung phần đầu trang mà không cần sửa code.</p>

      {message && <div className={`admin-${message.type}`} style={{ margin: "16px 0" }}>{message.text}</div>}

      <form className="admin-card admin-form" onSubmit={save} style={{ marginTop: 16 }}>
        {FIELDS.map(([key, label]) => (
          <div className="admin-field" key={key}>
            <label>{label}</label>
            <input name={key} value={form[key] || ""} onChange={change} />
          </div>
        ))}

        <ImageField
          label="Ảnh nền phần đầu trang (Hero)"
          value={form.heroImage ?? "/hero.jpg"}
          onChange={(v) => setForm({ ...form, heroImage: v })}
          width={2000}
        />

        <div className="admin-field">
          <label>Các từ đổi liên tục (mỗi dòng một từ hoặc cụm)</label>
          <textarea
            rows="4"
            value={rotatorText}
            onChange={(e) => setRotatorText(e.target.value)}
          />
        </div>

        <button className="admin-btn primary" disabled={busy}>{busy ? "Đang lưu..." : "Lưu thay đổi"}</button>
      </form>
    </section>
  );
}