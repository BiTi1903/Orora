import { useEffect, useRef, useState } from "react";
import { orderRequest, MAIL_STATES } from "./order-api";
export default function OrderEmailSender({ reuseTemplate, onChooseTemplate }) {
  const attempt = useRef(null);
  const panel = useRef(null);
  useEffect(() => { if (reuseTemplate?.id) panel.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [reuseTemplate?.id]);
  const [edit, setEdit] = useState(null);
  const source = reuseTemplate?.id || null;
  const message = edit?.source === source ? edit.message : reuseTemplate?.message || { subject: "", text: "" };
  const setMessage = (value) => { const content = value ? { subject: value.subject, text: value.text } : null; setEdit({ source, message: content }); attempt.current = null; };
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => { let alive = true; orderRequest().then((data) => { if (alive) { setOrders(data.orders); setCursor(data.nextCursor); } }).catch((error) => { if (alive) setNotice({ error: true, text: error.message }); }); return () => { alive = false; }; }, []);
  const perform = async (work) => { if (busy) return; setBusy(true); setNotice(null); try { await work(); } catch (error) { setNotice({ error: true, text: error.message }); } finally { setBusy(false); } };
  const selected = orders.find((order) => order.id === id);
  return <div className="admin-card admin-form" ref={panel}>
    <h2>Gửi thư đơn hàng</h2><p className="admin-muted">Gửi riêng cho email lưu trong đơn. Nội dung gửi riêng không thay đổi mẫu tự động.</p>
    <div className="admin-field"><label htmlFor="order-mail-selected">Đơn nhận thư</label><select id="order-mail-selected" className="mail-template-select" disabled={busy} value={id} onChange={(event) => { setId(event.target.value); attempt.current = null; }}><option value="">Chọn đơn hàng</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.code} · {order.customer.name} · {order.customer.email || "Chưa có email"}</option>)}</select></div>
    {selected && <p className="admin-muted">Người nhận: <strong>{selected.customer.email || "Đơn cũ chưa có email."}</strong> · {MAIL_STATES[selected.confirmationMail?.state] || "Chưa có lịch sử"}</p>}
    <div className="admin-actions"><button type="button" className="admin-btn" disabled={busy} onClick={onChooseTemplate}>Chọn mẫu thư đơn hàng</button></div>
    {message ? <div className="admin-form order-mail-custom"><h3>Nội dung gửi riêng</h3><div className="admin-field"><label htmlFor="manual-order-subject">Tiêu đề gửi riêng</label><input id="manual-order-subject" maxLength={200} disabled={busy} value={message.subject} onChange={(event) => setMessage({ ...message, subject: event.target.value })} /></div><div className="admin-field"><label htmlFor="manual-order-text">Nội dung gửi riêng</label><textarea id="manual-order-text" rows={10} maxLength={20000} disabled={busy} value={message.text} onChange={(event) => setMessage({ ...message, text: event.target.value })} /></div></div> : null}
    <div className="admin-actions"><button className="admin-btn primary" type="button" disabled={busy || (message && (!message.subject.trim() || !message.text.trim())) || !selected?.customer.email || ['sending','unknown'].includes(selected?.confirmationMail?.state)} onClick={() => {
      const confirmResend = selected.confirmationMail?.state === "accepted";
      if (confirmResend && !window.confirm(`Microsoft đã nhận thư trước đó của đơn ${selected.code}. Bạn vẫn muốn gửi lại?`)) return;
      perform(async () => {
        const signature = JSON.stringify({ id, message });
        if (!attempt.current || attempt.current.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
        const data = await orderRequest({ action: "sendOrderEmail", id, requestId: attempt.current.id, confirmResend, ...(message ? { message, ...(message.templateRef ? { templateRef: message.templateRef } : {}) } : {}) });
        attempt.current = null;
        const current = await orderRequest(null, { id }); setOrders((items) => items.map((item) => item.id === id ? current.order : item));
        setNotice({ error: ['failed','unknown'].includes(data.state), text: data.message });
      });
    }}>Gửi thư xác nhận đơn đã chọn</button><button className="admin-btn" type="button" disabled={busy} onClick={() => perform(async () => { const page = await orderRequest(); setOrders(page.orders); setCursor(page.nextCursor); setId(""); attempt.current = null; })}>Tải lại đơn hàng</button></div>
    {cursor && <button type="button" className="admin-btn" disabled={busy} onClick={() => perform(async () => { const page = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...page.orders].map((item) => [item.id, item])).values()]); setCursor(page.nextCursor); })}>Tải thêm đơn hàng</button>}
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
