import {useState} from 'react';
import {SettingGroup,ColorField} from './ui';
import {BUTTON_ICON_TARGETS,BUTTON_ICON_OPTIONS} from '../../lib/button-icons';
import ButtonIcon,{ButtonIconProvider} from '../../components/ButtonIcon';
export default function ButtonIconSettings({value={},onChange}) {
 const [target,setTarget]=useState('heroPrimary');
 const current=value[target]||{},meta=BUTTON_ICON_TARGETS.find(([key])=>key===target);
 const patch=changes=>onChange({...value,[target]:{...current,...changes}});
 return <SettingGroup title="Icon cạnh nút bấm">
  <label className="builder-field">Nút cần chỉnh icon<select value={target} onChange={e=>setTarget(e.target.value)}>{BUTTON_ICON_TARGETS.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  <label className="builder-field">Kiểu icon<select value={current.kind||'default'} onChange={e=>patch({kind:e.target.value})}>{BUTTON_ICON_OPTIONS.filter(([key])=>meta?.[2]!==false||key!=='none').map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
  <label className="builder-field">Kích thước icon (px)<input type="number" min="8" max="48" placeholder="Theo nút đang dùng" value={current.size??''} onChange={e=>patch({size:e.target.value===''?'':Number(e.target.value)})}/></label>
  <ColorField label="Màu icon" value={current.color||'#b8446d'} onChange={color=>patch({color})}/>
  {!current.color&&<small className="builder-help">Đang dùng màu chữ của nút; chọn màu để đặt màu riêng cho icon.</small>}
  {current.color&&<button type="button" className="admin-btn" onClick={()=>patch({color:''})}>Dùng màu chữ của nút</button>}
  <button type="button" className="admin-btn" onClick={()=>patch({kind:'default',size:'',color:''})}>Trả icon về mặc định</button>
  <div data-admin-preview><ButtonIconProvider value={value}><button type="button" className="admin-btn"><ButtonIcon name={target} allowHidden={meta?.[2]!==false}/><span>Mẫu nút</span></button></ButtonIconProvider></div>
  <small className="builder-help">Mặc định giữ icon cũ; có thể đổi kiểu, màu, kích thước hoặc ẩn icon cạnh chữ. Icon của nút chỉ có hình luôn giữ hiển thị; giỏ navbar vẫn dùng tùy chọn Hiện icon trong cài đặt giỏ.</small>
 </SettingGroup>;
}
