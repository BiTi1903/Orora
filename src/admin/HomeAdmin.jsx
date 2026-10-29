import { useState } from "react";
import VisualBuilder from "./builder/VisualBuilder";

/* Form cũ vẫn được giữ lại */
const modules = import.meta.glob("./**/Edit*.jsx", { eager: true });

const META = {
  edithero: ["Hero", 1],
  editticker: ["Dải chữ chạy", 2],
  editfeatures: ["Lý do chọn", 3],
  editstory: ["Câu chuyện", 4],
  editcollection: ["Khám phá", 4.2],
  editproductcard: ["Thẻ sản phẩm", 4.4],
  editproductdetail: ["Chi tiết sản phẩm", 4.6],
  editphilosophy: ["Triết lý", 4.8],
  editsteps: ["Quy trình", 5],
  editreviews: ["Cảm nhận", 6],
  editnewletter: ["Nhận tin", 7],
  editnewsletter: ["Nhận tin", 7],
  editfooter: ["Footer", 8],
};

const SECTIONS = Object.entries(modules)
  .map(([path, mod]) => {
    const name = path.split("/").pop().replace(".jsx", "");
    const [label, order] =
      META[name.toLowerCase()] || [name, 99];

    return {
      key: name,
      label,
      order,
      Component: mod.default,
    };
  })
  .filter((s) => typeof s.Component === "function")
  .sort((a, b) => a.order - b.order);

export default function HomeAdmin() {
  const [mode, setMode] = useState("builder");
  const [tab, setTab] = useState(SECTIONS[0]?.key);

  const Active = SECTIONS.find(
    (s) => s.key === tab
  )?.Component;

  return (
    <section className="home-admin">
      <div className="home-admin-top">
        <div>
          <h1>Trang chủ</h1>
          <p className="admin-muted">
            Chỉnh sửa giao diện trực quan và xem trước ngay trên trang.
          </p>
        </div>

        <div className="home-admin-mode">
          <button
            type="button"
            className={mode === "builder" ? "active" : ""}
            onClick={() => setMode("builder")}
          >
            ✦ Visual Builder
          </button>

          <button
            type="button"
            className={mode === "form" ? "active" : ""}
            onClick={() => setMode("form")}
          >
            ☷ Form cũ
          </button>
        </div>
      </div>

      {mode === "builder" ? (
        <VisualBuilder />
      ) : (
        <LegacyForms
          tab={tab}
          setTab={setTab}
          Active={Active}
        />
      )}
    </section>
  );
}

function LegacyForms({ tab, setTab, Active }) {
  return (
    <>
      {SECTIONS.length === 0 && (
        <div
          className="admin-card"
          style={{ marginTop: 20 }}
        >
          <p className="admin-muted">
            Chưa tìm thấy file nào có tên dạng{" "}
            <code>Edit*.jsx</code>.
          </p>
        </div>
      )}

      <div className="admin-tabs">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`admin-tab ${
              tab === s.key ? "active" : ""
            }`}
            onClick={() => setTab(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {Active && <Active key={tab} />}
    </>
  );
}