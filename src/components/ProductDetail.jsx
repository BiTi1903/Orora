import { matchesProductRoute, productNumber, productPath } from "../lib/product-identity";
import ProductPurchaseSelection from "./ProductPurchaseSelection";
import { productVolumeOptions, selectedVolumeOption, volumePriceText } from "../lib/product-options";
import ProductPhilosophyCard from "./ProductPhilosophyCard";
import useProductReveal from "../hooks/useProductReveal";
import useProductPanelSize from "../hooks/useProductPanelSize";
import ProductInformation from "./ProductInformation";
import ProductAssurances from "./ProductAssurances";
import ProductReviews from "./ProductReviews";
import { productImages, productSections, secondaryProductImages } from "../lib/product-content";
import ConsultationDialog from "./ConsultationDialog";
import OrderForm from "./OrderForm";
import { purchaseChannelLabels, socialShopUrl } from "../lib/commerce";
import { mobileImageVars } from "../lib/image-layout";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getProduct } from "../lib/api";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";
import { contactLinks } from "../lib/contact";
import RelatedProductsSidebar from "./RelatedProductsSidebar";
import { cdnSrc, THUMB, MAIN } from "../lib/cloudinary";

/* Giữ xuống dòng khi admin nhấn Enter — chèn <br /> thật, không phụ thuộc CSS */
const renderLines = (text) =>
  String(text ?? "")
    .split(/\r?\n/)
    .flatMap((line, i) => (i === 0 ? [line] : [<br key={i} />, line]));

