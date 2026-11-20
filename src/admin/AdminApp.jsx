import ConfirmProvider from "./ConfirmDialog";
import { useConfirm } from "./confirm-context";
import "../styles/product-detail.css";
import { dirtyRegistry } from "../lib/dirty-registry";
import useOrderNotifications from "./useOrderNotifications";
import { newsletterRequest } from "./newsletter-api";
import { lazy, Suspense, useEffect, useState } from "react";
import { auth, onAuthStateChanged, signOut } from "../lib/firebaseAuth";
import AdminLogin from "./AdminLogin";
import "../styles/admin.css";

const Dashboard = lazy(() => import("./Dashboard"));
const AnalyticsDashboard = lazy(() => import("./AnalyticsDashboard"));
const HomeAdmin = lazy(() => import("./HomeAdmin"));
const ProductsAdmin = lazy(() => import("./ProductsAdmin"));
const OrdersAdmin = lazy(() => import("./OrdersAdmin"));
const NewsletterAdmin = lazy(() => import("./NewsletterAdmin"));
const ShippingAdmin = lazy(() => import("./ShippingAdmin"));
const InventoryAdmin = lazy(() => import("./InventoryAdmin"));
const ChatSettings = lazy(() => import("./ChatSettings"));
const EmailExport = lazy(() => import("./EmailExport"));

/* Menu chia nhóm theo công việc; mỗi mục là [khóa, nhãn]. */
const GROUPS = [
  { title: null, items: [["dashboard", "Tổng quan"], ["analytics", "Thống kê"]] },
  { title: "Bán hàng", items: [["orders", "Đơn hàng"], ["inventory", "Kiểm kho"], ["shipping", "Phí vận chuyển"]] },
  { title: "Giao diện và nội dung", items: [["home", "Trang chủ"], ["products", "Sản phẩm"], ["store", "Cửa hàng"]] },
  { title: "Khách hàng", items: [["newsletter", "Email"], ["chat", "Chat AI"], ["export", "Xuất danh sách email"]] },
];

const ALL_TABS = GROUPS.flatMap((group) => group.items.map(([key]) => key));

export default function AdminApp() {
  const [user, setUser] = useState(() => auth ? undefined : null);
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user === undefined) return <div className="admin-login"><p className="admin-muted">Đang tải...</p></div>;
  if (!user) return <AdminLogin />;
  return <ConfirmProvider key={user.uid}><AdminWorkspace user={user} /></ConfirmProvider>;
}

function OrderBadge({ notifications }) {
  const pending = notifications.snapshot?.pendingCount;
  if (notifications.error && !pending) return <span id="admin-pending-order-count" className="admin-order-count" title={`Chưa cập nhật số đơn: ${notifications.error}`} aria-label="Chưa cập nhật được số đơn chờ">!</span>;
  if (pending > 0) return <span id="admin-pending-order-count" className="admin-order-count" aria-label={`${pending} đơn chờ xác nhận`} title={notifications.error ? `Số đã ghi nhận; chưa cập nhật lại: ${notifications.error}` : "Đơn chờ xác nhận · tự cập nhật mỗi phút"}>{pending}</span>;
  return null;
}

const initialAdminTab = () => {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  if (ALL_TABS.includes(hash)) return hash;
  return "dashboard";
};

