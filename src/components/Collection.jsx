import { useState } from "react";
import ProductCard from "./ProductCard";
import useCategories from "../hooks/useCategories";
import useProducts from "../hooks/useProducts";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";

function Collection({
  preview = false,
  previewData = null,
  selectedElement = "",
  onSelect,
  sampleProducts = null,
  /** Loại trừ sản phẩm hiện tại (trang chi tiết → "Sản phẩm khác") */
  excludeId = null,
  /** Ghi đè tiêu đề khi dùng làm block liên quan */
  forceLabel = null,
  forceTitle = null,
  forceHighlight = null,
  /** Tiêu đề 1 ô (xuống dòng bằng \n) + đổi màu N ký tự cuối */
  singleTitle = false,
  titleAccent = null,
  /** Kiểu riêng khi dùng làm "Sản phẩm khác" (không đụng tới Collection ở trang chủ) */
  headStylesOverride = null,
  cardStylesOverride = null,
  /** Đổi key khi chọn trong builder (colTitle → relTitle, cardName → relName...) */
  keyMap = null,
  /** class thêm (vd: related products dưới chi tiết) */
  className = "",
}) {
  const { products: liveProducts, loading } = useProducts({ enabled: !preview });
  const liveHome = useHomeContent();
  const { categories } = useCategories();
  const [categoryId, setCategoryId] = useState("");
  const [visibleCount, setVisibleCount] = useState(6);
  const homeLoading = !preview && liveHome.loading !== false;

  const home = preview && previewData ? previewData : liveHome || {};
  const rawProducts = preview ? sampleProducts || [] : liveProducts;

  const availableProducts = excludeId
    ? rawProducts.filter(
        (p) => p.id !== excludeId && p.slug !== excludeId
      )
    : rawProducts;

  const products = categoryId ? availableProducts.filter((product) => product.categoryId === categoryId) : availableProducts;

  // Không có chữ mặc định: chờ dữ liệu Firebase tải xong rồi mới hiện (tránh nháy dữ liệu cũ)
  const pick = (forced, own, hint) => {
    if (homeLoading) return "";
    const text = forced ?? own ?? "";
    return text || (preview ? hint : "");
  };
  const collectionLabel = pick(forceLabel, home.collectionLabel, "Nhãn nhỏ");
  const collectionTitle = pick(forceTitle, home.collectionTitle, "Tiêu đề dòng 1");
  const collectionHighlight = pick(forceHighlight, home.collectionHighlight, "Tiêu đề dòng 2");

  const headStyles = headStylesOverride || home.collectionStyles || {};
  const cardStyles = cardStylesOverride || home.productCardStyles || {};
  const k = (name) => keyMap?.[name] || name;
  const isRelated = !!headStylesOverride;

  const alignSelfMap = { left: "flex-start", center: "center", right: "flex-end" };
  const labelAlign = headStyles.label?.textAlign || "left";

  const select = (key) => (e) => {
    if (!preview || !onSelect) return;
    e.preventDefault();
    e.stopPropagation();
    onSelect(key);
  };

  const selectedClass = (key) =>
    preview && selectedElement === key ? "builder-selected" : "";

  /* Tiêu đề 1 ô: giữ xuống dòng, đổi màu N ký tự cuối (không tính \n) */
  const renderTitle = () => {
    const count = Number(titleAccent?.count) || 0;
    if (!singleTitle || count <= 0) return collectionTitle;
    const chars = Array.from(collectionTitle);
    let seen = 0;
    let cut = chars.length;
    while (cut > 0 && seen < count) {
      cut -= 1;
      if (chars[cut] !== "\n") seen += 1;
    }
    return (
      <>
        {chars.slice(0, cut).join("")}
        <span style={{ color: titleAccent?.color || "#e2678f" }}>
          {chars.slice(cut).join("")}
        </span>
      </>
    );
  };

  const sectionStyle = isRelated
    ? toCss(headStyles.section, { responsive: true })
    : undefined;
  const headerStyle = isRelated
    ? toCss(headStyles.header, { responsive: true })
    : undefined;

  return (
    <section
      className={`collection ${preview ? "collection--preview" : ""} ${className} ${selectedClass(k("colSection"))}`.trim()}
      id={preview || excludeId ? undefined : "shop"}
      style={sectionStyle}
      data-builder-key={preview && isRelated ? k("colSection") : undefined}
      onClick={isRelated ? select(k("colSection")) : undefined}
    >
      {/* HEADER */}
      <div
        className={`collection-header ${selectedClass(k("colHeader"))}`.trim()}
        style={headerStyle}
        data-builder-key={preview && isRelated ? k("colHeader") : undefined}
        onClick={isRelated ? select(k("colHeader")) : undefined}
      >
        <p
          className={`collection-label ${selectedClass(k("colLabel"))}`}
          data-builder-key={preview ? k("colLabel") : undefined}
          onClick={select(k("colLabel"))}
          style={{
            ...toCss(headStyles.label, { responsive: true }),
            textAlign: labelAlign,
            alignSelf: alignSelfMap[labelAlign] || "flex-start",
            ...(collectionLabel ? {} : { display: "none" }),
          }}
        >
          {collectionLabel}
        </p>

        <h2>
          <span
            className={`collection-title-line ${selectedClass(k("colTitle"))}`}
            data-builder-key={preview ? k("colTitle") : undefined}
            onClick={select(k("colTitle"))}
            style={{
              textAlign: "center",
              ...toCss(headStyles.title, { responsive: true }),
            }}
          >
            {renderTitle()}
          </span>

          {!singleTitle && (
            <span
              className={`collection-title-line ${selectedClass(k("colHighlight"))}`}
              data-builder-key={preview ? k("colHighlight") : undefined}
              onClick={select(k("colHighlight"))}
              style={{
                textAlign: "center",
                ...toCss(headStyles.highlight, { responsive: true }),
              }}
            >
              {collectionHighlight}
            </span>
          )}
        </h2>
      </div>

      {!preview && !isRelated && categories.length > 0 && (
        <nav className="collection-categories" aria-label="Danh mục sản phẩm">
          <button type="button" aria-pressed={!categoryId} onClick={() => { setCategoryId(""); setVisibleCount(6); }}>Tất cả</button>
          {categories.map((category) => <button type="button" key={category.id} aria-pressed={categoryId === category.id} onClick={() => { setCategoryId(category.id); setVisibleCount(6); }}>{category.name}</button>)}
        </nav>
      )}
      {/* Shared static grid keeps editor and storefront layouts consistent. */}
      {!preview && loading ? (
        <div className="catalog-loading" role="status" aria-label="Đang tải sản phẩm" aria-busy="true">
          {[0, 1].map((item) => <div key={item}><div className="loading-placeholder" /><div className="loading-placeholder loading-line" /></div>)}
        </div>
      ) : (
        <div className="gallery" id={preview ? undefined : excludeId ? "related-product-grid" : "product-grid"}>
          {(preview ? products : products.slice(0, visibleCount)).map((product) => (
            <div key={product.id}>
              <ProductCard
                image={product.image} number={product.number} name={product.name}
                description={product.description} price={product.price} slug={product.slug || product.id}
                styles={cardStyles} preview={preview} selectedElement={selectedElement}
                onSelect={onSelect} keyMap={keyMap} groupLayout
              />
            </div>
          ))}
        </div>
      )}
      {!preview && !loading && products.length > 0 && (
        <div className="collection-pagination">
          <p role="status">Hiển thị {Math.min(visibleCount, products.length)} / {products.length} sản phẩm</p>
          {visibleCount < products.length && <button type="button" className="collection-load-more" aria-controls={excludeId ? "related-product-grid" : "product-grid"} onClick={() => setVisibleCount((count) => count + 6)}>Xem thêm sản phẩm</button>}
        </div>
      )}

      {!preview && !loading && products.length === 0 && (
        <p
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 2,
            opacity: 0.6,
          }}
        >
          {categoryId ? "Danh mục này chưa có sản phẩm." : "Sản phẩm sẽ sớm được cập nhật."}
        </p>
      )}
    </section>
  );
}

export default Collection;