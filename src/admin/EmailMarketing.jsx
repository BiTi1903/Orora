import { useEffect, useState, useCallback } from "react";

const BULK_SECRET_KEY = "orora_bulk_mail_secret";

function getSecret() {
  return localStorage.getItem(BULK_SECRET_KEY) || "";
}

function authHeaders() {
  return {
    Authorization: `Bearer ${getSecret()}`,
    "Content-Type": "application/json",
  };
}

/* ============================================================
   EMAIL TEMPLATE MẪU QUẢNG CÁO
============================================================ */

function getDefaultTemplate(type = "promo") {
  if (type === "welcome") {
    return {
      subject: "ORORA – Cảm ơn bạn đã đăng ký nhận tin ✨",
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f8;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(184,68,109,0.1)">
  <div style="background:linear-gradient(135deg,#fde2ec,#fff0f5);padding:40px 30px;text-align:center">
    <h1 style="font-family:Georgia,serif;font-size:32px;color:#3a1526;margin:0">ORORA</h1>
    <p style="color:#b8446d;font-size:14px;letter-spacing:2px;margin-top:8px">SKINCARE & BEAUTY</p>
  </div>
  <div style="padding:40px 30px">
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#3a1526;margin:0 0 16px">Chào bạn! 💕</h2>
    <p style="font-size:15px;line-height:1.8;color:#5a3a4a">Cảm ơn bạn đã đăng ký nhận tin từ ORORA. Từ giờ bạn sẽ là người đầu tiên biết về:</p>
    <ul style="font-size:14px;line-height:2;color:#5a3a4a;padding-left:20px">
      <li>🌸 Sản phẩm mới ra mắt</li>
      <li>🎁 Ưu đãi độc quyền dành cho subscriber</li>
      <li>✨ Tips chăm sóc da từ chuyên gia ORORA</li>
    </ul>
    <div style="text-align:center;margin:30px 0">
      <a href="https://ororavn.com" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ee7fa2,#b8446d);color:#fff;text-decoration:none;border-radius:40px;font-size:14px;font-weight:500;letter-spacing:1px">Khám phá ngay →</a>
    </div>
  </div>
  <div style="background:#fff5f8;padding:24px 30px;text-align:center;font-size:12px;color:#b8446d">
    <p style="margin:0">© 2026 ORORA. All rights reserved.</p>
    <p style="margin:6px 0 0">Trả lời "Hủy đăng ký" để ngừng nhận tin.</p>
  </div>
</div>
</body></html>`,
    };
  }

  return {
    subject: "🌸 ORORA – Ưu đãi đặc biệt dành riêng cho bạn!",
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fff5f8;font-family:'Segoe UI',Arial,sans-serif">
<div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(184,68,109,0.1)">
  <div style="background:linear-gradient(135deg,#fde2ec,#fff0f5);padding:40px 30px;text-align:center">
    <h1 style="font-family:Georgia,serif;font-size:32px;color:#3a1526;margin:0">ORORA</h1>
    <p style="color:#b8446d;font-size:14px;letter-spacing:2px;margin-top:8px">SKINCARE & BEAUTY</p>
  </div>
  <div style="padding:40px 30px">
    <h2 style="font-family:Georgia,serif;font-size:24px;color:#3a1526;margin:0 0 16px">Ưu đãi đặc biệt! 🎉</h2>
    <p style="font-size:15px;line-height:1.8;color:#5a3a4a">Chào bạn yêu,</p>
    <p style="font-size:15px;line-height:1.8;color:#5a3a4a">ORORA gửi đến bạn ưu đãi đặc biệt tuần này:</p>
    <div style="background:linear-gradient(135deg,#fde2ec,#fff0f5);border-radius:16px;padding:24px;margin:20px 0;text-align:center">
      <p style="font-family:Georgia,serif;font-size:36px;color:#b8446d;margin:0;font-weight:600">GIẢM 20%</p>
      <p style="font-size:14px;color:#5a3a4a;margin:8px 0 0">Cho tất cả sản phẩm skincare</p>
    </div>
    <p style="font-size:14px;line-height:1.8;color:#5a3a4a">⏰ Ưu đãi có hạn đến hết tuần này. Đừng bỏ lỡ nhé!</p>
    <div style="text-align:center;margin:30px 0">
      <a href="https://ororavn.com" style="display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#ee7fa2,#b8446d);color:#fff;text-decoration:none;border-radius:40px;font-size:14px;font-weight:500;letter-spacing:1px">Mua ngay →</a>
    </div>
  </div>
  <div style="background:#fff5f8;padding:24px 30px;text-align:center;font-size:12px;color:#b8446d">
    <p style="margin:0">© 2026 ORORA. All rights reserved.</p>
    <p style="margin:6px 0 0">Trả lời "Hủy đăng ký" để ngừng nhận tin.</p>
  </div>
</div>
</body></html>`,
  };
}

/* ============================================================
   COMPONENT CHÍNH
============================================================ */

export default function EmailMarketing() {
  const [secret, setSecret] = useState(getSecret);
  const [secretInput, setSecretInput] = useState("");
  const [tab, setTab] = useState("subscribers"); // subscribers | compose | logs
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Compose state
  const [subject, setSubject] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleLogin = (e) => {
    e.preventDefault();
    localStorage.setItem(BULK_SECRET_KEY, secretInput);
    setSecret(secretInput);
    setSecretInput("");
  };

  const handleLogout = () => {
    localStorage.removeItem(BULK_SECRET_KEY);
    setSecret("");
    setSubscribers([]);
  };

  // Tải subscribers
  const loadSubscribers = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    clearMessages();

    try {
      const res = await fetch("/api/subscribers", {
        headers: authHeaders(),
      });
      const data = await res.json();

      if (data.ok) {
        setSubscribers(data.subscribers || []);
      } else {
        setError(data.message || "Lỗi tải danh sách.");
        if (res.status === 401) handleLogout();
      }
    } catch {
      setError("Không thể kết nối server.");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    if (secret && tab === "subscribers") {
      loadSubscribers();
    }
  }, [secret, tab, loadSubscribers]);

  // Xóa subscriber
  const handleDelete = async (id, email) => {
    if (!confirm(`Xóa subscriber ${email}?`)) return;
    clearMessages();

    try {
      const res = await fetch("/api/subscribers", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (data.ok) {
        setSubscribers((prev) => prev.filter((s) => s.id !== id));
        setSuccess(`Đã xóa ${email}`);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Không thể xóa subscriber.");
    }
  };

  // Load template mẫu
  const loadTemplate = (type) => {
    const tpl = getDefaultTemplate(type);
    setSubject(tpl.subject);
    setHtmlContent(tpl.html);
    setSendResult(null);
  };

  // Gửi email hàng loạt
  const handleSend = async () => {
    if (!subject.trim() || !htmlContent.trim()) {
      setError("Vui lòng nhập tiêu đề và nội dung email.");
      return;
    }

    if (
      !confirm(
        `Bạn sắp gửi email đến ${subscribers.length} subscriber.\n\nTiêu đề: ${subject}\n\nXác nhận gửi?`
      )
    )
      return;

    setSending(true);
    clearMessages();
    setSendResult(null);

    try {
      const res = await fetch("/api/bulk-mail", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          subject,
          htmlContent,
        }),
      });
      const data = await res.json();

      if (data.ok) {
        setSendResult(data);
        setSuccess(data.message);
      } else {
        setError(data.message || "Gửi email thất bại.");
      }
    } catch {
      setError("Không thể kết nối server.");
    } finally {
      setSending(false);
    }
  };

  // Chưa đăng nhập
  if (!secret) {
    return (
      <section>
        <h1>Email Marketing</h1>
        <p className="admin-muted" style={{ marginBottom: 20 }}>
          Nhập mã bảo mật (BULK_MAIL_SECRET trên Vercel) để truy cập.
        </p>
        <form onSubmit={handleLogin} className="admin-form" style={{ maxWidth: 400 }}>
          <div className="admin-field">
            <label>Mã bảo mật</label>
            <input
              type="password"
              value={secretInput}
              onChange={(e) => setSecretInput(e.target.value)}
              placeholder="Nhập BULK_MAIL_SECRET"
              required
            />
          </div>
          <button className="admin-btn primary" type="submit">
            Truy cập
          </button>
        </form>
      </section>
    );
  }

  const activeCount = subscribers.filter((s) => s.status === "active").length;

  return (
    <section>
      <div className="admin-top">
        <div>
          <h1>Email Marketing</h1>
          <p className="admin-muted">Quản lý subscribers và gửi email quảng cáo</p>
        </div>
        <button className="admin-btn" onClick={handleLogout}>
          Đăng xuất Mail
        </button>
      </div>

      {/* Thống kê */}
      <div className="admin-grid" style={{ marginBottom: 24 }}>
        <div className="admin-card admin-stat">
          <span className="admin-muted">Tổng subscriber</span>
          <strong>{subscribers.length}</strong>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-muted">Đang hoạt động</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="admin-card admin-stat">
          <span className="admin-muted">Email gửi từ</span>
          <strong style={{ fontSize: 16 }}>sales@ororavn.com</strong>
        </div>
      </div>

      {/* Tab buttons */}
      <div className="home-admin-mode" style={{ marginBottom: 20 }}>
        <button
          className={tab === "subscribers" ? "active" : ""}
          onClick={() => { setTab("subscribers"); clearMessages(); }}
        >
          📋 Danh sách Subscribers
        </button>
        <button
          className={tab === "compose" ? "active" : ""}
          onClick={() => { setTab("compose"); clearMessages(); }}
        >
          ✉️ Soạn & Gửi Email
        </button>
      </div>

      {/* Messages */}
      {error && <p className="admin-error" style={{ marginBottom: 16 }}>{error}</p>}
      {success && <p className="admin-success" style={{ marginBottom: 16 }}>{success}</p>}

      {/* TAB: SUBSCRIBERS */}
      {tab === "subscribers" && (
        <div className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ margin: 0 }}>Danh sách đăng ký</h2>
            <button className="admin-btn" onClick={loadSubscribers} disabled={loading}>
              {loading ? "Đang tải…" : "🔄 Làm mới"}
            </button>
          </div>

          {subscribers.length === 0 ? (
            <div className="admin-empty">
              <p>Chưa có subscriber nào.</p>
              <p className="admin-muted">Khi khách hàng đăng ký nhận tin trên website, email sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Email</th>
                    <th>Trạng thái</th>
                    <th>Mail</th>
                    <th>Ngày đăng ký</th>
                    <th>Nguồn</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub, i) => (
                    <tr key={sub.id}>
                      <td>{i + 1}</td>
                      <td><strong>{sub.email}</strong></td>
                      <td>
                        <span className={`admin-badge ${sub.status === "active" ? "" : "off"}`}>
                          {sub.status === "active" ? "Hoạt động" : sub.status || "—"}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-badge ${sub.mailStatus === "accepted" ? "" : "off"}`}>
                          {sub.mailStatus === "accepted"
                            ? "Đã gửi"
                            : sub.mailStatus === "pending"
                            ? "Chờ gửi"
                            : sub.mailStatus === "failed"
                            ? "Lỗi"
                            : sub.mailStatus || "—"}
                        </span>
                      </td>
                      <td className="admin-muted">
                        {sub.createdAt
                          ? new Date(sub.createdAt).toLocaleDateString("vi-VN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                      <td className="admin-muted">{sub.source || "—"}</td>
                      <td>
                        <button
                          className="admin-btn danger"
                          style={{ padding: "6px 14px", fontSize: 12 }}
                          onClick={() => handleDelete(sub.id, sub.email)}
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: COMPOSE */}
      {tab === "compose" && (
        <div className="admin-card">
          <h2 style={{ marginBottom: 16 }}>Soạn email quảng cáo</h2>

          {/* Template buttons */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            <button className="admin-btn" onClick={() => loadTemplate("promo")}>
              🎁 Mẫu khuyến mãi
            </button>
            <button className="admin-btn" onClick={() => loadTemplate("welcome")}>
              💌 Mẫu chào mừng
            </button>
          </div>

          <div className="admin-form">
            <div className="admin-field">
              <label>Tiêu đề email</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="VD: 🌸 ORORA – Ưu đãi đặc biệt dành riêng cho bạn!"
              />
            </div>

            <div className="admin-field">
              <label>
                Nội dung HTML{" "}
                <button
                  type="button"
                  onClick={() => setPreviewOpen(!previewOpen)}
                  style={{
                    border: 0,
                    background: "none",
                    color: "#b8446d",
                    cursor: "pointer",
                    fontSize: 13,
                    textDecoration: "underline",
                  }}
                >
                  {previewOpen ? "Ẩn xem trước" : "Xem trước"}
                </button>
              </label>
              <textarea
                rows={14}
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Dán nội dung HTML email vào đây, hoặc chọn mẫu ở trên…"
                style={{ fontFamily: "monospace", fontSize: 13 }}
              />
            </div>

            {/* Preview */}
            {previewOpen && htmlContent && (
              <div style={{ border: "1px solid #f7b8d0", borderRadius: 16, overflow: "hidden" }}>
                <div style={{ padding: "10px 16px", background: "#fff0f5", fontSize: 13, color: "#b8446d", fontWeight: 500 }}>
                  📧 Xem trước email
                </div>
                <div
                  style={{ padding: 20, background: "#fff" }}
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <button
                className="admin-btn primary"
                onClick={handleSend}
                disabled={sending || !subject.trim() || !htmlContent.trim()}
              >
                {sending
                  ? "⏳ Đang gửi…"
                  : `📤 Gửi đến ${activeCount} subscribers`}
              </button>

              {sendResult && (
                <span className="admin-muted">
                  ✅ Thành công: {sendResult.sent} | ❌ Thất bại: {sendResult.failed} | Tổng: {sendResult.total}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
