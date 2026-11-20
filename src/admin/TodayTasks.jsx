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
      const response = await fetch('/api/inventory?lowStock=1', { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal });
      if (!response.ok) throw new Error();
      return response.json();
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
        stock: (inventory.value?.items || []).filter(item => {
          const avail = Number.isInteger(item.available) ? item.available : item.quantity;
          return Number.isInteger(avail) && avail >= 0 && avail <= LOW_STOCK_THRESHOLD;
        }).slice(0, 6),
        partial: [orders, history, inventory].some(result => result.status === 'rejected'),
      });
    });
    return () => { active = false; controller.abort(); };
  }, [revision]);

  return <section className="admin-card admin-today" aria-labelledby="admin-today-title">
    <div className="admin-today-head">
      <div>
        <h2 id="admin-today-title">Cần xử lý hôm nay</h2>
        <p className="admin-muted">Đơn mới, lỗi gửi thư và sản phẩm sắp hết cần ưu tiên.</p>
      </div>
      {!!tasks?.stock.length && <button type="button" className="admin-btn" onClick={onOpenInventory}>Mở kiểm kho</button>}
    </div>
    {!tasks && <p className="admin-muted" role="status">Đang tải công việc…</p>}
    {tasks?.partial && <p className="admin-muted">Một phần dữ liệu chưa tải được.</p>}
    {tasks && !tasks.orders.length && !tasks.stock.length && <p className="admin-muted">Mọi đơn hàng và tồn kho đều ổn định.</p>}
    {!!tasks?.orders.length && (
      <div className="admin-today-group">
        <h3>Đơn hàng ({tasks.orders.length})</h3>
        <ul className="admin-task-list">{tasks.orders.map(order => <li key={order.id}>
          <button type="button" className="admin-btn" onClick={() => onOpenOrder(order.id)}>{order.code}</button>
          <span className="admin-task-reasons">{order.reasons.map(reason => <span key={reason} className="admin-task-tag">{reason}</span>)}</span>
          {order.phone && <a className="admin-task-call" href={`tel:${order.phone}`}>Gọi khách</a>}
        </li>)}</ul>
      </div>
    )}
    {!!tasks?.stock.length && (
      <div className="admin-today-group">
        <h3>Sản phẩm sắp hết ({tasks.stock.length})</h3>
        <ul className="admin-task-list admin-task-stock">{tasks.stock.map(item => <li key={item.id}>
          <span>{item.name}</span>
          <span className="admin-task-tag is-warn">{item.reserved > 0 ? `Còn bán ${item.available} (tồn ${item.quantity}, chờ ${item.reserved})` : `Còn ${item.quantity}`}</span>
        </li>)}</ul>
      </div>
    )}
  </section>;
}
