import {CART_COPY} from '../../lib/cart-copy';
import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
import {NAV_TARGETS,NAV_ICONS,mobileNavItems,mobileNavSettings} from '../../lib/mobile-shop-nav';
import MobileShopNav from '../../components/MobileShopNav';

export default function MobileNavSettings({navbar,onChange}){
 const value=navbar.navStyles?.mobile||{},patch=next=>onChange({navStyles:{...navbar.navStyles,mobile:{...value,...next}}});
 const items=Array.isArray(value.items)?value.items:mobileNavItems(mobileNavSettings(value));
 const edit=(index,next)=>patch({items:items.map((item,i)=>i===index?{...item,...next}:item)});
 return <SettingGroup title="Thanh điều hướng dưới — mobile">
  <label className="admin-check"><input type="checkbox" checked={value.enabled!==false} onChange={event=>patch({enabled:event.target.checked})}/>Hiện thanh cố định dưới màn hình điện thoại</label>
  <label className="admin-check"><input type="checkbox" checked={value.afterTicker!==false} onChange={e=>patch({afterTicker:e.target.checked})}/>Trang chủ: hiện khi cuộn xuống đủ chỗ, không che dải chữ chạy</label>
  <label>Khoảng hở với dải chữ chạy (px)<input type="number" min="0" max="48" value={value.revealGap??12} onChange={e=>patch({revealGap:Number(e.target.value)})}/></label>
  <label className="admin-check"><input type="checkbox" checked={value.spin!==false} onChange={e=>patch({spin:e.target.checked})}/>Xoay icon khi nhấn mục trên thanh dưới</label>
  <div className="builder-field">
   {items.map((item,index)=><fieldset key={index} style={{margin:'12px 0',padding:12,border:'1px solid #efd7e1',borderRadius:12}}><legend>Mục {index+1}</legend>
    <label>Tên hiển thị<input value={item.label||''} maxLength={80} onChange={e=>edit(index,{label:e.target.value})}/></label>
    <label>Đi đến<select value={item.target||'custom'} onChange={e=>edit(index,{target:e.target.value})}>{Object.entries(NAV_TARGETS).map(([key,[label]])=><option key={key} value={key}>{label}</option>)}</select></label>
    {item.target==='custom'&&<label>Đường dẫn<input placeholder="https://… hoặc /#newsletter" value={item.url||''} onChange={e=>edit(index,{url:e.target.value})}/></label>}
    <label>Biểu tượng<select value={item.icon||'link'} onChange={e=>edit(index,{icon:e.target.value})}>{Object.entries(NAV_ICONS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <label><input type="checkbox" checked={item.enabled!==false} onChange={e=>edit(index,{enabled:e.target.checked})}/>Hiển thị mục này</label>
    <button type="button" disabled={!index} onClick={()=>{const next=[...items];[next[index-1],next[index]]=[next[index],next[index-1]];patch({items:next});}}>Đưa lên trước</button>
    <button type="button" onClick={()=>patch({items:items.filter((_,i)=>i!==index)})}>Xóa mục</button>
   </fieldset>)}
   <button type="button" disabled={items.length>=6} onClick={()=>patch({items:[...items,{label:'Email',target:'email',icon:'email'}]})}>Thêm mục</button>
  </div>
  <details><summary>Giỏ hàng — nội dung và kiểu hiển thị</summary>
   <label><input type="checkbox" checked={navbar.navStyles?.cart?.enabled!==false} onChange={e=>onChange({navStyles:{...navbar.navStyles,cart:{...navbar.navStyles?.cart,enabled:e.target.checked}}})}/>Hiện giỏ hàng</label>
   <label><input type="checkbox" checked={navbar.navStyles?.cart?.animation!==false} onChange={e=>onChange({navStyles:{...navbar.navStyles,cart:{...navbar.navStyles?.cart,animation:e.target.checked}}})}/>Hiệu ứng bay và nảy vào giỏ</label>
   <label><input type="checkbox" checked={navbar.navStyles?.cart?.backgroundScroll!==false} onChange={e=>onChange({navStyles:{...navbar.navStyles,cart:{...navbar.navStyles?.cart,backgroundScroll:e.target.checked}}})}/>Cho phép cuộn nền khi mở giỏ</label>
   {Object.entries(CART_COPY).map(([key,fallback])=><label key={key}>{fallback}<input value={navbar.navStyles?.cart?.copy?.[key]??fallback} onChange={e=>onChange({navStyles:{...navbar.navStyles,cart:{...navbar.navStyles?.cart,copy:{...navbar.navStyles?.cart?.copy,[key]:e.target.value}}}})}/></label>)}
   <StyleTypographyBlock title="Chữ trong giỏ hàng" style={navbar.navStyles?.cart?.text||{}} onStyleChange={patch=>onChange({navStyles:{...navbar.navStyles,cart:{...navbar.navStyles?.cart,text:{...navbar.navStyles?.cart?.text,...patch}}}})}/>
  </details>
  <details><summary>Nội dung và giao diện thanh dưới</summary>
   <label><input type="checkbox" checked={value.glass!==false} onChange={e=>patch({glass:e.target.checked})}/>Hiệu ứng kính trong suốt</label>
   <label><input type="checkbox" checked={value.swipe!==false} onChange={e=>patch({swipe:e.target.checked})}/>Vuốt ngang để chọn mục — kính chạy theo ngón tay</label>
   <label>Viền khúc sắc của bong bóng kính (0–1)<input type="number" min="0" max="1" step="0.05" value={value.rimOpacity??.8} onChange={e=>patch({rimOpacity:Number(e.target.value)})}/></label>
   <label>Độ kéo giãn kính như giọt nước (0–2)<input type="number" min="0" max="2" step="0.1" value={value.liquidStretch??1} onChange={e=>patch({liquidStretch:Number(e.target.value)})}/></label>
   <label>Mức hiệu ứng icon (0–2)<input type="number" min="0" max="2" step="0.1" value={value.iconEffect??1} onChange={e=>patch({iconEffect:Number(e.target.value)})}/></label>
   {[['opacity','Độ đục của kính (%)',76,35,100],['blur','Độ mờ nền (px)',20,0,32],['radius','Bo góc (px)',24,0,32]].map(([key,label,fallback,min,max])=><label key={key}>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={e=>patch({[key]:Number(e.target.value)})}/></label>)}
   <label>Tên thanh điều hướng<input value={value.title||''} placeholder="Điều hướng mobile" onChange={e=>patch({title:e.target.value})}/></label>
   {[['background','Màu nền','#fffafc'],['color','Màu chữ','#806671'],['accent','Màu đang chọn','#b8446d'],['borderColor','Màu viền','#efd7e1']].map(([key,label,fallback])=><ColorField key={key} label={label} value={value[key]||fallback} onChange={color=>patch({[key]:color})}/>)}
   {[['height','Chiều cao tối thiểu (px)',64,56,88],['iconSize','Kích thước biểu tượng (px)',22,16,28]].map(([key,label,fallback,min,max])=><div className="builder-field" key={key}><label>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>patch({[key]:Number(event.target.value)})}/></label></div>)}
   <StyleTypographyBlock title="Chữ trên thanh điều hướng" style={value.textStyle||{}} onStyleChange={next=>patch({textStyle:{...value.textStyle,...next}})}/>
  </details>
  <MobileShopNav preview previewData={{...navbar,loading:false}}/>
 </SettingGroup>;
}
