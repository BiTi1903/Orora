import { useEffect,useId,useRef } from 'react';
export default function ChatChannelChooser({ id,zalo,onAI,onClose }) {
  const titleId=useId(),first=useRef(null);
  useEffect(()=>{first.current?.focus({preventScroll:true});const escape=event=>{if(event.key==='Escape'&&!document.querySelector('dialog:modal')){event.preventDefault();onClose();}};document.addEventListener('keydown',escape);return()=>document.removeEventListener('keydown',escape);},[onClose]);
  return <section id={id} className="orora-chat-channel-chooser" role="dialog" aria-labelledby={titleId}><header><div><h2 id={titleId}>Tư vấn cùng ORORA</h2><p>Bạn muốn trò chuyện qua kênh nào?</p></div><button type="button" aria-label="Đóng lựa chọn tư vấn" onClick={onClose}>×</button></header><div className="orora-chat-channel-options">
    {zalo?<a ref={first} href={zalo} target="_blank" rel="noopener noreferrer" onClick={onClose}><strong>Zalo</strong><span>Liên hệ trực tiếp với ORORA</span></a>:<p className="orora-chat-channel-unavailable">Zalo chưa được cấu hình. Bạn có thể chọn trợ lý bên dưới.</p>}
    <button ref={!zalo?first:undefined} type="button" onClick={onAI}><strong>Trợ lý AI</strong><span>Hỏi sản phẩm, cách dùng và đặt hàng</span></button>
  </div></section>;
}
