// Translate stock labels only. Empty fields and custom copy stay unchanged.
export const FOOTER_LABELS = {
  footerInfoTitle: 'Thông tin',
  footerAboutText: 'Về ORORA',
  footerShopText: 'Sản phẩm',
  footerTermsText: 'Điều khoản sử dụng',
  footerPrivacyText: 'Chính sách bảo mật',
  footerContactTitle: 'Liên hệ',
  footerSocialTitle: 'Kết nối với ORORA',
};
const legacy = {
  footerInfoTitle: 'information',
  footerAboutText: 'about us',
  footerShopText: 'shop',
  footerTermsText: 'terms & conditions',
  footerPrivacyText: 'privacy policy',
  footerContactTitle: 'contact',
  footerSocialTitle: 'follow us',
};
export function footerCopy(data = {}) {
  const result = {...data};
  for (const [key, fallback] of Object.entries(FOOTER_LABELS)) {
    const value = data[key];
    if (value == null || typeof value === 'string' && value.trim().toLowerCase() === legacy[key]) {
      result[key] = fallback;
    }
  }
  const copyright = data.footerCopyright;
  if (typeof copyright === 'string' && /^© \d{4} ORORA\. All rights reserved\.$/.test(copyright)) {
    result.footerCopyright = copyright.replace('All rights reserved.', 'Bảo lưu mọi quyền.');
  }
  return result;
}
