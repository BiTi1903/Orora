import {createHash} from 'node:crypto';
import {Timestamp,GeoPoint,DocumentReference} from 'firebase-admin/firestore';
const hash=records=>createHash('sha256').update(JSON.stringify(records)).digest('hex');
export function encode(value){
 if(value===null||['string','boolean'].includes(typeof value))return value;
 if(typeof value==='number')return Number.isFinite(value)?value:{t:'number',v:String(value)};
 if(value instanceof Timestamp)return {t:'timestamp',s:value.seconds,n:value.nanoseconds};
 if(value instanceof Date)return {t:'date',v:value.toISOString()};
 if(value instanceof GeoPoint)return {t:'geo',lat:value.latitude,lng:value.longitude};
 if(value instanceof DocumentReference)return {t:'ref',v:value.path};
 if(Buffer.isBuffer(value))return {t:'bytes',v:value.toString('base64')};
 if(Array.isArray(value))return {t:'array',v:value.map(encode)};
 if(value&&Object.getPrototypeOf(value)===Object.prototype)return {t:'map',v:Object.fromEntries(Object.entries(value).map(([key,item])=>[key,encode(item)]))};
 throw Error('Unsupported Firestore value');
}
export function decode(value,db,depth=0){
 if(depth>40)throw Error('Backup nesting limit exceeded');
 if(value===null||['string','boolean','number'].includes(typeof value))return value;
 if(!value||typeof value!=='object')throw Error('Invalid backup value');
 switch(value.t){
 case 'timestamp':return new Timestamp(value.s,value.n);
 case 'date':{const date=new Date(value.v);if(!Number.isFinite(date.getTime()))throw Error('Invalid date');return date;}
 case 'geo':return new GeoPoint(value.lat,value.lng);
 case 'ref':if(!validPath(value.v))throw Error('Invalid reference path');return db.doc(value.v);
 case 'bytes':if(typeof value.v!=='string')throw Error('Invalid bytes');return Buffer.from(value.v,'base64');
 case 'number':if(!['NaN','Infinity','-Infinity'].includes(value.v))throw Error('Invalid number');return Number(value.v);
 case 'array':if(!Array.isArray(value.v))throw Error('Invalid array');return value.v.map(item=>decode(item,db,depth+1));
 case 'map':if(!value.v||Array.isArray(value.v)||typeof value.v!=='object')throw Error('Invalid map');return Object.fromEntries(Object.entries(value.v).map(([key,item])=>[key,decode(item,db,depth+1)]));
 default:throw Error('Unknown backup value type');
 }
}
const validPath=path=>typeof path==='string'&&path.length>0&&path.split('/').length%2===0&&path.split('/').every(part=>part&&part!=='.'&&part!=='..');
export function sealBackup(projectId,records){return {version:1,projectId,createdAt:new Date().toISOString(),records,count:records.length,sha256:hash(records)};}
export function validateBackup(backup,projectId){
 if(backup?.version!==1||!Array.isArray(backup.records)||backup.count!==backup.records.length||backup.records.length>100000||backup.sha256!==hash(backup.records))throw Error('Invalid or incomplete backup');
 if(!backup.projectId||backup.projectId!==projectId)throw Error('Project ID does not match backup');
 const paths=new Set();
 for(const record of backup.records){if(!validPath(record.path)||paths.has(record.path)||record.data?.t!=='map')throw Error('Invalid or duplicate document path');paths.add(record.path);}
 return {projectId,count:backup.count,createdAt:backup.createdAt,sha256:backup.sha256};
}
export async function exportBackup(db,projectId){
 const records=[];
 const visit=async collection=>{
  // listDocuments includes missing parent documents that still have children.
  const refs=await collection.listDocuments();
  if(refs.length>100000)throw Error('Use managed export for very large collections');
  for(let offset=0;offset<refs.length;offset+=250){
   const page=await db.getAll(...refs.slice(offset,offset+250));
   for(const doc of page){
    if(doc.exists){records.push({path:doc.ref.path,data:encode(doc.data())});if(records.length>100000)throw Error('Use managed export for databases above 100000 documents');}
    for(const child of await doc.ref.listCollections())await visit(child);
   }
  }
 };
 for(const collection of await db.listCollections())await visit(collection);
 return sealBackup(projectId,records);
}
export async function restoreBackup(db,backup,{projectId,apply=false}={}){
 const summary=validateBackup(backup,projectId);
 // Validate ALL values before the first write, including on dry-run.
 const decoded=backup.records.map(record=>({path:record.path,data:decode(record.data,db)}));
 if(!apply)return {...summary,applied:false};
 for(let offset=0;offset<decoded.length;offset+=400){const batch=db.batch();for(const record of decoded.slice(offset,offset+400))batch.set(db.doc(record.path),record.data);await batch.commit();}
 return {...summary,applied:true};
}
