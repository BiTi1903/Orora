import useBuilderDraft from "./useBuilderDraft";
import {inspectorElements,matchesInspectorSearch} from "./element-options";
import StoreWorkspace from "./StoreWorkspace";
import { DEFAULT_HERO, DEFAULT_COLLECTION, DEFAULT_PRODUCT_DETAIL, DEFAULT_FEATURES, DEFAULT_REVIEWS, DEFAULT_FOOTER, DEFAULT_NEWSLETTER, createNewsletter, createAbout, createHero, createCollection, createProductDetail, createFeatures, createReviews, createFooter, createTicker, createPhilosophy, SECTION_DEFAULT_SELECTED, buildHomePayload } from "./home-model";
import {normalizeSearch} from "../../lib/catalog-filters";
import useDraftGuard from "../../hooks/useDraftGuard";
import {createNav} from "./navbar-state";
import { PAGE_SECTIONS as SECTION_LIST, sectionIsEnabled } from "../../lib/page-sections";
import { DEFAULT_PRODUCT_NEEDS, DEFAULT_PRODUCT_FAQ } from "../../lib/product-discovery";
import { ProductNeedsView, ProductFaq } from "../../components/ProductDiscovery";
import useProducts from "../../hooks/useProducts";
import { editedSectionPayload, changedValues, mergeSavedValues } from "./save-sections";
import PreviewFrame from "./PreviewFrame";
import { PREVIEW_PRODUCTS } from "./preview-products";
import { DEFAULT_TICKER } from "./defaults";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getHomeContent, saveHomeContent } from "../../lib/api";
import About from "../../components/About";
import Hero from "../../components/Hero";
import Collection from "../../components/Collection";
import ProductDetail from "../../components/ProductDetail";
import { Testimonials, Features, Newsletter } from "../../components/Extras";

import Footer from "../../components/Footer";
import Navbar from "../../components/Navbar";
import ScrollText from "../../components/ScrollText";
import "./VisualBuilder.css";

import { StylePanel } from "./StylePanels";
import { getSelectedData } from "./AboutPanels.helpers";
import { getHeroSelectedData } from "./HeroPanels.helpers";
import { getCollectionSelectedData } from "./CollectionPanels.helpers";
import { getProductDetailSelectedData } from "./ProductDetailPanels.helpers";
import { getFeaturesSelectedData } from "./FeaturesPanels.helpers";
import { getReviewsSelectedData } from "./ReviewsPanels.helpers";
import { getFooterSelectedData } from "./FooterPanels.helpers";
import { getNewsletterSelectedData } from "./NewsletterPanels.helpers";
import { TickerPreview } from "./TickerPanels";
import { getTickerSelectedData } from "./TickerPanels.helpers";
import { COLLECTION_FIELD_MAP, PRODUCT_DETAIL_FIELD_MAP, FEATURES_TEXT_MAP, REVIEWS_TEXT_MAP, FOOTER_FIELD_MAP, NEWSLETTER_FIELD_MAP } from "./registry";
import { DEFAULT_ABOUT } from "./defaults";

