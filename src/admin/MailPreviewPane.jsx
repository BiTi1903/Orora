import { useEffect, useRef, useState } from "react";

// Keep the editing viewport alive while the generated email changes.
const editorDocument = `<!doctype html><html lang="vi"><head><meta charset="utf-8"></head><body><script>
  let renderedHtml;
  window.addEventListener("message", event => {
    if (event.source !== parent || event.data?.type !== "orora-mail-render") return;
    if (event.data.html === renderedHtml) return;
    renderedHtml = event.data.html;
    const next = new DOMParser().parseFromString(event.data.html, "text/html");
    const top = scrollY;
    if (document.head.innerHTML !== next.head.innerHTML) document.head.innerHTML = next.head.innerHTML;
    document.body.style.cssText = next.body.style.cssText;
    document.body.innerHTML = next.body.innerHTML;
    scrollTo(0, top);
  });
  document.addEventListener("click", event => {
    const section = event.target.closest("[data-mail-section]");
    if (event.target.closest("a") || section) event.preventDefault();
    if (section) parent.postMessage({type:"orora-mail-select", section:section.dataset.mailSection}, "*");
  });
</script></body></html>`;

export default function MailPreviewPane({ html, subject, text, title = "Xem trước", onSelectSection, children }) {
  const [mode, setMode] = useState("desktop");
  const frameRef = useRef(null);

  const previewHtml = mode === "desktop" ? html.replace('<style data-mail-mobile>', '<style media="not all">') : html;
  const interactive = Boolean(onSelectSection);
  useEffect(() => {
    if (interactive) frameRef.current?.contentWindow?.postMessage({type:"orora-mail-render", html:previewHtml}, "*");
  }, [previewHtml, interactive, mode]);

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
        srcDoc={interactive ? editorDocument : previewHtml}
        onLoad={interactive ? () => frameRef.current?.contentWindow?.postMessage({type:"orora-mail-render", html:previewHtml}, "*") : undefined}
      />
    </div>}
  </details>;
}
