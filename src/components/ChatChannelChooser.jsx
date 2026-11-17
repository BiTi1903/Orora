import useChatEntrance from "../hooks/useChatEntrance";
import { channelText,channelTextStyle,channelBoxStyle } from "../lib/chat-channel";
import { useEffect,useId,useRef } from 'react';
export default function ChatChannelChooser({ id,zalo,onAI,onClose,settings={},preview=false,dockSide='right',anchor,motion,animatePreview=false }) {
  const titleId=useId(),first=useRef(null),root=useRef(null);
  useChatEntrance(root,anchor,motion,!preview||animatePreview);
  useEffect(()=>{if(preview)return;first.current?.focus({preventScroll:true});const escape=event=>{if(event.key==='Escape'&&!document.querySelector('dialog:modal')){event.preventDefault();onClose();}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[onClose,preview]);
  const config=settings.channel||{},text=key=>channelText(config,key),css=key=>({fontFamily:settings.fontFamily||undefined,...channelTextStyle(config,key)});
  return <section ref={root} id={id} data-dock-side={preview?undefined:dockSide} className={`orora-chat-channel-chooser${preview?" is-preview":""}`} style={{fontFamily:settings.fontFamily||undefined,...channelBoxStyle(config.appearance)}} role="dialog" aria-labelledby={titleId}><header><div><h2 id={titleId} style={css("title")}>{text("title")}</h2><p style={css("subtitle")}>{text("subtitle")}</p></div><button type="button" aria-label="Đóng lựa chọn tư vấn" onClick={onClose}>×</button></header><div className="orora-chat-channel-options">
    {zalo?<a style={channelBoxStyle(config.optionAppearance)} ref={first} href={zalo} target="_blank" rel="noopener noreferrer" onClick={onClose}><strong style={css("zaloTitle")}>{text("zaloTitle")}</strong><span style={css("zaloDescription")}>{text("zaloDescription")}</span></a>:<p className="orora-chat-channel-unavailable" style={css("unavailable")}>{text("unavailable")}</p>}
    <button style={channelBoxStyle(config.optionAppearance)} ref={!zalo?first:undefined} type="button" onClick={onAI}><strong style={css("aiTitle")}>{text("aiTitle")}</strong><span style={css("aiDescription")}>{text("aiDescription")}</span></button>
  </div></section>;
}
