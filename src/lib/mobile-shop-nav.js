import {toCss} from './typography.js';
export const MOBILE_NAV_TEXT={homeLabel:'Trang chủ',storyLabel:'Story',productsLabel:'Sản phẩm',trackingLabel:'Tra cứu',title:'Điều hướng mobile',allLabel:'Xem tất cả sản phẩm',emptyLabel:'Danh mục đang được cập nhật.',errorLabel:'Chưa tải được danh mục. Bạn có thể thử lại hoặc xem tất cả sản phẩm.',retryLabel:'Thử tải lại',closeLabel:'Đóng danh mục',safariOpenLabel:'Mở điều hướng',safariCloseLabel:'Thu gọn điều hướng',safariCartCloseLabel:'Đóng giỏ hàng'};
export function mobileNavSettings(value={}){value=value&&typeof value==='object'?value:{};
 const result={...value,height:Math.max(56,Math.min(88,Number(value.height)||64)),iconSize:Math.max(16,Math.min(28,Number(value.iconSize)||22))};
 for(const [key,fallback] of Object.entries(MOBILE_NAV_TEXT))result[key]=typeof value[key]==='string'&&value[key].trim()?value[key]:fallback;
 return result;
}
export function mobileNavTheme(s){return {'--lens-backdrop':s.glass===false?'none':'blur(.5px) saturate(175%) contrast(1.08)','--lens-rim-opacity':s.glass===false?0:Math.max(0,Math.min(1,Number(s.rimOpacity??.8))),'--shop-nav-opacity':s.glass===false?'100%':`${Math.max(35,Math.min(100,Number(s.opacity)||76))}%`,'--shop-nav-blur':`${s.glass===false?0:Math.max(0,Math.min(32,Number(s.blur??20)))}px`,'--shop-nav-radius':`${Math.max(0,Math.min(32,Number(s.radius??24)))}px`,'--shop-nav-bg':s.background||'#fffafc','--shop-nav-color':s.color||'#806671','--shop-nav-accent':s.accent||'#b8446d','--shop-nav-border':s.borderColor||'#efd7e1','--shop-nav-height':`${s.height}px`,'--shop-nav-icon':`${s.iconSize}px`,...toCss(s.textStyle)};}

export const NAV_TARGETS={home:['Trang chủ','/'],story:['Story / Câu chuyện','/#about'],products:['Sản phẩm','/#shop'],email:['Đăng ký email','/#newsletter'],footer:['Footer / Liên hệ','/#contact'],tracking:['Tra cứu','/tra-cuu-don-hang'],custom:['Link tùy chỉnh','']};
export const NAV_ICONS={home:'Nhà',story:'Quyển sách',products:'Túi mua hàng',tracking:'Đơn hàng',email:'Email',heart:'Trái tim',star:'Ngôi sao',link:'Liên kết'};
export function mobileNavItems(s){
 const defaults=['home','story','products','tracking'].filter(key=>s['show'+key[0].toUpperCase()+key.slice(1)]!==false).map(key=>({label:s[key+'Label'],target:key,icon:key}));
 return (Array.isArray(s.items)?s.items:defaults).slice(0,6).map((item,index)=>{
  const target=NAV_TARGETS[item.target]?item.target:'custom';
  const raw=target==='custom'?String(item.url||'').trim():NAV_TARGETS[target][1];
  const to=/^(\/(?!\/)|https?:\/\/|mailto:|tel:)/i.test(raw)&&!/[\s\\]/.test(raw)?raw:'';
  return {...item,id:String(index),target,to,label:String(item.label||NAV_TARGETS[target][0]).slice(0,80),icon:NAV_ICONS[item.icon]?item.icon:'link'};
 }).filter(item=>item.enabled!==false&&item.to);
}
