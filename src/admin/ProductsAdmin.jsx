import ProductFacebookSettings from "./ProductFacebookSettings";
import ProductPoliciesSettings from "./ProductPoliciesSettings";
import ProductReviewsEditor from "./ProductReviewsEditor";
import ProductContentEditor from "./ProductContentEditor";
import { productSections, productSectionGroup, PRODUCT_CONTENT_GROUPS, secondaryProductImages } from "../lib/product-content";
import ShopLinksSettings from "./ShopLinksSettings";
import { useEffect, useState } from "react";
import { explainError, getProducts, removeProduct, saveProduct, saveCategory, setProductCategory } from "../lib/api";
import useCategories from "../hooks/useCategories";
import ImageField from "./ImageField";

const empty = {
  id: "", number: "", name: "", slug: "", price: "", image: "",
  image2: "", image3: "", image4: "", image5: "", image6: "",
  description: "", story: "", material: "", size: "", color: "", origin: "",
  active: true, categoryId: "",
};

const newSection = (group = "description") => ({ id: crypto.randomUUID(), title: group === "description" ? "Mô tả" : "", content: "", group });
const imageSlots = (product = {}) => {
  const slots = secondaryProductImages(product).map((src) => ({ id: crypto.randomUUID(), src }));
  while (slots.length > 1 && !slots.at(-1).src.trim()) slots.pop();
  return slots.length ? slots : [{ id: crypto.randomUUID(), src: "" }];
};

