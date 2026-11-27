import ConfirmProvider from "./ConfirmDialog";
import { useConfirm } from "./confirm-context";
import "../styles/product-detail.css";
import { dirtyRegistry } from "../lib/dirty-registry";
import useOrderNotifications from "./useOrderNotifications";
import { orderRequest } from "./order-api";
import { newsletterRequest } from "./newsletter-api";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { auth, onAuthStateChanged, signOut } from "../lib/firebaseAuth";
import AdminLogin from "./AdminLogin";
import { clearAdminCache, prefetchAdminTab } from "./admin-cache";
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
const MailReview = lazy(() => import("./MailReview"));
const TranslationAdmin = lazy(() => import("./TranslationAdmin"));
const EmailExport = lazy(() => import("./EmailExport"));

/* Menu chia nhóm theo công việc; mỗi mục là [khóa, nhãn]. */
const GROUPS = [
  { title: null, items: [["dashboard", "Tổng quan"], ["analytics", "Thống kê"]] },
  { title: "Bán hàng", items: [["orders", "Đơn hàng"], ["inventory", "Kiểm kho"], ["shipping", "Phí vận chuyển"]] },
  { title: "Giao diện và nội dung", items: [["home", "Trang chủ"], ["products", "Sản phẩm"], ["translations", "Bản dịch"]] },
  { title: "Khách hàng", items: [["newsletter", "Email"], ["mail-review", "Thư cần xử lý"], ["chat", "Chat AI"], ["export", "Xuất danh sách email"]] },
];

const sharesBuilder = (from,to) => [from,to].every(key => key === "home" || key === "store");

const ALL_TABS = [...GROUPS.flatMap((group) => group.items.map(([key]) => key)), "store"]; // Legacy store URLs open the builder.

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
  if (typeof window === "undefined") return "dashboard";
  const pathMatch = /^\/admin\/([a-z-]+)\/?$/i.exec(window.location.pathname);
  if (pathMatch && ALL_TABS.includes(pathMatch[1])) return pathMatch[1];
  const hash = window.location.hash.replace(/^#/, "");
  if (ALL_TABS.includes(hash)) return hash;
  return "dashboard";
};

function syncAdminUrl(key, replace = false) {
  if (typeof window === "undefined") return;
  const position = window.history.state?.adminPosition ?? 0;
  const state = {...window.history.state, adminPosition: position + (replace ? 0 : 1)};
  const method = replace ? "replaceState" : "pushState";
  if (window.location.pathname.startsWith("/admin")) {
    const nextPath = key === "dashboard" ? "/admin" : `/admin/${key}`;
    if (window.location.pathname !== nextPath || window.location.hash) {
      window.history[method](state, "", nextPath);
    }
  } else if (window.location.hash !== `#${key}`) {
    window.history[method](state, "", `#${key}`);
  }
}

