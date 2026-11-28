import test from 'node:test';
import assert from 'node:assert/strict';
import {mobileNavItems,mobileNavSettings} from '../src/lib/mobile-shop-nav.js';
test('mobile links preserve old defaults and allow ordered custom targets safely',()=>{
 assert.deepEqual(mobileNavItems(mobileNavSettings()).map(x=>x.to),['/','/#about','/#shop','/tra-cuu-don-hang']);
 const items=mobileNavItems({items:[{target:'email',icon:'heart',label:'Ưu đãi'},{target:'footer'},{target:'custom',url:'https://example.com/path'},{target:'custom',url:'javascript:alert(1)'},{target:'custom',url:'//evil.com'},{target:'home',enabled:false}]});
 assert.deepEqual(items.map(x=>x.to),['/#newsletter','/#contact','https://example.com/path']);assert.equal(items[0].icon,'heart');assert.equal(items[0].label,'Ưu đãi');
 assert.deepEqual(mobileNavItems({items:[]}),[]);
});

test('the bottom bar stays hidden until enabled in the builder',()=>{
 for(const old of [undefined,{}, {enabled:true},{enabled:false}] ){
  assert.equal(mobileNavSettings(old).enabled,false);
 }
 assert.equal(mobileNavSettings({showBottomBar:true}).enabled,true);
});
