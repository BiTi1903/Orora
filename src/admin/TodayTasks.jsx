import { LOW_STOCK_THRESHOLD } from '../lib/stock';
import { useEffect, useState } from 'react';
import { auth } from '../lib/firebaseAuth';
import { effectiveMailState, mailTimestampMs } from "../lib/mail-state";
import { analyticsDay } from '../lib/analytics';
import { orderRequest } from './order-api';

const dateTime = new Intl.DateTimeFormat('vi-VN', { timeZone:'Asia/Ho_Chi_Minh', dateStyle:'short', timeStyle:'short' });
const queries = { orders:{status:'new'}, mail:{mailReview:'1'} };
const issueLabels = { failed:'Gửi thất bại', bounced:'Bị trả lại', delayed:'Giao thư chậm', not_found:'Chưa tìm thấy trong Outlook', unknown:'Chưa rõ kết quả', unconfirmed:'Chưa xác nhận gửi thành công' };

function taskRows(kind, page) {
  if (kind === 'orders') return page.orders.map(o => ({key:o.id, orderId:o.id, code:o.code, when:o.createdAt, reason:'Chưa xác nhận', phone:o.customer?.phone}));
  return page.rows.filter(r => r.orderId).map(r => {
    const type = r.kind === 'store' ? 'Thông báo cửa hàng' : ({'status-shipping':'Thư đang giao','status-completed':'Thư cảm ơn','confirmation-auto':'Thư xác nhận đơn'})[r.eventId] || 'Thư đơn hàng';
    const issue = issueLabels[r.outlook?.state] || issueLabels[r.state] || 'Cần kiểm tra';
    return {key:r.id, orderId:r.orderId, code:r.code, when:r.issueAt || r.createdAt, reason:type + ' · ' + issue, detail:r.outlook?.diagnosticCode};
  });
}

