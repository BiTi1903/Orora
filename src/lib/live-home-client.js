import {doc,onSnapshot} from 'firebase/firestore';
import {db} from './firebase';
export function listenHome(next,error){
 if(!db){next({});return()=>{};}
 return onSnapshot(doc(db,'settings','home'),snapshot=>{window.__ororaLiveHomeReady=true;next(snapshot.exists()?snapshot.data():{});},error);
}
export function listenCategories(next,error){
 if(!db){next([]);return()=>{};}
 return onSnapshot(doc(db,'settings','productCategories'),snapshot=>next(Array.isArray(snapshot.data()?.items)?snapshot.data().items:[]),error);
}
