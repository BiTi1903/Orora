import TranslationHelp from "./TranslationHelp";
import { useConfirm } from "./confirm-context";
import useDraftGuard from "../hooks/useDraftGuard";
import PriceInput from "./PriceInput";
import { formatProductPrice, parseVndPrice } from "../lib/commerce";
import { nextProductSequence, productNumber, productPath, productSlug } from "../lib/product-identity";
import ProductVolumeEditor from "./ProductVolumeEditor";
import { validateVolumeOptions } from "../lib/product-options";
import ProductReviewsEditor from "./ProductReviewsEditor";
import ProductInformationEditor from "./ProductInformationEditor";
import { normalizeProductDetailVisibility, productInformationBlocks, productSectionGroup, PRODUCT_CONTENT_GROUPS, secondaryProductImages } from "../lib/product-content";
import { useEffect, useRef, useState } from "react";
import { explainError, getProducts, removeProduct, saveProduct, setProductCategory } from "../lib/api";
import useCategories from "../hooks/useCategories";
import ImageField from "./ImageField";
import { cdnSrc, THUMB } from "../lib/image-cdn";

const empty = {
  id: "", number: "", name: "", slug: "", price: "", image: "",
  image2: "", image3: "", image4: "", image5: "", image6: "",
  shoppingGuide: "", description: "", story: "", material: "", size: "", color: "", origin: "",
  detailVisibility: { description: false, specifications: false, usage: false },
  active: true, categoryId: "",
};

const newProductInformationBlock = (group) => ({
  id: crypto.randomUUID(), group, enabled: true, showText: true, image: "", title: "", content: "",
});

function withInformationSlots(sections = []) {
  return [...sections, ...Object.keys(PRODUCT_CONTENT_GROUPS)
    .filter((group) => !sections.some((section) => section.group === group))
    .map(newProductInformationBlock)];
}
const imageSlots = (product = {}) => {
  const slots = secondaryProductImages(product).map((src) => ({ id: crypto.randomUUID(), src }));
  while (slots.length > 1 && !slots.at(-1).src.trim()) slots.pop();
  return slots.length ? slots : [{ id: crypto.randomUUID(), src: "" }];
};

