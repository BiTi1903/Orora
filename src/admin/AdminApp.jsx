import useOrderNotifications from "./useOrderNotifications";
import EmailExport from "./EmailExport";
import { newsletterRequest } from "./newsletter-api";
import ShippingAdmin from "./ShippingAdmin";
import InventoryAdmin from "./InventoryAdmin";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../lib/firebaseAuth";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";
import HomeAdmin from "./HomeAdmin";
import ProductsAdmin from "./ProductsAdmin";
import OrdersAdmin from "./OrdersAdmin";
import NewsletterAdmin from "./NewsletterAdmin";
import "../styles/admin.css";

const TABS = [
  ["dashboard", "Tổng quan"],
  ["home", "Trang chủ"],
  ["products", "Sản phẩm"],
  ["orders", "Đơn hàng"],
  ["newsletter", "Email"],
  ["inventory", "Kiểm Hàng"],
  ["shipping", "Phí vận chuyển"],
  ["export", "Xuất Excel"],
];

export default function AdminApp() {
  const [user, setUser] = useState(() => auth ? undefined : null);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user === undefined) return <div className="admin-login"><p className="admin-muted">Đang tải...</p></div>;
  if (!user) return <AdminLogin />;
  return <AdminWorkspace key={user.uid} user={user} />;
}

function AdminWorkspace({ user }) {
  const notifications = useOrderNotifications();
  const [pendingRequest, setPendingRequest] = useState(null);
  const [visited, setVisited] = useState([]);
  const navigate = (key) => { setVisited((items) => items.includes(key) ? items : [...items, key]); setTab(key); };
  const [orderMailDraft, setOrderMailDraft] = useState(null);
  const [orderMailVersion, setOrderMailVersion] = useState(0);
  const [emailSection, setEmailSection] = useState({ view: "contacts" });
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">ORORA</div>
        <nav className="admin-nav">
          {TABS.map(([key, label]) => (
            <button key={key} aria-label={label} aria-describedby={key === "orders" && (notifications.snapshot?.pendingCount > 0 || notifications.error) ? "admin-pending-order-count" : undefined} className={tab === key ? "active" : ""} onClick={() => navigate(key)}>
              {label}{key === "orders" && notifications.error && !notifications.snapshot?.pendingCount && <span id="admin-pending-order-count" className="admin-order-count" title={`Chưa cập nhật số đơn: ${notifications.error}`} aria-label="Chưa cập nhật được số đơn chờ">!</span>}{key === "orders" && notifications.snapshot?.pendingCount > 0 && <span id="admin-pending-order-count" className="admin-order-count" aria-label={`${notifications.snapshot.pendingCount} đơn chờ xác nhận`} title={notifications.error ? `Số đã ghi nhận; chưa cập nhật lại: ${notifications.error}` : "Đơn chờ xác nhận · tự cập nhật mỗi phút"}>{notifications.snapshot.pendingCount}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-side-bottom">
          <span className="admin-muted">{user.email}</span>
          <span className="admin-muted" style={{ fontSize: 11 }}>UID: {user.uid}</span>
          <a href="/" className="admin-btn">Xem website</a>
          <button className="admin-btn" onClick={() => signOut(auth)}>Đăng xuất</button>
        </div>
      </aside>

      <main className="admin-main">
        {notifications.incoming && <div className="admin-order-notification" role="status"><div><strong>Có đơn hàng mới · {notifications.incoming.code}</strong><p>{notifications.snapshot?.pendingCount ?? ""} đơn đang chờ xác nhận.</p></div><button type="button" className="admin-btn" onClick={() => { setPendingRequest({ id: notifications.incoming.id }); navigate("orders"); notifications.dismiss(); }}>Xem đơn chờ</button><button type="button" className="notification-dismiss" aria-label="Đóng thông báo đơn mới" onClick={notifications.dismiss}>×</button></div>}

        {tab === "dashboard" && <Dashboard sectionCount={TABS.length} />}
        {tab === "home" && <HomeAdmin />}
        {tab === "products" && <ProductsAdmin />}
        {visited.includes("orders") && <div hidden={tab !== "orders"}><OrdersAdmin refreshKey={notifications.revision} pendingRequest={pendingRequest} onOrderChanged={notifications.refresh} key={`${user.uid}:${orderMailVersion}`} initialMailDraft={orderMailDraft} onOpenEmailTemplates={() => { setEmailSection({ view: "templates" }); navigate("newsletter"); }} /></div>}
        {tab === "export" && <EmailExport key={user.uid} request={newsletterRequest} />}
        {visited.includes("shipping") && <div hidden={tab !== "shipping"}><ShippingAdmin key={user.uid} /></div>}
        {visited.includes("inventory") && <div hidden={tab !== "inventory"}><InventoryAdmin key={user.uid} /></div>}
        {visited.includes("newsletter") && <div hidden={tab !== "newsletter"}><NewsletterAdmin initialView={emailSection.view} viewRequest={emailSection} onOpenOrderMail={(draft) => { setOrderMailDraft(draft); setOrderMailVersion((value) => value + 1); navigate("orders"); }} /></div>}
      </main>
    </div>
  );
}