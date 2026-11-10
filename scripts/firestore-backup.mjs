import {readFile,writeFile,stat,mkdir} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {getNewsletterDb} from '../server/firebase-admin.js';
import {exportBackup,restoreBackup} from './firestore-backup-lib.mjs';
const [action,...args]=process.argv.slice(2),arg=name=>{const index=args.indexOf(name);return index<0?undefined:args[index+1];};
try{
 const projectId=arg('--project'),file=arg('--file');
 if(!['export','restore'].includes(action)||!projectId||!file)throw Error('Usage: node scripts/firestore-backup.mjs export|restore --project PROJECT_ID --file PRIVATE_FILE [--apply]');
 if(action==='export'||args.includes('--apply')){const credentials=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||'{}');if(credentials.project_id!==projectId)throw Error('Configured service account must match --project');}
 if(action==='export'){
  if(!file.endsWith('.firestore-backup.json'))throw Error('Export filename must end with .firestore-backup.json so it is excluded from Git');
  const backup=await exportBackup(getNewsletterDb(),projectId),path=resolve(file);await mkdir(dirname(path),{recursive:true,mode:0o700});await writeFile(path,JSON.stringify(backup),{mode:0o600,flag:'wx'});console.log(JSON.stringify({projectId,count:backup.count,sha256:backup.sha256,file:path}));
 }else{
  if((await stat(file)).size>64*1024*1024)throw Error('Backup file exceeds 64 MiB; use managed restore');
  const backup=JSON.parse(await readFile(file,'utf8')),apply=args.includes('--apply');
  const db=apply?getNewsletterDb():{doc:path=>({path})};
  console.log(JSON.stringify(await restoreBackup(db,backup,{projectId,apply})));
 }
}catch(error){console.error(error instanceof SyntaxError?'Invalid JSON configuration or backup file':error.message);process.exitCode=1;}
