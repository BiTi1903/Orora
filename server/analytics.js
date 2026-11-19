import { createHash, createHmac } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { analyticsDay,analyticsWindow,analyticsPath,paidOrderSummary } from '../src/lib/analytics.js';
import { withProductIdentity } from '../src/lib/product-identity.js';
import { requireAdmin } from './admin-auth.js';
import { rateLimitSalt } from './request-limits.js';
const fail=(status,message)=>Object.assign(new Error(message),{publicError:true,status});
const uuid=value=>typeof value==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value);
const digest=value=>createHash('sha256').update(value).digest('hex');
const keyed=(salt,value)=>createHmac('sha256',salt).update(value).digest('hex');
async function collect(db,req,body,time,env){
  const day=analyticsDay(time),expiresAt=new Date(time+3*86400000);
  const path=analyticsPath(body.path);
  if(!path||!uuid(body.visitorId)||!uuid(body.eventId)||!['page_view','product_click'].includes(body.type)||(body.type==='product_click'&&!path.startsWith('/product/')))throw fail(400,'Sự kiện không hợp lệ.');
  const product=path.startsWith('/product/');
  const ip=String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim().slice(0,160);
  const salt=env.ANALYTICS_RATE_SALT?.trim()||rateLimitSalt(env)||'orora-analytics';
  const daily=db.collection('siteAnalyticsDaily').doc(day);
  const visitor=db.collection('siteAnalyticsVisitors').doc(keyed(salt,`${day}:${body.visitorId}`));
  const event=db.collection('siteAnalyticsEvents').doc(digest(`${day}:${body.visitorId}:${body.eventId}`));
  const limit=db.collection('siteAnalyticsLimits').doc(keyed(salt,`${day}:${ip}`));
  const metric=product?db.collection('siteAnalyticsProducts').doc(`${day}-${digest(path)}`):null;
  const accepted=await db.runTransaction(async tx=>{
    const [visitorDoc,eventDoc,limitDoc]=await tx.getAll(visitor,event,limit);
    const prior=limitDoc.data()||{},inWindow=time>=prior.windowStart&&time-prior.windowStart<600000;
    if((inWindow&&prior.windowCount>=150)||prior.count>=2000)throw fail(429,'Vui lòng thử lại sau.');
    tx.set(limit,{count:(prior.count||0)+1,windowStart:inWindow?prior.windowStart:time,windowCount:inWindow?(prior.windowCount||0)+1:1,expiresAt});
    if(eventDoc.exists)return null;
    tx.set(visitor,{day,expiresAt});tx.set(event,{day,expiresAt});
    return {newVisitor:!visitorDoc.exists};
  });
  if(!accepted)return;
  const writes=[
    daily.set({
      day,
      pageViews:FieldValue.increment(body.type==='page_view'?1:0),
      visitors:FieldValue.increment(accepted.newVisitor?1:0),
      productClicks:FieldValue.increment(body.type==='product_click'?1:0),
    },{merge:true}),
  ];
  if(metric){
    writes.push(metric.set({
      day,
      path,
      clicks:FieldValue.increment(body.type==='product_click'?1:0),
      views:FieldValue.increment(body.type==='page_view'?1:0),
    },{merge:true}));
  }
  await Promise.all(writes);
}
async function report(db,time,days){
  const window=analyticsWindow(time,days);
  const [daily,metrics,catalog,first]=await Promise.all([
    db.collection('siteAnalyticsDaily').where('day','>=',window.days[0]).where('day','<=',window.days.at(-1)).limit(91).get(),
    db.collection('siteAnalyticsProducts').where('day','>=',window.days[0]).where('day','<=',window.days.at(-1)).limit(10001).get(),
    db.collection('products').select('name','number','publicId','slug','slugAliases','canonicalSlug').limit(2000).get(),db.collection('siteAnalyticsDaily').orderBy('day','asc').limit(1).get(),
  ]);
  if(metrics.docs.length>10000)throw fail(422,'Có nhiều dữ liệu, vui lòng chọn khoảng thời gian ngắn hơn.');
  const orders=[];let cursor=null;
  do{let query=db.collection('orders').select('createdAt','paymentStatus','status','totalAmount').where('createdAt','>=',new Date(window.start)).where('createdAt','<',new Date(window.end)).orderBy('createdAt','asc').limit(500);if(cursor)query=query.startAfter(cursor);const batch=await query.get();orders.push(...batch.docs.map(doc=>doc.data()));if(orders.length>10000)throw fail(422,'Có nhiều đơn hàng, vui lòng chọn khoảng thời gian ngắn hơn.');cursor=batch.docs.length===500?batch.docs.at(-1):null;}while(cursor);
  const paid=paidOrderSummary(orders,window.days),visits=new Map(daily.docs.map(doc=>[doc.data().day,doc.data()]));
  const recordedSince=first.docs[0]?.data().day||null;
  const series=window.days.map(day=>{
    const measured=Boolean(recordedSince&&day>=recordedSince);
    return {day,pageViews:measured?(visits.get(day)?.pageViews||0):null,visitors:measured?(visits.get(day)?.visitors||0):null,productClicks:measured?(visits.get(day)?.productClicks||0):null,...paid.get(day)};
  });
  const products=withProductIdentity(catalog.docs.map(doc=>({...doc.data(),id:doc.id})));
  const routes=new Map();
  const bind=(route,product)=>{if(typeof route==='string'&&route&&!routes.has(route))routes.set(route,product);};
  for(const product of products)bind(product.id,product);
  for(const product of products)for(const alias of [product.slug,...(Array.isArray(product.slugAliases)?product.slugAliases:[])])bind(alias,product);
  for(const product of products)bind(product.canonicalSlug,product);
  for(const product of products){bind(product.publicId,product);bind(String(product.publicId||'').padStart(2,'0'),product);}
  const ranking=new Map();
  for(const doc of metrics.docs){const metric=doc.data();let route;try{route=decodeURIComponent(metric.path.slice(9));}catch{continue;}const product=routes.get(route);const key=product?.id||metric.path;if(!ranking.has(key))ranking.set(key,{id:product?.id||null,name:product?.name||route,path:metric.path,clicks:0,views:0});const entry=ranking.get(key);entry.clicks+=metric.clicks||0;entry.views+=metric.views||0;}
  return {series,products:[...ranking.values()].sort((a,b)=>b.clicks-a.clicks||b.views-a.views).slice(0,20),recordedSince,updatedAt:time};
}
export function createAnalyticsHandler({getDb,verifyToken,env=process.env,now=()=>Date.now()}){
  return async(req,res)=>{
    res.setHeader('Cache-Control','no-store, private');
    res.setHeader('X-Robots-Tag','noindex, nofollow');
    try{
      if(req.method==='POST'){
        if(req.headers.origin!==new URL(env.NEWSLETTER_SITE_ORIGIN||'https://ororavn.com').origin)throw fail(403,'Nguồn truy cập không hợp lệ.');
        if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail(415,'Chỉ nhận JSON.');
        if(Number(req.headers['content-length']||0)>2000)throw fail(413,'Nội dung quá dài.');
        let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body;}catch{throw fail(400,'Dữ liệu không hợp lệ.');}
        if(!body||Buffer.byteLength(JSON.stringify(body))>2000)throw fail(400,'Dữ liệu không hợp lệ.');
        if(req.headers.dnt==='1'||req.headers['sec-gpc']==='1'||/bot|crawler|spider|headless/i.test(req.headers['user-agent']||''))return res.status(200).json({accepted:false});
        await collect(getDb(),req,body,now(),env);return res.status(200).json({accepted:true});
      }
      if(req.method!=='GET'){res.setHeader('Allow','GET, POST');throw fail(405,'Phương thức không được hỗ trợ.');}
      await requireAdmin(req,{verifyToken,getDb,env,primaryEnvKey:'ORDER_ADMIN_UIDS',deniedMessage:'Tài khoản chưa được cấp quyền xem thống kê.'});
      const days=Number(req.query?.days||7);if(!Number.isInteger(days)||days<1||days>90)throw fail(400,'Chọn khoảng từ 1 đến 90 ngày.');
      return res.status(200).json(await report(getDb(),now(),days));
    }catch(error){return res.status(error.publicError?error.status:503).json({message:error.publicError?error.message:'Chưa tải được thống kê. Vui lòng thử lại sau.'});}
  };
}
