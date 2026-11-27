import { useEffect, useState } from "react";
import { newsletterRequest as request } from "./newsletter-api";
import { templateReference } from "../lib/mail-templates";
import MailWriter from "./MailWriter";
import MailTemplatePicker from "./MailTemplatePicker";

const FALLBACK_ORDER_DRAFT = {
  subject: "Cập nhật đơn hàng {{orderCode}} từ ORORA",
  text: "Chào {{customerName}},\n\nCảm ơn bạn đã đặt hàng tại ORORA.\n\nThân mến,\nORORA",
};

export default function OrderEmails({ initialDraft, initialOrderId = "", onManageTemplates, purpose = "automation", onSent, canUseNewsletter = true }) {
  const needsNewsletter = purpose === "automation" || canUseNewsletter;
  const [draft, setDraft] = useState(
    initialDraft
      ? { design: initialDraft.design, subject: initialDraft.subject, text: initialDraft.text, ...(initialDraft.templateRef ? { templateRef: initialDraft.templateRef } : {}) }
      : needsNewsletter ? null : FALLBACK_ORDER_DRAFT,
  );
  const [picker, setPicker] = useState(false);
  const [loading, setLoading] = useState(needsNewsletter);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!needsNewsletter) return;
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [data] = await Promise.all([request(), request({ action: "ensureDefaultTemplates" })]);
        if (alive) { setDraft((current) => current || data.orderTemplate); setError(""); }
      } catch (cause) { if (alive) setError(cause.message); }
      finally { if (alive) setLoading(false); }
    }
    load(); return () => { alive = false; };
  }, [version, needsNewsletter]);
  return <div className="admin-order-emails">
    {purpose === "automation" && <p className="admin-context-note">Nội dung mặc định gửi sau khi khách đặt hàng. Thay đổi tại đây chỉ áp dụng cho đơn mới; gửi riêng cho khách trong chi tiết đơn hàng.</p>}
    {error && <p className="admin-error" role="alert">{error} <button type="button" className="admin-btn" onClick={() => setVersion((value) => value + 1)}>Tải lại</button></p>}
    {loading ? <p>Đang tải mẫu thư đơn hàng…</p> : draft && <MailWriter mode="order_auto" allowedModes={["order_auto"]} purpose={purpose} title={purpose === "automation" ? "Thư xác nhận đơn tự động" : null} initialOrderId={initialOrderId} value={draft} onChange={setDraft} onChooseTemplate={canUseNewsletter ? () => setPicker(true) : undefined} request={canUseNewsletter ? request : undefined} onApply={async (_mode, message) => request({ action: "saveOrderTemplate", ...message })} onSent={onSent} />}
    {canUseNewsletter && picker && <MailTemplatePicker request={request} kind="order_auto" orderContext includePrivate onClose={() => setPicker(false)} onUse={(item) => { setDraft({ design: item.design, subject: item.subject, text: item.text, templateKind: item.kind, ...(templateReference(item) ? { templateRef: templateReference(item) } : {}) }); setPicker(false); }} onManage={onManageTemplates ? () => { setPicker(false); onManageTemplates(); } : undefined} />}
  </div>;
}
