import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, translatePhrase } from "../lib/i18n";
import { applySheet } from "../lib/translation-rows";

export default function useCategories() {
  const locale = useLocale();
  const isAdmin = typeof window !== "undefined" && window.location?.pathname?.startsWith("/admin");
  const [version,setVersion]=useState(0);
  const [rawCategories, setCategories] = useState([]);
  const [categoryDoc, setCategoryDoc] = useState(null);
  const [error, setError] = useState(null);
  const retry=useCallback(()=>{setError(null);setVersion(value=>value+1);},[]);
  useEffect(()=>{
    let cancelled=false,stop;
    import('../lib/live-home-client').then(({listenCategories})=>{
      if(!cancelled)stop=listenCategories((items,docData)=>{setCategories(items);setCategoryDoc(docData||null);setError(null);},setError);
    }).catch(error=>{if(!cancelled)setError(error);});
    return()=>{cancelled=true;stop?.();};
  },[version]);
  const categories = useMemo(() => {
    if (isAdmin || locale === "vi") return rawCategories;
    const fallbackItems = rawCategories.map((c) => ({ ...c, name: translatePhrase(c.name, locale) }));
    if (!categoryDoc?.translationSheet) return fallbackItems;
    const applied = applySheet({ ...categoryDoc, items: fallbackItems }, categoryDoc, "categories", locale);
    return Array.isArray(applied?.items) ? applied.items : fallbackItems;
  }, [rawCategories, categoryDoc, locale, isAdmin]);
  return { categories, error, retry };
}