export default function ProductsAdmin() {
  const confirm = useConfirm();
  const { categories, error: categoriesError } = useCategories();
  const [categorySaving, setCategorySaving] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(empty);
  const [sections, setSections] = useState([]);
  const [volumeOptions, setVolumeOptions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [media, setMedia] = useState([]);
  const [uploads, setUploads] = useState({});
  const uploading = Object.values(uploads).some(Boolean);
  const uploadState = (id, value) => setUploads((current) => ({ ...current, [id]: value }));
  const [editorPanel, setEditorPanel] = useState("basics");
  const editorRef = useRef(null);
  const changePanel = (key) => { setEditorPanel(key); requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: "start", behavior: "auto" })); };
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(false);
  const [isNew, setIsNew] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const draftGuard=useDraftGuard({form,sections,volumeOptions,reviews,media},{enabled:editing,busy:busy||uploading});
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
    setEditorPanel("basics");
    setVolumeOptions([]); setReviews([]); setSections(withInformationSlots()); setMedia(imageSlots()); setUploads({});
    setForm({ ...empty, number: String(nextProductSequence(items)).padStart(2, "0") });
    setIsNew(true);
    setEditing(true);
    setMessage(null);
  };

  const edit = (p) => {
    setEditorPanel("basics");
    setVolumeOptions(Array.isArray(p.volumeOptions) ? p.volumeOptions.map((option) => ({ ...option, id: option.id || crypto.randomUUID(), label: String(option.label ?? ""), price: String(option.price ?? "") })) : []);
    const savedSections = productInformationBlocks(p).map((item, index) => ({ ...item, id: item.id || crypto.randomUUID(), group: productSectionGroup(item, index) }));
    setSections(withInformationSlots(savedSections));
    setReviews(Array.isArray(p.productReviews) ? p.productReviews.map((item) => ({ ...item, id: item.id || crypto.randomUUID() })) : []);
    setMedia(imageSlots(p)); setUploads({});
    setForm({
      ...empty,
      ...p,
      detailVisibility: normalizeProductDetailVisibility(p.detailVisibility),
      name: String(p.name || ""),
      price: String(p.price ?? ""),
      number: String(p.number || productNumber(p, items)),
    });
    setIsNew(false);
    setEditing(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy || uploading) return;
    const original = items.find((product) => product.id === form.id);
    if (form.price.trim() && parseVndPrice(form.price) === null && form.price !== String(original?.price ?? "")) { changePanel("pricing"); return say("error", "Giá phải là số nguyên từ 0 đến 1.000.000.000 đ, hoặc để trống nếu cần báo giá."); }
    const volumeError = validateVolumeOptions(volumeOptions);
    if (volumeError) { changePanel("pricing"); return say("error", volumeError); }
    if (reviews.some((review) => review.published && (!String(review.name || "").trim() || !String(review.text || "").trim()))) { changePanel("reviews"); return say("error", "Điền tên và nội dung cho đánh giá muốn hiển thị."); }
    if (!form.name.trim()) { changePanel("basics"); return say("error", "Cần nhập tên sản phẩm."); }
    const id = isNew ? String(nextProductSequence(items)) : form.id;
    const slug = productSlug({ ...form, id }, items);
    const previous = items.find((product) => product.id === form.id);
    const previousCanonical = previous ? productSlug(previous, items) : null;
    const slugAliases = [...new Set([previousCanonical, ...(Array.isArray(form.slugAliases) ? form.slugAliases : []), form.slug].filter((value) => typeof value === "string" && value && value !== slug))];

    setBusy(true);
    try {
      await saveProduct({
        ...form,
        id,
        slug,
        slugAliases,
        name: form.name.trim(),
        number: form.number.trim() || String(nextProductSequence(items)).padStart(2, "0"),
        price: form.price.trim(),
        image: form.image.trim(),
        story: "",
        material: "",
        size: "",
        color: "",
        origin: "",
        detailVisibility: normalizeProductDetailVisibility(form.detailVisibility),
        detailSections: sections.filter((section) => section.image?.trim() || section.title?.trim() || section.content?.trim()),
        productReviews: reviews,
        volumeOptions: volumeOptions.map((option) => ({ ...option, label: option.label.trim(), price: option.price?.trim() || "" })),
        additionalImages: media.map((item) => item.src),
      }, { create: isNew });
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
    if (busy || uploading || categorySaving) return;
    if (!await confirm(`Xóa sản phẩm "${p.name}"?`, { title: "Xóa sản phẩm", confirmLabel: "Xóa", danger: true })) return;
    setBusy(true);
    try {
      await removeProduct(p.id);
      say("success", "Đã xóa sản phẩm.");
      await load();
    } catch (err) {
      say("error", explainError(err));
    } finally {
      setBusy(false);
    }
  };

  const query = search.trim().toLocaleLowerCase("vi-VN");
  const visibleItems = items.filter((product) => (status === "all" || (product.active !== false) === (status === "active")) && (!query || [product.name, productNumber(product, items), String(Number(productNumber(product, items)))].some((value) => String(value || "").toLocaleLowerCase("vi-VN").includes(query))));
  const panels = [["basics", "Thông tin"], ["pricing", "Giá & dung tích"], ["images", "Hình ảnh"], ["content", "Nội dung"], ["reviews", "Đánh giá"]];
  return <section className="products-admin">
    <div className="admin-top"><div><h1>Sản phẩm</h1><p className="admin-muted">Quản lý sản phẩm, giá và nội dung hiển thị.</p></div>{!editing && <button className="admin-btn primary" onClick={startNew} disabled={loading || busy || uploading}>+ Thêm sản phẩm</button>}</div>
    {message && !editing && <div role="status" className={`admin-${message.type}`} style={{ marginBottom: 16 }}>{message.text}</div>}
    {editing && <form aria-busy={busy} ref={editorRef} className="admin-card admin-form product-editor-form" noValidate onSubmit={save}>
      <div className="product-editor-toolbar">
        <div className="product-editor-toolbar-top"><div><h2>{isNew ? "Thêm sản phẩm" : "Chỉnh sửa sản phẩm"}</h2><p className="admin-muted">Mã SP #{form.number} · {form.name || "Sản phẩm mới"}</p></div><div className="admin-actions">{!isNew && form.id && <a className="admin-btn" href={productPath(form, items)} target="_blank" rel="noopener noreferrer">Xem trang sản phẩm ↗</a>}<button type="submit" className="admin-btn primary" aria-busy={busy} disabled={busy || uploading || !!categorySaving}>{busy ? "Đang lưu..." : "Lưu"}</button><button type="button" className="admin-btn" disabled={busy || uploading} onClick={async () => {if(!draftGuard.hasChanges()||await confirm("Đóng phần chỉnh sửa? Thay đổi chưa lưu sẽ bị bỏ.", { title: "Bỏ thay đổi sản phẩm", confirmLabel: "Bỏ thay đổi", danger: true }))setEditing(false);}}>Hủy</button></div></div>
        <nav className="product-editor-tabs" aria-label="Các phần chỉnh sửa sản phẩm">{panels.map(([key, title]) => <button key={key} type="button" aria-pressed={editorPanel === key} onClick={() => changePanel(key)}>{title}</button>)}</nav>
        {uploading && <p className="admin-muted" role="status">Đang tải ảnh. Chờ ảnh tải xong rồi lưu.</p>}
        {message && <p role={message.type === "error" ? "alert" : "status"} className={`admin-${message.type}`}>{message.text}</p>}
      </div>
      {editorPanel === "basics" && <div className="product-editor-panel">
        <h3>Thông tin sản phẩm</h3><div className="admin-form-grid">
          <div className="admin-field"><label htmlFor="product-name">Tên sản phẩm</label><input id="product-name" disabled={busy} name="name" value={form.name} onChange={change} required /></div>
          <div className="admin-field"><label htmlFor="product-number">Mã SP / STT</label><input id="product-number" name="number" value={form.number} readOnly /><small className="admin-muted">Mã tự tăng; đường dẫn bên dưới lấy theo tên sản phẩm.</small></div>
        </div>
        <div className="admin-field"><label>Đường dẫn theo tên sản phẩm</label><output className="product-url-preview">{form.name.trim() ? productPath({ ...form, id: form.id || String(nextProductSequence(items)) }, items) : "/product/ten-san-pham"}</output></div>
          <div className="admin-field">
            <label htmlFor="product-category">Danh mục</label>
            <select id="product-category" name="categoryId" value={form.categoryId} onChange={change} disabled={busy || !!categoriesError}>
              <option value="">Chưa phân loại</option>
              {form.categoryId && !categories.some((category) => category.id === form.categoryId) && <option value={form.categoryId}>Danh mục chưa tải</option>}
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="admin-field"><label htmlFor="shopping-guide">Gợi ý chọn sản phẩm</label><textarea id="shopping-guide" name="shoppingGuide" rows={2} maxLength={240} value={form.shoppingGuide||""} onChange={change} disabled={busy} placeholder="Phù hợp với nhu cầu nào, dùng khi nào, khác sản phẩm cùng nhóm ở đâu?"/></div>
          <div className="admin-field"><label htmlFor="product-description">Mô tả ngắn</label><textarea id="product-description" name="description" rows={3} value={form.description || ""} onChange={change} disabled={busy} /></div>
          <label className="admin-check">
            <input type="checkbox" role="switch" disabled={busy} checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Hiển thị trên website
            <TranslationHelp label="ẩn hiện sản phẩm">Tắt mục này sẽ ẩn sản phẩm khỏi trang khách và tạm ngừng nhận đơn mới, nhưng vẫn giữ nguyên dữ liệu sản phẩm và lịch sử đơn cũ.</TranslationHelp>
          </label>
      </div>}
      {editorPanel === "pricing" && <div className="product-editor-panel"><h3>Giá bán và dung tích <TranslationHelp label="giá và dung tích">Nếu sản phẩm có nhiều dung tích (ví dụ 30ml, 50ml), thêm từng dung tích bên dưới để khách chọn khi mua và quản lý tồn kho riêng theo từng dung tích.</TranslationHelp></h3><div className="admin-field"><label htmlFor="product-price">Giá</label><PriceInput id="product-price" disabled={busy} name="price" value={form.price} onChange={(price) => setForm((current) => ({ ...current, price }))} placeholder="250000" /><small className="admin-muted">Chỉ nhập số, ví dụ 250000. Đơn vị đ tự hiển thị; để trống nếu cần báo giá. Giá chung áp dụng khi dung tích không có giá riêng.</small></div><ProductVolumeEditor options={volumeOptions} onChange={setVolumeOptions} disabled={busy} /></div>}
      {editorPanel === "images" && <div className="product-editor-panel">
          <section className="product-editor-block" aria-label="Ảnh sản phẩm"><div className="product-editor-heading"><div><h3>Ảnh sản phẩm</h3><p className="admin-muted">Một ảnh chính và các ảnh phụ theo thứ tự bạn thêm.</p></div></div>
            <ImageField label="Ảnh chính" value={form.image} disabled={busy} onBusyChange={(value) => uploadState("main", value)} onChange={(value) => setForm((current) => ({ ...current, image: value }))} width={1200} />
            <div className="product-secondary-images">{media.map((item, index) => <div className="product-secondary-image" key={item.id}><ImageField label={`Ảnh phụ ${index + 1}`} value={item.src} disabled={busy} onBusyChange={(value) => uploadState(item.id, value)} onChange={(src) => setMedia((current) => current.map((entry) => entry.id === item.id ? { ...entry, src } : entry))} width={1200} />{media.length > 1 && <button type="button" className="admin-btn danger" disabled={busy || uploading} aria-label={`Xóa mục ảnh phụ ${index + 1}`} onClick={() => setMedia((current) => current.filter((entry) => entry.id !== item.id))}>Xóa mục ảnh</button>}</div>)}</div>
            <button type="button" className="admin-btn" disabled={busy || uploading} onClick={() => setMedia((current) => [...current, { id: crypto.randomUUID(), src: "" }])}>+ Thêm ảnh phụ</button>
          </section>

      </div>}
      {editorPanel === "content" && <div className="product-editor-panel">
        <ProductInformationEditor sections={sections} visibility={form.detailVisibility} onChange={setSections}
          onVisibility={(group, visible) => setForm((current) => ({ ...current, detailVisibility: { ...current.detailVisibility, [group]: visible } }))}
          onUpload={uploadState} newBlock={newProductInformationBlock} disabled={busy} uploading={uploading} />
      </div>}
      {editorPanel === "reviews" && <div className="product-editor-panel"><ProductReviewsEditor reviews={reviews} onChange={setReviews} disabled={busy} /></div>}
    </form>}
      {!editing && <div className="admin-card">
        <div className="product-list-tools"><div className="admin-field"><label htmlFor="products-search">Tìm sản phẩm</label><input id="products-search" type="search" placeholder="Tên hoặc mã sản phẩm…" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="admin-field"><label htmlFor="products-status">Hiển thị</label><select id="products-status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">Tất cả</option><option value="active">Đang hiện</option><option value="hidden">Đang ẩn</option></select></div><span className="admin-muted">{visibleItems.length} / {items.length} sản phẩm</span></div>
        {!loading && visibleItems.length === 0 ? (
          <div className="admin-empty">
            <p>Chưa có sản phẩm phù hợp.</p>
          </div>
        ) : (
          <div className="product-table-scroll" style={{ overflowX: "auto" }} role="region" aria-label="Danh sách sản phẩm" tabIndex={0}>
            <table className="admin-table">
              <thead>
                <tr><th>Mã SP</th><th>Ảnh</th><th>Sản phẩm</th><th>Giá</th><th>Trạng thái</th><th>Danh mục / Thao tác <TranslationHelp label="đổi danh mục nhanh">Đổi ô danh mục ngay trên bảng sẽ tự lưu tức thì. Muốn ngừng bán mà vẫn giữ lịch sử đơn, vào Sửa rồi tắt Hiển thị thay vì Xóa.</TranslationHelp></th></tr>
              </thead>
              <tbody>
                {visibleItems.map((p) => {
                  const enabledTabs = Object.keys(PRODUCT_CONTENT_GROUPS).filter((group) => p.detailVisibility?.[group] === true).length;
                  const volCount = Array.isArray(p.volumeOptions) ? p.volumeOptions.filter((v) => v?.label?.trim()).length : 0;
                  return (
                  <tr key={p.id}>
                    <td>#{productNumber(p, items)}</td>
                    <td>{p.image && <img className="admin-thumb" src={cdnSrc(p.image, THUMB)} alt="" loading="lazy" decoding="async" />}</td>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="product-list-meta">
                        <span className="admin-muted">{enabledTabs > 0 ? `${enabledTabs}/3 mục nội dung` : "Chưa bật nội dung"}</span>
                        {volCount > 0 && <span className="admin-muted">· {volCount} dung tích</span>}
                      </div>
                      <a className="product-list-link" href={productPath(p, items)} target="_blank" rel="noopener noreferrer">Xem trên website</a>
                    </td>
                    <td>{formatProductPrice(p.price) || "Cần báo giá"}</td>
                    <td><span className={`admin-badge ${p.active === false ? "off" : ""}`}>{p.active === false ? "Ẩn" : "Hiện"}</span></td>
                    <td>
                      <div className="admin-actions product-row-actions">
                        <select aria-label={`Danh mục của ${p.name}`} aria-busy={categorySaving === p.id} value={p.categoryId || ""} disabled={busy || !!categorySaving || !!categoriesError} onChange={(event) => changeProductCategory(p, event.target.value)}>
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
                );})}
              </tbody>
            </table>
          </div>
        )}
      </div>}
  </section>;
}
