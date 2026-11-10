import { useId } from 'react';
import { SettingGroup,StyleTypographyBlock } from './ui';
export default function ProductLoadErrorSettings({value={},onChange}){
 const id=useId();
 return <details className="builder-extra-settings"><summary>Lỗi tải thông tin sản phẩm</summary><SettingGroup title="Nội dung khi kết nối bị gián đoạn">{[['title','Tiêu đề','Chưa tải được sản phẩm'],['text','Nội dung','Kết nối đang gián đoạn. Vui lòng thử tải lại thông tin sản phẩm.'],['retryLabel','Nút tải lại','Thử tải lại']].map(([key,label,placeholder])=><div className="builder-field" key={key}><label htmlFor={`${id}-${key}`}>{label}</label><input id={`${id}-${key}`} value={value[key]||''} maxLength={240} placeholder={placeholder} onChange={event=>onChange({[key]:event.target.value})}/></div>)}</SettingGroup>{[['titleStyle','Kiểu chữ tiêu đề'],['bodyStyle','Kiểu chữ nội dung'],['buttonStyle','Kiểu chữ nút tải lại']].map(([key,title])=><StyleTypographyBlock key={key} title={title} style={value[key]||{}} onStyleChange={patch=>onChange({[key]:{...value[key],...patch}})}/>)}</details>;
}
