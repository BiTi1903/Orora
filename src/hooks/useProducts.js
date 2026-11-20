import {useCallback,useEffect,useState} from 'react';
const CACHE_TTL=30000;
let cached=null;
const freshCache=()=>cached&&Date.now()-cached.at<CACHE_TTL?cached.products:null;

export default function useProducts({enabled=true}={}){
 const [state,setState]=useState(()=>{
  const hit=enabled?freshCache():null;
  return hit?{products:hit,loaded:true,error:null}:{products:[],loaded:false,error:null};
 });
 const [version,setVersion]=useState(0);
 const retry=useCallback(()=>{cached=null;setState(previous=>({...previous,loaded:false,error:null}));setVersion(value=>value+1);},[]);
 const cacheHit=enabled&&version===0&&!state.loaded?freshCache():null;
 useEffect(()=>{
  if(!enabled||cacheHit)return;
  if(version===0&&state.loaded&&freshCache())return;
  let alive=true;
  import('../lib/api').then(({getPublicProducts})=>getPublicProducts()).then(list=>{
   if(!Array.isArray(list))throw new Error('Invalid product catalog');
   const active=list.filter(product=>product.active!==false);
   cached={products:active,at:Date.now()};
   if(alive)setState({products:active,loaded:true,error:null});
  }).catch(error=>{if(alive)setState(previous=>({...previous,loaded:true,error}));});
  return()=>{alive=false;};
 },[enabled,version,cacheHit,state.loaded]);
 const products=cacheHit||state.products;
 const loaded=Boolean(cacheHit)||state.loaded;
 return {products,loading:enabled&&!loaded,error:enabled?state.error:null,retry};
}
