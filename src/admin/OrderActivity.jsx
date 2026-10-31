import { mailActorLabel } from "../lib/mail-templates";
const inventory = { deducted: "Đã xuất kho", restocked: "Đã hoàn kho", legacy_paid: "Đơn cũ đã xử lý kho" };
const payment = { paid: "Đã thanh toán", unpaid: "Chưa thanh toán" };
const fields = { status: "Trạng thái đơn", paymentStatus: "Thanh toán", inventory: "Tồn kho" };
export default function OrderActivity({ activities = [], loading, nextCursor, onMore, onReload, statuses }) {
  const label = (field, value) => (field === "status" ? statuses[value] : field === "paymentStatus" ? payment[value] : inventory[value]) || value || "Chưa ghi nhận";
  return <section className="order-activity"><div className="admin-top"><div><h3>Nhật ký xử lý đơn</h3><p className="admin-muted">Ghi nhận tài khoản và thay đổi tại thời điểm thao tác. Email được lưu ở mục Email của đơn.</p></div><button type="button" className="admin-btn" disabled={loading} onClick={onReload}>Tải lại nhật ký</button></div>
    {loading && <p className="admin-muted" role="status">Đang tải nhật ký…</p>}
    {!loading && !activities.length && <p className="admin-muted">Chưa có nhật ký xử lý. Các thao tác từ phiên bản này sẽ được ghi nhận; lịch sử cũ không được tạo lại.</p>}
    <ol className="order-activity-list">{activities.map((event) => <li key={event.id}><div className="order-activity-heading"><strong>{event.action === "stock_returned" ? "Xác nhận nhận hàng trả & hoàn kho" : "Cập nhật đơn hàng"}</strong><time dateTime={new Date(event.createdAt).toISOString()}>{new Date(event.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</time></div><p>{mailActorLabel(event)}</p><ul>{Object.entries(event.changes || {}).map(([field, change]) => <li key={field}>{fields[field] || field}: <span>{label(field, change.before)}</span> → <strong>{label(field, change.after)}</strong></li>)}</ul>{event.quantity != null && <p>Số lượng: {event.quantity}</p>}</li>)}</ol>
    {nextCursor && <button type="button" className="admin-btn" disabled={loading} onClick={onMore}>Tải thêm nhật ký</button>}
  </section>;
}
