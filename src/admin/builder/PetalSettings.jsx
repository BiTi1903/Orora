import {SettingGroup,ColorField} from './ui';
import Petals from '../../components/Petals';
import {petalSettings} from '../../lib/petals';
export default function PetalSettings({value={},onChange}) {
 const s=petalSettings(value);
 return <SettingGroup title="Cánh hoa rơi — trang chủ">
  <label className="admin-check"><input type="checkbox" role="switch" checked={s.enabled} onChange={e=>onChange({enabled:e.target.checked})}/>Hiện cánh hoa rơi</label>
  {[['count','Số cánh hoa trên desktop',0,40,1],['mobileCount','Số cánh hoa trên điện thoại',0,30,1],['speed','Tốc độ rơi (1 = mặc định)',.25,3,.25]].map(([key,label,min,max,step])=><label className="builder-field" key={key}>{label}<input type="number" min={min} max={max} step={step} value={value[key]??s[key]} onChange={e=>onChange({[key]:Number(e.target.value)})}/></label>)}
  <details><summary>Kích thước và màu cánh hoa</summary>
   {[['size','Kích thước cánh nhỏ nhất (px)',6,24],['opacity','Độ đậm cánh hoa (%)',10,100]].map(([key,label,min,max])=><label className="builder-field" key={key}>{label}<input type="number" min={min} max={max} value={value[key]??s[key]} onChange={e=>onChange({[key]:Number(e.target.value)})}/></label>)}
   {[['light','Màu cánh sáng'],['color','Màu cánh chính'],['dark','Màu cánh đậm']].map(([key,label])=><ColorField key={key} label={label} value={s[key]} onChange={color=>onChange({[key]:color})}/>)}
  </details>
  <div className="petal-settings-preview" role="img" aria-label="Xem trước cánh hoa rơi"><Petals settings={value} preview/></div>
  <small className="builder-help">Tốc độ lớn hơn nghĩa là rơi nhanh hơn. Đặt số lượng bằng 0 để ẩn theo thiết bị. Hiệu ứng không chặn nút bấm và tự ẩn khi bật giảm chuyển động.</small>
 </SettingGroup>;
}
