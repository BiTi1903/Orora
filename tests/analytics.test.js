import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createAnalyticsHandler } from '../server/analytics.js';
import { analyticsDay,analyticsWindow,paidOrderSummary,analyticsPath,validAnalyticsReport } from '../src/lib/analytics.js';
import { memoryDb,response } from './firestore-memory.js';
const time=Date.parse('2026-11-09T03:00:00Z'),env={NEWSLETTER_SITE_ORIGIN:'https://orora.example',ORDER_ADMIN_UIDS:'owner'};
const headers={origin:env.NEWSLETTER_SITE_ORIGIN,'content-type':'application/json','x-forwarded-for':'192.0.2.1','user-agent':'Mozilla/5.0'};
const event=(visitorId=randomUUID(),path='/',type='page_view')=>({visitorId,eventId:randomUUID(),path,type});
function setup(user={uid:'owner'}){const db=memoryDb();const handler=createAnalyticsHandler({getDb:()=>db,verifyToken:async()=>user,env,now:()=>time});return {db,call:async(body,options={})=>{const res=response();await handler({method:body?'POST':'GET',headers:{...headers,...(!body?{authorization:'Bearer token'}:{})},body,query:{days:'7'},...options},res);return res;}};}
test('events deduplicate retries and unique daily visitors while counting product clicks and views',async()=>{
  const {db,call}=setup();const visitor=randomUUID(),first=event(visitor);await call(first);await call(first);await Promise.all([call(event(visitor,'/product/white-gel','product_click')),call(event(visitor,'/product/white-gel'))]);await call(event());
  const daily=(await db.collection('siteAnalyticsDaily').doc('2026-11-09').get()).data();assert.equal(daily.pageViews,3);assert.equal(daily.visitors,2);assert.equal(daily.productClicks,1);
  const product=(await db.collection('siteAnalyticsProducts').get()).docs[0].data();assert.equal(product.clicks,1);assert.equal(product.views,1);
  const privateData=JSON.stringify((await db.collection('siteAnalyticsVisitors').get()).docs.map(doc=>doc.data()));assert.ok(!privateData.includes(visitor));assert.ok(!privateData.includes('192.0.2.1'));
});
test('events reject admin paths, private query strings, foreign origins and malformed IDs',async()=>{
  const {call}=setup();for(const path of ['/admin','/admin/orders','/tra-cuu-don-hang?phone=0901234567','https://evil.example','/product/foo?token=secret','/product/foo%3Fphone%3D0901234567'])assert.equal((await call(event(undefined,path))).statusCode,400);
  assert.equal((await call({...event(),visitorId:'bad'})).statusCode,400);assert.equal((await call(event(),{headers:{...headers,origin:'https://evil.example'}})).statusCode,403);assert.equal((await call(event(undefined,'/','product_click'))).statusCode,400);
});
test('bots and privacy signals do not create analytics data',async()=>{
  const {db,call}=setup();for(const patch of [{'user-agent':'Googlebot'},{dnt:'1'},{'sec-gpc':'1'}])assert.equal((await call(event(),{headers:{...headers,...patch}})).body.accepted,false);
  assert.equal((await db.collection('siteAnalyticsDaily').get()).docs.length,0);
});
test('analytics reports require an allowed admin and expose aggregates rather than private order data',async()=>{
  const {db,call}=setup();await call(event(undefined,'/product/white-gel','product_click'));await db.collection('products').doc('a').set({name:'White Gel',number:1});
  await db.collection('orders').doc('paid').set({createdAt:new Date(time),paymentStatus:'paid',status:'completed',totalAmount:500000,customer:{email:'PRIVATE',phone:'0900000000'}});
  await db.collection('orders').doc('unpaid').set({createdAt:new Date(time),paymentStatus:'unpaid',status:'new',totalAmount:900000});
  await db.collection('orders').doc('cancelled').set({createdAt:new Date(time),paymentStatus:'paid',status:'cancelled',totalAmount:999999});
  await db.collection('orders').doc('quote').set({createdAt:new Date(time),paymentStatus:'paid',status:'confirmed',totalAmount:null});
  const res=await call();assert.equal(res.statusCode,200);assert.equal(res.body.series.length,7);const day=res.body.series.at(-1);assert.equal(day.paidAmount,500000);assert.equal(day.paidOrders,2);assert.equal(day.unpricedPaid,1);assert.equal(res.body.products[0].name,'White Gel');assert.equal(res.body.products[0].clicks,1);assert.ok(!JSON.stringify(res.body).includes('PRIVATE'));assert.ok(!JSON.stringify(res.body).includes('0900000000'));
  assert.equal((await call(undefined,{headers:{}})).statusCode,401);const other=setup({uid:'intruder'});assert.equal((await other.call()).statusCode,403);
});
test('analytics reports page through all matching orders instead of truncating the first page',async()=>{
  const {db,call}=setup();for(let i=0;i<505;i++)await db.collection('orders').doc(String(i).padStart(4,'0')).set({createdAt:new Date(time+i),paymentStatus:'paid',status:'completed',totalAmount:1000});
  const res=await call();assert.equal(res.body.series.at(-1).paidOrders,505);assert.equal(res.body.series.at(-1).paidAmount,505000);
});
test('Vietnam day boundaries and zero-valued paid totals are accurate',()=>{
  assert.equal(analyticsDay(Date.parse('2026-11-08T17:00:00Z')),'2026-11-09');const window=analyticsWindow(time,7);assert.equal(window.days[0],'2026-11-03');assert.equal(window.days.at(-1),'2026-11-09');
  const summary=paidOrderSummary([{createdAt:new Date(time),paymentStatus:'paid',status:'completed',totalAmount:0}],window.days);assert.equal(summary.get('2026-11-09').paidOrders,1);assert.equal(summary.get('2026-11-09').unpricedPaid,0);assert.equal(analyticsPath('/product/white-gel'),'/product/white-gel');
});
test('anonymous analytics requests are rate limited on the server',async()=>{
  const {call}=setup();for(let i=0;i<150;i++)assert.equal((await call(event())).statusCode,200);assert.equal((await call(event())).statusCode,429);
});

