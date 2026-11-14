import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createStorefrontHandler} from '../server/storefront.js';
import {memoryDb,response} from './firestore-memory.js';
const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));
const reply=()=>{const res=response();res.end=res.send;return res;};

test('deployment stays within the Hobby function limit and preserves all public API URLs',()=>{
 const files=readdirSync(new URL('../api',import.meta.url),{recursive:true}).filter(name=>/\.(?:js|mjs|cjs|ts)$/.test(name));
 assert.equal(files.length,11);
 assert.ok(files.length<=12,'Vercel Hobby allows at most 12 functions');
 const routes={'/api/storefront-shell':'shell','/api/share-image':'share-image','/api/sitemap':'sitemap','/sitemap.xml':'sitemap'};
 for(const [source,resource] of Object.entries(routes))assert.equal(config.rewrites.find(rule=>rule.source===source)?.destination,`/api/storefront/${resource}`);
 for(const file of ['sitemap.js','share-image.js','storefront-shell.js'])assert.ok(!files.includes(file),'old entries must not deploy as additional functions');
 assert.ok(files.includes('storefront/[resource].js'));
});

test('merged public function keeps shell JSON, hero redirect and sitemap XML separate',async()=>{
 const db=memoryDb();await db.collection('settings').doc('home').set({heroTitle:'ORORA',heroImage:'/hero-current.jpg',privateField:'never-public'});await db.collection('products').doc('gel').set({name:'White Gel',active:true});
 const handler=createStorefrontHandler({getDb:()=>db});
 const shell=reply();await handler({method:'GET',query:{resource:'shell'}},shell);assert.equal(shell.statusCode,200);assert.equal(shell.body.content.heroTitle,'ORORA');assert.ok(!JSON.stringify(shell.body).includes('never-public'));assert.match(shell.headers['Content-Type'],/application\/json/);
 const image=reply();await handler({method:'GET',query:{resource:'share-image',v:'hero-1'}},image);assert.equal(image.statusCode,302);assert.equal(image.headers.Location,'https://ororavn.com/hero-current.jpg');
 const sitemap=reply();await handler({method:'GET',query:{resource:'sitemap'}},sitemap);assert.equal(sitemap.statusCode,200);assert.match(sitemap.headers['Content-Type'],/application\/xml/);assert.match(sitemap.body,/white-gel/);
 for(const resource of ['shell','share-image','sitemap']){const res=reply();await handler({method:'POST',query:{resource}},res);assert.equal(res.statusCode,405);assert.equal(res.headers.Allow,'GET, HEAD');}
});

test('merged function rejects unknown routes before reading the database and supports HEAD',async()=>{
 let reads=0;const db=memoryDb(),handler=createStorefrontHandler({getDb:()=>{reads++;return db;}});
 for(const resource of [undefined,'orders','constructor','__proto__',['sitemap','shell']]){const res=reply();await handler({method:'GET',query:{resource}},res);assert.equal(res.statusCode,404);}
 assert.equal(reads,0);
 for(const resource of ['shell','share-image','sitemap']){const res=reply();await handler({method:'HEAD',query:{resource}},res);assert.ok([200,302].includes(res.statusCode));assert.ok(!res.body);}
});
