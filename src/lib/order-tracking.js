export const ORDER_STATUSES = { new: 'Mới nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', completed: 'Hoàn tất', cancelled: 'Đã hủy' };
export function normalizeTrackingPhone(value) {
  if (typeof value !== 'string' || value.length > 32 || !/^\+?[\d\s().-]+$/.test(value.trim())) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return '';
  return digits.startsWith('84') && [11,12].includes(digits.length) ? `0${digits.slice(2)}` : digits;
}
