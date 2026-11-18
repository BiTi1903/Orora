export function createStorefrontStockHandler({ getDb }) {
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
      const db = await getDb();
      const products = await db.getAll(...ids.map(id => db.collection('products').doc(id)));
      const visible = products.filter(doc => doc.exists && doc.data().active !== false);
      const stock = visible.length ? await db.getAll(...visible.map(doc => db.collection('inventory').doc(doc.id))) : [];
      const availability = Object.fromEntries(stock.flatMap(doc => {
        const quantity = doc.data()?.quantity;
        if (!Number.isSafeInteger(quantity) || quantity < 0) return [];
        return [[doc.id, quantity === 0 ? 'out' : quantity <= 5 ? 'low' : 'available']];
      }));
      res.setHeader('Cache-Control', 'public, max-age=15, s-maxage=30');
      return res.status(200).json({ availability });
    } catch {
      return res.status(503).json({ message: 'Chưa kiểm tra được tồn kho.' });
    }
  };
}
