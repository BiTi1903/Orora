import {SHARE_IMAGE_PATH,heroShareImage} from "./share-image.js";
import {parseVndPrice} from "./commerce.js";
import { findProductByRoute, productPath } from "./product-identity.js";
export const SITE_URL = "https://ororavn.com";
export const SITE_NAME = "ORORA VN";
const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();
const imageUrl = (value) => {
  try { const url = new URL(value, SITE_URL); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
};
const description = (value) => compact(value).slice(0, 160);

export function pageSeo(pathname, home = {}, products = [], productsLoading = false) {
  const normalized = pathname.replace(/\/$/, "") || "/";
  const path = ["/san-pham", "/ve-orora", "/lien-he"].includes(normalized) ? "/" : normalized;
  const pages = {
    "/tra-cuu-don-hang": { name:"Tra cứu đơn hàng", title:"Tra cứu đơn hàng | ORORA VN", description:"Kiểm tra trạng thái đơn hàng ORORA bằng mã đơn hoặc số điện thoại đặt hàng.", noindex:true },
    "/": { name: SITE_NAME, title: "ORORA", description: description(home.footerDescription) || "Khám phá sản phẩm làm đẹp và chăm sóc da của ORORA VN. Tìm hiểu sản phẩm và liên hệ ORORA." },
  };
  let page = pages[path];
  let product;
  if (path.startsWith("/product/")) {
    let id;
    try { id = decodeURIComponent(path.slice(9)); } catch { id = ""; }
    product = findProductByRoute(products, id);
    if (product?.active === false) product = null;
    page = product ? {
      name: product.name, title: `${compact(product.name)} | ORORA VN`,
      description: description(product.description || product.story) || `Tìm hiểu ${compact(product.name)} tại ORORA VN.`,
    } : { name: "Sản phẩm", title: "Sản phẩm | ORORA VN", description: "Thông tin sản phẩm ORORA VN.", noindex: !productsLoading };
  }
  page ||= { name: "Trang không tồn tại", title: "Trang không tồn tại | ORORA VN", description: "", noindex: true };
  const url = `${SITE_URL}${product ? productPath(product) : path}`;
  const graph = [
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, alternateName: "ORORA", url: `${SITE_URL}/`, inLanguage: "vi-VN" },
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: `${SITE_URL}/`,
      ...(home.footerEmail ? { email: home.footerEmail } : {}),
      ...(home.footerPhone ? { telephone: home.footerPhone } : {}),
      sameAs: [home.footerInstagram, home.footerFacebook, home.footerTikTok, home.footerYouTube].filter((value) => /^https?:\/\//.test(value || "")),
    },
    { "@type": "WebPage", "@id": `${url}#webpage`, url, name: page.title, description: page.description, inLanguage: "vi-VN", isPartOf: { "@id": `${SITE_URL}/#website` } },
  ];
  if (path !== "/" && !page.noindex) {
    const crumbs = [{ name: "Trang chủ", item: `${SITE_URL}/` }];
    crumbs.push({ name: page.name, item: url });
    graph.push({ "@type": "BreadcrumbList", itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, ...crumb })) });
  }
  if (product) {
    const price=parseVndPrice(product.price);
    graph.push({ "@type": "Product", name: product.name, description: page.description, url,
      ...(product.image && imageUrl(product.image) ? { image: imageUrl(product.image) } : {}),
      ...(product.brand?{brand:{"@type":"Brand",name:compact(product.brand)}}:{}),
      ...(price !== null ? { offers: { "@type": "Offer", priceCurrency: "VND", price:String(price), url } } : {}),
    });
  }
  return { ...page, url, image: (product?.image && imageUrl(product.image)) || ((home.heroImage || home.heroImageMobile || home.heroMobileImage) ? heroShareImage(home,SITE_URL) : `${SITE_URL}${SHARE_IMAGE_PATH}`), structuredData: { "@context": "https://schema.org", "@graph": graph } };
}
