import ButtonIcon from "./ButtonIcon";
import {mountNavbarCartSlot} from "../lib/navbar-cart-slot";
import CartButton from "./CartButton";
import { contactLinks } from "../lib/contact";
import { withTrackingNavLink } from "../lib/navbar-links";
import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useHomeContent from "../hooks/useHomeContent";
import useCategories from "../hooks/useCategories";
import useProducts from "../hooks/useProducts";
import { formatProductPrice, socialShopUrl } from "../lib/commerce";
import { normalizeSearch } from "../lib/catalog-filters";
import { productPath } from "../lib/product-identity";
import { cdnSrc, THUMB } from "../lib/image-cdn";
import { toCss } from "../lib/typography";
import { STOREFRONT_LANGUAGES_ENABLED, SUPPORTED_LOCALES, useLocale, setLocale, translatePhrase } from "../lib/i18n";

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
    <div className="nav-dropdown-heading">{children}<button ref={toggleRef} type="button" className="nav-dropdown-toggle" aria-label={`Mở danh sách ${label}`} aria-expanded={open} onClick={() => setOpen(!open)}><ButtonIcon name="navDropdown" defaultSize={12} allowHidden={false}/></button></div>
    {open && <div className="nav-dropdown-panel">{items.map((entry) => entry.external ? <a key={entry.href} href={entry.href} target="_blank" rel="noreferrer" onClick={() => { setOpen(false); onSelect?.(); }}>{entry.label}<ButtonIcon name="navExternal" defaultSize={12}/></a> : <Link key={entry.href} to={entry.href} onClick={() => { setOpen(false); onSelect?.(); }}>{entry.label}</Link>)}</div>}
  </div>;
}

function LanguageSwitcher({ settings = {}, preview = false, className = "", onSelect }) {
  const locale = useLocale();
  if (settings.enabled === false) return null;
  const activeLocale = preview && settings.previewLocale ? settings.previewLocale : locale;
  const showEn = settings.enableEn !== false;
  const showJa = settings.enableJa !== false;
  const codes = ["vi", ...(showEn ? ["en"] : []), ...(showJa ? ["ja"] : [])];
  if (codes.length <= 1 && !preview) return null;
  const labels = {
    vi: settings.viLabel?.trim() || "VI",
    en: settings.enLabel?.trim() || "EN",
    ja: settings.jaLabel?.trim() || "JA",
  };
  const boxVars = {
    ...(settings.background ? { "--lang-bg": settings.background } : {}),
    ...(settings.borderColor ? { "--lang-border": settings.borderColor } : {}),
    ...(settings.activeBackground ? { "--lang-active-bg": settings.activeBackground } : {}),
    ...(settings.activeColor ? { "--lang-active-color": settings.activeColor } : {}),
    ...(settings.radius != null && settings.radius !== "" ? { "--lang-radius": `${Math.max(0, Math.min(28, Number(settings.radius)))}px` } : {}),
    ...toCss(settings.text, { responsive: true }),
  };
  return (
    <div
      role="group"
      aria-label="Chọn ngôn ngữ / Language"
      className={`navbar-lang-switcher ${className}`.trim()}
      data-builder-key={preview ? "navLang" : undefined}
      style={boxVars}
      onClick={preview ? onSelect : undefined}
    >
      {SUPPORTED_LOCALES.filter((item) => codes.includes(item.code)).map((item) => {
        const active = activeLocale === item.code;
        return (
          <button
            key={item.code}
            type="button"
            className={`navbar-lang-btn${active ? " is-active" : ""}`}
            aria-pressed={active}
            aria-label={item.label}
            title={item.label}
            onClick={(event) => {
              if (preview) {
                onSelect?.(event);
                return;
              }
              setLocale(item.code);
            }}
          >
            {labels[item.code]}
          </button>
        );
      })}
    </div>
  );
}

function NavbarQuickSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { products } = useProducts({ enabled: open });

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => inputRef.current?.focus());
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const term = normalizeSearch(query).trim();
  const matches = term
    ? products
        .filter((item) => item && item.active !== false && normalizeSearch(`${item.name || ""} ${item.description || ""}`).includes(term))
        .slice(0, 6)
    : products.filter((item) => item && item.active !== false).slice(0, 4);

  const onSubmit = (event) => {
    event.preventDefault();
    const cleaned = query.trim();
    setOpen(false);
    if (cleaned) navigate(`/?q=${encodeURIComponent(cleaned)}#shop`);
    else navigate("/#shop");
  };

  return (
    <div ref={wrapRef} className="navbar-search-wrap">
      <button
        type="button"
        className="navbar-search-toggle"
        aria-label="Tìm kiếm sản phẩm"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
      {open && (
        <div className="navbar-search-popover" role="search" aria-label="Tìm kiếm nhanh sản phẩm">
          <form className="navbar-search-form" onSubmit={onSubmit}>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm sản phẩm ORORA…"
              aria-label="Nhập tên sản phẩm cần tìm"
            />
          </form>
          {matches.length > 0 ? (
            <div className="navbar-search-results">
              {matches.map((item) => (
                <Link
                  key={item.id}
                  to={productPath(item, products)}
                  className="navbar-search-item"
                  onClick={() => setOpen(false)}
                >
                  {item.image && <img src={cdnSrc(item.image, THUMB)} alt="" loading="lazy" decoding="async" />}
                  <span>
                    <strong>{item.name}</strong>
                    <small>{formatProductPrice(item.price) || "Liên hệ"}</small>
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="navbar-search-empty">Không tìm thấy sản phẩm phù hợp.</p>
          )}
        </div>
      )}
    </div>
  );
}

function Navbar({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
}) {
  const locale = useLocale();
  const tr = (val) => (!preview && locale !== "vi" ? translatePhrase(val, locale) : val);
  const location = useLocation();
  const navRef = useRef(null);
  const drawerRef = useRef(null);
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
  const showLanguages = preview || STOREFRONT_LANGUAGES_ENABLED;
  const langSettings = styles.languageSwitcher || {};
  const { zalo } = contactLinks(home, "", home.productDetailStyles?.contactActions || {});
  const facebook = socialShopUrl(home.shopLinks?.facebookUrl || home.footerFacebook, "facebook");
  const tiktok = socialShopUrl(home.shopLinks?.tiktokUrl || home.footerTikTok, "tiktok");
  const submenu = (item, index) => {
    const href = resolveHref(item, index);
    if (href === "/#shop" && home.sectionVisibility?.collection !== false) return [
      { label: tr("Tất cả sản phẩm"), href: "/#shop" },
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
    drawerRef.current?.querySelector('a[href],summary')?.focus();
    const onEscape = (event) => {
      if (ownerDocument.querySelector('dialog:modal')) return;
      if (event.key === "Escape") { event.preventDefault();setMenuPath(null);return; }
      const drawer=drawerRef.current;
      if(event.key!=="Tab"||!drawer?.contains(ownerDocument.activeElement))return;
      const nodes=Array.from(drawer.querySelectorAll('a[href],button:not(:disabled),summary,[tabindex="0"]')).filter(node=>node.getClientRects().length);
      const first=nodes[0],last=nodes.at(-1);
      if(event.shiftKey&&ownerDocument.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey&&ownerDocument.activeElement===last){event.preventDefault();first?.focus();}
    };
    ownerDocument.addEventListener("keydown", onEscape);
    const desktop = ownerDocument.defaultView.matchMedia("(min-width: 769px)");
    const onDesktop = (event) => { if (event.matches) setMenuPath(null); };
    desktop.addEventListener("change", onDesktop);
    return () => {
      body.style.overflow = previous;
      ownerDocument.removeEventListener("keydown", onEscape);
      desktop.removeEventListener("change", onDesktop);
      if (nav.isConnected) nav.querySelector(".menu")?.focus({preventScroll:true});
    };
  }, [menuOpen]);

  useEffect(() => {
    if (preview) return;
    const nav = navRef.current;
    if (!nav) return;
    const syncHeight = () => {
      const h = Math.ceil(nav.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--navbar-height", `${h}px`);
    };
    syncHeight();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(syncHeight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [preview]);

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
            const link = <Link to={resolveHref(item, index)} className={selectedClass(`navLink:${index}`)} data-builder-key={preview ? `navLink:${index}` : undefined} onClick={select(`navLink:${index}`)} style={toCss(styles.link, { responsive: true })}>{tr(item.label)}</Link>;
            return entries.length && !preview ? <NavDropdown key={index} label={tr(item.label)} items={entries}>{link}</NavDropdown> : <span key={index}>{link}</span>;
          })}
        </div>

        <div className="navbar-actions">
          {!preview && <NavbarQuickSearch />}
          {showLanguages && <LanguageSwitcher settings={langSettings} preview={preview} className={selectedClass("navLang")} onSelect={select("navLang")} />}
          <span ref={preview?undefined:mountNavbarCartSlot} className="navbar-cart-slot" data-desktop-cart-slot={preview?undefined:""}>{preview&&<CartButton settings={styles.cart} inNavbar preview className={selectedClass("navCart")} onClick={select("navCart")}/>}</span>
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
        </div>
      </nav>

      {/* ===== MOBILE DRAWER ===== */}
      <div
        className={`mobile-overlay${menuOpen ? " is-visible" : ""}`}
        onClick={closeMenu}
      />

      <aside ref={drawerRef} className={`mobile-drawer${menuOpen ? " is-open" : ""}`} inert={!menuOpen} style={{'--drawer-screen-width':`${Math.max(40,Math.min(80,Number(styles.drawer?.widthPercent??50)))}vw`,'--drawer-width':`${Math.max(240,Math.min(360,Number(styles.drawer?.width??290)))}px`,'--drawer-bg':styles.drawer?.background||'#fffafc','--drawer-opacity':`${Math.max(40,Math.min(100,Number(styles.drawer?.opacity??82)))}%`,'--drawer-blur':`${Math.max(0,Math.min(32,Number(styles.drawer?.blur??24)))}px`,'--drawer-radius':`${Math.max(0,Math.min(32,Number(styles.drawer?.radius??24)))}px`,...toCss(styles.drawer?.text)}}>
        <div className="mobile-drawer-header">
          <Link to="/" className="logo" onClick={closeMenu}>
            {logo}<span></span>
          </Link>
          <button type="button" className="drawer-close" aria-label="Đóng menu" onClick={closeMenu}>×</button>
        </div>

        {showLanguages && <div className="mobile-drawer-lang">
          <LanguageSwitcher settings={langSettings} preview={preview} />
        </div>}

        <nav key={menuOpen ? "open" : "closed"} className="mobile-drawer-links">
          {links.map((item, index) => {
            const entries = submenu(item, index);
            if (!entries.length) return <Link key={index} to={resolveHref(item, index)} onClick={closeMenu}>{tr(item.label)}</Link>;
            return <details className="mobile-nav-group" key={index}><summary>{tr(item.label)}<ButtonIcon name="navMobileDropdown" defaultSize={14} allowHidden={false}/></summary><div className="mobile-nav-submenu">{entries.map((entry) => entry.external ? <a key={entry.href} href={entry.href} target="_blank" rel="noreferrer" onClick={closeMenu}>{entry.label}</a> : <Link key={entry.href} to={entry.href} onClick={closeMenu}>{entry.label}</Link>)}</div></details>;
          })}
        </nav>
      </aside>
    </>
  );
}

export default Navbar;