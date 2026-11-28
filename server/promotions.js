const invalid = message => Object.assign(new Error(message), {status:400});
export function promotionCode(value) {
  const code = typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (!/^[A-Z0-9_-]{2,40}$/.test(code)) throw invalid('Mã ưu đãi phải có 2–40 ký tự chữ, số, dấu gạch ngang hoặc gạch dưới.');
  return code;
}
export function promotionRule(body) {
  const {type,value,minimum,limit,perEmail=0,expires,active} = body;
  if (!['percent','fixed'].includes(type) || !Number.isSafeInteger(value) || value < 1 || (type === 'percent' && value > 100) ||
      ![minimum,limit,perEmail].every(n => Number.isSafeInteger(n) && n >= 0) || typeof active !== 'boolean' ||
      (expires !== '' && (typeof expires !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(expires) || !Number.isFinite(Date.parse(expires)) || new Date(expires).toISOString().slice(0,10)!==expires))) throw invalid('Kiểm tra mức giảm, hạn dùng và giới hạn lượt dùng.');
  return {type,value,minimum,limit,perEmail,expires,active};
}
export function promotionDiscount(rule, subtotal, now) {
  if (!rule?.active || (rule.expires && now > Date.parse(rule.expires+'T23:59:59.999+07:00')) || (rule.limit && rule.used >= rule.limit)) throw invalid('Mã ưu đãi không hợp lệ, hết hạn hoặc đã hết lượt.');
  if (!Number.isSafeInteger(subtotal) || subtotal < 1 || subtotal < rule.minimum) throw invalid('Giá trị sản phẩm chưa đủ điều kiện áp dụng mã.');
  return Math.min(subtotal,rule.type === 'percent' ? Math.round(subtotal*rule.value/100) : rule.value);
}
