import {withTrackingNavLink} from "../../lib/navbar-links.js";

const DEFAULT_NAV = {
  navLogo: "ORORA",
  navLinks: [
    { label: "Về Chúng Tôi", href: "/#about" },
    { label: "Sản phẩm", href: "/#shop" },
    { label: "Liên Hệ", href: "/#contact" },
  ],
  navStyles: {
    logo: {
      fontFamily: '"Cormorant Garamond", serif',
      fontSize: 26,
      fontWeight: 600,
      letterSpacing: 2,
      color: "#3a1526",
    },
    link: {
      fontSize: 13,
      fontWeight: 500,
      letterSpacing: 1,
      color: "#3a1526",
    },
  },
};

export function createNav(data = {}) {
  return {
    navLogo: data.navLogo ?? DEFAULT_NAV.navLogo,
    navLinks: withTrackingNavLink(Array.isArray(data.navLinks)
      ? data.navLinks.map((item, index) => ({
          ...item,
          label: item.label || "",
          href:
            item.href && item.href !== "/"
              ? item.href
              : item.kind === "order-tracking" ? "/tra-cuu-don-hang" : DEFAULT_NAV.navLinks[index]?.href || "/",
        }))
      : DEFAULT_NAV.navLinks.map((item) => ({ ...item }))),
    navStyles: {
      ...data.navStyles,
      logo: { ...DEFAULT_NAV.navStyles.logo, ...(data.navStyles?.logo || {}) },
      link: { ...DEFAULT_NAV.navStyles.link, ...(data.navStyles?.link || {}) },
    },
  };
}
