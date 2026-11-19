import ConfirmProvider from "./ConfirmDialog";
import { useConfirm } from "./confirm-context";
import "../styles/product-detail.css";
import {dirtyRegistry} from "../lib/dirty-registry";
import useOrderNotifications from "./useOrderNotifications";
import EmailExport from "./EmailExport";
import { newsletterRequest } from "./newsletter-api";
import ShippingAdmin from "./ShippingAdmin";
import ChatSettings from "./ChatSettings";
import InventoryAdmin from "./InventoryAdmin";
import { useEffect, useState } from "react";
import { auth, onAuthStateChanged, signOut } from "../lib/firebaseAuth";
import AdminLogin from "./AdminLogin";
import Dashboard from "./Dashboard";
import HomeAdmin from "./HomeAdmin";
import ProductsAdmin from "./ProductsAdmin";
import OrdersAdmin from "./OrdersAdmin";
import NewsletterAdmin from "./NewsletterAdmin";
import { orderRequest } from "./order-api";
import "../styles/admin.css";

/* Menu chia nhóm theo công việc; mỗi mục là [khóa, nhãn]. */
const GROUPS = [
  { title: null, items: [["dashboard", "Tổng quan"]] },
  { title: "Bán hàng", items: [["orders", "Đơn hàng"], ["inventory", "Kiểm kho"], ["shipping", "Phí vận chuyển"]] },
  { title: "Giao diện và nội dung", items: [["home", "Trang chủ"], ["products", "Sản phẩm"], ["store", "Cửa hàng"]] },
  { title: "Khách hàng", items: [["newsletter", "Email"], ["chat", "Chat AI"], ["export", "Xuất danh sách email"]] },
];

const EMPTY_PERMISSIONS = { orders: false, newsletter: false, full: false };
const tabAllowed = (key, permissions) => {
  if (key === "newsletter" || key === "export") return Boolean(permissions?.newsletter);
  if (key === "orders" || key === "inventory" || key === "dashboard") return Boolean(permissions?.orders);
  return Boolean(permissions?.full);
};

export default function AdminApp() {
  const [user, setUser] = useState(() => auth ? undefined : null);
  const [access, setAccess] = useState({ status: "idle", error: "", check: 0, permissions: null });
  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAccess((prev) => ({ status: nextUser ? "checking" : "idle", error: "", check: prev.check + 1, permissions: null }));
    });
  }, []);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    orderRequest(null, { whoami: "1" }, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const raw = data?.permissions;
        if (!raw || typeof raw !== "object" || typeof raw.orders !== "boolean" || typeof raw.newsletter !== "boolean" || typeof raw.full !== "boolean") {
          setAccess((prev) => ({ ...prev, status: "error", error: "Phản hồi kiểm tra quyền chưa đầy đủ. Vui lòng thử lại hoặc tải lại trang.", permissions: null }));
          return;
        }
        const permissions = { orders: raw.orders, newsletter: raw.newsletter, full: raw.full };
        if (!permissions.orders && !permissions.newsletter && !permissions.full) {
          setAccess((prev) => ({ ...prev, status: "denied", error: "Tài khoản này chưa được cấp quyền quản trị.", permissions: null }));
          return;
        }
        setAccess((prev) => ({ ...prev, status: "ok", error: "", permissions }));
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        setAccess((prev) => ({ ...prev, status: error.status === 403 || error.status === 401 ? "denied" : "error", error: error.message || "Không xác minh được quyền quản trị.", permissions: null }));
      });
    return () => controller.abort();
  }, [user, access.check]);

  const [signOutError, setSignOutError] = useState("");
  const handleSignOut = async () => {
    setSignOutError("");
    try { await signOut(auth); }
    catch { setSignOutError("Chưa thể đăng xuất lúc này. Vui lòng thử lại."); }
  };

  if (user === undefined || (user && access.status === "checking")) return <div className="admin-login"><p className="admin-muted">Đang kiểm tra quyền quản trị...</p></div>;
  if (!user) return <AdminLogin />;
  if (access.status !== "ok" || !access.permissions) {
    return <div className="admin-login"><div className="admin-login-card admin-form">
      <div className="admin-brand">ORORA</div>
      <p className="admin-error" role="alert">{signOutError || access.error || "Tài khoản này chưa được cấp quyền quản trị."}</p>
      <p className="admin-muted">Email: {user.email || "—"}</p>
      <p className="admin-muted">UID: <code>{user.uid}</code></p>
      <div className="admin-actions">
        <button type="button" className="admin-btn" onClick={() => setAccess((prev) => ({ status: "checking", error: "", check: prev.check + 1, permissions: null }))}>Thử lại</button>
        <button type="button" className="admin-btn primary" onClick={handleSignOut}>Đăng xuất</button>
      </div>
    </div></div>;
  }
  return <ConfirmProvider key={user.uid}><AdminWorkspace user={user} permissions={access.permissions} /></ConfirmProvider>;
}

function OrderBadge({ notifications }) {
  const pending = notifications.snapshot?.pendingCount;
  if (notifications.error && !pending) return <span id="admin-pending-order-count" className="admin-order-count" title={`Chưa cập nhật số đơn: ${notifications.error}`} aria-label="Chưa cập nhật được số đơn chờ">!</span>;
  if (pending > 0) return <span id="admin-pending-order-count" className="admin-order-count" aria-label={`${pending} đơn chờ xác nhận`} title={notifications.error ? `Số đã ghi nhận; chưa cập nhật lại: ${notifications.error}` : "Đơn chờ xác nhận · tự cập nhật mỗi phút"}>{pending}</span>;
  return null;
}

