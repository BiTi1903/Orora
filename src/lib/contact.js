// Derive links from existing saved contact information; never write configuration.
export function contactLinks(home = {}, productName = "", options = {}) {
  const rawPhone = String(options.phone?.trim() || home.footerPhone || "").trim();
  const phone = /^[+\d\s().-]+$/.test(rawPhone) ? rawPhone.replace(/[^\d+]/g, "") : "";
  const validPhone = /^\+?\d{7,15}$/.test(phone);
  const email = String(home.footerEmail || "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  let customZalo = null;
  if (options.zaloUrl?.trim()) {
    try {
      const url = new URL(options.zaloUrl.trim());
      if (url.protocol === "https:" && url.hostname === "zalo.me" && !url.port && !url.username && !url.password) customZalo = url.href;
    } catch { /* Invalid links are not made clickable. */ }
  }
  return {
    phone: validPhone ? `tel:${phone}` : null,
    zalo: options.zaloUrl?.trim() ? customZalo : validPhone ? `https://zalo.me/${phone.replace(/^\+/, "")}` : null,
    email: validEmail ? `mailto:${email}?subject=${encodeURIComponent(productName ? `Tư vấn về ${productName}` : "Liên hệ ORORA")}` : null,
  };
}
