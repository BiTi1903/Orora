export const ORDER_TRACKING_FIELDS = [
  ['eyebrow','Dòng chữ nhỏ','ORORA · ĐƠN HÀNG CỦA BẠN'],
  ['title','Tiêu đề trang','Tra cứu đơn hàng'],
  ['intro','Lời giới thiệu','Nhập mã đơn hoặc số điện thoại đã đặt hàng. Chỉ nhập số điện thoại để xem các đơn của số đó.'],
  ['phoneTab','Nút chọn số điện thoại','Số điện thoại'],['codeTab','Nút chọn mã đơn','Mã đơn'],
  ['phoneLabel','Nhãn ô số điện thoại','Số điện thoại đặt hàng'],['codeLabel','Nhãn ô mã đơn','Mã đơn hàng'],
  ['phonePlaceholder','Gợi ý ô số điện thoại','Nhập đầy đủ số điện thoại'],['codePlaceholder','Gợi ý ô mã đơn','Ví dụ: OW_1234C'],
  ['submitLabel','Nút tra cứu','Tra cứu đơn hàng'],['loadingLabel','Chữ khi đang tra cứu','Đang tra cứu…'],
  ['help','Hướng dẫn dưới form','Mã đơn có trong email xác nhận hoặc màn hình đặt hàng thành công. Chỉ tra cứu được đơn đặt trực tiếp trên website ORORA.'],
  ['contactLabel','Liên kết hỗ trợ','Liên hệ ORORA để được hỗ trợ'],
  ['moreLabel','Nút tải thêm đơn','Xem thêm đơn hàng'],['moreLoadingLabel','Chữ khi tải thêm đơn','Đang tải…'],
  ['statusHelp','Ghi chú dưới kết quả','Trạng thái do ORORA cập nhật khi xử lý đơn. Đây chưa phải hành trình vận chuyển trực tiếp từ đơn vị giao hàng.'],
];
export function trackingCopy(value = {}) {
  return Object.fromEntries(ORDER_TRACKING_FIELDS.map(([key,,fallback]) => [key,typeof value?.[key] === 'string' && value[key].trim() ? value[key] : fallback]));
}
