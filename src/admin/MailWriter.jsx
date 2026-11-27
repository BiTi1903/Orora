import { orderTrackingMail, trackingTemplate } from "../lib/order-tracking-mail.js";
import MailHtmlEditor from "./MailHtmlEditor";
import MailBodyBlocks from "./MailBodyBlocks";
import MailDesignFields from "./MailDesignFields";
import { useConfirm } from "./confirm-context";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { auth } from "../lib/firebaseAuth";
import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "../lib/commerce";
import { orderProductName } from "../lib/product-options";
import { effectiveMailState } from "../lib/mail-state";
import { renderBrandedEmailHtml, renderOrderEmailHtml, renderWelcomeEmailHtml } from "../lib/mail-html";
import { sectionIsEnabled } from "../lib/page-sections";
import * as api from "../lib/api";
import { orderRequest, MAIL_STATES } from "./order-api";

const STANDARD_WELCOME_DRAFT = {
  subject: "Chào mừng bạn đến với ORORA – Hành trình nâng niu làn da",
  text: "Chào bạn,\n\nCảm ơn bạn đã đăng ký nhận bản tin từ ORORA. Chúng mình rất vui được đồng hành cùng bạn trên hành trình chăm sóc làn da dịu nhẹ và tinh tế mỗi ngày.\n\nKhi là thành viên nhận tin từ ORORA, bạn sẽ nhận được:\n- Thông tin sớm nhất về các dòng sản phẩm chăm sóc da mới ra mắt\n- Ưu đãi và quà tặng dành riêng cho người đăng ký\n- Gợi ý chu trình dưỡng da và hướng dẫn chăm sóc phù hợp\n\nNếu bạn cần tư vấn chọn sản phẩm phù hợp với làn da của mình, chỉ cần trả lời trực tiếp email này — đội ngũ ORORA luôn sẵn sàng lắng nghe.\n\nThân mến,\nORORA Vietnam\nsales@ororavn.com",
};

const STANDARD_ORDER_DRAFT = {
  subject: "ORORA xác nhận đã tiếp nhận đơn hàng {{orderCode}}",
  text: "Chào {{customerName}},\n\nCảm ơn bạn đã tin chọn ORORA. Đơn hàng {{orderCode}} của bạn đã được hệ thống tiếp nhận thành công.\n\nTHÔNG TIN ĐƠN HÀNG\n- Sản phẩm: {{productName}}\n- Số lượng: {{quantity}}\n- Tạm tính: {{subtotal}}\n- Phí giao hàng: {{shippingFee}}\n- Tổng thanh toán dự kiến: {{totalAmount}}\n- Thanh toán: {{paymentMethod}} ({{paymentStatus}})\n- Người nhận: {{customerName}} · {{phone}}\n- Địa chỉ giao hàng: {{address}}\n\n{{trackingInstructions}}\n\nBƯỚC TIẾP THEO\n- Đội ngũ ORORA sẽ liên hệ xác nhận đơn hàng, phí giao hàng và thời gian giao dự kiến.\n- Email này xác nhận đã tiếp nhận yêu cầu đặt hàng, chưa xác nhận thanh toán.\n- Nếu cần điều chỉnh thông tin hoặc hỗ trợ nhanh, bạn chỉ cần trả lời trực tiếp email này kèm mã đơn {{orderCode}}.\n\nTrân trọng,\nORORA Vietnam\nsales@ororavn.com",
};

const SAMPLE_PREVIEW_ORDER = {
  code: "OW_1024C",
  customer: {
    name: "Nguyễn Minh Anh",
    email: "khachhang@example.com",
    phone: "0901234567",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    note: "Giao giờ hành chính giúp mình nhé.",
  },
  product: { name: "Gel dưỡng ORORA", variantLabel: "100 ml", unitPrice: 250000, priceText: "250000" },
  quantity: 1,
  subtotal: 250000,
  shippingFee: 30000,
  totalAmount: 280000,
  paymentMethod: "cod",
  paymentStatus: "unpaid",
  trackingCode: "",
  createdAt: new Date().toISOString(),
};

