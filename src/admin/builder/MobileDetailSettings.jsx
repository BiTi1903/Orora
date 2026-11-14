import {SettingGroup} from './ui';
import {MOBILE_DETAIL_FIELDS} from '../../lib/product-detail-mobile';
export default function MobileDetailSettings({value={},onChange}) {
 return <SettingGroup title="Chi tiết sản phẩm — chỉ mobile"><details><summary>Cỡ chữ và khoảng cách gọn hơn</summary>
  <small className="builder-help">Chọn Mobile trên Preview để xem. Các cỡ chữ này ưu tiên trên điện thoại; desktop giữ kiểu chữ hiện có. Nội dung sản phẩm không bị rút bớt.</small>
  {MOBILE_DETAIL_FIELDS.map(([key,label,fallback,min,max])=><label className="builder-field" key={key}>{label} (px)<input type="number" min={min} max={max} value={value[key]??fallback} onChange={e=>onChange({[key]:Number(e.target.value)})}/></label>)}
 </details></SettingGroup>;
}