const toSlug = (s) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function ProductsAdmin() {
  const { categories, error: categoriesError } = useCategories();
  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categoryBusy, setCategoryBusy] = useState(false);
  const [categorySaving, setCategorySaving] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [sections, setSections] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [media, setMedia] = useState([]);
  const [uploads, setUploads] = useState({});
  const uploading = Object.values(uploads).some(Boolean);
  const uploadState = (id, value) => setUploads((current) => ({ ...current, [id]: value }));
  const patchSection = (id, patch) => setSections((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
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

  useEffect(() => {
    let alive = true;
    getProducts()
      .then((products) => { if (alive) setItems(products); })
      .catch((err) => { if (alive) setMessage({ type: "error", text: explainError(err) }); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const startNew = () => {
    setReviews([]); setSections([newSection()]); setMedia(imageSlots()); setUploads({});
    setForm({ ...empty, number: String(items.length + 1).padStart(2, "0") });
    setIsNew(true);
    setEditing(true);
    setMessage(null);
  };

  const edit = (p) => {
    const savedSections = productSections(p).map((item, index) => ({ ...item, id: item.id || crypto.randomUUID(), group: productSectionGroup(item, index) }));
    setSections(savedSections.length ? savedSections : [newSection()]);
    setReviews(Array.isArray(p.productReviews) ? p.productReviews.map((item) => ({ ...item, id: item.id || crypto.randomUUID() })) : []);
    setMedia(imageSlots(p)); setUploads({});
    setForm({ ...empty, ...p });
    setIsNew(false);
    setEditing(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy || uploading) return;
    if (reviews.some((review) => review.published && (!review.name.trim() || !review.text.trim()))) return say("error", "Điền tên và nội dung cho đánh giá muốn hiển thị.");
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
        detailSections: sections.filter((section) => section.title.trim() || section.content.trim()),
        productReviews: reviews,
        additionalImages: media.map((item) => item.src),
      });
      say("success", "Đã lưu sản phẩm.");
      setEditing(false);
      await load();
    } catch (err) {
      say("error", explainError(err));
    }
    setBusy(false);
  };

  const changeProductCategory = async (product, categoryId) => {
    if (categorySaving || busy) return;
    setCategorySaving(product.id);
    try {
      await setProductCategory(product.id, categoryId);
      setItems((current) => current.map((item) => item.id === product.id ? { ...item, categoryId } : item));
      setForm((current) => current.id === product.id ? { ...current, categoryId } : current);
      say("success", `Đã cập nhật danh mục cho ${product.name}.`);
    } catch (err) { say("error", explainError(err)); }
    finally { setCategorySaving(""); }
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
        {!editing && <button className="admin-btn primary" onClick={startNew} disabled={busy || uploading}>+ Thêm sản phẩm</button>}
      </div>

      {message && <div className={`admin-${message.type}`} style={{ marginBottom: 16 }}>{message.text}</div>}

      <div hidden={editing}><ShopLinksSettings /><ProductPoliciesSettings /><ProductFacebookSettings />
      {categoriesError && <div className="admin-error">Không tải được danh mục: {explainError(categoriesError)}</div>}
      <form className="admin-card admin-form" style={{ marginBottom: 20 }} onSubmit={async (event) => {
        event.preventDefault();
        setCategoryBusy(true);
        try {
          await saveCategory({ id: categoryId, name: categoryName });
          setCategoryName(""); setCategoryId("");
          say("success", "Đã lưu danh mục.");
        } catch (err) { say("error", explainError(err)); }
        finally { setCategoryBusy(false); }
      }}>
        <h2>Danh mục sản phẩm</h2>
        <div className="admin-field">
          <label htmlFor="category-name">{categoryId ? "Đổi tên danh mục" : "Thêm danh mục"}</label>
          <input id="category-name" required maxLength={80} value={categoryName} disabled={categoryBusy} onChange={(event) => setCategoryName(event.target.value)} />
        </div>
        <div className="admin-actions">
          <button className="admin-btn primary" disabled={categoryBusy}>{categoryBusy ? "Đang lưu…" : categoryId ? "Lưu tên" : "Thêm danh mục"}</button>
          {categoryId && <button type="button" className="admin-btn" disabled={categoryBusy} onClick={() => { setCategoryId(""); setCategoryName(""); }}>Hủy</button>}
        </div>
        <div className="admin-actions" style={{ marginTop: 12, flexWrap: "wrap" }}>
          {categories.map((category) => <button type="button" className="admin-btn" key={category.id} disabled={categoryBusy} onClick={() => { setCategoryId(category.id); setCategoryName(category.name); }}>{category.name} · Sửa tên</button>)}
        </div>
      </form>

      </div>
      {editing && (
        <form className="admin-card admin-form" onSubmit={save} style={{ marginBottom: 20 }}>
          <h2>{isNew ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}</h2>

          <div className="admin-form-grid">
            <div className="admin-field">
              <label htmlFor="product-name">Tên sản phẩm</label>
              <input id="product-name" disabled={busy} name="name" value={form.name} onChange={change} required />
            </div>
            <div className="admin-field">
              <label htmlFor="product-number">Số thứ tự</label>
              <input id="product-number" disabled={busy} name="number" value={form.number} onChange={change} placeholder="01" />
            </div>
            <div className="admin-field">
              <label htmlFor="product-price">Giá</label>
              <input id="product-price" disabled={busy} name="price" value={form.price} onChange={change} placeholder="1.290.000đ" />
            </div>
            {isNew && (
              <div className="admin-field">
                <label htmlFor="product-slug">Slug (đường dẫn)</label>
                <input id="product-slug" disabled={busy} name="slug" value={form.slug} onChange={change} placeholder={toSlug(form.name) || "tự tạo từ tên"} />
              </div>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="product-category">Danh mục</label>
            <select id="product-category" name="categoryId" value={form.categoryId} onChange={change} disabled={busy || !!categoriesError}>
              <option value="">Chưa phân loại</option>
              {form.categoryId && !categories.some((category) => category.id === form.categoryId) && <option value={form.categoryId}>Danh mục chưa tải</option>}
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <section className="product-editor-block" aria-label="Ảnh sản phẩm"><div className="product-editor-heading"><div><h3>Ảnh sản phẩm</h3><p className="admin-muted">Một ảnh chính và các ảnh phụ theo thứ tự bạn thêm.</p></div></div>
            <ImageField label="Ảnh chính" value={form.image} disabled={busy} onBusyChange={(value) => uploadState("main", value)} onChange={(value) => setForm((current) => ({ ...current, image: value }))} width={1200} />
            <div className="product-secondary-images">{media.map((item, index) => <div className="product-secondary-image" key={item.id}><ImageField label={`Ảnh phụ ${index + 1}`} value={item.src} disabled={busy} onBusyChange={(value) => uploadState(item.id, value)} onChange={(src) => setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, src } : entry))} width={1200} />{media.length > 1 && <button type="button" className="admin-btn danger" disabled={busy || uploading} aria-label={`Xóa mục ảnh phụ ${index + 1}`} onClick={() => setMedia((current) => current.filter((entry) => entry.id !== item.id))}>Xóa mục ảnh</button>}</div>)}</div>
            <button type="button" className="admin-btn" disabled={busy || uploading} onClick={() => setMedia((current) => [...current, { id: crypto.randomUUID(), src: "" }])}>+ Thêm ảnh phụ</button>
          </section>
          <div className="admin-field"><label htmlFor="product-description">Mô tả ngắn</label><textarea id="product-description" name="description" rows={3} value={form.description || ""} onChange={change} disabled={busy} /></div>
          <section className="product-editor-block" aria-label="Nội dung chi tiết sản phẩm"><div className="product-editor-heading"><div><h3>Nội dung chi tiết</h3><p className="admin-muted">Mặc định chỉ có Mô tả. Tên mục không bắt buộc; bấm Thêm mục nội dung khi cần thêm phần khác.</p></div></div>
            {sections.map((item, index) => <div className="product-content-section" key={item.id}><div className="product-editor-heading"><strong>Mục {index + 1}</strong>{sections.length > 1 && <button type="button" className="admin-btn danger" disabled={busy} aria-label={`Xóa mục nội dung ${index + 1}`} onClick={() => { if ((item.title.trim() || item.content.trim()) && !window.confirm("Bỏ mục này khỏi nội dung sản phẩm? Chỉ áp dụng khi bạn lưu sản phẩm.")) return; setSections((current) => current.filter((entry) => entry.id !== item.id)); }}>Xóa mục</button>}</div><div className="admin-field"><label htmlFor={`section-group-${item.id}`}>Phần hiển thị mục {index + 1}</label><select id={`section-group-${item.id}`} value={item.group || productSectionGroup(item, index)} disabled={busy} onChange={(event) => patchSection(item.id, { group: event.target.value })}>{Object.entries(PRODUCT_CONTENT_GROUPS).map(([key, title]) => <option key={key} value={key}>{title}</option>)}</select></div><div className="admin-field"><label htmlFor={`section-title-${item.id}`}>Tên mục {index + 1} (không bắt buộc)</label><input id={`section-title-${item.id}`} value={item.title} disabled={busy} placeholder={index === 0 ? "Mô tả" : "Để trống hoặc nhập tên mục…"} onChange={(event) => patchSection(item.id, { title: event.target.value })} /></div><ProductContentEditor label={`Nội dung mục ${index + 1}`} value={item.content} disabled={busy} onChange={(content) => patchSection(item.id, { content })} /></div>)}
            <button type="button" className="admin-btn" disabled={busy} onClick={() => setSections((current) => [...current, newSection("specifications")])}>+ Thêm mục nội dung</button>
          </section>

          <ProductReviewsEditor reviews={reviews} onChange={setReviews} disabled={busy} />
          <label className="admin-check">
            <input type="checkbox" disabled={busy} checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Hiển thị trên website
          </label>

          {uploading && <p className="admin-muted" role="status">Đang tải ảnh. Chờ ảnh tải xong rồi lưu sản phẩm.</p>}
          <div className="admin-actions">
            <button className="admin-btn primary" disabled={busy || uploading || !!categorySaving}>{busy ? "Đang lưu..." : "Lưu"}</button>
            <button type="button" className="admin-btn" disabled={busy || uploading} onClick={() => setEditing(false)}>Hủy</button>
          </div>
        </form>
      )}

      <div className="admin-card" hidden={editing}>
        {!loading && items.length === 0 ? (
          <div className="admin-empty">
            <p>Chưa có sản phẩm nào trên Firestore.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Ảnh</th><th>Sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.number}</td>
                    <td>{p.image && <img className="admin-thumb" src={p.image} alt="" />}</td>
                    <td>{p.name}</td>
                    <td>{categories.find((category) => category.id === p.categoryId)?.name || "Chưa phân loại"}</td>
                    <td>{p.price}</td>
                    <td><span className={`admin-badge ${p.active === false ? "off" : ""}`}>{p.active === false ? "Ẩn" : "Hiện"}</span></td>
                    <td>
                      <div className="admin-actions product-row-actions">
                        <select aria-label={`Danh mục của ${p.name}`} value={p.categoryId || ""} disabled={busy || !!categorySaving || !!categoriesError} onChange={(event) => changeProductCategory(p, event.target.value)}>
                          <option value="">Chưa phân loại</option>
                          {p.categoryId && !categories.some((category) => category.id === p.categoryId) && <option value={p.categoryId}>Danh mục chưa tải</option>}
                          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                        </select>
                        {categorySaving === p.id && <span role="status" className="admin-muted">Đang lưu…</span>}
                        <button className="admin-btn" disabled={busy || uploading || !!categorySaving} onClick={() => edit(p)}>Sửa</button>
                        <button className="admin-btn danger" disabled={busy || uploading || !!categorySaving} onClick={() => del(p)}>Xóa</button>
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