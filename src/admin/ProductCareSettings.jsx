import { useEffect, useState } from 'react';
import { getHomeContent, saveHomeContent, explainError } from '../lib/api';
import ProductCareGuide from '../components/ProductCareGuide';
import { DEFAULT_CARE_GUIDE } from '../lib/product-care-guide';
import { SloganAppearanceEditor, SloganTypographyEditor } from './ProductSloganDesign';
export default function ProductCareSettings() {
  const [form, setForm] = useState(DEFAULT_CARE_GUIDE);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [tab, setTab] = useState('content');
  useEffect(() => { let active = true; getHomeContent().then(home => { if (active) { setForm(home?.productCareGuide ?? DEFAULT_CARE_GUIDE); setReady(true); } }).catch(e => { if (active) setNotice(explainError(e)); }); return () => { active = false; }; }, []);
  const patch = p => setForm(f => ({ ...f, ...p }));
  const items = form.items || [];
  const update = (id, p) => patch({ items: items.map((item, i) => i === id ? { ...item, ...p } : item) });
  const move = (index, direction) => { const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; patch({ items: next }); };
  return <form className="admin-card admin-form" onInvalidCapture={e => { setTab(e.target.closest('[data-care-tab]')?.dataset.careTab || 'content'); requestAnimationFrame(() => e.target.focus()); }} onSubmit={async e => { e.preventDefault(); if (!ready || busy) return; setBusy(true); try { await saveHomeContent({ productCareGuide: form }); setNotice('Đã lưu phần hướng dẫn chăm sóc.'); } catch (error) { setNotice(explainError(error)); } finally { setBusy(false); } }}>
    <div className="slogan-settings-toolbar"><div><h2>Cách chăm sóc phù hợp</h2><p className="admin-muted">Hiển thị trên footer của trang chi tiết sản phẩm. Nội dung ban đầu là mẫu để bạn chỉnh sửa.</p></div><button className="admin-btn primary" disabled={!ready || busy}>{busy ? 'Đang lưu…' : 'Lưu hướng dẫn'}</button></div>
    {notice && <p role="status">{notice}</p>}
    <fieldset className="writer-fields" disabled={!ready || busy}>
      <nav className="slogan-settings-tabs">{[['content','Nội dung'],['text','Kiểu chữ'],['card','Khung và nền']].map(([id,label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>
      <div hidden={tab !== 'content'} data-care-tab="content">
        <label className="admin-check"><input type="checkbox" checked={form.enabled !== false} onChange={e => patch({ enabled: e.target.checked })} />Hiển thị hướng dẫn chăm sóc</label>
        <div className="admin-field"><label>Tiêu đề<input value={form.title || ''} maxLength={160} onChange={e => patch({ title: e.target.value })} /></label></div>
        <div className="admin-field"><label>Lời giới thiệu<textarea value={form.text || ''} maxLength={2000} onChange={e => patch({ text: e.target.value })} /></label></div>
        {items.map((item,i) => <div className="slogan-design-editor" key={item.id || i}><div className="product-editor-heading"><strong>Cách chăm sóc {i + 1}</strong><div><button type="button" className="admin-btn" disabled={i === 0} onClick={() => move(i,-1)}>Lên</button><button type="button" className="admin-btn" disabled={i === items.length - 1} onClick={() => move(i,1)}>Xuống</button><button type="button" className="admin-btn danger" onClick={() => patch({ items: items.filter((_,n) => n !== i) })}>Xóa</button></div></div>{[['title','Tên cách chăm sóc'],['text','Nội dung'],['label','Chữ liên kết (không bắt buộc)'],['url','Đường dẫn (https:// hoặc /…)']].map(([key,label]) => <div className="admin-field" key={key}><label>{label}{key === 'text' ? <textarea value={item[key] || ''} maxLength={4000} onChange={e => update(i,{ [key]: e.target.value })} /> : <input value={item[key] || ''} maxLength={key === 'url' ? 2000 : 200} onChange={e => update(i,{ [key]: e.target.value })} />}</label></div>)}</div>)}
        <button type="button" className="admin-btn" onClick={() => patch({ items: [...items,{ id: crypto.randomUUID(),title:'',text:'' }] })}>Thêm cách chăm sóc</button>
      </div>
      <div hidden={tab !== 'text'} data-care-tab="text">{[['heading','Tiêu đề khối'],['body','Lời giới thiệu'],['itemHeading','Tiêu đề từng mục'],['itemBody','Nội dung từng mục'],['linkStyle','Chữ liên kết']].map(([key,title]) => <SloganTypographyEditor key={key} title={title} body={key !== 'heading'} value={form[key]} onChange={p => patch({ [key]: { ...form[key],...p } })} />)}</div>
      <div hidden={tab !== 'card'} data-care-tab="card"><h3>Khung toàn bộ phần chăm sóc</h3><SloganAppearanceEditor value={form.card} onChange={p => patch({ card: { ...form.card,...p } })} /><h3>Khung từng cách chăm sóc</h3><SloganAppearanceEditor value={form.itemCard} onChange={p => patch({ itemCard: { ...form.itemCard,...p } })} /></div>
    </fieldset><h3>Xem trước</h3><ProductCareGuide value={{ ...form,enabled:true }} />
  </form>;
}
