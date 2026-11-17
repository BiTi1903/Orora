import {useRef,useState} from "react";
import ChatChannelChooser from "../../components/ChatChannelChooser";
import "../../styles/chat-button.css";
import {animateButtonPress} from '../../lib/button-press';
import {SettingGroup} from './ui';

const CHAT_FIELDS=[['chatPanelWidth','Chiều rộng khung chat AI (px)',340,280,440],['chatPanelHeight','Chiều cao khung chat AI (px)',520,280,680],['chatDockGap','Khoảng cách với nút lên đầu khi chat ở bên phải (px)',14,8,32]];
const GLASS_FIELDS=[['opacity','Độ đục (%)',78,45,100],['blur','Độ mờ nền (px)',18,0,30],['frameBlur','Độ mờ khung nội dung (px)',6,0,10],['rimOpacity','Độ đậm viền kính (0–1)',.8,0,1,.05]];
const TOGGLES=[['header','Navbar trên'],['chat','Nút chat'],['top','Nút lên đầu'],['tabs','Thanh thông tin sản phẩm'],['close','Nút đóng popup'],['chatStretch','Kéo giãn nút chat như giọt nước'],['buttons','Các nút trên mobile'],['frames','Các khung nội dung trên mobile'],['rims','Viền kính trên mobile']];
export default function SurfaceSettings({value={},onChange}){
 const [previewChat,setPreviewChat]=useState(false);
 const chatAnchor=useRef(null);
 const fields=items=>items.map(([key,label,fallback,min,max,step=1])=><label className="builder-field" key={key}>{label}<input type="number" min={min} max={max} step={step} value={value[key]??fallback} onChange={e=>onChange({[key]:Number(e.target.value)})}/></label>);
 return <>
  <SettingGroup title="Hiệu ứng nhấn nút — website và admin">
   <label className="admin-check"><input type="checkbox" role="switch" checked={value.pressFeedback!==false} onChange={e=>onChange({pressFeedback:e.target.checked})}/>Hiệu ứng nhấn cho toàn bộ nút</label>
   {fields([['pressDuration','Thời gian phản hồi nút (ms)',240,120,500,20],['pressDepth','Độ nhún khi nhấn (%)',4,2,10]])}
   <button type="button" className="admin-btn" data-press-preview onClick={event=>animateButtonPress(event.currentTarget,false,value)}>Nhấn thử hiệu ứng</button>
   <small className="builder-help">Áp dụng desktop, mobile và admin; nút chat nảy rõ hơn. Hiệu ứng tự tắt khi thiết bị yêu cầu giảm chuyển động. Lưu tất cả để áp dụng.</small>
  </SettingGroup>
  <SettingGroup title="Hiệu ứng mở form chat">
   <label className="admin-check"><input type="checkbox" role="switch" checked={value.chatPopupAnimation!==false} onChange={e=>onChange({chatPopupAnimation:e.target.checked})}/>Mở form chat từ nút chat</label>
   {fields([['chatPopupDuration','Thời gian mở form chat (ms)',420,200,700,20]])}
   <button type="button" className="admin-btn" ref={chatAnchor} onClick={()=>setPreviewChat(v=>!v)}>{previewChat?'Đóng xem trước chat':'Xem thử mở form chat'}</button>
   {previewChat&&<div data-admin-preview><ChatChannelChooser anchor={chatAnchor} motion={value} preview animatePreview onAI={()=>{}} onClose={()=>setPreviewChat(false)}/></div>}
   <small className="builder-help">Khung lớn dần từ vị trí nút mở, không bật hai lần; áp dụng cả khung chọn Zalo/AI và hội thoại AI.</small>
  </SettingGroup>
  <SettingGroup title="Vị trí nút lên đầu trang">
   {fields([["backToTopOffset","Khoảng cách mép dưới — desktop (px)",24,8,80],["backToTopMobileOffset","Khoảng hở trên thanh dưới — mobile (px)",12,8,40]])}
  </SettingGroup>
  <SettingGroup title="Kích thước và vị trí khung chat AI">
   {fields(CHAT_FIELDS)}
   <small className="builder-help">Áp dụng cả desktop và mobile; khung tự thu vừa màn hình. Nội dung và kiểu chữ chỉnh tại Chat AI.</small>
  </SettingGroup>
  <SettingGroup title="Hiệu ứng kính — chỉ mobile">
   <details><summary>Thành phần áp dụng và chất liệu</summary>
    {TOGGLES.map(([key,label])=><label className="admin-check" key={key}><input type="checkbox" role="switch" checked={value[key]!==false} onChange={e=>onChange({[key]:e.target.checked})}/>{label}</label>)}
    {fields(GLASS_FIELDS)}
    <small className="builder-help">Chọn Mobile trên Preview để kiểm tra. Nền hội thoại AI luôn giữ đặc để dễ đọc.</small>
   </details>
  </SettingGroup>
 </>;
}
