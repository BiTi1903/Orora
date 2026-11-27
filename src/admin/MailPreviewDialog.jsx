import { useEffect, useId, useMemo, useRef, useState } from "react";
import { renderBrandedEmailHtml, renderOrderEmailHtml, renderWelcomeEmailHtml } from "../lib/mail-html";
import { SAMPLE_PREVIEW_ORDER, previewOrderVariables } from "./mail-order-preview";
import { orderTrackingMail, trackingTemplate } from "../lib/order-tracking-mail";

export default function MailPreviewDialog({ title, message, onClose, children, metadata }) {
  const ref = useRef(null);
  const titleId = useId();
  const [view, setView] = useState("html");
  useEffect(() => { const dialog = ref.current; dialog.showModal(); return () => { dialog.close(); }; }, []);

  const html = useMemo(() => {
    if (!message || typeof message.text !== "string") return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://ororavn.com";
    const isOrder = message.kind === "order_auto" || Boolean(message.orderCode || message.orderId);
    if (isOrder) {
      const order = { ...SAMPLE_PREVIEW_ORDER, ...(message.orderCode ? { code: message.orderCode } : {}) };
      const tracking = orderTrackingMail(origin, order.code, true);
      return renderOrderEmailHtml({
        design: message.design,
        subject: previewOrderVariables(message.subject || "", order, tracking),
        text: previewOrderVariables(trackingTemplate(message.text || "", true), order, tracking),
        order,
        siteOrigin: origin,
      });
    }
    if (message.kind === "welcome_auto") {
      return renderWelcomeEmailHtml({
        design: message.design,
        subject: message.subject || "",
        text: message.text || "",
        unsubscribeUrl: `${origin}/api/unsubscribe?id=preview&token=preview`,
        siteOrigin: origin,
      });
    }
    return renderBrandedEmailHtml({
      design: message.design,
      subject: message.subject || "",
      text: message.text || "",
      unsubscribeUrl: `${origin}/api/unsubscribe?id=preview&token=preview`,
      siteOrigin: origin,
    });
  }, [message]);

  return <dialog ref={ref} className="admin-mail-dialog" aria-labelledby={titleId} onClose={onClose} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const box = ref.current.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) ref.current.close();
  }}>
    <div className="mail-dialog-heading"><h2 id={titleId}>{title}</h2><button type="button" className="admin-btn" onClick={() => ref.current.close()}>Đóng</button></div>
    <div className="mail-dialog-content">
      {metadata}
      {message && <>
        <div className="mail-preview-toolbar" role="group" aria-label="Chế độ xem thư">
          <button type="button" className={view === "html" ? "admin-btn primary" : "admin-btn"} aria-pressed={view === "html"} onClick={() => setView("html")}>Xem giao diện HTML</button>
          <button type="button" className={view === "text" ? "admin-btn primary" : "admin-btn"} aria-pressed={view === "text"} onClick={() => setView("text")}>Văn bản thuần</button>
        </div>
        {view === "text" ? (
          <><h3>{message.subject}</h3><pre>{message.text}</pre></>
        ) : (
          <div className="mail-preview-stage" style={{ marginTop: 10 }}>
            <iframe className="mail-preview-frame" sandbox="" title="Xem trước email" srcDoc={html} />
          </div>
        )}
      </>}
    </div>
    {children && <div className="admin-actions mail-dialog-actions">{children}</div>}
  </dialog>;
}
