import {CHECKOUT_COPY,CHECKOUT_FRAME_FIELDS} from '../../lib/checkout-presentation';
import OrderFormPreview from '../../components/OrderFormPreview';
import {ColorField,StyleTypographyBlock} from './ui';
const LABELS={title:'Tiêu đề form đặt hàng',intro:'Lời hướng dẫn đầu form',productHeading:'Tiêu đề phần sản phẩm',recipientHeading:'Tiêu đề người nhận',addressHeading:'Tiêu đề địa chỉ',paymentHeading:'Tiêu đề thanh toán',noteLabel:'Nhãn mở ghi chú',summaryHeading:'Tiêu đề tóm tắt đơn'};
export default function CheckoutSettings({value={},onChange}){return <>
 <p className="builder-help">Form được chia theo thông tin người nhận, địa chỉ và thanh toán. Giá, phí và kiểm tra đơn vẫn theo dữ liệu hiện có.</p>
 {Object.entries(CHECKOUT_COPY).map(([key,fallback])=><label className="builder-field" key={key}>{LABELS[key]}<input value={value.formLabels?.[key]??fallback} onChange={event=>onChange({formLabels:{...value.formLabels,[key]:event.target.value}})}/></label>)}
 <details className="inspector-group"><summary>Khung và kiểu chữ form</summary><div className="inspector-group-content">
  {CHECKOUT_FRAME_FIELDS.map(([key,label,fallback,min,max])=><label className="builder-field" key={key}>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>onChange({[key]:Number(event.target.value)})}/></label>)}
  <ColorField label="Màu nền form đặt hàng" value={value.formBackground||'#fffafb'} onChange={formBackground=>onChange({formBackground})}/>
  <ColorField label="Màu viền form đặt hàng" value={value.formBorderColor||'#efd7e1'} onChange={formBorderColor=>onChange({formBorderColor})}/>
  <StyleTypographyBlock title="Tiêu đề trong form" style={value.formHeadingStyle||{}} onStyleChange={patch=>onChange({formHeadingStyle:{...value.formHeadingStyle,...patch}})}/>
  <StyleTypographyBlock title="Chữ trong form" style={value.formTextStyle||{}} onStyleChange={patch=>onChange({formTextStyle:{...value.formTextStyle,...patch}})}/>
 </div></details>
 <details className="inspector-group"><summary>Xem trước form đặt hàng</summary><div data-admin-preview><OrderFormPreview appearance={value}/></div></details>
 </>;}
