import {toCss} from './typography.js';

export const CART_BUTTON_FIELDS=[
 ['maxWidth','Chiều rộng tối đa nút (px)',240,80,360],
 ['height','Chiều cao tối thiểu nút (px)',40,32,80],
 ['paddingX','Đệm ngang nút (px)',12,0,40],
 ['paddingY','Đệm dọc nút (px)',8,0,24],
 ['radius','Bo góc nút (px)',14,0,40],
 ['borderWidth','Độ dày viền nút (px)',1,0,4],
 ['iconSize','Kích thước icon giỏ (px)',20,12,36],
 ['gap','Khoảng cách icon và chữ (px)',6,0,24],
];
export const CART_SELECTION_FIELDS=[
 ['width','Chiều rộng popup desktop (px)',360,280,600],
 ['mobileWidth','Chiều rộng popup mobile (px)',360,260,600],
 ['padding','Đệm trong popup (px)',16,8,32],
 ['radius','Bo góc popup (px)',20,0,40],
 ['gap','Khoảng cách các nhóm chọn (px)',12,4,24],
];
export const CART_MODAL_FIELDS=[
 ['modalWidth','Chiều rộng khung giỏ hàng desktop (px)',520,340,760],
 ['modalRadius','Bo góc khung giỏ hàng (px)',22,0,36],
 ['modalPadding','Đệm trong giỏ hàng (px)',16,8,32],
 ['imageRadius','Bo góc ảnh sản phẩm (px)',10,0,24],
 ['quantityRadius','Bo góc khung số lượng (px)',11,0,24],
];
const bounded=(value,fallback,min,max)=>{
 const n=value==null||value===''?fallback:Number(value);
 return Math.max(min,Math.min(max,Number.isFinite(n)?n:fallback));
};
function variables(fields,value,prefix){return Object.fromEntries(fields.map(([key,,fallback,min,max])=>[`--${prefix}-${key}`,`${bounded(value[key],fallback,min,max)}px`]));}
export function cartButtonStyle(settings={}){
 const value=settings.navbarButton||{};
 return {...variables(CART_BUTTON_FIELDS,value,'cart-button'),'--cart-accent':settings.accent||'#b8446d','--cart-button-bg':value.background||'#fffafc','--cart-button-border':value.borderColor||'var(--line)',...(value.background?{background:value.background}:{}),...(value.borderColor?{borderColor:value.borderColor}:{}),...toCss({...settings.text,...value.text})};
}
export function cartSelectionStyle(settings={}){
 const value=settings.selectionPopup||{};
 return {...variables(CART_SELECTION_FIELDS,value,'cart-selection'),'--cart-selection-bg':value.background||'#fffafb','--cart-selection-border':value.borderColor||'var(--line)','--cart-accent':settings.accent||'#b8446d',...(value.background?{backgroundColor:value.background}:{}),...(value.borderColor?{borderColor:value.borderColor}:{}),...toCss(value.text)};
}
export function cartModalStyle(settings={}){
 return {
  ...variables(CART_MODAL_FIELDS,settings,'cart'),
  '--cart-accent':settings.accent||'#b8446d',
  ...(settings.modalBackground?{'--cart-modal-bg':settings.modalBackground,background:settings.modalBackground}:{}),
  ...(settings.modalBorderColor?{'--cart-modal-border':settings.modalBorderColor,borderColor:settings.modalBorderColor}:{}),
  ...(settings.dividerColor?{'--cart-divider':settings.dividerColor}:{}),
  ...(settings.headerBackground?{'--cart-header-bg':settings.headerBackground}:{}),
  ...(settings.closeColor?{'--cart-close-color':settings.closeColor}:{}),
  ...(settings.closeBackground?{'--cart-close-bg':settings.closeBackground}:{}),
  ...(settings.closeBorderColor?{'--cart-close-border':settings.closeBorderColor}:{}),
  ...(settings.quantityBackground?{'--cart-qty-bg':settings.quantityBackground}:{}),
  ...(settings.quantityBorderColor?{'--cart-qty-border':settings.quantityBorderColor}:{}),
  ...(settings.quantityTextColor?{'--cart-qty-color':settings.quantityTextColor}:{}),
  ...toCss(settings.text,{responsive:true}),
 };
}
export function cartActionButtonStyle(btn={},defaults={}){
 return {
  ...(btn.background?{background:btn.background}:{}),
  ...(btn.borderColor?{borderColor:btn.borderColor}:{}),
  ...(btn.radius!=null?{borderRadius:`${bounded(btn.radius,defaults.radius??10,0,28)}px`}:{}),
  ...(btn.height!=null?{minHeight:`${bounded(btn.height,defaults.height??36,28,64)}px`}:{}),
  ...toCss(btn.text,{responsive:true}),
 };
}
