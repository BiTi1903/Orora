import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
import {CATALOG_FILTER_TEXT} from '../../lib/catalog-filters';
const labels={filterLabel:'Nút bộ lọc',sortLabel:'Nhãn sắp xếp',priceAsc:'Nút giá thấp',priceDesc:'Nút giá cao',gridLabel:'Nút dạng lưới',carouselLabel:'Nút dạng trượt',viewLabel:'Nhãn kiểu danh sách',emptyLabel:'Khi không có kết quả',previousLabel:'Trang trước',nextLabel:'Trang sau',pageLabel:'Số trang — giữ {page}, {pages}',contactPriceLabel:'Khi chưa niêm yết giá'};
export default function CatalogFilterSettings({value={},onChange}){
 return <SettingGroup title="Hai nút sắp xếp giá">
  <label className="admin-check"><input type="checkbox" checked={value.enabled!==false} onChange={event=>onChange({enabled:event.target.checked})}/>Hiện nút Bộ lọc</label>
  <details><summary>Tiêu chí, bố cục và chữ hiển thị</summary>
   {[['showViewToggle','Cho khách đổi lưới / trượt']].map(([key,label])=><label className="admin-check" key={key}><input type="checkbox" checked={value[key]!==false} onChange={event=>onChange({[key]:event.target.checked})}/>{label}</label>)}
   <div className="builder-field"><label>Kiểu danh sách mặc định<select value={value.layout||'auto'} onChange={event=>onChange({layout:event.target.value})}><option value="auto">Tự động — lưới khi lọc hoặc nhiều hơn 12 sản phẩm</option><option value="grid">Dạng lưới</option><option value="carousel">Dạng trượt</option></select></label></div>
   <div className="builder-field"><label>Số sản phẩm mỗi trang lưới<input type="number" min="4" max="48" value={value.pageSize??12} onChange={event=>onChange({pageSize:Number(event.target.value)})}/></label></div>
   {Object.entries(CATALOG_FILTER_TEXT).filter(([key])=>key in labels).map(([key,fallback])=><div className="builder-field" key={key}><label>{labels[key]}<input value={value[key]??''} maxLength={300} placeholder={fallback} onChange={event=>onChange({[key]:event.target.value})}/></label></div>)}
   {[['background','Màu nền','#fffafc'],['accent','Màu nhấn','#b8446d'],['borderColor','Màu viền','#efd7e1']].map(([key,label,fallback])=><ColorField key={key} label={label} value={value[key]||fallback} onChange={color=>onChange({[key]:color})}/>)}
   <div className="builder-field"><label>Bo góc khung (px)<input type="number" min="0" max="32" value={value.radius??14} onChange={event=>onChange({radius:Number(event.target.value)})}/></label></div>
   <StyleTypographyBlock title="Chữ trên nút" style={value.buttons||{}} onStyleChange={patch=>onChange({buttons:{...value.buttons,...patch}})}/>
  </details>
  <small className="builder-help">Xem trực tiếp trên preview. Chỉ hai nút Giá thấp / Giá cao; nhấn là sắp xếp ngay. Nhấn lại nút đang chọn để trở về thứ tự mặc định. Sản phẩm nhiều dung tích được sắp theo giá thấp nhất của các lựa chọn. Giá chưa niêm yết không bị coi là 0 đ.</small>
 </SettingGroup>;
}
