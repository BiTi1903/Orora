import { PAYMENT_LABELS, formatProductPrice, formatVnd } from "./commerce.js";
import { orderProductName } from "./product-options.js";
import { vietQrUrl } from "./vietqr.js";

const DEFAULT_ORIGIN = "https://ororavn.com";
const DEFAULT_CONTACT_EMAIL = "sales@ororavn.com";

const FONT_SERIF = "Georgia, 'Times New Roman', serif";
const FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const FONT_MONO = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

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
  if (!/^https?:\/\//i.test(trimmed)) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return parsed.href;
  } catch { /* invalid */ }
  return "";
}

function linkifyEscaped(escapedText) {
  return escapedText
    .replace(/(https?:\/\/[^\s<>"')]+)/gi, (url) => {
      const clean = url.replace(/[.,;:!?]+$/, "");
      const suffix = url.slice(clean.length);
      return `<a href="${clean}" target="_blank" rel="noopener noreferrer" style="color:#b8446d;text-decoration:underline;word-break:break-word;">${clean}</a>${suffix}`;
    })
    .replace(/(^|[\s(>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, (match, prefix, email) => (
      `${prefix}<a href="mailto:${email}" style="color:#b8446d;text-decoration:underline;">${email}</a>`
    ));
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

export function formatBodyHtml(text, { unsubscribeUrl = "" } = {}) {
  const cleaned = stripUnsubscribeFooter(text, unsubscribeUrl);
  if (!cleaned) return "";
  const blocks = cleaned.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block) => {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const isBulletList = lines.length > 0 && lines.every((line) => /^[-•*]\s+/.test(line));
    if (isBulletList) {
      const items = lines.map((line) => {
        const content = linkifyEscaped(escapeHtml(line.replace(/^[-•*]\s+/, "")));
        return `<tr>
          <td valign="top" width="18" style="padding:3px 0;color:#b8446d;font-size:15px;line-height:1.6;font-family:${FONT_SANS};">&bull;</td>
          <td valign="top" style="padding:3px 0;color:#4a313d;font-size:14px;line-height:1.65;font-family:${FONT_SANS};">${content}</td>
        </tr>`;
      }).join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 14px 0;">${items}</table>`;
    }
    const isDivider = lines.length === 1 && /^[-_=]{3,}$/.test(lines[0]);
    if (isDivider) {
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0;"><tr><td style="border-top:1px solid #f0dde5;font-size:0;line-height:0;">&nbsp;</td></tr></table>`;
    }
    const renderedLines = lines.map((line) => linkifyEscaped(escapeHtml(line))).join("<br />");
    return `<p style="margin:0 0 14px 0;color:#3f2732;font-size:15px;line-height:1.72;font-family:${FONT_SANS};">${renderedLines}</p>`;
  }).join("");
}

function buildPreheader(text) {
  const preview = String(text || "").replace(/\s+/g, " ").trim().slice(0, 140);
  if (!preview) return "";
  return `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f9f3f6;opacity:0;">${escapeHtml(preview)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`;
}

function renderEmailShell({ subject, preheader, eyebrow, bodyHtml, siteOrigin, contactEmail, unsubscribeUrl, footerNote }) {
  const origin = safeOrigin(siteOrigin);
  const email = contactEmail || DEFAULT_CONTACT_EMAIL;
  const policyUrl = `${origin}/chinh-sach`;
  const safeUnsub = safeHref(unsubscribeUrl);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="vi" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject || "ORORA")}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f3f6;color:#331c27;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;font-family:${FONT_SANS};">
  ${buildPreheader(preheader || subject)}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f9f3f6;margin:0;padding:0;">
    <tr>
      <td align="center" style="padding:28px 14px 36px 14px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #efe0e7;border-radius:18px;overflow:hidden;box-shadow:0 12px 32px rgba(58,21,38,0.06);">
          <!-- Luxury Plum Header -->
          <tr>
            <td align="center" style="background-color:#3a1526;padding:30px 28px 26px 28px;border-bottom:2px solid #d98ca7;">
              <a href="${escapeHtml(origin)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;display:inline-block;">
                <span style="display:block;font-family:${FONT_SERIF};font-size:30px;font-weight:600;letter-spacing:8px;color:#fff8fb;line-height:1.15;">ORORA</span>
                <span style="display:block;margin-top:6px;font-family:${FONT_SANS};font-size:10px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:#f3c4d6;">Luxury Skincare &middot; Vietnam</span>
              </a>
              ${eyebrow ? `<div style="margin-top:16px;"><span style="display:inline-block;padding:5px 14px;border-radius:999px;background-color:rgba(255,248,251,0.12);border:1px solid rgba(243,196,214,0.35);font-family:${FONT_SANS};font-size:11px;font-weight:600;letter-spacing:1.4px;text-transform:uppercase;color:#fde8f0;">${escapeHtml(eyebrow)}</span></div>` : ""}
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:32px 28px 28px 28px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fdf8fa;border-top:1px solid #f0dde5;padding:24px 28px 26px 28px;text-align:center;">
              ${footerNote ? `<p style="margin:0 0 12px 0;font-family:${FONT_SANS};font-size:13px;line-height:1.6;color:#6c515e;">${footerNote}</p>` : ""}
              <p style="margin:0 0 10px 0;font-family:${FONT_SANS};font-size:12px;line-height:1.7;color:#846b77;">
                <a href="${escapeHtml(origin)}" target="_blank" rel="noopener noreferrer" style="color:#b8446d;text-decoration:none;font-weight:600;">Website ORORA</a>
                &nbsp;&middot;&nbsp;
                <a href="${escapeHtml(policyUrl)}" target="_blank" rel="noopener noreferrer" style="color:#846b77;text-decoration:underline;">Chính sách mua hàng</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${escapeHtml(email)}" style="color:#846b77;text-decoration:underline;">${escapeHtml(email)}</a>
              </p>
              ${safeUnsub ? `<p style="margin:0 0 10px 0;font-family:${FONT_SANS};font-size:12px;line-height:1.6;color:#9b828e;">Bạn nhận được email này vì đã đăng ký nhận tin từ ORORA. <a href="${escapeHtml(safeUnsub)}" target="_blank" rel="noopener noreferrer" style="color:#846b77;text-decoration:underline;">Hủy đăng ký nhận tin</a></p>` : ""}
              <p style="margin:0;font-family:${FONT_SANS};font-size:11px;letter-spacing:0.6px;color:#a58e99;">&copy; ${year} ORORA Vietnam. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function renderButton(label, url) {
  const href = safeHref(url);
  if (!href) return "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:22px auto 6px auto;">
    <tr>
      <td align="center" bgcolor="#b53c77" style="border-radius:999px;background-color:#b53c77;">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:13px 28px;font-family:${FONT_SANS};font-size:14px;font-weight:600;letter-spacing:0.4px;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

export function renderWelcomeEmailHtml({
  subject = "",
  text = "",
  unsubscribeUrl = "",
  siteOrigin = DEFAULT_ORIGIN,
  contactEmail = DEFAULT_CONTACT_EMAIL,
} = {}) {
  const origin = safeOrigin(siteOrigin);
  const bodyCopy = formatBodyHtml(text, { unsubscribeUrl });

  const bodyHtml = `
    <h1 style="margin:0 0 18px 0;font-family:${FONT_SERIF};font-size:26px;font-weight:600;line-height:1.3;color:#3a1526;text-align:center;">${escapeHtml(subject || "Chào mừng bạn đến với ORORA")}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
      <tr><td align="center"><div style="width:48px;height:2px;background-color:#d98ca7;font-size:0;line-height:0;">&nbsp;</div></td></tr>
    </table>
    <div>${bodyCopy}</div>
    <!-- Brand Pillars -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 8px 0;background-color:#fff8fb;border:1px solid #f2d8e3;border-radius:14px;">
      <tr>
        <td width="33.33%" valign="top" style="padding:16px 12px;text-align:center;border-right:1px solid #f2d8e3;">
          <div style="font-family:${FONT_SERIF};font-size:16px;font-weight:600;color:#b8446d;margin-bottom:4px;">Dịu nhẹ</div>
          <div style="font-family:${FONT_SANS};font-size:12px;line-height:1.5;color:#6c515e;">Tuyển chọn công thức lành tính cho làn da</div>
        </td>
        <td width="33.33%" valign="top" style="padding:16px 12px;text-align:center;border-right:1px solid #f2d8e3;">
          <div style="font-family:${FONT_SERIF};font-size:16px;font-weight:600;color:#b8446d;margin-bottom:4px;">Đặc quyền</div>
          <div style="font-family:${FONT_SANS};font-size:12px;line-height:1.5;color:#6c515e;">Nhận sớm thông tin ra mắt &amp; ưu đãi riêng</div>
        </td>
        <td width="33.33%" valign="top" style="padding:16px 12px;text-align:center;">
          <div style="font-family:${FONT_SERIF};font-size:16px;font-weight:600;color:#b8446d;margin-bottom:4px;">Tận tâm</div>
          <div style="font-family:${FONT_SANS};font-size:12px;line-height:1.5;color:#6c515e;">Tư vấn 1-1 phù hợp với chu trình của bạn</div>
        </td>
      </tr>
    </table>
    ${renderButton("Khám phá bộ sưu tập ORORA", origin)}
  `;

  return renderEmailShell({
    subject: subject || "Chào mừng bạn đến với ORORA",
    preheader: stripUnsubscribeFooter(text, unsubscribeUrl) || "Cảm ơn bạn đã đăng ký nhận tin từ ORORA.",
    eyebrow: "Chào mừng thành viên mới",
    bodyHtml,
    siteOrigin: origin,
    contactEmail,
    unsubscribeUrl,
    footerNote: "Cần tư vấn chọn sản phẩm? Trả lời trực tiếp email này, đội ngũ ORORA luôn sẵn sàng hỗ trợ bạn.",
  });
}

export function renderBrandedEmailHtml({
  subject = "",
  text = "",
  unsubscribeUrl = "",
  siteOrigin = DEFAULT_ORIGIN,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  eyebrow = "Bản tin ORORA",
  ctaLabel = "",
  ctaUrl = "",
} = {}) {
  const origin = safeOrigin(siteOrigin);
  const bodyCopy = formatBodyHtml(text, { unsubscribeUrl });
  const bodyHtml = `
    <h1 style="margin:0 0 18px 0;font-family:${FONT_SERIF};font-size:25px;font-weight:600;line-height:1.32;color:#3a1526;">${escapeHtml(subject || "Thông báo từ ORORA")}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;">
      <tr><td><div style="width:44px;height:2px;background-color:#d98ca7;font-size:0;line-height:0;">&nbsp;</div></td></tr>
    </table>
    <div>${bodyCopy}</div>
    ${ctaLabel && ctaUrl ? renderButton(ctaLabel, ctaUrl) : ""}
  `;

  return renderEmailShell({
    subject: subject || "Thông báo từ ORORA",
    preheader: stripUnsubscribeFooter(text, unsubscribeUrl) || subject,
    eyebrow,
    bodyHtml,
    siteOrigin: origin,
    contactEmail,
    unsubscribeUrl,
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

function renderBankTransferBlock(order, bankInfo) {
  if (order?.paymentMethod !== "bank_transfer") return "";
  if (order?.paymentStatus === "paid") {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;background-color:#eef8f2;border:1px solid #b7e2c7;border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${FONT_SANS};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#1f6e43;margin-bottom:6px;">Đã nhận thanh toán</div>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13.5px;line-height:1.6;color:#27533a;">ORORA đã xác nhận nhận thanh toán cho đơn hàng <strong>${escapeHtml(order?.code || "")}</strong>. Bạn không cần chuyển khoản thêm.</p>
        </td>
      </tr>
    </table>`;
  }
  const heading = String(bankInfo?.bankHeading || "").trim() || "Thông tin chuyển khoản";
  const amount = Number(order?.totalAmount);
  if (order?.totalAmount == null || !Number.isFinite(amount) || amount <= 0) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;background-color:#fff8fb;border:1px solid #f2d8e3;border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${FONT_SANS};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#b8446d;margin-bottom:6px;">${escapeHtml(heading)}</div>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13.5px;line-height:1.6;color:#5e4450;">Đơn hàng <strong>${escapeHtml(order?.code || "")}</strong> đang chờ ORORA xác nhận tổng tiền chính xác. Vui lòng chờ thông báo xác nhận từ ORORA trước khi chuyển khoản.</p>
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
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;background-color:#fff8fb;border:1px solid #f2d8e3;border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${FONT_SANS};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#b8446d;margin-bottom:6px;">${escapeHtml(heading)}</div>
          <p style="margin:0;font-family:${FONT_SANS};font-size:13.5px;line-height:1.6;color:#5e4450;">ORORA sẽ liên hệ xác nhận tổng tiền chính xác và gửi thông tin chuyển khoản kèm mã đơn <strong>${escapeHtml(order?.code || "")}</strong> cho bạn trong thời gian sớm nhất.</p>
        </td>
      </tr>
    </table>`;
  }

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 0 0;background-color:#fff8fb;border:1px solid #f2d8e3;border-radius:14px;">
    <tr>
      <td style="padding:18px 20px;">
        <div style="font-family:${FONT_SANS};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#b8446d;margin-bottom:12px;">${escapeHtml(heading)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="padding:4px 0;font-size:13px;color:#7a606c;width:130px;">Ngân hàng</td><td style="padding:4px 0;font-size:13.5px;font-weight:600;color:#3a1526;">${escapeHtml(bankName)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#7a606c;">Số tài khoản</td><td style="padding:4px 0;font-size:14px;font-weight:700;font-family:${FONT_MONO};color:#b8446d;">${escapeHtml(accountNumber)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#7a606c;">Chủ tài khoản</td><td style="padding:4px 0;font-size:13.5px;font-weight:600;color:#3a1526;">${escapeHtml(accountName)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#7a606c;">Số tiền</td><td style="padding:4px 0;font-size:14px;font-weight:700;color:#3a1526;">${escapeHtml(formatVnd(amount))}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#7a606c;">Nội dung CK</td><td style="padding:4px 0;font-size:13.5px;font-weight:700;font-family:${FONT_MONO};color:#3a1526;">${escapeHtml(transferNote)}</td></tr>
        </table>
        ${qrUrl ? `<div style="margin-top:14px;text-align:center;">
          <img src="${escapeHtml(qrUrl)}" alt="Mã VietQR thanh toán đơn ${escapeHtml(order?.code || "")}" width="180" style="display:inline-block;width:180px;max-width:100%;height:auto;border-radius:10px;border:1px solid #f0dde5;background:#ffffff;padding:6px;" />
          <div style="margin-top:6px;font-size:11.5px;color:#846b77;">Quét mã VietQR bằng ứng dụng ngân hàng để chuyển khoản nhanh</div>
        </div>` : ""}
      </td>
    </tr>
  </table>`;
}

export function renderOrderEmailHtml({
  subject = "",
  text = "",
  order = {},
  siteOrigin = DEFAULT_ORIGIN,
  bankInfo = null,
  contactEmail = DEFAULT_CONTACT_EMAIL,
  trackingUrl = "",
  trackingEnabled = true,
} = {}) {
  const origin = safeOrigin(siteOrigin);
  const resolvedTrackingUrl = trackingUrl || (order?.code
    ? `${origin}/tra-cuu-don-hang?code=${encodeURIComponent(order.code)}`
    : `${origin}/tra-cuu-don-hang`);
  const items = normalizeOrderItems(order);
  const isPaid = order?.paymentStatus === "paid";
  const paymentBadgeBg = isPaid ? "#eef8f2" : "#fff6ea";
  const paymentBadgeColor = isPaid ? "#1f6e43" : "#9a5a12";
  const paymentBadgeBorder = isPaid ? "#b7e2c7" : "#f3d9b1";
  const paymentBadgeLabel = isPaid ? "Đã thanh toán" : "Chưa thanh toán";
  const subtotalText = order?.subtotal == null ? "ORORA sẽ báo giá" : formatVnd(order.subtotal);
  const shippingText = order?.shippingFee == null ? "ORORA sẽ xác nhận" : formatVnd(order.shippingFee);
  const totalText = order?.totalAmount == null ? "ORORA sẽ xác nhận" : formatVnd(order.totalAmount);
  const paymentMethodLabel = PAYMENT_LABELS[order?.paymentMethod] || order?.paymentMethod || "Thanh toán khi nhận hàng (COD)";
  const customer = order?.customer || {};
  const bodyCopy = formatBodyHtml(text);

  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f3e4eb;font-family:${FONT_SANS};">
        <div style="font-size:14px;font-weight:600;color:#3a1526;line-height:1.4;">${escapeHtml(item.name)}</div>
        ${item.variant && !item.name.includes(item.variant) ? `<div style="margin-top:2px;font-size:12px;color:#846b77;">Phân loại: ${escapeHtml(item.variant)}</div>` : ""}
      </td>
      <td align="center" style="padding:12px 8px;border-bottom:1px solid #f3e4eb;font-family:${FONT_SANS};font-size:13.5px;color:#5e4450;white-space:nowrap;">&times;${escapeHtml(item.quantity)}</td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid #f3e4eb;font-family:${FONT_SANS};font-size:14px;font-weight:600;color:#3a1526;white-space:nowrap;">${escapeHtml(item.priceText)}</td>
    </tr>
  `).join("");

  const bodyHtml = `
    <!-- Order Hero Card -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff8fb;border:1px solid #f2d8e3;border-radius:14px;margin:0 0 22px 0;">
      <tr>
        <td style="padding:20px 22px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td valign="top">
                <div style="font-family:${FONT_SANS};font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#846b77;">Mã đơn hàng</div>
                <div style="margin-top:4px;font-family:${FONT_MONO};font-size:22px;font-weight:700;color:#3a1526;letter-spacing:0.6px;">${escapeHtml(order?.code || "ORORA")}</div>
                <div style="margin-top:4px;font-family:${FONT_SANS};font-size:12.5px;color:#7a606c;">Đặt lúc: ${escapeHtml(formatOrderDate(order))}</div>
              </td>
              <td valign="top" align="right">
                <span style="display:inline-block;padding:5px 12px;border-radius:999px;background-color:${paymentBadgeBg};border:1px solid ${paymentBadgeBorder};font-family:${FONT_SANS};font-size:12px;font-weight:600;color:${paymentBadgeColor};white-space:nowrap;">${paymentBadgeLabel}</span>
              </td>
            </tr>
          </table>
          <!-- 3-Step Order Journey -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;padding-top:14px;border-top:1px dashed #ebd0dc;">
            <tr>
              <td width="33.33%" align="center" style="font-family:${FONT_SANS};font-size:11.5px;font-weight:700;color:#b8446d;">&#10003; 1. Đã tiếp nhận</td>
              <td width="33.33%" align="center" style="font-family:${FONT_SANS};font-size:11.5px;color:#846b77;">2. Xác nhận &amp; đóng gói</td>
              <td width="33.33%" align="center" style="font-family:${FONT_SANS};font-size:11.5px;color:#846b77;">3. Giao hàng tận nơi</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Personalized / Admin Message -->
    ${bodyCopy ? `<div style="margin:0 0 22px 0;">${bodyCopy}</div>` : ""}

    <!-- Itemized Order Summary -->
    <div style="font-family:${FONT_SANS};font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#b8446d;margin:0 0 8px 0;">Chi tiết đơn hàng</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:2px solid #3a1526;margin:0 0 14px 0;">
      <tr>
        <th align="left" style="padding:10px 0;border-bottom:1px solid #f0dde5;font-family:${FONT_SANS};font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#846b77;">Sản phẩm</th>
        <th align="center" style="padding:10px 8px;border-bottom:1px solid #f0dde5;font-family:${FONT_SANS};font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#846b77;">SL</th>
        <th align="right" style="padding:10px 0;border-bottom:1px solid #f0dde5;font-family:${FONT_SANS};font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.6px;color:#846b77;">Thành tiền</th>
      </tr>
      ${itemRows}
    </table>

    <!-- Pricing Breakdown -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px 0;">
      <tr>
        <td style="padding:4px 0;font-family:${FONT_SANS};font-size:13.5px;color:#7a606c;">Tạm tính</td>
        <td align="right" style="padding:4px 0;font-family:${FONT_SANS};font-size:13.5px;color:#3a1526;">${escapeHtml(subtotalText)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-family:${FONT_SANS};font-size:13.5px;color:#7a606c;">Phí giao hàng</td>
        <td align="right" style="padding:4px 0;font-family:${FONT_SANS};font-size:13.5px;color:#3a1526;">${escapeHtml(shippingText)}</td>
      </tr>
      <tr>
        <td style="padding:12px 0 4px 0;border-top:1px solid #f0dde5;font-family:${FONT_SANS};font-size:15px;font-weight:700;color:#3a1526;">Tổng thanh toán</td>
        <td align="right" style="padding:12px 0 4px 0;border-top:1px solid #f0dde5;font-family:${FONT_SANS};font-size:17px;font-weight:700;color:#b8446d;">${escapeHtml(totalText)}</td>
      </tr>
    </table>

    <!-- Recipient & Delivery Details -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fdf9fb;border:1px solid #f0dde5;border-radius:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <div style="font-family:${FONT_SANS};font-size:12px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;color:#b8446d;margin-bottom:10px;">Thông tin giao nhận</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${customer.name ? `<tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;width:130px;">Người nhận</td><td style="padding:4px 0;font-size:13.5px;font-weight:600;color:#3a1526;">${escapeHtml(customer.name)}</td></tr>` : ""}
            ${customer.phone ? `<tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;">Số điện thoại</td><td style="padding:4px 0;font-size:13.5px;color:#3a1526;">${escapeHtml(customer.phone)}</td></tr>` : ""}
            ${customer.email ? `<tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;">Email</td><td style="padding:4px 0;font-size:13.5px;color:#3a1526;">${escapeHtml(customer.email)}</td></tr>` : ""}
            ${customer.address ? `<tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;">Địa chỉ</td><td style="padding:4px 0;font-size:13.5px;line-height:1.55;color:#3a1526;">${escapeHtml(customer.address)}</td></tr>` : ""}
            <tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;">Thanh toán</td><td style="padding:4px 0;font-size:13.5px;color:#3a1526;">${escapeHtml(paymentMethodLabel)}</td></tr>
            ${order?.trackingCode ? `<tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;">Mã vận đơn</td><td style="padding:4px 0;font-size:13.5px;font-weight:700;font-family:${FONT_MONO};color:#b8446d;">${escapeHtml(order.trackingCode)}</td></tr>` : ""}
            ${customer.note ? `<tr><td valign="top" style="padding:4px 0;font-size:13px;color:#7a606c;">Ghi chú</td><td style="padding:4px 0;font-size:13.5px;line-height:1.55;color:#5e4450;">${escapeHtml(customer.note)}</td></tr>` : ""}
          </table>
        </td>
      </tr>
    </table>

    <!-- Bank Transfer & VietQR (if applicable) -->
    ${renderBankTransferBlock(order, bankInfo)}

    <!-- Tracking CTA -->
    ${renderButton(trackingEnabled ? "Tra cứu trạng thái đơn hàng" : "Liên hệ ORORA", resolvedTrackingUrl)}
    <p style="margin:6px 0 0 0;text-align:center;font-family:${FONT_SANS};font-size:12px;color:#846b77;">Nhập 4 số cuối số điện thoại đặt hàng để xem tiến trình chi tiết.</p>
  `;

  return renderEmailShell({
    subject: subject || `ORORA xác nhận đơn hàng ${order?.code || ""}`.trim(),
    preheader: `Đơn hàng ${order?.code || ""} (${totalText}) đã được ORORA tiếp nhận.`,
    eyebrow: "Xác nhận đơn hàng",
    bodyHtml,
    siteOrigin: origin,
    contactEmail,
    footerNote: `Nếu cần thay đổi thông tin hoặc hỗ trợ nhanh, bạn chỉ cần trả lời trực tiếp email này kèm mã đơn <strong>${escapeHtml(order?.code || "")}</strong>.`,
  });
}
