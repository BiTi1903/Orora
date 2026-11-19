import { rateLimitSalt, requestClientIp } from './request-limits.js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { normalizeTrackingPhone, ORDER_STATUSES } from '../src/lib/order-tracking.js';
const failure = (status, message) => Object.assign(new Error(message), { status, publicError:true });
const missing = 'Không tìm thấy đơn hàng với thông tin này. Vui lòng kiểm tra mã đơn hoặc số điện thoại đã đặt hàng.';
const timestamp = value => {
  const n = value?.toMillis?.() ?? (value == null ? NaN : new Date(value).getTime());
  return Number.isFinite(n) ? n : null;
};
async function reserveLookup(db, req, phone, time, env) {
  const day = Math.floor(time / 86400000);
  const ip = requestClientIp(req);
  const salt = env.ORDER_TRACKING_RATE_SALT?.trim() || rateLimitSalt(env) || 'orora-tracking';
  const hash = value => createHmac('sha256', salt).update(`${day}:${value}`).digest('hex');
  const refs = [db.collection('orderLookupLimits').doc(`ip-${day}-${hash(ip)}`),db.collection('orderLookupLimits').doc(`phone-${day}-${hash(phone)}`)];
  await db.runTransaction(async tx => {
    const docs = await tx.getAll(...refs);
    const updates = docs.map((doc,index) => {
      const prior = doc.data() || {};
      const sameWindow = time >= prior.windowStart && time - prior.windowStart < 10 * 60000;
      if (prior.count >= (index === 0 ? 60 : 100)) throw Object.assign(failure(429,'Bạn đã đạt giới hạn tra cứu hôm nay. Vui lòng thử lại ngày mai hoặc liên hệ ORORA.'), { retryAfter:Math.ceil(((day + 1) * 86400000 - time) / 1000) });
      if (sameWindow && prior.windowCount >= (index === 0 ? 10 : 20)) throw failure(429,'Bạn đã tra cứu nhiều lần. Vui lòng thử lại sau khoảng 10 phút hoặc liên hệ ORORA.');
      return { count:(prior.count || 0) + 1,windowStart:sameWindow ? prior.windowStart : time,windowCount:sameWindow ? (prior.windowCount || 0) + 1 : 1,expiresAt:new Date(time + 2 * 86400000) };
    });
    refs.forEach((ref,index) => tx.set(ref,updates[index]));
  });
}
export function createOrderTrackingHandler({ getDb, env = process.env, now = () => Date.now() }) {
  return async (req,res) => {
    res.setHeader('Cache-Control','no-store, private');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    if (req.method !== 'POST') { res.setHeader('Allow','POST'); return res.status(405).json({message:'Chỉ hỗ trợ POST.'}); }
    try {
      if (req.headers.origin !== new URL(env.NEWSLETTER_SITE_ORIGIN || 'https://ororavn.com').origin) throw failure(403,'Vui lòng tra cứu trực tiếp trên website ORORA.');
      if (!String(req.headers['content-type'] || '').startsWith('application/json')) throw failure(415,'Chỉ nhận dữ liệu JSON.');
      if (Number(req.headers['content-length'] || 0) > 2000) throw failure(413,'Nội dung quá dài.');
      let body;
      try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; } catch { throw failure(400,'Thông tin tra cứu không hợp lệ.'); }
      if (!body || Buffer.byteLength(JSON.stringify(body)) > 2000) throw failure(400,'Thông tin tra cứu không hợp lệ.');
      if ((body.code != null && typeof body.code !== 'string') || (body.phone != null && typeof body.phone !== 'string')) throw failure(400,'Thông tin tra cứu không hợp lệ.');
      const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
      const rawPhone = typeof body.phone === 'string' ? body.phone.trim() : '';
      const compactDigits = rawPhone.replace(/[\s().-]/g, '');
      const last4 = code && /^\d{4}$/.test(compactDigits) ? compactDigits : '';
      const phone = last4 ? '' : normalizeTrackingPhone(rawPhone);
      const validCode = value => typeof value === 'string' && /^[A-Z0-9_-]{4,40}$/.test(value);
      if ((!code && !phone) || (code && !validCode(code)) || (rawPhone && !phone && !last4) || (body.cursor && (code || !validCode(body.cursor)))) throw failure(400,'Vui lòng nhập thông tin tra cứu hợp lệ.');
      if (code && !phone && !last4) throw failure(400,'Vui lòng nhập kèm số điện thoại hoặc 4 số cuối số điện thoại đặt hàng.');
      const db = getDb();
      await reserveLookup(db,req,phone || `code:${code}`,now(),env);
      const matchesPhone = order => {
        const stored = normalizeTrackingPhone(order.customer?.phone);
        if (!stored) return false;
        if (phone) return stored.length === phone.length && timingSafeEqual(Buffer.from(stored),Buffer.from(phone));
        if (last4) return stored.length >= 4 && timingSafeEqual(Buffer.from(stored.slice(-4)),Buffer.from(last4));
        return false;
      };
      let documents;
      if (code) {
        const snapshot = await db.collection('orders').where('code','==',code).limit(5).get();
        documents = snapshot.docs.filter(doc => matchesPhone(doc.data())).slice(0,1);
      } else {
        const variants = [phone, `+${phone}`];
        if (phone.startsWith('0') && [10,11].includes(phone.length)) variants.push(`84${phone.slice(1)}`,`+84${phone.slice(1)}`);
        let query = db.collection('orders').where('customer.phone','in',[...new Set(variants)]).orderBy('createdAt','desc').limit(21);
        if (body.cursor) {
          const prior = await db.collection('orders').where('code','==',body.cursor).limit(5).get();
          const cursor = prior.docs.find(doc => matchesPhone(doc.data()));
          if (!cursor) throw failure(400,'Mốc tra cứu không hợp lệ. Vui lòng tra cứu lại.');
          query = query.startAfter(cursor);
        }
        documents = (await query.get()).docs;
      }
      if (!documents.length && !body.cursor) return res.status(404).json({message:missing});
      const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
      const summaryProjection = order => ({
        code:order.code,status:Object.hasOwn(ORDER_STATUSES,order.status) ? order.status : 'unknown',
        createdAt:timestamp(order.createdAt),updatedAt:timestamp(order.updatedAt || order.createdAt),
        quantity:Number.isInteger(order.quantity) ? order.quantity : null,
        totalAmount:amount(order.totalAmount),
        paymentMethod:['cod','bank_transfer'].includes(order.paymentMethod) ? order.paymentMethod : 'unknown',
        paymentStatus:['paid','refunded'].includes(order.paymentStatus) ? order.paymentStatus : 'unpaid',
      });
      const fullProjection = order => ({
        ...summaryProjection(order),
        productName:String(order.product?.name || '').slice(0,300),variantLabel:String(order.product?.variantLabel || '').slice(0,150),
        ...(Array.isArray(order.items) && order.items.length > 1 ? { items: order.items.slice(0, 50).map(item => ({ name: String(item?.name || '').slice(0, 200), variantLabel: String(item?.variantLabel || '').slice(0, 100), quantity: Number.isInteger(item?.quantity) ? item.quantity : 1, unitPrice: amount(item?.unitPrice) })) } : {}),
        subtotal:amount(order.subtotal),shippingFee:amount(order.shippingFee),
      });
      const orders = documents.slice(0,20).map(doc => (code ? fullProjection : summaryProjection)(doc.data()));
      return res.status(200).json({ orders, ...(code && orders[0] ? { order:orders[0] } : {}), nextCursor:!code && documents.length > 20 ? documents[19].data().code : null });
    } catch (error) {
      const status = error.publicError === true ? error.status : 503;
      if (status === 429) res.setHeader('Retry-After',String(error.retryAfter || 600));
      return res.status(status).json({message:error.publicError === true ? error.message : 'Chưa thể tra cứu lúc này. Vui lòng thử lại sau hoặc liên hệ ORORA.'});
    }
  };
}
