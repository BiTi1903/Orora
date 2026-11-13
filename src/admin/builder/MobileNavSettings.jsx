import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
import {NAV_TARGETS,NAV_ICONS,mobileNavItems,mobileNavSettings} from '../../lib/mobile-shop-nav';
import MobileShopNav from '../../components/MobileShopNav';

export default function MobileNavSettings({navbar,onChange}){
 const value=navbar.navStyles?.mobile||{},patch=next=>onChange({navStyles:{...navbar.navStyles,mobile:{...value,...next}}});
 const items=Array.isArray(value.items)?value.items:mobileNavItems(mobileNavSettings(value));
 const edit=(index,next)=>patch({items:items.map((item,i)=>i===index?{...item,...next}:item)});
 return <SettingGroup title="Thanh điều hướng dưới — mobile">
  <label className="admin-check"><input type="checkbox" checked={value.enabled!==false} onChange={event=>patch({enabled:event.target.checked})}/>Hiện thanh cố định dưới màn hình điện thoại</label>
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
  <details><summary>Nội dung và giao diện thanh dưới</summary>
   <label><input type="checkbox" checked={value.glass!==false} onChange={e=>patch({glass:e.target.checked})}/>Hiệu ứng kính trong suốt</label>
   <label><input type="checkbox" checked={value.swipe!==false} onChange={e=>patch({swipe:e.target.checked})}/>Vuốt ngang để chọn mục — kính chạy theo ngón tay</label>
   <label>Mức hiệu ứng icon (0–2)<input type="number" min="0" max="2" step="0.1" value={value.iconEffect??1} onChange={e=>patch({iconEffect:Number(e.target.value)})}/></label>
   {[['opacity','Độ đục của kính (%)',76,35,100],['blur','Độ mờ nền (px)',20,0,32],['radius','Bo góc (px)',24,0,32]].map(([key,label,fallback,min,max])=><label key={key}>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={e=>patch({[key]:Number(e.target.value)})}/></label>)}
   <label>Tên thanh điều hướng<input value={value.title||''} placeholder="Điều hướng mobile" onChange={e=>patch({title:e.target.value})}/></label>
   {[['background','Màu nền','#fffafc'],['color','Màu chữ','#806671'],['accent','Màu đang chọn','#b8446d'],['borderColor','Màu viền','#efd7e1']].map(([key,label,fallback])=><ColorField key={key} label={label} value={value[key]||fallback} onChange={color=>patch({[key]:color})}/>)}
   {[['height','Chiều cao tối thiểu (px)',64,56,88],['iconSize','Kích thước biểu tượng (px)',22,16,28]].map(([key,label,fallback,min,max])=><div className="builder-field" key={key}><label>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>patch({[key]:Number(event.target.value)})}/></label></div>)}
   <StyleTypographyBlock title="Chữ trên thanh và danh mục" style={value.textStyle||{}} onStyleChange={next=>patch({textStyle:{...value.textStyle,...next}})}/>
   <StyleTypographyBlock title="Tiêu đề bảng danh mục" style={value.headingStyle||{}} onStyleChange={next=>patch({headingStyle:{...value.headingStyle,...next}})}/>
  </details>
  <MobileShopNav preview previewData={{...navbar,loading:false}}/>
 </SettingGroup>;
}
