import {SettingGroup} from './ui';
import {MOBILE_DETAIL_FIELDS} from '../../lib/product-detail-mobile';
const groups=[['general','Cỡ chữ và khoảng cách gọn hơn'],['assurance','Khung cam kết'],['care','Hướng dẫn chăm sóc']];
const fieldGroup=key=>key.startsWith('assurance')?'assurance':key.startsWith('care')?'care':'general';
export default function MobileDetailSettings({value={},onChange}) {
 return <SettingGroup title="Chi tiết sản phẩm — chỉ mobile">
  <small className="builder-help">Chọn Mobile trên Preview để xem. Các cỡ chữ này ưu tiên trên điện thoại; desktop giữ kiểu chữ hiện có. Nội dung sản phẩm không bị rút bớt.</small>
  {groups.map(([group,title])=><details key={group}><summary>{title}</summary>
   {MOBILE_DETAIL_FIELDS.filter(([key])=>fieldGroup(key)===group).map(([key,label,fallback,min,max])=><label className="builder-field" key={key}>{label} (px)<input type="number" min={min} max={max} value={value[key]??fallback} onChange={e=>onChange({[key]:Number(e.target.value)})}/></label>)}
  </details>)}
 </SettingGroup>;
}
