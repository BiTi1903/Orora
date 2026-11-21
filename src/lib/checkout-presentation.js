import {toCss} from './typography.js';

export const CHECKOUT_COPY={
 title:'Đặt hàng trên website',
 intro:'Kiểm tra sản phẩm và nhập thông tin nhận hàng.',
 volumeLabel:'Dung tích',
 quantityLabel:'Số lượng',
 recipientHeading:'Thông tin người nhận',
 nameLabel:'Họ và tên',
 namePlaceholder:'Nguyễn Văn A',
 phoneLabel:'Số điện thoại',
 phonePlaceholder:'09xx xxx xxx',
 emailLabel:'Email nhận xác nhận đơn',
 emailPlaceholder:'email@domain.com',
 addressHeading:'Địa chỉ giao hàng',
 provinceLabel:'Tỉnh / Thành phố',
 provincePlaceholder:'Chọn tỉnh/thành',
 wardLabel:'Phường / Xã',
 wardPlaceholder:'Chọn phường/xã',
 addressDetailLabel:'Số nhà, tên đường',
 addressDetailPlaceholder:'Số nhà, tên đường, tòa nhà, hẻm…',
 addressHint:'Chọn địa chỉ để tính phí giao hàng.',
 paymentHeading:'Thanh toán',
 paymentMethodLabel:'Phương thức thanh toán',
 noteLabel:'Thêm ghi chú cho đơn hàng',
 noteFieldLabel:'Ghi chú (không bắt buộc)',
 notePlaceholder:'Lời nhắn giao hàng hoặc khung giờ nhận thuận tiện…',
 summaryHeading:'Tóm tắt đơn hàng',
 shippingFeeLabel:'Phí giao hàng',
 shippingUnknownLabel:'Chọn tỉnh và phường để tính phí',
 subtotalPendingLabel:'Tạm tính (chưa gồm phí giao)',
 totalLabel:'Tổng thanh toán',
 paymentHint:'Chưa thu tiền tại bước đặt đơn. ORORA sẽ hướng dẫn thanh toán sau khi tiếp nhận.',
 codPaymentHint:'Bạn thanh toán khi nhận hàng.',
 bankPaymentHint:'ORORA sẽ hiển thị thông tin chuyển khoản sau khi bạn đặt đơn và xác nhận cùng bạn.',
 consentText:'Tôi đồng ý để ORORA liên hệ, gửi email xác nhận và xử lý đơn hàng theo thông tin đã cung cấp.',
};
export const CHECKOUT_RECEIPT_COPY={
 receiptTitle:'Đã nhận đơn hàng',
 receiptCodeLabel:'Mã đơn hàng',
 receiptMessage:'',
 receiptContactLabel:'Xác nhận đơn nhanh',
 receiptContactHint:'Gửi ảnh đơn hàng trực tiếp qua Zalo cho ORORA',
 receiptZaloLabel:'Xác nhận qua Zalo',
 receiptFacebookLabel:'Xác nhận qua Facebook',
 receiptSaveLabel:'Lưu ảnh đơn hàng',
 receiptSaveHint:'Giữ lại thông tin để tiện tra cứu',
 receiptDownloadNote:'Ảnh có thông tin người nhận. Trên điện thoại hỗ trợ chia sẻ, ấn Zalo sẽ mở hộp chọn gửi kèm ảnh; nếu không hỗ trợ sẽ tải ảnh dự phòng.',
 receiptDetailsHeading:'Chi tiết đơn hàng',
 receiptProductLabel:'Sản phẩm',
 receiptPaymentLabel:'Thanh toán',
 receiptSubtotalLabel:'Tiền sản phẩm',
 receiptShippingLabel:'Phí giao hàng',
 receiptTotalLabel:'Tổng thanh toán',
 receiptRecipientHeading:'Thông tin người nhận',
 receiptNextStepsHeading:'Bước tiếp theo',
 receiptNextStepsBody:'ORORA sẽ liên hệ xác nhận đơn và giao hàng trong thời gian sớm nhất. Bạn có thể bấm Zalo bên trên hoặc lưu ảnh đơn hàng để tiện tra cứu.',
 bankHeading:'Thông tin chuyển khoản',
 bankName:'',
 bankAccountNumber:'',
 bankAccountName:'',
 bankTransferNote:'Thanh toán đơn {{code}}',
 receiptEmailNote:'ORORA sẽ gửi email xác nhận trong ít phút; nếu không thấy hãy kiểm tra thư rác hoặc tra cứu đơn.',
 receiptTrackingLabel:'Tra cứu đơn',
 receiptCloseLabel:'Tiếp tục mua sắm',
};
export const CHECKOUT_FRAME_FIELDS=[
 ['formWidth','Chiều rộng form (px)',600,320,800],
 ['formPadding','Đệm trong form (px)',18,10,32],
 ['formRadius','Bo góc form (px)',20,0,32],
];
export const CHECKOUT_EXTRA_FIELDS=[
 ['cardRadius','Bo góc các khối mục (px)',15,0,28],
 ['inputRadius','Bo góc ô nhập liệu (px)',11,0,24],
];
export const RECEIPT_FRAME_FIELDS=[
 ['receiptWidth','Chiều rộng hộp thoại (px)',560,320,800],
 ['receiptPadding','Đệm trong hộp thoại (px)',18,10,32],
 ['receiptRadius','Bo góc hộp thoại (px)',22,0,36],
 ['receiptBannerRadius','Bo góc khung mã đơn (px)',16,0,32],
 ['receiptCardRadius','Bo góc thẻ chi tiết (px)',15,0,28],
];
const bounded=(value,fallback,min,max)=>{
 const n=value==null||value===''?fallback:Number(value);
 return Math.max(min,Math.min(max,Number.isFinite(n)?n:fallback));
};
export function checkoutStyle(value={}){
 return {
  '--checkout-bg':value.formBackground||'#fffafb',
  ...Object.fromEntries([...CHECKOUT_FRAME_FIELDS,...CHECKOUT_EXTRA_FIELDS].map(([key,,fallback,min,max])=>[`--checkout-${key}`,`${bounded(value[key],fallback,min,max)}px`])),
  ...(value.formBorderColor?{'--checkout-border':value.formBorderColor}:{}),
  ...(value.headerBackground?{'--checkout-header-bg':value.headerBackground}:{}),
  ...(value.closeColor?{'--checkout-close-color':value.closeColor}:{}),
  ...(value.closeBackground?{'--checkout-close-bg':value.closeBackground}:{}),
  ...(value.closeBorderColor?{'--checkout-close-border':value.closeBorderColor}:{}),
  ...(value.productCardBackground?{'--checkout-product-bg':value.productCardBackground}:{}),
  ...(value.productCardBorderColor?{'--checkout-product-border':value.productCardBorderColor}:{}),
  ...(value.pricePillBackground?{'--checkout-price-bg':value.pricePillBackground}:{}),
  ...(value.cardBackground?{'--checkout-card-bg':value.cardBackground}:{}),
  ...(value.cardBorderColor?{'--checkout-card-border':value.cardBorderColor}:{}),
  ...(value.inputBackground?{'--checkout-input-bg':value.inputBackground}:{}),
  ...(value.inputBorderColor?{'--checkout-input-border':value.inputBorderColor}:{}),
  ...(value.summaryBackground?{'--checkout-summary-bg':value.summaryBackground}:{}),
  ...(value.summaryBorderColor?{'--checkout-summary-border':value.summaryBorderColor}:{}),
  ...(value.accentColor?{'--checkout-accent':value.accentColor}:{}),
 };
}
export function checkoutSubmitStyle(appearance={},busy=false){
 const baseStyle=busy?appearance.loadingStyle:appearance.orderSubmitStyle;
 return {
  ...(appearance.orderSubmitBackground?{background:appearance.orderSubmitBackground}:{}),
  ...(appearance.orderSubmitBorderColor?{borderColor:appearance.orderSubmitBorderColor}:{}),
  ...(appearance.orderSubmitRadius!=null?{borderRadius:`${bounded(appearance.orderSubmitRadius,14,0,32)}px`}:{}),
  ...(appearance.orderSubmitHeight!=null?{minHeight:`${bounded(appearance.orderSubmitHeight,48,36,68)}px`}:{}),
  ...toCss(baseStyle,{responsive:true}),
  ...(baseStyle?.textDecoration?{textDecoration:baseStyle.textDecoration}:{}),
 };
}
export function receiptModalStyle(value={}){
 return {
  ...checkoutStyle(value),
  ...Object.fromEntries(RECEIPT_FRAME_FIELDS.map(([key,,fallback,min,max])=>[`--${key}`,`${bounded(value[key],fallback,min,max)}px`])),
  '--receipt-size':`${bounded(value.receiptFontSize,13,12,18)}px`,
  '--receipt-accent':value.receiptAccent||'#b8446d',
  '--receipt-surface':value.receiptBackground||'#fff5f8',
  ...(value.receiptModalBackground?{'--receipt-modal-bg':value.receiptModalBackground,background:value.receiptModalBackground}:{}),
  ...(value.receiptModalBorderColor?{'--receipt-modal-border':value.receiptModalBorderColor,borderColor:value.receiptModalBorderColor}:{}),
  ...(value.receiptBannerBackground?{'--receipt-banner-bg':value.receiptBannerBackground}:{}),
  ...(value.receiptBannerBorderColor?{'--receipt-banner-border':value.receiptBannerBorderColor}:{}),
  ...(value.receiptCardBackground?{'--receipt-card-bg':value.receiptCardBackground}:{}),
  ...(value.receiptCardBorderColor?{'--receipt-card-border':value.receiptCardBorderColor}:{}),
  ...(value.receiptActionsBorderColor?{'--receipt-actions-border':value.receiptActionsBorderColor}:{}),
  ...(value.receiptZaloBackground?{'--receipt-zalo-bg':value.receiptZaloBackground}:{}),
  ...(value.receiptZaloColor?{'--receipt-zalo-color':value.receiptZaloColor}:{}),
  ...(value.receiptCloseBackground?{'--receipt-close-bg':value.receiptCloseBackground}:{}),
  ...(value.receiptCloseBorderColor?{'--receipt-close-border':value.receiptCloseBorderColor}:{}),
  ...(value.receiptCloseIconColor?{'--receipt-close-icon-color':value.receiptCloseIconColor}:{}),
  ...(value.receiptCloseIconBackground?{'--receipt-close-icon-bg':value.receiptCloseIconBackground}:{}),
  ...(value.receiptCloseIconBorderColor?{'--receipt-close-icon-border':value.receiptCloseIconBorderColor}:{}),
  ...toCss(value.receiptTextStyle,{responsive:true}),
 };
}
