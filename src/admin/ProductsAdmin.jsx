import { useEffect, useState } from "react";
import { explainError, getProducts, removeProduct, saveProduct } from "../lib/api";
import ImageField from "./ImageField";

const empty = {
  id: "", number: "", name: "", slug: "", price: "", image: "",
  image2: "", image3: "", image4: "", image5: "", image6: "",
  description: "", story: "", material: "", size: "", color: "", origin: "",
  active: true,
};

const LONG = [
  ["description", "Mô tả ngắn"],
  ["story", "Câu chuyện sản phẩm"],
  ["material", "Chất liệu / thành phần"],
  ["size", "Kích thước / dung tích"],
  ["color", "Màu sắc"],
  ["origin", "Xuất xứ"],
];

const toSlug = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function ProductsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const say = (type, text) => setMessage({ type, text });

  const load = async () => {
    try {
      setItems(await getProducts());
    } catch (err) {
      say("error", explainError(err));
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startNew = () => {
    setForm({ ...empty, number: String(items.length + 1).padStart(2, "0") });
    setIsNew(true);
    setEditing(true);
    setMessage(null);
  };

  const edit = (p) => {
    setForm({ ...empty, ...p });
    setIsNew(false);
    setEditing(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e) => {
    e.preventDefault();
    const slug = isNew ? toSlug(form.slug || form.name) : form.id;
    if (!form.name.trim() || !slug) return say("error", "Cần nhập tên sản phẩm.");
    if (isNew && items.some((p) => p.id === slug)) return say("error", "Slug này đã tồn tại, hãy đổi slug khác.");

    setBusy(true);
    try {
      await saveProduct({
        ...form,
        id: slug,
        slug,
        name: form.name.trim(),
        number: form.number.trim() || String(items.length + 1).padStart(2, "0"),
        price: form.price.trim(),
        image: form.image.trim(),
        image2: (form.image2 || "").trim(),
        image3: (form.image3 || "").trim(),
        image4: (form.image4 || "").trim(),
        image5: (form.image5 || "").trim(),
        image6: (form.image6 || "").trim(),
      });
      say("success", "Đã lưu sản phẩm.");
      setEditing(false);
      await load();
    } catch (err) {
      say("error", explainError(err));
    }
    setBusy(false);
  };

  const del = async (p) => {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    try {
      await removeProduct(p.id);
      say("success", "Đã xóa sản phẩm.");
      await load();
    } catch (err) {
      say("error", explainError(err));
    }
  };

  return (
    <section>
      <div className="admin-top">
        <div>
          <h1>Sản phẩm</h1>
          <p className="admin-muted">Thêm, sửa và xóa sản phẩm trên website.</p>
        </div>
        <button className="admin-btn primary" onClick={startNew}>+ Thêm sản phẩm</button>
      </div>

      {message && <div className={`admin-${message.type}`} style={{ marginBottom: 16 }}>{message.text}</div>}

      {editing && (
        <form className="admin-card admin-form" onSubmit={save} style={{ marginBottom: 20 }}>
          <h2>{isNew ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}</h2>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label>Tên sản phẩm</label>
              <input name="name" value={form.name} onChange={change} required />
            </div>
            <div className="admin-field">
              <label>Số thứ tự</label>
              <input name="number" value={form.number} onChange={change} placeholder="01" />
            </div>
            <div className="admin-field">
              <label>Giá</label>
              <input name="price" value={form.price} onChange={change} placeholder="1.290.000đ" />
            </div>
            {isNew && (
              <div className="admin-field">
                <label>Slug (đường dẫn)</label>
                <input name="slug" value={form.slug} onChange={change} placeholder={toSlug(form.name) || "tự tạo từ tên"} />
              </div>
            )}
          </div>

          <ImageField
            label="Ảnh chính"
            value={form.image}
            onChange={(v) => setForm((f) => ({ ...f, image: v }))}
            width={1200}
          />
          <p className="admin-muted" style={{ margin: "4px 0 14px", fontSize: 13 }}>
            Tối đa 5 ảnh phụ. Trang chi tiết hiện 2 ảnh phụ phía dưới; nếu nhiều hơn thì dùng mũi tên ‹ › để xoay.
            Bấm ảnh phụ để đưa lên khung lớn. Thẻ sản phẩm / collection vẫn xoay tất cả ảnh.
          </p>
          <ImageField
            label="Ảnh phụ 1"
            value={form.image2}
            onChange={(v) => setForm((f) => ({ ...f, image2: v }))}
            width={1200}
          />
          <ImageField
            label="Ảnh phụ 2"
            value={form.image3}
            onChange={(v) => setForm((f) => ({ ...f, image3: v }))}
            width={1200}
          />
          <ImageField
            label="Ảnh phụ 3"
            value={form.image4}
            onChange={(v) => setForm((f) => ({ ...f, image4: v }))}
            width={1200}
          />
          <ImageField
            label="Ảnh phụ 4"
            value={form.image5}
            onChange={(v) => setForm((f) => ({ ...f, image5: v }))}
            width={1200}
          />
          <ImageField
            label="Ảnh phụ 5"
            value={form.image6}
            onChange={(v) => setForm((f) => ({ ...f, image6: v }))}
            width={1200}
          />

          {LONG.map(([k, label]) => (
            <div className="admin-field" key={k}>
              <label>{label}</label>
              <textarea name={k} rows="3" value={form[k] || ""} onChange={change} />
            </div>
          ))}

          <label className="admin-check">
            <input type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Hiển thị trên website
          </label>

          <div className="admin-actions">
            <button className="admin-btn primary" disabled={busy}>{busy ? "Đang lưu..." : "Lưu"}</button>
            <button type="button" className="admin-btn" onClick={() => setEditing(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="admin-card">
        {!loading && items.length === 0 ? (
          <div className="admin-empty">
            <p>Chưa có sản phẩm nào trên Firestore.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Ảnh</th><th>Sản phẩm</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.number}</td>
                    <td>{p.image && <img className="admin-thumb" src={p.image} alt="" />}</td>
                    <td>{p.name}</td>
                    <td>{p.price}</td>
                    <td><span className={`admin-badge ${p.active === false ? "off" : ""}`}>{p.active === false ? "Ẩn" : "Hiện"}</span></td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn" onClick={() => edit(p)}>Sửa</button>
                        <button className="admin-btn danger" onClick={() => del(p)}>Xóa</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}