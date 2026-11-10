import test from 'node:test';
import assert from 'node:assert/strict';
import {Timestamp,GeoPoint,Firestore} from 'firebase-admin/firestore';
import {encode,decode,sealBackup,restoreBackup,exportBackup} from '../scripts/firestore-backup-lib.mjs';
import {createDirtyRegistry} from '../src/lib/dirty-registry.js';
test('unsaved editors register independently and saving one does not clear another',()=>{
 const registry=createDirtyRegistry();registry.set('product',true);registry.set('chat',true);registry.set('product',false);assert.equal(registry.hasChanges(),true);registry.set('chat',false);assert.equal(registry.hasChanges(),false);
});
test('backup retains timestamps, refs, bytes, reserved-looking map keys and supports preview without writes',async()=>{
 const db=new Firestore({projectId:'unit-test'}),data={time:new Timestamp(123,456),point:new GeoPoint(10,106),ref:db.doc('products/1'),bytes:Buffer.from('abc'),nested:{t:'timestamp',v:[1,null,true]},date:new Date('2026-11-10T00:00:00Z'),n:NaN};
 const encoded=encode(data),round=decode(encoded,db);assert.equal(round.time.nanoseconds,456);assert.equal(round.ref.path,'products/1');assert.deepEqual(round.nested,data.nested);assert.equal(round.bytes.toString(),'abc');assert.ok(Number.isNaN(round.n));
 let writes=0;const fake={doc:path=>({path}),batch:()=>({set(){writes++;},async commit(){}})};
 const backup=sealBackup('unit-test',[{path:'products/1',data:encoded}]);assert.equal((await restoreBackup(fake,backup,{projectId:'unit-test'})).applied,false);assert.equal(writes,0);
 await assert.rejects(()=>restoreBackup(fake,backup,{projectId:'wrong',apply:true}),/Project/);assert.equal(writes,0);
 await assert.rejects(()=>restoreBackup(fake,{...backup,count:2},{projectId:'unit-test',apply:true}),/incomplete/);assert.equal(writes,0);
 const invalid=sealBackup('unit-test',[{path:'products/1',data:encode({ok:true})},{path:'products/2',data:{t:'map',v:{bad:{t:'unknown'}}}}]);await assert.rejects(()=>restoreBackup(fake,invalid,{projectId:'unit-test',apply:true}),/Unknown/);assert.equal(writes,0);
 assert.equal((await restoreBackup(fake,backup,{projectId:'unit-test',apply:true})).applied,true);assert.equal(writes,1);
});
test('backup discovers subcollections even when a parent document is missing',async()=>{
 const child={path:'orders/missing/events/1',listCollections:async()=>[]};
 const parent={path:'orders/missing',listCollections:async()=>[{listDocuments:async()=>[child]}]};
 const db={listCollections:async()=>[{listDocuments:async()=>[parent]}],getAll:async(...refs)=>refs.map(ref=>({ref,exists:ref===child,data:()=>({event:'created'})}))};
 const backup=await exportBackup(db,'unit-test');assert.equal(backup.count,1);assert.equal(backup.records[0].path,child.path);
});

test('production HTTP checker only reads and rejects a broken robots configuration',async()=>{
 const {createServer}=await import('node:http'),{execFile}=await import('node:child_process'),{promisify}=await import('node:util');
 const methods=[];let broken=false;
 const server=createServer((req,res)=>{methods.push([req.method,req.url]);if(['/admin','/tra-cuu-don-hang'].includes(req.url))res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(req.url==='/robots.txt')return res.end(broken?'User-agent: *':'User-agent: *\nDisallow: /admin\nSitemap: https://ororavn.com/sitemap.xml');
  if(req.url==='/sitemap.xml'){res.setHeader('Content-Type','application/xml');return res.end('<urlset><url><loc>https://ororavn.com/</loc></url></urlset>');}
  if(req.url==='/api/addresses')return res.end(JSON.stringify({items:[]}));
  if(req.url==='/api/chat')return res.end(JSON.stringify({aiConfigured:false}));res.end('<html>OK</html>');
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  const args=['scripts/check-production.mjs',`http://127.0.0.1:${server.address().port}`],run=promisify(execFile);
  const result=JSON.parse((await run(process.execPath,args)).stdout);assert.equal(result.passed,true);assert.equal(result.checks.length,7);
  broken=true;await assert.rejects(()=>run(process.execPath,args),error=>error.code===1&&JSON.parse(error.stdout).passed===false);
  assert.ok(methods.every(([method,path])=>method==='GET'&&path!=='/api/orders'));
 }finally{await new Promise(resolve=>server.close(resolve));}
});
