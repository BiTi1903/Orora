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
  return <section className="admin-overview">
    <div className="admin-top">
      <h1>Tổng quan</h1>
      {onOpenAnalytics && <button type="button" className="admin-btn" onClick={onOpenAnalytics}>Xem thống kê</button>}
    </div>
    {error && <p className="admin-error" role="alert">Không tải được sản phẩm: {error}</p>}
    <div className="admin-grid admin-overview-grid">
      <button type="button" className="admin-card admin-stat" onClick={onOpenProducts}>
        <span className="admin-muted">Sản phẩm</span>
        <strong>{count ?? (error ? "—" : "…")}</strong>
      </button>
      <button type="button" className={`admin-card admin-stat${pendingCount > 0 ? " is-highlight" : ""}`} onClick={() => onOpenOrders?.(false)}>
        <span className="admin-muted">Đơn chờ xác nhận</span>
        <strong>{pendingCount ?? "—"}</strong>
      </button>
      <button type="button" className="admin-card admin-stat" onClick={() => onOpenOrders?.(true)}>
        <span className="admin-muted">Đang xử lý & giao</span>
        <strong>{inProgressCount ?? "—"}</strong>
      </button>
      <button type="button" className="admin-card admin-stat" onClick={() => onOpenOrders?.(true)}>
        <span className="admin-muted">Đơn hoàn tất</span>
        <strong>{completedCount ?? "—"}</strong>
      </button>
    </div>
    <TodayTasks onOpenOrder={onOpenOrder} onOpenInventory={onOpenInventory} revision={revision} />
  </section>;
}
