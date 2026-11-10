import {productMainImage} from './image-cdn';
const warmed=new Set();
let detail;
export function prepareProductDetail(image){
 if(typeof window==='undefined')return;
 if(!detail)detail=import('../components/ProductDetail').catch(()=>{detail=null;});
 const src=productMainImage(image,window.innerWidth);
 if(!src||warmed.has(src)||warmed.size>=32)return;
 warmed.add(src);
 const preload=new Image();preload.fetchPriority='high';preload.src=src;
 preload.onerror=()=>warmed.delete(src);
}
