import { useEffect, useRef, useState } from 'react';
import { getHomeContent, saveHomeContent, explainError } from '../lib/api';
import { ORDER_TRACKING_FIELDS, trackingCopy } from '../lib/order-tracking-copy';
import { changedValues } from './builder/save-sections';
export default function OrderTrackingSettings() {
  const [form,setForm] = useState({}),[ready,setReady] = useState(false),[busy,setBusy] = useState(false),[notice,setNotice] = useState('');
  const baseline = useRef({});
  useEffect(()=>{let alive=true;getHomeContent().then(home=>{if(alive){const saved=home?.orderTrackingText || {};setForm(saved);baseline.current=saved;setReady(true);}}).catch(error=>{if(alive)setNotice(explainError(error));});return()=>{alive=false;};},[]);
  return <form className="admin-card admin-form" onSubmit={async event=>{event.preventDefault();if(!ready||busy)return;setBusy(true);setNotice('');try{const patch=changedValues(baseline.current,form);if(Object.keys(patch).length)await saveHomeContent({orderTrackingText:patch});baseline.current=form;setNotice('Đã lưu chữ trang tra cứu.');}catch(error){setNotice(explainError(error));}finally{setBusy(false);}}}>
    <div className="slogan-settings-toolbar"><div><h2>Chữ trang tra cứu đơn hàng</h2><p className="admin-muted">Để trống để dùng chữ mặc định. Chữ trên navbar chỉnh tại Visual Builder → Navbar → chọn mục tra cứu.</p></div><button className="admin-btn primary" disabled={!ready||busy}>{busy?'Đang lưu…':'Lưu chữ'}</button></div>
    {notice&&<p role="status">{notice}</p>}
    <fieldset className="writer-fields" disabled={!ready||busy}>{ORDER_TRACKING_FIELDS.map(([key,label,fallback])=><div className="admin-field" key={key}><label>{label}{['intro','help','statusHelp'].includes(key)?<textarea rows={3} value={form[key]||''} placeholder={fallback} maxLength={2000} onChange={event=>{setForm(current=>({...current,[key]:event.target.value}));setNotice('');}}/>:<input value={form[key]||''} placeholder={fallback} maxLength={240} onChange={event=>{setForm(current=>({...current,[key]:event.target.value}));setNotice('');}}/>}</label></div>)}</fieldset>
    <h3>Xem trước nội dung</h3><p>{trackingCopy(form).title}</p><p>{trackingCopy(form).intro}</p><a href="/tra-cuu-don-hang" target="_blank" rel="noreferrer">Mở trang tra cứu</a>
  </form>;
}
