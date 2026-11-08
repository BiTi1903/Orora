import { createHash, timingSafeEqual } from 'node:crypto';
import { normalizeTrackingPhone, ORDER_STATUSES } from '../src/lib/order-tracking.js';
const failure = (status, message) => Object.assign(new Error(message), { status, publicError:true });
const missing = 'Không tìm thấy đơn hàng với thông tin này. Vui lòng kiểm tra mã đơn và số điện thoại đã đặt hàng.';
const timestamp = value => {
  const n = value?.toMillis?.() ?? (value == null ? NaN : new Date(value).getTime());
  return Number.isFinite(n) ? n : null;
};
async function reserveLookup(db, req, phone, time, env) {
  const day = Math.floor(time / 86400000);
  const ip = String(req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0,160);
  const hash = value => createHash('sha256').update(`${env.ORDER_TRACKING_RATE_SALT || env.CHAT_RATE_LIMIT_SALT || 'orora-tracking'}:${day}:${value}`).digest('hex');
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
      const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
      const phone = normalizeTrackingPhone(body.phone);
      if (!/^[A-Z0-9_-]{4,40}$/.test(code) || !phone) throw failure(400,'Vui lòng nhập mã đơn và số điện thoại hợp lệ.');
      const db = getDb();
      await reserveLookup(db,req,phone,now(),env);
      const snapshot = await db.collection('orders').where('code','==',code).limit(5).get();
      const order = snapshot.docs.map(doc => doc.data()).find(order => {
        const stored = normalizeTrackingPhone(order.customer?.phone);
        return stored && stored.length === phone.length && timingSafeEqual(Buffer.from(stored),Buffer.from(phone));
      });
      if (!order) return res.status(404).json({message:missing});
      const amount = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
      return res.status(200).json({ order: {
        code:order.code,status:Object.hasOwn(ORDER_STATUSES,order.status) ? order.status : 'unknown',
        createdAt:timestamp(order.createdAt),updatedAt:timestamp(order.updatedAt || order.createdAt),
        productName:String(order.product?.name || '').slice(0,300),variantLabel:String(order.product?.variantLabel || '').slice(0,150),
        quantity:Number.isInteger(order.quantity) ? order.quantity : null,
        subtotal:amount(order.subtotal),shippingFee:amount(order.shippingFee),totalAmount:amount(order.totalAmount),
        paymentMethod:['cod','bank_transfer'].includes(order.paymentMethod) ? order.paymentMethod : 'unknown',
        paymentStatus:['paid','refunded'].includes(order.paymentStatus) ? order.paymentStatus : 'unpaid',
      }});
    } catch (error) {
      const status = error.publicError === true ? error.status : 503;
      if (status === 429) res.setHeader('Retry-After',String(error.retryAfter || 600));
      return res.status(status).json({message:error.publicError === true ? error.message : 'Chưa thể tra cứu lúc này. Vui lòng thử lại sau hoặc liên hệ ORORA.'});
    }
  };
}
