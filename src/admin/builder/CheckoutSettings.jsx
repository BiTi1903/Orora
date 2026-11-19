import {CHECKOUT_COPY,CHECKOUT_FRAME_FIELDS} from '../../lib/checkout-presentation';
import OrderReceiptActions from '../../components/OrderReceiptActions';
import OrderFormPreview from '../../components/OrderFormPreview';
import {ColorField,StyleTypographyBlock} from './ui';
const LABELS={title:'Tiêu đề form đặt hàng',intro:'Lời hướng dẫn đầu form',productHeading:'Tiêu đề phần sản phẩm',recipientHeading:'Tiêu đề người nhận',addressHeading:'Tiêu đề địa chỉ',paymentHeading:'Tiêu đề thanh toán',noteLabel:'Nhãn mở ghi chú',summaryHeading:'Tiêu đề tóm tắt đơn',confirmHeading:'Nhãn bước xác nhận',continueLabel:'Nhãn nút tiếp tục',backLabel:'Nhãn nút quay lại'};
export default function CheckoutSettings({value={},onChange}){return <>
 <p className="builder-help">Form được chia theo thông tin người nhận, địa chỉ và thanh toán. Giá, phí và kiểm tra đơn vẫn theo dữ liệu hiện có.</p>
 {Object.entries(LABELS).map(([key,label])=><label className="builder-field" key={key}>{label}<input value={value.formLabels?.[key]??CHECKOUT_COPY[key]} onChange={event=>onChange({formLabels:{...value.formLabels,[key]:event.target.value}})}/></label>)}
 <details className="inspector-group"><summary>Khung và kiểu chữ form</summary><div className="inspector-group-content">
  {CHECKOUT_FRAME_FIELDS.map(([key,label,fallback,min,max])=><label className="builder-field" key={key}>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>onChange({[key]:Number(event.target.value)})}/></label>)}
  <ColorField label="Màu nền form đặt hàng" value={value.formBackground||'#fffafb'} onChange={formBackground=>onChange({formBackground})}/>
  <ColorField label="Màu viền form đặt hàng" value={value.formBorderColor||'#efd7e1'} onChange={formBorderColor=>onChange({formBorderColor})}/>
  <StyleTypographyBlock title="Tiêu đề trong form" style={value.formHeadingStyle||{}} onStyleChange={patch=>onChange({formHeadingStyle:{...value.formHeadingStyle,...patch}})}/>
  <StyleTypographyBlock title="Chữ trong form" style={value.formTextStyle||{}} onStyleChange={patch=>onChange({formTextStyle:{...value.formTextStyle,...patch}})}/>
 </div></details>
 <details className="inspector-group"><summary>Sau khi đặt hàng thành công</summary><div className="inspector-group-content">
 {Object.entries({receiptContactLabel:'Tiêu đề xác nhận nhanh',receiptContactHint:'Chú thích xác nhận',receiptSaveHint:'Chú thích lưu ảnh',receiptZaloLabel:'Nút Zalo',receiptFacebookLabel:'Nút Facebook',receiptSaveLabel:'Nút lưu ảnh đơn'}).map(([key,label])=><label className="builder-field" key={key}>{label}<input value={value[key]||''} onChange={event=>onChange({[key]:event.target.value})}/></label>)}
 <label className="builder-field">Cỡ chữ thông tin đơn (px)<input type="number" min="12" max="16" value={value.receiptFontSize??13} onChange={event=>onChange({receiptFontSize:Number(event.target.value)})}/></label>
 <p className="builder-help">Zalo dùng số điện thoại liên hệ hoặc link Zalo hiện có; Facebook dùng link cửa hàng hoặc Facebook footer. Chỉ hiện nút khi có link hợp lệ.</p>
 <ColorField label="Màu nút tải ảnh" value={value.receiptAccent||'#b8446d'} onChange={receiptAccent=>onChange({receiptAccent})}/>
 <ColorField label="Nền khung xác nhận nhanh" value={value.receiptBackground||'#fff5f8'} onChange={receiptBackground=>onChange({receiptBackground})}/>
 <OrderReceiptActions preview appearance={value} home={{footerPhone:'0900000000',footerFacebook:'https://www.facebook.com/orora'}}/>
 </div></details>
 <details className="inspector-group"><summary>Xem trước form đặt hàng</summary><div data-admin-preview><OrderFormPreview appearance={value}/></div></details>
 </>;}
