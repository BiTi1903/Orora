import {useLayoutEffect} from 'react';
import useHomeContent from '../hooks/useHomeContent';
import '../styles/mobile-glass.css';
import {applyGlassSurfaces,watchGlassTabs} from '../lib/glass-surfaces';
export default function MobileGlass(){
 const home=useHomeContent(),s=home.navStyles?.surfaces||{},key=JSON.stringify(s);
 useLayoutEffect(()=>{
  const settings=JSON.parse(key),root=document.documentElement;
  const clear=applyGlassSurfaces(root,settings);
  const stopTabs=watchGlassTabs(document);
  return()=>{stopTabs();clear();};
 },[key]);
 return null;
}
