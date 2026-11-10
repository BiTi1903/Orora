import {heroImageSources} from './image-cdn.js';
const KEYS=['heroImage','heroImageMobile','heroMobileImage','heroChip1','heroChip2','heroChip3','heroGlassCards','heroEyebrow','heroTitle','heroDescription','heroRotator','heroRotatorPrefix','heroRotatorSuffix','heroButtonText','heroButtonLink','heroRingText','heroScrollText','heroStyles','shopButtonText','shopButtonLink','navLogo','navLinks','navStyles','marqueeWords','marqueeStyles','sectionVisibility'];
export function publicHomeShell(home={}){
 const content=Object.fromEntries(KEYS.filter(key=>home[key]!==undefined).map(key=>[key,home[key]]));
 return {content,images:home.sectionVisibility?.hero===false?{desktop:null,mobile:null}:heroImageSources(content)};
}
