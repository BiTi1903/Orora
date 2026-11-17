import {useSyncExternalStore} from 'react';
const query='(max-width: 768px)';
const subscribe=callback=>{const media=window.matchMedia(query);media.addEventListener('change',callback);return()=>media.removeEventListener('change',callback);};
function snapshot(){
 const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
 return window.matchMedia(query).matches&&ios&&/Safari/.test(navigator.userAgent)&&!/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent)&&!navigator.standalone&&!window.matchMedia('(display-mode: standalone)').matches;
}
export default function useMobileSafari(){return useSyncExternalStore(subscribe,snapshot,()=>false);}
