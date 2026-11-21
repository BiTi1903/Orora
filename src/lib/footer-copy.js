// Apply Vietnamese defaults only when a field is unset (null/undefined).
// Explicit admin values (including English labels like "Information" or "Contact", or empty string) stay unchanged.
export const FOOTER_LABELS = {
  footerInfoTitle: 'Thông tin',
  footerAboutText: 'Về ORORA',
  footerShopText: 'Sản phẩm',
  footerTermsText: 'Điều khoản sử dụng',
  footerPrivacyText: 'Chính sách bảo mật',
  footerContactTitle: 'Liên hệ',
  footerSocialTitle: 'Kết nối với ORORA',
};

export function footerCopy(data = {}) {
  const result = { ...data };
  for (const [key, fallback] of Object.entries(FOOTER_LABELS)) {
    if (data[key] == null) {
      result[key] = fallback;
    }
  }
  return result;
}
