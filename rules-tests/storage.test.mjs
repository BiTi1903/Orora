import {after,before,test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
const projectId='demo-orora-security';
let env;
const bytes=new Uint8Array([137,80,78,71]);
const image={contentType:'image/png'};
const object=(uid,claims={})=>(uid?env.authenticatedContext(uid,claims):env.unauthenticatedContext()).storage().ref('products/example.png');
before(async()=>{
 env=await initializeTestEnvironment({projectId,firestore:{host:'127.0.0.1',port:18085,rules:await readFile('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:19195,rules:await readFile('storage.rules','utf8')}});
 await env.withSecurityRulesDisabled(async ctx=>{
  await ctx.firestore().doc('adminUsers/member').set({enabled:true});
  await ctx.firestore().doc('adminUsers/disabled').set({enabled:false});
  await ctx.storage().ref('products/example.png').put(bytes,image);
 });
});
after(async()=>env?.cleanup());
test('public can still read catalog images',async()=>{await assertSucceeds(object().getMetadata());});
test('signed-out, normal and anonymous users cannot upload, overwrite or delete',async()=>{
 for(const [uid,claims] of [[null,{}],['reader',{}],['anonymous',{firebase:{sign_in_provider:'anonymous'}}],['disabled',{}],['fake',{admin:false}]]){
  await assertFails(object(uid,claims).put(bytes,image));
  await assertFails((uid?env.authenticatedContext(uid,claims):env.unauthenticatedContext()).storage().ref('new/upload.png').put(bytes,image));
  await assertFails(object(uid,claims).delete());
 }
});
test('custom claim admins and enabled Firestore admins can write images',async()=>{
 for(const [uid,claims] of [['claim',{admin:true}],['member',{}]])await assertSucceeds(object(uid,claims).put(bytes,image));
});
test('admins cannot write oversized, empty or non-image files, or change an image to HTML',async()=>{
 const target=object('claim',{admin:true});
 for(const [content,metadata] of [[new Uint8Array(10*1024*1024+1),image],[new Uint8Array(0),image],[bytes,{contentType:'text/html'}],[bytes,{contentType:'image/svg+xml'}]])await assertFails(target.put(content,metadata));
 await assertFails(target.updateMetadata({contentType:'text/html'}));
 await assertSucceeds(target.put(new Uint8Array(10*1024*1024),image));
});
test('normal users cannot self-grant admin; admins can delete existing images without upload metadata',async()=>{
 await assertFails(env.authenticatedContext('reader').firestore().doc('adminUsers/reader').set({enabled:true}));
 await assertSucceeds(object('member').delete());
});
