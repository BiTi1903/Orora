export function withTrackingNavLink(links = []) {
  if (links.some(item => item.kind === 'order-tracking' || String(item.href || '').replace(/\/$/,'') === '/tra-cuu-don-hang')) return links;
  return [...links,{label:'Tra cứu đơn hàng',href:'/tra-cuu-don-hang',kind:'order-tracking'}];
}
