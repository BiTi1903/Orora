import {SettingGroup} from './ui';
export default function MobileCardSettings({value={},priceStyle={},onChange}) {
 return <SettingGroup title="Giá và nút trên thẻ — điện thoại">
  <label>Bố cục giá và giỏ<select value={value.layout||'compact'} onChange={e=>onChange({layout:e.target.value})}><option value="compact">Giá cùng hàng với giỏ</option><option value="stacked">Giá trên, các nút dưới</option></select></label>
  <label>Căn giá trên điện thoại<select value={value.priceAlign||'left'} onChange={e=>onChange({priceAlign:e.target.value})}><option value="left">Trái</option><option value="right">Phải</option></select></label>
  <label>Cỡ giá trên điện thoại (px)<input type="number" min="12" max="72" value={value.priceSize??priceStyle.mobileFontSize??14} onChange={e=>onChange({priceSize:Number(e.target.value)})}/></label>
  <small className="builder-help">Thẻ nhỏ đặt nút Xem ở hàng dưới để giữ nút giỏ đủ lớn. Xem kết quả trong chế độ Mobile.</small>
 </SettingGroup>;
}
