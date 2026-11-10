import {useMemo,useEffect,useId,useRef} from 'react';
import {dirtyRegistry} from '../lib/dirty-registry';

// Never store draft contents (including customer information) in browser storage.
export default function useDraftGuard(value,{enabled=true,busy=false}={}){
 const id=useId(),baseline=useRef(null),serialized=JSON.stringify(value);
 useEffect(()=>{
  if(!enabled){baseline.current=null;dirtyRegistry.set(id,false);return;}
  if(baseline.current===null)baseline.current=serialized;
  const dirty=busy||baseline.current!==serialized;
  dirtyRegistry.set(id,dirty);
  const leave=event=>{if(dirtyRegistry.hasChanges()){event.preventDefault();event.returnValue='';}};
  window.addEventListener('beforeunload',leave);
  return()=>{dirtyRegistry.set(id,false);window.removeEventListener('beforeunload',leave);};
 },[id,serialized,enabled,busy]);
 return useMemo(()=>{const markSaved=(saved=value)=>{baseline.current=JSON.stringify(saved);dirtyRegistry.set(id,false);};markSaved.hasChanges=()=>enabled&&(busy||baseline.current!==serialized);return markSaved;},[id,value,serialized,enabled,busy]);
}
