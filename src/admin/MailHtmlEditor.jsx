import { DEFAULT_MAIL_CODE, MAIL_CODE_LIMIT } from "../lib/mail-design";

export default function MailHtmlEditor({ value, onChange, disabled }) {
  const enabled = value?.useHtml === true;
  return <details className="admin-filter-panel">
    <summary>Sửa mã HTML</summary>
    <label><input type="checkbox" disabled={disabled} checked={enabled} onChange={event => onChange({
      ...value, useHtml: event.target.checked, htmlSource: value?.htmlSource ?? DEFAULT_MAIL_CODE,
    })} /> Dùng HTML cho phần nội dung thư</label>
    {enabled && <>
      <p className="admin-muted">Chèn {"{{content}}"} để hiển thị nội dung đã soạn và thông tin cá nhân hóa. Có thể dùng bảng, ảnh HTTPS, liên kết và CSS nội tuyến. Khung thư, chi tiết đơn và liên kết hủy đăng ký do hệ thống ghép tự động.</p>
      <label className="admin-field">Mã HTML nội dung
        <textarea rows={12} maxLength={MAIL_CODE_LIMIT} spellCheck={false} disabled={disabled}
          style={{fontFamily:"monospace"}} value={value.htmlSource} onChange={event => onChange({...value, htmlSource:event.target.value})} />
      </label>
    </>}
  </details>;
}
