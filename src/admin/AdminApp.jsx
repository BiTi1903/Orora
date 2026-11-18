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
import "../styles/admin.css";

/* Menu chia nhóm theo công việc; mỗi mục là [khóa, nhãn]. */
const GROUPS = [
  { title: null, items: [["dashboard", "Tổng quan"]] },
  { title: "Bán hàng", items: [["orders", "Đơn hàng"], ["inventory", "Kiểm kho"], ["shipping", "Phí vận chuyển"]] },
  { title: "Giao diện và nội dung", items: [["home", "Trang chủ"], ["products", "Sản phẩm"], ["store", "Cửa hàng"]] },
  { title: "Khách hàng", items: [["newsletter", "Email"], ["chat", "Chat AI"], ["export", "Xuất danh sách email"]] },
];

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

function AdminWorkspace({ user }) {
  const confirm = useConfirm();
  const notifications = useOrderNotifications();
  const [pendingRequest, setPendingRequest] = useState(null);
  const [visited, setVisited] = useState([]);
  const [orderMailDraft, setOrderMailDraft] = useState(null);
  const [orderMailVersion, setOrderMailVersion] = useState(0);
  const [emailSection, setEmailSection] = useState({ view: "contacts" });
  const [tab, setTab] = useState("dashboard");
  const [storeSection,setStoreSection]=useState("cart");
  const [storeVersion,setStoreVersion]=useState(0);
  const navigate = (key) => { setVisited((items) => items.includes(key==='store'?'home':key) ? items : [...items,key==='store'?'home':key]); setTab(key); };
  useEffect(()=>{
    const open=event=>{setStoreVersion(v=>v+1);setStoreSection(event.detail?.section||'cart');setVisited(items=>items.includes('home')?items:[...items,'home']);setTab('store');};
    window.addEventListener('orora-admin-store',open);return()=>window.removeEventListener('orora-admin-store',open);
  },[]);
  const orderBadgeShown = notifications.snapshot?.pendingCount > 0 || notifications.error;

  /* Các mục giữ trạng thái sau lần mở đầu (ẩn bằng `hidden`, không gỡ khỏi trang). */
  const panels = {
    home: <HomeAdmin workspace={tab==='store'?'store':'home'} storeSection={storeSection} storeVersion={storeVersion}/>,
    products: <ProductsAdmin />,
    chat: <ChatSettings />,
    orders: <OrdersAdmin refreshKey={notifications.revision} pendingRequest={pendingRequest} onOrderChanged={notifications.refresh} key={`${user.uid}:${orderMailVersion}`} initialMailDraft={orderMailDraft} onOpenEmailTemplates={() => { setEmailSection({ view: "templates" }); navigate("newsletter"); }} />,
    shipping: <ShippingAdmin key={user.uid} />,
    inventory: <InventoryAdmin key={user.uid} />,
    newsletter: <NewsletterAdmin initialView={emailSection.view} viewRequest={emailSection} onOpenOrderMail={(draft) => { setOrderMailDraft(draft); setOrderMailVersion((value) => value + 1); navigate("orders"); }} />,
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
          <button className="admin-btn" onClick={async () => {if(!dirtyRegistry.hasChanges()||await confirm("Bạn có thay đổi chưa lưu. Đăng xuất và bỏ những thay đổi này?"))signOut(auth);}}>Đăng xuất</button>
        </div>
      </aside>

      <main className="admin-main">
        {notifications.incoming && <div className="admin-order-notification" role="status"><div><strong>Có đơn hàng mới · {notifications.incoming.code}</strong><p>{notifications.snapshot?.pendingCount ?? ""} đơn đang chờ xác nhận.</p></div><button type="button" className="admin-btn" onClick={() => { setPendingRequest({ id: notifications.incoming.id }); navigate("orders"); notifications.dismiss(); }}>Xem đơn chờ</button><button type="button" className="notification-dismiss" aria-label="Đóng thông báo đơn mới" onClick={notifications.dismiss}>×</button></div>}

        {tab === "dashboard" && <Dashboard pendingCount={notifications.snapshot?.pendingCount} />}
        {Object.entries(panels).filter(([key]) => visited.includes(key)).map(([key, panel]) => <div key={key} className="admin-workspace-panel" hidden={key==='home'? !['home','store'].includes(tab):tab!==key}>{panel}</div>)}
        {tab === "export" && <EmailExport key={user.uid} request={newsletterRequest} />}
      </main>
    </div>
  );
}
