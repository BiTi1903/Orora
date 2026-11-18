const bounded=(value,fallback,min,max)=>{const n=Number(value??fallback);return Math.max(min,Math.min(max,Number.isFinite(n)?n:fallback));};
const color=(value,fallback)=>/^#[\da-f]{6}$/i.test(value||'')?value:fallback;
export function petalSettings(value={}) {
 const s=value||{};
 return {enabled:s.enabled!==false,count:Math.round(bounded(s.count,10,0,40)),mobileCount:Math.round(bounded(s.mobileCount,0,0,30)),speed:bounded(s.speed,1,.25,3),size:bounded(s.size,10,6,24),opacity:bounded(s.opacity,90,10,100),light:color(s.light,'#ffd6e4'),color:color(s.color,'#f7b8d0'),dark:color(s.dark,'#ee7fa2')};
}
