import { useState } from "react";
import { useConfirm } from "../confirm-context";
import { DEFAULT_CARE_GUIDE, normalizeCareGuideGroups } from "../../lib/product-care-guide";
import { SloganAppearanceEditor, SloganTypographyEditor } from "../ProductSloganDesign";
import { SettingGroup } from "./ui";

export default function ProductCareBuilderPanel({
  value,
  products = [],
  activeGroupId,
  onActiveGroupChange,
  onChange,
}) {
  const confirm = useConfirm();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("content");

  const groups = normalizeCareGuideGroups(value, products);
  const resolvedId = groups.some((g) => g.id === activeGroupId) ? activeGroupId : groups[0]?.id || "";
  const active = groups.find((g) => g.id === resolvedId) || null;
  const form = active?.guide ?? DEFAULT_CARE_GUIDE;
  const items = Array.isArray(form.items) ? form.items : [];
  const globalEnabled = value?.enabled !== false;

  const commit = (nextGroups, extra = {}) => {
    onChange({
      ...(value && typeof value === "object" ? value : {}),
      enabled: globalEnabled,
      ...extra,
      groups: nextGroups,
    });
  };

  const patchGuide = (patch) => {
    if (!active) return;
    commit(
      groups.map((group) =>
        group.id === active.id ? { ...group, guide: { ...group.guide, ...patch } } : group,
      ),
    );
  };

  const addGroup = (copy = false) => {
    const id = crypto.randomUUID();
    const nextGroup = {
      id,
      name: copy && active ? `${active.name} — bản sao` : "Bộ chăm sóc mới",
      productIds: [],
      guide: structuredClone(copy && active ? form : DEFAULT_CARE_GUIDE),
    };
    commit([...groups, nextGroup]);
    onActiveGroupChange(id);
    setTab("content");
  };

  const removeGroup = async () => {
    if (!active) return;
    const ok = await confirm(
      "Xóa bộ hướng dẫn này? Sản phẩm đang áp dụng sẽ không còn hướng dẫn sau khi lưu.",
      { title: "Xóa bộ hướng dẫn", confirmLabel: "Xóa bộ", danger: true },
    );
    if (!ok) return;
    const next = groups.filter((group) => group.id !== active.id);
    commit(next);
    onActiveGroupChange(next[0]?.id || "");
  };

  const assignProduct = (productId, checked) => {
    if (!active) return;
    commit(
      groups.map((group) => ({
        ...group,
        productIds:
          group.id === active.id && checked
            ? [...new Set([...(group.productIds || []), productId])]
            : (group.productIds || []).filter((val) => val !== productId),
      })),
    );
  };

  const updateItem = (index, patch) => {
    patchGuide({ items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  };

  const moveItem = (index, direction) => {
    const next = [...items];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    patchGuide({ items: next });
  };

  const filteredProducts = products.filter((product) =>
    `${product.number || ""} ${product.name || ""}`
      .toLocaleLowerCase("vi")
      .includes(query.toLocaleLowerCase("vi")),
  );

  return (
    <div className="builder-settings-inner">
      <SettingGroup title="Cách chăm sóc phù hợp">
        <label className="admin-check">
          <input
            type="checkbox"
            role="switch"
            checked={globalEnabled}
            onChange={(e) => commit(groups, { enabled: e.target.checked })}
          />
          Hiển thị mục Cách chăm sóc trên website
        </label>
        <p className="builder-help">
          Mỗi bộ hướng dẫn áp dụng cho các sản phẩm bạn chọn. Tắt công tắc trên để ẩn toàn bộ mục này trên tất cả
          trang sản phẩm.
        </p>

        <div className="builder-field">
          <label htmlFor="vb-care-guide-group">Bộ hướng dẫn đang sửa</label>
          <select
            id="vb-care-guide-group"
            value={resolvedId}
            onChange={(e) => onActiveGroupChange(e.target.value)}
          >
            {!groups.length && <option value="">Chưa có bộ hướng dẫn</option>}
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name || "Chưa đặt tên"} · {(group.productIds || []).length} sản phẩm
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          <button type="button" className="admin-btn" onClick={() => addGroup(false)}>
            Tạo bộ mới
          </button>
          {active && (
            <>
              <button type="button" className="admin-btn" onClick={() => addGroup(true)}>
                Nhân bản
              </button>
              <button type="button" className="admin-btn danger" onClick={removeGroup}>
                Xóa bộ
              </button>
            </>
          )}
        </div>

        {active && (
          <>
            <div className="builder-field" style={{ marginTop: 12 }}>
              <label>
                Tên bộ hướng dẫn (chỉ dùng trong admin)
                <input
                  value={active.name || ""}
                  maxLength={160}
                  onChange={(e) =>
                    commit(
                      groups.map((group) =>
                        group.id === active.id ? { ...group, name: e.target.value } : group,
                      ),
                    )
                  }
                />
              </label>
            </div>

            <details className="care-assignment">
              <summary>Sản phẩm áp dụng · {(active.productIds || []).length} đã chọn</summary>
              <p className="admin-muted">
                Chọn nhiều sản phẩm để dùng chung nội dung và giao diện. Chuyển một sản phẩm sang bộ này sẽ bỏ áp
                dụng ở bộ cũ.
              </p>
              <div className="admin-field">
                <label>
                  Tìm sản phẩm
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Nhập tên hoặc số thứ tự…"
                  />
                </label>
              </div>
              <div className="care-product-list">
                {filteredProducts.map((product) => {
                  const id = String(product.id);
                  const owner = groups.find(
                    (group) => group.id !== active.id && group.productIds?.includes(id),
                  );
                  return (
                    <label className="care-product-choice" key={id}>
                      <input
                        type="checkbox"
                        checked={active.productIds?.includes(id) || false}
                        onChange={(e) => assignProduct(id, e.target.checked)}
                      />
                      <span>
                        <strong>
                          #{product.number || "—"} · {product.name}
                        </strong>
                        {owner && <small>Đang dùng: {owner.name}</small>}
                      </span>
                    </label>
                  );
                })}
              </div>
              {!products.length && <p className="admin-muted">Chưa có sản phẩm để áp dụng.</p>}
            </details>
          </>
        )}
      </SettingGroup>

      {active && (
        <SettingGroup title="Nội dung & Giao diện bộ đang chọn">
          <nav className="slogan-settings-tabs" aria-label="Nhóm chỉnh sửa cách chăm sóc">
            {[
              ["content", "Nội dung"],
              ["text", "Kiểu chữ"],
              ["card", "Khung và nền"],
            ].map(([id, label]) => (
              <button
                type="button"
                key={id}
                aria-pressed={tab === id}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === "content" && (
            <div data-care-tab="content" style={{ marginTop: 12 }}>
              <label className="admin-check">
                <input
                  type="checkbox"
                  role="switch"
                  checked={form.enabled !== false}
                  onChange={(e) => patchGuide({ enabled: e.target.checked })}
                />
                Bật bộ hướng dẫn này
              </label>

              <div className="builder-field">
                <label>
                  Tiêu đề
                  <input
                    value={form.title || ""}
                    maxLength={160}
                    onChange={(e) => patchGuide({ title: e.target.value })}
                  />
                </label>
              </div>

              <div className="builder-field">
                <label>
                  Lời giới thiệu
                  <textarea
                    rows={3}
                    value={form.text || ""}
                    maxLength={2000}
                    onChange={(e) => patchGuide({ text: e.target.value })}
                  />
                </label>
              </div>

              {items.map((item, i) => (
                <div className="slogan-design-editor" key={item.id || i} style={{ marginTop: 12 }}>
                  <div className="product-editor-heading">
                    <strong>Cách chăm sóc {i + 1}</strong>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={i === 0}
                        onClick={() => moveItem(i, -1)}
                      >
                        Lên
                      </button>
                      <button
                        type="button"
                        className="admin-btn"
                        disabled={i === items.length - 1}
                        onClick={() => moveItem(i, 1)}
                      >
                        Xuống
                      </button>
                      <button
                        type="button"
                        className="admin-btn danger"
                        onClick={() => patchGuide({ items: items.filter((_, n) => n !== i) })}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                  {[
                    ["title", "Tên cách chăm sóc"],
                    ["text", "Nội dung"],
                    ["label", "Chữ liên kết (không bắt buộc)"],
                    ["url", "Đường dẫn (https:// hoặc /…)"],
                  ].map(([key, label]) => (
                    <div className="builder-field" key={key}>
                      <label>
                        {label}
                        {key === "text" ? (
                          <textarea
                            rows={3}
                            value={item[key] || ""}
                            maxLength={4000}
                            onChange={(e) => updateItem(i, { [key]: e.target.value })}
                          />
                        ) : (
                          <input
                            value={item[key] || ""}
                            maxLength={key === "url" ? 2000 : 200}
                            onChange={(e) => updateItem(i, { [key]: e.target.value })}
                          />
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              ))}

              <button
                type="button"
                className="admin-btn"
                style={{ marginTop: 12 }}
                onClick={() =>
                  patchGuide({
                    items: [...items, { id: crypto.randomUUID(), title: "", text: "" }],
                  })
                }
              >
                Thêm cách chăm sóc
              </button>
            </div>
          )}

          {tab === "text" && (
            <div data-care-tab="text" style={{ marginTop: 12 }}>
              {[
                ["heading", "Tiêu đề khối"],
                ["body", "Lời giới thiệu"],
                ["itemHeading", "Tiêu đề từng mục"],
                ["itemBody", "Nội dung từng mục"],
                ["linkStyle", "Chữ liên kết"],
              ].map(([key, title]) => (
                <SloganTypographyEditor
                  key={key}
                  title={title}
                  body={key !== "heading"}
                  value={form[key]}
                  onChange={(patch) => patchGuide({ [key]: { ...form[key], ...patch } })}
                />
              ))}
            </div>
          )}

          {tab === "card" && (
            <div data-care-tab="card" style={{ marginTop: 12 }}>
              <h4>Khung toàn bộ phần chăm sóc</h4>
              <SloganAppearanceEditor
                value={form.card}
                onChange={(patch) => patchGuide({ card: { ...form.card, ...patch } })}
              />
              <h4>Khung từng cách chăm sóc</h4>
              <SloganAppearanceEditor
                value={form.itemCard}
                onChange={(patch) => patchGuide({ itemCard: { ...form.itemCard, ...patch } })}
              />
            </div>
          )}
        </SettingGroup>
      )}
    </div>
  );
}
