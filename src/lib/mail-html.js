import { renderMailCode } from "./mail-code.js";
import { mailDesign } from "./mail-design.js";
import { orderTrackingMail } from "./order-tracking-mail.js";
import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "./commerce.js";
import { orderProductName } from "./product-options.js";
import { vietQrUrl } from "./vietqr.js";

const DEFAULT_ORIGIN = "https://ororavn.com";
const DEFAULT_CONTACT_EMAIL = "sales@ororavn.com";

const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const FONT_MAP = {
  notoSerif: "'Noto Serif', Georgia, 'Times New Roman', serif",
  tahoma: "Tahoma, Verdana, sans-serif",
  palatino: "'Palatino Linotype', Palatino, Georgia, serif",
  garamond: "Garamond, Georgia, serif",
  cambria: "Cambria, Georgia, serif",
  calibri: "Calibri, Arial, sans-serif",
  system: FONT_SANS,
  arial: "Arial, Helvetica, sans-serif",
  georgia: FONT_SERIF,
  times: "'Times New Roman', Times, serif",
  trebuchet: "'Trebuchet MS', Helvetica, sans-serif",
  verdana: "Verdana, Geneva, sans-serif",
};

function resolveFont(key, fallback = FONT_SANS) {
  return FONT_MAP[key] || fallback;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeOrigin(value) {
  try {
    const url = new URL(value || DEFAULT_ORIGIN);
    if (url.protocol === "https:" || url.protocol === "http:") return url.origin;
  } catch { /* fallback */ }
  return DEFAULT_ORIGIN;
}

function safeHref(value) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (/^mailto:sales@ororavn\.com\?subject=[A-Za-z0-9%_.!~*'()-]*$/i.test(trimmed)) return trimmed;
  if (!/^https?:\/\//i.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch { /* invalid */ }
  return "";
}

function safeHttpsUrl(value) {
  const url = safeHref(value);
  return url.startsWith("https://") ? url : "";
}

function linkifyEscaped(escapedText, accentColor = "#b8446d") {
  return escapedText
    .replace(/(https?:\/\/[^\s<>"')]+)/gi, (url) => {
      const clean = url.replace(/[.,;:!?]+$/, "");
      const suffix = url.slice(clean.length);
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer" style="color:${accentColor};text-decoration:underline;word-break:break-word;">${clean}</a>${suffix}`;
    })
    .replace(/(^|[\s(>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, prefix, email) => (
      `${prefix}<a href="mailto:${email}" style="color:${accentColor};text-decoration:underline;">${email}</a>`
    ));
}

function formatInlineText(rawText, accentColor = "#b8446d") {
  const escaped = escapeHtml(rawText);
  const linked = linkifyEscaped(escaped, accentColor);
  return linked
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/==([^=\n]+)==/g, `<span style="color:${accentColor};font-weight:600;">$1</span>`)
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:!?)]|$)/g, "$1<em>$2</em>");
}

function stripUnsubscribeFooter(text, unsubscribeUrl) {
  let body = String(text || "").trim();
  if (unsubscribeUrl) {
    const markerIdx = body.lastIndexOf("\n---\n");
    if (markerIdx !== -1 && body.slice(markerIdx).includes(unsubscribeUrl)) {
      body = body.slice(0, markerIdx).trimEnd();
    }
  }
  return body;
}

export function formatBodyHtml(text, { unsubscribeUrl = "", design } = {}) {
  const frame = mailDesign(design);
  const font = resolveFont(frame.font, FONT_SANS);
  const typography = `font-family:${font};text-align:${frame.align};font-weight:${frame.weight};`;
  const cleaned = stripUnsubscribeFooter(text, unsubscribeUrl);

  const blocks = cleaned.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const formatted = blocks.map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const isSubheading = lines.length === 1 && /^##\s+/.test(lines[0]);
    if (isSubheading) {
      const content = formatInlineText(lines[0].replace(/^##\s+/, ""), frame.accent);
      return `<h2 class="mail-body-subheading" style="margin:18px 0 10px 0;font-family:${font};font-size:${frame.fontSize + 4}px;font-weight:600;line-height:1.35;color:${frame.headingColor};text-align:${frame.align};">${content}</h2>`;
    }
    const isCallout = lines.length > 0 && lines.every((line) => /^>\s?/.test(line));
    if (isCallout) {
      const rendered = lines.map((line) => formatInlineText(line.replace(/^>\s?/, ""), frame.accent)).join("<br />");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px 0;background-color:${frame.cardBg};border-left:3px solid ${frame.accent};border-radius:0 10px 10px 0;"><tr><td class="mail-body-text" style="padding:12px 16px;color:${frame.text};font-size:${frame.fontSize}px;line-height:1.68;${typography}">${rendered}</td></tr></table>`;
    }
    const isBulletList = lines.length > 0 && lines.every((line) => /^[-•*]\s+/.test(line));
    if (isBulletList) {
      const items = lines.map((line) => {
        const content = formatInlineText(line.replace(/^[-•*]\s+/, ""), frame.accent);
        return `<tr>
          <td valign="top" width="18" style="padding:3px 0;color:${frame.accent};font-size:15px;line-height:1.6;font-family:${font};">&bull;</td>
          <td valign="top" class="mail-body-text" style="padding:3px 0;color:${design ? frame.text : "#4a313d"};font-size:${design ? frame.fontSize : 14}px;line-height:1.65;${typography}">${content}</td>
        </tr>`;
      }).join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">${items}</table>`;
    }
    const isDivider = lines.length === 1 && /^[-_=]{3,}$/.test(lines[0]);
    if (isDivider) {
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;"><tr><td style="border-top:1px solid ${frame.border};font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
    }
    const renderedLines = lines.map((line) => formatInlineText(line, frame.accent)).join("<br />");
    return `<p class="mail-body-text" style="margin:0 0 14px 0;color:${frame.text};font-size:${frame.fontSize}px;line-height:1.72;${typography}">${renderedLines}</p>`;
  }).join("");
  return frame.useHtml ? renderMailCode(frame.htmlSource, formatted) : formatted;
}

function buildPreheader(text) {
  const preview = String(text || "").replace(/\s+/g, " ").trim().slice(0, 140);
  if (!preview) return "";
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f9f3f6;opacity:0;">${escapeHtml(preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;
}

function sectionAttr(name, interactive) {
  return interactive ? ` data-mail-section="${name}"` : "";
}

function previewInteractiveHead(interactive, selectedSection) {
  if (!interactive) return "";
  const activeSel = selectedSection ? `[data-mail-section="${escapeHtml(selectedSection)}"] { outline: 2px solid #b8446d !important; outline-offset: -2px; }` : "";
  return `<style>
    [data-mail-section] { cursor: pointer; transition: outline-color .15s ease; }
    [data-mail-section]:hover { outline: 2px dashed #b8446d; outline-offset: -2px; }
    ${activeSel}
  </style>`;
}

function previewInteractiveScript(interactive) {
  if (!interactive) return "";
  return `<script>
    document.addEventListener("click", function(e) {
      var el = e.target && e.target.closest ? e.target.closest("[data-mail-section]") : null;
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        window.parent.postMessage({ type: "orora-mail-select", section: el.getAttribute("data-mail-section") }, "*");
      }
    }, true);
  </script>`;
}

function renderEmailShell({
  design,
  subject,
  preheader,
  eyebrow,
  bodyHtml,
  siteOrigin,
  contactEmail,
  unsubscribeUrl,
  footerNote,
  interactivePreview = false,
  selectedSection = "",
}) {
  const origin = safeOrigin(siteOrigin);
  const email = contactEmail || DEFAULT_CONTACT_EMAIL;
  const policyUrl = `${origin}/chinh-sach`;
  const safeUnsub = safeHref(unsubscribeUrl);
  const frame = mailDesign(design);
  const headerFont = resolveFont(frame.headerFont, FONT_SERIF);
  const bodyFont = resolveFont(frame.font, FONT_SANS);
  const year = new Date().getFullYear();
  const resolvedEyebrow = frame.eyebrow.trim() || eyebrow;
  const logoSrc = safeHttpsUrl(frame.logoUrl);
  const resolvedFooterNote = frame.footerNote.trim() ? escapeHtml(frame.footerNote.trim()) : footerNote;
  const resolvedCopyright = frame.footerCopyright.trim()
    ? escapeHtml(frame.footerCopyright.trim())
    : `&copy; ${year} ${escapeHtml(frame.brand || "ORORA")} Vietnam. All rights reserved.`;

  return `<!DOCTYPE html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject || frame.brand || "ORORA")}</title>
  ${[frame.font,frame.headerFont,frame.headingFont,frame.orderCodeFont,frame.detailFont,frame.deliveryFont].includes("notoSerif") ? '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;600;700&amp;display=swap" />' : ""}
  <style data-mail-mobile>
    @media only screen and (max-width: 600px) {
      .mail-body-text { font-size: ${frame.mobileFontSize}px !important; }
      .mail-delivery-text { font-size: ${frame.deliveryMobileSize}px !important; }
      .mail-delivery-heading { font-size: ${frame.deliveryMobileSize - 2}px !important; }
      .mail-order-code { font-size: ${frame.orderCodeMobileSize}px !important; }
      ${[11.5,12,13.5,14,15,17].map(size => `.mail-detail-size-${size.toFixed(1).replace(".", "-")} { font-size: ${frame.detailMobileSize + size - 14}px !important; }`).join("\n")}
      .mail-body-subheading { font-size: ${frame.mobileFontSize + 4}px !important; }
      .mail-hero-heading { font-size: ${frame.headingMobileSize}px !important; }
    }
  </style>
  ${previewInteractiveHead(interactivePreview, selectedSection)}
</head>
<body style="margin:0;padding:0;background-color:${frame.background};color:#331c27;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${bodyFont};">
  ${buildPreheader(frame.preheader.trim() || preheader || subject)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${frame.background};margin:0;padding:0;"${sectionAttr("Khung thư", interactivePreview)}>
    <tr>
      <td align="center" style="padding:28px 14px 36px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${frame.width}px;width:100%;background-color:${frame.surface};border:${frame.thickness}px solid ${frame.border};border-radius:${frame.radius}px;overflow:hidden;box-shadow:0 12px 32px rgba(58,21,38,0.06);">
          ${frame.showHeader ? `<!-- Luxury Plum Header -->
          <tr>
            <td align="center"${sectionAttr("Đầu thư", interactivePreview)} style="background-color:${frame.header};padding:30px 28px 26px 28px;border-bottom:2px solid ${frame.headerBorder};">
              <a href="${escapeHtml(origin)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                ${logoSrc
                  ? `<img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(frame.brand || "ORORA")}" width="${frame.logoWidth}" style="display:block;width:${frame.logoWidth}px;max-width:100%;height:auto;margin:0 auto;" />`
                  : `<span style="display:block;font-family:${headerFont};font-size:${frame.brandSize}px;font-weight:600;letter-spacing:8px;color:${frame.headerText};line-height:1.15;">${escapeHtml(frame.brand)}</span>`}
                ${frame.tagline.trim() ? `<span style="display:block;margin-top:6px;font-family:${headerFont};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:${frame.taglineColor};">${escapeHtml(frame.tagline)}</span>` : ""}
              </a>
              ${frame.showEyebrow && resolvedEyebrow ? `<div style="margin-top:16px;"><span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:rgba(255,248,251,0.12);border:1px solid rgba(243,196,214,0.35);font-family:${headerFont};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:${frame.headerText};">${escapeHtml(resolvedEyebrow)}</span></div>` : ""}
            </td>
          </tr>` : ""}
          <!-- Main Content -->
          <tr>
            <td style="padding:32px 28px 28px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          ${frame.showFooter ? `<!-- Footer -->
          <tr>
            <td${sectionAttr("Chân thư", interactivePreview)} style="background-color:${frame.footer};border-top:1px solid ${frame.border};padding:24px 28px 26px 28px;text-align:center;">
              ${resolvedFooterNote ? `<p style="margin:0 0 12px 0;font-family:${bodyFont};font-size:13px;line-height:1.6;color:${frame.footerText};">${resolvedFooterNote}</p>` : ""}
              <p style="margin:0 0 10px 0;font-family:${bodyFont};font-size:12px;line-height:1.7;color:${frame.footerText};">
                <a href="${escapeHtml(origin)}" target="_blank" rel="noopener noreferrer" style="color:${frame.accent};text-decoration:none;font-weight:600;">${escapeHtml(frame.footerSiteLabel || "Website ORORA")}</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(policyUrl)}" target="_blank" rel="noopener noreferrer" style="color:${frame.footerText};text-decoration:underline;">${escapeHtml(frame.footerPolicyLabel || "Chính sách mua hàng")}</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${escapeHtml(email)}" style="color:${frame.footerText};text-decoration:underline;">${escapeHtml(email)}</a>
              </p>
              ${frame.footerAddress.trim() ? `<p style="margin:0 0 8px 0;font-family:${bodyFont};font-size:12px;line-height:1.6;color:${frame.footerText};">${escapeHtml(frame.footerAddress.trim())}</p>` : ""}
              ${safeUnsub ? `<p style="margin:0 0 10px 0;font-family:${bodyFont};font-size:12px;line-height:1.6;color:${frame.footerText};">Bạn nhận được email này vì đã đăng ký nhận tin từ ${escapeHtml(frame.brand || "ORORA")}. <a href="${escapeHtml(safeUnsub)}" target="_blank" rel="noopener noreferrer" style="color:${frame.footerText};text-decoration:underline;">Hủy đăng ký nhận tin</a></p>` : ""}
              <p style="margin:0;font-family:${bodyFont};font-size:11px;letter-spacing:0.6px;color:${frame.footerText};opacity:0.85;">${resolvedCopyright}</p>
            </td>
          </tr>` : ""}
        </table>
      </td>
    </tr>
  </table>
  ${previewInteractiveScript(interactivePreview)}
</body>
</html>`;
}

