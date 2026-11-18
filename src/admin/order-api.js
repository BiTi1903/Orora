import { auth } from "../lib/firebaseAuth";
export async function orderRequest(body, params = {}, { signal } = {}) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/admin-orders${query ? `?${query}` : ""}`, { signal, method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  let data;
  try { data = await response.json(); } catch { throw new Error("Chưa kết nối được API đơn hàng. Kiểm tra deployment Vercel."); }
  if (!response.ok) throw Object.assign(new Error(data.message || "Chưa xử lý được đơn hàng."), { status: response.status });
  return data;
}
export const MAIL_STATES = { pending: "Chưa gửi", sending: "Đang xử lý", stuck: "Kẹt quá 5 phút, cần kiểm tra Outlook rồi gửi lại", accepted: "Đã nhận", failed: "Gửi lỗi", unknown: "Chưa rõ kết quả" };
