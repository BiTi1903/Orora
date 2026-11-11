import {lazy,Suspense,useState} from 'react';
import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
import {IMAGE_VIEWER_TEXT,imageViewerSettings} from '../../lib/image-viewer';
const Viewer=lazy(()=>import('../../components/ProductImageViewer'));
const labels={title:'Tiêu đề — dùng {product} để điền tên sản phẩm',openLabel:'Chữ mở ảnh',closeLabel:'Nút đóng',previousLabel:'Nút ảnh trước',nextLabel:'Nút ảnh sau',zoomInLabel:'Nút phóng to',zoomOutLabel:'Nút thu nhỏ',resetLabel:'Nút về kích thước ban đầu',imageLabel:'Nhãn chọn ảnh phụ',hint:'Hướng dẫn thao tác',loadingLabel:'Khi đang tải ảnh',errorLabel:'Khi tải ảnh lỗi',retryLabel:'Nút thử lại'};
export default function ImageViewerSettings({value={},onChange,images=[],name="Sản phẩm xem trước"}){
 const [preview,setPreview]=useState(false),s=imageViewerSettings(value);
 return <SettingGroup title="Xem ảnh toàn màn hình">
  <label className="admin-check"><input type="checkbox" checked={s.enabled} onChange={event=>onChange({enabled:event.target.checked})}/>Cho phép chạm ảnh để phóng to</label>
  <details><summary>Nội dung và giao diện cửa sổ ảnh</summary>
   <label className="admin-check"><input type="checkbox" checked={s.showHint} onChange={event=>onChange({showHint:event.target.checked})}/>Hiện lời gợi ý thao tác</label>
   <label className="admin-check"><input type="checkbox" checked={s.showThumbnails} onChange={event=>onChange({showThumbnails:event.target.checked})}/>Hiện hàng ảnh thu nhỏ</label>
   <div className="builder-field"><label>Mức phóng to tối đa (lần)<input type="number" min="2" max="5" step=".5" value={value.maxZoom??4} onChange={event=>onChange({maxZoom:Number(event.target.value)})}/></label></div>
   {Object.entries(IMAGE_VIEWER_TEXT).map(([key,fallback])=><div className="builder-field" key={key}><label>{labels[key]}<input value={value[key]??''} maxLength={300} placeholder={fallback} onChange={event=>onChange({[key]:event.target.value})}/></label></div>)}
   {['background','color','accent','borderColor'].map((key,i)=><ColorField key={key} label={['Màu nền','Màu chữ','Màu nút','Màu viền'][i]} value={value[key]||['#fffafc','#3a1526','#b8446d','#efd7e1'][i]} onChange={color=>onChange({[key]:color})}/>)}
   <div className="builder-field"><label>Bo góc nút (px)<input type="number" min="0" max="32" value={value.radius??12} onChange={event=>onChange({radius:Number(event.target.value)})}/></label></div>
   {['heading','info','controls'].map((key,i)=><StyleTypographyBlock key={key} title={['Chữ tiêu đề','Chữ hướng dẫn / thông báo','Chữ nút và bộ điều khiển'][i]} style={value[key]||{}} onStyleChange={patch=>onChange({[key]:{...value[key],...patch}})}/>)}
  </details>
  <button type="button" className="admin-btn" disabled={!s.enabled} onClick={()=>setPreview(true)}>Xem trước cửa sổ ảnh</button>
  {preview&&<Suspense fallback={null}><Viewer images={images.length ? images : ['/preview/product.svg']} name={name} settings={value} onClose={()=>setPreview(false)}/></Suspense>}
 </SettingGroup>;
}