function TaskGroup({kind, onOpenOrder, revision}) {
  const [page,setPage] = useState({rows:[],cursor:null,loading:true});
  const [load,setLoad] = useState({cursor:null,attempt:0});
  useEffect(() => {
    const controller = new AbortController();
    orderRequest(null,{...queries[kind], ...(load.cursor ? {cursor:load.cursor} : {})},{signal:controller.signal}).then(data => {
      if (controller.signal.aborted) return;
      const rows = taskRows(kind,data);
      setPage(p => ({rows:[...new Map([...(load.cursor ? p.rows : []),...rows].map(r => [r.key,r])).values()],cursor:data.nextCursor || data.cursor,loading:false}));
    }).catch(error => { if (!controller.signal.aborted) setPage(p => ({...p,loading:false,error:error.status === 401 ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' : error.status === 403 ? 'Tài khoản chưa có quyền xem dữ liệu này.' : kind === 'orders' ? 'Chưa tải được danh sách đơn chờ xác nhận.' : 'Chưa tải được danh sách thư cần kiểm tra.'})); });
    return () => controller.abort();
  },[kind,load,revision]);
  const groups = new Map();
  const [now,setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  },[]);
  const today = analyticsDay(now);
  const yesterday = analyticsDay(now-86400000);
  function loadPage(cursor) {
    setPage(p => ({...p, loading:true, error:false}));
    setLoad({cursor, attempt:load.attempt+1});
  }
  for (const row of page.rows) {
    const day = row.when ? analyticsDay(row.when) : '';
    if (!groups.has(day)) groups.set(day,[]);
    groups.get(day).push(row);
  }
  return <section className="admin-today-group">
    <h3>{kind === 'orders' ? 'Đơn chờ xác nhận · theo ngày đặt' : 'Thư cần kiểm tra · theo ngày phát sinh lỗi'}</h3>
    {[...groups].sort(([a],[b]) => b.localeCompare(a)).map(([day,rows]) => <div key={day}>
      <h4>{day === today ? 'Hôm nay · ' : day === yesterday ? 'Hôm qua · ' : ''}{day ? day.split('-').reverse().join('/') : 'Chưa rõ ngày'} · {rows.length} {kind === 'orders' ? 'đơn' : 'thư'}</h4>
      <ul className="admin-task-list">{rows.map(r => <li key={r.key}>
        <button type="button" className="admin-btn" onClick={() => onOpenOrder(r.orderId)}>{r.code || r.orderId}</button>
        {r.when > 0 && <time dateTime={new Date(r.when).toISOString()}>{dateTime.format(r.when)}</time>}
        <span className="admin-task-tag">{r.reason}</span>{r.detail && <span>{r.detail}</span>}
        {r.phone && <a href={`tel:${r.phone}`}>Gọi khách</a>}
      </li>)}</ul>
    </div>)}
    {page.loading && <p role="status">Đang tải…</p>}
    {!page.loading && !page.error && !page.cursor && !page.rows.length && <p>{kind === 'orders' ? 'Không có đơn chờ xác nhận.' : 'Không có thư được ghi nhận cần kiểm tra.'}</p>}
    {page.error && <p role="alert">{page.error} <button type="button" className="admin-btn" onClick={() => loadPage(load.cursor)}>Thử lại</button></p>}
    {page.cursor && <p className="admin-muted">Số lượng theo ngày tính trên các dòng đã tải. Còn dữ liệu ở trang sau.</p>}
    {page.cursor && !page.error && <button type="button" className="admin-btn" disabled={page.loading} onClick={() => loadPage(page.cursor)}>Tải thêm {kind === 'orders' ? 'đơn' : 'thư'}</button>}
  </section>;
}

export default function TodayTasks({ onOpenOrder, onOpenInventory, revision }) {
  const [stock,setStock] = useState(null);
  const [stalled,setStalled] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    orderRequest(null, {}, {signal:controller.signal}).then(data => {
      if (!controller.signal.aborted) setStalled(data.orders.filter(order => effectiveMailState(order.confirmationMail) === 'stuck'));
    }).catch(() => { if (!controller.signal.aborted) setStalled(null); });
    return () => controller.abort();
  },[revision]);
  useEffect(() => {
    const controller = new AbortController();
    async function inventory() {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error();
      const response = await fetch('/api/inventory?lowStock=1',{headers:{Authorization:`Bearer ${token}`},signal:controller.signal});
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (!controller.signal.aborted) setStock(data.items.filter(item => (item.available ?? item.quantity) <= LOW_STOCK_THRESHOLD));
    }
    inventory().catch(() => { if (!controller.signal.aborted) setStock(false); });
    return () => controller.abort();
  },[revision]);
  return <section className="admin-card admin-today">
    <h2>Việc cần xử lý</h2>
    {Object.keys(queries).map(kind => <TaskGroup key={kind + revision} kind={kind} revision={revision} onOpenOrder={onOpenOrder} />)}
    {stalled === null && <p>Chưa kiểm tra được thư xác nhận bị kẹt.</p>}
    {stalled?.length > 0 && <section className="admin-today-group">
      <h3>Thư xác nhận bị kẹt trong 50 đơn gần nhất</h3>
      <ul className="admin-task-list">{stalled.map(order => {
        const when = mailTimestampMs(order.confirmationMail.updatedAt);
        return <li key={order.id}><button type="button" className="admin-btn" onClick={() => onOpenOrder(order.id)}>{order.code}</button>
          {Number.isFinite(when) && dateTime.format(when)} · Chưa có kết quả sau khi bắt đầu gửi
        </li>;
      })}</ul>
    </section>}
    {stock === false && <p>Chưa tải được tồn kho.</p>}
    {stock?.length > 0 && <section className="admin-today-group"><h3>Sản phẩm sắp hết</h3>
      <ul className="admin-task-list">{stock.slice(0,6).map(item => <li key={item.id}>{item.name} · Còn bán {item.available ?? item.quantity}</li>)}</ul>
      <button type="button" className="admin-btn" onClick={onOpenInventory}>Mở kiểm kho</button>
    </section>}
  </section>;
}
