export function socialShopUrl(value, platform) {
  if (!String(value || "").trim()) return null;
  try {
    const url = new URL(String(value).trim());
    const hosts = platform === "tiktok" ? ["tiktok.com"] : ["facebook.com", "fb.com", "fb.me", "m.me"];
    if (url.protocol !== "https:" || url.username || url.password || url.port || !hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) return null;
    return url.href;
  } catch { return null; }
}
export function parseVndPrice(value) {
  const text = String(value ?? "").trim();
  if (!/^(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(?:₫|đ|vnd)?$/i.test(text)) return null;
  const price = Number(text.replace(/\D/g, ""));
  return Number.isSafeInteger(price) && price >= 0 && price <= 1_000_000_000 ? price : null;
}
const vndNumbers = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
export const formatVnd = (value) => `${vndNumbers.format(value)} đ`;
export function formatProductPrice(value) {
  const amount = parseVndPrice(value);
  return amount === null ? String(value ?? "").trim() : formatVnd(amount);
}
// Display legacy formatted prices as digits in admin without rewriting the saved value.
export function priceInputValue(value) {
  const text = String(value ?? "").trim();
  if (/^\d*$/.test(text)) return text;
  const amount = parseVndPrice(text);
  return amount === null ? "" : String(amount);
}
export function sameVndPrice(left, right) {
  const a = parseVndPrice(left), b = parseVndPrice(right);
  return a !== null && b !== null ? a === b : String(left ?? "").trim() === String(right ?? "").trim();
}
export const PAYMENT_LABELS = { cod: "Thanh toán khi nhận hàng (COD)", bank_transfer: "Chuyển khoản sau khi xác nhận" };
export function availablePaymentMethods(home = {}) {
  const saved = home.shopLinks?.paymentMethods;
  return Array.isArray(saved) ? [...new Set(saved.filter((key) => Object.hasOwn(PAYMENT_LABELS, key)))] : Object.keys(PAYMENT_LABELS);
}

export function facebookFollowUrl(value) {
  const url = socialShopUrl(value, "facebook");
  if (!url) return null;
  const host = new URL(url).hostname;
  return host === "m.me" || host.endsWith(".m.me") ? null : url;
}

// Display compact defaults for the old standard labels without rewriting saved settings.
export function purchaseChannelLabels(settings = {}) {
  const label = (value, fallback, previous = [], custom = false) => {
    const text = typeof value === "string" ? value.trim() : "";
    return !text || (!custom && previous.includes(text)) ? fallback : text;
  };
  return {
    dividerLabel: label(settings.dividerLabel, "hoặc đặt hàng tại"),
    facebookLabel: label(settings.facebookLabel, "Fb", ["Mua qua Facebook", "Đặt tại Facebook"], settings.customFacebookLabel === true || settings.customChannelLabels === true),
    tiktokLabel: label(settings.tiktokLabel, "Tiktok", ["Mua trên TikTok", "Đặt tại TikTok"], settings.customTiktokLabel === true || settings.customChannelLabels === true),
  };
}
