export const DEFAULT_CARE_GUIDE = { enabled: true, title: 'Chọn cách chăm sóc phù hợp với bạn', text: 'Tham khảo các bước chăm sóc dưới đây và điều chỉnh theo nhu cầu của bạn.', items: [
  { id: 'daily', title: 'Chăm sóc mỗi ngày', text: 'Làm sạch nhẹ nhàng, giữ da khô thoáng và chọn sản phẩm phù hợp với vùng da cần chăm sóc.' },
  { id: 'bright', title: 'Dưỡng da đều đặn', text: 'Sử dụng theo hướng dẫn của từng sản phẩm. Bắt đầu với lượng nhỏ và theo dõi phản ứng của da.' },
  { id: 'travel', title: 'Chăm sóc khi di chuyển', text: 'Duy trì thói quen chăm sóc khi đi làm hoặc du lịch. Chuẩn bị sản phẩm cần thiết và bảo quản đúng hướng dẫn.' }
] };

// Product IDs are stable database IDs; numbering and slugs may change.
export function careGuideForProduct(settings, product) {
  if (Array.isArray(settings?.groups)) {
    if (settings.enabled === false || !product?.id) return { enabled: false };
    return settings.groups.find(group => Array.isArray(group.productIds) && group.productIds.includes(String(product.id)))?.guide ?? { enabled: false };
  }
  return settings ?? DEFAULT_CARE_GUIDE;
}

export function normalizeCareGuideGroups(saved, catalog = []) {
  if (Array.isArray(saved?.groups)) {
    return saved.groups;
  }
  const baseGuide = saved && typeof saved === 'object' ? { ...DEFAULT_CARE_GUIDE, ...saved } : { ...DEFAULT_CARE_GUIDE };
  delete baseGuide.groups;
  return [
    {
      id: 'default-care-guide',
      name: 'Bộ hướng dẫn hiện có',
      productIds: catalog.map(product => String(product.id)),
      guide: baseGuide,
    },
  ];
}
