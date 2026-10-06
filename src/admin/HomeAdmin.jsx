import { useState } from "react";

/* Tự nạp mọi file Edit*.jsx nằm bất kỳ đâu trong src/admin (kể cả thư mục con như home, Home...)
   → tạo thêm file mới thì mục đó tự xuất hiện, thiếu file cũng không bị lỗi */
const modules = import.meta.glob("./**/Edit*.jsx", { eager: true });

/* tên file → [nhãn hiển thị, thứ tự] */
const META = {
  edithero: ["Hero", 1],
  editticker: ["Dải chữ chạy", 2],
  editfeatures: ["Lý do chọn", 3],
  editstory: ["Câu chuyện", 4],
  editsteps: ["Quy trình", 5],
  editreviews: ["Cảm nhận", 6],
  editnewsletter: ["Nhận tin", 7],
  editfooter: ["Footer", 8],
};

const SECTIONS = Object.entries(modules)
  .map(([path, mod]) => {
    const name = path.split("/").pop().replace(".jsx", "");
    const [label, order] = META[name.toLowerCase()] || [name, 99];
    return { key: name, label, order, Component: mod.default };
  })
  .filter((s) => typeof s.Component === "function")
  .sort((a, b) => a.order - b.order);

export default function HomeAdmin() {
  const [tab, setTab] = useState(SECTIONS[0]?.key);
  const Active = SECTIONS.find((s) => s.key === tab)?.Component;

  return (
    <section>
      <h1>Trang chủ</h1>
      <p className="admin-muted">Chọn từng phần để chỉnh sửa. Mỗi phần có nút lưu riêng.</p>

      {SECTIONS.length === 0 && (
        <div className="admin-card" style={{ marginTop: 20 }}>
          <p className="admin-muted">
            Chưa tìm thấy file nào có tên dạng <code>Edit*.jsx</code> (ví dụ <code>EditHero.jsx</code>) trong
            thư mục <code>src/admin</code>. Hãy kiểm tra tên file, đuôi <code>.jsx</code> và vị trí
            <code> src/admin/home/</code>, rồi khởi động lại <code>npm run dev</code>.
          </p>
        </div>
      )}

      <div className="admin-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`admin-tab ${tab === s.key ? "active" : ""}`}
            onClick={() => setTab(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {Active && <Active key={tab} />}
    </section>
  );
}