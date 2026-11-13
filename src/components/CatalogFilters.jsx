import {useId,useState} from 'react';
import {toCss} from '../lib/typography';
import {activeCatalogFilters,catalogFilterSettings} from '../lib/catalog-filters';
import '../styles/catalog-filters.css';
function Fields({draft,setDraft,categories,s,onSubmit,error}){
 const id=useId(),css=key=>toCss(s[key]);
 return <form aria-label={s.filterLabel} className="catalog-filter-form" onSubmit={onSubmit}>
  <label style={css('labels')} htmlFor={`${id}-category`}>{s.categoryLabel}<select id={`${id}-category`} value={draft.category} style={css('inputs')} onChange={event=>setDraft(old=>({...old,category:event.target.value}))}><option value="">{s.allCategory}</option>{draft.category&&!categories.some(c=>c.id===draft.category)&&<option value={draft.category}>{s.unknownCategory}</option>}{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label style={css('labels')} htmlFor={`${id}-sort`}>{s.sortLabel}<select id={`${id}-sort`} value={draft.sort} style={css('inputs')} onChange={event=>setDraft(old=>({...old,sort:event.target.value}))}><option value="default">{s.defaultSort}</option><option value="priceAsc">{s.priceAsc}</option><option value="priceDesc">{s.priceDesc}</option></select></label>
  <button type="submit" className="catalog-filter-apply" style={css('buttons')}>{s.applyLabel}</button>
  {error&&<p className="catalog-filter-error" role="alert" style={css('labels')}>{error}</p>}
 </form>;
}
export default function CatalogFilters({value,activeView,categories=[],settings={},onApply,onReset}){
 const panelId=useId();
 const s=catalogFilterSettings(settings),key=JSON.stringify(value),[oldKey,setOldKey]=useState(key),[draft,setDraft]=useState(value),[open,setOpen]=useState(false),[error,setError]=useState('');
 if(oldKey!==key){setOldKey(key);setDraft(value);setError('');}
 const apply=event=>{
  event.preventDefault();const next={...draft,volume:'',price:'all',q:'',min:'',max:'',page:1};if(next.price==='contact'){next.min='';next.max='';}
  if([next.min,next.max].some(v=>v!==''&&(!/^\d+$/.test(v)||Number(v)>1000000000))){setError(s.invalidPrice);return;}
  if(next.min!==''&&next.max!==''&&Number(next.min)>Number(next.max)){setError(s.invalidRange);return;}
  setError('');onApply(next);setOpen(false);
 };
 const style={'--catalog-accent':s.accent||'#b8446d','--catalog-bg':s.background||'#fffafc','--catalog-border':s.borderColor||'#efd7e1','--catalog-radius':`${Math.max(0,Math.min(32,Number(s.radius??14)))}px`};
 const fields=<Fields draft={draft} setDraft={setDraft} categories={categories} s={s} onSubmit={apply} error={error}/>;
 return <div className="catalog-toolbar" style={style}>
  <div className="catalog-filter-mobile"><button type="button" aria-expanded={open} aria-controls={panelId} style={toCss(s.buttons)} onClick={()=>{setDraft(value);setError('');setOpen(!open);}}>{s.filterLabel}{activeCatalogFilters(value)>0&&<span>{activeCatalogFilters(value)}</span>}</button></div>
  <div className="catalog-result-tools">{activeCatalogFilters(value)>0&&<button type="button" className="catalog-filter-clear" style={toCss(s.buttons)} onClick={onReset}>{s.clearLabel}</button>}{s.showViewToggle!==false&&<div className="catalog-view-switch" role="group" aria-label={s.viewLabel}>{[['grid',s.gridLabel],['carousel',s.carouselLabel]].map(([view,label])=><button type="button" key={view} aria-label={label} title={label} aria-pressed={activeView===view} style={toCss(s.buttons)} onClick={()=>onApply({...value,view,page:1})}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">{view==='grid'?<path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/>:<path d="M7 4h10v16H7zM3 7v10M21 7v10"/>}</svg><span>{label}</span></button>)}</div>}</div>
  {open&&<div id={panelId} className="catalog-filter-inline">{fields}</div>}
 </div>;
}
