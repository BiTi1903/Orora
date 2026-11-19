import { LOW_STOCK_THRESHOLD } from '../src/lib/stock.js';
import { reserveRequestBudget } from './request-limits.js';

export function createStorefrontStockHandler({ getDb, clock = Date.now, env = process.env }) {
  return async (req, res) => {
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET');
      return res.status(405).json({});
    }
    const ids = typeof req.query?.ids === 'string' ? [...new Set(req.query.ids.split(','))] : [];
    if (!ids.length || ids.length > 48 || ids.some(id => !/^[a-z0-9_-]{1,150}$/i.test(id))) {
      return res.status(400).json({});
    }
    try {
      const salt = env.CHAT_RATE_LIMIT_SALT?.trim() || env.FIREBASE_SERVICE_ACCOUNT_JSON;
      if (!salt) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(503).json({ message: 'Chưa cấu hình kiểm tra tồn kho.' });
      }
      const db = await getDb();
      const retryAfter = await reserveRequestBudget(db, req, {
        scope: 'storefront-stock', cost: 1 + ids.length * 2, budget: 600,
        now: clock(), salt,
      });
      if (retryAfter) {
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('Retry-After', String(retryAfter));
        return res.status(429).json({ message: 'Bạn đang kiểm tra tồn kho quá nhanh. Vui lòng thử lại sau.' });
      }
      const products = await db.getAll(...ids.map(id => db.collection('products').doc(id)));
      const visible = products.filter(doc => doc.exists && doc.data().active !== false);
      const stock = visible.length ? await db.getAll(...visible.map(doc => db.collection('inventory').doc(doc.id))) : [];
      const availability = Object.fromEntries(stock.flatMap(doc => {
        const data = doc.data();
        const quantity = data?.quantity;
        if (!Number.isSafeInteger(quantity) || quantity < 0) return [];
        const reserved = Number.isSafeInteger(data?.reserved) && data.reserved > 0 ? data.reserved : 0;
        const available = Math.max(0, quantity - reserved);
        return [[doc.id, available === 0 ? 'out' : available <= LOW_STOCK_THRESHOLD ? 'low' : 'available']];
      }));
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
      return res.status(200).json({ availability });
    } catch {
      return res.status(503).json({ message: 'Chưa kiểm tra được tồn kho.' });
    }
  };
}
