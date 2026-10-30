import { useEffect, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";
import { orderRequest, MAIL_STATES } from "./order-api";

export default function MailWriter({ mode, onModeChange, value, onChange, onChooseTemplate, request, onApply, onSendPrivate, privateRecipients, privateSendLabel, privateSendDisabled, disabled }) {
  const [localBusy, setLocalBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [testEmail, setTestEmail] = useState(() => auth?.currentUser?.email || "");
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [orderId, setOrderId] = useState("");
  const [orderError, setOrderError] = useState("");
  const attempt = useRef(null);
  const working = disabled || localBusy;
  const valid = Boolean(value.subject.trim() && value.text.trim());
  const selectedOrder = orders.find((order) => order.id === orderId);
  useEffect(() => {
    if (mode !== "order_auto") return;
    let alive = true;
    orderRequest().then((page) => { if (alive) { setOrders(page.orders); setCursor(page.nextCursor); setOrderError(""); } }).catch((error) => { if (alive) setOrderError(error.message); });
    return () => { alive = false; };
  }, [mode]);
  const perform = async (work) => {
    if (working) return;
    setLocalBusy(true); setNotice(null);
    try { const result = await work(); if (result?.message) setNotice({ error: ["failed", "unknown"].includes(result.state), text: result.message }); }
    catch (error) { setNotice({ error: true, text: error.message }); }
    finally { setLocalBusy(false); }
  };
  return <div className="admin-card admin-form">
    <h2>Viết Thư</h2>
    <fieldset className="writer-fields" disabled={working}>
      <div className="admin-field"><label htmlFor="writer-mode">Loại thư muốn viết</label><select id="writer-mode" className="mail-template-select" value={mode} onChange={(event) => { onModeChange(event.target.value); setNotice(null); }}><option value="welcome_auto">Thư Đăng Ký</option><option value="order_auto">Thư Đơn Hàng</option><option value="private">Gửi riêng</option></select></div>
      <div className="admin-actions"><button type="button" className="admin-btn" onClick={onChooseTemplate}>Chọn mẫu từ Mẫu Thư</button></div>
      <div className="admin-field"><label htmlFor="writer-subject">Tiêu đề thư</label><input id="writer-subject" required maxLength={200} value={value.subject} onChange={(event) => onChange({ subject: event.target.value, text: value.text })} /></div>
      <div className="admin-field"><label htmlFor="writer-text">Nội dung thư</label><textarea id="writer-text" required rows={12} maxLength={20000} value={value.text} onChange={(event) => onChange({ subject: value.subject, text: event.target.value })} /></div>
      {mode === "order_auto" && <p className="admin-muted">{"Thư được gửi đúng nội dung mẫu đang soạn, không tự thêm đoạn khác. Có thể dùng {{shippingFee}}, {{totalAmount}}, {{note}}, {{createdAt}} và {{paymentStatus}} để đặt vị trí hiển thị."}</p>}
      {mode !== "private" && <div><button type="button" className="admin-btn primary" disabled={!valid} onClick={() => perform(() => onApply(mode, value))}>Lưu làm thư {mode === "order_auto" ? "đơn hàng" : "đăng ký"} tự động</button><p className="admin-muted">Lưu chỉ áp dụng cho các lần gửi tự động mới. Gửi thử hoặc gửi cho một đơn không thay đổi cấu hình tự động.</p></div>}
      {mode === "private" && <div className="admin-form">{privateRecipients}<button type="button" className="admin-btn primary" disabled={!valid || privateSendDisabled} onClick={() => perform(() => onSendPrivate(value))}>{privateSendLabel}</button></div>}
      {mode === "order_auto" && <div className="writer-block admin-form"><h3>Gửi cho đơn hàng</h3>
        {orderError && <p className="admin-error" role="alert">{orderError}</p>}
        <div className="admin-field"><label htmlFor="writer-order">Chọn đơn hàng</label><select id="writer-order" className="mail-template-select" value={orderId} onChange={(event) => { setOrderId(event.target.value); attempt.current = null; }}><option value="">Chưa chọn đơn</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.code} · {order.customer.name} · {order.customer.email || "Chưa có email"}</option>)}</select></div>
        {selectedOrder && <p>Người nhận của đơn: <strong>{selectedOrder.customer.email || "Chưa có email"}</strong> · {MAIL_STATES[selectedOrder.confirmationMail?.state] || "Chưa có lịch sử"}</p>}
        <div className="admin-actions"><button type="button" className="admin-btn primary" disabled={!valid || !selectedOrder?.customer.email || ["sending", "unknown"].includes(selectedOrder?.confirmationMail?.state)} onClick={() => {
          const confirmResend = selectedOrder.confirmationMail?.state === "accepted";
          if (!window.confirm(`Gửi nội dung đang soạn cho ${selectedOrder.customer.email}, đơn ${selectedOrder.code}?${confirmResend ? " MS đã nhận thư trước đó của đơn này; đây là lần gửi thêm." : ""}`)) return;
          perform(async () => {
            const signature = JSON.stringify({ orderId, value });
            if (attempt.current?.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
            const result = await orderRequest({ action: "sendOrderEmail", id: orderId, requestId: attempt.current.id, confirmResend, message: { subject: value.subject, text: value.text }, ...(value.templateRef ? { templateRef: value.templateRef } : {}) });
            attempt.current = null;
            const current = await orderRequest(null, { id: orderId }); setOrders((items) => items.map((item) => item.id === orderId ? current.order : item));
            return result;
          });
        }}>Gửi cho đơn đã chọn</button><button type="button" className="admin-btn" onClick={() => perform(async () => { const page = await orderRequest(); setOrders(page.orders); setCursor(page.nextCursor); setOrderError(""); })}>Tải lại đơn</button>{cursor && <button type="button" className="admin-btn" onClick={() => perform(async () => { const page = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...page.orders].map((item) => [item.id, item])).values()]); setCursor(page.nextCursor); })}>Tải thêm đơn</button>}</div>
      </div>}
      <form className="writer-block admin-form" onSubmit={(event) => {
        event.preventDefault();
        perform(() => request({ action: "sendTest", subject: value.subject, text: value.text, testEmail, mailType: mode === "order_auto" ? "order" : mode === "welcome_auto" ? "registration" : "private", ...(mode === "order_auto" && orderId ? { orderId } : {}) }));
      }}><h3>Gửi thử nội dung đang soạn</h3><div className="admin-field"><label htmlFor="writer-test-email">Email nhận thư thử</label><input id="writer-test-email" type="email" required maxLength={254} value={testEmail} onChange={(event) => setTestEmail(event.target.value)} /></div><p className="admin-muted">Chỉ gửi tới email thử này, không gửi tới danh sách khách hay email của đơn.{mode === "order_auto" ? " Biến được điền từ đơn đã chọn; nếu chưa chọn đơn, dùng dữ liệu minh họa." : ""}</p><button className="admin-btn" disabled={!valid}>Gửi thử</button></form>
    </fieldset>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
