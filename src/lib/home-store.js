// One live reader for all components, with an optional early public shell.
export function createHomeStore({listen,bootstrap=()=>null,onContent=()=>{}}){
 let current={loading:true},stop=null,live=false;
 const listeners=new Set();
 const publish=next=>{current=next;onContent(next);listeners.forEach(fn=>fn());};
 return {
  getSnapshot:()=>current,
  subscribe(fn){
   listeners.add(fn);
   if(listeners.size===1){
    stop=listen(content=>{live=true;publish({...content,loading:false});},()=>publish({...current,loading:false,error:true}));
    Promise.resolve(bootstrap()).then(value=>{if(!live&&value&&typeof value==='object')publish({...current,...value,shellReady:true,loading:current.loading});}).catch(()=>{});
   }
   return()=>{listeners.delete(fn);if(!listeners.size){stop?.();stop=null;}};
  },
 };
}
