import TodayTasks from "./TodayTasks";
import { useEffect, useState } from "react";
import { explainError, getProducts } from "../lib/api";

export default function Dashboard({ pendingCount, onOpenOrder, onOpenInventory, onOpenAnalytics, revision }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    getProducts().then((products) => { if (alive) setCount(products.length); })
      .catch((err) => { if (alive) setError(explainError(err)); });
    return () => { alive = false; };
  }, []);
  return <section>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <h1>Tổng quan</h1>
      {onOpenAnalytics && <button type="button" className="admin-btn" onClick={onOpenAnalytics}>Xem thống kê chi tiết</button>}
    </div>
    <TodayTasks onOpenOrder={onOpenOrder} onOpenInventory={onOpenInventory} revision={revision} />
    {error && <p className="admin-error" role="alert">Không tải được sản phẩm: {error}</p>}
    <div className="admin-grid">
      <div className="admin-card admin-stat"><span className="admin-muted">Sản phẩm</span><strong>{count ?? (error ? "—" : "…")}</strong></div>
      <div className="admin-card admin-stat"><span className="admin-muted">Đơn chờ xác nhận</span><strong>{pendingCount ?? "—"}</strong></div>
      <div className="admin-card admin-stat"><span className="admin-muted">Tải dữ liệu</span><strong style={{ fontSize: 18 }}>{error ? "Có lỗi" : count === null ? "Đang tải…" : "Hoàn tất"}</strong></div>
    </div>
  </section>;
}
