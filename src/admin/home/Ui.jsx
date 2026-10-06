export function SectionShell({ title, hint, message, busy, loading, onSubmit, children }) {
  return (
    <form className="admin-card admin-form" onSubmit={onSubmit}>
      <div>
        <h2>{title}</h2>
        {hint && <p className="admin-muted">{hint}</p>}
      </div>

      {loading ? <p className="admin-muted">Đang tải dữ liệu...</p> : children}

      {message && <div className={`admin-${message.type}`}>{message.text}</div>}

      {!loading && (
        <button className="admin-btn primary" disabled={busy}>
          {busy ? "Đang lưu..." : "Lưu phần này"}
        </button>
      )}
    </form>
  );
}

export function Field({ label, name, form, change, rows }) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {rows ? (
        <textarea rows={rows} name={name} value={form[name] || ""} onChange={change} />
      ) : (
        <input name={name} value={form[name] || ""} onChange={change} />
      )}
    </div>
  );
}

/* danh sách các thẻ con (Lý do chọn, Số liệu, Quy trình, Cảm nhận) */
export function ItemCards({ title, listKey, h, fields, blank }) {
  const items = h.form[listKey] || [];
  return (
    <div className="admin-list-block">
      {items.map((item, i) => (
        <div className="admin-sub" key={i}>
          <div className="admin-sub-head">
            <h3>{title} {i + 1}</h3>
            <button type="button" className="admin-btn danger" onClick={() => h.removeItem(listKey, i)}>
              Xóa
            </button>
          </div>

          {fields.map((f) => (
            <div className="admin-field" key={f.key}>
              <label>{f.label}</label>
              {f.rows ? (
                <textarea
                  rows={f.rows}
                  value={item[f.key] || ""}
                  onChange={(e) => h.updateItem(listKey, i, f.key, e.target.value)}
                />
              ) : (
                <input
                  type={f.number ? "number" : "text"}
                  value={item[f.key] ?? ""}
                  onChange={(e) =>
                    h.updateItem(listKey, i, f.key, f.number ? Number(e.target.value) || 0 : e.target.value)
                  }
                />
              )}
            </div>
          ))}
        </div>
      ))}

      <button type="button" className="admin-btn" onClick={() => h.addItem(listKey, blank)}>
        + Thêm {title.toLowerCase()}
      </button>
    </div>
  );
}