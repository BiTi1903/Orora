export const validShippingFee = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
export const freeShippingThreshold=settings=>settings?.freeAbove === undefined ? 400000 : settings.freeAbove;
export function shippingOffer(settings){
 const threshold=freeShippingThreshold(settings);
 return validShippingFee(threshold)?`Miễn phí giao hàng cho đơn trên ${threshold.toLocaleString("vi-VN")} đ tại khu vực được hỗ trợ.`:"";
}
const qualifies=(settings,subtotal)=>validShippingFee(freeShippingThreshold(settings)) && Number.isSafeInteger(subtotal) && subtotal>freeShippingThreshold(settings);
// null means not quoted; zero explicitly means free shipping.
export function shippingFeeFor(settings, provinceCode, wardCode, subtotal=null) {
  if (settings?.enabled !== true && provinceCode && wardCode && qualifies(settings,subtotal)) return {fee:0,reason:"Đơn đã đạt ngưỡng miễn phí vận chuyển."};
  if (settings?.enabled !== true) return { fee: null, reason: "Phí giao hàng sẽ được xác nhận sau." };
  if (!provinceCode || !wardCode) return { fee: null, reason: "Chọn địa chỉ để tính phí giao hàng." };
  const province = settings.provinces?.[provinceCode];
  const override = province?.wardFees?.[wardCode];
  const fee = override !== undefined && override !== null ? override : province?.fee;
  if(validShippingFee(fee) && qualifies(settings,subtotal))return {fee:0,reason:"Đơn đã đạt ngưỡng miễn phí vận chuyển."};
  return validShippingFee(fee) ? { fee, reason: "" } : { fee: null, reason: "Chưa có phí giao hàng cho địa chỉ này. Vui lòng liên hệ ORORA." };
}

export function freeShippingMessage(settings,subtotal) {
 const threshold=freeShippingThreshold(settings);
 if(!validShippingFee(threshold) || !Number.isSafeInteger(subtotal))return "";
 return subtotal>threshold ? "Đã đạt ngưỡng miễn phí giao hàng tại khu vực được hỗ trợ." : `Mua thêm ${(threshold+1-subtotal).toLocaleString("vi-VN")} đ để được miễn phí giao hàng tại khu vực được hỗ trợ.`;
}
export function shippingPolicy(enabled) {
  return enabled ? "Phí giao hàng được tính tự động theo Tỉnh/Thành phố và Phường/Xã trước khi quý khách xác nhận đặt đơn." : "Phí giao hàng sẽ được xác nhận sau.";
}


export function policyDescription(item,settings) {
 const promotion=/free\s*ship/i.test(item.title) || (item.kind==="shipping" && /miễn phí/i.test(item.content));
 return promotion ? shippingOffer(settings)||shippingPolicy(settings?.enabled) : item.content;
}
