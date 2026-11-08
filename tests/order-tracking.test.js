import test from 'node:test';
import assert from 'node:assert/strict';
import { createOrderTrackingHandler } from '../server/order-tracking.js';
import { normalizeTrackingPhone } from '../src/lib/order-tracking.js';
import { memoryDb, response } from './firestore-memory.js';
const env = { NEWSLETTER_SITE_ORIGIN:'https://orora.example' };
const headers = { origin:env.NEWSLETTER_SITE_ORIGIN,'content-type':'application/json','x-forwarded-for':'192.0.2.10' };
async function setup() {
  const db = memoryDb();
  await db.collection('orders').doc('private-id').set({code:'OW_1234C',customer:{phone:'0901234567',name:'Private name',email:'private@example.com',address:'Private address',note:'Private note'},product:{name:'Sản phẩm A',variantLabel:'100 ml',id:'private-product'},quantity:2,status:'confirmed',paymentStatus:'unpaid',paymentMethod:'cod',subtotal:200000,shippingFee:0,totalAmount:200000,createdAt:new Date('2026-11-08T00:00:00Z'),updatedAt:new Date('2026-11-08T01:00:00Z'),requestHash:'secret',confirmationMail:{message:'Private mail'}});
  let time = Date.parse('2026-11-08T02:00:00Z');
  const handler = createOrderTrackingHandler({getDb:()=>db,env,now:()=>time});
  return {db,advance:ms=>{time+=ms;},call:async(body={code:'OW_1234C',phone:'0901234567'},options={})=>{const res=response();await handler({method:'POST',headers,body,...options},res);return res;}};
}
test('lookup requires matching code and normalized full phone and exposes only a public projection', async()=>{
  const {call}=await setup();const res=await call({code:' ow_1234c ',phone:'+84 (901) 234-567'});
  assert.equal(res.statusCode,200);assert.equal(res.body.order.shippingFee,0);assert.equal(res.body.order.status,'confirmed');assert.equal(res.body.order.variantLabel,'100 ml');
  assert.deepEqual(Object.keys(res.body.order).sort(),['code','status','createdAt','updatedAt','productName','variantLabel','quantity','subtotal','shippingFee','totalAmount','paymentMethod','paymentStatus'].sort());
  for(const secret of ['Private name','private@example.com','Private address','Private note','private-id','secret','Private mail'])assert.ok(!JSON.stringify(res.body).includes(secret));
  assert.match(res.headers['Cache-Control'],/no-store/);
});
test('wrong phone and unknown code have the same non-disclosing error',async()=>{
  const {call}=await setup();const a=await call({code:'OW_1234C',phone:'0909999999'}),b=await call({code:'OW_9999C',phone:'0901234567'});
  assert.equal(a.statusCode,404);assert.equal(b.statusCode,404);assert.deepEqual(a.body,b.body);
});
test('method, origin, payload and phone validation reject requests before database access',async()=>{
  let reads=0;const handler=createOrderTrackingHandler({getDb:()=>{reads++;throw Error('private failure');},env});
  for(const [patch,status] of [[{method:'GET'},405],[{headers:{...headers,origin:'https://evil.example'}},403],[{headers:{...headers,'content-type':'text/plain'}},415],[{body:'not-json'},400],[{body:{code:'OW_1234C',phone:'letters'}},400],[{body:{code:'a/b',phone:'0901234567'}},400],[{headers:{...headers,'content-length':'3000'}},413]]){const res=response();await handler({method:'POST',headers,body:{code:'OW_1234C',phone:'0901234567'},...patch},res);assert.equal(res.statusCode,status);}
  assert.equal(reads,0);
});
test('lookup rate limits persist through handler instances and expire by window',async()=>{
  const {db,call,advance}=await setup();for(let i=0;i<10;i++)assert.equal((await call()).statusCode,200);
  const blocked=await call();assert.equal(blocked.statusCode,429);assert.equal(blocked.headers['Retry-After'],'600');
  const other=createOrderTrackingHandler({getDb:()=>db,env,now:()=>Date.parse('2026-11-08T02:00:01Z')});const res=response();await other({method:'POST',headers,body:{code:'OW_1234C',phone:'0901234567'}},res);assert.equal(res.statusCode,429);
  advance(601000);assert.equal((await call()).statusCode,200);
});
test('phone-level limits also stop attempts from rotating IPs',async()=>{
  const {call}=await setup();for(let i=0;i<20;i++)assert.equal((await call(undefined,{headers:{...headers,'x-forwarded-for':`192.0.2.${i}`}})).statusCode,200);
  assert.equal((await call(undefined,{headers:{...headers,'x-forwarded-for':'198.51.100.4'}})).statusCode,429);
});
test('tracking reflects admin status updates immediately, supports old codes and unknown totals',async()=>{
  const {db,call}=await setup();await db.collection('orders').doc('private-id').set({status:'cancelled',paymentStatus:'paid',totalAmount:null,code:'OW22910'},{merge:true});
  const res=await call({code:'OW22910',phone:'0901234567'});assert.equal(res.statusCode,200);assert.equal(res.body.order.status,'cancelled');assert.equal(res.body.order.paymentStatus,'paid');assert.equal(res.body.order.totalAmount,null);
});
test('database failures return a generic error without internal details',async()=>{
  const handler=createOrderTrackingHandler({getDb:()=>{throw Object.assign(new Error('SECRET FIREBASE CREDENTIALS'),{status:403});},env});const res=response();await handler({method:'POST',headers,body:{code:'OW_1234C',phone:'0901234567'}},res);assert.equal(res.statusCode,503);assert.ok(!JSON.stringify(res.body).includes('SECRET'));
});
test('phone normalization preserves foreign numbers and rejects partial or malformed credentials',()=>{
  assert.equal(normalizeTrackingPhone('0901 234 567'),'0901234567');assert.equal(normalizeTrackingPhone('+84901234567'),'0901234567');assert.equal(normalizeTrackingPhone('+442012345678'),'442012345678');assert.equal(normalizeTrackingPhone('1234'),'');assert.equal(normalizeTrackingPhone('090abc1234567'),'');
});

