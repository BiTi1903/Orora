import {petalSettings} from '../lib/petals';
import '../styles/petals.css';

// Stable seeds prevent a new random arrangement whenever an admin changes a field.
const PETALS=Array.from({length:40},(_,i)=>({left:`${(i*71)%100}%`,variation:(i*5)%12,phase:i*1.7,duration:20+(i*3)%10,sway:`${30+(i*13)%60}px`,tone:i%3}));
export default function Petals({settings,preview=false}) {
 const s=petalSettings(settings);
 if(!s.enabled||!Math.max(s.count,s.mobileCount))return null;
 return <div className={`petals${preview?' is-preview':''}`} aria-hidden="true" style={{'--petal-opacity':s.opacity/100,'--petal-light':s.light,'--petal-color':s.color,'--petal-dark':s.dark}}>
  {PETALS.slice(0,Math.max(s.count,s.mobileCount)).map((p,i)=><i key={i} className={`petal tone-${p.tone}`} style={{left:p.left,width:s.size+p.variation,height:(s.size+p.variation)*1.3,animationDelay:`${-p.phase/s.speed}s`,animationDuration:`${p.duration/s.speed}s`,'--sway':p.sway,'--petal-desktop-display':i<s.count?'block':'none','--petal-mobile-display':i<s.mobileCount?'block':'none'}}/>)}
 </div>;
}
