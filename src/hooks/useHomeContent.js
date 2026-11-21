import {useMemo,useSyncExternalStore} from 'react';
import {createHomeStore} from '../lib/home-store';
import {loadContentFonts} from '../lib/font-loading';
import {useLocale,localizeHomeContent} from '../lib/i18n';
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
export default function useHomeContent({raw=false}={}){
 const snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getSnapshot);
 const locale=useLocale();
 const isAdmin=typeof window!=='undefined'&&window.location?.pathname?.startsWith('/admin');
 return useMemo(()=>(raw||isAdmin||locale==='vi')?snapshot:localizeHomeContent(snapshot,locale),[snapshot,locale,raw,isAdmin]);
}
