import { useEffect, useRef, useState } from "react";
import { FRAME_COLORS, FRAME_SIZES, MAIL_COPY, MAIL_OPTIONS, MAIL_TOGGLES, mailDesign } from "../lib/mail-design";

function buildSections(kind) {
  const isOrder = kind === "order_auto";
  const isWelcome = kind === "welcome_auto";
  return {
    "Khung thư": ["background", "surface", "border", "accent", "cardBg", "cardBorder", "width", "radius", "thickness"],
    "Đầu thư": ["showHeader", "brand", "tagline", "logoUrl", "logoWidth", "showEyebrow", "eyebrow", "headerFont", "brandSize", "header", "headerText", "taglineColor", "headerBorder", "preheader"],
    "Tiêu đề": ["showHeading", "heading", "showDivider", "headingFont", "headingSize", "headingMobileSize", "headingWeight", "headingAlign", "headingColor"],
    "Nội dung": ["font", "fontSize", "mobileFontSize", "weight", "align", "text", "bannerUrl", "bannerAlt"],
    "Các khối": isOrder
      ? [
          "orderLayout",
          "showOrderHero",
          "showOrderSteps",
          "orderStep1",
          "orderStep2",
          "orderStep3",
          "showOrderItems",
          "orderItemsHeading",
          "showOrderDelivery",
          "orderDeliveryHeading",
          "showOrderBank",
        ]
      : [
          ...(isWelcome ? ["showPillars", "pillar1Title", "pillar1Desc", "pillar2Title", "pillar2Desc", "pillar3Title", "pillar3Desc"] : []),
          "showCoupon",
          "couponTitle",
          "couponCode",
          "couponNote",
        ],
    "Nút hành động": ["showButton", "buttonLabel", "buttonUrl", "buttonFontSize", "buttonRadius", "buttonAlign", "button", "buttonText"],
    "Chân thư": ["showFooter", "footerNote", "footerSiteLabel", "footerPolicyLabel", "footerAddress", "footerCopyright", "footer", "footerText"],
  };
}

export default function MailDesignFields({ value, onChange, disabled, kind, activeSection, onSectionChange }) {
  const sections = buildSections(kind);
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
        detailsRef.current.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [activeSection, sections]);

  const design = mailDesign(value);
  const change = (key, next) => onChange({ ...design, [key]: next });

  function field(key) {
    if (key === "buttonUrl" && kind === "order_auto") {
      return <p key={key} className="admin-muted" style={{ gridColumn: "1 / -1", margin: 0 }}>Đích của nút lấy tự động theo cấu hình tra cứu đơn hàng.</p>;
    }
    if (MAIL_TOGGLES[key]) {
      return (
        <label key={key} className="admin-check" style={{ gridColumn: "1 / -1" }}>
          <input type="checkbox" checked={design[key]} onChange={(event) => change(key, event.target.checked)} />
          <span>{MAIL_TOGGLES[key][0]}</span>
        </label>
      );
    }
    if (FRAME_COLORS[key]) {
      return (
        <label key={key} className="admin-field">
          {FRAME_COLORS[key][0]}
          <input type="color" value={design[key]} onChange={(event) => change(key, event.target.value)} />
        </label>
      );
    }
    if (FRAME_SIZES[key]) {
      const [label, , min, max] = FRAME_SIZES[key];
      const displayVal = key === "buttonRadius" && design[key] >= 99 ? "Viên thuốc" : `${design[key]} px`;
      return (
        <label key={key} className="admin-field">
          {label} · {displayVal}
          <input type="range" min={min} max={max} value={design[key]} onChange={(event) => change(key, Number(event.target.value))} />
        </label>
      );
    }
    if (MAIL_OPTIONS[key]) {
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
    const [label, , limit] = MAIL_COPY[key];
    const isUrl = key === "buttonUrl" || key === "logoUrl" || key === "bannerUrl";
    const isWide = limit >= 140 || isUrl;
    return (
      <label key={key} className="admin-field" style={isWide ? { gridColumn: "1 / -1" } : undefined}>
        {label}
        <input
          type={isUrl ? "url" : "text"}
          maxLength={limit}
          value={design[key]}
          onChange={(event) => change(key, event.target.value)}
        />
      </label>
    );
  }

  return (
    <details ref={detailsRef} className="admin-filter-panel">
      <summary>Khung và màu email</summary>
      <fieldset className="writer-fields" disabled={disabled}>
        <div className="mail-preview-toolbar" role="group" aria-label="Phần thư cần chỉnh">
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%, 190px),1fr))", gap: 12, marginTop: 12 }}>
          {sections[section].map(field)}
        </div>
        <div className="admin-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="admin-btn"
            onClick={() => {
              const defaults = mailDesign();
              onChange({ ...design, ...Object.fromEntries(sections[section].map((key) => [key, defaults[key]])) });
            }}
          >
            Khôi phục mặc định phần này
          </button>
        </div>
      </fieldset>
    </details>
  );
}
