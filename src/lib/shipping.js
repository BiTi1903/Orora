export const validShippingFee = (value) => Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
// null means not quoted; zero explicitly means free shipping.
export function shippingFeeFor(settings, provinceCode, wardCode) {
  if (settings?.enabled !== true) return { fee: null, reason: "Phí giao hàng sẽ được xác nhận sau." };
  if (!provinceCode || !wardCode) return { fee: null, reason: "Chọn địa chỉ để tính phí giao hàng." };
  const province = settings.provinces?.[provinceCode];
  const override = province?.wardFees?.[wardCode];
  const fee = override !== undefined && override !== null ? override : province?.fee;
  return validShippingFee(fee) ? { fee, reason: "" } : { fee: null, reason: "Chưa có phí giao hàng cho địa chỉ này. Vui lòng liên hệ ORORA." };
}
