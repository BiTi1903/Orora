import test from 'node:test';import assert from 'node:assert/strict';
import {catalogFilters,filterCatalog,catalogPriceLabel,catalogVolumes,readCatalogFilters,writeCatalogFilters} from '../src/lib/catalog-filters.js';
const products=[{id:'1',publicId:'1',name:'Dưỡng sáng',categoryId:'care',price:'999000',volumeOptions:[{id:'a',label:'100 ml',price:'100000'},{id:'b',label:'200ml',price:'500000'}]},{id:'2',publicId:'2',name:'Làm sạch',categoryId:'clean',price:'250000',volumeOptions:[{id:'c',label:'100ml',price:''}]},{id:'3',publicId:'3',name:'Bộ chăm sóc',categoryId:'care',price:'Liên hệ'},{id:'4',publicId:'4',name:'Quà tặng',categoryId:'care',price:'0'}];
test('catalog filters Vietnamese names, identity, categories and normalized admin-entered volumes',()=>{
 assert.deepEqual(filterCatalog(products,{q:'duong sang'}).map(p=>p.id),['1']);assert.deepEqual(filterCatalog(products,{q:'3'}).map(p=>p.id),['3']);
 assert.deepEqual(filterCatalog(products,{category:'care',volume:'100ml'}).map(p=>p.id),['1']);
 assert.deepEqual(catalogVolumes(products).map(o=>o.value),['100ml','200ml']);
});
test('price filtering uses actual variants, never the gap between their prices or a quote as zero',()=>{
 assert.deepEqual(filterCatalog(products,{min:'200000',max:'400000'}).map(p=>p.id),['2']);
 assert.deepEqual(filterCatalog(products,{min:'0',max:'0'}).map(p=>p.id),['4']);
 assert.deepEqual(filterCatalog(products,{price:'contact'}).map(p=>p.id),['3']);
 assert.deepEqual(filterCatalog(products,{sort:'priceDesc'}).map(p=>p.id),['2','1','4','3']);
 assert.deepEqual(filterCatalog(products,{sort:'priceAsc'}).map(p=>p.id),['4','1','2','3']);
 assert.match(catalogPriceLabel(products[0]),/^Từ 100\.000 đ$/);assert.equal(catalogPriceLabel(products[1]),'250000');
 assert.equal(catalogPriceLabel(products[3]),'0');
});
test('filter links are shareable, bounded, preserve unrelated parameters and never mutate product data',()=>{
 const before=JSON.stringify(products);filterCatalog(products,{sort:'newest'});assert.equal(JSON.stringify(products),before);
 const query=writeCatalogFilters('?utm_source=mobile&category=old',{category:'care',q:'dịu nhẹ',min:'100000',sort:'priceAsc',view:'grid',page:2});
 assert.equal(new URLSearchParams(query).get('utm_source'),'mobile');assert.equal(readCatalogFilters(query).q,'dịu nhẹ');assert.equal(readCatalogFilters(query).page,2);
 assert.equal(catalogFilters({min:'bad',page:-1,sort:'bad'}).min,'');assert.equal(catalogFilters({page:-1}).page,1);assert.equal(catalogFilters({price:'contact',min:'100000'}).min,'');
 assert.equal(new URLSearchParams(writeCatalogFilters(query,catalogFilters())).get('category'),null);
});
