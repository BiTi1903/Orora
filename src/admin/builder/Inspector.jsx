import {CompactInspectorContext} from "./inspector-context";
import {useContext,useId,useMemo,useRef,useState} from 'react';

export function InspectorGroup({title,description,children,open=false}){
 const [visited,setVisited]=useState(open);
 const scope=useContext(CompactInspectorContext);
 const nestedScope=useMemo(()=>scope?{...scope,nested:true}:null,[scope]);
 return <details name={scope&&!scope.nested?scope.groupName:undefined} className="inspector-group" open={open} onToggle={event=>{if(event.currentTarget.open)setVisited(true);}}>
  <summary>{title}</summary>
  {description&&<p className="builder-help">{description}</p>}
  <div className="inspector-group-content"><CompactInspectorContext.Provider value={nestedScope}>{visited&&children}</CompactInspectorContext.Provider></div>
 </details>;
}

export default function Inspector({title,selectionKey,selected,settings,elementOptions=[],selectedElement,onSelect,sectionLabel,sourceNote}){
 const id=useId(),tabs=useRef(null),selectedRoot=useRef(null);
 const scope=useMemo(()=>({root:selectedRoot,selectionKey,groupName:`${id}-groups`}),[id,selectionKey]);
 const [tab,setTab]=useState('selected'),[previous,setPrevious]=useState(selectionKey);
 const [visitedSettings,setVisitedSettings]=useState(false);
 const chooseTab=next=>{if(next==='settings')setVisitedSettings(true);setTab(next);};
 if(previous!==selectionKey){setPrevious(selectionKey);setTab('selected');}
 const moveTab=event=>{
  let next;
  if(['ArrowLeft','ArrowRight'].includes(event.key))next=tab==='selected'?'settings':'selected';
  if(event.key==='Home')next='selected';
  if(event.key==='End')next='settings';
  if(!next)return;
  event.preventDefault();chooseTab(next);
  tabs.current.querySelector(`[data-inspector-tab="${next}"]`)?.focus();
 };
 return <div className="builder-inspector">
  <header className="inspector-heading">
   <small>{sectionLabel||'ĐANG CHỈNH SỬA'}</small><h2>{title}</h2>
   {elementOptions.length>0&&<div className="inspector-element-picker"><label htmlFor={`${id}-element`}>Chọn thành phần cần sửa</label><select id={`${id}-element`} value={selectedElement} onChange={event=>onSelect?.(event.target.value)}>{!elementOptions.some(option=>option.value===selectedElement)&&<option value={selectedElement}>{title}</option>}{elementOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></div>}
   <p>Chọn từ danh sách hoặc bấm vào bản xem trước. Mở nhóm cần chỉnh ở bên dưới.</p>
   {sourceNote&&<p className="inspector-source-note">{sourceNote}</p>}
  </header>
  {settings&&<div ref={tabs} className="inspector-tabs" role="tablist" aria-label="Nhóm chỉnh sửa" onKeyDown={moveTab}>
   {[['selected','Đang chọn'],['settings','Thiết lập mục']].map(([key,label])=><button type="button" role="tab" id={`${id}-${key}`} aria-controls={`${id}-${key}-panel`} aria-selected={tab===key} tabIndex={tab===key?0:-1} data-inspector-tab={key} onClick={()=>chooseTab(key)} key={key}>{label}</button>)}
  </div>}
  <div ref={selectedRoot} role={settings?'tabpanel':undefined} aria-labelledby={settings?`${id}-selected`:undefined} id={`${id}-selected-panel`} hidden={tab!=='selected'} inert={tab!=='selected'}><CompactInspectorContext.Provider value={scope}>{selected}</CompactInspectorContext.Provider></div>
  {settings&&visitedSettings&&<div role="tabpanel" aria-labelledby={`${id}-settings`} id={`${id}-settings-panel`} hidden={tab!=='settings'} inert={tab!=='settings'}>
   <p className="inspector-settings-help">Thiết lập chung của mục này. Mở nhóm cần sửa; dữ liệu chỉ được lưu khi bấm Lưu tất cả.</p>{settings}
  </div>}
 </div>;
}