function AdminWorkspace({ user }) {
  const confirm = useConfirm();
  const notifications = useOrderNotifications();
  const [reviewCount,setReviewCount] = useState(null);
  useEffect(() => {
    let active = true, pending = false;
    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      const counts = await Promise.allSettled([orderRequest,newsletterRequest].map(request=>request(null,{mailReviewCount:"1"})));
      if (active) {
        const available = counts.filter(result=>result.status === "fulfilled");
        setReviewCount(available.length ? available.reduce((total,result)=>total+result.value.count,0) : null);
      }
      pending = false;
    }
    refresh();
    const timer = setInterval(refresh,60000);
    window.addEventListener("focus",refresh);
    return () => {active=false;clearInterval(timer);window.removeEventListener("focus",refresh);};
  },[]);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const position = useRef(window.history.state?.adminPosition ?? 0);
  const [tab, setTab] = useState(initialAdminTab);
  const [menuOpen, setMenuOpen] = useState(true);
  const [orderMailDraft, setOrderMailDraft] = useState(null);
  const [orderMailVersion, setOrderMailVersion] = useState(0);
  const [emailSection, setEmailSection] = useState({ view: "contacts" });
  const [storeSection, setStoreSection] = useState("links");
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(()=>{document.title=GROUPS.flatMap(group=>group.items).find(([key])=>key===(tab==="store"?"home":tab))[1]+" · Quản trị ORORA";},[tab]);
  const navigate = async (key, { force = false } = {}) => {
    if (!ALL_TABS.includes(key) || key === tab) return;
    const sameBuilder = sharesBuilder(tab,key);
    if (!force && !sameBuilder && dirtyRegistry.hasChanges()) {
      const ok = await confirm("Bạn có thay đổi chưa lưu. Chuyển sang mục khác và bỏ các thay đổi này?", {
        title: "Thay đổi chưa lưu",
        confirmLabel: "Rời mục",
        danger: true,
      });
      if (!ok) return;
    }
    setTab(key);
    syncAdminUrl(key);
    position.current=window.history.state?.adminPosition ?? 0;
  };

  useEffect(() => {
    if(window.history.state?.adminPosition==null) window.history.replaceState({...window.history.state,adminPosition:position.current},"");
    const onNav = () => {
      const next=initialAdminTab();
      if(next===tab)return;
      if(!sharesBuilder(tab,next) && dirtyRegistry.hasChanges() && !window.confirm("Bỏ thay đổi chưa lưu và rời mục này?")) {
        const delta=position.current-window.history.state?.adminPosition;
        if(Number.isInteger(delta)&&delta) window.history.go(delta);
        else syncAdminUrl(tab,true);
        return;
      }
      position.current=window.history.state?.adminPosition ?? 0;
      setTab(next);
    };
    window.addEventListener("popstate", onNav);

    return () => {
      window.removeEventListener("popstate", onNav);

    };
  }, [tab]);

  useEffect(() => {
    const open = (event) => {
      if (!sharesBuilder(tab,"store") && dirtyRegistry.hasChanges() && !window.confirm("Bỏ thay đổi chưa lưu và mở Visual Builder?")) return;
      setStoreVersion((v) => v + 1);
      setStoreSection(event.detail?.section || "links");
      setTab("store");
      syncAdminUrl("store");
      position.current=window.history.state?.adminPosition ?? 0;
    };
    window.addEventListener("orora-admin-store", open);
    return () => window.removeEventListener("orora-admin-store", open);
  }, [tab]);

  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; });
  useEffect(() => {
    const onNavigate = (event) => {
      const target = event.detail?.tab;
      if (target) navigateRef.current(target);
    };
    window.addEventListener("orora-admin-navigate", onNavigate);
    return () => window.removeEventListener("orora-admin-navigate", onNavigate);
  }, []);

  const orderBadgeShown = notifications.snapshot?.pendingCount > 0 || notifications.error;

  const renderActiveTab = () => {
    if (tab === "dashboard") {
      return (
        <Dashboard
          pendingCount={notifications.snapshot?.pendingCount}
          statusCounts={notifications.snapshot?.counts}
          revision={notifications.revision}
          onOpenOrder={(id) => { setPendingRequest({ id, allStatuses: true }); navigate("orders"); }}
          onOpenOrders={(allStatuses = false) => { setPendingRequest({ allStatuses }); navigate("orders"); }}
          onOpenProducts={() => navigate("products")}
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
    if (tab === "translations") return <TranslationAdmin />;
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
          onOpenExport={() => navigate("export")}
        />
      );
    }
    if (tab === "mail-review") return <MailReview onOpenOrder={id=>{setPendingRequest({id,allStatuses:true});navigate("orders");}} onOpenNewsletter={()=>navigate("newsletter")}/>;
    if (tab === "export") return <EmailExport key={user.uid} request={newsletterRequest} />;
    return null;
  };

  return (
    <div className="admin-shell">
      <aside className="admin-side" data-menu-open={menuOpen}>
        <div className="admin-brand">ORORA</div>
        <button type="button" className="admin-btn admin-menu-toggle" aria-expanded={menuOpen} aria-controls="admin-menu admin-account" onClick={() => setMenuOpen(open => !open)}>{menuOpen ? "Thu gọn menu" : "Mở menu"}</button>
        <nav id="admin-menu" className="admin-nav" aria-label="Menu quản trị">
          {GROUPS.map(({ title, items }) => (
            <div className="admin-nav-group" key={title || "main"} role="group" aria-label={title || undefined}>
              {title && <span className="admin-nav-title" aria-hidden="true">{title}</span>}
              {items.map(([key, label]) => (
                <button key={key} aria-label={label} aria-describedby={key === "orders" && orderBadgeShown ? "admin-pending-order-count" : undefined} aria-current={(tab === key || (tab === "store" && key === "home")) ? "page" : undefined} className={(tab === key || (tab === "store" && key === "home")) ? "active" : ""} onPointerEnter={() => prefetchAdminTab(key)} onFocus={() => prefetchAdminTab(key)} onClick={() => navigate(key)}>
                  {label}{key === "mail-review" && reviewCount > 0 && <span className="admin-order-count" aria-label={reviewCount+" thư cần xử lý"}>{reviewCount}</span>}{key === "orders" && <OrderBadge notifications={notifications} />}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div id="admin-account" className="admin-side-bottom">
          <span className="admin-muted">{user.email}</span>
          <details className="admin-muted admin-uid"><summary>Mã tài khoản (UID)</summary><span>{user.uid}</span></details>
          <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn">Xem website</a>
          {signOutError && <p className="admin-error" role="alert">{signOutError}</p>}
          <button className="admin-btn" onClick={async () => { if (!dirtyRegistry.hasChanges() || await confirm("Bạn có thay đổi chưa lưu. Đăng xuất và bỏ những thay đổi này?", { title: "Đăng xuất", confirmLabel: "Đăng xuất", danger: true })) { setSignOutError(""); try { clearAdminCache(); await signOut(auth); } catch { setSignOutError("Chưa thể đăng xuất lúc này. Vui lòng thử lại."); } } }}>Đăng xuất</button>
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
