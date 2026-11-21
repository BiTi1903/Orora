import ProductImageLightbox from "./ProductImageLightbox";
import useStorefrontStock from "../hooks/useStorefrontStock";
import ButtonIcon from "./ButtonIcon";
import {createPortal} from "react-dom";
import {defaultPurchaseVariant} from "../lib/purchase-defaults";
import {getAddressOptions} from "../lib/address-api";
import {mobileDetailVars} from "../lib/product-detail-mobile";
import "../styles/product-detail-mobile.css";
import {mobileNavSettings, mobileNavTheme} from "../lib/mobile-shop-nav";
import {animateButtonPress} from "../lib/button-press";
import "../styles/product-detail.css";
import { ProductFaq } from "./ProductDiscovery";
import { careGuideForProduct } from "../lib/product-care-guide";
import ProductCareGuide from "./ProductCareGuide";
import { matchesProductRoute, productNumber, productPath } from "../lib/product-identity";
import ProductPurchaseSelection from "./ProductPurchaseSelection";
import { productVolumeOptions, selectedVolumeOption, volumePriceText } from "../lib/product-options";
import ProductSloganCard from "./ProductSloganCard";
import useProductReveal from "../hooks/useProductReveal";
import useProductPanelSize from "../hooks/useProductPanelSize";
import ProductInformation from "./ProductInformation";
import ProductAssurances from "./ProductAssurances";
import ProductReviews from "./ProductReviews";
import { productImages, productSections, secondaryProductImages } from "../lib/product-content";
import ConsultationDialog from "./ConsultationDialog";
import OrderForm from "./OrderForm";
import { availablePaymentMethods, formatProductPrice, formatVnd, parseVndPrice, purchaseChannelLabels, socialShopUrl } from "../lib/commerce";
import { mobileImageVars } from "../lib/image-layout";
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../lib/api";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";
import { contactLinks } from "../lib/contact";
import RelatedProductsSidebar from "./RelatedProductsSidebar";
import { cdnSrc, THUMB } from "../lib/image-cdn";
import { productMainImage } from "../lib/image-cdn";

/* Giữ xuống dòng khi admin nhấn Enter — chèn <br /> thật, không phụ thuộc CSS */
const renderLines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));

