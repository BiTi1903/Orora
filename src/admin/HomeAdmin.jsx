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
  const [formOpened,setFormOpened]=useState(false);
  const [visitedForms,setVisitedForms]=useState(SECTIONS[0]?[SECTIONS[0].key]:[]);
  const chooseForm=key=>{setVisitedForms(current=>current.includes(key)?current:[...current,key]);setTab(key);};


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
            aria-pressed={mode === "builder"} className={mode === "builder" ? "active" : ""}
            onClick={() => setMode("builder")}
          >
            ✦ Visual Builder
          </button>

          <button
            type="button"
            aria-pressed={mode === "form"} className={mode === "form" ? "active" : ""}
            onClick={() => {setFormOpened(true);setMode("form");}}
          >
            ☷ Form cũ
          </button>
        </div>
      </div>

      <div className="home-builder-panel" hidden={mode !== "builder"}><VisualBuilder /></div>
      {formOpened && <div hidden={mode !== "form"}><LegacyForms tab={tab} setTab={chooseForm} visitedForms={visitedForms}/></div>}

    </section>
  );
}

function LegacyForms({ tab, setTab, visitedForms }) {
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
            aria-pressed={tab === s.key}
            onClick={() => setTab(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {SECTIONS.filter(section=>visitedForms.includes(section.key)).map(({key,Component})=><div hidden={tab!==key} key={key}><Component /></div>)}
    </>
  );
}