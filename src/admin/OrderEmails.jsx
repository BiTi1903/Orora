import { useEffect, useState } from "react";
import { newsletterRequest as request } from "./newsletter-api";
import { templateReference } from "../lib/mail-templates";
import MailWriter from "./MailWriter";
import MailTemplatePicker from "./MailTemplatePicker";
import OrderMailHistory from "./OrderMailHistory";
export default function OrderEmails({ initialDraft, initialOrderId = "", onManageTemplates }) {
  const [view, setView] = useState("write"); const [draft, setDraft] = useState(initialDraft || null); const [picker, setPicker] = useState(false); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const [data] = await Promise.all([request(), request({ action: "ensureDefaultTemplates" })]);
        if (alive) { setDraft((current) => current || data.orderTemplate); setError(""); }
      } catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, []);
  return <div className="admin-order-emails"><nav className="admin-section-tabs" aria-label="Các mục thư đơn hàng"><button type="button" aria-current={view === "write" ? "page" : undefined} onClick={() => setView("write")}>Viết thư đơn hàng</button><button type="button" aria-current={view === "history" ? "page" : undefined} onClick={() => setView("history")}>Thư đơn hàng đã gửi</button></nav>
    {notice && <p role="status" className="admin-success">{notice}</p>}
    {view === "history" && <OrderMailHistory onReuse={(message, original) => { setDraft(message); setView("write"); setNotice(original ? "Đã chép mẫu vào thư đang soạn. Chọn đơn và kiểm tra trước khi gửi." : "Đã chép thư cũ. Kiểm tra lại tên, địa chỉ và mã đơn cũ trước khi gửi."); }} />}
    <div hidden={view !== "write"}>{error && <p className="admin-error" role="alert">{error}</p>}{loading ? <p>Đang tải mẫu thư đơn hàng…</p> : draft && <MailWriter mode="order_auto" allowedModes={["order_auto"]} title="Viết thư đơn hàng" initialOrderId={initialOrderId} value={draft} onChange={setDraft} onChooseTemplate={() => setPicker(true)} request={request} onApply={async (_mode, message) => request({ action: "saveOrderTemplate", ...message })} />}</div>
    {picker && <MailTemplatePicker request={request} kind="order_auto" orderContext includePrivate onClose={() => setPicker(false)} onUse={(item) => { setDraft({ subject: item.subject, text: item.text, templateKind: item.kind, ...(templateReference(item) ? { templateRef: templateReference(item) } : {}) }); setPicker(false); setNotice("Đã chọn mẫu. Lưu để áp dụng tự động hoặc chọn đơn để gửi riêng."); }} onManage={onManageTemplates ? () => { setPicker(false); onManageTemplates(); } : undefined} />}
  </div>;
}