const mobileBuyQuery = "(max-width: 768px)";
const readMobileBuy = () => window.matchMedia(mobileBuyQuery).matches;
function subscribeMobileBuy(update) {
  const media = window.matchMedia(mobileBuyQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
}

function ProductDetail({
  preview = false,
  previewStyles = null,
  previewProduct = null,
  previewProducts = [],
  selectedElement = "",
  onSelect,
}) {
  const cartLocation=useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const mobileBuyRef = useRef(null);
  const [orderProductId, setOrderProductId] = useState(null);
  const [orderSource, setOrderSource] = useState(null);
  const [purchaseSelection, setPurchaseSelection] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [consultationOpen, setConsultationOpen] = useState(false);
  const [consultationSource, setConsultationSource] = useState(null);

  const home = useHomeContent();
  const ps = preview && previewStyles
    ? previewStyles
    : {
        ...(home?.productDetailStyles || {}),
        detailLabels: {
          ...(home?.detailLabels || {}),
          ...(home?.productDetailStyles?.detailLabels || {}),
        },
      };

  // undefined = đang tải, null = không tìm thấy
  const [loadedProduct, setLoadedProduct] = useState(null);
  const [loadVersion,setLoadVersion]=useState(0);
  const product = preview
    ? previewProduct || null
    : loadedProduct && (loadedProduct.id === id || (loadedProduct.product && matchesProductRoute(loadedProduct.product, id))) ? loadedProduct.product : undefined;

  const stockMap = useStorefrontStock([product?.id], !preview);
  const acceptsWebsiteOrders = availablePaymentMethods(home).length > 0;
  const showMobileBuy = Boolean(product) && (preview || acceptsWebsiteOrders);
  const mobileViewport = useSyncExternalStore(subscribeMobileBuy, readMobileBuy, () => false);
  const pinBuyBar = !preview && mobileViewport;
  useLayoutEffect(() => {
    if (!showMobileBuy || !pinBuyBar) return;
    const bar = mobileBuyRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const reserve = () => root.style.setProperty("--product-mobile-buy-height", `${bar.offsetHeight}px`);
    const observer = new ResizeObserver(reserve);
    observer.observe(bar);
    reserve();
    return () => {
      observer.disconnect();
      root.style.removeProperty("--product-mobile-buy-height");
    };
  }, [showMobileBuy, pinBuyBar]);

  useEffect(() => {
    if (!preview && product?.canonicalSlug && id !== product.canonicalSlug) navigate(productPath(product), { replace: true, state: cartLocation.state });
  }, [id, product, preview, navigate, cartLocation.state]);

  const productIdentity = product?.id || product?.slug;
  useLayoutEffect(() => { if (!preview && productIdentity) window.scrollTo({ top: 0, behavior: "instant" }); }, [productIdentity, preview]);

  useProductPanelSize(pageRef, product);
  useProductReveal(pageRef, product, preview);

  /* ---------- lấy sản phẩm từ Firestore ---------- */
  useEffect(() => {
    if (preview) return;

    let alive = true;

    getProduct(id)
      .then((p) => {
        if (!alive) return;
        setLoadedProduct({ id, product: p && p.active !== false ? p : null });
      })
      .catch(() => {
        if (alive) setLoadedProduct({ id, product: null, error:true });
      });

    return () => {
      alive = false;
    };
  }, [id, preview, loadVersion]);

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  // Giữ thứ tự ảnh cố định (không tráo thumbnail khi chọn) và hỗ trợ vuốt ngang trên mobile
  const images = productImages(product || {});
  const galleryKey = JSON.stringify([product?.id, product?.slug, ...images]);
  const [previousGalleryKey, setPreviousGalleryKey] = useState(galleryKey);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [thumbStart, setThumbStart] = useState(0);
  const swipeStartRef = useRef(null);
  if (previousGalleryKey !== galleryKey) {
    setPreviousGalleryKey(galleryKey);
    setActiveImageIndex(0);
    setThumbStart(0);
  }

  /* ---------- đang tải ---------- */
  if (product === undefined) {
    return (
      <div className="product-not-found">
        <div className="detail-loading" role="status" aria-live="polite"><div className="loading-placeholder" /><p>Đang tải sản phẩm…</p></div>
      </div>
    );
  }

  /* A failed read is retryable; it does not prove the product was removed. */
  if(!preview&&loadedProduct?.id===id&&loadedProduct.error){
    const copy=ps.loadError||{},style=key=>({...toCss(copy[key]),textDecoration:copy[key]?.textDecoration});
    return <section className="product-not-found product-load-error" role="alert"><h1 style={style('titleStyle')}>{copy.title?.trim()||'Chưa tải được sản phẩm'}</h1><p style={style('bodyStyle')}>{copy.text?.trim()||'Kết nối đang gián đoạn. Vui lòng thử tải lại thông tin sản phẩm.'}</p><button type="button" style={style('buttonStyle')} onClick={()=>{setLoadedProduct(null);setLoadVersion(version=>version+1);}}>{copy.retryLabel?.trim()||'Thử tải lại'}</button></section>;
  }

  /* ---------- không tìm thấy ---------- */
  if (product === null) {
    return (
      <div className="product-not-found">
        <h1>Không tìm thấy sản phẩm</h1>
        <Link to="/#shop">← Về danh sách sản phẩm</Link>
      </div>
    );
  }

  const options = productVolumeOptions(product);
  const selectionKey = JSON.stringify([product.id || product.slug || id, options, cartLocation.key]);
  const incoming=cartLocation.state?.cartSelection;
  const initialCart=incoming?.productId===product.id?{variantId:options.some(o=>o.id===incoming.variantId)?incoming.variantId:'',quantity:Number.isInteger(incoming.quantity)?Math.max(1,Math.min(20,incoming.quantity)):1}:{variantId:defaultPurchaseVariant(product,options)?.id||'',quantity:1};
  const choice = purchaseSelection?.key === selectionKey ? purchaseSelection : initialCart;
  const variant = selectedVolumeOption(options, choice.variantId);
  const variantId = variant?.id || "";
  const stock = (variantId && stockMap[`${product.id}__${variantId}`]) || stockMap[product.id];
  const soldOut = stock === "out";
  const changeSelection = (patch) => setPurchaseSelection((previous) => ({ key: selectionKey, variantId, quantity: choice.quantity, ...(previous?.key === selectionKey ? previous : {}), ...patch }));
  const displayedPrice = volumePriceText(product, variant);
  const unitPrice = parseVndPrice(displayedPrice);
  const mobileSubtotal = choice.quantity === "" ? "Chọn số lượng" : unitPrice === null ? formatProductPrice(displayedPrice) : formatVnd(unitPrice * choice.quantity);
  const purchase = ps.purchaseOptions || {};
  const channelLabels = purchaseChannelLabels(purchase);
  const tiktokShop = socialShopUrl(home.shopLinks?.tiktokUrl, "tiktok");
  const facebookShop = socialShopUrl(home.shopLinks?.facebookUrl, "facebook");
  const contactSettings = ps.contactActions || {};
  const contact = contactLinks(home, product.name, contactSettings);
  const showZalo = contactSettings.showZalo !== false && !!contact.zalo;
  const showCall = contactSettings.showCall !== false && !!contact.phone;
  const detailLabels = ps.detailLabels || {};
  const sections = productSections(product, {
    story: ps.aboutTitle?.text,
    material: detailLabels.material || ps.materialLabel?.text,
    size: detailLabels.size || ps.sizeLabel?.text,
    color: detailLabels.color || ps.colorLabel?.text,
    origin: detailLabels.origin || ps.originLabel?.text,
  }).filter((section) => section.content?.trim());


  const css = (key) => toCss(ps[key], { responsive: true });
  const textProps = (key, styleKey) => ({ style: css(styleKey), className: selectedClass(key), "data-builder-key": preview ? key : undefined, onClick: preview ? select(key) : undefined });

  const mainImage = (product.image || "").trim();
  const secondaryImages = secondaryProductImages(product).filter((src) => typeof src === "string" && src.trim()).map((src) => src.trim());
  const allImages = images.length ? images : [mainImage, ...secondaryImages].filter(Boolean);
  const safeIndex = activeImageIndex < allImages.length ? activeImageIndex : 0;
  const displaySrc = allImages[safeIndex] || mainImage;
  const thumbPool = allImages.length > 1 ? allImages : secondaryImages;

  const promoteToMain = (src) => {
    const idx = allImages.indexOf(src);
    if (idx >= 0) setActiveImageIndex(idx);
  };
  const stepMainImage = (delta) => {
    if (allImages.length <= 1) return;
    setActiveImageIndex((current) => (current + delta + allImages.length) % allImages.length);
  };

  // Layout từ Visual Builder — ngang/margin/padding cả khối; dọc chỉ khung ảnh chính
  const imageLayout = ps.imageLayout || {};
  const thumbsLayout = ps.thumbsLayout || {};
  const n = (v) => {
    const x = Number(v);
    return Number.isFinite(x) ? x : 0;
  };
  const px = (v) => `${n(v)}px`;

  const widthPercent = Math.min(
    100,
    Math.max(20, n(imageLayout.widthPercent) || 100)
  );
  const mL = n(imageLayout.marginLeft);
  const mR = n(imageLayout.marginRight);
  const mT = n(imageLayout.marginTop);
  const mB = n(imageLayout.marginBottom);
  const fixedHeight =
    imageLayout.height != null && n(imageLayout.height) > 0
      ? n(imageLayout.height)
      : null;

  const galleryWidth =
    mL || mR
      ? `calc(${widthPercent}% - ${mL + mR}px)`
      : `${widthPercent}%`;

  // Cả khối gallery (ảnh chính + ảnh phụ) đi cùng nhau
  const galleryStyle = {
    width: galleryWidth,
    maxWidth: imageLayout.maxWidth != null && n(imageLayout.maxWidth) > 0
      ? px(imageLayout.maxWidth)
      : "100%",
    boxSizing: "border-box",
    marginTop: px(mT),
    marginRight: px(mR),
    marginBottom: px(mB),
    marginLeft: px(mL),
    gap: px(imageLayout.gap ?? 14),
  };

  const mainImageBoxStyle = {
    ...mobileImageVars(imageLayout),
    width: "100%",
    ["--pd-height"]: fixedHeight != null ? `${fixedHeight}px` : "auto",
    ["--pd-aspect"]:
      fixedHeight != null
        ? "auto"
        : imageLayout.aspectRatio || "3 / 4",
    height: fixedHeight != null ? `${fixedHeight}px` : undefined,
    minHeight: fixedHeight != null ? `${fixedHeight}px` : undefined,
    maxHeight: fixedHeight != null ? `${fixedHeight}px` : undefined,
    aspectRatio:
      fixedHeight != null
        ? "auto"
        : imageLayout.aspectRatio || undefined,
    borderRadius: imageLayout.radius != null ? px(imageLayout.radius) : undefined,
    borderWidth:
      imageLayout.borderWidth != null ? px(imageLayout.borderWidth) : undefined,
    borderColor: imageLayout.borderColor || undefined,
    borderStyle:
      imageLayout.borderWidth != null && n(imageLayout.borderWidth) > 0
        ? "solid"
        : undefined,
    paddingTop: px(imageLayout.paddingTop),
    paddingRight: px(imageLayout.paddingRight),
    paddingBottom: px(imageLayout.paddingBottom),
    paddingLeft: px(imageLayout.paddingLeft),
    boxSizing: "border-box",
  };

  const objectFitValue = imageLayout.objectFit || "cover";

  const thumbsWrapStyle = {
    marginTop: px(thumbsLayout.marginTop),
    marginRight: px(thumbsLayout.marginRight),
    marginBottom: px(thumbsLayout.marginBottom),
    marginLeft: px(thumbsLayout.marginLeft),
    paddingTop: px(thumbsLayout.paddingTop),
    paddingRight: px(thumbsLayout.paddingRight),
    paddingBottom: px(thumbsLayout.paddingBottom),
    paddingLeft: px(thumbsLayout.paddingLeft),
    boxSizing: "border-box",
  };

  const thumbsGridStyle = {
    "--thumb-count": undefined, // set later
    gap: px(thumbsLayout.gap) ?? "10px",
  };

  const thumbFixedH =
    thumbsLayout.height != null && Number(thumbsLayout.height) > 0
      ? Number(thumbsLayout.height)
      : null;

  const thumbBtnBaseStyle = {
    borderRadius: px(thumbsLayout.radius),
    borderWidth: px(thumbsLayout.borderWidth),
    borderStyle:
      thumbsLayout.borderWidth != null && Number(thumbsLayout.borderWidth) > 0
        ? "solid"
        : "solid",
    borderColor: thumbsLayout.borderColor || "transparent",
    height: thumbFixedH != null ? `${thumbFixedH}px` : undefined,
    aspectRatio: thumbFixedH != null ? "auto" : "1",
  };

  // Cửa sổ 2 ảnh trong vòng (chính + phụ), xoay nếu > 2
  const visibleThumbs = (() => {
    if (thumbPool.length <= 2) return thumbPool;
    return [0, 1].map(
      (offset) => thumbPool[(thumbStart + offset) % thumbPool.length]
    );
  })();

  const canSlideThumbs = thumbPool.length > 2;
  const goThumbPrev = () => {
    if (!canSlideThumbs) return;
    setThumbStart((s) => (s - 1 + thumbPool.length) % thumbPool.length);
  };
  const goThumbNext = () => {
    if (!canSlideThumbs) return;
    setThumbStart((s) => (s + 1) % thumbPool.length);
  };

  const websiteButtonStyle = { ...css("purchaseOptions"), background: purchase.websiteBackground };
  // Keep the live fixed bar outside the product content stacking contexts.
  const mobileBuyBar = showMobileBuy && (
    <div ref={mobileBuyRef} className={`product-mobile-buy ${preview ? "is-preview " : ""}${selectedClass("pdWebsiteText")}`} data-builder-key={preview ? "pdWebsiteText" : undefined} onClick={preview ? select("pdWebsiteText") : undefined} style={{
      ...mobileNavTheme(mobileNavSettings(home.navStyles?.mobile)),
      ...(purchase.websiteBackground ? { "--quick-buy-cta-bg": purchase.websiteBackground } : {}),
      ...(purchase.subtotalBackground ? { "--quick-buy-bg": purchase.subtotalBackground } : {}),
      ...(purchase.subtotalBorderColor ? { "--quick-buy-border": purchase.subtotalBorderColor } : {}),
      ...(purchase.quickBuyOpacity != null ? { "--quick-buy-opacity": `${Math.max(45, Math.min(95, Number(purchase.quickBuyOpacity)))}%` } : {}),
      ...(purchase.quickBuyBlur != null ? { "--quick-buy-blur": `${Math.max(6, Math.min(32, Number(purchase.quickBuyBlur)))}px` } : {}),
      ...(purchase.subtotalRadius != null ? { "--quick-buy-radius": `${Math.max(12, Math.min(32, Number(purchase.subtotalRadius)))}px` } : {}),
    }}>
      <span className="product-mobile-buy-lens" aria-hidden="true" />
      <div className="product-mobile-buy-total" aria-live="polite">
        <strong style={toCss(purchase.subtotalValueStyle)}>{mobileSubtotal}</strong>
        {choice.quantity !== "" && <small style={toCss(purchase.subtotalLabelStyle)}>{variant ? `${variant.label} · ` : ""}{choice.quantity} sản phẩm</small>}
      </div>
      <div className="product-mobile-buy-actions">
        {home.navStyles?.cart?.enabled !== false && (
          <button
            type="button"
            className={`product-buy-cart-btn ${selectedClass("pdAddToCart")}`}
            data-builder-key={preview ? "pdAddToCart" : undefined}
            aria-label={soldOut ? "Hết hàng" : (purchase.addToCartLabel?.trim() || "Thêm vào giỏ")}
            title={soldOut ? "Hết hàng" : (purchase.addToCartLabel?.trim() || "Thêm vào giỏ")}
            style={{
              ...(purchase.addToCartBackground ? { background: purchase.addToCartBackground } : {}),
              ...(purchase.addToCartBorderColor ? { borderColor: purchase.addToCartBorderColor } : {}),
              ...toCss(purchase.addToCartStyle, { responsive: true }),
            }}
            disabled={soldOut || choice.quantity === ""}
            onClick={(event) => {
              event.stopPropagation();
              if (preview) { select("pdAddToCart")(event); return; }
              window.dispatchEvent(new CustomEvent("orora-cart-confirm", {
                detail: { product, variantId, quantity: Number(choice.quantity) || 1, source: event.currentTarget.getBoundingClientRect().toJSON() },
              }));
            }}
          >
            <ButtonIcon name="productCart" defaultSize={18} allowHidden={false}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M2.5 3.5h2.6l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h9.8a1.6 1.6 0 0 0 1.6-1.2L22 7.5H6.2" />
              </svg>
            </ButtonIcon>
          </button>
        )}
        <button type="button" className="purchase-website product-mobile-buy-cta" style={websiteButtonStyle} aria-haspopup="dialog" aria-expanded={!preview && acceptsWebsiteOrders && !soldOut && orderProductId === (product.id || product.slug)} disabled={soldOut}
          onPointerEnter={() => { if (!preview) getAddressOptions().catch(() => {}); }}
          onFocus={() => { if (!preview) getAddressOptions().catch(() => {}); }}
          onClick={(event) => {
            if (preview) { select("pdWebsiteText")(event); return; }
            const btn = event.currentTarget;
            animateButtonPress(btn, true, home.navStyles?.surfaces);
            const pressEnabled = home.navStyles?.surfaces?.pressFeedback !== false && document.documentElement.dataset.buttonPress !== "off";
            if (pressEnabled && !window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) {
              const pulseColor = purchase.websiteBackground || getComputedStyle(btn).backgroundColor || "var(--rose-deep)";
              btn.animate?.([
                { boxShadow: `0 6px 18px color-mix(in srgb, ${pulseColor} 28%, transparent), 0 0 0 0 color-mix(in srgb, ${pulseColor} 45%, transparent)` },
                { boxShadow: `0 10px 26px color-mix(in srgb, ${pulseColor} 38%, transparent), 0 0 0 12px color-mix(in srgb, ${pulseColor} 0%, transparent)` },
              ], { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
            }
            setOrderSource(btn.getBoundingClientRect().toJSON());
            setOrderProductId(product.id || product.slug);
          }}><ButtonIcon name="orderNow" defaultSize={16}/><span>{soldOut ? "Hết hàng" : (purchase.mobileBuyLabel?.trim() || (purchase.websiteLabel?.trim() && !["Đặt hàng trên website", "Đặt hàng ngay"].includes(purchase.websiteLabel.trim()) ? purchase.websiteLabel.trim() : "Mua ngay"))}</span><ButtonIcon name="orderArrow" defaultSize={15}/></button>
      </div>
    </div>
  );

  return (
    <article
      className={`product-detail ${preview ? "product-detail--preview" : ""}`}
      ref={pageRef}
      style={mobileDetailVars(ps.mobileLayout)}
    >
      <div className="product-detail-top">
        {preview ? (
          <span className="product-back">← Về danh sách sản phẩm</span>
        ) : (
          <nav className="product-breadcrumb" aria-label="Đường dẫn trang">
            <Link to="/">Trang chủ</Link><span aria-hidden="true">/</span>
            <Link to={{ pathname: "/", search: cartLocation.state?.catalogSearch || "", hash: "#shop" }}
              onClick={event => {
                if (cartLocation.state?.catalogSearch === undefined || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                event.preventDefault();
                navigate(-1);
              }}>Sản phẩm</Link><span aria-hidden="true">/</span><span aria-current="page">{product.name}</span>
          </nav>
        )}
      </div>

      <div className="product-detail-shell">
      <div className="product-main-column">
      <section className="product-detail-content product-detail-content--with-sections">
        <div className="product-detail-gallery" style={galleryStyle}>
          <div
            className={`product-detail-image ${!preview && displaySrc ? "is-interactive " : ""}${selectedClass("pdImage")}${
              fixedHeight != null ? " product-detail-image--fixed-h" : ""
            }`}
            style={{
              ...mainImageBoxStyle,
              ["--pd-object-fit"]: objectFitValue,
            }}
            data-builder-key={preview ? "pdImage" : undefined}
            role={!preview && displaySrc ? "button" : undefined}
            tabIndex={!preview && displaySrc ? 0 : undefined}
            aria-label={!preview && displaySrc ? "Phóng to ảnh" : undefined}
            onClick={
              preview
                ? select("pdImage")
                : displaySrc
                  ? () => setLightbox(displaySrc)
                  : undefined
            }
            onKeyDown={
              !preview && displaySrc
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setLightbox(displaySrc);
                    } else if (allImages.length > 1 && event.key === "ArrowLeft") {
                      event.preventDefault();
                      stepMainImage(-1);
                    } else if (allImages.length > 1 && event.key === "ArrowRight") {
                      event.preventDefault();
                      stepMainImage(1);
                    }
                  }
                : undefined
            }
            onTouchStart={!preview && allImages.length > 1 ? (event) => {
              const t = event.touches?.[0];
              if (t) swipeStartRef.current = { x: t.clientX, y: t.clientY };
            } : undefined}
            onTouchEnd={!preview && allImages.length > 1 ? (event) => {
              const start = swipeStartRef.current;
              swipeStartRef.current = null;
              const t = event.changedTouches?.[0];
              if (!start || !t) return;
              const dx = t.clientX - start.x;
              const dy = t.clientY - start.y;
              if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2) {
                event.preventDefault();
                stepMainImage(dx < 0 ? 1 : -1);
              }
            } : undefined}
          >
            {displaySrc ? (
              <img
                key={displaySrc}
                src={productMainImage(displaySrc, window.innerWidth)}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                alt={product.name}
                className="product-detail-main-img"
                style={{ objectFit: objectFitValue }}
              />
            ) : (
              <div className="product-detail-image-placeholder" aria-hidden="true" />
            )}
            {!preview && allImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="product-image-nav prev"
                  aria-label="Ảnh trước"
                  onClick={(event) => { event.stopPropagation(); stepMainImage(-1); }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="product-image-nav next"
                  aria-label="Ảnh sau"
                  onClick={(event) => { event.stopPropagation(); stepMainImage(1); }}
                >
                  ›
                </button>
                <span className="product-image-counter" aria-hidden="true">
                  {safeIndex + 1} / {allImages.length}
                </span>
              </>
            )}
            {!preview && displaySrc && (
              <span className="product-image-zoom-hint" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35M11 8v6M8 11h6" />
                </svg>
              </span>
            )}
          </div>

          {!preview && lightbox && (
            <ProductImageLightbox
              src={lightbox}
              images={allImages}
              initialIndex={safeIndex}
              name={product.name}
              onClose={() => setLightbox(null)}
            />
          )}
          {secondaryImages.length > 0 && (
            <div
              className={`product-detail-thumbs-wrap ${selectedClass("pdThumbs")}`}
              style={thumbsWrapStyle}
              data-builder-key={preview ? "pdThumbs" : undefined}
              onClick={preview ? select("pdThumbs") : undefined}
            >
              {canSlideThumbs && (
                <button
                  type="button"
                  className="product-detail-thumb-nav prev"
                  aria-label="Ảnh phụ trước"
                  onClick={(e) => {
                    e.stopPropagation();
                    goThumbPrev();
                  }}
                >
                  ‹
                </button>
              )}

              <div
                className="product-detail-thumbs"
                role="tablist"
                aria-label="Ảnh phụ"
                style={{
                  ...thumbsGridStyle,
                  "--thumb-count": visibleThumbs.length,
                }}
              >
                {visibleThumbs.map((src, i) => {
                  const isActive = displaySrc === src;
                  const activeColor =
                    thumbsLayout.activeBorderColor || "#b8446d";
                  const idleColor =
                    thumbsLayout.borderColor || "transparent";
                  return (
                    <button
                      key={`${src}-${i}-${thumbStart}`}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`product-detail-thumb${isActive ? " is-active" : ""}`}
                      style={{
                        ...thumbBtnBaseStyle,
                        borderColor: isActive ? activeColor : idleColor,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        promoteToMain(src);
                        if (preview && onSelect) onSelect("pdThumbs");
                      }}
                    >
                      <img src={cdnSrc(src, THUMB)} alt="" draggable={false} />
                    </button>
                  );
                })}
              </div>

              {canSlideThumbs && (
                <button
                  type="button"
                  className="product-detail-thumb-nav next"
                  aria-label="Ảnh phụ sau"
                  onClick={(e) => {
                    e.stopPropagation();
                    goThumbNext();
                  }}
                >
                  ›
                </button>
              )}
            </div>
          )}
        </div>

        <div className="product-detail-info"><div className="product-purchase-content">
          <p
            className={`product-detail-number ${selectedClass("pdNumber")}`}
            data-builder-key={preview ? "pdNumber" : undefined}
            onClick={select("pdNumber")}
            style={css("number")}
          >
            {productNumber(product)}
          </p>

          <h1
            className={selectedClass("pdName")}
            data-builder-key={preview ? "pdName" : undefined}
            onClick={select("pdName")}
            style={css("name")}
          >
            {product.name}
          </h1>

          <p
            className={`product-detail-price${parseVndPrice(displayedPrice) !== null ? " is-numeric" : ""} ${selectedClass("pdPrice")}`}
            data-builder-key={preview ? "pdPrice" : undefined}
            onClick={select("pdPrice")}
            style={css("price")}
          >
            {formatProductPrice(displayedPrice)}
            {variant && <small className="product-price-variant" style={toCss(ps.selectionValue)}> / {variant.label}</small>}
          </p>

          <p
            className={`product-detail-description ${selectedClass("pdDescription")}`}
            data-builder-key={preview ? "pdDescription" : undefined}
            onClick={select("pdDescription")}
            style={css("description")}
          >
            {renderLines(product.description)}
          </p>



          {(stock === "out" || stock === "low") && <p className={`product-stock-badge is-${stock}`}>{soldOut ? "Hết hàng" : "Còn ít"}</p>}
          <ProductPurchaseSelection options={options} variantId={variantId} quantity={choice.quantity} onVariantChange={(variantId) => changeSelection({ variantId })} onQuantityChange={(quantity) => changeSelection({ quantity })} disabled={soldOut} textProps={textProps} />
          <section className={`purchase-options ${selectedClass("pdPurchaseOptions")}`} aria-label="Chọn kênh mua hàng" data-builder-key={preview ? "pdPurchaseOptions" : undefined} onClick={preview ? select("pdPurchaseOptions") : undefined}>
            <h2 {...textProps("pdPurchaseHeading", "purchaseHeading")}>{purchase.heading?.trim() || "Chọn cách mua hàng"}</h2>
            <div className="purchase-channels-row">
              {(preview || (contactSettings.showTrigger === true && (showZalo || showCall || home.chatSettings?.enabled !== false || (!contact.zalo && contact.email && contactSettings.showZalo !== false)))) && (
                <div className={`product-contact-actions product-consultation ${selectedClass("pdContactActions")}`} aria-label="Tư vấn sản phẩm" data-builder-key={preview ? "pdContactActions" : undefined} onClick={preview ? select("pdContactActions") : undefined} style={preview && contactSettings.showTrigger !== true ? { opacity: 0.42 } : undefined}>
                  <button type="button" className="product-consultation-toggle" style={css("contactActions")} aria-haspopup="dialog" onClick={preview ? select("pdContactActions") : (event) => { setConsultationSource(event.currentTarget.getBoundingClientRect().toJSON()); setConsultationOpen(true); }}>
                    <ButtonIcon name="consultation" defaultSize={15}/>
                    <span>{contactSettings.triggerLabel?.trim() || "Tư vấn"}</span>
                  </button>
                  {!preview && consultationOpen && <ConsultationDialog source={consultationSource} onClose={() => setConsultationOpen(false)}>
                    {(preview || showZalo) && (
                      <a className="consultation-choice is-zalo" href={preview ? undefined : contact.zalo} target={preview ? undefined : "_blank"} rel="noreferrer" onClick={() => setConsultationOpen(false)} style={{ ...css("contactActions"), background: contactSettings.primaryBackground, borderColor: contactSettings.primaryBackground, color: contactSettings.primaryColor }}>
                        <strong>{contactSettings.zaloLabel?.trim() || "Tư vấn qua Zalo"}</strong>
                        <span>Nhắn tin trực tiếp với chuyên viên ORORA</span>
                      </a>
                    )}
                    {home.chatSettings?.enabled !== false && (
                      <button type="button" className="consultation-choice is-ai" onClick={() => { setConsultationOpen(false); window.dispatchEvent(new CustomEvent("orora-chat-open", { detail: { channel: "ai" } })); }}>
                        <strong>Tư vấn cùng AI</strong>
                        <span>Trợ lý AI giải đáp nhanh thành phần & cách dùng</span>
                      </button>
                    )}
                    {(preview || showCall) && (
                      <a className="consultation-choice is-call" href={preview ? undefined : contact.phone} onClick={() => setConsultationOpen(false)} style={{ ...css("contactActions"), background: contactSettings.secondaryBackground, color: contactSettings.secondaryColor }}>
                        <strong>{contactSettings.callLabel?.trim() || "Gọi tư vấn"}</strong>
                        <span>Hỗ trợ trực tiếp qua điện thoại</span>
                      </a>
                    )}
                    {!preview && !contact.zalo && contact.email && contactSettings.showZalo !== false && <a className="consultation-choice" href={contact.email}><strong>Liên hệ qua email</strong><span>Gửi câu hỏi tới đội ngũ ORORA</span></a>}
                  </ConsultationDialog>}
                </div>
              )}
              {!soldOut && (preview || tiktokShop || facebookShop) && (
                <div className="purchase-social" aria-label="Đặt hàng trên mạng xã hội">
                  {(preview || facebookShop) && <a className="purchase-facebook" href={preview ? undefined : facebookShop} target="_blank" rel="noreferrer" style={{ ...css("purchaseOptions"), background: purchase.facebookBackground, ...(purchase.facebookBackground ? { color: "#fff" } : {}), ...toCss(purchase.facebookStyle) }}><ButtonIcon name="facebook" defaultSize={15}/><span className={selectedClass("pdFacebookText")} data-builder-key={preview ? "pdFacebookText" : undefined} onClick={preview ? select("pdFacebookText") : undefined}>{channelLabels.facebookLabel}</span><svg className="purchase-external" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>}
                  {(preview || tiktokShop) && <a className="purchase-tiktok" href={preview ? undefined : tiktokShop} target="_blank" rel="noreferrer" style={{ ...css("purchaseOptions"), background: purchase.tiktokBackground, ...(purchase.tiktokBackground ? { color: "#fff" } : {}), ...toCss(purchase.tiktokStyle) }}><ButtonIcon name="tiktok" defaultSize={15}/><span className={selectedClass("pdTiktokText")} data-builder-key={preview ? "pdTiktokText" : undefined} onClick={preview ? select("pdTiktokText") : undefined}>{channelLabels.tiktokLabel}</span><svg className="purchase-external" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>}
                </div>
              )}
            </div>
            {!pinBuyBar && mobileBuyBar}
            {!preview && acceptsWebsiteOrders && !soldOut && orderProductId === (product.id || product.slug) && createPortal(<OrderForm key={product.id || product.slug} product={product} motionSource={orderSource} home={home} selection={{ variantId, quantity: choice.quantity }} fromCart={incoming?.productId === product.id} onSelectionChange={changeSelection} onClose={() => setOrderProductId(null)} />, document.body)}
          </section>

        </div></div>
      </section>

      <div className="product-detail-lower">
        <ProductInformation key={`${product.id||product.slug}:${ps.informationTabs?.defaultTab||"description"}`} settings={ps.informationTabs} sections={sections} css={css} preview={preview} select={select} selectedClass={selectedClass} textProps={textProps} />
      </div>
      {!home.loading && <><ProductCareGuide value={careGuideForProduct(home.productCareGuide, product)} /><ProductFaq value={home.productFaq} product={product} /></>}
      </div>
      <div className="product-side-column">
        <ProductAssurances policies={home.productPolicies} textProps={textProps} />
        <ProductSloganCard home={home} styles={ps} textProps={textProps} cardProps={{ className: selectedClass("pdSloganCard"), "data-builder-key": preview ? "pdSloganCard" : undefined, onClick: preview ? select("pdSloganCard") : undefined }} />
        <RelatedProductsSidebar product={product} preview={preview} previewProducts={previewProducts} styles={ps} selectedElement={selectedElement} onSelect={onSelect} />
        <ProductReviews product={product} textProps={textProps} />
      </div>
      </div>


      {pinBuyBar && mobileBuyBar && createPortal(mobileBuyBar, document.body)}
    </article>
  );
}

export default ProductDetail;
