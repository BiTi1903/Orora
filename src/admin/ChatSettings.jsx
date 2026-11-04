import { useEffect, useRef, useState } from "react";
import { chatSettings, DEFAULT_CHAT_STARTERS } from "../lib/chat";
import { getHomeContent, saveHomeContent, explainError } from "../lib/api";
import { changedValues, mergeSavedValues } from "./builder/save-sections";

export default function ChatSettings() {
  const [form, setForm] = useState(() => chatSettings());
  const [loading, setLoading] = useState(true), [failed, setFailed] = useState(false), [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null), [status, setStatus] = useState(null);
  const baseline = useRef({});
  const readStatus = () => fetch("/api/chat").then((response) => response.ok ? response.json() : null).then(setStatus).catch(() => setStatus(null));
  useEffect(() => {
    let alive = true;
    getHomeContent().then((home) => {
      if (!alive) return;
      const raw = home?.chatSettings || {};
      const loaded = { ...raw, ...chatSettings(raw), starters: Array.isArray(raw.starters) ? raw.starters.map((item) => ({ ...item })) : DEFAULT_CHAT_STARTERS.map((item) => ({ ...item })) };
      baseline.current = loaded; setForm(loaded);
    }).catch((error) => { if (alive) { setFailed(true); setNotice({ error: true, text: explainError(error) }); } }).finally(() => { if (alive) setLoading(false); });
    fetch("/api/chat").then((response) => response.ok ? response.json() : null).then((data) => { if (alive) setStatus(data); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const patch = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const patchStarter = (index, changes) => setForm((current) => ({ ...current, starters: current.starters.map((item, at) => at === index ? { ...item, ...changes } : item) }));
  return <section className="chat-settings-admin"><div className="admin-top"><div><h1>Chat AI</h1><p className="admin-muted">Trợ lý tư vấn dùng thông tin sản phẩm, chính sách và kiến thức cửa hàng.</p></div></div>
    <div className="admin-card chat-connection-card"><div><h2>Kết nối OpenAI</h2><p>{status ? status.aiConfigured ? "Máy chủ đã có cấu hình khóa OpenAI." : "Chưa có khóa OpenAI trên máy chủ." : "Chưa đọc được trạng thái kết nối máy chủ."}</p><p className="admin-muted">Đặt OPENAI_API_KEY trong Environment Variables của Vercel rồi redeploy để bật AI. Khi chưa có khóa hoặc AI tạm lỗi, chat vẫn gợi ý từ thông tin đã đăng.</p></div><button type="button" className="admin-btn" onClick={readStatus}>Kiểm tra trạng thái</button></div>
    <form className="admin-card admin-form" onSubmit={async (event) => {
      event.preventDefault(); if (loading || failed || busy) return;
      if (form.starters.length > 6 || form.starters.some((item) => !String(item.label || "").trim() || !String(item.prompt || "").trim())) return setNotice({ error: true, text: "Điền tên và câu hỏi cho từng lựa chọn gợi ý (tối đa 6 lựa chọn)." });
      setBusy(true); setNotice(null);
      try {
        const next = { ...form, title: form.title.trim(), greeting: form.greeting.trim(), placeholder: form.placeholder.trim(), knowledge: form.knowledge.trim(), starters: form.starters.map((s) => ({ ...s, label: s.label.trim(), prompt: s.prompt.trim() })) };
        const changes = changedValues(baseline.current, next);
        if (Object.keys(changes).length) { await saveHomeContent({ chatSettings: changes }); baseline.current = mergeSavedValues(baseline.current, changes); setForm(next); }
        setNotice({ text: "Đã lưu thiết lập Chat AI." });
      } catch (error) { setNotice({ error: true, text: explainError(error) }); } finally { setBusy(false); }
    }}>
      <div className="product-editor-toolbar-top chat-settings-toolbar"><h2>Nội dung khung chat</h2><button type="submit" className="admin-btn primary" disabled={loading || failed || busy}>{busy ? "Đang lưu…" : "Lưu Chat AI"}</button></div>
      {notice && <p role={notice.error ? "alert" : "status"} className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
      <fieldset className="writer-fields" disabled={loading || failed || busy}>
        <label className="admin-check"><input type="checkbox" checked={form.enabled} onChange={(event) => patch("enabled", event.target.checked)} />Hiển thị chat trên website và chi tiết sản phẩm</label>
        <div className="admin-form-grid"><div className="admin-field"><label htmlFor="chat-title">Tên trợ lý</label><input id="chat-title" maxLength={60} value={form.title} onChange={(event) => patch("title", event.target.value)} /></div><div className="admin-field"><label htmlFor="chat-placeholder">Chữ gợi ý ô nhập</label><input id="chat-placeholder" maxLength={100} value={form.placeholder} onChange={(event) => patch("placeholder", event.target.value)} /></div></div>
        <div className="admin-field"><label htmlFor="chat-greeting">Lời chào khi mở chat</label><textarea id="chat-greeting" rows={3} maxLength={600} value={form.greeting} onChange={(event) => patch("greeting", event.target.value)} /></div>
        <div className="admin-field"><label htmlFor="chat-tone">Cách trả lời của AI</label><select id="chat-tone" value={form.tone} onChange={(event) => patch("tone", event.target.value)}><option value="warm">Thân thiện, dễ hiểu</option><option value="concise">Ngắn gọn</option><option value="detailed">Giải thích kỹ</option></select></div>
        <div><h3>Lựa chọn gợi ý ban đầu</h3><p className="admin-muted">Khách bấm một lựa chọn để gửi câu hỏi sẵn. Có thể để trống danh sách và chỉ dùng ô chat.</p></div>
        {form.starters.map((item, index) => <div className="product-content-section" key={item.id || index}><div className="product-editor-heading"><strong>Gợi ý {index + 1}</strong><button type="button" className="admin-btn danger" aria-label={`Xóa gợi ý ${index + 1}`} onClick={() => patch("starters", form.starters.filter((_, at) => at !== index))}>Xóa</button></div><div className="admin-form-grid"><div className="admin-field"><label htmlFor={`chat-label-${index}`}>Tên lựa chọn {index + 1}</label><input id={`chat-label-${index}`} maxLength={60} value={item.label || ""} onChange={(event) => patchStarter(index, { label: event.target.value })} /></div><div className="admin-field"><label htmlFor={`chat-prompt-${index}`}>Câu hỏi gửi AI {index + 1}</label><textarea id={`chat-prompt-${index}`} rows={2} maxLength={400} value={item.prompt || ""} onChange={(event) => patchStarter(index, { prompt: event.target.value })} /></div></div></div>)}
        <div><button type="button" className="admin-btn" disabled={form.starters.length >= 6} onClick={() => patch("starters", [...form.starters, { id: crypto.randomUUID(), label: "", prompt: "" }])}>+ Thêm lựa chọn gợi ý</button></div>
        <div className="admin-field"><label htmlFor="chat-knowledge">Kiến thức bổ sung cho trợ lý</label><textarea id="chat-knowledge" rows={8} maxLength={8000} value={form.knowledge} placeholder="Thông tin về thương hiệu, chính sách, câu hỏi thường gặp và câu trả lời chính xác của cửa hàng…" onChange={(event) => patch("knowledge", event.target.value)} /><small className="admin-muted">Sản phẩm, giá, dung tích và cam kết được đọc tự động. Chỉ nhập thông tin được phép công khai; không nhập khóa API hoặc dữ liệu riêng của khách hàng.</small></div>
      </fieldset>
    </form>
  </section>;
}
