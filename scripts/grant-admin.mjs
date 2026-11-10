// Server credential only. Never grant roles from the browser or public API.
import {getNewsletterDb,getNewsletterUser} from '../server/firebase-admin.js';
const args=process.argv.slice(2),arg=name=>{const index=args.indexOf(name);return index<0?undefined:args[index+1];};
try{
 const project=arg('--project'),uid=arg('--uid'),credentials=JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON||'{}');
 if(!project||!uid||uid.length>128||credentials.project_id!==project)throw Error('Provide matching --project PROJECT_ID --uid EXISTING_UID and server credentials');
 await getNewsletterUser(uid); // Avoid silently granting a typo/nonexistent user.
 if(!args.includes('--apply'))console.log(JSON.stringify({project,uid,applied:false,action:'grant-admin'}));
 else {await getNewsletterDb().collection('adminUsers').doc(uid).set({enabled:true,updatedAt:new Date()},{merge:true});console.log(JSON.stringify({project,uid,applied:true,action:'grant-admin'}));}
}catch(error){console.error(error instanceof SyntaxError?'Invalid server credential JSON':error.code||error.message);process.exitCode=1;}
