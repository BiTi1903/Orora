import { useConfirm } from "./confirm-context";
import { useEffect, useId, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";
import { PAYMENT_LABELS, formatVnd } from "../lib/commerce";
import { orderProductName } from "../lib/product-options";
import { effectiveMailState } from "../lib/mail-state";
import { orderRequest, MAIL_STATES } from "./order-api";

const ORDER_QUICK_TOKENS = [
  ["{{customerName}}", "Tên khách"],
  ["{{orderCode}}", "Mã đơn"],
  ["{{productName}}", "Sản phẩm"],
  ["{{quantity}}", "Số lượng"],
  ["{{subtotal}}", "Tạm tính"],
  ["{{shippingFee}}", "Phí ship"],
  ["{{totalAmount}}", "Tổng tiền"],
  ["{{paymentMethod}}", "Thanh toán"],
  ["{{address}}", "Địa chỉ"],
  ["{{phone}}", "SĐT"],
  ["{{trackingUrl}}", "Link tra cứu"],
];

function previewOrderVariables(text, order) {
  if (!text) return "";
  const map = {
    "{{customerName}}": order?.customer?.name || "Nguyễn Minh Anh",
    "{{orderCode}}": order?.code || "OW_1024C",
    "{{productName}}": order?.product ? orderProductName(order.product) : "Gel dưỡng ORORA 100ml",
    "{{quantity}}": String(order?.quantity ?? 1),
    "{{subtotal}}": order?.subtotal != null ? formatVnd(order.subtotal) : "250.000 đ",
    "{{shippingFee}}": order?.shippingFee != null ? formatVnd(order.shippingFee) : "30.000 đ",
    "{{totalAmount}}": order?.totalAmount != null ? formatVnd(order.totalAmount) : "280.000 đ",
    "{{total}}": order?.totalAmount != null ? formatVnd(order.totalAmount) : "280.000 đ",
    "{{paymentMethod}}": PAYMENT_LABELS[order?.paymentMethod] || "Thanh toán khi nhận hàng (COD)",
    "{{address}}": order?.customer?.address || "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    "{{phone}}": order?.customer?.phone || "0901234567",
    "{{trackingUrl}}": `${typeof window !== "undefined" ? window.location.origin : "https://ororavn.com"}/tra-cuu-don-hang`,
  };
  return Object.entries(map).reduce((acc, [token, val]) => acc.replaceAll(token, val), text);
}

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
  const attempt = useRef(null);
  const working = disabled || localBusy;
  const valid = Boolean(value.subject.trim() && value.text.trim());
  const selectedOrder = orders.find((order) => order.id === orderId);
  const mailState = effectiveMailState(selectedOrder?.confirmationMail, checkedAt);
  const recovering = mailState === "stuck";

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

  const insertToken = (token) => {
    const nextText = value.text ? `${value.text}${value.text.endsWith(" ") || value.text.endsWith("\n") ? "" : " "}${token}` : token;
    onChange({ subject: value.subject, text: nextText });
  };

  return <div aria-busy={Boolean(working)} className="admin-card admin-form">
    {title && <h2>{title}</h2>}
    <fieldset className="writer-fields" disabled={working}>
      <div className="mail-writer-grid">
        <div className="mail-writer-main">
          {allowedModes.length > 1 && <div className="admin-field"><label htmlFor={`${fieldId}-writer-mode`}>Loại thư muốn viết</label><select id={`${fieldId}-writer-mode`} className="mail-template-select" value={mode} onChange={(event) => { onModeChange(event.target.value); setNotice(null); }}>{[["welcome_auto", "Thư Đăng Ký"], ["order_auto", "Thư Đơn Hàng"], ["private", "Gửi riêng"]].filter(([key]) => allowedModes.includes(key)).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>}
          {onChooseTemplate && <div className="admin-actions"><button type="button" className="admin-btn" onClick={onChooseTemplate}>Chọn mẫu từ Mẫu Thư</button></div>}
          <div className="admin-field"><label htmlFor={`${fieldId}-writer-subject`}>Tiêu đề thư</label><input id={`${fieldId}-writer-subject`} required maxLength={200} value={value.subject} onChange={(event) => onChange({ subject: event.target.value, text: value.text })} /></div>
          <div className="admin-field"><label htmlFor={`${fieldId}-writer-text`}>Nội dung thư</label><textarea id={`${fieldId}-writer-text`} required rows={11} maxLength={20000} value={value.text} onChange={(event) => onChange({ subject: value.subject, text: event.target.value })} /></div>
          {mode === "order_auto" && <>
            <div className="admin-detail-box">
              <h3>Chèn nhanh thông tin đơn hàng</h3>
              <div className="mail-token-bar">
                {ORDER_QUICK_TOKENS.map(([token, label]) => (
                  <button type="button" className="mail-token-chip" key={token} title={token} onClick={() => insertToken(token)}>+ {label}</button>
                ))}
              </div>
            </div>
            <details className="admin-filter-panel">
              <summary>Xem trước thư thực tế{selectedOrder ? ` (${selectedOrder.code})` : " (dữ liệu minh họa)"}</summary>
              <div className="admin-detail-box" style={{ marginTop: 8 }}>
                <p><strong>Tiêu đề:</strong> {previewOrderVariables(value.subject, selectedOrder)}</p>
                <p style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{previewOrderVariables(value.text, selectedOrder)}</p>
              </div>
            </details>
          </>}
        </div>

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
                const result = await orderRequest({ action: "sendOrderEmail", id: orderId, requestId: attempt.current.id, confirmResend, recoverOnly: recovering, message: { subject: value.subject, text: value.text }, ...(value.templateRef ? { templateRef: value.templateRef } : {}) });
                attempt.current = null;
                const current = await orderRequest(null, { id: orderId }); setOrders((items) => items.map((item) => item.id === orderId ? current.order : item));
                onSent?.(current.order);
                return result;
              }, "order");
            }}>{recovering ? "Cập nhật trạng thái gửi" : lockedOrder ? "Gửi email cho khách" : "Gửi cho đơn đã chọn"}</button>{!lockedOrder && <><button type="button" className="admin-btn" onClick={() => perform(async () => { const page = await orderRequest(); setOrders(page.orders); setCursor(page.nextCursor); setOrderError(""); })}>Tải lại đơn</button>{cursor && <button type="button" className="admin-btn" onClick={() => perform(async () => { const page = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...page.orders].map((item) => [item.id, item])).values()]); setCursor(page.nextCursor); })}>Tải thêm đơn</button>}</>}</div>
          </div>}

          {request && <details className="writer-test"><summary>Gửi thử tới email của bạn</summary><form className="writer-block admin-form" aria-busy={localBusy && busyAction === "test"} onSubmit={(event) => {
            event.preventDefault();
            perform(() => request({ action: "sendTest", subject: value.subject, text: value.text, testEmail, mailType: mode === "order_auto" ? "order" : mode === "welcome_auto" ? "registration" : "private", ...(mode === "order_auto" && orderId ? { orderId } : {}) }), "test");
          }}><div className="admin-field"><label htmlFor={`${fieldId}-writer-test-email`}>Email nhận thư thử</label><input id={`${fieldId}-writer-test-email`} type="email" required maxLength={254} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /></div><p className="admin-muted">Chỉ gửi tới email thử này.</p><button className="admin-btn" aria-busy={localBusy && busyAction === "test"} disabled={!valid}>Gửi thử</button></form></details>}
        </div>
      </div>
    </fieldset>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
