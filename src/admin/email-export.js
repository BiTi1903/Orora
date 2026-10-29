import { mailActorLabel } from "../lib/mail-templates.js";
const mailStates = { accepted: "MS đã nhận", pending: "Chưa gửi", sending: "Đang xử lý", failed: "Gửi lỗi", unknown: "Chưa rõ kết quả" };
const outlookStates = { sent_item: "Đã gửi", bounced: "Có thư báo trả lại (NDR)", delayed: "Có thư báo gửi chậm", not_found: "Chưa tìm thấy", untracked: "Chưa có mã đối chiếu" };
const date = (value) => value ? new Date(value).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "";
const outlook = (item) => item ? `${outlookStates[item.state] || "Chưa rõ"}${item.diagnosticCode ? ` · ${item.diagnosticCode}` : ""}` : "Chưa kiểm tra";
async function collect(fetchPage, field) {
  let cursor; const seen = new Set(); const items = new Map();
  do {
    const page = await fetchPage(cursor);
    if (!Array.isArray(page[field])) throw new Error("Dữ liệu xuất không đầy đủ. Vui lòng thử lại.");
    page[field].forEach((item) => items.set(item.id, item));
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Không tải đủ dữ liệu. Vui lòng thử xuất lại.");
    if (cursor) seen.add(cursor);
  } while (cursor);
  return [...items.values()];
}
export async function buildEmailExport(kind, { request, orderRequest }) {
  if (kind === "contacts") {
    const contacts = await collect((cursor) => request(null, cursor ? { cursor } : {}), "contacts");
    return { name: "email-dang-ky", headers: ["Email", "Trạng thái đăng ký", "Thư tự động", "Kiểm tra", "Ngày đăng ký"], rows: contacts.map((item) => [item.email, { active: "Hoạt động", paused: "Tạm ngưng", unsubscribed: "Đã hủy đăng ký" }[item.status] || item.status, mailStates[item.mailStatus] || "Chưa gửi", outlook(item.outlook), date(item.createdAt)]) };
  }
  if (kind === "orders") {
    const mails = await collect((cursor) => orderRequest(null, { mailHistory: "1", ...(cursor ? { cursor } : {}) }), "mails");
    return { name: "thu-don-hang-da-gui", headers: ["Mã đơn", "ID đơn", "Tên khách", "Email", "Cách gửi", "Tài khoản thao tác", "Ngày gửi", "Tiêu đề", "Nội dung", "Mẫu lúc gửi", "Phiên bản", "Kết quả gửi", "Kiểm tra", "Mã lỗi", "Chi tiết lỗi"], rows: mails.map((item) => [item.orderCode, item.orderId, item.customerName, item.recipient, item.manual ? "Gửi bởi tài khoản" : "Tự động khi đặt hàng", mailActorLabel(item), date(item.createdAt), item.subject, item.text, item.templateName, item.templateRevision || "", mailStates[item.state] || item.state, outlook(item.outlook), item.errorCode, item.errorMessage]) };
  }
  if (kind !== "sent") throw new Error("Chọn danh sách cần xuất.");
  const campaigns = await collect((cursor) => request(null, { campaignHistory: "1", ...(cursor ? { cursor } : {}) }), "campaigns");
  const rows = [];
  for (const campaign of campaigns) {
    const deliveries = await collect((cursor) => request({ action: "campaignDeliveryStatuses", id: campaign.id, ...(cursor ? { cursor } : {}) }), "deliveries");
    deliveries.forEach((item) => rows.push([campaign.id, item.email, campaign.subject, campaign.text, campaign.templateName, campaign.templateRevision || "", mailActorLabel(campaign), date(campaign.createdAt), mailStates[item.status] || item.status, outlook(item.outlook), item.errorCode, item.errorMessage]));
  }
  return { name: "thu-da-gui", headers: ["ID thư", "Email người nhận", "Tiêu đề", "Nội dung", "Mẫu lúc gửi", "Phiên bản", "Tài khoản thao tác", "Ngày tạo thư", "Kết quả gửi", "Kiểm tra", "Mã lỗi", "Chi tiết lỗi"], rows };
}
export function excelCells({ headers, rows }) {
  return [headers.map((value) => ({ type: String, value, fontWeight: "bold" })), ...rows.map((row) => row.map((value) => ({ type: String, value: String(value ?? "") })))];
}
