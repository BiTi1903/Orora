// Dedicated mobile values keep desktop typography and saved product content intact.
export const MOBILE_DETAIL_FIELDS = [
 ['nameSize','Tên sản phẩm',26,20,36], ['priceSize','Giá sản phẩm',21,16,30],
 ['descriptionSize','Mô tả ngắn',14,12,20], ['headingSize','Tiêu đề nội dung',23,18,30],
 ['bodySize','Nội dung chi tiết',14,12,20], ['specSize','Giá trị thông số',13,12,20],
 ['labelSize','Nhãn và ghi chú',12,11,18], ['buttonSize','Chữ nút mua hàng',13,12,18],
 ['sloganTitleSize','Tiêu đề slogan',15,12,24], ['sloganBodySize','Nội dung slogan',13,12,22],
 ['padding','Đệm khung thông tin',16,10,28], ['sectionGap','Khoảng cách các mục',18,10,32],
 ['sloganPadding','Đệm khung slogan',14,8,28],
];
export function mobileDetailVars(value={}) {
 return Object.fromEntries(MOBILE_DETAIL_FIELDS.map(([key,,fallback,min,max])=>{
  const number=Number(value?.[key]??fallback);
  return [`--pd-mobile-${key}`,`${Math.max(min,Math.min(max,Number.isFinite(number)?number:fallback))}px`];
 }));
}
