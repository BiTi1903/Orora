import {createContext,useContext,createElement,cloneElement,isValidElement} from 'react';
import {BUTTON_ICON_PATHS,BUTTON_ICON_DEFAULTS} from '../lib/button-icons';
const IconContext=createContext({});
export function ButtonIconProvider({value,children}) {return <IconContext.Provider value={value||{}}>{children}</IconContext.Provider>;}
export default function ButtonIcon({name,children,defaultSize=16,allowHidden=true}) {
 const settings=useContext(IconContext)[name]||{};
 const kind=settings.kind||'default';
 if(kind==='none'&&allowHidden)return null;
 const size=settings.size!=null&&settings.size!==''?Math.max(8,Math.min(48,Number(settings.size)||defaultSize)):undefined;
 const original=BUTTON_ICON_DEFAULTS[name];
 let content=children??(original?.text||null);
 if(BUTTON_ICON_PATHS[kind])content=<svg width={size||defaultSize} height={size||defaultSize} style={{width:size,height:size}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={BUTTON_ICON_PATHS[kind]}/></svg>;
 else if(!content&&original?.shapes)content=<svg {...original.props}>{original.shapes.map(({tag,props},index)=>createElement(tag,{...props,key:index}))}</svg>;
 if(size&&isValidElement(content)&&content.type==='svg')content=cloneElement(content,{width:size,height:size,style:{...content.props.style,width:size,height:size,flex:'none'}});
 return <span className="orora-button-icon" data-button-icon={name} data-icon-size={size} aria-hidden="true" style={{color:settings.color||undefined,fontSize:size,width:size,height:size}}>{content}</span>;
}
