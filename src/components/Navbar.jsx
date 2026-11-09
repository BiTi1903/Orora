import { contactLinks } from "../lib/contact";
import { withTrackingNavLink } from "../lib/navbar-links";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import useCategories from "../hooks/useCategories";
import { socialShopUrl } from "../lib/commerce";
import { toCss } from "../lib/typography";

const DEFAULT_LINKS = [
  { label: "Về Chúng Tôi", href: "/#about" },
  { label: "Sản phẩm", href: "/#shop" },
  { label: "Liên Hệ", href: "/#contact" },
];

/* Link để trống / chỉ "/" → dùng link mặc định theo vị trí (Về Chúng Tôi → about, Sản phẩm → shop, Liên Hệ → contact).
   "#about" → "/#about" để bấm từ trang chi tiết sản phẩm vẫn về đúng mục ở trang chủ. */
function resolveHref(item, index) {
  const raw = (item?.href || "").trim();
  if (!raw || raw === "/") return item?.kind === "order-tracking" ? "/tra-cuu-don-hang" : DEFAULT_LINKS[index]?.href || "/";
  const path = raw.startsWith("#") ? `/${raw}` : raw;
  return ({ "/ve-orora": "/#about", "/san-pham": "/#shop", "/lien-he": "/#contact" })[path] || path;
}

function NavDropdown({ children, label, items, onSelect }) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);
  return <div className="nav-dropdown" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={(event) => { if (event.key === "Escape") { setOpen(false); toggleRef.current?.focus(); event.stopPropagation(); } }}>
    <div className="nav-dropdown-heading">{children}<button ref={toggleRef} type="button" className="nav-dropdown-toggle" aria-label={`Mở danh sách ${label}`} aria-expanded={open} onClick={() => setOpen(!open)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button></div>
    {open && <div className="nav-dropdown-panel">{items.map((entry) => entry.external ? <a key={entry.href} href={entry.href} target="_blank" rel="noreferrer" onClick={() => { setOpen(false); onSelect?.(); }}>{entry.label}<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg></a> : <Link key={entry.href} to={entry.href} onClick={() => { setOpen(false); onSelect?.(); }}>{entry.label}</Link>)}</div>}
  </div>;
}

function Navbar({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const location = useLocation();
  const navRef = useRef(null);
  const [menuPath, setMenuPath] = useState(null);
  const [previousPath, setPreviousPath] = useState(location.pathname);
  if (previousPath !== location.pathname) {
    setPreviousPath(location.pathname);
    setMenuPath(null);
  }
  const menuOpen = menuPath === location.pathname;
  const home = useHomeContent();
  const { categories } = useCategories();
  const data = preview && previewData ? previewData : home || {};
  const logo = data.navLogo || "";
  const links = withTrackingNavLink(Array.isArray(data.navLinks) ? data.navLinks : []);
  const styles = data.navStyles || {};
  const { zalo } = contactLinks(home, "", home.productDetailStyles?.contactActions || {});
  const facebook = socialShopUrl(home.shopLinks?.facebookUrl || home.footerFacebook, "facebook");
  const tiktok = socialShopUrl(home.shopLinks?.tiktokUrl || home.footerTikTok, "tiktok");
  const submenu = (item, index) => {
    const href = resolveHref(item, index);
    if (href === "/#shop" && home.sectionVisibility?.collection !== false) return [
      { label: "Tất cả sản phẩm", href: "/#shop" },
      ...categories.filter((category) => category.id && category.name).map((category) => ({ label: category.name, href: `/?category=${encodeURIComponent(category.id)}#shop` })),
    ];
    if (href === "/#contact") return [zalo && { label: "Zalo", href: zalo, external: true }, facebook && { label: "Facebook", href: facebook, external: true }, tiktok && { label: "TikTok", href: tiktok, external: true }].filter(Boolean);
    return [];
  };


  // A portal preview belongs to its iframe document, not the admin page.
  useEffect(() => {
    if (!menuOpen) return;
    const nav = navRef.current;
    const body = nav?.ownerDocument.body;
    if (!body) return;
    const previous = body.style.overflow;
    body.style.overflow = "hidden";
    const ownerDocument = nav.ownerDocument;
    ownerDocument.querySelector(".drawer-close")?.focus();
    const onEscape = (event) => {
      if (event.key !== "Escape") return;
      setMenuPath(null);
    };
    ownerDocument.addEventListener("keydown", onEscape);
    const desktop = ownerDocument.defaultView.matchMedia("(min-width: 769px)");
    const onDesktop = (event) => { if (event.matches) setMenuPath(null); };
    desktop.addEventListener("change", onDesktop);
    return () => {
      body.style.overflow = previous;
      ownerDocument.removeEventListener("keydown", onEscape);
      desktop.removeEventListener("change", onDesktop);
      if (nav.isConnected) nav.querySelector(".menu")?.focus();
    };
  }, [menuOpen]);

  const toggleMenu = () => setMenuPath(menuOpen ? null : location.pathname);
  const closeMenu = () => setMenuPath(null);

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  return (
    <>
      <nav ref={navRef} className={`navbar${preview ? " navbar--preview" : ""}`}>
        <Link
          to="/"
          className={`logo ${selectedClass("navLogo")}`}
          data-builder-key={preview ? "navLogo" : undefined}
          onClick={select("navLogo")}
          style={toCss(styles.logo, { responsive: true })}
        >
          {logo}
          <span></span>
        </Link>

        <div className="nav-links">
          {links.map((item, index) => {
            const entries = submenu(item, index);
            const link = <Link to={resolveHref(item, index)} className={selectedClass(`navLink:${index}`)} data-builder-key={preview ? `navLink:${index}` : undefined} onClick={select(`navLink:${index}`)} style={toCss(styles.link, { responsive: true })}>{item.label}</Link>;
            return entries.length && !preview ? <NavDropdown key={index} label={item.label} items={entries}>{link}</NavDropdown> : <span key={index}>{link}</span>;
          })}
        </div>

        <button
          className={`menu${menuOpen ? " menu--open" : ""}`}
          type="button"
          onClick={toggleMenu}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          style={{ visibility: menuOpen ? "hidden" : undefined }}
          tabIndex={menuOpen ? -1 : 0}
        >
          <span className="menu-icon" />
        </button>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`mobile-overlay${menuOpen ? " is-visible" : ""}`}
        onClick={closeMenu}
      />

      <aside className={`mobile-drawer${menuOpen ? " is-open" : ""}`} inert={!menuOpen}>
        <div className="mobile-drawer-header">
          <Link to="/" className="logo" onClick={closeMenu}>
            {logo}<span></span>
          </Link>
          <button type="button" className="drawer-close" aria-label="Đóng menu" onClick={closeMenu}>×</button>
        </div>

        <nav key={menuOpen ? "open" : "closed"} className="mobile-drawer-links">
          {links.map((item, index) => {
            const entries = submenu(item, index);
            if (!entries.length) return <Link key={index} to={resolveHref(item, index)} onClick={closeMenu}>{item.label}</Link>;
            return <details className="mobile-nav-group" key={index}><summary>{item.label}<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><div className="mobile-nav-submenu">{entries.map((entry) => entry.external ? <a key={entry.href} href={entry.href} target="_blank" rel="noreferrer" onClick={closeMenu}>{entry.label}</a> : <Link key={entry.href} to={entry.href} onClick={closeMenu}>{entry.label}</Link>)}</div></details>;
          })}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;