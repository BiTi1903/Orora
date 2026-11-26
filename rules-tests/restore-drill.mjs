import test from 'node:test';
import assert from 'node:assert/strict';
import {initializeApp,deleteApp} from 'firebase-admin/app';
import {getFirestore} from 'firebase-admin/firestore';
import {exportBackup,restoreBackup} from '../scripts/firestore-backup-lib.mjs';

test('restore a synthetic order and its audit record in the isolated Firestore emulator',async()=>{
 assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^127\.0\.0\.1:\d+$/);
 const projectId='demo-orora-restore';
 const app=initializeApp({projectId},'restore-drill');
 try{
  const db=getFirestore(app);
  const order=db.doc('orders/sample'),event=order.collection('activityEvents').doc('created');
  await order.set({subtotal:400001,shippingFee:0});await event.set({status:'new'});
  const backup=await exportBackup(db,projectId);
  await event.delete();await order.delete();
  assert.equal((await restoreBackup(db,backup,{projectId})).applied,false);
  assert.equal((await order.get()).exists,false);
  await restoreBackup(db,backup,{projectId,apply:true});
  assert.deepEqual((await order.get()).data(),{subtotal:400001,shippingFee:0});
  assert.deepEqual((await event.get()).data(),{status:'new'});
 }finally{await deleteApp(app);}
});