const ORDER_QUICK_TOKENS = [
  ["{{customerName}}", "Tên khách"],
  ["{{orderCode}}", "Mã đơn"],
  ["{{productName}}", "Sản phẩm"],
  ["{{variantLabel}}", "Dung tích"],
  ["{{quantity}}", "Số lượng"],
  ["{{unitPrice}}", "Đơn giá"],
  ["{{subtotal}}", "Tạm tính"],
  ["{{shippingFee}}", "Phí ship"],
  ["{{totalAmount}}", "Tổng tiền"],
  ["{{paymentMethod}}", "Thanh toán"],
  ["{{paymentStatus}}", "TT thanh toán"],
  ["{{address}}", "Địa chỉ"],
  ["{{phone}}", "SĐT"],
  ["{{email}}", "Email"],
  ["{{note}}", "Ghi chú"],
  ["{{createdAt}}", "Ngày đặt"],
  ["{{trackingInstructions}}", "Hướng dẫn theo trạng thái tra cứu"],
  ["{{trackingUrl}}", "Link tra cứu"],
  ["{{trackingCode}}", "Mã vận đơn"],
];

function previewOrderVariables(text, order, tracking) {
  if (!text) return "";
  const multiProductSummary = Array.isArray(order?.items) && order.items.length > 1
    ? order.items.map((item) => `${orderProductName(item)} × ${item.quantity}`).join("; ")
    : order?.product
      ? orderProductName(order.product)
      : "Gel dưỡng ORORA 100ml";
  const unitPriceFormatted = order?.product
    ? (order.product.unitPrice == null ? formatProductPrice(order.product.priceText) || "ORORA sẽ báo giá" : formatVnd(order.product.unitPrice))
    : "250.000 đ";
  const totalFormatted = order ? (order.totalAmount == null ? "ORORA sẽ xác nhận" : formatVnd(order.totalAmount)) : "280.000 đ";
  const createdAtFormatted = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
    : new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const map = {
    "{{customerName}}": order?.customer?.name || "Nguyễn Minh Anh",
    "{{orderCode}}": order?.code || "OW_1024C",
    "{{productName}}": multiProductSummary,
    "{{variantLabel}}": order?.product?.variantLabel || "100 ml",
    "{{quantity}}": String(order?.quantity ?? 1),
    "{{unitPrice}}": unitPriceFormatted,
    "{{subtotal}}": order ? (order.subtotal == null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal)) : "250.000 đ",
    "{{shippingFee}}": order ? (order.shippingFee == null ? "ORORA sẽ xác nhận" : formatVnd(order.shippingFee)) : "30.000 đ",
    "{{totalAmount}}": totalFormatted,
    "{{total}}": totalFormatted,
    "{{paymentMethod}}": PAYMENT_LABELS[order?.paymentMethod] || "Thanh toán khi nhận hàng (COD)",
    "{{paymentStatus}}": order?.paymentStatus === "paid" ? "Đã thanh toán" : "Chưa thanh toán",
    "{{address}}": order?.customer?.address || "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    "{{phone}}": order?.customer?.phone || "0901234567",
    "{{email}}": order?.customer?.email || "khachhang@example.com",
    "{{note}}": order?.customer?.note || "Không có",
    "{{createdAt}}": createdAtFormatted,
    "{{trackingUrl}}": tracking.url,
    "{{trackingInstructions}}": tracking.instructions,
    "{{trackingCode}}": order?.trackingCode || "",
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
  const [previewMode, setPreviewMode] = useState("desktop");
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
      });
    }
    if (mode === "welcome_auto") {
      return renderWelcomeEmailHtml({
        design: value.design, subject: previewSubject,
        text: previewText,
        unsubscribeUrl: `${siteOrigin}/api/unsubscribe?id=preview&token=preview`,
        siteOrigin,
      });
    }
    return renderBrandedEmailHtml({
      design: value.design, subject: previewSubject,
      text: previewText,
      unsubscribeUrl: `${siteOrigin}/api/unsubscribe?id=preview&token=preview`,
      siteOrigin,
    });
  }, [value.design, mode, previewSubject, previewText, selectedOrder, bankInfo, trackingEnabled, tracking.url]);

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
          {(onChooseTemplate || mode === "welcome_auto" || mode === "order_auto") && <div className="admin-actions">
            {onChooseTemplate && <button type="button" className="admin-btn" onClick={onChooseTemplate}>Chọn mẫu từ Mẫu Thư</button>}
            {(mode === "welcome_auto" || mode === "order_auto") && <button type="button" className="admin-btn" onClick={() => {
              onChange(mode === "order_auto" ? { ...STANDARD_ORDER_DRAFT } : { ...STANDARD_WELCOME_DRAFT });
              setNotice({ text: "Đã nạp nội dung mẫu chuẩn ORORA. Hãy xem trước rồi bấm Lưu để áp dụng." });
            }}>Nạp mẫu chuẩn ORORA</button>}
          </div>}
          <div className="admin-field"><label htmlFor={`${fieldId}-writer-subject`}>Tiêu đề thư</label><input ref={subjectRef} id={`${fieldId}-writer-subject`} required maxLength={200} value={value.subject} onFocus={() => { activeFieldRef.current = "subject"; }} onChange={(event) => onChange({ design: value.design, subject: event.target.value, text: value.text })} /></div>
          <div className="admin-field"><label htmlFor={`${fieldId}-writer-text`}>Nội dung thư</label><textarea ref={textRef} id={`${fieldId}-writer-text`} required rows={11} maxLength={20000} value={value.text} onFocus={() => { activeFieldRef.current = "text"; }} onChange={(event) => onChange({ design: value.design, subject: value.subject, text: event.target.value })} /></div>
          {mode === "order_auto" && <div className="admin-detail-box">
            <h3>Chèn nhanh thông tin đơn hàng (tại vị trí con trỏ)</h3>
            <div className="mail-token-bar">
              {ORDER_QUICK_TOKENS.map(([token, label]) => (
                <button type="button" className="mail-token-chip" key={token} title={token} onMouseDown={(e) => e.preventDefault()} onClick={() => insertToken(token)}>+ {label}</button>
              ))}
            </div>
          </div>}
          <MailHtmlEditor value={value.design} onChange={design => onChange({ subject: value.subject, text: value.text, design })} />
          <MailBodyBlocks text={value.text} onChange={text => onChange({ design: value.design, subject: value.subject, text })} />
          <MailDesignFields kind={mode} value={value.design} onChange={design => onChange({ subject: value.subject, text: value.text, design })} />
          <details className="admin-filter-panel" open>
            <summary>Xem trước email chuẩn gửi khách{mode === "order_auto" ? (selectedOrder ? ` (${selectedOrder.code})` : " (dữ liệu minh họa)") : ""}</summary>
            {mode === "order_auto" && <label>Tra cứu đơn trong bản xem trước
              <select value={previewTracking} onChange={event => setPreviewTracking(event.target.value)}>
                <option value="current">Theo cấu hình cửa hàng</option>
                <option value="on">Bật tra cứu</option>
                <option value="off">Tắt tra cứu</option>
              </select>
            </label>}
            <div className="mail-preview-toolbar">
              <button type="button" className={`admin-btn${previewMode === "desktop" ? " primary" : ""}`} onClick={() => setPreviewMode("desktop")}>HTML · Máy tính</button>
              <button type="button" className={`admin-btn${previewMode === "mobile" ? " primary" : ""}`} onClick={() => setPreviewMode("mobile")}>HTML · Điện thoại</button>
              <button type="button" className={`admin-btn${previewMode === "text" ? " primary" : ""}`} onClick={() => setPreviewMode("text")}>Văn bản thuần</button>
            </div>
            {previewMode === "text" ? (
              <div className="admin-detail-box" style={{ marginTop: 8 }}>
                <p><strong>Tiêu đề:</strong> {previewSubject}</p>
                <p style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{previewText}</p>
              </div>
            ) : (
              <div className={`mail-preview-stage${previewMode === "mobile" ? " is-mobile" : ""}`}>
                <iframe className="mail-preview-frame" sandbox="" title="Xem trước giao diện email ORORA" srcDoc={previewHtml} />
              </div>
            )}
          </details>
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
