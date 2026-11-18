import {ADMIN_COLOR_DEFAULTS} from '../controls/color-defaults';
import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
export default function DesktopCardSettings({value={},onChange}){
 return <SettingGroup title="Giá và nút trên card — desktop"><details><summary>Kích thước, màu và kiểu chữ riêng cho desktop</summary>
 {[['buttonWidth','Chiều rộng nút Xem (px)',104,72,180],['gap','Khoảng cách các nút (px)',10,4,24],['radius','Bo góc nút (px)',14,0,28],['fontSize','Cỡ chữ nút (px)',13,10,20]].map(([key,label,fallback,min,max])=><label key={key}>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={e=>onChange({[key]:Number(e.target.value)})}/></label>)}
 <label>Căn tên sản phẩm<select value={value.titleAlign||'left'} onChange={e=>onChange({titleAlign:e.target.value})}><option value="left">Trái</option><option value="center">Giữa</option><option value="right">Phải</option></select></label>
 <ColorField label="Nền nút Xem" value={value.background||ADMIN_COLOR_DEFAULTS.buttonPink} onChange={color=>onChange({background:color})}/><ColorField label="Chữ nút Xem" value={value.color||(value.background?ADMIN_COLOR_DEFAULTS.white:ADMIN_COLOR_DEFAULTS.buttonInk)} onChange={color=>onChange({color})}/>
 <StyleTypographyBlock title="Giá trên desktop" style={{fontSize:20,fontWeight:600,fontStyle:'normal',...value.price}} onStyleChange={patch=>onChange({price:{...value.price,...patch}})}/>
 </details><small className="builder-help">Xem trực tiếp trên preview máy tính. Thiết lập này chỉ áp dụng desktop; chữ nút vẫn sửa trong phần Nút sản phẩm.</small></SettingGroup>;
}
