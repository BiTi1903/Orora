import {banks,resolveBank} from '../../lib/vietqr';
import {CART_COPY} from '../../lib/cart-copy';
import {CART_MODAL_FIELDS} from '../../lib/cart-presentation';
import {CHECKOUT_COPY,CHECKOUT_RECEIPT_COPY,CHECKOUT_FRAME_FIELDS,CHECKOUT_EXTRA_FIELDS,RECEIPT_FRAME_FIELDS} from '../../lib/checkout-presentation';
import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';
import {InspectorGroup} from './Inspector';
import CartSettings from './CartSettings';

function NumberList({fields,value,onChange}){
 return fields.map(([key,label,fallback,min,max])=>(
  <label className="builder-field" key={key}>
   {label}
   <input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>onChange({[key]:Number(event.target.value)})}/>
  </label>
 ));
}

export function CartFormSettings({selected,navbar,onChange}){
 const cart=navbar.navStyles?.cart||{};
 const patch=next=>onChange({navStyles:{...navbar.navStyles,cart:{...cart,...next}}});
 const copyField=(key,label)=>(
  <label className="builder-field" key={key}>
   {label}
   <input value={cart.copy?.[key]??CART_COPY[key]} onChange={event=>patch({copy:{...cart.copy,[key]:event.target.value}})}/>
  </label>
 );
 const patchBtn=(field,next)=>patch({[field]:{...(cart[field]||{}),...next}});

 if(selected==='cartTitle'){
  return <>
   <SettingGroup title="Tiêu đề giỏ hàng">
    {copyField('title','Tiêu đề giỏ hàng')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề giỏ hàng" style={cart.headingStyle||{}} onStyleChange={next=>patch({headingStyle:{...cart.headingStyle,...next}})}/>
  </>;
 }
 if(selected==='cartClose'){
  return <SettingGroup title="Nút đóng ×">
   <ColorField label="Màu dấu × đóng" value={cart.closeColor||cart.accent||'#b8446d'} onChange={closeColor=>patch({closeColor})}/>
   <ColorField label="Màu nền nút đóng" value={cart.closeBackground||'#ffffff'} onChange={closeBackground=>patch({closeBackground})}/>
   <ColorField label="Màu viền nút đóng" value={cart.closeBorderColor||'#efd7e1'} onChange={closeBorderColor=>patch({closeBorderColor})}/>
  </SettingGroup>;
 }
 if(selected==='cartImage'){
  return <SettingGroup title="Khung ảnh sản phẩm">
   <NumberList fields={[CART_MODAL_FIELDS[3]]} value={cart} onChange={patch}/>
  </SettingGroup>;
 }
 if(selected==='cartItemName'){
  return <StyleTypographyBlock title="Kiểu chữ tên sản phẩm" style={cart.itemNameStyle||{}} onStyleChange={next=>patch({itemNameStyle:{...cart.itemNameStyle,...next}})}/>;
 }
 if(selected==='cartItemVariant'){
  return <StyleTypographyBlock title="Kiểu chữ dung tích / phân loại" style={cart.itemVariantStyle||{}} onStyleChange={next=>patch({itemVariantStyle:{...cart.itemVariantStyle,...next}})}/>;
 }
 if(selected==='cartItemPrice'){
  return <StyleTypographyBlock title="Kiểu chữ giá sản phẩm" style={cart.itemPriceStyle||{}} onStyleChange={next=>patch({itemPriceStyle:{...cart.itemPriceStyle,...next}})}/>;
 }
 if(selected==='cartQty'){
  return <SettingGroup title="Khung chọn số lượng">
   <NumberList fields={[CART_MODAL_FIELDS[4]]} value={cart} onChange={patch}/>
   <ColorField label="Màu nền ô số lượng" value={cart.quantityBackground||'#ffffff'} onChange={quantityBackground=>patch({quantityBackground})}/>
   <ColorField label="Màu viền ô số lượng" value={cart.quantityBorderColor||'#efd7e1'} onChange={quantityBorderColor=>patch({quantityBorderColor})}/>
   <ColorField label="Màu chữ / dấu +/-" value={cart.quantityTextColor||cart.accent||'#b8446d'} onChange={quantityTextColor=>patch({quantityTextColor})}/>
  </SettingGroup>;
 }
 if(selected==='cartRemove'){
  const removeBtn=cart.removeButton||{};
  return <>
   <SettingGroup title="Nút Xóa">
    {copyField('remove','Chữ nút Xóa')}
    <ColorField label="Màu nền nút Xóa" value={removeBtn.background||'#fff5f9'} onChange={background=>patchBtn('removeButton',{background})}/>
    <ColorField label="Màu viền nút Xóa" value={removeBtn.borderColor||'#efd7e1'} onChange={borderColor=>patchBtn('removeButton',{borderColor})}/>
    <label className="builder-field">Bo góc nút Xóa (px)<input type="number" min={0} max={28} value={removeBtn.radius??10} onChange={event=>patchBtn('removeButton',{radius:Number(event.target.value)})}/></label>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ nút Xóa" style={removeBtn.text||{}} onStyleChange={next=>patchBtn('removeButton',{text:{...removeBtn.text,...next}})}/>
  </>;
 }
 if(selected==='cartDetail'){
  const detailBtn=cart.detailButton||{};
  return <>
   <SettingGroup title="Nút Chi tiết">
    {copyField('order','Chữ nút Chi tiết')}
    <ColorField label="Màu nền nút Chi tiết" value={detailBtn.background||'#fff5f9'} onChange={background=>patchBtn('detailButton',{background})}/>
    <ColorField label="Màu viền nút Chi tiết" value={detailBtn.borderColor||'#efd7e1'} onChange={borderColor=>patchBtn('detailButton',{borderColor})}/>
    <label className="builder-field">Bo góc nút Chi tiết (px)<input type="number" min={0} max={28} value={detailBtn.radius??10} onChange={event=>patchBtn('detailButton',{radius:Number(event.target.value)})}/></label>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ nút Chi tiết" style={detailBtn.text||{}} onStyleChange={next=>patchBtn('detailButton',{text:{...detailBtn.text,...next}})}/>
  </>;
 }
 if(selected==='cartShipping'){
  return <>
   <SettingGroup title="Chú thích phí giao hàng">
    {copyField('shipping','Chú thích phí giao hàng')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ chú thích phí giao hàng" style={cart.shippingNoteStyle||{}} onStyleChange={next=>patch({shippingNoteStyle:{...cart.shippingNoteStyle,...next}})}/>
  </>;
 }
 if(selected==='cartTotal'){
  return <>
   <SettingGroup title="Dòng Tạm tính">
    {copyField('total','Nhãn tạm tính')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ dòng Tạm tính" style={cart.totalStyle||{}} onStyleChange={next=>patch({totalStyle:{...cart.totalStyle,...next}})}/>
  </>;
 }
 const checkoutBtn=cart.checkoutButton||{};
 return <>
  <SettingGroup title="Nút Mua ngay trong giỏ hàng">
   {copyField('buyNow','Chữ nút Mua ngay')}
   <ColorField label="Màu nền nút Mua ngay" value={checkoutBtn.background||'#b8446d'} onChange={background=>patchBtn('checkoutButton',{background})}/>
   <ColorField label="Màu viền nút Mua ngay" value={checkoutBtn.borderColor||'#b8446d'} onChange={borderColor=>patchBtn('checkoutButton',{borderColor})}/>
   <label className="builder-field">Bo góc nút Mua ngay (px)<input type="number" min={4} max={28} value={checkoutBtn.radius??12} onChange={event=>patchBtn('checkoutButton',{radius:Number(event.target.value)})}/></label>
   <label className="builder-field">Chiều cao nút Mua ngay (px)<input type="number" min={40} max={64} value={checkoutBtn.height??46} onChange={event=>patchBtn('checkoutButton',{height:Number(event.target.value)})}/></label>
  </SettingGroup>
  <StyleTypographyBlock title="Kiểu chữ nút Mua ngay" style={checkoutBtn.text||{}} onStyleChange={next=>patchBtn('checkoutButton',{text:{...checkoutBtn.text,...next}})}/>
 </>;
}

export function CartFormSectionSettings({navbar,onChange}){
 const cart=navbar.navStyles?.cart||{};
 const patch=next=>onChange({navStyles:{...navbar.navStyles,cart:{...cart,...next}}});
 const copyField=(key,label)=>(
  <label className="builder-field" key={key}>
   {label}
   <input value={cart.copy?.[key]??CART_COPY[key]} onChange={event=>patch({copy:{...cart.copy,[key]:event.target.value}})}/>
  </label>
 );
 return <>
  <InspectorGroup title="Khung & màu sắc giỏ hàng">
   <SettingGroup title="Khung hộp thoại">
    <label><input type="checkbox" role="switch" checked={cart.enabled!==false} onChange={event=>patch({enabled:event.target.checked})}/>Hiện giỏ hàng trên website</label>
    <NumberList fields={CART_MODAL_FIELDS.slice(0,3)} value={cart} onChange={patch}/>
    <ColorField label="Màu nền hộp thoại" value={cart.modalBackground||'#fffafb'} onChange={modalBackground=>patch({modalBackground})}/>
    <ColorField label="Màu nền thanh tiêu đề" value={cart.headerBackground||cart.modalBackground||'#fffafb'} onChange={headerBackground=>patch({headerBackground})}/>
    <ColorField label="Màu viền hộp thoại" value={cart.modalBorderColor||'#efd7e1'} onChange={modalBorderColor=>patch({modalBorderColor})}/>
    <ColorField label="Màu đường kẻ phân cách" value={cart.dividerColor||'#efd7e1'} onChange={dividerColor=>patch({dividerColor})}/>
    <ColorField label="Màu nhấn chung" value={cart.accent||'#b8446d'} onChange={accent=>patch({accent})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ chung trong giỏ hàng" style={cart.text||{}} onStyleChange={next=>patch({text:{...cart.text,...next}})}/>
  </InspectorGroup>
  <InspectorGroup title="Hiệu ứng mở giỏ & thông báo">
   <SettingGroup title="Hiệu ứng & giỏ trống">
    <label><input type="checkbox" role="switch" checked={cart.animation!==false} onChange={event=>patch({animation:event.target.checked})}/>Hiệu ứng bay và nảy vào giỏ</label>
    <label><input type="checkbox" role="switch" checked={cart.popupAnimation!==false} onChange={event=>patch({popupAnimation:event.target.checked})}/>Mở giỏ hàng từ nút giỏ hàng</label>
    <label className="builder-field">Thời gian mở giỏ (ms)<input type="number" min={200} max={700} step={20} value={Math.max(200,Math.min(700,Number(cart.popupDuration)||420))} onChange={event=>patch({popupDuration:Number(event.target.value)})}/></label>
    <label><input type="checkbox" role="switch" checked={cart.backgroundScroll!==false} onChange={event=>patch({backgroundScroll:event.target.checked})}/>Cho phép cuộn nền khi mở giỏ</label>
    {copyField('empty','Chữ khi giỏ hàng trống')}
    {copyField('shopNow','Nút Xem sản phẩm khi giỏ trống')}
    {copyField('added','Thông báo đã thêm vào giỏ')}
   </SettingGroup>
  </InspectorGroup>
  <InspectorGroup title="Nút giỏ hàng trên navbar & popup chọn dung tích">
   <CartSettings navbar={navbar} onChange={onChange}/>
  </InspectorGroup>
 </>;
}

export function OrderFormBuilderSettings({selected,productDetail,onChange}){
 const value=productDetail.purchaseOptions||{};
 const patch=next=>onChange({purchaseOptions:{...value,...next}});
 const labelField=(key,label,rows=1)=>(
  <label className="builder-field" key={key}>
   {label}
   {rows>1
    ?<textarea rows={rows} value={value.formLabels?.[key]??CHECKOUT_COPY[key]} onChange={event=>patch({formLabels:{...value.formLabels,[key]:event.target.value}})}/>
    :<input value={value.formLabels?.[key]??CHECKOUT_COPY[key]} onChange={event=>patch({formLabels:{...value.formLabels,[key]:event.target.value}})}/>}
  </label>
 );

 if(selected==='ofTitle'){
  return <>
   <SettingGroup title="Tiêu đề hộp thoại">
    {labelField('title','Tiêu đề hộp thoại')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề chính" style={value.formTitleStyle||value.formHeadingStyle||{}} onStyleChange={next=>patch({formTitleStyle:{...(value.formTitleStyle||value.formHeadingStyle),...next}})}/>
  </>;
 }
 if(selected==='ofClose'){
  return <SettingGroup title="Nút đóng ×">
   <ColorField label="Màu dấu × đóng" value={value.closeColor||value.accentColor||'#b8446d'} onChange={closeColor=>patch({closeColor})}/>
   <ColorField label="Màu nền nút đóng" value={value.closeBackground||'#ffffff'} onChange={closeBackground=>patch({closeBackground})}/>
   <ColorField label="Màu viền nút đóng" value={value.closeBorderColor||'#efd7e1'} onChange={closeBorderColor=>patch({closeBorderColor})}/>
  </SettingGroup>;
 }
 if(selected==='ofProductName'){
  return <StyleTypographyBlock title="Kiểu chữ tên sản phẩm" style={value.productNameStyle||{}} onStyleChange={next=>patch({productNameStyle:{...value.productNameStyle,...next}})}/>;
 }
 if(selected==='ofIntro'){
  return <>
   <SettingGroup title="Lời hướng dẫn đầu form">
    {labelField('intro','Lời hướng dẫn')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ lời hướng dẫn & chú thích" style={value.helpTextStyle||{}} onStyleChange={next=>patch({helpTextStyle:{...value.helpTextStyle,...next}})}/>
  </>;
 }
 if(selected==='ofPrice'){
  return <>
   <SettingGroup title="Khung nhãn giá">
    <ColorField label="Màu nền nhãn giá" value={value.pricePillBackground||'#f8e4ec'} onChange={pricePillBackground=>patch({pricePillBackground})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ giá sản phẩm" style={value.pricePillStyle||{}} onStyleChange={next=>patch({pricePillStyle:{...value.pricePillStyle,...next}})}/>
  </>;
 }
 if(selected==='ofSelection'){
  return <>
   <SettingGroup title="Chọn dung tích & số lượng">
    {labelField('volumeLabel','Nhãn dung tích')}
    {labelField('quantityLabel','Nhãn số lượng')}
    <ColorField label="Màu nhấn nút đang chọn" value={value.accentColor||'#b8446d'} onChange={accentColor=>patch({accentColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ dung tích & số lượng" style={value.selectionStyle||{}} onStyleChange={next=>patch({selectionStyle:{...value.selectionStyle,...next}})}/>
  </>;
 }
 if(selected==='ofRecipientHeading'){
  return <>
   <SettingGroup title="Tiêu đề Thông tin người nhận">
    {labelField('recipientHeading','Tiêu đề khối')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề các khối mục" style={value.formHeadingStyle||{}} onStyleChange={next=>patch({formHeadingStyle:{...value.formHeadingStyle,...next}})}/>
  </>;
 }
 if(selected==='ofRecipientFields'){
  return <>
   <SettingGroup title="Các ô Thông tin người nhận">
    {labelField('nameLabel','Nhãn Họ và tên')}
    {labelField('namePlaceholder','Chữ gợi ý Họ và tên')}
    {labelField('phoneLabel','Nhãn Số điện thoại')}
    {labelField('phonePlaceholder','Chữ gợi ý Số điện thoại')}
    {labelField('emailLabel','Nhãn Email')}
    {labelField('emailPlaceholder','Chữ gợi ý Email')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ nhãn & ô nhập" style={value.formTextStyle||{}} onStyleChange={next=>patch({formTextStyle:{...value.formTextStyle,...next}})}/>
  </>;
 }
 if(selected==='ofAddressHeading'){
  return <>
   <SettingGroup title="Tiêu đề Địa chỉ giao hàng">
    {labelField('addressHeading','Tiêu đề khối')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề các khối mục" style={value.formHeadingStyle||{}} onStyleChange={next=>patch({formHeadingStyle:{...value.formHeadingStyle,...next}})}/>
  </>;
 }
 if(selected==='ofAddressFields'){
  return <>
   <SettingGroup title="Các ô Địa chỉ giao hàng">
    {labelField('provinceLabel','Nhãn Tỉnh / Thành phố')}
    {labelField('provincePlaceholder','Chữ gợi ý Tỉnh / Thành phố')}
    {labelField('wardLabel','Nhãn Phường / Xã')}
    {labelField('wardPlaceholder','Chữ gợi ý Phường / Xã')}
    {labelField('addressDetailLabel','Nhãn Số nhà, tên đường')}
    {labelField('addressDetailPlaceholder','Chữ gợi ý Số nhà, tên đường')}
    {labelField('addressHint','Chú thích tính phí giao hàng')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ chú thích nhỏ" style={value.helpTextStyle||{}} onStyleChange={next=>patch({helpTextStyle:{...value.helpTextStyle,...next}})}/>
  </>;
 }
 if(selected==='ofPaymentHeading'){
  return <>
   <SettingGroup title="Tiêu đề Thanh toán">
    {labelField('paymentHeading','Tiêu đề khối')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề các khối mục" style={value.formHeadingStyle||{}} onStyleChange={next=>patch({formHeadingStyle:{...value.formHeadingStyle,...next}})}/>
  </>;
 }
 if(selected==='ofPaymentFields'){
  return <>
   <SettingGroup title="Phương thức thanh toán & Ghi chú">
    {labelField('paymentMethodLabel','Nhãn Phương thức thanh toán')}
    {labelField('noteLabel','Nhãn mở phần ghi chú')}
    {labelField('noteFieldLabel','Nhãn ô nhập ghi chú')}
    {labelField('notePlaceholder','Chữ gợi ý ô ghi chú')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ thẻ thanh toán & ghi chú" style={value.paymentOptionStyle||{}} onStyleChange={next=>patch({paymentOptionStyle:{...value.paymentOptionStyle,...next}})}/>
  </>;
 }
 if(selected==='ofSummary'){
  return <>
   <SettingGroup title="Tóm tắt phí giao & tổng tiền">
    {labelField('shippingFeeLabel','Nhãn Phí giao hàng')}
    {labelField('shippingUnknownLabel','Chữ khi chưa chọn địa chỉ')}
    {labelField('subtotalPendingLabel','Nhãn tổng khi chưa có phí ship')}
    {labelField('totalLabel','Nhãn Tổng thanh toán')}
    {labelField('codPaymentHint','Chú thích khi chọn COD',2)}
    {labelField('bankPaymentHint','Chú thích khi chọn Chuyển khoản',2)}
    <ColorField label="Màu nền khung tổng tiền" value={value.summaryBackground||'#faf8f9'} onChange={summaryBackground=>patch({summaryBackground})}/>
    <ColorField label="Màu viền khung tổng tiền" value={value.summaryBorderColor||'#ece4e8'} onChange={summaryBorderColor=>patch({summaryBorderColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ các dòng tóm tắt" style={value.summaryTextStyle||{}} onStyleChange={next=>patch({summaryTextStyle:{...value.summaryTextStyle,...next}})}/>
   <StyleTypographyBlock title="Kiểu chữ số tiền Tổng thanh toán" style={value.summaryTotalStyle||{}} onStyleChange={next=>patch({summaryTotalStyle:{...value.summaryTotalStyle,...next}})}/>
  </>;
 }
 if(selected==='ofConsent'){
  return <>
   <SettingGroup title="Ô tích đồng ý">
    {labelField('consentText','Nội dung câu đồng ý',3)}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ câu đồng ý" style={value.consentStyle||{}} onStyleChange={next=>patch({consentStyle:{...value.consentStyle,...next}})}/>
  </>;
 }
 return <>
  <SettingGroup title="Nút Đặt hàng ngay">
   <label className="builder-field">Chữ nút gửi đơn<input maxLength={100} value={value.orderSubmitLabel??'Đặt hàng ngay'} onChange={event=>patch({orderSubmitLabel:event.target.value})}/></label>
   <label className="builder-field">Chữ khi đang đặt hàng<input maxLength={100} value={value.orderBusyLabel??'Đang đặt hàng…'} onChange={event=>patch({orderBusyLabel:event.target.value})}/></label>
   <label className="builder-field">Thông báo khi chờ quá lâu<textarea rows={2} maxLength={240} value={value.orderTimeoutLabel||''} placeholder="Chưa nhận được phản hồi. Bạn có thể thử gửi lại với cùng thông tin hoặc tra cứu đơn hàng để kiểm tra." onChange={event=>patch({orderTimeoutLabel:event.target.value})}/></label>
   <ColorField label="Màu nền nút Đặt hàng ngay" value={value.orderSubmitBackground||'#b8446d'} onChange={orderSubmitBackground=>patch({orderSubmitBackground})}/>
   <ColorField label="Màu viền nút Đặt hàng ngay" value={value.orderSubmitBorderColor||'#b8446d'} onChange={orderSubmitBorderColor=>patch({orderSubmitBorderColor})}/>
   <label className="builder-field">Bo góc nút (px)<input type="number" min={0} max={32} value={value.orderSubmitRadius??14} onChange={event=>patch({orderSubmitRadius:Number(event.target.value)})}/></label>
   <label className="builder-field">Chiều cao nút (px)<input type="number" min={36} max={68} value={value.orderSubmitHeight??48} onChange={event=>patch({orderSubmitHeight:Number(event.target.value)})}/></label>
  </SettingGroup>
  <StyleTypographyBlock title="Kiểu chữ nút Đặt hàng ngay" style={value.orderSubmitStyle||{}} onStyleChange={next=>patch({orderSubmitStyle:{...value.orderSubmitStyle,...next}})}/>
  <StyleTypographyBlock title="Kiểu chữ khi đang gửi đơn" style={value.loadingStyle||{}} onStyleChange={next=>patch({loadingStyle:{...value.loadingStyle,...next}})}/>
 </>;
}

export function OrderFormSectionSettings({productDetail,onChange}){
 const value=productDetail.purchaseOptions||{};
 const patch=next=>onChange({purchaseOptions:{...value,...next}});
 return <>
  <InspectorGroup title="Khung hộp thoại & màu sắc">
   <SettingGroup title="Khung form đặt hàng">
    <NumberList fields={CHECKOUT_FRAME_FIELDS} value={value} onChange={patch}/>
    <ColorField label="Màu nền form đặt hàng" value={value.formBackground||'#fffafb'} onChange={formBackground=>patch({formBackground})}/>
    <ColorField label="Màu nền thanh tiêu đề" value={value.headerBackground||value.formBackground||'#fffafb'} onChange={headerBackground=>patch({headerBackground})}/>
    <ColorField label="Màu viền form đặt hàng" value={value.formBorderColor||'#efd7e1'} onChange={formBorderColor=>patch({formBorderColor})}/>
    <ColorField label="Màu nhấn chính" value={value.accentColor||'#b8446d'} onChange={accentColor=>patch({accentColor})}/>
   </SettingGroup>
  </InspectorGroup>
  <InspectorGroup title="Thẻ mục, ô nhập liệu & kiểu chữ chung">
   <SettingGroup title="Khung sản phẩm, thẻ mục & ô nhập">
    <NumberList fields={CHECKOUT_EXTRA_FIELDS} value={value} onChange={patch}/>
    <ColorField label="Màu nền khung sản phẩm" value={value.productCardBackground||'#fff8fb'} onChange={productCardBackground=>patch({productCardBackground})}/>
    <ColorField label="Màu viền khung sản phẩm" value={value.productCardBorderColor||'#efd7e1'} onChange={productCardBorderColor=>patch({productCardBorderColor})}/>
    <ColorField label="Màu nền các khối mục" value={value.cardBackground||'#ffffff'} onChange={cardBackground=>patch({cardBackground})}/>
    <ColorField label="Màu viền các khối mục" value={value.cardBorderColor||'#efd7e1'} onChange={cardBorderColor=>patch({cardBorderColor})}/>
    <ColorField label="Màu nền ô nhập" value={value.inputBackground||'#ffffff'} onChange={inputBackground=>patch({inputBackground})}/>
    <ColorField label="Màu viền ô nhập" value={value.inputBorderColor||'#e5c8d5'} onChange={inputBorderColor=>patch({inputBorderColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ chung trong form" style={value.formTextStyle||{}} onStyleChange={next=>patch({formTextStyle:{...value.formTextStyle,...next}})}/>
   <StyleTypographyBlock title="Kiểu chữ chú thích nhỏ" style={value.helpTextStyle||{}} onStyleChange={next=>patch({helpTextStyle:{...value.helpTextStyle,...next}})}/>
  </InspectorGroup>
 </>;
}

export function OrderSuccessBuilderSettings({selected,productDetail,onChange}){
 const value=productDetail.purchaseOptions||{};
 const patch=next=>onChange({purchaseOptions:{...value,...next}});
 const field=(key,label,rows=1)=>(
  <label className="builder-field" key={key}>
   {label}
   {rows>1
    ?<textarea rows={rows} value={value[key]??CHECKOUT_RECEIPT_COPY[key]} onChange={event=>patch({[key]:event.target.value})}/>
    :<input value={value[key]??CHECKOUT_RECEIPT_COPY[key]} onChange={event=>patch({[key]:event.target.value})}/>}
  </label>
 );

 if(selected==='osTitle'){
  return <>
   <SettingGroup title="Tiêu đề hộp thoại đã đặt hàng">
    {field('receiptTitle','Tiêu đề hộp thoại')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề" style={value.receiptTitleStyle||{}} onStyleChange={next=>patch({receiptTitleStyle:{...value.receiptTitleStyle,...next}})}/>
  </>;
 }
 if(selected==='osCloseIcon'){
  return <SettingGroup title="Nút đóng ×">
   <ColorField label="Màu dấu × đóng" value={value.receiptCloseIconColor||value.receiptAccent||'#b8446d'} onChange={receiptCloseIconColor=>patch({receiptCloseIconColor})}/>
   <ColorField label="Màu nền nút đóng" value={value.receiptCloseIconBackground||'#ffffff'} onChange={receiptCloseIconBackground=>patch({receiptCloseIconBackground})}/>
   <ColorField label="Màu viền nút đóng" value={value.receiptCloseIconBorderColor||'#efd7e1'} onChange={receiptCloseIconBorderColor=>patch({receiptCloseIconBorderColor})}/>
  </SettingGroup>;
 }
 if(selected==='osCode'){
  return <>
   <SettingGroup title="Mã đơn hàng">
    {field('receiptCodeLabel','Nhãn mã đơn hàng')}
    <NumberList fields={[RECEIPT_FRAME_FIELDS[3]]} value={value} onChange={patch}/>
    <ColorField label="Màu nền khung mã đơn" value={value.receiptBannerBackground||'#faf8f9'} onChange={receiptBannerBackground=>patch({receiptBannerBackground})}/>
    <ColorField label="Màu viền khung mã đơn" value={value.receiptBannerBorderColor||'#ece4e8'} onChange={receiptBannerBorderColor=>patch({receiptBannerBorderColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ nhãn Mã đơn" style={value.receiptCodeLabelStyle||{}} onStyleChange={next=>patch({receiptCodeLabelStyle:{...value.receiptCodeLabelStyle,...next}})}/>
   <StyleTypographyBlock title="Kiểu chữ mã đơn hàng" style={value.receiptCodeStyle||{}} onStyleChange={next=>patch({receiptCodeStyle:{...value.receiptCodeStyle,...next}})}/>
  </>;
 }
 if(selected==='osMessage'){
  return <>
   <SettingGroup title="Lời cảm ơn / Lời nhắn">
    <label className="builder-field">
     Lời nhắn sau khi đặt (để trống dùng lời nhắn mặc định từ máy chủ)
     <textarea rows={2} value={value.receiptMessage||''} placeholder="Cảm ơn bạn đã đặt hàng tại ORORA. Chúng tôi sẽ liên hệ xác nhận trong thời gian sớm nhất." onChange={event=>patch({receiptMessage:event.target.value})}/>
    </label>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ lời nhắn" style={value.receiptMessageStyle||{}} onStyleChange={next=>patch({receiptMessageStyle:{...value.receiptMessageStyle,...next}})}/>
  </>;
 }
 if(selected==='osContact'){
  return <>
   <SettingGroup title="Xác nhận nhanh (Zalo / Facebook)">
    {field('receiptContactLabel','Tiêu đề xác nhận nhanh')}
    {field('receiptContactHint','Chú thích xác nhận nhanh')}
    {field('receiptZaloLabel','Chữ nút Zalo')}
    {field('receiptFacebookLabel','Chữ nút Facebook')}
    <ColorField label="Màu nền khung xác nhận" value={value.receiptBackground||'#faf8f9'} onChange={receiptBackground=>patch({receiptBackground})}/>
    <ColorField label="Màu viền khung xác nhận" value={value.receiptActionsBorderColor||'#ece4e8'} onChange={receiptActionsBorderColor=>patch({receiptActionsBorderColor})}/>
    <ColorField label="Màu nền nút Zalo" value={value.receiptZaloBackground||'#0754bb'} onChange={receiptZaloBackground=>patch({receiptZaloBackground})}/>
    <ColorField label="Màu chữ nút Zalo" value={value.receiptZaloColor||'#ffffff'} onChange={receiptZaloColor=>patch({receiptZaloColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ khung xác nhận" style={value.receiptActionsTextStyle||{}} onStyleChange={next=>patch({receiptActionsTextStyle:{...value.receiptActionsTextStyle,...next}})}/>
  </>;
 }
 if(selected==='osSave'){
  return <>
   <SettingGroup title="Lưu ảnh đơn hàng">
    {field('receiptSaveLabel','Chữ nút lưu ảnh đơn')}
    {field('receiptSaveHint','Chú thích lưu ảnh đơn')}
    {field('receiptDownloadNote','Ghi chú phía dưới',3)}
    <ColorField label="Màu icon nút tải ảnh" value={value.receiptAccent||'#b8446d'} onChange={receiptAccent=>patch({receiptAccent})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ khung lưu ảnh đơn" style={value.receiptSaveTextStyle||{}} onStyleChange={next=>patch({receiptSaveTextStyle:{...value.receiptSaveTextStyle,...next}})}/>
  </>;
 }
 if(selected==='osDetails'){
  return <>
   <SettingGroup title="Thẻ Chi tiết đơn hàng">
    {field('receiptDetailsHeading','Tiêu đề Chi tiết đơn hàng')}
    {field('receiptProductLabel','Nhãn dòng Sản phẩm')}
    {field('receiptPaymentLabel','Nhãn dòng Thanh toán')}
    {field('receiptSubtotalLabel','Nhãn dòng Tiền sản phẩm')}
    {field('receiptShippingLabel','Nhãn dòng Phí giao hàng')}
    {field('receiptTotalLabel','Nhãn dòng Tổng thanh toán')}
    <NumberList fields={[RECEIPT_FRAME_FIELDS[4]]} value={value} onChange={patch}/>
    <ColorField label="Màu nền thẻ chi tiết" value={value.receiptCardBackground||'#ffffff'} onChange={receiptCardBackground=>patch({receiptCardBackground})}/>
    <ColorField label="Màu viền thẻ chi tiết" value={value.receiptCardBorderColor||'#ece4e8'} onChange={receiptCardBorderColor=>patch({receiptCardBorderColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề thẻ" style={value.receiptCardHeadingStyle||{}} onStyleChange={next=>patch({receiptCardHeadingStyle:{...value.receiptCardHeadingStyle,...next}})}/>
   <StyleTypographyBlock title="Kiểu chữ nội dung chi tiết đơn" style={value.receiptBodyStyle||{}} onStyleChange={next=>patch({receiptBodyStyle:{...value.receiptBodyStyle,...next}})}/>
   <StyleTypographyBlock title="Kiểu chữ dòng Tổng thanh toán" style={value.receiptTotalStyle||{}} onStyleChange={next=>patch({receiptTotalStyle:{...value.receiptTotalStyle,...next}})}/>
  </>;
 }
 if(selected==='osRecipient'){
  return <>
   <SettingGroup title="Thẻ Thông tin người nhận">
    {field('receiptRecipientHeading','Tiêu đề Thông tin người nhận')}
    <NumberList fields={[RECEIPT_FRAME_FIELDS[4]]} value={value} onChange={patch}/>
    <ColorField label="Màu nền thẻ" value={value.receiptCardBackground||'#ffffff'} onChange={receiptCardBackground=>patch({receiptCardBackground})}/>
    <ColorField label="Màu viền thẻ" value={value.receiptCardBorderColor||'#ece4e8'} onChange={receiptCardBorderColor=>patch({receiptCardBorderColor})}/>
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ tiêu đề thẻ" style={value.receiptCardHeadingStyle||{}} onStyleChange={next=>patch({receiptCardHeadingStyle:{...value.receiptCardHeadingStyle,...next}})}/>
   <StyleTypographyBlock title="Kiểu chữ nội dung người nhận" style={value.receiptRecipientStyle||value.receiptBodyStyle||{}} onStyleChange={next=>patch({receiptRecipientStyle:{...(value.receiptRecipientStyle||value.receiptBodyStyle),...next}})}/>
  </>;
 }
 if(selected==='osBank'){
  return <>
   <SettingGroup title="Thông tin chuyển khoản">
    {field('bankHeading','Tiêu đề khối chuyển khoản')}
    <label className="builder-field">Ngân hàng nhận tiền<select value={resolveBank(value.bankCode||value.bankName)?.bin||""} onChange={e=>{const bank=resolveBank(e.target.value);patch({bankCode:bank?.bin||"",bankName:bank?.name||""});}}><option value="">Chọn ngân hàng</option>{banks.map(bank=><option key={bank.bin} value={bank.bin}>{bank.name} · {bank.bin}</option>)}</select></label>
    {value.bankName&&!resolveBank(value.bankCode||value.bankName)&&<p>Đang hiển thị {value.bankName}. Chọn ngân hàng để tạo mã QR.</p>}
    {field('bankAccountNumber','Số tài khoản')}
    {field('bankAccountName','Tên chủ tài khoản')}
    {field('bankTransferNote','Mẫu nội dung chuyển khoản (dùng {{code}} cho mã đơn)')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ thông tin chuyển khoản" style={value.receiptBankTextStyle||{}} onStyleChange={next=>patch({receiptBankTextStyle:{...value.receiptBankTextStyle,...next}})}/>
  </>;
 }
 if(selected==='osNextSteps'){
  return <>
   <SettingGroup title="Khối Bước tiếp theo">
    {field('receiptNextStepsHeading','Tiêu đề Bước tiếp theo')}
    {field('receiptNextStepsBody','Nội dung Bước tiếp theo',3)}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ Bước tiếp theo" style={value.receiptNextStepsStyle||{}} onStyleChange={next=>patch({receiptNextStepsStyle:{...value.receiptNextStepsStyle,...next}})}/>
  </>;
 }
 if(selected==='osEmailNote'){
  return <>
   <SettingGroup title="Ghi chú kiểm tra email">
    {field('receiptEmailNote','Nội dung ghi chú email',2)}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ ghi chú email" style={value.receiptEmailNoteStyle||{}} onStyleChange={next=>patch({receiptEmailNoteStyle:{...value.receiptEmailNoteStyle,...next}})}/>
  </>;
 }
 if(selected==='osTracking'){
  return <>
   <SettingGroup title="Link Tra cứu trạng thái đơn">
    {field('receiptTrackingLabel','Chữ link tra cứu đơn')}
   </SettingGroup>
   <StyleTypographyBlock title="Kiểu chữ link tra cứu đơn" style={value.receiptTrackingStyle||{}} onStyleChange={next=>patch({receiptTrackingStyle:{...value.receiptTrackingStyle,...next}})}/>
  </>;
 }
 return <>
  <SettingGroup title="Nút Đóng">
   {field('receiptCloseLabel','Chữ nút Đóng')}
   <ColorField label="Màu nền nút Đóng" value={value.receiptCloseBackground||'#ffffff'} onChange={receiptCloseBackground=>patch({receiptCloseBackground})}/>
   <ColorField label="Màu viền nút Đóng" value={value.receiptCloseBorderColor||'#efd7e1'} onChange={receiptCloseBorderColor=>patch({receiptCloseBorderColor})}/>
  </SettingGroup>
  <StyleTypographyBlock title="Kiểu chữ nút Đóng" style={value.receiptCloseStyle||{}} onStyleChange={next=>patch({receiptCloseStyle:{...value.receiptCloseStyle,...next}})}/>
 </>;
}

export function OrderSuccessSectionSettings({productDetail,onChange}){
 const value=productDetail.purchaseOptions||{};
 const patch=next=>onChange({purchaseOptions:{...value,...next}});
 return <InspectorGroup title="Khung hộp thoại & kiểu chữ chung">
  <SettingGroup title="Khung hộp thoại đã đặt hàng">
   <NumberList fields={RECEIPT_FRAME_FIELDS.slice(0,3)} value={value} onChange={patch}/>
   <label className="builder-field">Cỡ chữ thông tin đơn (px)<input type="number" min={12} max={18} value={value.receiptFontSize??13} onChange={event=>patch({receiptFontSize:Number(event.target.value)})}/></label>
   <ColorField label="Màu nền hộp thoại" value={value.receiptModalBackground||'#fffafb'} onChange={receiptModalBackground=>patch({receiptModalBackground})}/>
   <ColorField label="Màu viền hộp thoại" value={value.receiptModalBorderColor||'#efd7e1'} onChange={receiptModalBorderColor=>patch({receiptModalBorderColor})}/>
   <ColorField label="Màu nhấn chính" value={value.receiptAccent||'#b8446d'} onChange={receiptAccent=>patch({receiptAccent})}/>
  </SettingGroup>
  <StyleTypographyBlock title="Kiểu chữ chung trong form đã đặt hàng" style={value.receiptTextStyle||{}} onStyleChange={next=>patch({receiptTextStyle:{...value.receiptTextStyle,...next}})}/>
 </InspectorGroup>;
}
