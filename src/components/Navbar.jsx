import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
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
  if (!raw || raw === "/") return DEFAULT_LINKS[index]?.href || "/";
  const path = raw.startsWith("#") ? `/${raw}` : raw;
  return ({ "/ve-orora": "/#about", "/san-pham": "/#shop", "/lien-he": "/#contact" })[path] || path;
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
  const data = preview && previewData ? previewData : home || {};
  const logo = data.navLogo || "";
  const links = Array.isArray(data.navLinks) && data.navLinks.length
    ? data.navLinks
    : [];
  const styles = data.navStyles || {};

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
          {links.map((item, index) => (
            <Link
              key={index}
              to={resolveHref(item, index)}
              className={selectedClass(`navLink:${index}`)}
              data-builder-key={preview ? `navLink:${index}` : undefined}
              onClick={select(`navLink:${index}`)}
              style={toCss(styles.link, { responsive: true })}
            >
              {item.label}
            </Link>
          ))}
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

        <nav className="mobile-drawer-links">
          {links.map((item, index) => (
            <Link
              key={index}
              to={resolveHref(item, index)}
              onClick={closeMenu}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;