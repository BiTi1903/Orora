import {useId,useState} from 'react';
import {toCss} from '../lib/typography';
import {catalogFilterSettings} from '../lib/catalog-filters';
import {useLocale,translatePhrase} from '../lib/i18n';
import '../styles/catalog-filters.css';
export default function CatalogFilters({value,activeView,settings={},onApply}){
 const locale=useLocale();
 const isAdmin=typeof window!=='undefined'&&window.location?.pathname?.startsWith('/admin');
 const tr=val=>(!isAdmin&&locale!=='vi')?translatePhrase(val,locale):val;
 const s=catalogFilterSettings(settings),panelId=useId(),[open,setOpen]=useState(false);
 const low=tr(['Giá thấp đến cao','Giá tăng dần'].includes(s.priceAsc)?'Giá thấp':s.priceAsc);
 const high=tr(['Giá cao đến thấp','Giá giảm dần'].includes(s.priceDesc)?'Giá cao':s.priceDesc);
 const style={'--catalog-accent':s.accent||'#b8446d','--catalog-bg':s.background||'#fffafc','--catalog-border':s.borderColor||'#efd7e1','--catalog-radius':`${Math.max(0,Math.min(32,Number(s.radius??14)))}px`};
 const sort=next=>onApply({...value,sort:value.sort===next?'default':next,page:1});
 return <div className="catalog-toolbar" style={style}>
  <div className="catalog-filter-mobile"><button type="button" aria-expanded={open} aria-controls={panelId} style={toCss(s.buttons)} onClick={()=>setOpen(!open)}>{tr(s.filterLabel)}</button></div>
  <div className="catalog-result-tools">{s.showViewToggle!==false&&<div className="catalog-view-switch" role="group" aria-label={tr(s.viewLabel)}>{[['grid',tr(s.gridLabel)],['carousel',tr(s.carouselLabel)]].map(([view,label])=><button type="button" key={view} aria-label={label} title={label} aria-pressed={activeView===view} style={toCss(s.buttons)} onClick={()=>onApply({...value,view,page:1})}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{view==='grid'?<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>:<path d="M7 4h10v16H7zM3 7v10M21 7v10"/>}</svg><span>{label}</span></button>)}</div>}</div>
  {open&&<div id={panelId} className="catalog-price-pills" role="group" aria-label={tr(s.sortLabel)}>{[['priceAsc',low,'↓'],['priceDesc',high,'↑']].map(([key,label,icon])=><button key={key} type="button" aria-pressed={value.sort===key} style={toCss(s.buttons)} onClick={()=>sort(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}</div>}
 </div>;
}
