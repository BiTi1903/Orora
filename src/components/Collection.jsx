import CatalogFilters from "./CatalogFilters";
import {catalogFilters,readCatalogFilters,writeCatalogFilters,filterCatalog,catalogVolumes,catalogPriceLabel,catalogFilterSettings,activeCatalogFilters} from "../lib/catalog-filters";
import CatalogLoadError from "./CatalogLoadError";
import useVisiblePlayback from "../hooks/useVisiblePlayback";
import { productNumber, productSlug, withProductIdentity } from "../lib/product-identity";
import { useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import useCategories from "../hooks/useCategories";
import useProducts from "../hooks/useProducts";
import useHomeContent from "../hooks/useHomeContent";
import { toCss } from "../lib/typography";

function usePerView() {
  const [perView, setPerView] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setPerView(w <= 1000 ? 2 : 3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return perView;
}

function ProductCarousel({ products, cardStyles, preview, selectedElement, onSelect, keyMap = null, groupLayout = false, carouselSettings = {} }) {
  const perView = usePerView();
  const viewRef = useRef(null);
  useEffect(()=>{
    const view=viewRef.current;if(!view)return;
    const measure=()=>{const image=view.querySelector('.gallery-image');if(!image)return;let y=image.offsetHeight/2,node=image;while(node&&node!==view){y+=node.offsetTop;node=node.offsetParent;}view.style.setProperty('--gallery-arrow-y',`${y}px`);};
    const observer=new ResizeObserver(measure);observer.observe(view);
    const images=view.querySelectorAll('.gallery-image');images.forEach(image=>observer.observe(image));measure();
    return()=>observer.disconnect();
  },[products,cardStyles]);
  const dragRef = useRef(null);
  const movedRef = useRef(false);
  const indexRef = useRef(0);
  const [index, setIndex] = useState(0);
  const [animating, setAnimating] = useState(true);
  const [paused, setPaused] = useState(false);
  const [focusPaused,setFocusPaused]=useState(false);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = products.length;
  const looping = count > perView;
  const canPlay=useVisiblePlayback(viewRef,!preview&&looping&&carouselSettings.autoPlay!==false);
  const seconds=Number(carouselSettings.intervalSeconds);
  const interval=Number.isFinite(seconds)&&seconds>=1&&seconds<=30?seconds*1000:3000;
  const pad = Math.max(perView, 1);
  const clones = [];
  if (looping) {
    while (clones.length < pad) clones.push(...products);
  }
  const slides = looping ? [...products, ...clones.slice(0, pad)] : products;
  const gap = perView === 2 ? 20 : 30;

  const setSlide = useCallback((next) => {
    indexRef.current = next;
    setIndex(next);
  }, []);

  const stepSize = useCallback(() => {
    const view = viewRef.current;
    if (!view) return 240;
    return (view.clientWidth - (perView - 1) * gap) / perView + gap;
  }, [perView, gap]);

  const goNext = useCallback(() => {
    setAnimating(true);
    setSlide(indexRef.current + 1);
  }, [setSlide]);

  const goPrev = useCallback(() => {
    if (indexRef.current > 0) {
      setAnimating(true);
      setSlide(indexRef.current - 1);
      return;
    }
    setAnimating(false);
    setSlide(count);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setAnimating(true);
        setSlide(count - 1);
      });
    });
  }, [count, setSlide]);

  const layoutKey = `${count}:${perView}`;
  const [previousLayoutKey, setPreviousLayoutKey] = useState(layoutKey);
  if (previousLayoutKey !== layoutKey) {
    setPreviousLayoutKey(layoutKey);
    setAnimating(false);
    setIndex(0);
  }
  useEffect(() => {
    indexRef.current = 0;
    const id = window.requestAnimationFrame(() => setAnimating(true));
    return () => window.cancelAnimationFrame(id);
  }, [layoutKey]);

  useEffect(() => {
    if (!canPlay || paused || focusPaused || dragging) return undefined;
    const id = window.setInterval(goNext, interval);
    return () => window.clearInterval(id);
  }, [canPlay, paused, focusPaused, dragging, count, perView, goNext, interval]);

  useEffect(() => {
    if (!looping || index < count) return undefined;
    const id = window.setTimeout(() => {
      setAnimating(false);
      setSlide(0);
    }, 820);
    return () => window.clearTimeout(id);
  }, [index, looping, count, setSlide]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el || !looping) return undefined;

    const start = (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (e.target.closest(".gallery-dots, .gallery-nav")) return;
      dragRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
      movedRef.current = false;
      setPaused(true);
      setDragging(true);
    };

    const move = (e) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (Math.abs(dx) > 5) movedRef.current = true;
      if (Math.abs(dx) > Math.abs(dy)) e.preventDefault();
      setDragX(dx);
    };

    const end = (e) => {
      const drag = dragRef.current;
      if (!drag || drag.id !== e.pointerId) return;
      const dx = e.clientX - drag.x;
      dragRef.current = null;
      setDragging(false);
      setDragX(0);
      setPaused(false);
      const threshold = Math.min(48, stepSize() * 0.12);
      if (dx <= -threshold) goNext();
      else if (dx >= threshold) goPrev();
    };

    el.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    return () => {
      el.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
    };
  }, [looping, count, perView, goNext, goPrev, stepSize]);

  const slideWidth = `calc((100% - ${(perView - 1) * gap}px) / ${perView})`;
  const offset = `calc(${index} * (-1 * (${slideWidth} + ${gap}px)) + ${dragX}px)`;

  return (
    <div
      className={`gallery-viewport${dragging ? " is-dragging" : ""}`}
      ref={viewRef}
      onFocusCapture={()=>setFocusPaused(true)}
      onBlurCapture={event=>{if(!event.currentTarget.contains(event.relatedTarget))setFocusPaused(false);}}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => { if (!dragRef.current) setPaused(false); }}
      onDragStart={(e) => e.preventDefault()}
      onClickCapture={(e) => {
        if (!movedRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        movedRef.current = false;
      }}
    >
      {looping && (
        <button type="button" className="gallery-nav prev" aria-label="Sản phẩm trước" onClick={goPrev}>
          ‹
        </button>
      )}
      <div
        className={`gallery-track${animating && !dragging ? " is-animating" : ""}`}
        style={{ gap, transform: `translateX(${offset})` }}
      >
{slides.map((product, i) => (
          <div
            className="gallery-slide"
            style={{ width: slideWidth }}
            inert={i < index || i >= index + perView}
            key={`${product.id}-${i}`}
          >
            <ProductCard productId={product.id}
              image={product.image}
              image2={product.image2}
              image3={product.image3}
              image4={product.image4}
              image5={product.image5}
              image6={product.image6}
              number={productNumber(product, products)}
              name={product.name}
              description={product.description}
              price={product.price}
              slug={productSlug(product, products)}
              styles={cardStyles}
              preview={preview}
              selectedElement={selectedElement}
              onSelect={onSelect}
              keyMap={keyMap}
              groupLayout={groupLayout}
            />
          </div>
        ))}
      </div>

      {looping && (
        <button type="button" className="gallery-nav next" aria-label="Sản phẩm sau" onClick={goNext}>
          ›
        </button>
      )}

      {looping && (
        <div className="gallery-dots" role="group" aria-label="Chọn sản phẩm">
          {products.map((product, i) => (
            <button
              key={product.id}
              aria-label={`Xem ${product.name}`}
              aria-pressed={i === index % count}
              type="button"
              className={i === index % count ? "is-active" : ""}
              onClick={() => {
                setAnimating(true);
                setSlide(i);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const { products: liveProducts, loading, error, retry } = useProducts({ enabled: !preview });
  const liveHome = useHomeContent();
  const { categories } = useCategories();
  const [localFilters,setLocalFilters]=useState(()=>catalogFilters());
  const location=useLocation(),navigate=useNavigate();
  const homeLoading=!preview&&liveHome.loading!==false;
  const home=preview&&previewData?previewData:liveHome||{};
  const filterSettings=catalogFilterSettings(home.collectionStyles?.filters);
  const filtering=filterSettings.enabled!==false&&!excludeId&&!headStylesOverride;
  const savedFilters=preview||excludeId?localFilters:readCatalogFilters(location.search);
  const categoryId=savedFilters.category;
  const changeFilters=next=>{
    const normalized=catalogFilters(next);
    if(preview||excludeId){setLocalFilters(normalized);return;}
    navigate({pathname:location.pathname,search:writeCatalogFilters(location.search,normalized),hash:'#shop'},{replace:true,preventScrollReset:true});
  };
  const setCategoryId=id=>changeFilters({...savedFilters,category:id,page:1});
  const rawProducts=preview?sampleProducts||[]:liveProducts;
  const availableProducts=excludeId?rawProducts.filter(product=>product.id!==excludeId&&product.slug!==excludeId):rawProducts;
  const catalog=withProductIdentity(availableProducts);
  const effectiveFilters=filtering?catalogFilters({...savedFilters,q:'',min:'',max:'',volume:'',price:'all',...(filterSettings.showSearch===false?{q:''}:{}),...(filterSettings.showPrice===false?{min:'',max:'',price:'all'}:{}),...(filterSettings.showVolume===false?{volume:''}:{})}):catalogFilters({category:categoryId});
  const products=filterCatalog(catalog,effectiveFilters);
  const requestedView=savedFilters.view==='auto'?(filterSettings.layout||'auto'):savedFilters.view;
  const grid=filtering&&(requestedView==='grid'||(requestedView==='auto'&&(activeCatalogFilters(effectiveFilters)>0||availableProducts.length>12)));
  const pageSize=Math.max(4,Math.min(48,Number.parseInt(filterSettings.pageSize,10)||12));
  const pageCount=Math.max(1,Math.ceil(products.length/pageSize)),page=Math.min(savedFilters.page,pageCount);
  const pageProducts=products.slice((page-1)*pageSize,page*pageSize);
  const displayProducts=products.map(product=>({...product,price:catalogPriceLabel(product,filterSettings)}));

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

  const card=product=><ProductCard productId={product.id} image={product.image} number={productNumber(product,catalog)} name={product.name} description={product.description} price={catalogPriceLabel(product,filterSettings)} slug={productSlug(product,catalog)} styles={cardStyles} preview={preview} selectedElement={selectedElement} onSelect={onSelect} keyMap={keyMap} groupLayout/>;
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

      {filtering && <CatalogFilters value={effectiveFilters} activeView={preview||grid?'grid':'carousel'} categories={categories} volumes={catalogVolumes(catalog)} settings={filterSettings} count={products.length} total={catalog.length} onApply={changeFilters} onReset={()=>changeFilters(catalogFilters())}/>}
      {!filtering && !preview && !isRelated && categories.length > 0 && (
        <nav className="collection-categories" aria-label="Danh mục sản phẩm">
          <button type="button" aria-pressed={!categoryId} onClick={() => setCategoryId("")}>Tất cả</button>
          {categories.map((category) => <button type="button" key={category.id} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}</button>)}
        </nav>
      )}
      {/* PRODUCTS */}
      {preview ? (
        <div className="gallery">{products.slice(0,pageSize).map(product=><div key={product.id}>{card(product)}</div>)}</div>
      ) : error ? (
        <CatalogLoadError value={headStyles.loadError || home.productDetailStyles?.loadError} onRetry={retry}/>
      ) : loading ? (
        <div className="catalog-loading" role="status" aria-label="Đang tải sản phẩm" aria-busy="true">
          {[0, 1].map((item) => <div key={item}><div className="loading-placeholder" /><div className="loading-placeholder loading-line" /></div>)}
        </div>
      ) : grid ? (
        <div className="catalog-product-grid">{pageProducts.map(product=><div key={product.id}>{card(product)}</div>)}</div>
      ) : (
        <ProductCarousel
          key={JSON.stringify(effectiveFilters)}
          products={displayProducts}
          cardStyles={cardStyles}
          carouselSettings={home.collectionStyles?.carousel || {}}
          preview={preview}
          selectedElement={selectedElement}
          onSelect={onSelect}
          keyMap={keyMap}
          groupLayout
        />
      )}

      {!preview && !loading && !error && grid && pageCount>1 && <nav className="catalog-pagination" aria-label={filterSettings.pageLabel.replace('{page}',page).replace('{pages}',pageCount)}><button type="button" disabled={page===1} onClick={()=>changeFilters({...savedFilters,page:page-1})}>{filterSettings.previousLabel}</button><span role="status">{filterSettings.pageLabel.replace('{page}',page).replace('{pages}',pageCount)}</span><button type="button" disabled={page===pageCount} onClick={()=>changeFilters({...savedFilters,page:page+1})}>{filterSettings.nextLabel}</button></nav>}
      {!preview && !loading && !error && products.length === 0 && (
        <p
          style={{
            textAlign: "center",
            position: "relative",
            zIndex: 2,
            opacity: 0.6,
          }}
        >
          {filtering&&catalog.length?filterSettings.emptyLabel:categoryId?"Danh mục này chưa có sản phẩm.":"Sản phẩm sẽ sớm được cập nhật."}
        </p>
      )}
    </section>
  );
}

export default Collection;