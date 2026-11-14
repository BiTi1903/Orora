// The navbar owns the anchor; the cart retains its single state and dialog.
let target=null;
const listeners=new Set();
const notify=()=>listeners.forEach(listener=>listener());
export const getNavbarCartSlot=()=>target;
export function subscribeNavbarCartSlot(listener){listeners.add(listener);return()=>listeners.delete(listener);}
export function mountNavbarCartSlot(node){
 if(!node)return;
 target=node;notify();
 return()=>{if(target===node){target=null;notify();}};
}
