import {useId} from "react";
import {SettingGroup} from './ui';
import {PRODUCT_CONTENT_GROUPS} from '../../lib/product-content';
export default function InformationTabsSettings({value={},onChange}) {
 const id=useId();
 return <SettingGroup title="Tab nội dung sản phẩm"><details><summary>Nhãn tab và mục mở mặc định</summary>
  <small className="builder-help">Chỉ hiện nội dung của tab đang chọn trên cả mobile và desktop. Kiểu chữ chỉnh tại các mục Nút nội dung và Tiêu đề nội dung; nội dung từng sản phẩm chỉnh tại Sản phẩm.</small>
  <div className="builder-field"><label htmlFor={id}>Tab mở mặc định</label><select id={id} value={value.defaultTab||'description'} onChange={e=>onChange({defaultTab:e.target.value})}>{Object.entries(PRODUCT_CONTENT_GROUPS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></div>
  {Object.entries(PRODUCT_CONTENT_GROUPS).map(([key,label])=><label className="builder-field" key={key}>Tên tab {label}<input value={value.labels?.[key]??''} placeholder={label} maxLength={80} onChange={e=>onChange({labels:{...value.labels,[key]:e.target.value}})}/></label>)}
  <label className="builder-field">Chữ khi chưa có nội dung<input value={value.emptyText??''} placeholder="Thông tin đang được cập nhật." maxLength={200} onChange={e=>onChange({emptyText:e.target.value})}/></label>
  <label className="builder-field">Số cột thông số ngắn trên máy tính<select value={value.specColumns??2} onChange={e=>onChange({specColumns:Number(e.target.value)})}><option value={2}>2 cột</option><option value={1}>1 cột</option></select></label>
  <label className="builder-field">Bo góc ô thông số (px)<input type="number" min={0} max={28} value={value.cardRadius??16} onChange={e=>onChange({cardRadius:Number(e.target.value)})}/></label>
  <small className="builder-help">Thành phần và nội dung dài luôn chiếm toàn chiều ngang; điện thoại dùng một cột. Chỉnh chữ và màu tại Nhãn thông số / Nội dung thông số.</small>
 </details></SettingGroup>;
}
