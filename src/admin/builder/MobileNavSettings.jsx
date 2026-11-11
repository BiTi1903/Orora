import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
import {MOBILE_NAV_TEXT} from '../../lib/mobile-shop-nav';
import MobileShopNav from '../../components/MobileShopNav';
const labels={homeLabel:'Trang chủ',categoryLabel:'Danh mục',productsLabel:'Sản phẩm',trackingLabel:'Tra cứu',title:'Tiêu đề bảng danh mục',allLabel:'Chữ xem tất cả',emptyLabel:'Khi chưa có danh mục',errorLabel:'Khi tải danh mục lỗi',retryLabel:'Nút tải lại',closeLabel:'Nút đóng'};
export default function MobileNavSettings({navbar,onChange}){
 const value=navbar.navStyles?.mobile||{},patch=next=>onChange({navStyles:{...navbar.navStyles,mobile:{...value,...next}}});
 return <SettingGroup title="Thanh điều hướng dưới — mobile">
  <label className="admin-check"><input type="checkbox" checked={value.enabled!==false} onChange={event=>patch({enabled:event.target.checked})}/>Hiện thanh cố định dưới màn hình điện thoại</label>
  <details><summary>Nội dung và giao diện thanh dưới</summary>
   {[['showHome','Hiện Trang chủ'],['showCategories','Hiện Danh mục'],['showProducts','Hiện Sản phẩm'],['showTracking','Hiện Tra cứu']].map(([key,label])=><label className="admin-check" key={key}><input type="checkbox" checked={value[key]!==false} onChange={event=>patch({[key]:event.target.checked})}/>{label}</label>)}
   {Object.entries(MOBILE_NAV_TEXT).map(([key,fallback])=><div className="builder-field" key={key}><label>{labels[key]}<input maxLength={200} value={value[key]??''} placeholder={fallback} onChange={event=>patch({[key]:event.target.value})}/></label></div>)}
   {[['background','Màu nền','#fffafc'],['color','Màu chữ','#806671'],['accent','Màu đang chọn','#b8446d'],['borderColor','Màu viền','#efd7e1']].map(([key,label,fallback])=><ColorField key={key} label={label} value={value[key]||fallback} onChange={color=>patch({[key]:color})}/>)}
   {[['height','Chiều cao tối thiểu (px)',64,56,88],['iconSize','Kích thước biểu tượng (px)',22,16,28]].map(([key,label,fallback,min,max])=><div className="builder-field" key={key}><label>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>patch({[key]:Number(event.target.value)})}/></label></div>)}
   <StyleTypographyBlock title="Chữ trên thanh và danh mục" style={value.textStyle||{}} onStyleChange={next=>patch({textStyle:{...value.textStyle,...next}})}/>
   <StyleTypographyBlock title="Tiêu đề bảng danh mục" style={value.headingStyle||{}} onStyleChange={next=>patch({headingStyle:{...value.headingStyle,...next}})}/>
  </details>
  <MobileShopNav preview previewData={{...navbar,loading:false}}/>
 </SettingGroup>;
}
