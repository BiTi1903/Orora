import {orderRequest} from "./order-api";
import { useId, useEffect, useRef, useState } from "react";
import {
  FRAME_COLORS,
  FRAME_SIZES,
  MAIL_COLOR_THEMES,
  MAIL_COPY,
  MAIL_OPTIONS,
  MAIL_PLACEHOLDERS,
  MAIL_TOGGLES,
  mailDesign,
} from "../lib/mail-design";

function buildSections(kind, hasOrderVars = false) {
  const isOrder = kind === "order_auto" || hasOrderVars;
  const isWelcome = kind === "welcome_auto";
  return {
    "Khung thư": ["width", "radius", "thickness", "background", "surface", "border", "accent", "cardBg", "cardBorder"],
    "Đầu thư": ["showHeader", "brand", "tagline", "logoUrl", "logoWidth", "showEyebrow", "eyebrow", "preheader", "headerFont", "brandSize", "header", "headerText", "taglineColor", "headerBorder"],
    "Tiêu đề": ["showHeading", "heading", "showDivider", "headingFont", "headingSize", "headingMobileSize", "headingWeight", "headingAlign", "headingColor"],
    "Nội dung": ["font", "fontSize", "mobileFontSize", "weight", "align", "bannerUrl", "bannerAlt", "text"],
    "Các khối": isOrder
      ? [
          "orderLayout",
          "showOrderBank",
          "showCoupon",
          "couponTitle",
          "couponCode",
          "couponNote",
        ]
      : [
          ...(isWelcome ? ["showPillars", "pillar1Title", "pillar1Desc", "pillar2Title", "pillar2Desc", "pillar3Title", "pillar3Desc"] : []),
          "showCoupon",
          "couponTitle",
          "couponCode",
          "couponNote",
        ],
    ...(isOrder ? {
      "Mã đơn": ["showOrderHero", "codeLabel", "placedLabel", "paidLabel", "unpaidLabel", "orderCodeFont", "orderCodeWeight", "codeLabelSize", "orderCodeSize", "orderCodeMobileSize", "showOrderSteps", "orderActiveStep", "orderStep1", "orderStep2", "orderStep3"],
      "Thông tin giao nhận": ["showOrderDelivery", "orderDeliveryHeading", "deliveryRecipientLabel", "deliveryPhoneLabel", "deliveryEmailLabel", "deliveryAddressLabel", "deliveryPaymentLabel", "deliveryTrackingLabel", "deliveryNoteLabel", "deliveryFont", "deliverySize", "deliveryMobileSize"],
      "Chi tiết đơn": ["showOrderItems", "orderItemsHeading", "productLabel", "qtyLabel", "amountLabel", "variantLabel", "subtotalLabel", "shippingLabel", "totalLabel", "detailFont", "detailSize", "detailMobileSize"],
    } : {}),
    "Nút hành động": ["showButton", "buttonLabel", "buttonUrl", "buttonFontSize", "buttonRadius", "buttonAlign", "button", "buttonText"],
    "Chân thư": ["showFooter", "footerNote", "footerSiteLabel", "footerPolicyLabel", "footerAddress", "footerCopyright", "footer", "footerText"],
  };
}

