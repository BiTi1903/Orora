// Derive links from existing saved contact information; never write configuration.
export function contactLinks(home = {}, productName = "") {
  const rawPhone = String(home.footerPhone || "").trim();
  const phone = /^[+\d\s().-]+$/.test(rawPhone) ? rawPhone.replace(/[^\d+]/g, "") : "";
  const validPhone = /^\+?\d{7,15}$/.test(phone);
  const email = String(home.footerEmail || "").trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return {
    phone: validPhone ? `tel:${phone}` : null,
    zalo: validPhone ? `https://zalo.me/${phone.replace(/^\+/, "")}` : null,
    email: validEmail ? `mailto:${email}?subject=${encodeURIComponent(productName ? `Tư vấn về ${productName}` : "Liên hệ ORORA")}` : null,
  };
}
