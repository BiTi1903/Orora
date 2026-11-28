import { orderTrackingMail, trackingTemplate } from "../lib/order-tracking-mail.js";
import { BUILTIN_MAIL_PRESETS, findMailPreset } from "../lib/mail-presets.js";
import MailPreviewPane from "./MailPreviewPane";
import MailHtmlEditor from "./MailHtmlEditor";
import MailBodyBlocks from "./MailBodyBlocks";
import MailDesignFields from "./MailDesignFields";
import MailFormatToolbar from "./MailFormatToolbar";
import MailOrderTokenBar from "./MailOrderTokenBar";
import { useConfirm } from "./confirm-context";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";
import { SAMPLE_PREVIEW_ORDER, previewOrderVariables } from "./mail-order-preview";
import { effectiveMailState } from "../lib/mail-state";
import { renderBrandedEmailHtml, renderOrderEmailHtml, renderWelcomeEmailHtml } from "../lib/mail-html";
import { sectionIsEnabled } from "../lib/page-sections";
import * as api from "../lib/api";
import { orderRequest, MAIL_STATES } from "./order-api";

const ORDER_STAGE_PRESETS = BUILTIN_MAIL_PRESETS.filter((p) => p.stage !== "welcome");

export default function MailWriter({ mode, onModeChange, value, onChange, onChooseTemplate, request, onApply, onSendPrivate, privateRecipients, privateSendLabel, privateSendDisabled, disabled, allowedModes = ["welcome_auto", "order_auto", "private"], title = "Viết Thư", initialOrderId = "", purpose = "combined", onSent }) {
  const confirm = useConfirm();
  const fieldId = useId();
  const canSendOrder = mode === "order_auto" && purpose !== "automation";
  const lockedOrder = canSendOrder && Boolean(initialOrderId);
  const [checkedAt, setCheckedAt] = useState(() => Date.now());
  const [busyAction, setBusyAction] = useState("");
  const [localBusy, setLocalBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [testEmail, setTestEmail] = useState(() => auth?.currentUser?.email || "");
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [orderId, setOrderId] = useState(initialOrderId);
  const [orderError, setOrderError] = useState("");
  const [previousDraft, setPreviousDraft] = useState(null);
  const [designSection, setDesignSection] = useState("");
  const attempt = useRef(null);
  const subjectRef = useRef(null);
  const textRef = useRef(null);
  const activeFieldRef = useRef("text");
  const working = disabled || localBusy;
  const valid = Boolean(value.subject.trim() && value.text.trim());
  const selectedOrder = orders.find((order) => order.id === orderId);
  const mailState = effectiveMailState(selectedOrder?.confirmationMail, checkedAt);
  const recovering = mailState === "stuck";

  const [mailHome, setMailHome] = useState(null);
  const bankInfo = mailHome?.productDetailStyles?.purchaseOptions;
  const [previewTracking, setPreviewTracking] = useState("current");
  const trackingEnabled = previewTracking === "current" ? sectionIsEnabled(mailHome, "ordertracking") : previewTracking === "on";
  const tracking = orderTrackingMail(globalThis.location?.origin || "https://ororavn.com", selectedOrder?.code || "OW_1024C", trackingEnabled);
  useEffect(() => {
    if (mode !== "order_auto" || typeof api.getHomeContent !== "function") return;
    let alive = true;
    api.getHomeContent().then((home) => {
      if (alive) setMailHome(home);
    }).catch(() => {});
    return () => { alive = false; };
  }, [mode]);

  const previewSubject = mode === "order_auto" ? previewOrderVariables(value.subject, selectedOrder, tracking) : value.subject;
  const previewText = mode === "order_auto" ? previewOrderVariables(trackingTemplate(value.text, trackingEnabled), selectedOrder, tracking) : value.text;
  const previewHtml = useMemo(() => {
    const siteOrigin = typeof window !== "undefined" ? window.location.origin : "https://ororavn.com";
    if (mode === "order_auto") {
      return renderOrderEmailHtml({
        design: value.design, subject: previewSubject,
        text: previewText,
        order: selectedOrder || SAMPLE_PREVIEW_ORDER,
        siteOrigin,
        bankInfo, trackingEnabled, trackingUrl: tracking.url,
        interactivePreview: true,
        selectedSection: designSection,
      });
    }
    if (mode === "welcome_auto") {
      return renderWelcomeEmailHtml({
        design: value.design, subject: previewSubject,
        text: previewText,
        unsubscribeUrl: `${siteOrigin}/api/unsubscribe?id=preview&token=preview`,
        siteOrigin,
        interactivePreview: true,
        selectedSection: designSection,
      });
    }
    return renderBrandedEmailHtml({
      design: value.design, subject: previewSubject,
      text: previewText,
      unsubscribeUrl: `${siteOrigin}/api/unsubscribe?id=preview&token=preview`,
      siteOrigin,
      interactivePreview: true,
      selectedSection: designSection,
    });
  }, [value.design, mode, previewSubject, previewText, selectedOrder, bankInfo, trackingEnabled, tracking.url, designSection]);

  useEffect(() => {
    if (!canSendOrder || selectedOrder?.confirmationMail?.state !== "sending") return;
    const timer = setInterval(() => setCheckedAt(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [canSendOrder, selectedOrder?.confirmationMail?.state]);

  useEffect(() => {
    if (!canSendOrder) return;
    let alive = true;
    (lockedOrder ? orderRequest(null, { id: initialOrderId }).then((data) => ({ orders: [data.order], nextCursor: null })) : orderRequest()).then(async (page) => { if (initialOrderId && !page.orders.some((item) => item.id === initialOrderId)) { const detail = await orderRequest(null, { id: initialOrderId }); page.orders = [detail.order, ...page.orders]; } if (alive) { setOrders(page.orders); setCursor(page.nextCursor); setOrderError(""); } }).catch((error) => { if (alive) setOrderError(error.message); });
    return () => { alive = false; };
  }, [canSendOrder, lockedOrder, initialOrderId]);

  const perform = async (work, action = "") => {
    if (working) return;
    setLocalBusy(true); setBusyAction(action); setNotice(null);
    try { const result = await work(); if (result?.message) setNotice({ error: ["failed", "unknown"].includes(result.state), text: result.message }); }
    catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setLocalBusy(false); setBusyAction(""); }
  };

  const applyPreset = (preset) => {
    if (!preset) return;
    setPreviousDraft(value);
    onChange({
      subject: preset.subject,
      text: preset.text,
      design: { ...(value.design || {}), ...(preset.design || {}) },
    });
    setNotice({ text: `Đã nạp mẫu “${preset.name}”. Kiểm tra khung Xem trước bên phải trước khi lưu hoặc gửi.` });
  };

  const insertToken = (token) => {
    const field = activeFieldRef.current === "subject" ? "subject" : "text";
    const el = field === "subject" ? subjectRef.current : textRef.current;
    const current = value[field] || "";
    const start = el && typeof el.selectionStart === "number" ? el.selectionStart : current.length;
    const end = el && typeof el.selectionEnd === "number" ? el.selectionEnd : current.length;
    const updated = `${current.slice(0, start)}${token}${current.slice(end)}`;
    onChange({ design: value.design, subject: value.subject, text: value.text, [field]: updated });
    requestAnimationFrame(() => {
      if (!el) return;
      el.focus();
      const pos = start + token.length;
      el.setSelectionRange?.(pos, pos);
    });
  };

  return <div aria-busy={Boolean(working)} className="admin-card admin-form">
    {title && <h2>{title}</h2>}
    <fieldset className="writer-fields" disabled={working}>
      <div className="mail-writer-grid">
        <div className="mail-writer-main">
          {allowedModes.length > 1 && <div className="admin-field"><label htmlFor={`${fieldId}-writer-mode`}>Loại thư muốn viết</label><select id={`${fieldId}-writer-mode`} className="mail-template-select" value={mode} onChange={(event) => { onModeChange(event.target.value); setNotice(null); }}>{[["welcome_auto", "Thư Đăng Ký"], ["order_auto", "Thư Đơn Hàng"], ["private", "Gửi riêng"]].filter(([key]) => allowedModes.includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>}

          {(onChooseTemplate || mode === "welcome_auto" || mode === "order_auto") && (
            <div className="mail-quick-presets-bar">
              {onChooseTemplate && <button type="button" className="admin-btn" onClick={onChooseTemplate}>Chọn mẫu từ Mẫu Thư</button>}
              {mode === "welcome_auto" && (
                <button type="button" className="admin-btn" onClick={() => applyPreset(findMailPreset("welcome"))}>
                  Nạp mẫu chuẩn ORORA
                </button>
              )}
              {mode === "order_auto" && purpose === "automation" && (
                <button type="button" className="admin-btn" onClick={() => applyPreset(findMailPreset("received"))}>
                  Nạp mẫu chuẩn ORORA
                </button>
              )}
              {mode === "order_auto" && purpose !== "automation" && ORDER_STAGE_PRESETS.map((preset) => (
                <button key={preset.id} type="button" className="admin-btn" onClick={() => applyPreset(preset)}>
                  Mẫu: {preset.badge}
                </button>
              ))}
              {previousDraft && <button type="button" className="admin-btn" onClick={() => { onChange(previousDraft); setPreviousDraft(null); setNotice(null); }}>Hoàn tác nạp mẫu</button>}
            </div>
          )}

          <div className="admin-field"><label htmlFor={`${fieldId}-writer-subject`}>Tiêu đề thư</label><input ref={subjectRef} id={`${fieldId}-writer-subject`} required maxLength={200} value={value.subject} onFocus={() => { activeFieldRef.current = "subject"; }} onChange={(event) => onChange({ design: value.design, subject: event.target.value, text: value.text })} /></div>
          <div className="admin-field">
            <label htmlFor={`${fieldId}-writer-text`}>Nội dung thư</label>
            <MailFormatToolbar textRef={textRef} value={value.text} disabled={working} onChange={(text) => onChange({ design: value.design, subject: value.subject, text })} />
            <textarea ref={textRef} id={`${fieldId}-writer-text`} required rows={10} maxLength={20000} value={value.text} onFocus={() => { activeFieldRef.current = "text"; }} onChange={(event) => onChange({ design: value.design, subject: value.subject, text: event.target.value })} />
          </div>

          {mode === "order_auto" && <MailOrderTokenBar onInsert={insertToken} disabled={working} />}

          <MailBodyBlocks text={value.text} onChange={text => onChange({ design: value.design, subject: value.subject, text })} />

          <MailDesignFields bodyText={value.text} onBodyTextChange={text => onChange({subject:value.subject, design:value.design, text})} kind={mode} value={value.design} activeSection={designSection} onSectionChange={setDesignSection} onChange={design => onChange({ subject: value.subject, text: value.text, design })} />

          <MailHtmlEditor value={value.design} onChange={design => onChange({ subject: value.subject, text: value.text, design })} />
        </div>
        <MailPreviewPane html={previewHtml} subject={previewSubject} text={previewText}
          onSelectSection={setDesignSection}
          title={mode === "order_auto" ? `Xem trước · ${selectedOrder?.code || "Đơn minh họa"}` : "Xem trước thư"}>
            {mode === "order_auto" && <label>Tra cứu đơn trong bản xem trước
              <select value={previewTracking} onChange={event => setPreviewTracking(event.target.value)}>
                <option value="current">Theo cấu hình cửa hàng</option>
                <option value="on">Bật tra cứu</option>
                <option value="off">Tắt tra cứu</option>
              </select>
            </label>}
        </MailPreviewPane>
        <div className="mail-writer-side">
          {mode === "private" && privateRecipients}
          {lockedOrder && <div className="mail-recipient-summary"><span>Người nhận</span><strong>{(selectedOrder ? selectedOrder.customer.email || "Đơn chưa có email" : orderError ? "Chưa tải được người nhận" : "Đang tải người nhận…")}</strong><small>Đơn {selectedOrder?.code || "…"} · {selectedOrder?.customer.name}</small></div>}
          {canSendOrder && <div className="admin-form">
            {orderError && <p className="admin-error" role="alert">{orderError}</p>}
            {!lockedOrder && <div className="admin-field"><label htmlFor={`${fieldId}-writer-order`}>Chọn đơn hàng</label><select id={`${fieldId}-writer-order`} className="mail-template-select" value={orderId} onChange={(event) => { setOrderId(event.target.value); attempt.current = null; }}><option value="">Chưa chọn đơn</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.code} · {order.customer.name} · {order.customer.email || "Chưa có email"}</option>)}</select></div>}
            {selectedOrder && !lockedOrder && <p>Người nhận của đơn: <strong>{selectedOrder.customer.email || "Chưa có email"}</strong> · {MAIL_STATES[mailState] || "Chưa có lịch sử"}</p>}
          </div>}

          {mode !== "private" && purpose !== "send" && <div className="admin-detail-box">
            <h3>Áp dụng tự động</h3>
            <button type="button" className="admin-btn primary" style={{ width: "100%" }} aria-busy={localBusy && busyAction === "save"} disabled={!valid} onClick={() => perform(() => onApply(mode, value), "save")}>Lưu làm thư {mode === "order_auto" ? "đơn hàng" : "đăng ký"} tự động</button>
            <p className="admin-muted" style={{ marginTop: 8 }}>Lưu chỉ áp dụng cho các lần gửi tự động mới.</p>
          </div>}

          {mode === "private" && <button type="button" className="admin-btn primary" style={{ width: "100%" }} aria-busy={localBusy && busyAction === "private"} disabled={!valid || privateSendDisabled} onClick={() => perform(() => onSendPrivate(value), "private")}>{privateSendLabel}</button>}

          {canSendOrder && <div className="admin-detail-box">
            <h3>Gửi cho đơn hàng</h3>
            <div className="admin-actions"><button type="button" className="admin-btn primary" style={{ width: "100%" }} aria-busy={localBusy && busyAction === "order"} disabled={localBusy || (!recovering && !valid) || !selectedOrder?.customer.email || mailState === "sending"} onClick={async () => {
              const confirmResend = ["accepted", "unknown"].includes(selectedOrder.confirmationMail?.state);
              const prompt = recovering
                ? `Kiểm tra trạng thái email của đơn ${selectedOrder.code}? Bước này cập nhật kết quả của lần gửi bị gián đoạn. Hãy kiểm tra Outlook trước khi chọn gửi lại.`
                : `Gửi nội dung đang soạn cho ${selectedOrder.customer.email}, đơn ${selectedOrder.code}?${confirmResend ? " Có thể đã gửi thư trước đó. Chỉ tiếp tục sau khi kiểm tra thư đã gửi trên Microsoft; gửi lại có thể tạo thư trùng." : ""}`;
              if (!await confirm(prompt, {
                title: recovering ? "Kiểm tra trạng thái email" : "Gửi email đơn hàng",
                confirmLabel: recovering ? "Cập nhật trạng thái" : confirmResend ? "Gửi lại" : "Gửi email",
                danger: confirmResend,
              })) return;
              perform(async () => {
                const signature = JSON.stringify({ orderId, value });
                if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
                const result = await orderRequest({ action: "sendOrderEmail", id: orderId, requestId: attempt.current.id, confirmResend, recoverOnly: recovering, message: { design: value.design, subject: value.subject, text: value.text }, ...(value.templateRef ? { templateRef: value.templateRef } : {}) });
                attempt.current = null;
                const current = await orderRequest(null, { id: orderId }); setOrders((items) => items.map((item) => item.id === orderId ? current.order : item));
                onSent?.(current.order);
                return result;
              }, "order");
            }}>{recovering ? "Cập nhật trạng thái gửi" : lockedOrder ? "Gửi email cho khách" : "Gửi cho đơn đã chọn"}</button>{!lockedOrder && <><button type="button" className="admin-btn" onClick={() => perform(async () => { const page = await orderRequest(); setOrders(page.orders); setCursor(page.nextCursor); setOrderError(""); })}>Tải lại đơn</button>{cursor && <button type="button" className="admin-btn" onClick={() => perform(async () => { const page = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...page.orders].map((item) => [item.id, item])).values()]); setCursor(page.nextCursor); })}>Tải thêm đơn</button>}</>}</div>
          </div>}

          {request && <details className="writer-test"><summary>Gửi thử tới email của bạn</summary><form className="writer-block admin-form" aria-busy={localBusy && busyAction === "test"} onSubmit={(event) => {
            event.preventDefault();
            perform(() => request({ action: "sendTest", design: value.design, subject: value.subject, text: value.text, testEmail, mailType: mode === "order_auto" ? "order" : mode === "welcome_auto" ? "registration" : "private", ...(mode === "order_auto" && orderId ? { orderId } : {}) }), "test");
          }}><div className="admin-field"><label htmlFor={`${fieldId}-writer-test-email`}>Email nhận thư thử</label><input id={`${fieldId}-writer-test-email`} type="email" required maxLength={254} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /></div><p className="admin-muted">Chỉ gửi tới email thử này.</p><button className="admin-btn" aria-busy={localBusy && busyAction === "test"} disabled={!valid}>Gửi thử</button></form></details>}
        </div>
      </div>
    </fieldset>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
