import {useSyncExternalStore} from 'react';
const query='(max-width: 768px)';
const subscribe=callback=>{const media=window.matchMedia(query);media.addEventListener('change',callback);return()=>media.removeEventListener('change',callback);};
export function isSafariBrowser(){
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 return ios&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent)&&!navigator.standalone&&!window.matchMedia('(display-mode: standalone)').matches;
}
function snapshot(){return window.matchMedia(query).matches&&isSafariBrowser();}
export default function useMobileSafari(){return useSyncExternalStore(subscribe,snapshot,()=>false);}
