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
 </details></SettingGroup>;
}
