import {createStorefrontShellHandler} from './storefront-shell.js';
import {createShareImageHandler} from './share-image.js';
import {createSitemapHandler} from './sitemap.js';

// Public read-only routes share one deployed function; each keeps its own headers.
export function createStorefrontHandler(dependencies) {
 const handlers={
  shell:createStorefrontShellHandler(dependencies),
  'share-image':createShareImageHandler(dependencies),
  sitemap:createSitemapHandler(dependencies),
 };
 return (req,res)=>{
  const resource=req.query?.resource;
  if(typeof resource!=='string'||!Object.hasOwn(handlers,resource)){
   res.setHeader('Cache-Control','no-store');
   return res.status(404).end();
  }
  return handlers[resource](req,res);
 };
}
