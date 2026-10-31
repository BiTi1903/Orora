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
export const formatVnd = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
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