function marketingButtonUrl(design) {
  return safeHttpsUrl(design?.buttonUrl);
}

function renderButton(label, url, design, interactivePreview = false) {
  const frame = mailDesign(design);
  if (!frame.showButton) return "";
  const href = safeHref(url);
  if (!href) return "";
  const bodyFont = resolveFont(frame.font, FONT_SANS);
  const align = frame.buttonAlign || "center";
  const radius = frame.buttonRadius;
  const margin = align === "center" ? "22px auto 6px auto" : align === "right" ? "22px 0 6px auto" : "22px auto 6px 0";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}"${sectionAttr("Nút hành động", interactivePreview)} style="margin:${margin};">
    <tr>
      <td align="center" bgcolor="${frame.button}" style="border-radius:${radius}px;background-color:${frame.button};">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 28px;font-family:${bodyFont};font-size:${frame.buttonFontSize}px;font-weight:600;letter-spacing:0.4px;color:${frame.buttonText};text-decoration:none;border-radius:${radius}px;">${escapeHtml(frame.buttonLabel.trim() || label)}</a>
      </td>
    </tr>
  </table>`;
}

function renderBanner(frame, interactivePreview = false) {
  const src = safeHttpsUrl(frame.bannerUrl);
  if (!src) return "";
  return `<div${sectionAttr("Nội dung", interactivePreview)} style="margin:0 0 20px 0;text-align:center;">
    <img src="${escapeHtml(src)}" alt="${escapeHtml(frame.bannerAlt || frame.brand || "ORORA")}" width="${Math.min(544, frame.width - 56)}" style="display:block;width:100%;max-width:100%;height:auto;border-radius:12px;border:1px solid ${frame.border};" />
  </div>`;
}

function renderCouponBox(frame, interactivePreview = false) {
  if (!frame.showCoupon || !frame.couponCode.trim()) return "";
  const code = frame.couponCode.trim();
  const bodyFont = resolveFont(frame.font, FONT_SANS);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Các khối", interactivePreview)} style="margin:20px 0 8px 0;background-color:${frame.cardBg};border:1px dashed ${frame.accent};border-radius:14px;">
    <tr>
      <td align="center" style="padding:18px 20px;">
        <div style="font-family:${bodyFont};font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:${frame.accent};margin-bottom:8px;">${escapeHtml(frame.couponTitle || "Quà tặng thành viên mới")}</div>
        <div style="display:inline-block;padding:8px 20px;border-radius:8px;background-color:${frame.surface};border:1px solid ${frame.cardBorder};font-family:${FONT_MONO};font-size:20px;font-weight:700;letter-spacing:2px;color:${frame.headingColor};">${escapeHtml(code)}</div>
        ${frame.couponNote.trim() ? `<div style="margin-top:8px;font-family:${bodyFont};font-size:12.5px;line-height:1.5;color:${frame.footerText};">${escapeHtml(frame.couponNote)}</div>` : ""}
      </td>
    </tr>
  </table>`;
}

