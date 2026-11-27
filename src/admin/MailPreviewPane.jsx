import { useEffect, useRef, useState } from "react";

export default function MailPreviewPane({ html, subject, text, title = "Xem trước", onSelectSection, children }) {
  const [mode, setMode] = useState("desktop");
  const frameRef = useRef(null);

  useEffect(() => {
    if (!onSelectSection) return;
    const onMessage = (event) => {
      if (event.source !== frameRef.current?.contentWindow) return;
      if (event.data?.type === "orora-mail-select" && typeof event.data.section === "string") {
        onSelectSection(event.data.section);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onSelectSection]);

  return <details className="admin-filter-panel mail-editor-preview" open>
    <summary>{title}</summary>
    {children}
    <div className="mail-preview-toolbar" role="group" aria-label="Chế độ xem trước">
      {Object.entries({desktop:"HTML · Máy tính", mobile:"HTML · Điện thoại", text:"Văn bản thuần"}).map(([key, label]) =>
        <button type="button" key={key} className={mode === key ? "admin-btn primary" : "admin-btn"}
          aria-pressed={mode === key} onClick={() => setMode(key)}>{label}</button>)}
    </div>
    {onSelectSection && mode !== "text" && (
      <p className="admin-muted" style={{ margin: "6px 0 0", fontSize: 12 }}>
        Mẹo: Bấm trực tiếp vào từng phần (Đầu thư, Tiêu đề, Nội dung, Các khối, Nút, Chân thư) trên bản xem trước để mở nhanh bảng chỉnh phần đó.
      </p>
    )}
    {mode === "text" ? <div className="admin-detail-box">
      <strong>{subject}</strong><p style={{whiteSpace:"pre-wrap", overflowWrap:"anywhere"}}>{text}</p>
    </div> : <div className={`mail-preview-stage${mode === "mobile" ? " is-mobile" : ""}`}>
      <iframe
        ref={frameRef}
        className="mail-preview-frame"
        sandbox={onSelectSection ? "allow-scripts" : ""}
        title="Xem trước giao diện email ORORA"
        srcDoc={html}
      />
    </div>}
  </details>;
}
