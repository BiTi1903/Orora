export function analyticsDay(value) {
  return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
}
export function analyticsWindow(now, count) {
  const end = new Date(`${analyticsDay(now)}T00:00:00+07:00`).getTime()+86400000;
  const start = end-count*86400000;
  return { start,end,days:Array.from({length:count},(_,i)=>analyticsDay(start+i*86400000)) };
}
export function paidOrderSummary(orders, days) {
  const byDay = new Map(days.map(day=>[day,{paidAmount:0,paidOrders:0,unpricedPaid:0}]));
  for(const order of orders){
    if(order.paymentStatus!=='paid'||order.status==='cancelled')continue;
    const time=order.createdAt?.toMillis?.()??new Date(order.createdAt).getTime();
    if(!Number.isFinite(time))continue;
    const entry=byDay.get(analyticsDay(time));if(!entry)continue;
    entry.paidOrders++;
    if(Number.isSafeInteger(order.totalAmount)&&order.totalAmount>=0)entry.paidAmount+=order.totalAmount;
    else entry.unpricedPaid++;
  }
  return byDay;
}
export function analyticsPath(value) {
  if(typeof value!=='string'||value.length>200)return null;
  if(['/','/tra-cuu-don-hang','/san-pham','/ve-orora','/lien-he'].includes(value))return value;
  if(!value.startsWith('/product/'))return null;
  try{const slug=decodeURIComponent(value.slice(9));return /^[a-z0-9_-]{1,180}$/i.test(slug)?`/product/${slug}`:null;}catch{return null;}
}

export function validAnalyticsReport(value, days) {
  const count = n => Number.isSafeInteger(n) && n >= 0;
  return Array.isArray(value?.series) && value.series.length === days
    && value.series.every(day => day && typeof day.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.day)
      && ['pageViews','visitors','productClicks'].every(key => day[key] === null || count(day[key]))
      && ['paidAmount','paidOrders','unpricedPaid'].every(key => count(day[key])))
    && new Set(value.series.map(day=>day.day)).size === days
    && Array.isArray(value.products) && value.products.every(product => product && typeof product.name === 'string' && typeof product.path === 'string' && count(product.clicks) && count(product.views))
    && (value.recordedSince === null || typeof value.recordedSince === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.recordedSince))
    && Number.isFinite(value.updatedAt);
}
