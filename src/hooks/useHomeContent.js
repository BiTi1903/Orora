import {useSyncExternalStore} from 'react';
import {createHomeStore} from '../lib/home-store';
import {loadContentFonts} from '../lib/font-loading';
const store=createHomeStore({
 listen:(next,error)=>{
  let cancelled=false,stop;
  // React/hero can paint before downloading the realtime database SDK.
  import('../lib/live-home-client').then(({listenHome})=>{if(!cancelled)stop=listenHome(next,error);}).catch(()=>{if(!cancelled)error();});
  return()=>{cancelled=true;stop?.();};
 },
 bootstrap:()=>typeof window!=='undefined'?window.__ororaShellPromise:null,
 onContent:loadContentFonts,
});
export default function useHomeContent(){return useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);}
