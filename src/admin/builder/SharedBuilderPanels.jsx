import PolicyPage from "../../components/PolicyPage";
import ProductAssurances from "../../components/ProductAssurances";
import useHomeContent from "../../hooks/useHomeContent";
import { useState } from "react";
import { SloganAppearanceEditor, SloganTypographyEditor } from "../ProductSloganDesign";
import { ColorField, NumberField } from "../controls";
import { ORDER_TRACKING_COLOR_DEFAULTS } from "../controls/color-defaults";
import {
  ORDER_TRACKING_FIELDS,
  TRACKING_RESULT_KEYS,
  TRACKING_STYLE_GROUPS,
  trackingCopy,
  trackingStyle,
  trackingTheme,
  trackingTextSettings,
} from "../../lib/order-tracking-copy";
import { PAYMENT_LABELS, availablePaymentMethods, socialShopUrl } from "../../lib/commerce";
import * as api from "../../lib/api";
import useCategories from "../../hooks/useCategories";
import OrderTrackingDetails from "../../components/OrderTrackingDetails";
import OrderTrackingSearch from "../../components/OrderTrackingSearch";
import "../../styles/order-tracking.css";

const SAMPLE_TRACKING_ORDER = {
  code: "OW_1024C",
  status: "confirmed",
  paymentMethod: "cod",
  paymentStatus: "unpaid",
  createdAt: new Date().toISOString(),
  productName: "Gel dưỡng ORORA", variantLabel: "100 ml",
  quantity: 1,
  subtotal: 250000,
  shippingFee: 30000,
  totalAmount: 280000,
  customer: {
    name: "Nguyễn Minh Anh",
    phone: "0901234567",
    address: "12 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
  },
};