export default function VisualBuilder({workspace="home",requestedStoreSection="cart",requestedStoreVersion=0}) {
  const [storeTab,setStoreTab]=useState(requestedStoreSection);
  const [previousStoreRequest,setPreviousStoreRequest]=useState(`${requestedStoreSection}:${requestedStoreVersion}`);
  const [storeOpened,setStoreOpened]=useState(workspace==="store");
  if(previousStoreRequest!==`${requestedStoreSection}:${requestedStoreVersion}`){setPreviousStoreRequest(`${requestedStoreSection}:${requestedStoreVersion}`);setStoreTab(requestedStoreSection);}
  if(workspace==="store"&&!storeOpened)setStoreOpened(true);
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [previewZoom,setPreviewZoom]=useState("fit");
  const [editVersion,setEditVersion]=useState(0),[savedVersion,setSavedVersion]=useState(0);
  const { about, hero, collection, productDetail, features, reviews, newsletter, footer, ticker, navbar, philosophy, sectionVisibility, discovery, setAbout, setHero, setCollection, setProductDetail, setFeatures, setReviews, setNewsletter, setFooter, setTicker, setNavbar, setPhilosophy, setSectionVisibility, setDiscovery }=useBuilderDraft();
  const sampleProducts=PREVIEW_PRODUCTS,detailProduct=PREVIEW_PRODUCTS[0];
  const { products: discoveryProducts, loading: discoveryLoading } = useProducts();
  const isEnabled = key => sectionIsEnabled({ ...discovery, sectionVisibility }, key);
  const toggleSection = key => {
    setEditVersion(value=>value+1);
    const field = SECTION_LIST.find(section => section.key === key)?.settingsKey;
    dirtySections.current.add(field ? key : 'visibility');
    if (field) setDiscovery(current => ({ ...current, [field]: { ...current[field], enabled: current[field]?.enabled === false } }));
    else setSectionVisibility(current => ({ ...current, [key]: current[key] === false }));
  };
  const [activeSection, setActiveSection] = useState("about");
  const [selected, setSelected] = useState("title");
  const [sectionSearch,setSectionSearch]=useState('');
  const [selectionVersion,setSelectionVersion]=useState(0);
  const selectElement=key=>{setSelected(key);setSelectionVersion(value=>value+1);};
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const dirtySections = useRef(new Set());
  const baseline = useRef(null);
  const [message, setMessage] = useState(null);
  const builderRoot = useRef(null), saveBar = useRef(null);
  useLayoutEffect(() => {
    const root = builderRoot.current, bar = saveBar.current;
    if (!root || !bar) return;
    const measure = () => {
      const height = `${Math.ceil(bar.getBoundingClientRect().height)}px`;
      if (root.style.getPropertyValue('--builder-save-height') !== height) {
        root.style.setProperty('--builder-save-height', height);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [loading, workspace, storeTab]);


  useEffect(() => {
    let alive = true;

    getHomeContent()
      .then((data) => {
        if (!alive) return;

        setSectionVisibility(data?.sectionVisibility || {});
        setDiscovery({ productNeeds: { ...DEFAULT_PRODUCT_NEEDS, ...data?.productNeeds }, productFaq: { ...DEFAULT_PRODUCT_FAQ, ...data?.productFaq } });
        setAbout(createAbout(data || {}));
        setHero(createHero(data || {}));
        setCollection(createCollection(data || {}));
        setProductDetail(createProductDetail(data || {}));
        setFeatures(createFeatures(data || {}));
        setReviews(createReviews(data || {}));
        setNewsletter(createNewsletter(data || {}));
        setFooter(createFooter(data || {}));
        setTicker(createTicker(data || {}));
        setNavbar(createNav(data || {}));
        setPhilosophy(createPhilosophy(data||{}));
      })
      .catch((err) => {
        console.error(err);
        if (alive) {
          setLoadError(true);
          setMessage({ type: "error", text: "Không tải được cấu hình. Chưa thể lưu; hãy tải lại trang để tránh ghi đè dữ liệu." });
          setAbout(DEFAULT_ABOUT);
          setHero(DEFAULT_HERO);
          setCollection(DEFAULT_COLLECTION);
          setProductDetail(DEFAULT_PRODUCT_DETAIL);
          setFeatures(DEFAULT_FEATURES);
          setReviews(DEFAULT_REVIEWS);
          setNewsletter(DEFAULT_NEWSLETTER);
          setFooter(DEFAULT_FOOTER);
          setTicker(DEFAULT_TICKER);
          setNavbar(createNav());
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [setAbout, setHero, setCollection, setProductDetail, setFeatures, setReviews, setNewsletter, setFooter, setTicker, setNavbar, setPhilosophy, setSectionVisibility, setDiscovery]);

  const switchSection = (key) => {
    setActiveSection(key);
    setSelected(SECTION_DEFAULT_SELECTED[key] || "title");
  };

  const selectedData = useMemo(() => {
    if (activeSection === "navbar") {
      return { type: "navbar", data: navbar };
    }
    if (activeSection === "philosophy") {
      return { type: "philosophy", data: philosophy };
    }
    if (activeSection === "hero") {
      return getHeroSelectedData(hero, selected);
    }
    if (activeSection === "collection") {
      return getCollectionSelectedData(collection, selected);
    }
    if (activeSection === "productdetail") {
      return getProductDetailSelectedData(productDetail, selected, detailProduct);
    }
    if (activeSection === "features") {
      return getFeaturesSelectedData(features, selected);
    }
    if (activeSection === "reviews") {
      return getReviewsSelectedData(reviews, selected);
    }
    if (activeSection === "newsletter") {
      return getNewsletterSelectedData(newsletter, selected);
    }
    if (activeSection === "footer") {
      return getFooterSelectedData(footer, selected);
    }
    if (activeSection === "ticker") {
      return getTickerSelectedData(ticker, selected);
    }
    return getSelectedData(about, selected);
  }, [
    activeSection,
    about,
    hero,
    collection,
    productDetail,
    features,
    reviews,
    newsletter,
    footer,
    ticker,
    navbar,
    philosophy,
    selected,
    detailProduct,
  ]);

  const updateSelected = (patch) => {
    setEditVersion(value=>value+1);
    dirtySections.current.add(activeSection);
    if (activeSection === "philosophy") {
      setPhilosophy((current) => ({ ...current, ...patch }));
      return;
    }
    if (activeSection === "navbar") {
      setNavbar((current) => {
        if (patch.navLogo != null) return { ...current, navLogo: patch.navLogo };
        if (patch._linkIndex != null) {
          const links = [...(current.navLinks || [])];
          links[patch._linkIndex] = {
            ...(links[patch._linkIndex] || {}),
            ...patch._link,
          };
          return { ...current, navLinks: links };
        }
        return { ...current, ...patch };
      });
      return;
    }
    if (activeSection === "ticker") {
      setTicker((current) => {
        if (patch.marqueeWords) {
          return { ...current, marqueeWords: patch.marqueeWords };
        }
        if (patch.bandColor != null) {
          return {
            ...current,
            marqueeStyles: {
              ...current.marqueeStyles,
              band: { ...current.marqueeStyles.band, color: patch.bandColor },
            },
          };
        }
        return current;
      });
      return;
    }

    if (activeSection === "hero") {
      setHero((current) => ({ ...current, ...patch }));
      return;
    }

    if (activeSection === "features") {
      setFeatures((current) => {
        if (patch._featuresList) {
          return { ...current, features: patch._featuresList };
        }
        if (patch._featureIndex != null) {
          const next = [...(current.features || [])];
          next[patch._featureIndex] = {
            ...next[patch._featureIndex],
            ...patch._featureItem,
          };
          return { ...current, features: next };
        }
        return { ...current, ...patch };
      });
      return;
    }

    if (activeSection === "reviews") {
      setReviews((current) => {
        if (patch._reviewsList) {
          return { ...current, reviews: patch._reviewsList };
        }
        if (patch._reviewIndex != null) {
          const next = [...(current.reviews || [])];
          next[patch._reviewIndex] = {
            ...next[patch._reviewIndex],
            ...patch._reviewItem,
          };
          return { ...current, reviews: next };
        }
        return { ...current, ...patch };
      });
      return;
    }

    if (activeSection === "footer") {
      setFooter((current) => ({ ...current, ...patch }));
      return;
    }

    if (activeSection === "newsletter") {
      setNewsletter((current) => ({ ...current, ...patch }));
      return;
    }

    if (activeSection === "productdetail") {
      if(patch.informationTabs||patch.mobileLayout){setProductDetail(c=>({...c,...patch}));return;}
      if (patch.loadError) {
        setProductDetail(current=>({...current,loadError:{...current.loadError,...patch.loadError}}));
        return;
      }
      if (patch.__labelKey && patch.text != null) {
        const key = `${patch.__labelKey}Label`;
        setProductDetail((current) => ({
          ...current,
          detailLabels: {
            ...(current.detailLabels || {}),
            [patch.__labelKey]: patch.text,
          },
          [key]: {
            ...(current[key] || {}),
            text: patch.text,
          },
        }));
        return;
      }
      if (typeof selected === "string" && selected.startsWith("pdLabel:") && patch.text != null) {
        const key = `${selected.split(":")[1]}Label`;
        setProductDetail((current) => ({
          ...current,
          [key]: {
            ...(current[key] || {}),
            text: patch.text,
          },
        }));
        return;
      }
      const meta = PRODUCT_DETAIL_FIELD_MAP[selected];
      if (meta?.textKey && patch.text != null) {
        setProductDetail((current) => ({
          ...current,
          [meta.styleKey]: {
            ...(current[meta.styleKey] || {}),
            text: patch.text,
          },
        }));
      }
      return;
    }

    if (activeSection === "collection") {
      setCollection((current) => {
        // text fields
        if (patch.collectionLabel !== undefined ||
            patch.collectionTitle !== undefined ||
            patch.collectionHighlight !== undefined) {
          return { ...current, ...patch };
        }
        // style patches: { styleKey: 'name', style: {...} } or direct nested
        if (patch._styleKey) {
          const group = patch._styleGroup || "productCardStyles";
          return {
            ...current,
            [group]: {
              ...current[group],
              [patch._styleKey]: {
                ...(current[group]?.[patch._styleKey] || {}),
                ...patch.style,
              },
            },
          };
        }
        return { ...current, ...patch };
      });
      return;
    }

    setAbout((current) => {
      if (selected === "section") {
        return {
          ...current,
          section: {
            ...current.section,
            ...patch,
          },
        };
      }

      if (selected === "image") {
        return {
          ...current,
          image: {
            ...current.image,
            ...patch,
          },
        };
      }

      if (selected === "stats") {
        if (Array.isArray(patch)) {
          return { ...current, stats: patch };
        }
        if (patch._statsList) {
          return { ...current, stats: patch._statsList };
        }
        if (patch._statValue) {
          return {
            ...current,
            statValue: {
              ...(current.statValue || {}),
              ...patch._statValue,
            },
          };
        }
        if (patch._statLabel) {
          return {
            ...current,
            statLabel: {
              ...(current.statLabel || {}),
              ...patch._statLabel,
            },
          };
        }
        return current;
      }

      if (
        typeof selected === "string" &&
        (selected.startsWith("statValue:") || selected.startsWith("statLabel:"))
      ) {
        const [kind, indexRaw] = selected.split(":");
        const index = Number(indexRaw);
        const field = kind === "statValue" ? "value" : "label";
        const stats = Array.isArray(current.stats) ? current.stats : [];
        return {
          ...current,
          stats: stats.map((item, i) => {
            if (i !== index) return item;
            const next = { ...item, [field]: patch.text ?? item?.[field] ?? "" };
            if (patch.suffix != null) next.suffix = patch.suffix;
            return next;
          }),
        };
      }

      return {
        ...current,
        [selected]: {
          ...current[selected],
          ...patch,
        },
      };
    });
  };

  const updateSelectedStyle = (patch) => {
    setEditVersion(value=>value+1);
    dirtySections.current.add(activeSection);
    if (activeSection === "philosophy") {
      const styleKey = patch._styleKey || (selected === "philLabel" ? "label" : "text");
      const nextPatch = { ...patch };
      delete nextPatch._styleKey;
      setPhilosophy((current) => ({
        ...current,
        philosophyStyles: {
          ...(current.philosophyStyles || {}),
          [styleKey]: {
            ...(current.philosophyStyles?.[styleKey] || {}),
            ...nextPatch,
          },
        },
      }));
      return;
    }
    if (activeSection === "navbar") {
      const styleKey = selected === "navLogo" ? "logo" : "link";
      setNavbar((current) => ({
        ...current,
        navStyles: {
          ...(current.navStyles || {}),
          [styleKey]: {
            ...(current.navStyles?.[styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }
    if (activeSection === "ticker") {
      const key = selected === "star" ? "star" : selected === "text" ? "text" : null;
      if (!key) return;
      setTicker((current) => ({
        ...current,
        marqueeStyles: {
          ...current.marqueeStyles,
          [key]: {
            ...(current.marqueeStyles?.[key] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    if (activeSection === "hero") return;

    if (activeSection === "productdetail") {
      const styleKey =
        typeof selected === "string" && selected.startsWith("pdLabel:")
          ? "rowLabel"
          : PRODUCT_DETAIL_FIELD_MAP[selected]?.styleKey;
      if (!styleKey) return;
      setProductDetail((current) => ({
        ...current,
        [styleKey]: {
          ...(current[styleKey] || {}),
          ...patch,
        },
      }));
      return;
    }

    if (activeSection === "collection") {
      const meta = COLLECTION_FIELD_MAP[selected];
      if (!meta || (meta.type !== "colStyle" && meta.type !== "cardImage")) return;
      setCollection((current) => ({
        ...current,
        [meta.group]: {
          ...current[meta.group],
          [meta.styleKey]: {
            ...(current[meta.group]?.[meta.styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    if (activeSection === "features") {
      let styleKey = FEATURES_TEXT_MAP[selected]?.styleKey;
      const stylePatch = { ...patch };
      if (selected?.startsWith("featCard-")) {
        styleKey = stylePatch._styleKey || "cardTitle";
        delete stylePatch._styleKey;
      }
      if (!styleKey) return;
      setFeatures((current) => ({
        ...current,
        featuresStyles: {
          ...(current.featuresStyles || {}),
          [styleKey]: {
            ...(current.featuresStyles?.[styleKey] || {}),
            ...stylePatch,
          },
        },
      }));
      return;
    }

    if (activeSection === "reviews") {
      let styleKey = REVIEWS_TEXT_MAP[selected]?.styleKey;
      const stylePatch = { ...patch };
      if (selected?.startsWith("revCard-")) {
        styleKey = stylePatch._styleKey || "reviewText";
        delete stylePatch._styleKey;
      }
      if (!styleKey) return;
      setReviews((current) => ({
        ...current,
        testimonialsStyles: {
          ...(current.testimonialsStyles || {}),
          [styleKey]: {
            ...(current.testimonialsStyles?.[styleKey] || {}),
            ...stylePatch,
          },
        },
      }));
      return;
    }

    if (activeSection === "footer") {
      const styleKey = FOOTER_FIELD_MAP[selected]?.styleKey;
      if (!styleKey) return;
      setFooter((current) => ({
        ...current,
        footerStyles: {
          ...(current.footerStyles || {}),
          [styleKey]: {
            ...(current.footerStyles?.[styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    if (activeSection === "newsletter") {
      const styleKey = NEWSLETTER_FIELD_MAP[selected]?.styleKey;
      if (!styleKey) return;
      setNewsletter((current) => ({
        ...current,
        newsletterStyles: {
          ...(current.newsletterStyles || {}),
          [styleKey]: {
            ...(current.newsletterStyles?.[styleKey] || {}),
            ...patch,
          },
        },
      }));
      return;
    }

    setAbout((current) => {
      if (
        typeof selected === "string" &&
        (selected.startsWith("statValue:") || selected.startsWith("statLabel:"))
      ) {
        const styleKey = selected.startsWith("statValue:") ? "statValue" : "statLabel";
        return {
          ...current,
          [styleKey]: {
            ...(current[styleKey] || {}),
            ...patch,
          },
        };
      }

      if (
        selected === "section" ||
        selected === "image" ||
        selected === "stats"
      ) {
        return current;
      }

      return {
        ...current,
        [selected]: {
          ...current[selected],
          style: {
            ...current[selected].style,
            ...patch,
          },
        },
      };
    });
  };

  const payload = useMemo(() => ({ ...buildHomePayload({ about, hero, collection, productDetail, features, reviews, newsletter, footer, ticker, navbar, philosophy }), sectionVisibility, ...discovery }), [about, hero, collection, productDetail, features, reviews, newsletter, footer, ticker, navbar, philosophy, sectionVisibility, discovery]);
  const markDraftSaved=useDraftGuard(payload,{enabled:!loading&&!loadError,busy:saving});
  useEffect(() => {
    if (!loading && !loadError && baseline.current === null) baseline.current = payload;
  }, [loading, loadError, payload]);

  const save = async () => {
    if (loading || loadError || saving) return;
    if (!dirtySections.current.size) return setMessage({ type: "success", text: "Chưa có thay đổi để lưu." });
    const pendingSections = dirtySections.current;
    dirtySections.current = new Set();
    setSaving(true);
    setMessage(null);

    try {


      const patch = changedValues(baseline.current || {}, editedSectionPayload(payload, pendingSections));
      if (!Object.keys(patch).length) {setSavedVersion(editVersion);return setMessage({ type: "success", text: "Chưa có thay đổi để lưu." });}
      await saveHomeContent(patch);
      baseline.current = mergeSavedValues(baseline.current || {}, patch);
      markDraftSaved();
      setSavedVersion(editVersion);

      setMessage({
        type: "success",
        text: "Đã lưu toàn bộ thay đổi.",
      });
    } catch (err) {
      pendingSections.forEach((section) => dirtySections.current.add(section));
      console.error(err);

      setMessage({
        type: "error",
        text:
          err?.code === "permission-denied"
            ? "Tài khoản này chưa có quyền chỉnh sửa."
            : err?.message || "Không thể lưu thay đổi.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="builder-loading">
        Đang tải Visual Builder...
      </div>
    );
  }

  return (
    <div ref={builderRoot} className={`visual-builder${workspace==="store"?" is-store-workspace":""}`}>
      <div className="builder-toolbar" hidden={workspace === "store" && ["tracking", "links"].includes(storeTab)} style={workspace === "store" && ["tracking", "links"].includes(storeTab) ? { display: "none" } : undefined}>
        <div>
          <strong>{workspace==="store"?"Cài đặt cửa hàng":"Chỉnh sửa giao diện"}</strong>
          <span>
            {workspace==="store"?"Chọn giỏ, form đặt hàng, thanh toán hoặc tra cứu.":"Chọn một phần trên preview để chỉnh sửa."}
          </span>
        </div>

        <div ref={saveBar} className="builder-toolbar-actions" aria-label="Lưu thay đổi giao diện">
          <span className={`builder-save-state${editVersion!==savedVersion?' is-dirty':''}`} role="status">{saving?'Đang lưu thay đổi…':editVersion!==savedVersion?'Có thay đổi chưa lưu':'Các thay đổi đã được lưu'}</span>
          {message?.type === "error" && (
            <span
              className={
                message.type === "success"
                  ? "builder-message success"
                  : "builder-message error"
              }
            >
              {message.text}
            </span>
          )}

          <button
            type="button"
            className="admin-btn primary"
            onClick={save}
            aria-busy={saving}
            disabled={saving || loadError}
          >
            {saving ? "Đang lưu..." : "💾 Lưu tất cả"}
          </button>
        </div>
      </div>

      {storeOpened&&<div hidden={workspace!=="store"}><StoreWorkspace tab={storeTab} onTab={setStoreTab} navbar={navbar} purchaseOptions={productDetail.purchaseOptions||{}} onNavbar={patch=>{dirtySections.current.add('navbar');setEditVersion(v=>v+1);setNavbar(c=>({...c,...patch}));}} onPurchase={patch=>{dirtySections.current.add('productdetail');setEditVersion(v=>v+1);setProductDetail(c=>({...c,purchaseOptions:{...c.purchaseOptions,...patch}}));}}/></div>}
      <div className="builder-layout" hidden={workspace==="store"} inert={workspace==="store"} style={workspace==="store"?{display:'none'}:undefined}>
        <aside className="builder-sections">
          <div className="builder-panel-title">
            <span>Các mục trên trang</span>
            <small>Trang chủ</small>
          </div>

          <label className="builder-section-search">Tìm mục chỉnh sửa<input type="search" value={sectionSearch} onChange={event=>setSectionSearch(event.target.value)} placeholder="Ví dụ: navbar, sản phẩm…"/></label>
          {sectionSearch.trim()&&<div className="builder-search-results" aria-label="Kết quả tìm phần tử">{SECTION_LIST.flatMap(section=>inspectorElements(section.key,{navbar,about,features,reviews}).filter(option=>matchesInspectorSearch(option.label,sectionSearch)).map(option=><button type="button" key={`${section.key}:${option.value}`} onClick={()=>{switchSection(section.key);selectElement(option.value);setSectionSearch('');}}>{option.label}</button>))}</div>}
          <div className="builder-section-list">
            {SECTION_LIST.filter(section=>normalizeSearch(section.label).includes(normalizeSearch(sectionSearch))||inspectorElements(section.key,{navbar,about,features,reviews}).some(option=>matchesInspectorSearch(option.label,sectionSearch))).map((section) => (
              <div className="builder-section-row" key={section.key}>
              <button
                key={section.key}
                type="button"
                disabled={section.disabled}
                className={[
                  "builder-section-item",
                  activeSection === section.key ? "active" : "",
                  section.disabled ? "disabled" : "",
                ].join(" ")}
                onClick={() => {
                  if (!section.disabled) {
                    switchSection(section.key);
                  }
                }}
              >
                <span className="builder-section-icon">
                  {section.icon}
                </span>

                <span className="builder-section-text">
                  <strong>{section.label}</strong>
                  <small>
                    {section.disabled
                      ? "Sắp có"
                      : !isEnabled(section.key)
                      ? "Đang ẩn trên website"
                      : activeSection === section.key
                      ? "Đang chỉnh sửa"
                      : "Sẵn sàng"}
                  </small>
                </span>

                {activeSection === section.key && (
                  <span className="builder-dot" />
                )}
              </button>
              <button type="button" role="switch" className="builder-section-visibility" aria-label={`Hiển thị ${section.label} trên website`} aria-checked={isEnabled(section.key)} disabled={loading || loadError || saving || section.disabled} onClick={() => toggleSection(section.key)}><span className="builder-visibility-dot" aria-hidden="true" /><span className="builder-visibility-label">{isEnabled(section.key)?"Đang hiện":"Đang ẩn"}</span></button>
              </div>
            ))}
          </div>
          <p className="builder-visibility-help">Tắt để ẩn mục trên website. Bấm Lưu để áp dụng; nội dung vẫn được giữ.</p>
        </aside>

        <div className="builder-canvas">
          <div className="builder-canvas-head">
            <span>{!isEnabled(activeSection) ? "Mục này đang tắt trên website · Vẫn có thể chỉnh sửa tại đây" : "Sản phẩm mẫu · Xem trước tĩnh · Không thay đổi dữ liệu"}</span>


            <div className="builder-preview-controls" role="group" aria-label="Điều khiển xem trước"><div className="builder-preview-visibility">
              <button type="button" role="switch" aria-label="Hiển thị mục đang xem trước trên website" aria-checked={isEnabled(activeSection)} disabled={loading || loadError || saving} onClick={() => toggleSection(activeSection)}>{!isEnabled(activeSection) ? "Đang tắt · Bật" : "Đang bật · Tắt"}</button>
              </div><div className="builder-device" role="group" aria-label="Thiết bị và tỉ lệ">
              <button type="button" aria-pressed={previewDevice === "desktop"} onClick={() => setPreviewDevice("desktop")}>Desktop</button>
              <button type="button" aria-pressed={previewDevice === "mobile"} onClick={() => setPreviewDevice("mobile")}>Mobile</button>
              <label className="builder-zoom-label">Tỉ lệ xem<select aria-label="Tỉ lệ xem trước" value={previewZoom} onChange={event=>setPreviewZoom(event.target.value)}><option value="fit">Vừa khung</option><option value="actual">100% — kích thước thật</option></select></label>
            </div></div>
          </div>

          <PreviewFrame device={previewDevice} zoom={previewZoom} selectedKey={selected} surfaces={navbar.navStyles?.surfaces}>
            {activeSection === "productneeds" ? (
              <ProductNeedsView preview value={{ ...discovery.productNeeds, enabled: true }} products={discoveryProducts} loading={discoveryLoading} />
            ) : activeSection === "productfaq" ? (
              <ProductFaq preview value={{ ...discovery.productFaq, enabled: true }} />
            ) : activeSection === "ticker" ? (
              <TickerPreview
                ticker={ticker}
                selected={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "navbar" ? (
              <Navbar
                preview
                previewData={navbar}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "philosophy" ? (
              <ScrollText
                preview
                previewData={philosophy}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "hero" ? (
              <Hero
                preview
                previewData={hero}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "collection" ? (
              <Collection
                preview
                previewData={collection}
                selectedElement={selected}
                onSelect={selectElement}
                sampleProducts={sampleProducts.slice(0, 3)}
              />
            ) : activeSection === "productdetail" ? (
              <ProductDetail
                preview
                previewStyles={productDetail}
                previewProduct={detailProduct}
                previewProducts={sampleProducts}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "features" ? (
              <Features
                preview
                previewData={features}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "reviews" ? (
              <Testimonials
                preview
                previewData={reviews}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "newsletter" ? (
              <Newsletter
                preview
                previewData={newsletter}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "footer" ? (
              <Footer
                preview
                previewData={footer}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : (
              <About
                preview
                previewData={about}
                selectedElement={selected}
                onSelect={selectElement}
              />
            )}
          </PreviewFrame>
        </div>

        <aside className="builder-settings">
          {SECTION_LIST.find(section => section.key === activeSection)?.settingsKey ? <div className="admin-card"><h3>{SECTION_LIST.find(section => section.key === activeSection)?.label}</h3><p>Bật/tắt mục tại danh sách bên trái hoặc ngay trên Preview. Bấm Lưu tất cả để áp dụng; nội dung và giao diện vẫn được giữ.</p><p>Chỉnh nội dung, sản phẩm áp dụng và kiểu chữ tại Sản phẩm → Thiết lập dùng chung.</p><p>{isEnabled(activeSection) ? 'Đang bật trên website' : 'Đang tắt trên website · vẫn xem trước để kiểm tra'}</p></div> : <StylePanel
            onSelect={selectElement}
            selectionVersion={selectionVersion}
            section={activeSection}
            selected={selected}
            data={selectedData}
            about={about}
            hero={hero}
            collection={collection}
            productDetail={productDetail}
            detailProduct={detailProduct}
            features={features}
            reviews={reviews}
            newsletter={newsletter}
            footer={footer}
            ticker={ticker}
            navbar={navbar}
            philosophy={philosophy}
            onChange={updateSelected}
            onStyleChange={updateSelectedStyle}
          />}
        </aside>
      </div>
    </div>
  );
}
