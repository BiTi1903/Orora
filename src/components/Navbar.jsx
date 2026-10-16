import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";

const DEFAULT_LINKS = [
  { label: "Về Chúng Tôi", href: "/#about" },
  { label: "Sản phẩm", href: "/#shop" },
  { label: "Liên Hệ", href: "/#contact" },
];

function Navbar({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const home = useHomeContent();
  const data = preview && previewData ? previewData : home || {};
  const logo = data.navLogo || "ORORA";
  const links = Array.isArray(data.navLinks) && data.navLinks.length
    ? data.navLinks
    : DEFAULT_LINKS;
  const styles = data.navStyles || {};

  // Đóng menu khi chuyển trang
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

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
              to={item.href || "/"}
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
              to={item.href || "/"}
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
