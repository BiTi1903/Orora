import test from 'node:test';
import assert from 'node:assert/strict';
import { createStorefrontStockHandler } from '../server/storefront-stock.js';
import { memoryDb, response } from './firestore-memory.js';

test('storefront stock exposes only availability for active products with counted stock', async () => {
  const db = memoryDb();
  db.getAll = (...refs) => Promise.all(refs.map(ref => ref.get()));
  for (const [id, quantity, active] of [['empty', 0, true], ['low', 5, true], ['ready', 6, true], ['draft', 1, false], ['uncounted', null, true]]) {
    await db.collection('products').doc(id).set({ active });
    await db.collection('inventory').doc(id).set({ quantity, updatedBy: 'internal-account' });
  }
  const handler = createStorefrontStockHandler({ getDb: () => db });
  const res = response();
  await handler({ method: 'GET', query: { ids: 'empty,low,ready,draft,uncounted,missing,low' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { availability: { empty: 'out', low: 'low', ready: 'available' } });
  const invalid = response();
  await handler({ method: 'GET', query: { ids: '../private' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});