export function ProductDiscoveryBuilderPanel({ value, products = [], faq = false, onChange }) {
  const [tab, setTab] = useState("content");
  const form = value || {};
  const items = Array.isArray(form.items) ? form.items : [];
  const patch = (next) => onChange({ ...form, ...next });
  const updateItem = (index, next) =>
    patch({ items: items.map((item, i) => (i === index ? { ...item, ...next } : item)) });
  const moveItem = (index, offset) => {
    const next = [...items];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    patch({ items: next });
  };

  return (
    <div className="builder-inspector">
      <header className="inspector-heading">
        <small>{faq ? "FAQ SẢN PHẨM" : "CHỌN THEO NHU CẦU"}</small>
        <h2>{faq ? "Câu hỏi thường gặp" : "Chọn sản phẩm theo nhu cầu"}</h2>
        <p>
          {faq
            ? "Mỗi câu hỏi có thể gán cho nhiều sản phẩm. Bấm Lưu tất cả để áp dụng."
            : "Hiển thị trước bộ sưu tập trên trang chủ. Bấm Lưu tất cả để áp dụng."}
        </p>
      </header>
      <nav className="slogan-settings-tabs" aria-label="Nhóm chỉnh sửa">
        {[
          ["content", "Nội dung"],
          ["text", "Kiểu chữ"],
          ["card", "Khung & nền"],
        ].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "content" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <label className="admin-check">
            <input
              type="checkbox"
              role="switch"
              checked={form.enabled !== false}
              onChange={(e) => patch({ enabled: e.target.checked })}
            />
            Hiển thị phần này trên website
          </label>
          {[
            ["title", "Tiêu đề"],
            ["text", "Lời giới thiệu"],
            ...(!faq
              ? [
                  ["emptyText", "Thông báo khi chưa có gợi ý"],
                  ["linkLabel", "Chữ xem tất cả sản phẩm"],
                ]
              : []),
          ].map(([key, label]) => (
            <div className="admin-field" key={key}>
              <label>
                {label}
                <input
                  value={form[key] || ""}
                  maxLength={1000}
                  onChange={(e) => patch({ [key]: e.target.value })}
                />
              </label>
            </div>
          ))}

          {items.map((item, index) => (
            <div className="slogan-design-editor" key={item.id || index}>
              <div className="product-editor-heading">
                <strong>
                  {faq ? "Câu hỏi" : "Nhu cầu"} {index + 1}
                </strong>
                <div className="admin-actions">
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={index === 0}
                    onClick={() => moveItem(index, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="admin-btn"
                    disabled={index === items.length - 1}
                    onClick={() => moveItem(index, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    className="admin-btn danger"
                    onClick={() => patch({ items: items.filter((_, i) => i !== index) })}
                  >
                    Xóa
                  </button>
                </div>
              </div>
              <label className="admin-check">
                <input
                  type="checkbox"
                  role="switch"
                  checked={item.enabled !== false}
                  onChange={(e) => updateItem(index, { enabled: e.target.checked })}
                />
                Hiển thị mục này
              </label>
              <div className="admin-field">
                <label>
                  {faq ? "Câu hỏi" : "Tên nhu cầu"}
                  <input
                    value={item.title || ""}
                    maxLength={240}
                    onChange={(e) => updateItem(index, { title: e.target.value })}
                  />
                </label>
              </div>
              <div className="admin-field">
                <label>
                  {faq ? "Câu trả lời" : "Lời gợi ý cho nhu cầu này"}
                  <textarea
                    rows={3}
                    value={item.text || ""}
                    maxLength={4000}
                    onChange={(e) => updateItem(index, { text: e.target.value })}
                  />
                </label>
              </div>
              <details className="care-assignment">
                <summary>
                  {faq ? "Sản phẩm áp dụng" : "Sản phẩm gợi ý"} · {(item.productIds || []).length} đã chọn
                </summary>
                <div className="care-product-list">
                  {products.map((product) => {
                    const id = String(product.id);
                    return (
                      <label className="care-product-choice" key={id}>
                        <input
                          type="checkbox"
                          checked={item.productIds?.includes(id) || false}
                          onChange={(e) =>
                            updateItem(index, {
                              productIds: e.target.checked
                                ? [...new Set([...(item.productIds || []), id])]
                                : (item.productIds || []).filter((v) => v !== id),
                            })
                          }
                        />
                        <span>
                          #{product.number || "—"} · {product.name}
                          {product.active === false ? " · đang ẩn" : ""}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!products.length && <p className="admin-muted">Chưa có sản phẩm để chọn.</p>}
              </details>
            </div>
          ))}
          <button
            type="button"
            className="admin-btn"
            onClick={() =>
              patch({
                items: [...items, { id: crypto.randomUUID(), title: "", text: "", productIds: [], enabled: true }],
              })
            }
          >
            {faq ? "+ Thêm câu hỏi" : "+ Thêm nhu cầu"}
          </button>
        </div>
      )}

      {tab === "text" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          {[
            ["heading", "Tiêu đề khối"],
            ["body", "Lời giới thiệu"],
            ["itemHeading", faq ? "Chữ câu hỏi" : "Tên nhu cầu và sản phẩm"],
            ["itemBody", faq ? "Chữ trả lời" : "Lời gợi ý và giá"],
            ...(!faq ? [["linkStyle", "Liên kết xem tất cả"]] : []),
          ].map(([key, title]) => (
            <SloganTypographyEditor
              key={key}
              title={title}
              body={key !== "heading"}
              value={form[key]}
              onChange={(next) => patch({ [key]: { ...form[key], ...next } })}
            />
          ))}
        </div>
      )}

      {tab === "card" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <h3>Khung toàn phần</h3>
          <SloganAppearanceEditor
            value={form.card}
            onChange={(next) => patch({ card: { ...form.card, ...next } })}
          />
          <h3>{faq ? "Khung từng câu hỏi" : "Khung sản phẩm gợi ý"}</h3>
          <SloganAppearanceEditor
            allowTitleToggle={!faq}
            value={form.itemCard}
            onChange={(next) => patch({ itemCard: { ...form.itemCard, ...next } })}
          />
        </div>
      )}
    </div>
  );
}

export function ProductSloganBuilderPanel({ slogan, styles, onChangeSlogan, onChangeStyles }) {
  const [tab, setTab] = useState("content");
  const form = { enabled: true, title: "", text: "", ...(slogan || {}) };
  const s = styles || {};
  const updateStyle = (key, patch) => onChangeStyles({ ...s, [key]: { ...(s[key] || {}), ...patch } });

  return (
    <div className="builder-inspector">
      <header className="inspector-heading">
        <small>THIẾT LẬP DÙNG CHUNG</small>
        <h2>Slogan sản phẩm</h2>
        <p>Hiển thị trên trang chi tiết sản phẩm. Chỉnh chữ, cỡ chữ PC/Mobile, màu và khung thẻ.</p>
      </header>
      <nav className="slogan-settings-tabs" aria-label="Nhóm chỉnh Slogan">
        {[
          ["content", "Nội dung"],
          ["text", "Kiểu chữ"],
          ["card", "Khung thẻ"],
        ].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === "content" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <label className="admin-check">
            <input
              type="checkbox"
              role="switch"
              checked={form.enabled !== false}
              onChange={(e) => onChangeSlogan({ ...form, enabled: e.target.checked })}
            />
            Hiển thị Slogan trên chi tiết sản phẩm
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              role="switch"
              checked={s.sloganCard?.showTitle !== false}
              onChange={(e) => updateStyle("sloganCard", { showTitle: e.target.checked })}
            />
            Hiển thị tiêu đề
          </label>
          <div className="admin-field">
            <label>
              Tiêu đề Slogan
              <input
                disabled={s.sloganCard?.showTitle === false}
                maxLength={80}
                value={form.title}
                placeholder="Ví dụ: Triết lý của ORORA"
                onChange={(e) => onChangeSlogan({ ...form, title: e.target.value })}
              />
            </label>
          </div>
          <div className="admin-field">
            <label>
              Nội dung Slogan
              <textarea
                rows={5}
                maxLength={2000}
                value={form.text}
                placeholder="Nhập Slogan của cửa hàng…"
                onChange={(e) => onChangeSlogan({ ...form, text: e.target.value })}
              />
            </label>
          </div>
        </div>
      )}

      {tab === "text" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <SloganTypographyEditor
            title="Chữ tiêu đề"
            value={s.sloganTitle}
            onChange={(patch) => updateStyle("sloganTitle", patch)}
          />
          <SloganTypographyEditor
            title="Chữ nội dung"
            body
            value={s.sloganBody}
            onChange={(patch) => updateStyle("sloganBody", patch)}
          />
        </div>
      )}

      {tab === "card" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <SloganAppearanceEditor
            value={s.sloganCard}
            onChange={(patch) => updateStyle("sloganCard", patch)}
          />
        </div>
      )}
    </div>
  );
}

export function PoliciesPreview({ policies = [], pageContent = {} }) {
  const home = useHomeContent();
  return <div data-admin-preview>
    <ProductAssurances policies={policies} shippingSettings={home.shippingSettings}/>
    <PolicyPage preview={{productPolicies:policies, policyPageContent:pageContent}}/>
  </div>;
}

export function PoliciesBuilderPanel({ policies, pageContent, onChangePolicies, onChangePageContent }) {
  const list = Array.isArray(policies) ? policies : [];
  const content = { returnsText: "", paymentText: "", privacyText: "", ...(pageContent || {}) };
  const patch = (id, next) => onChangePolicies(list.map((item) => (item.id === id ? { ...item, ...next } : item)));

  return (
    <div className="builder-inspector">
      <header className="inspector-heading">
        <small>THIẾT LẬP DÙNG CHUNG</small>
        <h2>Cam kết &amp; Chính sách</h2>
        <p>Chỉnh các cam kết hiển thị cạnh nút mua hàng và 3 mục nội dung trên trang /chinh-sach.</p>
      </header>
      <div className="admin-form">
        {list.map((item, index) => (
          <div className="product-content-section" key={item.id || index}>
            <div className="product-editor-heading">
              <strong>Cam kết {index + 1}</strong>
              <button
                type="button"
                className="admin-btn danger"
                onClick={() => onChangePolicies(list.filter((entry) => entry.id !== item.id))}
              >
                Xóa
              </button>
            </div>
            <label>
              Loại cam kết
              <select value={item.kind || "general"} onChange={(e) => patch(item.id, { kind: e.target.value })}>
                <option value="general">Chung</option>
                <option value="returns">Đổi trả</option>
                <option value="shipping">Giao hàng</option>
                <option value="authenticity">Cam kết sản phẩm</option>
              </select>
            </label>
            <div className="admin-field">
              <label>
                Tên cam kết {index + 1}
                <input
                  value={item.title || ""}
                  onChange={(e) => patch(item.id, { title: e.target.value })}
                  placeholder="Ví dụ: FREESHIP"
                />
              </label>
            </div>
            <div className="admin-field">
              <label>
                Nội dung cam kết {index + 1}
                <textarea
                  rows={3}
                  value={item.content || ""}
                  onChange={(e) => patch(item.id, { content: e.target.value })}
                  placeholder="Nhập chính sách thực tế…"
                />
              </label>
            </div>
            <label className="admin-check">
              <input
                type="checkbox"
                role="switch"
                checked={item.enabled !== false}
                onChange={(e) => patch(item.id, { enabled: e.target.checked })}
              />
              Hiển thị cam kết này
            </label>
          </div>
        ))}
        <button
          type="button"
          className="admin-btn"
          onClick={() =>
            onChangePolicies([
              ...list,
              { id: crypto.randomUUID(), kind: "general", title: "", content: "", enabled: true },
            ])
          }
        >
          + Thêm cam kết
        </button>

        <div className="product-content-section" style={{ marginTop: 14 }}>
          <div className="product-editor-heading">
            <strong>Nội dung trang /chinh-sach</strong>
          </div>
          <div className="admin-field">
            <label>
              1. Kiểm hàng &amp; đổi trả
              <textarea
                rows={3}
                value={content.returnsText}
                onChange={(e) => onChangePageContent({ ...content, returnsText: e.target.value })}
                placeholder="Để trống để dùng mặc định…"
              />
            </label>
          </div>
          <div className="admin-field">
            <label>
              2. Đặt hàng, thanh toán &amp; vận chuyển
              <textarea
                rows={3}
                value={content.paymentText}
                onChange={(e) => onChangePageContent({ ...content, paymentText: e.target.value })}
                placeholder="Để trống để dùng mặc định…"
              />
            </label>
          </div>
          <div className="admin-field">
            <label>
              3. Bảo mật thông tin
              <textarea
                rows={3}
                value={content.privacyText}
                onChange={(e) => onChangePageContent({ ...content, privacyText: e.target.value })}
                placeholder="Để trống để dùng mặc định…"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoriesBuilderPanel() {
  const { categories, error } = useCategories();
  const [name, setName] = useState("");
  const [editId, setEditId] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);

  const submit = async (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setNotice(null);
    try {
      await api.saveCategory({ id: editId || undefined, name: trimmed });
      setName("");
      setEditId("");
      setNotice({ text: editId ? "Đã cập nhật tên danh mục." : "Đã thêm danh mục mới." });
    } catch (cause) {
      setNotice({ error: true, text: api.explainError ? api.explainError(cause) : cause?.message || "Chưa lưu được danh mục." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="builder-inspector">
      <header className="inspector-heading">
        <small>THIẾT LẬP DÙNG CHUNG</small>
        <h2>Danh mục sản phẩm</h2>
        <p>Thêm hoặc đổi tên nhóm sản phẩm. Danh mục được lưu trực tiếp và hiển thị ở bộ lọc sản phẩm.</p>
      </header>
      {error && <p className="admin-error">{api.explainError ? api.explainError(error) : String(error)}</p>}
      {notice && <p role="status" className={notice.error ? "admin-error" : "admin-success"}>{notice.text}</p>}
      <form className="admin-form" onSubmit={submit}>
        <div className="admin-field">
          <label>
            {editId ? "Đổi tên danh mục" : "Tên danh mục mới"}
            <input
              required
              maxLength={80}
              value={name}
              placeholder="Ví dụ: Body Care, Chăm sóc da…"
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        </div>
        <div className="admin-actions">
          <button type="submit" className="admin-btn primary" disabled={busy || !name.trim()}>
            {busy ? "Đang lưu…" : editId ? "Lưu tên mới" : "+ Thêm danh mục"}
          </button>
          {editId && (
            <button
              type="button"
              className="admin-btn"
              onClick={() => {
                setEditId("");
                setName("");
              }}
            >
              Hủy sửa
            </button>
          )}
        </div>
      </form>
      <div className="admin-detail-box" style={{ marginTop: 14 }}>
        <h3>Danh mục hiện có ({categories.length})</h3>
        <div className="admin-actions" style={{ marginTop: 8 }}>
          {categories.map((cat) => (
            <button
              type="button"
              className="admin-btn"
              key={cat.id}
              onClick={() => {
                setEditId(cat.id);
                setName(cat.name);
              }}
            >
              {cat.name} · Sửa
            </button>
          ))}
          {!categories.length && <p className="admin-muted">Chưa có danh mục nào.</p>}
        </div>
      </div>
    </div>
  );
}

export function ShopLinksPreview({ shopLinks }) {
  const methods = availablePaymentMethods({ shopLinks });
  return (
    <div style={{ padding: "32px 24px", maxWidth: 640, margin: "0 auto", fontFamily: "var(--font-body, sans-serif)" }}>
      <h2 style={{ fontFamily: "var(--font-display, Georgia, serif)", color: "#3a1526", margin: "0 0 12px" }}>
        Kênh mua hàng &amp; thanh toán
      </h2>
      <div style={{ padding: 20, borderRadius: 16, border: "1px solid #f0dde5", background: "#fff8fb", marginBottom: 18 }}>
        <strong style={{ display: "block", color: "#3a1526", fontSize: 14, marginBottom: 10 }}>
          Phương thức thanh toán đang bật trên đơn web
        </strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {methods.map((key) => (
            <span
              key={key}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                background: "#ffffff",
                border: "1px solid #e6c6d4",
                color: "#3a1526",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ✓ {PAYMENT_LABELS[key] || key}
            </span>
          ))}
        </div>
      </div>
      <div style={{ padding: 20, borderRadius: 16, border: "1px solid #f0dde5", background: "#ffffff" }}>
        <strong style={{ display: "block", color: "#3a1526", fontSize: 14, marginBottom: 10 }}>
          Nút mua qua kênh ngoài (dưới nút Mua ngay)
        </strong>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {socialShopUrl(shopLinks?.facebookUrl, "facebook") && (
            <span style={{ padding: "9px 18px", borderRadius: 999, background: "#3a1526", color: "#fff", fontSize: 13 }}>
              Facebook
            </span>
          )}
          {socialShopUrl(shopLinks?.tiktokUrl, "tiktok") && (
            <span style={{ padding: "9px 18px", borderRadius: 999, background: "#b8446d", color: "#fff", fontSize: 13 }}>
              TikTok Shop
            </span>
          )}
          {!socialShopUrl(shopLinks?.facebookUrl, "facebook") && !socialShopUrl(shopLinks?.tiktokUrl, "tiktok") && (
            <span style={{ color: "#846b77", fontSize: 13 }}>Đang ẩn cả 2 nút kênh ngoài (chưa nhập link).</span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ShopLinksBuilderPanel({ value, onChange }) {
  const form = {
    tiktokUrl: value?.tiktokUrl || "",
    facebookUrl: value?.facebookUrl || "",
    paymentMethods: availablePaymentMethods({ shopLinks: value }),
  };
  const [warn, setWarn] = useState("");

  const updateUrl = (key, platform, nextVal) => {
    onChange({ ...form, [key]: nextVal });
    if (nextVal.trim() && !socialShopUrl(nextVal, platform)) {
      setWarn(`Link ${platform === "tiktok" ? "TikTok" : "Facebook"} cần là đường dẫn HTTPS hợp lệ của đúng nền tảng.`);
    } else {
      setWarn("");
    }
  };

  const toggleMethod = (key, checked) => {
    const next = checked
      ? [...new Set([...form.paymentMethods, key])]
      : form.paymentMethods.filter((item) => item !== key);
    if (!next.length) {
      setWarn("Cần bật ít nhất 1 phương thức thanh toán cho đơn web.");
      return;
    }
    setWarn("");
    onChange({ ...form, paymentMethods: next });
  };

  return (
    <div className="builder-inspector">
      <header className="inspector-heading">
        <small>CỬA HÀNG</small>
        <h2>Kênh mua &amp; thanh toán</h2>
        <p>Chỉnh link TikTok Shop, Facebook dùng chung cho mọi sản phẩm và bật/tắt phương thức thanh toán.</p>
      </header>
      {warn && <p className="admin-error" role="alert">{warn}</p>}
      <div className="admin-form">
        <div className="admin-field">
          <label>
            TikTok Shop
            <input
              type="url"
              maxLength={2048}
              value={form.tiktokUrl}
              placeholder="https://www.tiktok.com/@..."
              onChange={(e) => updateUrl("tiktokUrl", "tiktok", e.target.value)}
            />
          </label>
        </div>
        <div className="admin-field">
          <label>
            Facebook fanpage / shop
            <input
              type="url"
              maxLength={2048}
              value={form.facebookUrl}
              placeholder="https://www.facebook.com/..."
              onChange={(e) => updateUrl("facebookUrl", "facebook", e.target.value)}
            />
          </label>
        </div>
        <div className="admin-field">
          <span>Phương thức thanh toán cho đơn web</span>
          {Object.entries(PAYMENT_LABELS).map(([key, label]) => (
            <label key={key} className="admin-check">
              <input
                type="checkbox"
                checked={form.paymentMethods.includes(key)}
                onChange={(e) => toggleMethod(key, e.target.checked)}
              />
              {label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function OrderTrackingBuilderPreview({ value }) {
  const [mode, setMode] = useState("phone");
  const [phone,setPhone] = useState("0901234567");
  const [code,setCode] = useState("OW_1024C");
  const form = value || {};
  const styles = form.styles || {};
  const copy = trackingCopy(form);
  return (
    <div className="order-tracking-page" style={{ ...trackingTheme(styles), minHeight: "100%", padding: "24px 16px" }}>
      <div className="order-tracking-shell">
        <div className="order-tracking-heading">
          <span className="product-eyebrow" style={trackingStyle(styles, "eyebrow")}>
            {copy.eyebrow}
          </span>
          <h1 style={trackingStyle(styles, "title")}>{copy.title}</h1>
          <p style={trackingStyle(styles, "intro")}>{copy.intro}</p>
        </div>
        <OrderTrackingSearch
          copy={copy}
          styles={styles}
          mode={mode}
          preview
          onMode={setMode}
          phone={phone}
          onPhone={event=>setPhone(event.target.value)}
          code={code}
          onCode={event=>setCode(event.target.value)}
          busy={false}
          error=""
          onSubmit={(e) => e.preventDefault()}
        />
        <div style={{ marginTop: 18 }}>
          <OrderTrackingDetails order={SAMPLE_TRACKING_ORDER} copy={copy} styles={styles} />
        </div>
      </div>
    </div>
  );
}

export function OrderTrackingBuilderPanel({ value, onChange }) {
  const [tab, setTab] = useState("page");
  const [group, setGroup] = useState("title");
  const form = value || {};
  const styles = form.styles || {};
  const set = (key, nextVal) => onChange({ ...form, [key]: nextVal });
  const patchStyle = (patch) => set("styles", { ...styles, ...patch });
  const textKeys = ORDER_TRACKING_FIELDS.filter(([key]) =>
    tab === "results" ? TRACKING_RESULT_KEYS.includes(key) : !TRACKING_RESULT_KEYS.includes(key),
  );

  return (
    <div className="builder-inspector">
      <header className="inspector-heading">
        <small>CỬA HÀNG</small>
        <h2>Trang tra cứu đơn hàng</h2>
        <p>Chỉnh toàn bộ chữ, thông báo kết quả, kiểu chữ, cỡ chữ PC/Mobile và màu khung tra cứu.</p>
      </header>
      <nav className="slogan-settings-tabs" aria-label="Nhóm chỉnh trang tra cứu">
        {[
          ["page", "Nội dung trang"],
          ["results", "Kết quả"],
          ["styles", "Kiểu chữ & khung"],
        ].map(([id, label]) => (
          <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {["page", "results"].includes(tab) && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <p className="admin-muted">
            Để trống để dùng chữ mặc định. Giữ các biến {"{count}"}, {"{page}"}, {"{pages}"} để tự điền số liệu.
          </p>
          {textKeys.map(([key, label, fallback]) => (
            <div className="admin-field" key={key}>
              <label>
                {label}
                {["intro", "help", "phoneHint", "codeHint", "guideFirstBody", "guideSecondBody", "guideThirdBody", "statusHelp", "resultSummary", "moreHelp"].includes(key) ? (
                  <textarea
                    rows={2} maxLength={2000}
                    value={form[key] || ""}
                    placeholder={fallback}
                    onChange={(e) => set(key, e.target.value)}
                  />
                ) : (
                  <input maxLength={240}
                    value={form[key] || ""}
                    placeholder={fallback}
                    onChange={(e) => set(key, e.target.value)}
                  />
                )}
              </label>
            </div>
          ))}
        </div>
      )}

      {tab === "styles" && (
        <div className="admin-form" style={{ marginTop: 12 }}>
          <div className="admin-field">
            <label>
              Chọn vùng chữ cần chỉnh
              <select value={group} onChange={(e) => setGroup(e.target.value)}>
                {TRACKING_STYLE_GROUPS.map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
            <SloganTypographyEditor
              title={TRACKING_STYLE_GROUPS.find(([key]) => key === group)[1]}
              body
              value={trackingTextSettings(styles,group)}
              onChange={(patch) =>
                patchStyle({ text: { ...styles.text, [group]: { ...trackingTextSettings(styles,group), ...patch } } })
              }
            />
            <fieldset className="slogan-design-editor">
              <legend>Kích thước form</legend>
              <div className="admin-form-grid">
                {[
                  ["formPadding", "Khoảng đệm form (px)", 24, 8, 40],
                  ["fieldHeight", "Chiều cao ô nhập / nút (px)", 46, 44, 60],
                ].map(([key, label, fallback, min, max]) => (
                  <NumberField
                    key={key}
                    label={label}
                    min={min}
                    max={max}
                    fallback={fallback}
                    value={styles[key] ?? fallback}
                    onChange={(next) => patchStyle({ [key]: next === "" ? 0 : next })}
                  />
                ))}
              </div>
            </fieldset>
            <fieldset className="slogan-design-editor">
              <legend>Màu và khung thẻ</legend>
              <div className="admin-form-grid">
                {[
                  ["accent", "Màu nhấn / nút"],
                  ["background", "Màu nền thẻ chính"],
                  ["surface", "Màu nền phụ (tab / hộp gợi ý)"],
                  ["border", "Màu viền"],
                ].map(([key, label]) => (
                  <ColorField
                    key={key}
                    label={label}
                    value={styles[key]}
                    fallback={ORDER_TRACKING_COLOR_DEFAULTS[key]}
                    onChange={(next) => patchStyle({ [key]: next })}
                  />
                ))}
                <NumberField
                  label="Bo góc thẻ (px)"
                  max={40}
                  fallback={24}
                  value={styles.radius ?? styles.cardRadius}
                  onChange={(next) => patchStyle({ radius: next })}
                />
              </div>
            </fieldset>
        </div>
      )}
    </div>
  );
}
