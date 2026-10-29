import { useEffect, useRef, useState } from "react";
import { orderRequest, MAIL_STATES } from "./order-api";
export default function OrderEmailSettings({ initialTemplate, reuseTemplate, onSave }) {
  const attempt = useRef(null);
  const manualPanel = useRef(null);
  useEffect(() => { if (reuseTemplate?.id) manualPanel.current?.scrollIntoView({ block: "start", behavior: "smooth" }); }, [reuseTemplate?.id]);
  const [manualEdit, setManualEdit] = useState(null);
  const manualSource = reuseTemplate?.id || null;
  const manualTemplate = manualEdit?.source === manualSource ? manualEdit.message : reuseTemplate?.message || null;
  const editManual = (message) => { setManualEdit({ source: manualSource, message }); attempt.current = null; };
  const [template, setTemplate] = useState(initialTemplate || { subject: "", text: "" });
  const [orders, setOrders] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  useEffect(() => { let alive = true; orderRequest().then((data) => { if (alive) { setOrders(data.orders); setCursor(data.nextCursor); } }).catch((error) => { if (alive) setNotice({ error: true, text: error.message }); }); return () => { alive = false; }; }, []);
  const perform = async (work) => { if (busy) return; setBusy(true); setNotice(null); try { await work(); } catch (error) { setNotice({ error: true, text: error.message }); } finally { setBusy(false); } };
  const selected = orders.find((order) => order.id === id);
  return <div className="admin-card">
    <form className="admin-form" onSubmit={(event) => { event.preventDefault(); perform(async () => { const data = await onSave(template); setNotice({ text: data.message }); }); }}>
      <h2>Thư xác nhận đơn hàng</h2><p className="admin-muted">Tự động gửi tới email người mua sau khi nhận đơn. Mẫu này tách riêng khỏi thư đăng ký nhận tin.</p>
      <div className="admin-field"><label htmlFor="order-mail-subject">Tiêu đề thư đơn hàng</label><input id="order-mail-subject" required maxLength={200} value={template.subject} disabled={busy} onChange={(event) => setTemplate({ ...template, subject: event.target.value })} /></div>
      <div className="admin-field"><label htmlFor="order-mail-text">Nội dung thư đơn hàng</label><textarea id="order-mail-text" required rows={12} maxLength={20000} value={template.text} disabled={busy} onChange={(event) => setTemplate({ ...template, text: event.target.value })} /></div>
      <p className="admin-muted">Biến có thể dùng: {['customerName','orderCode','productName','quantity','subtotal','paymentMethod','address','phone','email'].map((name) => <code key={name}>{`{{${name}}} `}</code>)}</p>
      <button className="admin-btn" disabled={busy}>Lưu mẫu thư đơn hàng</button>
    </form>
    <div className="order-mail-manual"><h3>Gửi thư cho một đơn hàng</h3><p className="admin-muted">{manualTemplate ? "Dùng nội dung gửi riêng bên dưới; mẫu tự động không thay đổi." : "Dùng mẫu tự động đã lưu ở trên."} Danh sách tải 50 đơn mỗi lần; xem lịch sử từng lần gửi trong mục Đơn hàng.</p>
      <div className="admin-actions"><button className="admin-btn" type="button" disabled={busy} onClick={() => editManual({ subject: template.subject, text: template.text })}>Soạn nội dung gửi riêng</button>{manualTemplate && <button className="admin-btn" type="button" disabled={busy} onClick={() => editManual(null)}>Dùng mẫu tự động đã lưu</button>}</div>
      {manualTemplate && <div className="admin-form order-mail-custom" ref={manualPanel}><h4>Nội dung gửi riêng cho đơn đã chọn</h4><p className="admin-muted">Nội dung này chỉ dùng cho lần gửi riêng, không thay đổi thư tự động. Có thể dùng các biến thông tin đơn.</p><div className="admin-field"><label htmlFor="manual-order-subject">Tiêu đề gửi riêng</label><input id="manual-order-subject" maxLength={200} disabled={busy} value={manualTemplate.subject} onChange={(event) => editManual({ ...manualTemplate, subject: event.target.value })} /></div><div className="admin-field"><label htmlFor="manual-order-text">Nội dung gửi riêng</label><textarea id="manual-order-text" rows={8} maxLength={20000} disabled={busy} value={manualTemplate.text} onChange={(event) => editManual({ ...manualTemplate, text: event.target.value })} /></div></div>}
      <div className="admin-field"><label htmlFor="order-mail-selected">Đơn nhận thư</label><select id="order-mail-selected" disabled={busy} value={id} onChange={(event) => { setId(event.target.value); attempt.current = null; }}><option value="">Chọn đơn hàng</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.code} · {order.customer.name} · {order.customer.email || "Chưa có email"}</option>)}</select></div>
      {selected && <p className="admin-muted">{selected.customer.email || "Đơn cũ chưa có email."} · {MAIL_STATES[selected.confirmationMail?.state] || "Chưa có lịch sử"}</p>}
      <div className="admin-actions"><button className="admin-btn" type="button" disabled={busy || (manualTemplate && (!manualTemplate.subject.trim() || !manualTemplate.text.trim())) || !selected?.customer.email || ['sending','unknown'].includes(selected?.confirmationMail?.state)} onClick={() => {
        const confirmResend = selected.confirmationMail?.state === "accepted";
        if (confirmResend && !window.confirm(`Microsoft đã nhận thư trước đó của đơn ${selected.code}. Bạn vẫn muốn gửi lại?`)) return;
        perform(async () => {
          const signature = JSON.stringify({ id, message: manualTemplate });
          if (!attempt.current || attempt.current.signature !== signature) attempt.current = { signature, id: crypto.randomUUID() };
          const data = await orderRequest({ action: "sendOrderEmail", id, requestId: attempt.current.id, confirmResend, ...(manualTemplate ? { message: manualTemplate } : {}) });
          attempt.current = null;
          const current = await orderRequest(null, { id }); setOrders((items) => items.map((item) => item.id === id ? current.order : item));
          setNotice({ error: ['failed','unknown'].includes(data.state), text: data.message });
        });
      }}>Gửi thư xác nhận đơn đã chọn</button><button className="admin-btn" type="button" disabled={busy} onClick={() => perform(async () => { const page = await orderRequest(); setOrders(page.orders); setCursor(page.nextCursor); setId(""); attempt.current = null; })}>Tải lại đơn hàng</button></div>
      {cursor && <button type="button" className="admin-btn" disabled={busy} onClick={() => perform(async () => { const page = await orderRequest(null, { cursor }); setOrders((items) => [...new Map([...items, ...page.orders].map((item) => [item.id, item])).values()]); setCursor(page.nextCursor); })}>Tải thêm đơn hàng</button>}
    </div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div>;
}