function renderPillars(frame, interactivePreview = false) {
  if (!frame.showPillars) return "";
  const headingFont = resolveFont(frame.headingFont, FONT_SERIF);
  const bodyFont = resolveFont(frame.font, FONT_SANS);
  const items = [
    [frame.pillar1Title, frame.pillar1Desc],
    [frame.pillar2Title, frame.pillar2Desc],
    [frame.pillar3Title, frame.pillar3Desc],
  ].filter(([t, d]) => t.trim() || d.trim());
  if (!items.length) return "";
  const colWidth = `${(100 / items.length).toFixed(2)}%`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Các khối", interactivePreview)} style="margin:22px 0 8px 0;background-color:${frame.cardBg};border:1px solid ${frame.cardBorder};border-radius:14px;">
    <tr>
      ${items.map(([t, d], idx) => `<td width="${colWidth}" valign="top" style="padding:16px 12px;text-align:center;${idx < items.length - 1 ? `border-right:1px solid ${frame.cardBorder};` : ""}">
        <div style="font-family:${headingFont};font-size:16px;font-weight:600;color:${frame.accent};margin-bottom:4px;">${escapeHtml(t)}</div>
        <div style="font-family:${bodyFont};font-size:12px;line-height:1.5;color:${frame.footerText};">${escapeHtml(d)}</div>
      </td>`).join("")}
    </tr>
  </table>`;
}

function renderHeroHeading(frame, fallbackText, defaultAlign = "center", interactivePreview = false) {
  if (!frame.showHeading) return "";
  const headingFont = resolveFont(frame.headingFont, FONT_SERIF);
  const align = frame.headingAlign === "auto" ? defaultAlign : frame.headingAlign;
  const text = frame.heading.trim() || fallbackText;
  const dividerAlign = align === "center" ? "center" : align === "right" ? "right" : "left";
  return `<div${sectionAttr("Tiêu đề", interactivePreview)}>
    <h1 class="mail-hero-heading" style="margin:0 0 18px 0;font-family:${headingFont};font-size:${frame.headingSize}px;font-weight:${frame.headingWeight};line-height:1.3;color:${frame.headingColor};text-align:${align};">${escapeHtml(text)}</h1>
    ${frame.showDivider ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr><td align="${dividerAlign}"><div style="width:48px;height:2px;background-color:${frame.headerBorder};font-size:0;line-height:0;">&nbsp;</div></td></tr>
    </table>` : ""}
  </div>`;
}

export function renderWelcomeEmailHtml({
  subject = "",
  text = "",
  unsubscribeUrl = "",
  design,
  siteOrigin = DEFAULT_ORIGIN,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  interactivePreview = false,
  selectedSection = "",
} = {}) {
  const origin = safeOrigin(siteOrigin);
  const frame = mailDesign(design);
  const bodyCopy = formatBodyHtml(text, { unsubscribeUrl, design });

  const bodyHtml = `
    ${renderHeroHeading(frame, subject || "Chào mừng bạn đến với ORORA", "center", interactivePreview)}
    ${renderBanner(frame, interactivePreview)}
    <div${sectionAttr("Nội dung", interactivePreview)}>${bodyCopy}</div>
    ${renderCouponBox(frame, interactivePreview)}
    ${renderPillars(frame, interactivePreview)}
    ${renderButton("Khám phá bộ sưu tập ORORA", marketingButtonUrl(design) || origin, design, interactivePreview)}
  `;

  return renderEmailShell({
    design,
    subject: subject || "Chào mừng bạn đến với ORORA",
    preheader: stripUnsubscribeFooter(text, unsubscribeUrl) || "Cảm ơn bạn đã đăng ký nhận tin từ ORORA.",
    eyebrow: "Chào mừng thành viên mới",
    bodyHtml,
    siteOrigin: origin,
    contactEmail,
    unsubscribeUrl,
    footerNote: "Cần tư vấn chọn sản phẩm? Trả lời trực tiếp email này, đội ngũ ORORA luôn sẵn sàng hỗ trợ bạn.",
    interactivePreview,
    selectedSection,
  });
}

export function renderBrandedEmailHtml({
  subject = "",
  text = "",
  unsubscribeUrl = "",
  design,
  siteOrigin = DEFAULT_ORIGIN,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  eyebrow = "Bản tin ORORA",
  ctaLabel = "",
  ctaUrl = "",
  interactivePreview = false,
  selectedSection = "",
} = {}) {
  const origin = safeOrigin(siteOrigin);
  const frame = mailDesign(design);
  const bodyCopy = formatBodyHtml(text, { unsubscribeUrl, design });
  const bodyHtml = `
    ${renderHeroHeading(frame, subject || "Thông báo từ ORORA", "left", interactivePreview)}
    ${renderBanner(frame, interactivePreview)}
    <div${sectionAttr("Nội dung", interactivePreview)}>${bodyCopy}</div>
    ${renderCouponBox(frame, interactivePreview)}
    ${(design?.buttonLabel?.trim() || ctaLabel) && (marketingButtonUrl(design) || ctaUrl) ? renderButton(ctaLabel, marketingButtonUrl(design) || ctaUrl, design, interactivePreview) : ""}
  `;

  return renderEmailShell({
    design,
    subject: subject || "Thông báo từ ORORA",
    preheader: stripUnsubscribeFooter(text, unsubscribeUrl) || subject,
    eyebrow,
    bodyHtml,
    siteOrigin: origin,
    contactEmail,
    unsubscribeUrl,
    interactivePreview,
    selectedSection,
  });
}

function normalizeOrderItems(order) {
  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items.map((item) => {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const unit = item.unitPrice != null ? Number(item.unitPrice) : null;
      const lineTotal = item.subtotal != null
        ? Number(item.subtotal)
        : unit != null
          ? unit * qty
          : null;
      return {
        name: orderProductName(item),
        variant: item.variantLabel || "",
        quantity: qty,
        priceText: lineTotal != null ? formatVnd(lineTotal) : (formatProductPrice(item.priceText) || "Liên hệ"),
      };
    });
  }
  const product = order?.product || {};
  const qty = Math.max(1, Number(order?.quantity) || 1);
  const unit = product.unitPrice != null ? Number(product.unitPrice) : null;
  const lineTotal = order?.subtotal != null
    ? Number(order.subtotal)
    : unit != null
      ? unit * qty
      : null;
  return [{
    name: orderProductName(product) || "Sản phẩm ORORA",
    variant: product.variantLabel || "",
    quantity: qty,
    priceText: lineTotal != null ? formatVnd(lineTotal) : (formatProductPrice(product.priceText) || "ORORA sẽ báo giá"),
  }];
}

