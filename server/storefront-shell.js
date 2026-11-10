import {publicHomeShell} from '../src/lib/home-shell.js';
export function createStorefrontShellHandler({getDb}){
 return async(req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return res.status(405).end();}
  try{
   const home=await getDb().collection('settings').doc('home').get();
   res.setHeader('Cache-Control','public, max-age=0, s-maxage=15, stale-while-revalidate=15');
   res.setHeader('X-Content-Type-Options','nosniff');
   res.setHeader('Content-Type','application/json; charset=utf-8');
   if(req.method==='HEAD')return res.status(200).end();
   return res.status(200).json(publicHomeShell(home.exists?home.data():{}));
  }catch{res.setHeader('Cache-Control','no-store');return res.status(503).json({message:'Storefront content temporarily unavailable'});}
 };
}
