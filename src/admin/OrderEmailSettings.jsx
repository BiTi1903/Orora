import { useState } from "react";
export default function OrderEmailSettings({ initialTemplate, selectedTemplate, onSave, onChooseTemplate, title = "Thư xác nhận đơn hàng tự động", saveLabel = "Áp dụng mẫu xác nhận" }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const template = selectedTemplate?.message || initialTemplate;
  return <div className="admin-card admin-form">
    <h2>{title}</h2><p className="admin-muted">Tạo hoặc chỉnh nội dung tại Mẫu Thư. Ở đây chỉ chọn mẫu và áp dụng cho lần gửi tự động tiếp theo.</p>
    <p><strong>Mẫu: </strong>{selectedTemplate?.name || template.templateName || "Mẫu đang áp dụng từ trước"}</p><p><strong>Tiêu đề: </strong>{template.subject}</p>
    <div className="admin-actions"><button type="button" className="admin-btn primary" disabled={busy} onClick={async () => {
      if (busy) return; setBusy(true); setNotice(null);
      try { const data = await onSave(template); setNotice({ text: data.message }); }
      catch (error) { setNotice({ error: true, text: error.message }); }
      finally { setBusy(false); }
    }}>{saveLabel}</button><button type="button" className="admin-btn" disabled={busy} onClick={onChooseTemplate}>Chọn mẫu có sẵn</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
