import test from 'node:test';
import assert from 'node:assert/strict';
import { productsForNeed, faqForProduct } from '../src/lib/product-discovery.js';

test('need suggestions include only explicitly assigned visible products, independent of slug or order', () => {
  const products = [{ id: 'a', active: false }, { id: 'b', canonicalSlug: 'changed', number: 99 }, { id: 'c' }];
  assert.deepEqual(productsForNeed({ productIds: ['a','b','deleted','b'] }, products), [products[1]]);
  assert.deepEqual(productsForNeed({ productIds: [] }, products), []);
  assert.deepEqual(productsForNeed(undefined, products), []);
});
test('FAQ filters unassigned, incomplete and disabled questions and respects global visibility', () => {
  const a = { id:'q1', title:'Cách dùng?',text:'Đọc hướng dẫn.',productIds:['a','b'] };
  const settings = { items:[a,{ title:'Thiếu trả lời',productIds:['a'] },{ title:'Ẩn',text:'Nội dung',productIds:['a'],enabled:false },{ title:'Riêng',text:'Sản phẩm khác',productIds:['c'] }] };
  assert.deepEqual(faqForProduct(settings,{id:'a',number:22}),[a]);
  assert.deepEqual(faqForProduct(settings,{id:'b'}),[a]);
  assert.deepEqual(faqForProduct(settings,{id:'unknown'}),[]);
  assert.deepEqual(faqForProduct(settings,{}),[]);
  assert.deepEqual(faqForProduct({...settings,enabled:false},{id:'a'}),[]);
});
