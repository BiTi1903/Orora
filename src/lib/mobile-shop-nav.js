import {toCss} from './typography.js';
export const MOBILE_NAV_TEXT={homeLabel:'Trang chủ',storyLabel:'Story',productsLabel:'Sản phẩm',trackingLabel:'Tra cứu',title:'Điều hướng mobile',allLabel:'Xem tất cả sản phẩm',emptyLabel:'Danh mục đang được cập nhật.',errorLabel:'Chưa tải được danh mục. Bạn có thể thử lại hoặc xem tất cả sản phẩm.',retryLabel:'Thử tải lại',closeLabel:'Đóng danh mục'};
export function mobileNavSettings(value={}){value=value&&typeof value==='object'?value:{};
 const result={...value,height:Math.max(56,Math.min(88,Number(value.height)||64)),iconSize:Math.max(16,Math.min(28,Number(value.iconSize)||22))};
 for(const [key,fallback] of Object.entries(MOBILE_NAV_TEXT))result[key]=typeof value[key]==='string'&&value[key].trim()?value[key]:fallback;
 return result;
}
export function mobileNavTheme(s){return {'--shop-nav-bg':s.background||'#fffafc','--shop-nav-color':s.color||'#806671','--shop-nav-accent':s.accent||'#b8446d','--shop-nav-border':s.borderColor||'#efd7e1','--shop-nav-height':`${s.height}px`,'--shop-nav-icon':`${s.iconSize}px`,...toCss(s.textStyle)};}
