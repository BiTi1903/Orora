import {useCallback,useEffect,useState} from 'react';
export default function useProducts({enabled=true}={}){
 const [state,setState]=useState({products:[],loaded:false,error:null});
 const [version,setVersion]=useState(0);
 const retry=useCallback(()=>{setState(previous=>({...previous,loaded:false,error:null}));setVersion(value=>value+1);},[]);
 useEffect(()=>{
  if(!enabled)return;
  let alive=true;
  import('../lib/api').then(({getPublicProducts})=>getPublicProducts()).then(list=>{
   if(!Array.isArray(list))throw new Error('Invalid product catalog');
   if(alive)setState({products:list.filter(product=>product.active!==false),loaded:true,error:null});
  }).catch(error=>{if(alive)setState(previous=>({...previous,loaded:true,error}));});
  return()=>{alive=false;};
 },[enabled,version]);
 return {products:state.products,loading:enabled&&!state.loaded,error:enabled?state.error:null,retry};
}
