import { useEffect, useState } from "react";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  useEffect(()=>{
    let cancelled=false,stop;
    import('../lib/live-home-client').then(({listenCategories})=>{if(!cancelled)stop=listenCategories(items=>{setCategories(items);setError(null);},setError);}).catch(error=>{if(!cancelled)setError(error);});
    return()=>{cancelled=true;stop?.();};
  },[]);
  return { categories, error };
}
