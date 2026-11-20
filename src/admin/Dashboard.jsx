import TodayTasks from "./TodayTasks";
import { useEffect, useState } from "react";
import { explainError, getProducts } from "../lib/api";

export default function Dashboard({ pendingCount, statusCounts, onOpenOrder, onOpenOrders, onOpenProducts, onOpenInventory, onOpenAnalytics, revision }) {
  const [count, setCount] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    getProducts().then((products) => { if (alive) setCount(products.length); })
      .catch((err) => { if (alive) setError(explainError(err)); });
    return () => { alive = false; };
  }, []);
  const inProgressCount = statusCounts ? (statusCounts.confirmed || 0) + (statusCounts.shipping || 0) : null;
  const completedCount = statusCounts?.completed ?? null;
  return <section>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <h1>Tổng quan</h1>
      {onOpenAnalytics && <button type="button" className="admin-btn" onClick={onOpenAnalytics}>Xem thống kê chi tiết</button>}
    </div>
    <TodayTasks onOpenOrder={onOpenOrder} onOpenInventory={onOpenInventory} revision={revision} />
    {error && <p className="admin-error" role="alert">Không tải được sản phẩm: {error}</p>}
    <div className="admin-grid">
      <button type="button" className="admin-card admin-stat" style={{ textAlign: "left", cursor: onOpenProducts ? "pointer" : "default" }} onClick={onOpenProducts}><span className="admin-muted">Sản phẩm</span><strong>{count ?? (error ? "—" : "…")}</strong></button>
      <button type="button" className="admin-card admin-stat" style={{ textAlign: "left", cursor: onOpenOrders ? "pointer" : "default" }} onClick={() => onOpenOrders?.(false)}><span className="admin-muted">Đơn chờ xác nhận</span><strong>{pendingCount ?? "—"}</strong></button>
      <button type="button" className="admin-card admin-stat" style={{ textAlign: "left", cursor: onOpenOrders ? "pointer" : "default" }} onClick={() => onOpenOrders?.(true)}><span className="admin-muted">Đang xử lý & giao</span><strong>{inProgressCount ?? "—"}</strong></button>
      <button type="button" className="admin-card admin-stat" style={{ textAlign: "left", cursor: onOpenOrders ? "pointer" : "default" }} onClick={() => onOpenOrders?.(true)}><span className="admin-muted">Đơn hoàn tất</span><strong>{completedCount ?? "—"}</strong></button>
    </div>
  </section>;
}
