import {FONT_NAMES,toBareFontFamily} from './typography.js';
const primary=new Set(['Jost','Cormorant Garamond','Arial','Georgia','Times New Roman']);
export function contentFonts(value){
 const found=new Set();
 const visit=item=>{if(!item||typeof item!=='object')return;for(const [key,child] of Object.entries(item)){if(key==='fontFamily'&&typeof child==='string'){const name=toBareFontFamily(child);if(FONT_NAMES.includes(name)&&!primary.has(name))found.add(name);}else if(typeof child==='object')visit(child);}};
 visit(value);return [...found];
}
export function loadContentFonts(value){
 if(typeof document==='undefined')return;
 for(const name of contentFonts(value)){
  if(document.head.querySelector(`link[data-orora-font="${name}"]`))continue;
  const link=document.createElement('link');link.rel='stylesheet';link.dataset.ororaFont=name;
  const weights=["Lora","Noto Serif","Playfair Display"].includes(name)?"0,400;0,500;0,600;0,700;1,400;1,500":"0,300;0,400;0,500;0,600;0,700;1,400;1,500";
  link.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(name).replace(/%20/g,'+')}:ital,wght@${weights}&display=swap`;
  document.head.append(link);
 }
}
export function watchFontChoices(){
 const change=event=>{if(event.target?.tagName==='SELECT')loadContentFonts({fontFamily:event.target.value});};
 document.addEventListener('change',change);return()=>document.removeEventListener('change',change);
}
