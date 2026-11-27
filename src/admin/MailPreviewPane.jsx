import { useState } from "react";

export default function MailPreviewPane({ html, subject, text, title = "Xem trước", children }) {
  const [mode, setMode] = useState("desktop");
  return <details className="admin-filter-panel mail-editor-preview" open>
    <summary>{title}</summary>
    {children}
    <div className="mail-preview-toolbar" role="group" aria-label="Chế độ xem trước">
      {Object.entries({desktop:"HTML · Máy tính", mobile:"HTML · Điện thoại", text:"Văn bản thuần"}).map(([key, label]) =>
        <button type="button" key={key} className={mode === key ? "admin-btn primary" : "admin-btn"}
          aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}
    </div>
    {mode === "text" ? <div className="admin-detail-box">
      <strong>{subject}</strong><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{text}</p>
    </div> : <div className={`mail-preview-stage${mode === "mobile" ? " is-mobile" : ""}`}>
      <iframe className="mail-preview-frame" sandbox="" title="Xem trước giao diện email ORORA" srcDoc={html} />
    </div>}
  </details>;
}
