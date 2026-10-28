import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function useCategories() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!db) return;
    return onSnapshot(doc(db, "settings", "productCategories"), (snapshot) => {
      setCategories(Array.isArray(snapshot.data()?.items) ? snapshot.data().items : []);
      setError(null);
    }, setError);
  }, []);
  return { categories, error };
}