function formatOrderDate(order) {
  const orderedAt = order?.createdAt?.toDate?.() ?? order?.createdAt;
  const date = orderedAt ? new Date(orderedAt) : null;
  if (!date || !Number.isFinite(date.getTime())) return "Vừa đặt";
  return date.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
}

function renderBankTransferBlock(order, bankInfo, frame, interactivePreview = false) {
  if (!frame.showOrderBank || order?.paymentMethod !== "bank_transfer") return "";
  const bodyFont = resolveFont(frame.font, FONT_SANS);
  if (order?.paymentStatus === "paid") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Các khối", interactivePreview)} style="margin:20px 0 0 0;background-color:#eef8f2;border:1px solid #b7e2c7;border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${bodyFont};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#1f6e43;margin-bottom:6px;">Đã nhận thanh toán</div>
          <p style="margin:0;font-family:${bodyFont};font-size:13.5px;line-height:1.6;color:#27533a;">ORORA đã xác nhận nhận thanh toán cho đơn hàng <strong>${escapeHtml(order?.code || "")}</strong>. Bạn không cần chuyển khoản thêm.</p>
        </td>
      </tr>
    </table>`;
  }
  const heading = String(bankInfo?.bankHeading || "").trim() || "Thông tin chuyển khoản";
  const amount = Number(order?.totalAmount);
  if (order?.totalAmount == null || !Number.isFinite(amount) || amount <= 0) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Các khối", interactivePreview)} style="margin:20px 0 0 0;background-color:${frame.cardBg};border:1px solid ${frame.cardBorder};border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${bodyFont};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${frame.accent};margin-bottom:6px;">${escapeHtml(heading)}</div>
          <p style="margin:0;font-family:${bodyFont};font-size:13.5px;line-height:1.6;color:${frame.text};">Đơn hàng <strong>${escapeHtml(order?.code || "")}</strong> đang chờ ORORA xác nhận tổng tiền chính xác. Vui lòng chờ thông báo xác nhận từ ORORA trước khi chuyển khoản.</p>
        </td>
      </tr>
    </table>`;
  }
  const bankCode = String(bankInfo?.bankCode || "").trim();
  const bankName = String(bankInfo?.bankName || "").trim();
  const accountNumber = String(bankInfo?.bankAccountNumber || "").trim();
  const accountName = String(bankInfo?.bankAccountName || "").trim();
  const transferNoteTemplate = String(bankInfo?.bankTransferNote || "").trim() || "Thanh toán đơn {{code}}";
  const transferNote = transferNoteTemplate.replace(/\{\{code\}\}/g, order?.code || "");
  const hasBankDetails = Boolean((bankCode || bankName) && accountNumber && accountName);
  const qrUrl = hasBankDetails
    ? vietQrUrl({ bankName: bankCode || bankName, accountNumber, accountName, amount, transferNote })
    : "";

  if (!hasBankDetails) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Các khối", interactivePreview)} style="margin:20px 0 0 0;background-color:${frame.cardBg};border:1px solid ${frame.cardBorder};border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${bodyFont};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${frame.accent};margin-bottom:6px;">${escapeHtml(heading)}</div>
          <p style="margin:0;font-family:${bodyFont};font-size:13.5px;line-height:1.6;color:${frame.text};">ORORA sẽ liên hệ xác nhận tổng tiền chính xác và gửi thông tin chuyển khoản kèm mã đơn <strong>${escapeHtml(order?.code || "")}</strong> cho bạn trong thời gian sớm nhất.</p>
        </td>
      </tr>
    </table>`;
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Các khối", interactivePreview)} style="margin:20px 0 0 0;background-color:${frame.cardBg};border:1px solid ${frame.cardBorder};border-radius:14px;">
    <tr>
      <td style="padding:18px 20px;">
        <div style="font-family:${bodyFont};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${frame.accent};margin-bottom:12px;">${escapeHtml(heading)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:4px 0;font-size:13px;color:${frame.footerText};width:130px;">Ngân hàng</td><td style="padding:4px 0;font-size:13.5px;font-weight:600;color:${frame.headingColor};">${escapeHtml(bankName)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:${frame.footerText};">Số tài khoản</td><td style="padding:4px 0;font-size:14px;font-weight:700;font-family:${FONT_MONO};color:${frame.accent};">${escapeHtml(accountNumber)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:${frame.footerText};">Chủ tài khoản</td><td style="padding:4px 0;font-size:13.5px;font-weight:600;color:${frame.headingColor};">${escapeHtml(accountName)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:${frame.footerText};">Số tiền</td><td style="padding:4px 0;font-size:14px;font-weight:700;color:${frame.headingColor};">${escapeHtml(formatVnd(amount))}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:${frame.footerText};">Nội dung CK</td><td style="padding:4px 0;font-size:13.5px;font-weight:700;font-family:${FONT_MONO};color:${frame.headingColor};">${escapeHtml(transferNote)}</td></tr>
        </table>
        ${qrUrl ? `<div style="margin-top:14px;text-align:center;">
          <img src="${escapeHtml(qrUrl)}" alt="Mã VietQR thanh toán đơn ${escapeHtml(order?.code || "")}" width="180" style="display:inline-block;width:180px;max-width:100%;height:auto;border-radius:10px;border:1px solid ${frame.border};background:#ffffff;padding:6px;" />
          <div style="margin-top:6px;font-size:11.5px;color:${frame.footerText};">Quét mã VietQR bằng ứng dụng ngân hàng để chuyển khoản nhanh</div>
        </div>` : ""}
      </td>
    </tr>
  </table>`;
}

