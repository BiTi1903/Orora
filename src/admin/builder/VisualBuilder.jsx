import { useConfirm } from "../confirm-context";
import useBuilderDraft from "./useBuilderDraft";
import { inspectorElements, matchesInspectorSearch } from "./element-options";
import {
  DEFAULT_HERO,
  DEFAULT_COLLECTION,
  DEFAULT_PRODUCT_DETAIL,
  DEFAULT_FEATURES,
  DEFAULT_REVIEWS,
  DEFAULT_FOOTER,
  DEFAULT_NEWSLETTER,
  createNewsletter,
  createAbout,
  createHero,
  createCollection,
  createProductDetail,
  createFeatures,
  createReviews,
  createFooter,
  createTicker,
  createPhilosophy,
  SECTION_DEFAULT_SELECTED,
  buildHomePayload,
} from "./home-model";
import { normalizeSearch } from "../../lib/catalog-filters";
import useDraftGuard from "../../hooks/useDraftGuard";
import { createNav } from "./navbar-state";
import { PAGE_SECTIONS as SECTION_LIST, sectionIsEnabled } from "../../lib/page-sections";
import { DEFAULT_PRODUCT_NEEDS, DEFAULT_PRODUCT_FAQ } from "../../lib/product-discovery";
import { DEFAULT_CARE_GUIDE, normalizeCareGuideGroups } from "../../lib/product-care-guide";
import { ProductNeedsView, ProductFaq } from "../../components/ProductDiscovery";
import ProductCareGuide from "../../components/ProductCareGuide";
import ProductSloganCard from "../../components/ProductSloganCard";
import ProductCareBuilderPanel from "./ProductCareBuilderPanel";
import {
  ProductDiscoveryBuilderPanel,
  ProductSloganBuilderPanel,
  PoliciesPreview,
  PoliciesBuilderPanel,
  CategoriesBuilderPanel,
  ShopLinksPreview,
  ShopLinksBuilderPanel,
  OrderTrackingBuilderPreview,
  OrderTrackingBuilderPanel,
} from "./SharedBuilderPanels";
import { availablePaymentMethods, socialShopUrl } from "../../lib/commerce";
import { DEFAULT_RETURN_POLICY } from "../../lib/return-policy";
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
import CartFormPreview from "../../components/CartFormPreview";
import OrderFormPreview from "../../components/OrderFormPreview";
import OrderSuccessPreview from "../../components/OrderSuccessView";
import "./VisualBuilder.css";

import { StylePanel } from "./StylePanels";
import { TickerPreview } from "./TickerPanels";
import {
  resolveSelectedData,
  applySelectedPatch,
  applySelectedStylePatch,
} from "./builder-updaters";
import { DEFAULT_ABOUT } from "./defaults";