function ProductDetail({
  preview = false,
  previewStyles = null,
  previewProduct = null,
  previewProducts = [],
  selectedElement = "",
  onSelect,
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const [orderProductId, setOrderProductId] = useState(null);
  const [purchaseSelection, setPurchaseSelection] = useState(null);
  const [consultationOpen, setConsultationOpen] = useState(false);

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
  const product = preview
    ? previewProduct || null
    : loadedProduct && (loadedProduct.id === id || (loadedProduct.product && matchesProductRoute(loadedProduct.product, id))) ? loadedProduct.product : undefined;

  useEffect(() => {
    if (!preview && product?.canonicalSlug && id !== product.canonicalSlug) navigate(productPath(product), { replace: true });
  }, [id, product, preview, navigate]);

  useProductPanelSize(pageRef, product);
  useProductReveal(pageRef, product, preview);

  /* ---------- lấy sản phẩm từ Firestore ---------- */
  useEffect(() => {
    if (preview) return;

    let alive = true;
    window.scrollTo({ top: 0 });

    getProduct(id)
      .then((p) => {
        if (!alive) return;
        setLoadedProduct({ id, product: p && p.active !== false ? p : null });
      })
      .catch(() => {
        if (alive) setLoadedProduct({ id, product: null });
      });

    return () => {
      alive = false;
    };
  }, [id, preview]);

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  // Hàng đợi vòng: order[0] = khung lớn; order[1..] = dưới (ảnh vừa rời khung lớn → cuối hàng)
  const images = productImages(product || {});
  const galleryKey = JSON.stringify([product?.id, product?.slug, ...images]);
  const [previousGalleryKey, setPreviousGalleryKey] = useState(galleryKey);
  const [order, setOrder] = useState(images);
  const [thumbStart, setThumbStart] = useState(0);
  if (previousGalleryKey !== galleryKey) {
    setPreviousGalleryKey(galleryKey);
    setOrder(images);
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
  const selectionKey = JSON.stringify([product.id || product.slug || id, options]);
  const choice = purchaseSelection?.key === selectionKey ? purchaseSelection : { variantId: "", quantity: 1 };
  const variant = selectedVolumeOption(options, choice.variantId);
  const variantId = variant?.id || "";
  const changeSelection = (patch) => setPurchaseSelection({ key: selectionKey, variantId, quantity: choice.quantity, ...patch });
  const displayedPrice = volumePriceText(product, variant);
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

  // order[0] = đang hiện khung lớn; còn lại = hàng đợi dưới (xoay 2 ảnh, ảnh vừa rời khung lớn nằm cuối)
  const mainImage = (product.image || "").trim();
  const secondaryImages = secondaryProductImages(product).filter((src) => typeof src === "string" && src.trim()).map((src) => src.trim());

  const displaySrc = order[0] || mainImage;
  const thumbPool = order.length > 1 ? order.slice(1) : secondaryImages;

  const promoteToMain = (src) => {
    if (!src || src === displaySrc) return;
    setOrder((prev) => {
      const list = prev.length
        ? prev
        : [mainImage, ...secondaryImages].filter(Boolean);
      const oldMain = list[0];
      const rest = list.slice(1).filter((s) => s !== src);
      // Ảnh được chọn lên đầu; ảnh chính cũ xuống cuối hàng đợi
      return [src, ...rest, oldMain].filter(Boolean);
    });
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

  return (
    <article
      className={`product-detail ${preview ? "product-detail--preview" : ""}`}
      ref={pageRef}
    >
      <div className="product-detail-top">
        {preview ? (
          <span className="product-back">← Về danh sách sản phẩm</span>
        ) : (
          <Link to="/#shop" className="product-back">
            ← Về danh sách sản phẩm
          </Link>
        )}
      </div>

      <div className="product-detail-shell">
      <div className="product-main-column">
      <section className="product-detail-content product-detail-content--with-sections">
        <div className="product-detail-gallery" style={galleryStyle}>
          <div
            className={`product-detail-image ${selectedClass("pdImage")}${
              fixedHeight != null ? " product-detail-image--fixed-h" : ""
            }`}
            style={{
              ...mainImageBoxStyle,
              ["--pd-object-fit"]: objectFitValue,
            }}
            data-builder-key={preview ? "pdImage" : undefined}
            onClick={preview ? select("pdImage") : undefined}
          >
            {displaySrc ? (
              <img
                key={displaySrc}
                src={cdnSrc(displaySrc, MAIN)}
                alt={product.name}
                className="product-detail-main-img"
                style={{ objectFit: objectFitValue }}
              />
            ) : (
              <div className="product-detail-image-placeholder" aria-hidden="true" />
            )}
          </div>

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
            className={`product-detail-price ${selectedClass("pdPrice")}`}
            data-builder-key={preview ? "pdPrice" : undefined}
            onClick={select("pdPrice")}
            style={css("price")}
          >
            {displayedPrice}
          </p>

          <p
            className={`product-detail-description ${selectedClass("pdDescription")}`}
            data-builder-key={preview ? "pdDescription" : undefined}
            onClick={select("pdDescription")}
            style={css("description")}
          >
            {renderLines(product.description)}
          </p>



          <ProductPurchaseSelection options={options} variantId={variantId} quantity={choice.quantity} onVariantChange={(variantId) => changeSelection({ variantId })} onQuantityChange={(quantity) => changeSelection({ quantity })} textProps={textProps} />
          <section className={`purchase-options ${selectedClass("pdPurchaseOptions")}`} aria-label="Chọn kênh mua hàng" data-builder-key={preview ? "pdPurchaseOptions" : undefined} onClick={preview ? select("pdPurchaseOptions") : undefined}>
            <h2 {...textProps("pdPurchaseHeading", "purchaseHeading")}>{purchase.heading?.trim() || "Chọn cách mua hàng"}</h2>
          {(preview || showZalo || showCall || (!contact.zalo && contact.email && contactSettings.showZalo !== false)) && (
            <div className={`product-contact-actions product-consultation ${selectedClass("pdContactActions")}`} aria-label="Tư vấn sản phẩm" data-builder-key={preview ? "pdContactActions" : undefined} onClick={preview ? select("pdContactActions") : undefined}>
              <button type="button" className="purchase-website product-consultation-toggle" style={css("contactActions")} aria-haspopup="dialog" onClick={preview ? select("pdContactActions") : () => setConsultationOpen(true)}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5a9.5 9.5 0 0 1 19 0Z"/><path d="M7 11h10M7 15h6"/></svg>
                <span>{contactSettings.triggerLabel?.trim() || "Tư vấn"}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>
              </button>
              {!preview && consultationOpen && <ConsultationDialog onClose={() => setConsultationOpen(false)}>
              {(preview || showZalo) && <a className="product-contact-primary" href={preview ? undefined : contact.zalo} target={preview ? undefined : "_blank"} rel="noreferrer" style={{ ...css("contactActions"), background: contactSettings.primaryBackground, borderColor: contactSettings.primaryBackground, color: contactSettings.primaryColor, ...(preview && contactSettings.showZalo === false ? { opacity: 0.4 } : {}) }}>{contactSettings.zaloLabel?.trim() || "Tư vấn qua Zalo"}</a>}
              {(preview || showCall) && <a href={preview ? undefined : contact.phone} style={{ ...css("contactActions"), background: contactSettings.secondaryBackground, color: contactSettings.secondaryColor, ...(preview && contactSettings.showCall === false ? { opacity: 0.4 } : {}) }}>{contactSettings.callLabel?.trim() || "Gọi tư vấn"}</a>}
              {!preview && !contact.zalo && contact.email && contactSettings.showZalo !== false && <a className="product-contact-primary" href={contact.email}>Liên hệ qua email</a>}
              </ConsultationDialog>}
            </div>
          )}
            <button type="button" className="purchase-website" style={{ ...css("purchaseOptions"), background: purchase.websiteBackground }} onClick={preview ? select("pdPurchaseOptions") : () => setOrderProductId(product.id || product.slug)} aria-haspopup="dialog" aria-expanded={!preview && orderProductId === (product.id || product.slug)}><svg className="purchase-bag" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/></svg><span>{(purchase.websiteLabel?.trim() && purchase.websiteLabel.trim() !== "Đặt hàng trên website" ? purchase.websiteLabel.trim() : "Đặt hàng ngay")}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14m-5-5 5 5-5 5"/></svg></button>
            {(preview || tiktokShop || facebookShop) && <>
              <div className="purchase-divider"><span>{channelLabels.dividerLabel}</span></div>
              <div className="purchase-social" aria-label="Đặt hàng trên mạng xã hội">
                {(preview || facebookShop) && <a className="purchase-facebook" href={preview ? undefined : facebookShop} target="_blank" rel="noreferrer" style={{ ...css("purchaseOptions"), background: purchase.facebookBackground, ...(purchase.facebookBackground ? { color: "#fff" } : {}), ...toCss(purchase.facebookStyle) }}><svg className="purchase-channel-icon" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-9h3l.5-3.5h-3.5V7.3c0-1 .3-1.8 1.8-1.8h1.9V2.4c-.3 0-1.5-.1-2.8-.1-2.8 0-4.7 1.7-4.7 4.8v2.4H7V13h2.7v9h3.8Z"/></svg><span className={selectedClass("pdFacebookText")} data-builder-key={preview ? "pdFacebookText" : undefined} onClick={preview ? select("pdFacebookText") : undefined}>{channelLabels.facebookLabel}</span><svg className="purchase-external" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>}
                {(preview || tiktokShop) && <a className="purchase-tiktok" href={preview ? undefined : tiktokShop} target="_blank" rel="noreferrer" style={{ ...css("purchaseOptions"), background: purchase.tiktokBackground, ...(purchase.tiktokBackground ? { color: "#fff" } : {}), ...toCss(purchase.tiktokStyle) }}><svg className="purchase-channel-icon" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 2h-3v13.4a3 3 0 1 1-2.5-3V9.3a6.1 6.1 0 1 0 5.5 6.1V8.3a8 8 0 0 0 5 1.7V7a5 5 0 0 1-5-5Z"/></svg><span className={selectedClass("pdTiktokText")} data-builder-key={preview ? "pdTiktokText" : undefined} onClick={preview ? select("pdTiktokText") : undefined}>{channelLabels.tiktokLabel}</span><svg className="purchase-external" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12 12 4M4 4h8v8" /></svg></a>}
              </div>
            </>}
            {!preview && orderProductId === (product.id || product.slug) && <OrderForm key={product.id || product.slug} product={product} home={home} initialVariantId={variantId} initialQuantity={choice.quantity} onSelectionChange={changeSelection} onClose={() => setOrderProductId(null)} />}
          </section>

        </div></div>
      </section>

      <div className="product-detail-lower">
        <ProductInformation sections={sections} css={css} preview={preview} select={select} selectedClass={selectedClass} textProps={textProps} />
      </div>
      </div>
      <div className="product-side-column">
        <ProductAssurances policies={home.productPolicies} textProps={textProps} />
        <ProductPhilosophyCard home={home} textProps={textProps} />
        <RelatedProductsSidebar product={product} preview={preview} previewProducts={previewProducts} styles={ps} selectedElement={selectedElement} onSelect={onSelect} />
        <ProductReviews product={product} textProps={textProps} />
      </div>
      </div>


    </article>
  );
}

export default ProductDetail;