import AnalyticsDashboard from "./AnalyticsDashboard";
import { useEffect, useState } from "react";
import { explainError, getProducts } from "../lib/api";

export default function Dashboard({ sectionCount }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    getProducts().then((products) => { if (alive) setCount(products.length); })
      .catch((err) => { if (alive) setError(explainError(err)); });
    return () => { alive = false; };
  }, []);
  return <section>
    <h1>Tổng quan</h1>
    {error && <p className="admin-error" role="alert">Không tải được sản phẩm: {error}</p>}
    <div className="admin-grid">
      <div className="admin-card admin-stat"><span className="admin-muted">Sản phẩm</span><strong>{count ?? (error ? "—" : "…")}</strong></div>
      <div className="admin-card admin-stat"><span className="admin-muted">Mục quản trị</span><strong>{sectionCount ?? "—"}</strong></div>
      <div className="admin-card admin-stat"><span className="admin-muted">Tải dữ liệu</span><strong style={{ fontSize: 18 }}>{error ? "Có lỗi" : count === null ? "Đang tải…" : "Hoàn tất"}</strong></div>
    </div>
    <AnalyticsDashboard />
  </section>;
}
