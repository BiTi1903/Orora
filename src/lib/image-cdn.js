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
export function heroImageSources(home={}){return {desktop:cdnSrc(home.heroImage,{w:1920,q:"auto:good"})||null,mobile:cdnSrc(home.heroImageMobile||home.heroMobileImage||home.heroImage,{w:900,q:"auto:good"})||null};}
