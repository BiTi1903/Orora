import { LOW_STOCK_THRESHOLD } from '../lib/stock';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebaseAuth';
import { effectiveMailState } from '../lib/mail-state';
import { orderRequest } from './order-api';

export default function TodayTasks({ onOpenOrder, onOpenInventory, revision }) {
  const [tasks, setTasks] = useState(null);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    async function inventory() {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error();
      const all = [];
      let cursor = null;
      for (let page = 0; page < 10; page++) {
        const url = cursor ? `/api/inventory?cursor=${encodeURIComponent(cursor)}` : '/api/inventory';
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json();
        all.push(...(data.items || []));
        cursor = data.nextCursor;
        if (!cursor) break;
      }
      return { items: all };
    }
    Promise.allSettled([
      orderRequest(null, {}, { signal: controller.signal }),
      orderRequest(null, { mailBounceSummary: '1' }, { signal: controller.signal }),
      inventory(),
    ]).then(([orders, history, inventory]) => {
      if (!active) return;
      const items = new Map();
      const availableOrders = orders.value?.orders || [];
      const byId = new Map(availableOrders.map(order => [order.id, order]));
      for (const order of availableOrders) {
        const reasons = [];
        if (order.status === 'new') reasons.push('Chưa xác nhận');
        const state = effectiveMailState(order.confirmationMail);
        if (state === 'failed') reasons.push('Mail lỗi');
        if (state === 'stuck') reasons.push('Mail bị kẹt');
        if (reasons.length) items.set(order.id, { id: order.id, code: order.code, phone: order.customer?.phone, reasons });
      }
      const bounceOrders = new Set();
      for (const event of history.value?.bounced || []) {
        if (bounceOrders.has(event.orderId)) continue;
        bounceOrders.add(event.orderId);
        const task = items.get(event.orderId) || { id: event.orderId, code: event.orderCode, phone: byId.get(event.orderId)?.customer?.phone, reasons: [] };
        items.set(event.orderId, { ...task, reasons: [...task.reasons, 'Mail bị trả lại'] });
      }
      setTasks({
        orders: [...items.values()].slice(0, 8),
        stock: (inventory.value?.items || []).filter(item => Number.isInteger(item.quantity) && item.quantity >= 0 && item.quantity <= LOW_STOCK_THRESHOLD).slice(0, 6),
        partial: [orders, history, inventory].some(result => result.status === 'rejected'),
      });
    });
    return () => { active = false; controller.abort(); };
  }, [revision]);

  return <section className="admin-card admin-today" aria-labelledby="admin-today-title">
    <h2 id="admin-today-title">Cần xử lý hôm nay</h2>
    <p className="admin-muted">Đơn gần đây và tồn kho đã kiểm đếm trong trang đầu. Mail bị trả lại chỉ hiện sau khi kiểm tra Outlook. Danh sách chưa tự quét Outlook.</p>
    {!tasks && <p role="status">Đang tải công việc…</p>}
    {tasks?.partial && <p className="admin-muted">Một phần dữ liệu chưa tải được.</p>}
    {tasks && !tasks.orders.length && !tasks.stock.length && <p>Chưa thấy việc cần xử lý trong dữ liệu đã tải.</p>}
    {!!tasks?.orders.length && <ul>{tasks.orders.map(order => <li key={order.id}>
      <button type="button" className="admin-btn" onClick={() => onOpenOrder(order.id)}>{order.code}</button>
      <span>{order.reasons.join(' · ')}</span>
      {order.phone && <a href={`tel:${order.phone}`}>Gọi khách</a>}
    </li>)}</ul>}
    {!!tasks?.stock.length && <div><h3>Sản phẩm sắp hết</h3><ul>{tasks.stock.map(item => <li key={item.id}>{item.name} · {item.quantity} trong kho</li>)}</ul><button type="button" className="admin-btn" onClick={onOpenInventory}>Mở kiểm kho</button></div>}
  </section>;
}