export default function MailDesignFields({
  value,
  onChange,
  disabled,
  kind,
  hasOrderVars = false,
  onEditBody,
  activeSection,
  onSectionChange,
  defaultOpen = false,
}) {
  const promoListId = useId();
  const [promoOptions,setPromoOptions] = useState(null);
  async function loadPromotions(){
    if (promoOptions) return;
    try {
      const {promotions}=await orderRequest(null,{promotions:"1"});
      setPromoOptions(promotions.filter(p=>p.active && (!p.limit || (p.used||0)<p.limit) && (!p.expires || Date.parse(p.expires+"T23:59:59.999+07:00")>=Date.now())));
    } catch { /* Staff with email-only access can enter a known code. */ }
  }
  const sections = buildSections(kind, hasOrderVars);
  const [localSection, setLocalSection] = useState("Khung thư");
  const section = activeSection && Object.hasOwn(sections, activeSection) ? activeSection : localSection;
  const setSection = (name) => {
    setLocalSection(name);
    onSectionChange?.(name);
  };
  const detailsRef = useRef(null);
  const lastExternalRef = useRef(activeSection);

  useEffect(() => {
    if (activeSection && activeSection !== lastExternalRef.current && Object.hasOwn(sections, activeSection)) {
      lastExternalRef.current = activeSection;
      if (detailsRef.current) {
        detailsRef.current.open = true;
        detailsRef.current.scrollIntoView?.({ behavior: "instant", block: "nearest" });
      }
    }
  }, [activeSection, sections]);

  const design = mailDesign(value);
  const change = (key, next) => onChange({ ...design, [key]: next });

  const keys = sections[section] || [];
  const toggleKeys = keys.filter((k) => Boolean(MAIL_TOGGLES[k]));
  const copyKeys = keys.filter((k) => Boolean(MAIL_COPY[k]));
  const styleKeys = keys.filter((k) => Boolean(FRAME_SIZES[k] || MAIL_OPTIONS[k]));
  const colorKeys = keys.filter((k) => Boolean(FRAME_COLORS[k]));

  function renderCopyField(key) {
    if (key === "buttonUrl" && (kind === "order_auto" || hasOrderVars)) {
      return <p key={key} className="admin-muted" style={{ gridColumn: "1 / -1", margin: 0 }}>Đích của nút lấy tự động theo cấu hình tra cứu đơn hàng.</p>;
    }
    const [label, , limit] = MAIL_COPY[key];
    const isUrl = key === "buttonUrl" || key === "logoUrl" || key === "bannerUrl";
    const isWide = limit >= 110 || isUrl;
    return (
      <label key={key} className="admin-field" style={isWide ? { gridColumn: "1 / -1" } : undefined}>
        {label}
        <input
          type={isUrl ? "url" : "text"}
          list={key==="couponCode" ? promoListId : undefined}
          onFocus={key==="couponCode" ? loadPromotions : undefined}
          maxLength={limit}
          placeholder={MAIL_PLACEHOLDERS[key] || ""}
          value={design[key]}
          onChange={(event) => change(key, event.target.value)}
        />
        {key==="couponCode"&&<datalist id={promoListId}>{promoOptions?.map(p=><option value={p.code} key={p.code}/>)}</datalist>}
      </label>
    );
  }

  function renderStyleField(key) {
    if (FRAME_SIZES[key]) {
      const [label, , min, max] = FRAME_SIZES[key];
      const displayVal = key === "buttonRadius" && design[key] >= 99 ? "Viên thuốc" : `${design[key]} px`;
      return (
        <label key={key} className="admin-field mail-range-field">
          <span className="mail-range-head">
            <span>{label}</span>
            <strong>{displayVal}</strong>
          </span>
          <input type="range" min={min} max={max} value={design[key]} onChange={(event) => change(key, Number(event.target.value))} />
        </label>
      );
    }
    const [label, options] = MAIL_OPTIONS[key];
    return (
      <label key={key} className="admin-field">
        {label}
        <select value={design[key]} onChange={(event) => change(key, event.target.value)}>
          {Object.entries(options).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
      </label>
    );
  }

  function renderColorField(key) {
    return (
      <label key={key} className="mail-color-field">
        <span className="mail-color-label">{FRAME_COLORS[key][0]}</span>
        <span className="mail-color-swatch-wrap">
          <input type="color" value={design[key]} onChange={(event) => change(key, event.target.value)} />
          <code>{design[key].toUpperCase()}</code>
        </span>
      </label>
    );
  }

  return (
    <details ref={detailsRef} className="admin-filter-panel mail-design-studio" open={defaultOpen || undefined}>
      <summary>Khung và màu email</summary>
      <fieldset className="writer-fields mail-design-fieldset" disabled={disabled}>
        <div className="mail-section-pills" role="group" aria-label="Phần thư cần chỉnh">
          {Object.keys(sections).map((name) => (
            <button
              key={name}
              type="button"
              aria-pressed={name === section}
              className={name === section ? "admin-btn primary" : "admin-btn"}
              onClick={() => setSection(name)}
            >
              {name}
            </button>
          ))}
        </div>

        {section === "Nội dung" && value?.useHtml && <div className="admin-context-note">Mẫu này đang dùng bố cục HTML đã lưu.
          <button type="button" className="admin-btn" onClick={() => onChange({...value, useHtml:false})}>Chuyển sang nội dung đang soạn</button>
        </div>}
        {section === "Nội dung" && <button type="button" className="admin-btn" onClick={onEditBody}>Đến ô soạn nội dung</button>}
        {section === "Khung thư" && (
          <div className="mail-design-group">
            <span className="mail-design-group-title">Bảng phối màu nhanh</span>
            <div className="mail-theme-presets">
              {MAIL_COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className="mail-theme-chip"
                  onClick={() => onChange({ ...design, ...theme.colors })}
                >
                  <span className="mail-theme-dots" aria-hidden="true">
                    {theme.swatch.map((hex, idx) => (
                      <i key={idx} style={{ backgroundColor: hex }} />
                    ))}
                  </span>
                  <span>{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {(toggleKeys.length > 0 || copyKeys.length > 0) && (
          <div className="mail-design-group">
            <span className="mail-design-group-title">Hiển thị & Nội dung phần này</span>
            {toggleKeys.length > 0 && (
              <div className="mail-toggle-list">
                {toggleKeys.map((key) => (
                  <label key={key} className="admin-check mail-toggle-item">
                    <input type="checkbox" checked={design[key]} onChange={(event) => change(key, event.target.checked)} />
                    <span>{MAIL_TOGGLES[key][0]}</span>
                  </label>
                ))}
              </div>
            )}
            {copyKeys.length > 0 && (
              <div className="mail-design-grid">
                {copyKeys.map(renderCopyField)}
              </div>
            )}
          </div>
        )}

        {styleKeys.length > 0 && (
          <div className="mail-design-group">
            <span className="mail-design-group-title">Kiểu chữ & Kích thước</span>
            <div className="mail-design-grid">
              {styleKeys.map(renderStyleField)}
            </div>
          </div>
        )}

        {colorKeys.length > 0 && (
          <div className="mail-design-group">
            <span className="mail-design-group-title">Màu sắc</span>
            <div className="mail-color-grid">
              {colorKeys.map(renderColorField)}
            </div>
          </div>
        )}

        <div className="admin-actions" style={{ marginTop: 4 }}>
          <button
            type="button"
            className="admin-btn"
            onClick={() => {
              const defaults = mailDesign();
              onChange({ ...design, ...Object.fromEntries(keys.map((key) => [key, defaults[key]])) });
            }}
          >
            Khôi phục mặc định phần “{section}”
          </button>
        </div>
      </fieldset>
    </details>
  );
}
