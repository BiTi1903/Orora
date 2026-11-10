export function SectionShell({
  title,
  hint,
  message,
  busy,
  loading,
  loadError,
  onSubmit,
  children,
}) {
  return (
    <form aria-busy={busy} className="admin-card admin-form" onSubmit={onSubmit}>
      {/* HEADER + NÚT LƯU */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          margin: "-24px -24px 24px",
          padding: "18px 24px",
          background: "rgba(255, 250, 253, 0.94)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid #ead9e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>{title}</h2>

          {hint && (
            <p
              className="admin-muted"
              style={{ margin: "5px 0 0" }}
            >
              {hint}
            </p>
          )}
        </div>

        {!loading && (
          <button
            type="submit"
            className="admin-btn primary"
            aria-busy={busy}
            disabled={busy || loadError}
            style={{
              flexShrink: 0,
              minWidth: 120,
              whiteSpace: "nowrap",
            }}
          >
            {busy ? "Đang lưu..." : "💾 Lưu"}
          </button>
        )}
      </div>

      {/* NỘI DUNG */}
      {loading ? (
        <p className="admin-muted">
          Đang tải dữ liệu...
        </p>
      ) : (
        <fieldset disabled={busy || loadError} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>{children}</fieldset>
      )}

      {/* THÔNG BÁO */}
      {message && (
        <div className={`admin-${message.type}`}>
          {message.text}
        </div>
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