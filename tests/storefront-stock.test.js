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
  const handler = createStorefrontStockHandler({ getDb: () => db, env: { CHAT_RATE_LIMIT_SALT: "test-salt" } });
  const res = response();
  await handler({ method: 'GET', query: { ids: 'empty,low,ready,draft,uncounted,missing,low' } }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { availability: { empty: 'out', low: 'low', ready: 'available' } });
  const invalid = response();
  await handler({ method: 'GET', query: { ids: '../private' } }, invalid);
  assert.equal(invalid.statusCode, 400);
});

test('stock quota covers different ID combinations before inventory reads', async () => {
  const db = memoryDb();
  let reads = 0;
  db.getAll = (...refs) => { reads++; return Promise.all(refs.map(ref => ref.get())); };
  let now = 1000;
  const handler = createStorefrontStockHandler({ getDb: () => db, env: { CHAT_RATE_LIMIT_SALT: "test-salt" }, clock: () => now });
  for (let i = 0; i < 7; i++) {
    const res = response();
    await handler({ method: 'GET', query: { ids: Array.from({ length: 48 }, (_, index) => `${i}-${index}`).join(',') } }, res);
    assert.equal(res.statusCode, i < 6 ? 200 : 429);
    if (i === 6) assert.equal(res.headers['Retry-After'], '59');
  }
  assert.equal(reads, 6);
  now += 60000;
  const res = response();
  await handler({ method: 'GET', query: { ids: 'new' } }, res);
  assert.equal(res.statusCode, 200);
});

test('stock never uses a public salt when server secrets are missing', async () => {
  const handler = createStorefrontStockHandler({ env: {}, getDb: () => assert.fail('No reads expected') });
  const res = response();
  await handler({ method: 'GET', query: { ids: 'sample' } }, res);
  assert.equal(res.statusCode, 503);
});
