import { toCss } from "../lib/typography";
import { useState } from 'react';
import { CHAT_LABELS, CHAT_TEXT_GROUPS } from '../lib/chat-appearance';
import { SloganTypographyEditor } from './ProductSloganDesign';
export default function ChatTypography({value,onChange}) {
 const [group,setGroup]=useState('title');
 const style=value.textStyles?.[group] || {};
 const labelKeys=({status:['statusAi','statusGuided'],welcomeTitle:['welcomeTitle'],footer:['footerAi','footerGuided'],handoff:['handoff'],typing:['typing'],author:['user','assistant']})[group] || [];
 const fieldKey=({title:'title',greeting:'greeting',input:'placeholder',placeholder:'placeholder',hint:'hintText'})[group];
 const sample=fieldKey?value[fieldKey]:labelKeys.length?(value.labels?.[labelKeys[0]]||CHAT_LABELS[labelKeys[0]]):group==='user'?'Mình cần tư vấn sản phẩm.':group==='productPrice'?'409.000 đ':group==='productName'?'White Gel - Bodyplex':'ORORA có thể giúp bạn tìm sản phẩm phù hợp.';
 return <div className="chat-typography-editor"><h3>Chỉnh từng chữ trong khung chat</h3>
 <div className="admin-field"><label htmlFor="chat-text-group">Phần chữ cần chỉnh</label><select id="chat-text-group" value={group} onChange={event=>setGroup(event.target.value)}>{CHAT_TEXT_GROUPS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
 <SloganTypographyEditor title={CHAT_TEXT_GROUPS.find(([key])=>key===group)[1]} body value={style} onChange={patch=>onChange('textStyles',{...value.textStyles,[group]:{...style,...patch}})} />
 <div aria-label="Xem trước kiểu chữ riêng" style={{padding:16,overflowWrap:'anywhere',fontFamily:value.fontFamily||'inherit',fontSize:16,color:'#3a1526',...toCss(style),textDecoration:style.textDecoration}}>{sample}</div>
 {fieldKey && <div className="admin-field"><label htmlFor="chat-group-content">Nội dung hiển thị</label><textarea id="chat-group-content" rows={3} maxLength={fieldKey==='greeting'?600:fieldKey==='hintText'?160:fieldKey==='title'?60:100} value={value[fieldKey]||''} onChange={event=>onChange(fieldKey,event.target.value)} /></div>}

 <p className="admin-muted">Kiểu riêng ưu tiên hơn font chung. Tin nhắn AI, nội dung khách và dữ liệu sản phẩm được lấy tự động.</p>
 {Object.entries(CHAT_LABELS).filter(([key])=>labelKeys.includes(key)).map(([key,fallback])=><div className="admin-field" key={key}><label htmlFor={`chat-label-copy-${key}`}>{({statusAi:'Trạng thái AI',statusGuided:'Trạng thái hỗ trợ cửa hàng',welcomeTitle:'Tiêu đề lời chào',footerAi:'Dòng cuối khi dùng AI',footerGuided:'Dòng cuối khi hỗ trợ tự động',handoff:'Chữ liên hệ nhân viên',typing:'Chữ đang trả lời',retry:'Chữ gửi lại',user:'Nhãn khách hàng',assistant:'Nhãn trợ lý'})[key]}</label><input id={`chat-label-copy-${key}`} maxLength={120} value={value.labels?.[key]??''} placeholder={fallback} onChange={event=>onChange('labels',{...value.labels,[key]:event.target.value})}/></div>)}
 </div>;
}
