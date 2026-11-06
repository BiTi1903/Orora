import test from 'node:test';
import assert from 'node:assert/strict';
import { careGuideForProduct, DEFAULT_CARE_GUIDE } from '../src/lib/product-care-guide.js';

test('care guides isolate products, use stable IDs and do not leak a global fallback', () => {
  const a = { enabled: true, title: 'Làm sạch' };
  const b = { enabled: false, title: 'Dưỡng sáng' };
  const settings = { title: 'Nội dung chung cũ', groups: [
    { productIds: ['db-a', 'db-c'], guide: a },
    { productIds: ['db-b'], guide: b },
    { productIds: [], guide: { title: 'Bản nháp' } },
  ] };
  assert.equal(careGuideForProduct(settings, { id: 'db-a', number: 99, slug: 'doi-ten' }), a);
  assert.equal(careGuideForProduct(settings, { id: 'db-c' }), a);
  assert.equal(careGuideForProduct(settings, { id: 'db-b' }), b);
  assert.deepEqual(careGuideForProduct(settings, { id: 'unknown' }), { enabled: false });
  assert.deepEqual(careGuideForProduct(settings, { number: 1 }), { enabled: false });
  assert.deepEqual(careGuideForProduct({ ...settings, groups: [] }, { id: 'db-a' }), { enabled: false });
});

test('existing shared guide is preserved until the admin saves product assignments', () => {
  const old = { enabled: false, title: 'Đã chỉnh', items: [] };
  assert.equal(careGuideForProduct(old, { id: 'db-a' }), old);
  assert.equal(careGuideForProduct(undefined, { id: 'db-a' }), DEFAULT_CARE_GUIDE);
});
