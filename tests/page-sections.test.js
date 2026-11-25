import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PAGE_SECTIONS, sectionIsEnabled } from '../src/lib/page-sections.js';
import { editedSectionPayload, changedValues, mergeSavedValues } from '../src/admin/builder/save-sections.js';
import { careGuideForProduct } from '../src/lib/product-care-guide.js';

test('every public page section has a registered Visual Builder visibility control', () => {
  const keys = PAGE_SECTIONS.map(section => section.key);
  assert.equal(new Set(keys).size, keys.length);
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
  for (const match of app.matchAll(/visible\("([a-z]+)"\)/g)) assert.ok(keys.includes(match[1]), `Missing Visual Builder toggle: ${match[1]}`);
  assert.ok(keys.includes('productneeds'));
  assert.ok(keys.includes('productfaq'));
  assert.ok(keys.includes('productcare'));
});

test('new sections use their existing enabled setting while older blocks keep sectionVisibility', () => {
  const settings = { productNeeds:{enabled:false}, productFaq:{enabled:true}, productCareGuide:{enabled:false}, sectionVisibility:{collection:false} };
  assert.equal(sectionIsEnabled(settings,'productneeds'),false);
  assert.equal(sectionIsEnabled(settings,'productfaq'),true);
  assert.equal(sectionIsEnabled(settings,'productcare'),false);
  assert.equal(sectionIsEnabled(settings,'collection'),false);
  assert.equal(sectionIsEnabled({},'productneeds'),true);
  assert.equal(sectionIsEnabled({},'productcare'),true);
});

test('careGuideForProduct respects global enabled toggle from Visual Builder', () => {
  const settings = { enabled: false, groups: [{ id: 'g1', productIds: ['p1'], guide: { enabled: true, title: 'T' } }] };
  assert.deepEqual(careGuideForProduct(settings, { id: 'p1' }), { enabled: false });
  assert.equal(careGuideForProduct({ ...settings, enabled: true }, { id: 'p1' }).title, 'T');
});

test('builder switches save only the enabled leaf and keep product mappings and content intact', () => {
  const baseline = { productNeeds:{enabled:true,items:[{id:'n',productIds:['a']}],title:'Giữ tiêu đề'}, productFaq:{enabled:true,items:[{id:'q',productIds:['b']}]}, productCareGuide:{enabled:true,groups:[{id:'c',productIds:['a'],guide:{enabled:true,title:'Chăm sóc'}}]}, sectionVisibility:{footer:false} };
  const after = structuredClone(baseline);
  after.productNeeds.enabled = false;
  after.productFaq.enabled = false;
  after.productCareGuide.enabled = false;
  const patch = changedValues(baseline,editedSectionPayload(after,['productneeds','productfaq','productcare']));
  assert.deepEqual(patch,{productNeeds:{enabled:false},productFaq:{enabled:false},productCareGuide:{enabled:false}});
  assert.deepEqual(mergeSavedValues(baseline,patch),after);
});
