import { useState } from 'react';
import { CHAT_LABELS, CHAT_TEXT_GROUPS } from '../lib/chat-appearance';
import { SloganTypographyEditor } from './ProductSloganDesign';
export default function ChatTypography({value,onChange}) {
 const [group,setGroup]=useState('title');
 const style=value.textStyles?.[group] || {};
 return <details className="slogan-home-settings"><summary>Chỉnh từng chữ trong khung chat</summary>
 <div className="admin-field"><label htmlFor="chat-text-group">Phần chữ cần chỉnh</label><select id="chat-text-group" value={group} onChange={event=>setGroup(event.target.value)}>{CHAT_TEXT_GROUPS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
 <SloganTypographyEditor title={CHAT_TEXT_GROUPS.find(([key])=>key===group)[1]} body value={style} onChange={patch=>onChange('textStyles',{...value.textStyles,[group]:{...style,...patch}})} />
 <div aria-label="Xem trước kiểu chữ riêng" style={{padding:16,overflowWrap:'anywhere',fontFamily:style.fontFamily||value.fontFamily||'inherit',fontSize:Number(style.fontSize)||16,color:style.color||'#3a1526',fontWeight:style.fontWeight||400,fontStyle:style.fontStyle||'normal',lineHeight:style.lineHeight||1.55}}>Trợ lý ORORA — Nhập câu hỏi của bạn…</div>
 <h3>Nội dung chữ trong khung</h3><p className="admin-muted">Tên trợ lý, lời chào và gợi ý ô nhập chỉnh ở các trường bên dưới. Tin nhắn và tên/giá sản phẩm lấy từ dữ liệu thực tế.</p>
 {Object.entries(CHAT_LABELS).map(([key,fallback])=><div className="admin-field" key={key}><label htmlFor={`chat-label-copy-${key}`}>{({statusAi:'Trạng thái AI',statusGuided:'Trạng thái hỗ trợ cửa hàng',welcomeTitle:'Tiêu đề lời chào',footerAi:'Dòng cuối khi dùng AI',footerGuided:'Dòng cuối khi hỗ trợ tự động',handoff:'Chữ liên hệ nhân viên',typing:'Chữ đang trả lời',retry:'Chữ gửi lại',user:'Nhãn khách hàng',assistant:'Nhãn trợ lý'})[key]}</label><input id={`chat-label-copy-${key}`} maxLength={120} value={value.labels?.[key]??''} placeholder={fallback} onChange={event=>onChange('labels',{...value.labels,[key]:event.target.value})}/></div>)}
 </details>;
}
