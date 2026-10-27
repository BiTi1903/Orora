import { useState, useEffect } from "react";
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
  return raw.startsWith("#") ? `/${raw}` : raw;
}

function Navbar({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const location = useLocation();
  const [menuPath, setMenuPath] = useState(null);
  const [previousPath, setPreviousPath] = useState(location.pathname);
  if (previousPath !== location.pathname) {
    setPreviousPath(location.pathname);
    setMenuPath(null);
  }
  const menuOpen = menuPath === location.pathname;
  const home = useHomeContent();
  const data = preview && previewData ? previewData : home || {};
  const logo = data.navLogo || "ORORA";
  const links = Array.isArray(data.navLinks) && data.navLinks.length
    ? data.navLinks
    : DEFAULT_LINKS;
  const styles = data.navStyles || {};

  // Lock body scroll khi menu mở
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
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
      <nav className={`navbar${preview ? " navbar--preview" : ""}`}>
        <Link
          to="/"
          className={`logo ${selectedClass("navLogo")}`}
          data-builder-key={preview ? "navLogo" : undefined}
          onClick={select("navLogo")}
          style={toCss(styles.logo, { responsive: !preview })}
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
              style={toCss(styles.link, { responsive: !preview })}
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
        >
          <span className="menu-icon" />
        </button>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`mobile-overlay${menuOpen ? " is-visible" : ""}`}
        onClick={closeMenu}
      />

      <aside className={`mobile-drawer${menuOpen ? " is-open" : ""}`}>
        <div className="mobile-drawer-header">
          <Link to="/" className="logo" onClick={closeMenu}>
            {logo}<span></span>
          </Link>
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