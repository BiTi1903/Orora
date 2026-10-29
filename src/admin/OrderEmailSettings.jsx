import { useState } from "react";
export default function OrderEmailSettings({ initialTemplate, selectedTemplate, onSave, onChooseTemplate, prefix = "order", title = "Thư xác nhận đơn hàng tự động", saveLabel = "Áp dụng mẫu xác nhận" }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [edit, setEdit] = useState(null);
  const source = selectedTemplate?.id || JSON.stringify(initialTemplate);
  const changed = edit?.source === source;
  const template = changed ? edit.message : selectedTemplate?.message || initialTemplate;
  const update = (key, value) => { setEdit({ source, message: { subject: template.subject, text: template.text, [key]: value } }); setNotice(null); };
  const subjectLabel = prefix === "welcome" ? "Tiêu đề thư chào mừng" : "Tiêu đề thư đơn hàng";
  const textLabel = prefix === "welcome" ? "Nội dung thư chào mừng" : "Nội dung thư đơn hàng";
  return <form className="admin-card admin-form" onSubmit={async (event) => {
    event.preventDefault(); if (busy) return; setBusy(true); setNotice(null);
    try { const data = await onSave(template); setNotice({ text: data.message }); }
    catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setBusy(false); }
  }}>
    <h2>{title}</h2><p className="admin-muted">Viết trực tiếp hoặc chọn một mẫu trong danh sách rồi chỉnh nội dung. Bấm Áp dụng để dùng cho các lần gửi tự động tiếp theo.</p>
    <p className="admin-muted">{changed ? "Đang chỉnh nội dung trực tiếp; mẫu trong kho không bị thay đổi." : `Mẫu: ${selectedTemplate?.name || template.templateName || "Nội dung đang áp dụng"}`}</p>
    <div className="admin-field"><label htmlFor={`${prefix}-mail-subject`}>{subjectLabel}</label><input id={`${prefix}-mail-subject`} required maxLength={200} disabled={busy} value={template.subject} onChange={(event) => update("subject", event.target.value)} /></div>
    <div className="admin-field"><label htmlFor={`${prefix}-mail-text`}>{textLabel}</label><textarea id={`${prefix}-mail-text`} required rows={10} maxLength={20000} disabled={busy} value={template.text} onChange={(event) => update("text", event.target.value)} /></div>
    {prefix === "order" && <p className="admin-muted">Biến đơn hàng: {"{{customerName}}, {{orderCode}}, {{productName}}, {{quantity}}, {{subtotal}}, {{paymentMethod}}, {{address}}, {{phone}}, {{email}}"}.</p>}
    <div className="admin-actions"><button className="admin-btn primary" disabled={busy}>{saveLabel}</button><button type="button" className="admin-btn" disabled={busy} onClick={onChooseTemplate}>Chọn mẫu có sẵn</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </form>;
}
