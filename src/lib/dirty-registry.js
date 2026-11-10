export function createDirtyRegistry(){
 const sources=new Set();
 return {set:(key,dirty)=>dirty?sources.add(key):sources.delete(key),hasChanges:()=>sources.size>0};
}
export const dirtyRegistry=createDirtyRegistry();
