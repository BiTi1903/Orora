import MailPreviewDialog from "./MailPreviewDialog";
import { useState } from "react";
export default function OrderEmailSettings({ initialTemplate, selectedTemplate, onSave, onChooseTemplate }) {
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const source = selectedTemplate?.id || null;
  const [edit, setEdit] = useState({ source: null, message: initialTemplate || { subject: "", text: "" } });
  const template = edit.source === source ? edit.message : selectedTemplate?.message || initialTemplate;
  const setTemplate = (message) => { const { templateRef: _reference, ...content } = message; void _reference; setEdit({ source, message: content }); setNotice(null); };
  return <div className="admin-card">
    <form className="admin-form" onSubmit={async (event) => {
      event.preventDefault(); if (busy) return; setBusy(true); setNotice(null);
      try { const data = await onSave(template); setNotice({ text: data.message }); }
      catch (error) { setNotice({ error: true, text: error.message }); }
      finally { setBusy(false); }
    }}>
      <h2>Thư xác nhận đơn hàng tự động</h2><p className="admin-muted">Tự động gửi khi khách đặt hàng. Chọn mẫu chỉ chép vào ô soạn; bấm Lưu để áp dụng cho các đơn mới.</p>
      <div className="admin-field"><label htmlFor="order-mail-subject">Tiêu đề thư đơn hàng</label><input id="order-mail-subject" required maxLength={200} value={template.subject} disabled={busy} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} /></div>
      <div className="admin-field"><label htmlFor="order-mail-text">Nội dung thư đơn hàng</label><textarea id="order-mail-text" required rows={12} maxLength={20000} value={template.text} disabled={busy} onChange={(event) => setTemplate({ ...template, text: event.target.value })} /></div>
      <p className="admin-muted">Biến có thể dùng: {['customerName','orderCode','productName','quantity','subtotal','paymentMethod','address','phone','email'].map((name) => <code key={name}>{`{{${name}}} `}</code>)}</p>
      <div className="admin-actions"><button className="admin-btn primary" disabled={busy}>Lưu mẫu thư đơn hàng</button><button type="button" className="admin-btn" disabled={busy} onClick={onChooseTemplate}>Chọn mẫu có sẵn</button><button type="button" className="admin-btn" onClick={() => setPreview(template)}>Xem trước</button></div>
    </form>
    {preview && <MailPreviewDialog title="Mẫu thư đơn hàng tự động" message={preview} onClose={() => setPreview(null)} />}
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
