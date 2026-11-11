import {responsiveImage,heroImageSources} from '../src/lib/image-cdn.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHomeStore} from '../src/lib/home-store.js';
import {publicHomeShell} from '../src/lib/home-shell.js';
import {contentFonts} from '../src/lib/font-loading.js';
import {createStorefrontShellHandler} from '../server/storefront-shell.js';
import {memoryDb,response} from './firestore-memory.js';
test('early home response contains only public first-screen fields and mobile-sized image fallback',async()=>{
 const home={heroTitle:'ORORA',heroImage:'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1920/v1/hero.jpg',shopLinks:{facebookUrl:'https://fb.com/store'},shippingSettings:{enabled:true},chatSettings:{knowledge:'Not part of first screen'},footerEmail:'store@example.com'};
 const shell=publicHomeShell(home);assert.equal(shell.content.heroTitle,'ORORA');assert.equal(shell.content.shippingSettings,undefined);assert.equal(shell.content.chatSettings,undefined);assert.match(shell.images.mobile,/w_900/);assert.match(shell.images.desktop,/w_1920/);
 assert.equal(publicHomeShell({...home,sectionVisibility:{hero:false}}).images.mobile,null);
 const db=memoryDb();await db.collection('settings').doc('home').set(home);const res=response();await createStorefrontShellHandler({getDb:()=>db})({method:'GET'},res);assert.equal(res.statusCode,200);assert.equal(res.body.content.heroTitle,'ORORA');assert.ok(!JSON.stringify(res.body).includes('Not part of first screen'));
 const failed=response();await createStorefrontShellHandler({getDb:()=>{throw Error('private_key=secret');}})({method:'GET'},failed);assert.equal(failed.statusCode,503);assert.equal(failed.headers['Cache-Control'],'no-store');assert.ok(!JSON.stringify(failed.body).includes('secret'));
});
test('all home consumers share one live listener and early content never overwrites fresh settings',async()=>{
 let next,stopped=0,starts=0,resolve;const bootstrap=new Promise(done=>resolve=done);
 const store=createHomeStore({listen:callback=>{next=callback;starts++;return()=>stopped++;},bootstrap:()=>bootstrap});
 const stopA=store.subscribe(()=>{}),stopB=store.subscribe(()=>{});assert.equal(starts,1);resolve({heroTitle:'Early',shippingSettings:undefined});await Promise.resolve();assert.equal(store.getSnapshot().shellReady,true);assert.equal(store.getSnapshot().loading,true);
 next({heroTitle:'Fresh',shippingSettings:{enabled:true}});assert.equal(store.getSnapshot().loading,false);assert.equal(store.getSnapshot().heroTitle,'Fresh');stopA();assert.equal(stopped,0);stopB();assert.equal(stopped,1);
 const stopC=store.subscribe(()=>{});await Promise.resolve();assert.equal(store.getSnapshot().heroTitle,'Fresh');stopC();
});
test('late shell cannot replace a live snapshot and font loading only requests configured families',async()=>{
 let resolve,next;const store=createHomeStore({listen:callback=>{next=callback;return()=>{};},bootstrap:()=>new Promise(done=>resolve=done)});const stop=store.subscribe(()=>{});next({heroTitle:'Fresh'});resolve({heroTitle:'Old'});await Promise.resolve();assert.equal(store.getSnapshot().heroTitle,'Fresh');stop();
 assert.deepEqual(contentFonts({heroStyles:{title:{fontFamily:'"Jost", sans-serif'}},chatSettings:{fontFamily:'"Lora", serif'},body:{fontFamily:'"Lora", serif'},text:'Poppins'}),['Lora']);
});

test('responsive delivery preserves original external URLs and matches hero preload candidates',()=>{
 const src='https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_2000/v1/photo.jpg';
 const image=responsiveImage(src,{widths:[480,800],width:800});
 assert.match(image.src,/w_800/);assert.match(image.srcSet,/w_480.* 480w, .*w_800.* 800w/);
 assert.deepEqual(responsiveImage('/photo.jpg'),{src:'/photo.jpg'});
 const hero=heroImageSources({heroImage:src});assert.match(hero.mobileSrcSet,/w_800/);assert.match(hero.desktopSrcSet,/w_1440/);
 assert.ok(!hero.mobileSrcSet.includes('w_2000'));
});
