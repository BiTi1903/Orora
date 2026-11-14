import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {heroShareImage,SHARE_IMAGE_PATH} from '../src/lib/share-image.js';
import {pageSeo,SITE_URL} from '../src/lib/seo.js';
import {createShareImageHandler} from '../server/share-image.js';
import {memoryDb,response} from './firestore-memory.js';
const reply=()=>{const res=response();res.end=res.send;return res;};

test('non-JavaScript link crawlers discover the hero endpoint from both static image tags',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/property="og:image"\s+content="https:\/\/ororavn.com\/api\/share-image\?v=hero-1"/);
 assert.match(html,/name="twitter:image"\s+content="https:\/\/ororavn.com\/api\/share-image\?v=hero-1"/);
 assert.ok(!html.includes('/og-image.jpg'));
 const robots=readFileSync(new URL('../public/robots.txt',import.meta.url),'utf8');
 assert.match(robots,/Allow: \/api\/share-image/);
 assert.equal(pageSeo('/').image,SITE_URL+SHARE_IMAGE_PATH);
 assert.equal(pageSeo('/',{heroImage:'/new-hero.jpg'}).image,SITE_URL+'/new-hero.jpg');
 assert.equal(pageSeo('/product/gel',{},[{id:'gel',name:'Gel',image:'/gel.jpg'}]).image,SITE_URL+'/gel.jpg');
});

test('share images prefer the saved desktop hero, retain its artwork, and use mobile/local fallbacks safely',()=>{
 const src='https://res.cloudinary.com/shop/image/upload/v2/hero.jpg';
 assert.equal(heroShareImage({heroImage:src,heroImageMobile:'/mobile.jpg'}),'https://res.cloudinary.com/shop/image/upload/f_jpg,q_auto:good,c_limit,w_1200/v2/hero.jpg');
 assert.equal(heroShareImage({heroImage:'javascript:alert(1)',heroImageMobile:'/mobile.jpg'}),SITE_URL+'/mobile.jpg');
 assert.equal(heroShareImage({heroImage:'https://user:password@example.com/private.jpg'}),SITE_URL+'/hero.jpg');
 assert.equal(heroShareImage(),SITE_URL+'/hero.jpg');
});

test('GET and HEAD redirect to the current admin hero without altering stored content',async()=>{
 const db=memoryDb(),home=db.collection('settings').doc('home');
 await home.set({heroImage:'/first-hero.jpg',heroTitle:'Giữ nguyên'});
 const handler=createShareImageHandler({getDb:()=>db});
 for(const method of ['GET','HEAD']){const res=reply();await handler({method},res);assert.equal(res.statusCode,302);assert.equal(res.headers.Location,SITE_URL+'/first-hero.jpg');assert.match(res.headers['Cache-Control'],/s-maxage=60/);}
 await home.set({heroImage:'/next-hero.jpg'},{merge:true});
 const res=reply();await handler({method:'GET'},res);assert.equal(res.headers.Location,SITE_URL+'/next-hero.jpg');
 assert.equal((await home.get()).data().heroTitle,'Giữ nguyên');
});

test('share image method and database failures are retryable and do not disclose diagnostics',async()=>{
 const handler=createShareImageHandler({getDb:()=>{throw Error('private credentials');}});
 const post=reply();await handler({method:'POST'},post);assert.equal(post.statusCode,405);
 const res=reply();await handler({method:'GET'},res);assert.equal(res.statusCode,503);assert.equal(res.headers.Location,undefined);assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(res.body,undefined);
});