function AdminWorkspace({ user }) {
  const confirm = useConfirm();
  const notifications = useOrderNotifications();
  const [pendingRequest, setPendingRequest] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const [tab, setTab] = useState(initialAdminTab);
  const [orderMailDraft, setOrderMailDraft] = useState(null);
  const [orderMailVersion, setOrderMailVersion] = useState(0);
  const [emailSection, setEmailSection] = useState({ view: "contacts" });
  const [storeSection, setStoreSection] = useState("links");
  const [storeVersion, setStoreVersion] = useState(0);

  const navigate = async (key, { force = false } = {}) => {
    if (!ALL_TABS.includes(key) || key === tab) return;
    const sameBuilder = (tab === "home" || tab === "store") && (key === "home" || key === "store");
    if (!force && !sameBuilder && dirtyRegistry.hasChanges()) {
      const ok = await confirm("Bạn có thay đổi chưa lưu. Chuyển sang mục khác và bỏ các thay đổi này?", {
        title: "Thay đổi chưa lưu",
        confirmLabel: "Rời mục",
        danger: true,
      });
      if (!ok) return;
    }
    setTab(key);
    if (typeof window !== "undefined" && window.location.hash !== `#${key}`) window.history.replaceState(null, "", `#${key}`);
  };

  useEffect(() => {
    const onHash = () => setTab(initialAdminTab());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const open = (event) => {
      setStoreVersion((v) => v + 1);
      setStoreSection(event.detail?.section || "links");
      setTab("store");
      if (typeof window !== "undefined") window.history.replaceState(null, "", "#store");
    };
    window.addEventListener("orora-admin-store", open);
    return () => window.removeEventListener("orora-admin-store", open);
  }, []);

  const orderBadgeShown = notifications.snapshot?.pendingCount > 0 || notifications.error;

  const renderActiveTab = () => {
    if (tab === "dashboard") {
      return (
        <Dashboard
          pendingCount={notifications.snapshot?.pendingCount}
          revision={notifications.revision}
          onOpenOrder={(id) => { setPendingRequest({ id, allStatuses: true }); navigate("orders"); }}
          onOpenInventory={() => navigate("inventory")}
          onOpenAnalytics={() => navigate("analytics")}
        />
      );
    }
    if (tab === "analytics") {
      return <section><h1>Thống kê</h1><AnalyticsDashboard /></section>;
    }
    if (tab === "home" || tab === "store") {
      return <HomeAdmin workspace={tab === "store" ? "store" : "home"} storeSection={storeSection} storeVersion={storeVersion} />;
    }
    if (tab === "products") return <ProductsAdmin />;
    if (tab === "chat") return <ChatSettings />;
    if (tab === "orders") {
      return (
        <OrdersAdmin
          statusCounts={notifications.snapshot?.counts}
          refreshKey={notifications.revision}
          pendingRequest={pendingRequest}
          onOrderChanged={notifications.refresh}
          key={`${user.uid}:${orderMailVersion}`}
          initialMailDraft={orderMailDraft}
          canEditStore
          canUseNewsletter
          onOpenEmailTemplates={() => { setEmailSection({ view: "templates" }); navigate("newsletter"); }}
        />
      );
    }
    if (tab === "shipping") return <ShippingAdmin key={user.uid} />;
    if (tab === "inventory") return <InventoryAdmin key={user.uid} />;
    if (tab === "newsletter") {
      return (
        <NewsletterAdmin
          initialView={emailSection.view}
          viewRequest={emailSection}
          onOpenOrderMail={(draft) => { setPendingRequest(null); setOrderMailDraft(draft); setOrderMailVersion((value) => value + 1); navigate("orders"); }}
        />
      );
    }
    if (tab === "export") return <EmailExport key={user.uid} request={newsletterRequest} />;
    return null;
  };

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">ORORA</div>
        <nav className="admin-nav" aria-label="Menu quản trị">
          {GROUPS.map(({ title, items }) => (
            <div className="admin-nav-group" key={title || "main"} role="group" aria-label={title || undefined}>
              {title && <span className="admin-nav-title" aria-hidden="true">{title}</span>}
              {items.map(([key, label]) => (
                <button key={key} aria-label={label} aria-describedby={key === "orders" && orderBadgeShown ? "admin-pending-order-count" : undefined} aria-current={tab === key ? "page" : undefined} className={tab === key ? "active" : ""} onClick={() => navigate(key)}>
                  {label}{key === "orders" && <OrderBadge notifications={notifications} />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div className="admin-side-bottom">
          <span className="admin-muted">{user.email}</span>
          <details className="admin-muted admin-uid"><summary>Mã tài khoản (UID)</summary><span>{user.uid}</span></details>
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn">Xem website</a>
          {signOutError && <p className="admin-error" role="alert">{signOutError}</p>}
          <button className="admin-btn" onClick={async () => { if (!dirtyRegistry.hasChanges() || await confirm("Bạn có thay đổi chưa lưu. Đăng xuất và bỏ những thay đổi này?", { title: "Đăng xuất", confirmLabel: "Đăng xuất", danger: true })) { setSignOutError(""); try { await signOut(auth); } catch { setSignOutError("Chưa thể đăng xuất lúc này. Vui lòng thử lại."); } } }}>Đăng xuất</button>
        </div>
      </aside>

      <main className="admin-main">
        {notifications.incoming && <div className="admin-order-notification" role="status"><div><strong>Có đơn hàng mới · {notifications.incoming.code}</strong><p>{notifications.snapshot?.pendingCount ?? ""} đơn đang chờ xác nhận.</p></div><button type="button" className="admin-btn" onClick={() => { setPendingRequest({ id: notifications.incoming.id }); navigate("orders"); notifications.dismiss(); }}>Xem đơn chờ</button><button type="button" className="notification-dismiss" aria-label="Đóng thông báo đơn mới" onClick={notifications.dismiss}>×</button></div>}
        <Suspense fallback={<div className="admin-card"><p className="admin-muted">Đang tải mục quản trị…</p></div>}>
          {renderActiveTab()}
        </Suspense>
      </main>
    </div>
  );
}
