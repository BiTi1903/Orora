import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultPurchaseVariant} from '../src/lib/purchase-defaults.js';
import {catalogPriceLabel} from '../src/lib/catalog-filters.js';
import {volumePriceText} from '../src/lib/product-options.js';
test('initial detail choice matches the catalog price without changing saved product or option order',()=>{
 const product={price:'600000',volumeOptions:[{id:'large',label:'220ml',price:'600000'},{id:'small',label:'180ml',price:'450000'}]},before=structuredClone(product);
 const variant=defaultPurchaseVariant(product);assert.equal(variant.id,'small');assert.equal(volumePriceText(product,variant),catalogPriceLabel(product));assert.deepEqual(product,before);
});
test('default display choice handles fallback prices, zero, ties and contact-only products',()=>{
 assert.equal(defaultPurchaseVariant({price:'200000',volumeOptions:[{id:'a',label:'A',price:''},{id:'b',label:'B',price:'0'}]}).id,'b');
 assert.equal(defaultPurchaseVariant({price:'200000',volumeOptions:[{id:'a',label:'A',price:''},{id:'b',label:'B',price:'200000'}]}).id,'a');
 assert.equal(defaultPurchaseVariant({price:'Liên hệ',volumeOptions:[{id:'a',label:'A',price:''},{id:'b',label:'B',price:''}]}).id,'a');
 assert.equal(defaultPurchaseVariant({price:'Liên hệ'}),null);
});
