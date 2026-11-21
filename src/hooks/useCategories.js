import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, translatePhrase } from "../lib/i18n";

export default function useCategories() {
  const locale = useLocale();
  const isAdmin = typeof window !== "undefined" && window.location?.pathname?.startsWith("/admin");
  const [version,setVersion]=useState(0);
  const [rawCategories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const retry=useCallback(()=>{setError(null);setVersion(value=>value+1);},[]);
  useEffect(()=>{
    let cancelled=false,stop;
    import('../lib/live-home-client').then(({listenCategories})=>{if(!cancelled)stop=listenCategories(items=>{setCategories(items);setError(null);},setError);}).catch(error=>{if(!cancelled)setError(error);});
    return()=>{cancelled=true;stop?.();};
  },[version]);
  const categories = useMemo(
    () => (isAdmin || locale === "vi") ? rawCategories : rawCategories.map((c) => ({ ...c, name: translatePhrase(c.name, locale) })),
    [rawCategories, locale, isAdmin]
  );
  return { categories, error, retry };
}
