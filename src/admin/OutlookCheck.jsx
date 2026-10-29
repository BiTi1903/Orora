import { useState } from "react";
const OUTLOOK_LABELS = { untracked: "Thư cũ chưa có mã đối chiếu", sent_item: "Đã gửi", bounced: "Có thư báo trả lại (NDR)", delayed: "Có thư báo gửi chậm", not_found: "Chưa tìm thấy bằng mã đối chiếu" };
export default function OutlookCheck({ outlook, check, label = "thư này" }) {
  const [saved, setSaved] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const result = saved && (!outlook || Date.parse(saved.checkedAt) >= Date.parse(outlook.checkedAt)) ? saved : outlook;
  return <div className="outlook-check"><span className={result?.state === "bounced" ? "outlook-bounced" : "admin-muted"}>{result ? OUTLOOK_LABELS[result.state] || "Chưa rõ" : "Chưa kiểm tra"}{result?.diagnosticCode ? ` · ${result.diagnosticCode}` : ""}</span>
    {result?.checkedAt && <small>Kiểm tra: {new Date(result.checkedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small>}
    {result?.scanLimited && <small>Chỉ kiểm tra trong phạm vi thư gần đây.</small>}
    <button type="button" className="admin-btn" disabled={busy} aria-label={`Kiểm tra: ${label}`} onClick={async () => { setBusy(true); setError(""); try { const data = await check(); setSaved(data.outlook); } catch (cause) { setError(cause.message); } finally { setBusy(false); } }}>{busy ? "Đang kiểm tra…" : "Kiểm tra"}</button>
    {result?.webLink && <a href={result.webLink} target="_blank" rel="noreferrer">Mở thư trong Outlook</a>}
    {error && <p className="outlook-check-error" role="alert">{error}</p>}
  </div>;
}