export default function VisualBuilder({
  workspace = "home",
  requestedStoreSection = "links",
  requestedStoreVersion = 0,
}) {
  const confirm = useConfirm();
  const [compactPane, setCompactPane] = useState("edit");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [previewZoom, setPreviewZoom] = useState("fit");
  const [reloadVersion, setReloadVersion] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const resetSections = useRef(new Set());
  const [, setEditVersion] = useState(0);
  const {
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
    sectionVisibility,
    discovery,
    setAbout,
    setHero,
    setCollection,
    setProductDetail,
    setFeatures,
    setReviews,
    setNewsletter,
    setFooter,
    setTicker,
    setNavbar,
    setPhilosophy,
    setSectionVisibility,
    setDiscovery,
    undo, redo, clearHistory, resetField, canUndo, canRedo,
  } = useBuilderDraft();
  const [catalog,setCatalog] = useState({products:[],loading:true,error:false});
  const {products:discoveryProducts,loading:discoveryLoading} = catalog;
  useEffect(()=>{
    let alive=true;
    import("../../lib/api").then(api=>api.getProducts()).then(products=>{
      if(alive) setCatalog({products,loading:false,error:false});
    }).catch(()=>{
      if(alive) setCatalog({products:[],loading:false,error:true});
    });
    return ()=>{alive=false;};
  },[reloadVersion]);
  const [previewProductId, setPreviewProductId] = useState("");
  const sampleProducts = PREVIEW_PRODUCTS;
  const detailProduct = (previewProductId && discoveryProducts.find((item) => item.id === previewProductId)) || PREVIEW_PRODUCTS[0];
  const isEnabled = (key) => sectionIsEnabled({ ...discovery, sectionVisibility }, key);
  const toggleSection = (key) => {
    setEditVersion((value) => value + 1);
    const field = SECTION_LIST.find((section) => section.key === key)?.settingsKey;
    dirtySections.current.add(field ? key : "visibility");
    if (field)
      setDiscovery((current) => ({
        ...current,
        [field]: { ...current[field], enabled: current[field]?.enabled === false },
      }));
    else setSectionVisibility((current) => ({ ...current, [key]: current[key] === false }));
  };
  const storeTarget = requestedStoreSection === "tracking" ? "ordertracking" : "shoplinks";
  const storeRequest = workspace === "store" ? storeTarget + requestedStoreVersion : "";
  const [lastRequest, setLastRequest] = useState(storeRequest);
  const [activeSection, setActiveSection] = useState(storeRequest ? storeTarget : "about");
  const [activeCareGroupId, setActiveCareGroupId] = useState("");
  const [selected, setSelected] = useState("title");
  const [sectionSearch, setSectionSearch] = useState("");
  const [selectionVersion, setSelectionVersion] = useState(0);
  if (lastRequest !== storeRequest) {
    setLastRequest(storeRequest);
    if (storeRequest) {
      setActiveSection(storeTarget);
      setSelected(SECTION_DEFAULT_SELECTED[storeTarget] || "title");
      setSectionSearch("");
    }
  }
  const selectElement = (key) => {
    setSelected(key);
    setSelectionVersion((value) => value + 1);
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const dirtySections = useRef(new Set());
  const baseline = useRef(null);
  const [message, setMessage] = useState(null);
  const builderRoot = useRef(null),
    saveBar = useRef(null);
  useLayoutEffect(() => {
    const root = builderRoot.current,
      bar = saveBar.current;
    if (!root || !bar) return;
    const measure = () => {
      const height = `${Math.ceil(bar.getBoundingClientRect().height)}px`;
      if (root.style.getPropertyValue("--builder-save-height") !== height) {
        root.style.setProperty("--builder-save-height", height);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(bar);
    return () => observer.disconnect();
  }, [loading]);

  useEffect(() => {
    let alive = true;
    baseline.current = null;
    resetSections.current = new Set();

    getHomeContent()
      .then((data) => {
        if (!alive) return;
        setMessage(null);
        setSectionVisibility(data?.sectionVisibility || {});
        setDiscovery({
          productNeeds: { ...DEFAULT_PRODUCT_NEEDS, ...data?.productNeeds },
          productFaq: { ...DEFAULT_PRODUCT_FAQ, ...data?.productFaq },
          productCareGuide: data?.productCareGuide
            ? structuredClone(data.productCareGuide)
            : structuredClone(DEFAULT_CARE_GUIDE),
          productSlogan: {
            enabled: true,
            ...(data?.productSlogan || {}),
            title: typeof data?.productSlogan?.title === "string" ? data.productSlogan.title : "",
            text: typeof data?.productSlogan?.text === "string" ? data.productSlogan.text : "",
          },
          productPolicies: Array.isArray(data?.productPolicies)
            ? structuredClone(data.productPolicies)
            : [
                { id: "shipping", kind: "shipping", title: "Giao hàng", content: "", enabled: true },
                { id: "authenticity", kind: "authenticity", title: "Cam kết sản phẩm", content: "", enabled: true },
                { id: "returns", kind: "returns", title: "Đổi trả", content: DEFAULT_RETURN_POLICY, enabled: true },
              ],
          policyPageContent: {
            returnsText: "",
            paymentText: "",
            privacyText: "",
            ...(data?.policyPageContent || {}),
          },
          shopLinks: {
            tiktokUrl: data?.shopLinks?.tiktokUrl || "",
            facebookUrl: data?.shopLinks?.facebookUrl || "",
            paymentMethods: availablePaymentMethods(data || {}),
          },
          orderTrackingText: data?.orderTrackingText ? structuredClone(data.orderTrackingText) : {},
        });
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
        setPhilosophy(createPhilosophy(data || {}));
      })
      .catch((err) => {
        console.error(err);
        if (alive) {
          setLoadError(true);
          setMessage({
            type: "error",
            text: "Không tải được cấu hình. Chưa thể lưu; hãy bấm Thử lại hoặc tải lại trang để tránh ghi đè dữ liệu.",
          });
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
        if (alive) { clearHistory(); setLoading(false); }
      });

    return () => {
      alive = false;
    };
  }, [
    reloadVersion,
    clearHistory,
    setAbout,
    setHero,
    setCollection,
    setProductDetail,
    setFeatures,
    setReviews,
    setNewsletter,
    setFooter,
    setTicker,
    setNavbar,
    setPhilosophy,
    setSectionVisibility,
    setDiscovery,
  ]);

  const inspector = useRef(null);
  const switchSection = (key) => {
    setCompactPane("edit");
    requestAnimationFrame(() => {
      inspector.current?.focus({preventScroll:true});
      if (window.matchMedia("(max-width: 1000px)").matches) {
        inspector.current?.scrollIntoView({block:"start"});
      }
    });
    setActiveSection(key);
    setSelected(SECTION_DEFAULT_SELECTED[key] || "title");
  };

  useEffect(() => {
    const onJump = (event) => {
      if (typeof event.detail === "string" && event.detail) {
        setActiveSection(event.detail);
        setSelected(SECTION_DEFAULT_SELECTED[event.detail] || "title");
      }
    };
    window.addEventListener("orora:builder-section", onJump);
    return () => window.removeEventListener("orora:builder-section", onJump);
  }, []);

  const selectedData = useMemo(
    () =>
      resolveSelectedData({
        activeSection,
        selected,
        about,
        hero,
        collection,
        productDetail,
        detailProduct,
        features,
        reviews,
        newsletter,
        footer,
        ticker,
        navbar,
        philosophy,
      }),
    [
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
    ],
  );

  const setters = {
    setAbout,
    setHero,
    setCollection,
    setProductDetail,
    setFeatures,
    setReviews,
    setNewsletter,
    setFooter,
    setTicker,
    setNavbar,
    setPhilosophy,
  };

  const updateSelected = (patch) => {
    setEditVersion((value) => value + 1);
    dirtySections.current.add(activeSection);
    applySelectedPatch({ activeSection, selected, setters }, patch);
  };

  const updateSelectedStyle = (patch) => {
    setEditVersion((value) => value + 1);
    dirtySections.current.add(activeSection);
    applySelectedStylePatch({ activeSection, selected, setters }, patch);
  };

  const payload = useMemo(
    () => ({
      ...buildHomePayload({
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
      }),
      sectionVisibility,
      ...discovery,
    }),
    [
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
      sectionVisibility,
      discovery,
    ],
  );
  const serializedPayload = useMemo(() => JSON.stringify(payload), [payload]);
  const isDirty = !loading && !loadError && Boolean(savedSnapshot) && serializedPayload !== savedSnapshot;
  const markDraftSaved = useDraftGuard(payload, { enabled: !loading && !loadError, busy: saving, dirty: isDirty });
  useEffect(() => {
    if (!loading && !loadError && baseline.current === null) {
      baseline.current = payload;
      setSavedSnapshot(serializedPayload);
    }
  }, [loading, loadError, payload, serializedPayload]);

  const replayEdit = action => {
    action();
    SECTION_LIST.forEach(({ key }) => dirtySections.current.add(key));
    dirtySections.current.add("visibility");
    setEditVersion(value => value + 1);
  };
  const canResetActive =
    !["productneeds", "productfaq", "productcare", "cartform", "orderform", "ordersuccess","productslogan","categories","shoplinks","ordertracking","policies"].includes(activeSection);
  const resetActive = async () => {
    if (!canResetActive) return;
    if (!await confirm("Khôi phục các giá trị mặc định của mục hiện tại? Thay đổi áp dụng khi bạn lưu.", {
      title: "Khôi phục mặc định", confirmLabel: "Khôi phục", danger: true,
    })) return;
    const field = activeSection === "productdetail" ? "productDetail" : activeSection;
    resetField(field, (current, fallback) => {
      if (field === "productDetail" && current) {
        return {
          ...fallback,
          ...(current.purchaseOptions ? { purchaseOptions: current.purchaseOptions } : {}),
          ...(current.sloganTitle ? { sloganTitle: current.sloganTitle } : {}),
          ...(current.sloganBody ? { sloganBody: current.sloganBody } : {}),
          ...(current.sloganCard ? { sloganCard: current.sloganCard } : {}),
        };
      }
      if (field === "navbar" && current?.navStyles) {
        return {
          ...fallback,
          navStyles: {
            ...(fallback.navStyles || {}),
            ...(current.navStyles.cart ? { cart: current.navStyles.cart } : {}),
            ...(current.navStyles.surfaces ? { surfaces: current.navStyles.surfaces } : {}),
          },
        };
      }
      return fallback;
    });
    dirtySections.current.add(activeSection);
    resetSections.current.add(activeSection);
    setEditVersion(value => value + 1);
  };

  const save = async () => {
    if (loading || loadError || saving) return;
    if (!dirtySections.current.size && !resetSections.current.size) return setMessage({ type: "success", text: "Chưa có thay đổi để lưu." });
    if (dirtySections.current.has("shoplinks")) {
      if (!discovery.shopLinks.paymentMethods.length) {
        switchSection("shoplinks");
        setMessage({type:"error",text:"Chọn ít nhất một phương thức thanh toán."});
        return;
      }
      for (const [field, platform] of [["facebookUrl","facebook"], ["tiktokUrl","tiktok"]]) {
        const url = discovery.shopLinks[field].trim();
        if (url && !socialShopUrl(url, platform)) {
          switchSection("shoplinks");
          setMessage({type:"error", text:`Đường dẫn ${platform} phải dùng HTTPS của đúng nền tảng.`});
          return;
        }
      }
    }
    const pendingSections = dirtySections.current;
    const pendingResets = resetSections.current;
    dirtySections.current = new Set();
    resetSections.current = new Set();
    setSaving(true);
    setMessage(null);

    try {
      const normalSections = new Set([...pendingSections].filter((section) => !pendingResets.has(section)));
      const normalPatch = normalSections.size
        ? changedValues(baseline.current || {}, editedSectionPayload(payload, normalSections))
        : {};
      const resetPatch = pendingResets.size
        ? changedValues(
            editedSectionPayload(baseline.current || {}, pendingResets),
            editedSectionPayload(payload, pendingResets),
            { includeRemovals: true },
          )
        : {};
      const patch = mergeSavedValues(normalPatch, resetPatch);
      if (!Object.keys(patch).length) {
        setSavedSnapshot(serializedPayload);
        return setMessage({ type: "success", text: "Chưa có thay đổi để lưu." });
      }
      await saveHomeContent(patch);
      baseline.current = mergeSavedValues(baseline.current || {}, patch);
      markDraftSaved();
      clearHistory();
      setSavedSnapshot(serializedPayload);

      setMessage({
        type: "success",
        text: "Đã lưu toàn bộ thay đổi.",
      });
    } catch (err) {
      pendingSections.forEach((section) => dirtySections.current.add(section));
      pendingResets.forEach((section) => resetSections.current.add(section));
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

  const shortcutRef = useRef({ save, replayEdit, undo, redo, canUndo, canRedo, saving, loadError, loading });
  useEffect(() => {
    shortcutRef.current = { save, replayEdit, undo, redo, canUndo, canRedo, saving, loadError, loading };
  });
  useEffect(() => {
    const onKeyDown = (event) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      const s = shortcutRef.current;
      if (key === "s") {
        event.preventDefault();
        if (!s.loading && !s.loadError && !s.saving) s.save();
        return;
      }
      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || event.target?.isContentEditable) return;
      if (key === "z" && !event.shiftKey) {
        if (s.canUndo && !s.saving && !s.loadError) {
          event.preventDefault();
          s.replayEdit(s.undo);
        }
      } else if ((key === "z" && event.shiftKey) || key === "y") {
        if (s.canRedo && !s.saving && !s.loadError) {
          event.preventDefault();
          s.replayEdit(s.redo);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (loading) {
    return <div className="builder-loading">Đang tải Visual Builder...</div>;
  }

  return (
    <div ref={builderRoot} className="visual-builder">
      <div className="builder-toolbar">
        <div><strong>Chỉnh sửa giao diện</strong><span>Chọn một mục để chỉnh sửa và xem trước.</span></div>

        <div className="builder-history-actions" aria-label="Hoàn tác và khôi phục">
          <button type="button" className="admin-btn" disabled={!canUndo || saving || loadError} onClick={() => replayEdit(undo)}>Hoàn tác</button>
          <button type="button" className="admin-btn" disabled={!canRedo || saving || loadError} onClick={() => replayEdit(redo)}>Làm lại</button>
          {canResetActive && <button type="button" className="admin-btn" disabled={saving || loadError} onClick={resetActive}>Khôi phục mặc định mục này</button>}
        </div>

        <div ref={saveBar} className="builder-toolbar-actions" aria-label="Lưu thay đổi giao diện">
          <span
            className={`builder-save-state${isDirty ? " is-dirty" : ""}`}
            role="status"
          >
            {saving
              ? "Đang lưu thay đổi…"
              : isDirty
                ? "Có thay đổi chưa lưu"
                : "Các thay đổi đã được lưu"}
          </span>
          {message?.text && (
            <span
              className={message.type === "success" ? "builder-message success" : "builder-message error"}
            >
              {message.text}
              {loadError && (
                <>
                  {" "}
                  <button type="button" className="admin-btn" onClick={() => { setLoading(true); setLoadError(false); setSavedSnapshot(""); setReloadVersion((value) => value + 1); }}>
                    Thử lại
                  </button>
                </>
              )}
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

      {catalog.error && ["productneeds","productfaq","productcare","productdetail"].includes(activeSection) &&
        <p role="alert">Chưa tải được danh sách sản phẩm để chỉnh liên kết.</p>}
      <div className="builder-layout" data-pane={compactPane}>
        <div className="builder-compact-switch" role="group" aria-label="Chế độ làm việc">
          <button type="button" className="admin-btn" aria-pressed={compactPane === "edit"} onClick={() => setCompactPane("edit")}>Chỉnh sửa</button>
          <button type="button" className="admin-btn" aria-pressed={compactPane === "preview"} onClick={() => setCompactPane("preview")}>Xem trước</button>
        </div>
        <aside className="builder-sections">
          <div className="builder-panel-title">
            <span>Các mục trên trang</span>
            <small>Trang chủ</small>
          </div>

          <label className="builder-section-search">
            Tìm mục chỉnh sửa
            <input
              type="search"
              value={sectionSearch}
              onChange={(event) => setSectionSearch(event.target.value)}
              placeholder="Ví dụ: navbar, sản phẩm…"
            />
          </label>
          {sectionSearch.trim() && (
            <div className="builder-search-results" aria-label="Kết quả tìm phần tử">
              {SECTION_LIST.flatMap((section) =>
                inspectorElements(section.key, { navbar, about, features, reviews })
                  .filter((option) => matchesInspectorSearch(option.label, sectionSearch))
                  .map((option) => (
                    <button
                      type="button"
                      key={`${section.key}:${option.value}`}
                      onClick={() => {
                        switchSection(section.key);
                        selectElement(option.value);
                        setSectionSearch("");
                      }}
                    >
                      {option.label}
                    </button>
                  )),
              )}
            </div>
          )}
          <div className="builder-section-list">
            {SECTION_LIST.filter(
              (section) =>
                normalizeSearch(section.label).includes(normalizeSearch(sectionSearch)) ||
                inspectorElements(section.key, { navbar, about, features, reviews }).some((option) =>
                  matchesInspectorSearch(option.label, sectionSearch),
                ),
            ).map((section) => (
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
                  <span className="builder-section-icon">{section.icon}</span>

                  <span className="builder-section-text">
                    <strong>{section.label}</strong>
                    <small>
                      {section.disabled
                        ? "Sắp có"
                        : !section.hideVisibilityToggle && !isEnabled(section.key)
                          ? "Đang ẩn trên website"
                          : activeSection === section.key
                            ? "Đang chỉnh sửa"
                            : "Bấm để chỉnh sửa"}
                    </small>
                  </span>

                  {activeSection === section.key && <span className="builder-dot" />}
                </button>
                {!section.hideVisibilityToggle && (
                  <button
                    type="button"
                    role="switch"
                    className="builder-section-visibility"
                    aria-label={`Hiển thị ${section.label} trên website`}
                    title={section.visibilityHint}
                    aria-checked={isEnabled(section.key)}
                    disabled={loading || loadError || saving || section.disabled}
                    onClick={() => toggleSection(section.key)}
                  >
                    <span className="builder-visibility-dot" aria-hidden="true" />
                    <span className="builder-visibility-label">
                      {isEnabled(section.key) ? "Đang hiện" : "Đang ẩn"}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="builder-visibility-help">
            Tắt để ẩn mục trên website. Bấm Lưu để áp dụng; nội dung vẫn được giữ.
          </p>
        </aside>

        <div className="builder-canvas">
          <div className="builder-canvas-head">
            <span>
              {!SECTION_LIST.find((section) => section.key === activeSection)?.hideVisibilityToggle &&
              !isEnabled(activeSection)
                ? "Mục này đang tắt trên website · Vẫn có thể chỉnh sửa tại đây"
                : "Xem trước thay đổi"}
            </span>

            {["policies","categories","shoplinks","ordertracking"].includes(activeSection) &&
              <button type="button" className="admin-btn" onClick={() => switchSection(activeSection)}>Chỉnh mục này</button>}
            <div className="builder-preview-controls" role="group" aria-label="Điều khiển xem trước">
              {!SECTION_LIST.find((section) => section.key === activeSection)?.hideVisibilityToggle && (
                <div className="builder-preview-visibility">
                  <button
                    type="button"
                    role="switch"
                    aria-label="Hiển thị mục đang xem trước trên website"
                    aria-checked={isEnabled(activeSection)}
                    disabled={loading || loadError || saving}
                    onClick={() => toggleSection(activeSection)}
                  >
                    {!isEnabled(activeSection) ? "Đang tắt · Bật" : "Đang bật · Tắt"}
                  </button>
                </div>
              )}
              <div className="builder-device" role="group" aria-label="Thiết bị và tỉ lệ">
                {activeSection === "productdetail" && discoveryProducts.length > 0 && (
                  <label className="builder-zoom-label">
                    SP xem trước
                    <select
                      aria-label="Chọn sản phẩm xem trước"
                      value={previewProductId}
                      onChange={(event) => setPreviewProductId(event.target.value)}
                    >
                      <option value="">Mẫu: {PREVIEW_PRODUCTS[0].name}</option>
                      {discoveryProducts.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                <button
                  type="button"
                  aria-pressed={previewDevice === "desktop"}
                  onClick={() => setPreviewDevice("desktop")}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  aria-pressed={previewDevice === "tablet"}
                  onClick={() => setPreviewDevice("tablet")}
                >
                  Tablet
                </button>
                <button
                  type="button"
                  aria-pressed={previewDevice === "mobile"}
                  onClick={() => setPreviewDevice("mobile")}
                >
                  Mobile
                </button>
                <label className="builder-zoom-label">
                  Tỉ lệ xem
                  <select
                    aria-label="Tỉ lệ xem trước"
                    value={previewZoom}
                    onChange={(event) => setPreviewZoom(event.target.value)}
                  >
                    <option value="fit">Vừa khung</option>
                    <option value="actual">100% — kích thước thật</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          <PreviewFrame
            device={previewDevice}
            zoom={previewZoom}
            selectedKey={selected}
            surfaces={navbar.navStyles?.surfaces}
          >
            {activeSection === "productneeds" ? (
              <ProductNeedsView
                preview
                value={{ ...discovery.productNeeds, enabled: true }}
                products={discoveryProducts}
                loading={discoveryLoading}
              />
            ) : activeSection === "productfaq" ? (
              <ProductFaq preview value={{ ...discovery.productFaq, enabled: true }} />
            ) : activeSection === "productcare" ? (
              (() => {
                const careGroups = normalizeCareGuideGroups(discovery.productCareGuide, discoveryProducts);
                const activeGroup =
                  careGroups.find((group) => group.id === activeCareGroupId) || careGroups[0];
                const guideValue = activeGroup?.guide ?? DEFAULT_CARE_GUIDE;
                return (
                  <div style={{ padding: "24px 16px" }}>
                    <ProductCareGuide value={{ ...guideValue, enabled: true }} />
                  </div>
                );
              })()
            ) : activeSection === "productslogan" ? (
              <div style={{ padding: "36px 20px", maxWidth: 680, margin: "0 auto" }}>
                {discovery.productSlogan?.text?.trim() ? (
                  <ProductSloganCard
                    home={{ productSlogan: { ...discovery.productSlogan, enabled: true } }}
                    styles={productDetail}
                  />
                ) : (
                  <p style={{ textAlign: "center", color: "#846b77" }}>
                    Nhập nội dung Slogan ở khung bên phải để xem trước trực tiếp.
                  </p>
                )}
              </div>
            ) : activeSection === "policies" ? (
              <PoliciesPreview
                showAssurances={isEnabled("policies")}
                policies={discovery.productPolicies}
                pageContent={discovery.policyPageContent}
              />
            ) : activeSection === "categories" ? (
              <Collection
                preview
                previewData={{...collection,sectionVisibility}}
                selectedElement={selected}
                onSelect={selectElement}
                sampleProducts={discoveryProducts.filter(product=>product.active!==false)}
              />
            ) : activeSection === "shoplinks" ? (
              <ShopLinksPreview shopLinks={discovery.shopLinks} showChannels={isEnabled("shoplinks")} />
            ) : activeSection === "ordertracking" ? (
              isEnabled("ordertracking") ? <OrderTrackingBuilderPreview value={discovery.orderTrackingText} /> :
                <section className="product-not-found"><h2>Tra cứu đơn hàng đang tạm tắt</h2></section>
            ) : activeSection === "cartform" ? (
              <CartFormPreview
                settings={navbar.navStyles?.cart || {}}
                products={sampleProducts}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "orderform" ? (
              <OrderFormPreview
                shopLinks={discovery.shopLinks}
                canvas
                appearance={productDetail.purchaseOptions || {}}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "ordersuccess" ? (
              <OrderSuccessPreview
                appearance={productDetail.purchaseOptions || {}}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "ticker" ? (
              <TickerPreview ticker={ticker} selected={selected} onSelect={selectElement} />
            ) : activeSection === "navbar" ? (
              <Navbar preview previewData={navbar} selectedElement={selected} onSelect={selectElement} />
            ) : activeSection === "philosophy" ? (
              <ScrollText
                preview
                previewData={philosophy}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "hero" ? (
              <Hero preview previewData={hero} selectedElement={selected} onSelect={selectElement} />
            ) : activeSection === "collection" ? (
              <Collection
                preview
                previewData={{ ...collection, navStyles: navbar.navStyles, sectionVisibility }}
                selectedElement={selected}
                onSelect={selectElement}
                sampleProducts={sampleProducts.slice(0, 3)}
              />
            ) : activeSection === "productdetail" ? (
              <ProductDetail
                preview
                previewSettings={{...discovery,sectionVisibility}}
                previewStyles={productDetail}
                previewProduct={detailProduct}
                previewProducts={sampleProducts}
                selectedElement={selected}
                onSelect={selectElement}
              />
            ) : activeSection === "features" ? (
              <Features preview previewData={features} selectedElement={selected} onSelect={selectElement} />
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
              <Footer preview previewData={footer} selectedElement={selected} onSelect={selectElement} />
            ) : (
              <About preview previewData={about} selectedElement={selected} onSelect={selectElement} />
            )}
          </PreviewFrame>
        </div>

        <aside className="builder-settings" ref={inspector} tabIndex={-1} aria-label="Chỉnh sửa mục đang chọn">
          {activeSection === "productcare" ? (
            <ProductCareBuilderPanel
              value={discovery.productCareGuide}
              products={discoveryProducts}
              activeGroupId={activeCareGroupId}
              onActiveGroupChange={setActiveCareGroupId}
              onChange={(nextCare) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("productcare");
                setDiscovery((current) => ({ ...current, productCareGuide: nextCare }));
              }}
            />
          ) : activeSection === "productneeds" ? (
            <ProductDiscoveryBuilderPanel
              value={discovery.productNeeds}
              products={discoveryProducts}
              onChange={(nextNeeds) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("productneeds");
                setDiscovery((current) => ({ ...current, productNeeds: nextNeeds }));
              }}
            />
          ) : activeSection === "productfaq" ? (
            <ProductDiscoveryBuilderPanel
              faq
              value={discovery.productFaq}
              products={discoveryProducts}
              onChange={(nextFaq) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("productfaq");
                setDiscovery((current) => ({ ...current, productFaq: nextFaq }));
              }}
            />
          ) : activeSection === "productslogan" ? (
            <ProductSloganBuilderPanel
              slogan={discovery.productSlogan}
              styles={productDetail}
              onChangeSlogan={(nextSlogan) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("productslogan");
                setDiscovery((current) => ({ ...current, productSlogan: nextSlogan }));
              }}
              onChangeStyles={(nextStyles) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("productslogan");
                dirtySections.current.add("productdetail");
                setProductDetail(nextStyles);
              }}
            />
          ) : activeSection === "policies" ? (
            <PoliciesBuilderPanel
              policies={discovery.productPolicies}
              pageContent={discovery.policyPageContent}
              onChangePolicies={(nextPolicies) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("policies");
                setDiscovery((current) => ({ ...current, productPolicies: nextPolicies }));
              }}
              onChangePageContent={(nextContent) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("policies");
                setDiscovery((current) => ({ ...current, policyPageContent: nextContent }));
              }}
            />
          ) : activeSection === "categories" ? (
            <CategoriesBuilderPanel />
          ) : activeSection === "shoplinks" ? (
            <ShopLinksBuilderPanel
              value={discovery.shopLinks}
              onChange={(nextLinks) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("shoplinks");
                setDiscovery((current) => ({ ...current, shopLinks: nextLinks }));
              }}
            />
          ) : activeSection === "ordertracking" ? (
            <OrderTrackingBuilderPanel
              value={discovery.orderTrackingText}
              onChange={(nextTracking) => {
                setEditVersion((value) => value + 1);
                dirtySections.current.add("ordertracking");
                setDiscovery((current) => ({ ...current, orderTrackingText: nextTracking }));
              }}
            />
          ) : (
            <StylePanel
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
            />
          )}
        </aside>
      </div>
    </div>
  );
}