test('daily lookup quota cannot be bypassed by waiting for shorter windows',async()=>{
  const {call,advance}=await setup();
  for(let window=0;window<6;window++){for(let attempt=0;attempt<10;attempt++)assert.equal((await call()).statusCode,200);advance(601000);}
  const blocked=await call();assert.equal(blocked.statusCode,429);assert.match(blocked.body.message,/hôm nay/);assert.ok(Number(blocked.headers['Retry-After'])>600);
  advance(86400000);assert.equal((await call()).statusCode,200);
});

test('code alone returns its order without requiring a phone',async()=>{
  const {call}=await setup();const res=await call({code:'OW_1234C'});assert.equal(res.statusCode,200);assert.equal(res.body.orders.length,1);assert.equal(res.body.orders[0].code,'OW_1234C');assert.equal(res.body.nextCursor,null);
});
test('phone alone lists only that phone across local and +84 formats with complete pagination',async()=>{
  const {db,call}=await setup();
  for(let i=0;i<24;i++)await db.collection('orders').doc(`page-${String(i).padStart(2,'0')}`).set({code:`OW_${String(i).padStart(4,'0')}B`,customer:{phone:i%2?'+84901234567':'0901234567',email:'private@example.com'},product:{name:'Sample'},status:'new'});
  await db.collection('orders').doc('other-phone').set({code:'OW_9999B',customer:{phone:'0909999999'},product:{name:'Other'}});
  const first=await call({phone:'0901234567'});assert.equal(first.statusCode,200);assert.equal(first.body.orders.length,20);assert.ok(first.body.nextCursor);
  const second=await call({phone:'+84901234567',cursor:first.body.nextCursor});assert.equal(second.statusCode,200);assert.equal(second.body.orders.length,5);assert.equal(second.body.nextCursor,null);
  const codes=[...first.body.orders,...second.body.orders].map(order=>order.code);assert.equal(new Set(codes).size,25);assert.ok(!codes.includes('OW_9999B'));assert.ok(!JSON.stringify(first.body).includes('private@example.com'));
  assert.equal((await call({phone:'0901234567',cursor:'OW_9999B'})).statusCode,400);
});
test('empty lookup cannot list all store orders',async()=>{
  const {call}=await setup();assert.equal((await call({})).statusCode,400);assert.equal((await call({phone:'   ',code:''})).statusCode,400);
});
