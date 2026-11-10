import { useState } from "react";
import { orderRequest } from "./order-api";
import { buildEmailExport, excelCells } from "./email-export";
export default function EmailExport({ request }) {
  const [kind, setKind] = useState(""); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(null);
  return <section><div className="admin-top"><h1>Xuất Excel</h1></div><div aria-busy={busy} className="admin-card admin-form">
    <div className="admin-field"><label htmlFor="email-export-kind">Danh sách cần xuất</label><select id="email-export-kind" value={kind} disabled={busy} onChange={(event) => { setKind(event.target.value); setNotice(null); }}><option value="">Chọn danh sách</option><option value="contacts">Email đã đăng ký</option><option value="sent">Thư đã gửi</option><option value="orders">Thư đơn hàng đã gửi</option></select></div>
    <p className="admin-muted">Xuất toàn bộ danh sách đã chọn, gồm các trang chưa tải trên màn hình. Thư đã gửi ghi từng người nhận và kết quả xử lý; thư đơn hàng gồm cả tự động và gửi riêng. Trạng thái kiểm tra lấy từ kết quả đã lưu, không gọi Outlook lại.</p>
    <div><button type="button" className="admin-btn primary" aria-busy={busy} disabled={!kind || busy} onClick={async () => {
      setBusy(true); setNotice(null);
      try {
        const result = await buildEmailExport(kind, { request, orderRequest });
        if (!result.rows.length) { setNotice({ text: "Không có dữ liệu để xuất." }); return; }
        const { default: writeXlsxFile } = await import("write-excel-file/browser");
        await writeXlsxFile(excelCells(result), { columns: result.headers.map((header) => ({ width: header === "Nội dung" ? 70 : 28 })) }).toFile(`ORORA-${result.name}-${new Date().toISOString().slice(0, 10)}.xlsx`);
        setNotice({ text: `Đã xuất ${result.rows.length} dòng ra Excel.` });
      } catch (error) { setNotice({ error: true, text: error.message || "Chưa xuất được dữ liệu. Vui lòng thử lại." }); }
      finally { setBusy(false); }
    }}>{busy ? "Đang tải và xuất…" : "Tải file Excel"}</button></div>
    {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
  </div></section>;
}
