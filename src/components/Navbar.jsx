import { Link } from "react-router-dom";
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
  const home = useHomeContent();
  const data = preview && previewData ? previewData : home || {};
  const logo = data.navLogo || "ORORA";
  const links = Array.isArray(data.navLinks) && data.navLinks.length
    ? data.navLinks
    : DEFAULT_LINKS;
  const styles = data.navStyles || {};

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  return (
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

      <button className="menu" type="button">
        ☰
      </button>
    </nav>
  );
}

export default Navbar;
