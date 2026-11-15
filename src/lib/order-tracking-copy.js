import { toCss } from './typography.js';
export const ORDER_TRACKING_FIELDS = [
  ['progressTitle','Chi tiết — tiến trình','Tình trạng đơn hàng'],
  ['createdLabel','Chi tiết — ngày đặt','Đặt lúc'],['updatedLabel','Chi tiết — ngày cập nhật','Cập nhật'],
  ['productSectionTitle','Chi tiết — nhóm sản phẩm','Sản phẩm đã đặt'],['productLabel','Chi tiết — nhãn sản phẩm','Sản phẩm'],['volumeLabel','Chi tiết — dung tích','Dung tích'],
  ['paymentSectionTitle','Chi tiết — nhóm thanh toán','Thông tin thanh toán'],['methodLabel','Chi tiết — phương thức','Phương thức thanh toán'],
  ['costSectionTitle','Chi tiết — nhóm chi phí','Chi tiết số tiền'],['subtotalLabel','Chi tiết — tiền sản phẩm','Tiền sản phẩm'],['shippingLabel','Chi tiết — phí giao hàng','Phí giao hàng'],['totalLabel','Chi tiết — tổng tiền','Tổng tiền'],
  ['cancelledHelp','Chi tiết — đơn đã hủy','Đơn hàng đã được hủy. Liên hệ ORORA nếu bạn cần hỗ trợ.'],

  ['backLabel','Nút trở về','Trở về trang chủ'],
  ['eyebrow','Dòng chữ nhỏ','ORORA · ĐƠN HÀNG CỦA BẠN'],
  ['title','Tiêu đề trang','Tra cứu đơn hàng'],
  ['intro','Lời giới thiệu','Nhập số điện thoại hoặc mã đơn.'],
  ['formTitle','Tiêu đề khung nhập','Tra cứu đơn hàng'],
  ['phoneTab','Nút chọn số điện thoại','Số điện thoại'],['codeTab','Nút chọn mã đơn','Mã đơn'],
  ['phoneHint','Giải thích cách tra cứu bằng số điện thoại','Xem các đơn đã đặt bằng số này'],['codeHint','Giải thích cách tra cứu bằng mã đơn','Tìm nhanh một đơn hàng cụ thể'],
  ['phoneLabel','Nhãn ô số điện thoại','Số điện thoại đặt hàng'],['codeLabel','Nhãn ô mã đơn','Mã đơn hàng'],
  ['phonePlaceholder','Gợi ý ô số điện thoại','Nhập số điện thoại khi đặt hàng'],['codePlaceholder','Gợi ý ô mã đơn','Ví dụ: OW_1234C'],
  ['submitLabel','Nút tra cứu','Tra cứu'],['loadingLabel','Chữ khi đang tra cứu','Đang tra cứu…'],
  ['help','Hướng dẫn dưới form','Chỉ cần nhập số điện thoại hoặc mã đơn, không cần nhập cả hai.'],
  ['guideTitle','Tiêu đề phần hướng dẫn','Hướng dẫn & hỗ trợ'],
  ['guideFirstTitle','Bước 1 — tiêu đề','Chọn cách tra cứu'],['guideFirstBody','Bước 1 — hướng dẫn','Dùng số điện thoại để tìm các đơn của bạn, hoặc mã đơn để xem một đơn cụ thể.'],
  ['guideSecondTitle','Bước 2 — tiêu đề','Nhập thông tin đặt hàng'],['guideSecondBody','Bước 2 — hướng dẫn','Mã đơn có trong email xác nhận hoặc màn hình đặt hàng thành công.'],
  ['guideThirdTitle','Bước 3 — tiêu đề','Xem tình trạng đơn'],['guideThirdBody','Bước 3 — hướng dẫn','Lọc theo tình trạng và chọn Xem chi tiết để kiểm tra sản phẩm, thanh toán và tổng tiền.'],
  ['scopeNote','Phạm vi tra cứu','Áp dụng cho đơn đặt trực tiếp trên website ORORA.'],
  ['contactLabel','Liên kết hỗ trợ','Cần hỗ trợ? Liên hệ ORORA'],
  ['resultTitle','Tiêu đề kết quả','Đơn hàng của bạn'],['resultSummary','Tóm tắt kết quả','Tìm thấy {count} đơn hàng.'],
  ['allLabel','Nút lọc tất cả','Tất cả'],['detailLabel','Nút xem chi tiết','Xem chi tiết'],
  ['paidLabel','Đơn đã thanh toán','Đã thanh toán'],['unpaidLabel','Đơn chưa thanh toán','Chưa thanh toán'],['refundedLabel','Đơn hoàn tiền','Đã hoàn tiền'],['paymentLabel','Nhãn thanh toán','Thanh toán'],
  ['quantityLabel','Nhãn số lượng','Số lượng'],['pendingTotalLabel','Chữ chưa xác nhận tổng tiền','Chờ xác nhận tổng tiền'],
  ['emptyFilterLabel','Không có đơn trong tình trạng đã chọn','Chưa có đơn thuộc tình trạng này trong các đơn đã tải.'],
  ['previousLabel','Nút trang trước','Trang trước'],['nextLabel','Nút trang sau','Trang sau'],['pageLabel','Thông tin trang','Trang {page}/{pages}'],
  ['moreLabel','Nút tải thêm đơn','Xem thêm đơn hàng'],['moreLoadingLabel','Chữ khi tải thêm đơn','Đang tải…'],
  ['moreHelp','Hướng dẫn tải thêm','Số lượng theo tình trạng tính trên các đơn đã tải. Xem thêm để kiểm tra đơn cũ hơn.'],
  ['statusHelp','Ghi chú dưới kết quả','Trạng thái do ORORA cập nhật khi xử lý đơn. Đây chưa phải hành trình vận chuyển trực tiếp từ đơn vị giao hàng.'],
];
export const TRACKING_RESULT_KEYS=['progressTitle','createdLabel','updatedLabel','productSectionTitle','productLabel','volumeLabel','paymentSectionTitle','methodLabel','costSectionTitle','subtotalLabel','shippingLabel','totalLabel','cancelledHelp','paidLabel','unpaidLabel','refundedLabel','paymentLabel','resultTitle','resultSummary','allLabel','detailLabel','quantityLabel','pendingTotalLabel','emptyFilterLabel','previousLabel','nextLabel','pageLabel','moreLabel','moreLoadingLabel','moreHelp','statusHelp'];
export const TRACKING_STYLE_GROUPS=[['detailHeading','Chi tiết — tiêu đề nhóm'],['detailProduct','Chi tiết — tên sản phẩm'],['detailTotal','Chi tiết — tổng tiền'],['eyebrow','Dòng chữ nhỏ'],['title','Tiêu đề trang'],['intro','Lời giới thiệu'],['formTitle','Tiêu đề khung nhập'],['modeTitle','Tên cách tra cứu'],['modeBody','Mô tả cách tra cứu'],['label','Nhãn ô nhập'],['input','Chữ trong ô nhập'],['button','Nút tra cứu'],['guideTitle','Tiêu đề hướng dẫn'],['guideBody','Nội dung hướng dẫn'],['help','Ghi chú và liên hệ'],['resultTitle','Tiêu đề kết quả'],['resultBody','Nội dung kết quả']];
export function trackingCopy(value = {}) {
  return Object.fromEntries(ORDER_TRACKING_FIELDS.map(([key,,fallback]) => [key,typeof value?.[key] === 'string' && value[key].trim() ? value[key] : fallback]));
}
export function trackingTemplate(value,fields){return value.replace(/\{(\w+)\}/g,(token,key)=>fields[key]??token);}
export function trackingStyle(value,key){const style=value?.text?.[key]||{};return {...toCss(style),textDecoration:style.textDecoration};}
export function trackingTheme(value={}){
 const vars={};
 for(const [key,fallback,min,max] of [['formPadding',14,8,32],['fieldHeight',44,44,60]]){const n=Number(value[key]??fallback);vars[key==='formPadding'?'--tracking-form-padding':'--tracking-field-height']=`${Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}px`;} 
 for(const [key,name] of [['accent','--tracking-accent'],['background','--tracking-card'],['border','--tracking-border']])if(value[key])vars[name]=value[key];
 if(value.radius!==''&&Number.isFinite(Number(value.radius)))vars['--tracking-radius']=`${Math.max(0,Math.min(40,Number(value.radius)))}px`;
 return vars;
}
