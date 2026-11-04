import { toCss } from './typography.js';
export const CHAT_TEXT_GROUPS = [
 ['hint','Lời nhắc cạnh nút chat','.orora-chat-hint-message'],
 ['title','Tên trợ lý','.orora-chat-heading h2'], ['status','Dòng trạng thái','.orora-chat-heading p'],
 ['welcomeTitle','Tiêu đề lời chào','.orora-chat-welcome h3'], ['greeting','Nội dung lời chào','.orora-chat-welcome p'],
 ['assistant','Tin nhắn trợ lý','.is-assistant > p'], ['user','Tin nhắn khách','.is-user > p'],
 ['choices','Lựa chọn ban đầu','.orora-chat-starters button'], ['followups','Câu hỏi tiếp theo','.orora-chat-followups button'],
 ['input','Ô nhập câu hỏi','.orora-chat-composer textarea'], ['placeholder','Chữ gợi ý ô nhập','.orora-chat-composer textarea::placeholder'],
 ['footer','Dòng thông tin cuối khung','.orora-chat-footer-note small'], ['handoff','Chữ Gặp ORORA','.orora-chat-footer-note a'],
 ['productName','Tên sản phẩm','.orora-chat-product strong'], ['productPrice','Giá sản phẩm','.orora-chat-product b'],
 ['links','Đường dẫn','.orora-chat-links a'], ['author','Tên người gửi','.orora-chat-message-author'],
 ['typing','Trạng thái đang trả lời','.orora-chat-typing small'], ['notice','Thông báo hỗ trợ','.orora-chat-notice'],
];
export const CHAT_LABELS = {
 statusAi:'Trợ lý AI tư vấn sản phẩm', statusGuided:'Hỗ trợ mua sắm cùng ORORA', welcomeTitle:'ORORA lắng nghe bạn',
 footerAi:'Trợ lý AI · Thông tin từ ORORA', footerGuided:'Trả lời theo thông tin cửa hàng', handoff:'Gặp ORORA', typing:'ORORA đang trả lời…', retry:'Thử gửi lại', user:'Bạn', assistant:'ORORA'
};
export function chatAppearanceVars(settings) {
 const vars = settings.fontFamily ? {'--chat-font':settings.fontFamily} : {};
 for(const [key] of CHAT_TEXT_GROUPS) for(const [property,value] of Object.entries({...toCss(settings.textStyles?.[key]), ...(["none","underline","line-through","underline line-through"].includes(settings.textStyles?.[key]?.textDecoration) ? {textDecoration:settings.textStyles[key].textDecoration} : {})})) {
  const name = property === '--mobile-font-size' ? 'mobile-size' : property.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase());
  vars[`--chat-${key}-${name}`]=value;
 }
 return vars;
}
