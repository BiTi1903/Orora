import {useEffect,useState} from 'react';
const sample='ORORA Làn da dịu nhẹ được làm sạch mỗi ngày';
const faces=['400 26px "Cormorant Garamond"','600 120px "Cormorant Garamond"','italic 500 26px "Cormorant Garamond"','400 14px "Jost"','600 14px "Jost"'];
const loaded=()=>!document.fonts||faces.every(face=>document.fonts.check(face,sample));
export default function useHeroFonts(){
 const [state,setState]=useState(()=>loaded()?'ready':'pending');
 useEffect(()=>{
  if(loaded())return;
  let alive=true;
  // A failed font request must not leave the hero hidden indefinitely.
  const timer=setTimeout(()=>{if(alive)setState(current=>current==='pending'?'fallback':current);},1000);
  Promise.all(faces.map(face=>document.fonts.load(face,sample))).then(()=>{if(alive){clearTimeout(timer);setState(loaded()?'ready':'fallback');}}).catch(()=>{if(alive){clearTimeout(timer);setState('fallback');}});
  return()=>{alive=false;clearTimeout(timer);};
 },[]);
 return state;
}
