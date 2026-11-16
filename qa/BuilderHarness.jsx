import {useEffect,useState} from 'react';
import Builder from '../src/admin/builder/VisualBuilder';
export default function BuilderHarness(){
 const [workspace,setWorkspace]=useState('home'),[request,setRequest]=useState({section:'cart',version:0});
 useEffect(()=>{const open=event=>{setWorkspace('store');setRequest(value=>({section:event.detail.section,version:value.version+1}));};window.addEventListener('orora-admin-store',open);return()=>window.removeEventListener('orora-admin-store',open);},[]);
 return <><button type="button" onClick={()=>setWorkspace('home')}>Về giao diện</button><Builder workspace={workspace} requestedStoreSection={request.section} requestedStoreVersion={request.version}/></>;
}