const initialAdminTab = (allowedTabs) => {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  if (allowedTabs.includes(hash)) return hash;
  return allowedTabs[0] || "dashboard";
};

function AdminWorkspace({ user, permissions = EMPTY_PERMISSIONS }) {
  const confirm = useConfirm();
  const visibleGroups = GROUPS.map((group) => ({ ...group, items: group.items.filter(([key]) => tabAllowed(key, permissions)) })).filter((group) => group.items.length > 0);
  const allowedTabs = visibleGroups.flatMap((group) => group.items.map(([key]) => key));
  const notifications = useOrderNotifications(permissions.orders);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [signOutError, setSignOutError] = useState("");
  const [tab, setTab] = useState(() => initialAdminTab(allowedTabs));
  const [visited, setVisited] = useState(() => {
    const start = initialAdminTab(allowedTabs);
    if (start === "dashboard" || start === "export") return [];
    return [start === "store" ? "home" : start];
  });
  const [orderMailDraft, setOrderMailDraft] = useState(null);
  const [orderMailVersion, setOrderMailVersion] = useState(0);
  const [emailSection, setEmailSection] = useState({ view: "contacts" });
  const [storeSection,setStoreSection]=useState("cart");
  const [storeVersion,setStoreVersion]=useState(0);
  const navigate = (key) => {
    if (!tabAllowed(key, permissions)) return;
    setVisited((items) => items.includes(key==='store'?'home':key) ? items : [...items,key==='store'?'home':key]);
    setTab(key);
    if (typeof window !== "undefined" && window.location.hash !== `#${key}`) window.history.replaceState(null, "", `#${key}`);
  };
  useEffect(() => {
    const onHash = () => {
      const next = initialAdminTab(allowedTabs);
      setVisited((items) => (next === "dashboard" || next === "export" || items.includes(next === "store" ? "home" : next)) ? items : [...items, next === "store" ? "home" : next]);
      setTab(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [allowedTabs.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>{
    const open=event=>{if(!tabAllowed('store',permissions))return;setStoreVersion(v=>v+1);setStoreSection(event.detail?.section||'cart');setVisited(items=>items.includes('home')?items:[...items,'home']);setTab('store');if(typeof window!=="undefined")window.history.replaceState(null,"","#store");};
    window.addEventListener('orora-admin-store',open);return()=>window.removeEventListener('orora-admin-store',open);
  },[permissions]);
  const orderBadgeShown = permissions.orders && (notifications.snapshot?.pendingCount > 0 || notifications.error);

  /* Các mục giữ trạng thái sau lần mở đầu (ẩn bằng `hidden`, không gỡ khỏi trang). */
  const panels = {
    home: <HomeAdmin workspace={tab==='store'?'store':'home'} storeSection={storeSection} storeVersion={storeVersion}/>,
    products: <ProductsAdmin />,
    chat: <ChatSettings />,
    orders: <OrdersAdmin statusCounts={notifications.snapshot?.counts} refreshKey={notifications.revision} pendingRequest={pendingRequest} onOrderChanged={notifications.refresh} key={`${user.uid}:${orderMailVersion}`} initialMailDraft={orderMailDraft} canEditStore={permissions.full} canUseNewsletter={permissions.newsletter} onOpenEmailTemplates={permissions.newsletter ? () => { setEmailSection({ view: "templates" }); navigate("newsletter"); } : undefined} />,
    shipping: <ShippingAdmin key={user.uid} />,
    inventory: <InventoryAdmin key={user.uid} />,
    newsletter: <NewsletterAdmin initialView={emailSection.view} viewRequest={emailSection} onOpenOrderMail={permissions.orders ? (draft) => { setPendingRequest(null); setOrderMailDraft(draft); setOrderMailVersion((value) => value + 1); navigate("orders"); } : undefined} />,
  };

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">ORORA</div>
        <nav className="admin-nav" aria-label="Menu quản trị">
          {visibleGroups.map(({ title, items }) => (
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
        {permissions.orders && notifications.incoming && <div className="admin-order-notification" role="status"><div><strong>Có đơn hàng mới · {notifications.incoming.code}</strong><p>{notifications.snapshot?.pendingCount ?? ""} đơn đang chờ xác nhận.</p></div><button type="button" className="admin-btn" onClick={() => { setPendingRequest({ id: notifications.incoming.id }); navigate("orders"); notifications.dismiss(); }}>Xem đơn chờ</button><button type="button" className="notification-dismiss" aria-label="Đóng thông báo đơn mới" onClick={notifications.dismiss}>×</button></div>}

        {tab === "dashboard" && permissions.orders && <Dashboard pendingCount={notifications.snapshot?.pendingCount} revision={notifications.revision} onOpenOrder={id => { setPendingRequest({ id, allStatuses: true }); navigate("orders"); }} onOpenInventory={() => navigate("inventory")} />}
        {Object.entries(panels).filter(([key]) => visited.includes(key)).map(([key, panel]) => <div key={key} className="admin-workspace-panel" hidden={key==='home'? !['home','store'].includes(tab):tab!==key}>{panel}</div>)}
        {tab === "export" && permissions.newsletter && <EmailExport key={user.uid} request={newsletterRequest} />}
      </main>
    </div>
  );
}
