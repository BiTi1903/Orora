import { getLocale, translatePhrase } from './i18n.js';
export function withTrackingNavLink(links = []) {
  if (links.some(item => item.kind === 'order-tracking' || String(item.href || '').replace(/\/$/,'') === '/tra-cuu-don-hang')) return links;
  const isAdmin = typeof window !== 'undefined' && window.location?.pathname?.startsWith('/admin');
  const label = (!isAdmin && getLocale() !== 'vi') ? translatePhrase('Tra cứu đơn hàng') : 'Tra cứu đơn hàng';
  return [...links,{label,href:'/tra-cuu-don-hang',kind:'order-tracking'}];
}
