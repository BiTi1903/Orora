import { toCss } from './typography.js';
export const CHANNEL_FIELDS=[
 ['title','Tiêu đề','Tư vấn cùng ORORA'],
 ['subtitle','Dòng giới thiệu','Bạn muốn trò chuyện qua kênh nào?'],
 ['zaloTitle','Tên lựa chọn Zalo','Zalo'],
 ['zaloDescription','Mô tả Zalo','Liên hệ trực tiếp với ORORA'],
 ['aiTitle','Tên lựa chọn AI','Trợ lý AI'],
 ['aiDescription','Mô tả AI','Hỏi sản phẩm, cách dùng và đặt hàng'],
 ['unavailable','Thông báo khi chưa có Zalo','Zalo chưa được cấu hình. Bạn có thể chọn trợ lý bên dưới.'],
];
export function channelText(value,key){return value?.[key]??CHANNEL_FIELDS.find(([field])=>field===key)?.[2]??'';}
export function channelTextStyle(value,key){const style=value?.textStyles?.[key]||{};return {...toCss(style),textDecoration:style.textDecoration};}
export function channelBoxStyle(value={}){
 const style={};
 for(const key of ['backgroundColor','borderColor'])if(value[key])style[key]=value[key];
 for(const key of ['borderRadius','padding','borderWidth'])if(value[key]!==''&&Number.isFinite(Number(value[key])))style[key]=Math.max(0,Math.min(80,Number(value[key])));
 return style;
}
