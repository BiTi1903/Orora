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
  const [orderMailDraft, setOrderMailDraft] = useState(null);
  const [orderMailVersion, setOrderMailVersion] = useState(0);
  const [emailSection, setEmailSection] = useState("contacts");
  const [tab, setTab] = useState("dashboard");

  useEffect(() => {
    if (!auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  if (user === undefined)
    return (
      <div className="admin-login">
        <p className="admin-muted">Đang tải...</p>
      </div>
    );

  if (!user) return <AdminLogin />;

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <div className="admin-brand">ORORA</div>
        <nav className="admin-nav">
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? "active" : ""} onClick={() => { if (key === "orders" && tab !== "orders") { setOrderMailDraft(null); setOrderMailVersion((value) => value + 1); } if (key === "newsletter") setEmailSection("contacts"); setTab(key); }}>
              {label}
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
        {tab === "dashboard" && <Dashboard sectionCount={TABS.length} />}
        {tab === "home" && <HomeAdmin />}
        {tab === "products" && <ProductsAdmin />}
        {tab === "orders" && <OrdersAdmin key={`${user.uid}:${orderMailVersion}`} initialMailDraft={orderMailDraft} onOpenEmailTemplates={() => { setEmailSection("templates"); setTab("newsletter"); }} />}
        {tab === "export" && <EmailExport key={user.uid} request={newsletterRequest} />}
        {tab === "shipping" && <ShippingAdmin key={user.uid} />}
        {tab === "inventory" && <InventoryAdmin key={user.uid} />}
        {tab === "newsletter" && <NewsletterAdmin initialView={emailSection} onOpenOrderMail={(draft) => { setOrderMailDraft(draft); setOrderMailVersion((value) => value + 1); setTab("orders"); }} />}
      </main>
    </div>
  );
}