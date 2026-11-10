import test from 'node:test';
import assert from 'node:assert/strict';
import { createReadFlight } from '../src/lib/read-flight.js';
const deferred = () => { let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject}; };

test('simultaneous database readers share one request, settled values are never cached',async()=>{
  const flight=createReadFlight(),pending=deferred();let calls=0;
  const read=()=>{calls++;return pending.promise;};
  const readers=Array.from({length:7},()=>flight.run(read));
  assert.ok(readers.every(request=>request===readers[0]));
  await Promise.resolve();assert.equal(calls,1);
  pending.resolve({title:'Fresh'});await Promise.all(readers);
  assert.deepEqual(await flight.run(()=>{calls++;return {title:'Newer'};}),{title:'Newer'});
  assert.equal(calls,2);
});

test('failed reads release the shared request so retry can reach the database',async()=>{
  const flight=createReadFlight();
  await assert.rejects(flight.run(()=>{throw Error('Network unavailable');}),/Network unavailable/);
  assert.equal(await flight.run(()=>42),42);
});

test('successful write invalidation prevents joining an older pending read',async()=>{
  const flight=createReadFlight(),before=deferred(),after=deferred();
  const older=flight.run(()=>before.promise);
  flight.invalidate();
  const fresh=flight.run(()=>after.promise);assert.notEqual(older,fresh);
  before.resolve('Before write');assert.equal(await older,'Before write');
  // Completion of an invalidated read must not clear the newer request.
  assert.equal(flight.run(()=>{throw Error('Should join fresh read');}),fresh);
  after.resolve('After write');assert.equal(await fresh,'After write');
});
