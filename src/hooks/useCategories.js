import { useCallback, useEffect, useState } from "react";

export default function useCategories() {
  const [version,setVersion]=useState(0);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const retry=useCallback(()=>{setError(null);setVersion(value=>value+1);},[]);
  useEffect(()=>{
    let cancelled=false,stop;
    import('../lib/live-home-client').then(({listenCategories})=>{if(!cancelled)stop=listenCategories(items=>{setCategories(items);setError(null);},setError);}).catch(error=>{if(!cancelled)setError(error);});
    return()=>{cancelled=true;stop?.();};
  },[version]);
  return { categories, error, retry };
}
