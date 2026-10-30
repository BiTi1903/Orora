import { auth } from "../lib/firebaseAuth";
export async function newsletterRequest(body, cursor) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Vui lòng đăng nhập lại.");
  const params = new URLSearchParams(typeof cursor === "string" ? { cursor } : cursor || {}).toString();
  const response = await fetch(`/api/newsletter${params ? `?${params}` : ""}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data;
  try { data = await response.json(); } catch { throw new Error("Chưa kết nối được API email. Hãy triển khai trên Vercel theo docs/EMAIL-SETUP.md."); }
  if (!response.ok) throw new Error(data.message || "Chưa thực hiện được.");
  return data;
}

