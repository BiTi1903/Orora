export const THUMB = { w: 480, q: "auto:good" }; // ô ảnh phụ ~150–200px
export const CARD = { w: 800, q: "auto:good" }; // thẻ sản phẩm ~400px (đủ nét cho màn retina)
export const MAIN = { w: 1800, q: "auto:best" }; // khung ảnh lớn ở trang chi tiết
export function cdnSrc(src, { w, q }) {
  if (!src || !src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    return src;
  }
  const [head, tail] = src.split("/upload/");
  const first = tail.split("/")[0];
  const hasTransform = /(^|,)[a-z]+_/.test(first);
  const keep = hasTransform
    ? first.split(",").filter((part) => !/^(f|q|w|c)_/.test(part))
    : [];
  const rest = hasTransform ? tail.slice(first.length + 1) : tail;
  const transform = ["f_auto", `q_${q}`, "c_limit", `w_${w}`, ...keep].join(",");
  return `${head}/upload/${transform}/${rest}`;
}
export function responsiveImage(src,{widths=[320,480,800,1200],sizes='100vw',width=800,q='auto:good'}={}) {
 if(!src||!src.includes('res.cloudinary.com')||!src.includes('/upload/'))return {src};
 return {src:cdnSrc(src,{w:width,q}),srcSet:widths.map(w=>`${cdnSrc(src,{w,q})} ${w}w`).join(', '),sizes};
}
export function heroImageSources(home={}){
 const desktop=responsiveImage(home.heroImage,{width:1920,widths:[960,1440,1920]});
 const mobile=responsiveImage(home.heroImageMobile||home.heroMobileImage||home.heroImage,{width:900,widths:[480,800,900]});
 return {desktop:desktop.src||null,mobile:mobile.src||null,desktopSrcSet:desktop.srcSet||null,mobileSrcSet:mobile.srcSet||null};
}

export function productMainImage(src, width = 1200) {
 return cdnSrc(src, {w:width <= 600 ? 800 : width <= 1200 ? 1200 : 1800, q:"auto:good"});
}
