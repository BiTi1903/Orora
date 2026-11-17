import '../styles/product-card-actions.css';
import useHomeContent from '../hooks/useHomeContent';
import { formatProductPrice } from "../lib/commerce";
import { mobileImageVars } from "../lib/image-layout";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { splitColor, toCss } from "../lib/typography";
import ProductSlideshow from "./ProductSlideshow";
import { cdnSrc, CARD } from "../lib/image-cdn";
import { prepareProductDetail } from "../lib/product-navigation";

function ProductCard({
  productId,
  image,
  number,
  name,
  description,
  price,
  slug,
  styles = {},
  preview = false,
  selectedElement = "",
  onSelect,
  /* Đổi tên key khi chọn trong builder (vd: cardName → relName ở trang chi tiết) */
  keyMap = null,
    /* true = ngang/margin áp dụng cả thẻ (ảnh + tên + mô tả + giá đi cùng) */
  groupLayout = false,
}) {
  const cartSettings=useHomeContent().navStyles?.cart||{};
  const mobile=styles.mobileActions||{};
  const desktop=styles.desktopActions||{},desktopPrice=desktop.price||{};
  const bounded=(value,fallback,min,max)=>{const number=Number(value??fallback);return Math.max(min,Math.min(max,Number.isFinite(number)?number:fallback));};
  const desktopVars={'--mobile-card-price-size':`${bounded(mobile.priceSize,styles.price?.mobileFontSize||14,12,72)}px`,'--mobile-card-price-align':mobile.priceAlign||'left','--desktop-card-title-align':desktop.titleAlign||'left','--desktop-action-width':`${bounded(desktop.buttonWidth,104,72,180)}px`,'--desktop-action-gap':`${bounded(desktop.gap,10,4,24)}px`,'--desktop-action-radius':`${bounded(desktop.radius,14,0,28)}px`,'--desktop-action-bg':desktop.background||'#b8446d','--desktop-action-color':desktop.color||'#ffffff','--desktop-action-font-size':`${bounded(desktop.fontSize,13,10,20)}px`,'--desktop-price-size':`${bounded(desktopPrice.fontSize,20,12,36)}px`,'--desktop-price-weight':desktopPrice.fontWeight||600,'--desktop-price-family':desktopPrice.fontFamily||'var(--font-body)','--desktop-price-style':desktopPrice.fontStyle||(desktopPrice.italic?'italic':'normal'),'--desktop-price-align':desktopPrice.textAlign||'left','--desktop-price-spacing':typeof desktopPrice.letterSpacing==='number'?`${desktopPrice.letterSpacing}px`:desktopPrice.letterSpacing||'0px','--desktop-price-line-height':desktopPrice.lineHeight||1.35,'--desktop-price-color':desktopPrice.color||styles.price?.color||'var(--rose-deep)'};
  const frameRef = useRef(null);
  const k = (name) => keyMap?.[name] || name;

  /* màu tên đi qua biến CSS để giữ hiệu ứng đổi màu khi rê chuột */
  const { color: nameColor, rest: nameRest } = splitColor(styles.name);
  const nameStyle = nameColor
    ? { ...nameRest, "--pc-name": nameColor }
    : nameRest;

  const handleMove = (e) => {
    if (preview) return;
    const el = frameRef.current;
    if (!el || !window.matchMedia("(hover: hover)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 12}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);
  };

  const handleLeave = () => {
    if (preview) return;
    const el = frameRef.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  };

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  const prepare = () => { if (!preview) prepareProductDetail(image); };
  const intentProps = { onPointerEnter: event => { if (event.pointerType === "mouse") prepare(); }, onFocus: prepare, onClick: prepare };
  const ImageWrap = preview ? "div" : Link;
  const imageProps = preview
    ? {}
    : { to: `/product/${slug}`, ...intentProps };

  const ButtonWrap = preview ? "span" : Link;
  const buttonProps = preview
    ? {}
    : { to: `/product/${slug}`, ...intentProps };

  const imageLayout = styles.imageLayout || {};
  const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const px = (v) => `${n(v)}px`;

  // Ngang: % thẻ; trừ margin trái/phải để margin phải/trái nhìn thấy được
  const widthPercent = Math.min(100, Math.max(10, n(imageLayout.widthPercent) || 100));
  const mL = n(imageLayout.marginLeft);
  const mR = n(imageLayout.marginRight);
  const mT = n(imageLayout.marginTop);
  const mB = n(imageLayout.marginBottom);
  const fixedHeight =
    imageLayout.height != null && n(imageLayout.height) > 0
      ? n(imageLayout.height)
      : null;

  // Padding: absolute con → inset thủ công
  const padT = px(imageLayout.paddingTop);
  const padR = px(imageLayout.paddingRight);
  const padB = px(imageLayout.paddingBottom);
  const padL = px(imageLayout.paddingLeft);

  const widthExpr =
    mL || mR
      ? `calc(${widthPercent}% - ${mL + mR}px)`
      : `${widthPercent}%`;

  const imageFrameStyle = {
    ...mobileImageVars(imageLayout),
    // Biến CSS để thắng rule trong collection.css
    ["--pc-width"]: widthExpr,
    ["--pc-height"]: fixedHeight != null ? `${fixedHeight}px` : "auto",
    ["--pc-aspect"]:
      fixedHeight != null
        ? "unset"
        : imageLayout.aspectRatio || "4 / 5",
    width: widthExpr,
    maxWidth: "100%",
    height: fixedHeight != null ? `${fixedHeight}px` : "auto",
    aspectRatio:
      fixedHeight != null
        ? "unset"
        : imageLayout.aspectRatio || undefined,
    borderRadius: imageLayout.radius != null ? px(imageLayout.radius) : undefined,
    borderWidth:
      imageLayout.borderWidth != null ? px(imageLayout.borderWidth) : undefined,
    borderColor: imageLayout.borderColor || undefined,
    borderStyle:
      imageLayout.borderWidth != null && n(imageLayout.borderWidth) > 0
        ? "solid"
        : undefined,
    marginTop: px(mT),
    marginRight: px(mR),
    marginBottom: px(mB),
    marginLeft: px(mL),
    boxSizing: "border-box",
    ["--pc-object-fit"]: imageLayout.objectFit || "cover",
  };
  /* Cả thẻ: chiều ngang + margin nằm ở khung ngoài, nên tên / mô tả / giá đi theo ảnh.
     Khung ảnh bên trong luôn đầy 100% bề ngang của thẻ (chiều dọc, bo góc, viền vẫn ở ảnh). */
  const frameStyle = groupLayout
    ? {
        ...imageFrameStyle,
        ["--pc-width"]: "100%",
        width: "100%",
        marginTop: 0,
        marginRight: 0,
        marginBottom: 0,
        marginLeft: 0,
      }
    : imageFrameStyle;

    const itemStyle = groupLayout
    ? {
        width: widthExpr,
        maxWidth: "100%",
        marginTop: px(mT),
        marginBottom: px(mB),
        /* Không đặt margin trái/phải → tự căn giữa; có đặt thì dùng đúng số admin nhập */
        marginRight: mR ? px(mR) : "auto",
        marginLeft: mL ? px(mL) : "auto",
        boxSizing: "border-box",
      }
    : undefined;
  const mediaInsetStyle = {
    top: padT,
    right: padR,
    bottom: padB,
    left: padL,
  };

  return (
    <div
      className={`gallery-item ${preview ? "gallery-item--preview" : ""}`}
      style={{...itemStyle,...desktopVars}}
      data-mobile-actions={mobile.layout==='stacked'?'stacked':'compact'}
    >      <div
        className={`gallery-image tilt ${selectedClass(k("cardImage"))}`}
        ref={frameRef}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
style={frameStyle}        data-builder-key={preview ? k("cardImage") : undefined}
        onClick={select(k("cardImage"))}
      >
        <span className="tilt-shine" aria-hidden="true" />

        <ImageWrap
          className="product-slideshow-link"
          style={mediaInsetStyle}
          {...imageProps}
        >
          <ProductSlideshow
  images={[cdnSrc(image, CARD)]}
  alt={name}
  showDots={false}
/>
        </ImageWrap>
      </div>

      <div className="gallery-info">
        <span
          className={selectedClass(k("cardNumber"))}
          data-builder-key={preview ? k("cardNumber") : undefined}
          onClick={select(k("cardNumber"))}
          style={toCss(styles.number, { responsive: true })}
        >
          {number}
        </span>
        <p
          className={selectedClass(k("cardName"))}
          data-builder-key={preview ? k("cardName") : undefined}
          onClick={select(k("cardName"))}
          style={nameStyle}
        >
          {name}
        </p>
      </div>

      <div className="product-details">
        <p
          className={`product-description ${selectedClass(k("cardDescription"))}`}
          data-builder-key={preview ? k("cardDescription") : undefined}
          onClick={select(k("cardDescription"))}
          style={toCss(styles.description, { responsive: true })}
        >
          {description}
        </p>

        <div className="product-bottom">
          <span
            className={`product-price ${selectedClass(k("cardPrice"))}`}
            data-builder-key={preview ? k("cardPrice") : undefined}
            onClick={select(k("cardPrice"))}
            style={toCss(styles.price, { responsive: true })}
          >
            {formatProductPrice(price)}
          </span>

          <div className="product-card-actions">
          <ButtonWrap
            {...buttonProps}
            className={`buy-button ${selectedClass(k("cardButton"))}`}
            data-builder-key={preview ? k("cardButton") : undefined}
            onClick={preview ? select(k("cardButton")) : prepare}
            style={toCss(styles.button, { responsive: true })}
          >
            {(!styles.button?.text||styles.button.text.trim().toLocaleLowerCase('vi')==='xem chi tiết')?'Xem':styles.button.text}
            <svg className="product-view-arrow" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8"/></svg>
          </ButtonWrap>
          {productId&&cartSettings.enabled!==false&&styles.cartEnabled!==false&&<button type="button" className="card-cart-button" aria-label={cartSettings.copy?.add||styles.cartLabel||'Thêm vào giỏ'} onClick={e=>{if(preview)return;e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();window.dispatchEvent(new CustomEvent('orora-cart-add',{detail:{id:productId,source:{x:r.x,y:r.y,width:r.width,height:r.height}}}));}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h2l3 12h10l3-9H6"/><circle cx="9" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg></button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;