test('unmeasured days remain unknown instead of being reported as zero traffic',async()=>{
  const {call}=setup();let res=await call();assert.equal(res.statusCode,200);assert.equal(res.body.recordedSince,null);assert.ok(res.body.series.every(day=>day.pageViews===null&&day.visitors===null&&day.productClicks===null));
  await call(event());res=await call();assert.equal(res.body.recordedSince,'2026-11-09');assert.ok(res.body.series.slice(0,-1).every(day=>day.pageViews===null));assert.equal(res.body.series.at(-1).pageViews,1);
});
test('old product aliases aggregate into one product instead of separate rankings',async()=>{
  const {db,call}=setup();await db.collection('products').doc('gel').set({name:'White Gel',number:1,slugAliases:['first-story']});
  await call(event(undefined,'/product/first-story','product_click'));await call(event(undefined,'/product/white-gel','product_click'));
  const res=await call();assert.equal(res.body.products.length,1);assert.equal(res.body.products[0].clicks,2);assert.equal(res.body.products[0].id,'gel');
});

test('reports validate measured and unknown counters and reject incomplete financial data',async()=>{
  const {call}=setup();const report=(await call()).body;assert.equal(validAnalyticsReport(report,7),true);assert.equal(validAnalyticsReport({...report,series:report.series.slice(1)},7),false);
  assert.equal(validAnalyticsReport({...report,series:[null,...report.series.slice(1)]},7),false);assert.equal(validAnalyticsReport({...report,products:[null]},7),false);
  const invalid=structuredClone(report);invalid.series[0].paidAmount='100000';assert.equal(validAnalyticsReport(invalid,7),false);
  invalid.series[0].paidAmount=0;invalid.series[0].pageViews=-1;assert.equal(validAnalyticsReport(invalid,7),false);
});
