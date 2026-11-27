import {heroImageSources} from './image-cdn.js';
const KEYS=['heroImage','heroImageMobile','heroMobileImage','heroChip1','heroChip2','heroChip3','heroGlassCards','heroEyebrow','heroTitle','heroDescription','heroRotator','heroRotatorPrefix','heroRotatorSuffix','heroButtonText','heroButtonLink','heroRingText','heroScrollText','heroStyles','shopButtonText','shopButtonLink','navLogo','navLinks','navStyles','marqueeWords','marqueeStyles','sectionVisibility','translations','phraseOverrides'];
const SHELL_KEY_SET=new Set(KEYS);
function pickShellTranslationSheet(sheet){
 if(!sheet||typeof sheet!=='object')return undefined;
 const picked={};
 let count=0;
 for(const [key,value] of Object.entries(sheet)){
  try{
   const path=JSON.parse(key);
   if(Array.isArray(path)&&path[0]==='home'&&SHELL_KEY_SET.has(path[1])){
    picked[key]=value;
    count++;
   }
  }catch{
   // Ignore malformed keys
  }
 }
 return count?picked:undefined;
}
export function publicHomeShell(home={}){
 const content=Object.fromEntries(KEYS.filter(key=>home[key]!==undefined).map(key=>[key,home[key]]));
 const shellSheet=pickShellTranslationSheet(home.translationSheet);
 if(shellSheet)content.translationSheet=shellSheet;
 return {content,images:home.sectionVisibility?.hero===false?{desktop:null,mobile:null}:heroImageSources(content)};
}
