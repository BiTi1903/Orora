export function reviewCardStyle(value={}){
 value=value&&typeof value==='object'?value:{};
 const bounded=(raw,fallback,max)=>{const n=Number(raw??fallback);return Math.max(0,Math.min(max,Number.isFinite(n)?n:fallback));};
 return {borderRadius:`${bounded(value.radius,26,48)}px`,borderWidth:`${bounded(value.borderWidth,1.5,4)}px`,borderColor:value.borderColor||undefined};
}
