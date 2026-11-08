export const DEFAULT_PRODUCT_NEEDS = {
  enabled: true, title: 'Bạn muốn chăm sóc điều gì?', text: 'Chọn nhu cầu để xem những sản phẩm ORORA đã chọn cho bạn.', emptyText: 'ORORA đang cập nhật gợi ý cho nhu cầu này. Bạn có thể xem tất cả sản phẩm bên dưới.',
  items: ['Làm sạch', 'Dưỡng sáng', 'Khử mùi', 'Chưa biết chọn gì'].map((title, i) => ({ id: `need-${i}`, title, text: '', productIds: [] }))
};
export const DEFAULT_PRODUCT_FAQ = {
  enabled: true, title: 'Câu hỏi thường gặp', text: '', items: [
    { id: 'usage', title: 'Tôi xem cách sử dụng sản phẩm ở đâu?', text: 'Bạn có thể xem phần Hướng dẫn sử dụng ngay trên trang sản phẩm. Luôn đọc thêm hướng dẫn trên bao bì trước khi dùng.', productIds: [] },
    { id: 'choose', title: 'Tôi chưa biết sản phẩm có phù hợp không?', text: 'Hãy trò chuyện với ORORA để được hỗ trợ tìm hiểu sản phẩm trước khi đặt hàng.', productIds: [] },
  ]
};
export function productsForNeed(item, products = []) {
  const ids = new Set(item?.productIds || []);
  return products.filter(product => product.active !== false && ids.has(String(product.id)));
}
export function faqForProduct(settings, product) {
  if (settings?.enabled === false || !product?.id) return [];
  return (settings?.items || []).filter(item => item.enabled !== false && item.productIds?.includes(String(product.id)) && item.title?.trim() && item.text?.trim());
}