export function renderOrderEmailHtml({
  subject = "",
  text = "",
  order = {},
  design,
  siteOrigin = DEFAULT_ORIGIN,
  bankInfo = null,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  trackingUrl = "",
  trackingEnabled = true,
  interactivePreview = false,
  selectedSection = "",
} = {}) {
  const origin = safeOrigin(siteOrigin);
  const frame = mailDesign(design);
  const bodyFont = resolveFont(frame.font, FONT_SANS);
  const tracking = orderTrackingMail(origin, order?.code, trackingEnabled);
  const resolvedTrackingUrl = trackingUrl || tracking.url;
  const items = normalizeOrderItems(order);
  const isPaid = order?.paymentStatus === "paid";
  const paymentBadgeBg = isPaid ? "#eef8f2" : "#fff6ea";
  const paymentBadgeColor = isPaid ? "#1f6e43" : "#9a5a12";
  const paymentBadgeBorder = isPaid ? "#b7e2c7" : "#f3d9b1";
  const paymentBadgeLabel = isPaid ? frame.paidLabel : frame.unpaidLabel;
  const subtotalText = order?.subtotal == null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal);
  const shippingText = order?.shippingFee == null ? "ORORA sẽ xác nhận" : formatVnd(order.shippingFee);
  const totalText = order?.totalAmount == null ? "ORORA sẽ xác nhận" : formatVnd(order.totalAmount);
  const paymentMethodLabel = PAYMENT_LABELS[order?.paymentMethod] || order?.paymentMethod || "Thanh toán khi nhận hàng (COD)";
  const customer = order?.customer || {};
  const bodyCopy = formatBodyHtml(text, { design });

  const codeFont = resolveFont(frame.orderCodeFont, FONT_MONO);
  const detailFont = resolveFont(frame.detailFont, bodyFont);
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${frame.border};font-family:${detailFont};">
        <div class="mail-detail-size-14-0" style="font-size:${frame.detailSize}px;font-weight:600;color:${frame.headingColor};line-height:1.4;">${escapeHtml(item.name)}</div>
        ${item.variant && !item.name.includes(item.variant) ? `<div class="mail-detail-size-12-0" style="margin-top:2px;font-size:${frame.detailSize - 2}px;color:${frame.footerText};">${escapeHtml(frame.variantLabel)} ${escapeHtml(item.variant)}</div>` : ""}
      </td>
      <td align="center" class="mail-detail-size-13-5" style="padding:12px 8px;border-bottom:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize - 0.5}px;color:${frame.text};white-space:nowrap;">&times;${escapeHtml(item.quantity)}</td>
      <td align="right" class="mail-detail-size-14-0" style="padding:12px 0;border-bottom:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize}px;font-weight:600;color:${frame.headingColor};white-space:nowrap;">${escapeHtml(item.priceText)}</td>
    </tr>
  `).join("");

  const heroCardHtml = frame.showOrderHero ? `
    <!-- Order Hero Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Mã đơn", interactivePreview)} style="background-color:${frame.cardBg};border:1px solid ${frame.cardBorder};border-radius:14px;margin:0 0 22px 0;">
      <tr>
        <td style="padding:20px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top">
                <div style="font-family:${frame.orderCodeFont === "mono" ? bodyFont : codeFont};font-size:${frame.codeLabelSize}px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${frame.footerText};">${escapeHtml(frame.codeLabel)}</div>
                <div class="mail-order-code" style="margin-top:4px;font-family:${codeFont};font-size:${frame.orderCodeSize}px;font-weight:${frame.orderCodeWeight === "bold" ? 700 : 400};color:${frame.headingColor};letter-spacing:0.6px;">${escapeHtml(order?.code || "ORORA")}</div>
                <div style="margin-top:4px;font-family:${bodyFont};font-size:12.5px;color:${frame.footerText};">${escapeHtml(frame.placedLabel)} ${escapeHtml(formatOrderDate(order))}</div>
              </td>
              <td valign="top" align="right">
                <span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:${paymentBadgeBg};border:1px solid ${paymentBadgeBorder};font-family:${bodyFont};font-size:12px;font-weight:600;color:${paymentBadgeColor};white-space:nowrap;">${escapeHtml(paymentBadgeLabel)}</span>
              </td>
            </tr>
          </table>
          ${frame.showOrderSteps ? (() => {
            const activeStep = Number(frame.orderActiveStep) || 1;
            const steps = [
              frame.orderStep1 || "1. Đã tiếp nhận",
              frame.orderStep2 || "2. Xác nhận & đóng gói",
              frame.orderStep3 || "3. Giao hàng tận nơi",
            ];
            return `<!-- 3-Step Order Journey -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;padding-top:14px;border-top:1px dashed ${frame.cardBorder};">
            <tr>
              ${steps.map((label, idx) => {
                const stepNum = idx + 1;
                const reached = stepNum <= activeStep;
                const current = stepNum === activeStep;
                const color = current ? frame.accent : reached ? frame.headingColor : frame.footerText;
                const weight = reached ? "700" : "400";
                const prefix = reached ? "&#10003; " : "";
                return `<td width="33.33%" align="center" style="font-family:${bodyFont};font-size:11.5px;font-weight:${weight};color:${color};">${prefix}${escapeHtml(label)}</td>`;
              }).join("")}
            </tr>
          </table>`;
          })() : ""}
        </td>
      </tr>
    </table>` : "";

  const messageBlockHtml = bodyCopy ? `<div${sectionAttr("Nội dung", interactivePreview)} style="margin:0 0 22px 0;">${bodyCopy}</div>` : "";
  const headingBlockHtml = frame.showHeading && frame.heading.trim() ? renderHeroHeading(frame, frame.heading.trim(), "left", interactivePreview) : "";

  const itemsBlockHtml = frame.showOrderItems ? `
    <div${sectionAttr("Chi tiết đơn", interactivePreview)}>
      <!-- Itemized Order Summary -->
      <div class="mail-detail-size-12-0" style="font-family:${detailFont};font-size:${frame.detailSize - 2}px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${frame.accent};margin:0 0 8px 0;">${escapeHtml(frame.orderItemsHeading)}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid ${frame.headingColor};margin:0 0 14px 0;">
        <tr>
          <th align="left" class="mail-detail-size-11-5" style="padding:10px 0;border-bottom:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize - 2.5}px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:${frame.footerText};">${escapeHtml(frame.productLabel)}</th>
          <th align="center" class="mail-detail-size-11-5" style="padding:10px 8px;border-bottom:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize - 2.5}px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:${frame.footerText};">${escapeHtml(frame.qtyLabel)}</th>
          <th align="right" class="mail-detail-size-11-5" style="padding:10px 0;border-bottom:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize - 2.5}px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:${frame.footerText};">${escapeHtml(frame.amountLabel)}</th>
        </tr>
        ${itemRows}
      </table>

      <!-- Pricing Breakdown -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
        <tr>
          <td class="mail-detail-size-13-5" style="padding:4px 0;font-family:${detailFont};font-size:${frame.detailSize - 0.5}px;color:${frame.footerText};">${escapeHtml(frame.subtotalLabel)}</td>
          <td align="right" class="mail-detail-size-13-5" style="padding:4px 0;font-family:${detailFont};font-size:${frame.detailSize - 0.5}px;color:${frame.headingColor};">${escapeHtml(subtotalText)}</td>
        </tr>
        <tr>
          <td class="mail-detail-size-13-5" style="padding:4px 0;font-family:${detailFont};font-size:${frame.detailSize - 0.5}px;color:${frame.footerText};">${escapeHtml(frame.shippingLabel)}</td>
          <td align="right" class="mail-detail-size-13-5" style="padding:4px 0;font-family:${detailFont};font-size:${frame.detailSize - 0.5}px;color:${frame.headingColor};">${escapeHtml(shippingText)}</td>
        </tr>
        <tr>
          <td class="mail-detail-size-15-0" style="padding:12px 0 4px 0;border-top:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize + 1}px;font-weight:700;color:${frame.headingColor};">${escapeHtml(frame.totalLabel)}</td>
          <td align="right" class="mail-detail-size-17-0" style="padding:12px 0 4px 0;border-top:1px solid ${frame.border};font-family:${detailFont};font-size:${frame.detailSize + 3}px;font-weight:700;color:${frame.accent};">${escapeHtml(totalText)}</td>
        </tr>
      </table>
    </div>` : "";

  const deliveryFont = resolveFont(frame.deliveryFont, bodyFont);
  const deliveryBlockHtml = frame.showOrderDelivery ? `
    <!-- Recipient & Delivery Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${sectionAttr("Thông tin giao nhận", interactivePreview)} style="font-family:${deliveryFont};background-color:${frame.footer};border:1px solid ${frame.border};border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div class="mail-delivery-heading" style="font-family:${deliveryFont};font-size:${frame.deliverySize - 2}px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:${frame.accent};margin-bottom:10px;">${escapeHtml(frame.orderDeliveryHeading)}</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${customer.name ? `<tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};width:130px;">${escapeHtml(frame.deliveryRecipientLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;font-weight:600;color:${frame.headingColor};">${escapeHtml(customer.name)}</td></tr>` : ""}
            ${customer.phone ? `<tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};">${escapeHtml(frame.deliveryPhoneLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.headingColor};">${escapeHtml(customer.phone)}</td></tr>` : ""}
            ${customer.email ? `<tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};">${escapeHtml(frame.deliveryEmailLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.headingColor};">${escapeHtml(customer.email)}</td></tr>` : ""}
            ${customer.address ? `<tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};">${escapeHtml(frame.deliveryAddressLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;line-height:1.55;color:${frame.headingColor};">${escapeHtml(customer.address)}</td></tr>` : ""}
            <tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};">${escapeHtml(frame.deliveryPaymentLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.headingColor};">${escapeHtml(paymentMethodLabel)}</td></tr>
            ${order?.trackingCode ? `<tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};">${escapeHtml(frame.deliveryTrackingLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;font-weight:700;font-family:${deliveryFont};color:${frame.accent};">${escapeHtml(order.trackingCode)}</td></tr>` : ""}
            ${customer.note ? `<tr><td valign="top" class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;color:${frame.footerText};">${escapeHtml(frame.deliveryNoteLabel)}</td><td class="mail-delivery-text" style="padding:4px 0;font-size:${frame.deliverySize}px;line-height:1.55;color:${frame.text};">${escapeHtml(customer.note)}</td></tr>` : ""}
          </table>
        </td>
      </tr>
    </table>` : "";

  const bodyHtml = `
    ${headingBlockHtml}
    ${renderBanner(frame, interactivePreview)}
    ${frame.orderLayout === "message-first" ? `${messageBlockHtml}${heroCardHtml}` : `${heroCardHtml}${messageBlockHtml}`}
    ${itemsBlockHtml}
    ${deliveryBlockHtml}
    ${renderBankTransferBlock(order, bankInfo, frame, interactivePreview)}
    ${renderCouponBox(frame, interactivePreview)}
    ${renderButton(trackingEnabled ? "Tra cứu trạng thái đơn hàng" : "Liên hệ ORORA", resolvedTrackingUrl, design, interactivePreview)}
    ${frame.showButton ? `<p style="margin:6px 0 0 0;text-align:center;font-family:${bodyFont};font-size:12px;color:${frame.footerText};">${tracking.hint}</p>` : ""}
  `;

  return renderEmailShell({
    design,
    subject: subject || `ORORA xác nhận đơn hàng ${order?.code || ""}`.trim(),
    preheader: `Đơn hàng ${order?.code || ""} (${totalText}) đã được ORORA tiếp nhận.`,
    eyebrow: "Xác nhận đơn hàng",
    bodyHtml,
    siteOrigin: origin,
    contactEmail,
    footerNote: `Nếu cần thay đổi thông tin hoặc hỗ trợ nhanh, bạn chỉ cần trả lời trực tiếp email này kèm mã đơn <strong>${escapeHtml(order?.code || "")}</strong>.`,
    interactivePreview,
    selectedSection,
  });
}
