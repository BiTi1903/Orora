import { useEffect, useRef, useState } from 'react';
import { getHomeContent, saveHomeContent, getProducts, explainError } from '../lib/api';
import ProductCareGuide from '../components/ProductCareGuide';
import { DEFAULT_CARE_GUIDE } from '../lib/product-care-guide';
import { SloganAppearanceEditor, SloganTypographyEditor } from './ProductSloganDesign';
export default function ProductCareSettings() {
  const [groups, setGroups] = useState([]);
  const [activeId, setActiveId] = useState('');
  const [products, setProducts] = useState([]), [query, setQuery] = useState('');
  const original = useRef({});
  const active = groups.find(group => group.id === activeId);
  const form = active?.guide ?? DEFAULT_CARE_GUIDE;
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [tab, setTab] = useState('content');
  useEffect(() => {
    let alive = true;
    Promise.all([getHomeContent(), getProducts()]).then(([home, catalog]) => {
      if (!alive) return;
      const saved = home?.productCareGuide;
      original.current = saved || {};
      const initial = Array.isArray(saved?.groups) ? saved.groups : [{ id: crypto.randomUUID(), name: 'Bộ hướng dẫn hiện có', productIds: catalog.map(product => String(product.id)), guide: saved ?? DEFAULT_CARE_GUIDE }];
      setGroups(initial); setActiveId(initial[0]?.id || ''); setProducts(catalog); setReady(true);
    }).catch(error => { if (alive) setNotice(explainError(error)); });
    return () => { alive = false; };
  }, []);
  const patch = p => setGroups(all => all.map(group => group.id === activeId ? { ...group, guide: { ...group.guide, ...p } } : group));
  const addGroup = (copy = false) => {
    const id = crypto.randomUUID();
    setGroups(all => [...all, { id, name: copy ? `${active.name} — bản sao` : 'Bộ chăm sóc mới', productIds: [], guide: structuredClone(copy ? form : DEFAULT_CARE_GUIDE) }]);
    setActiveId(id); setTab('content'); setNotice('');
  };
  const assignProduct = (id, checked) => setGroups(all => all.map(group => ({ ...group, productIds: group.id === activeId && checked ? [...new Set([...(group.productIds || []), id])] : (group.productIds || []).filter(value => value !== id) })));
  const items = form.items || [];
  const update = (id, p) => patch({ items: items.map((item, i) => i === id ? { ...item, ...p } : item) });
  const move = (index, direction) => { const next = [...items]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; patch({ items: next }); };
  return <form className="admin-card admin-form" onInvalidCapture={e => { setTab(e.target.closest('[data-care-tab]')?.dataset.careTab || 'content'); requestAnimationFrame(() => e.target.focus()); }} onSubmit={async e => { e.preventDefault(); if (!ready || busy) return; setBusy(true); try { await saveHomeContent({ productCareGuide: { ...original.current, groups } }); setNotice('Đã lưu phần hướng dẫn chăm sóc.'); } catch (error) { setNotice(explainError(error)); } finally { setBusy(false); } }}>
    <div className="slogan-settings-toolbar"><div><h2>Cách chăm sóc phù hợp</h2><p className="admin-muted">Mỗi bộ hướng dẫn áp dụng cho những sản phẩm bạn chọn. Mỗi sản phẩm dùng một bộ; các thay đổi chỉ áp dụng khi lưu.</p></div><button className="admin-btn primary" disabled={!ready || busy}>{busy ? 'Đang lưu…' : 'Lưu hướng dẫn'}</button></div>
    {notice && <p role="status">{notice}</p>}
    <fieldset className="writer-fields" disabled={!ready || busy}>
      <div className="care-library-toolbar"><div className="admin-field"><label htmlFor="care-guide-group">Bộ hướng dẫn</label><select id="care-guide-group" value={activeId} onChange={e => { setActiveId(e.target.value); setNotice(''); }}>{!groups.length && <option value="">Chưa có bộ hướng dẫn</option>}{groups.map(group => <option key={group.id} value={group.id}>{group.name || 'Chưa đặt tên'} · {(group.productIds || []).length} sản phẩm</option>)}</select></div><button type="button" className="admin-btn" onClick={() => addGroup()}>Tạo bộ mới</button>{active && <><button type="button" className="admin-btn" onClick={() => addGroup(true)}>Nhân bản</button><button type="button" className="admin-btn danger" onClick={() => { if (!window.confirm('Xóa bộ hướng dẫn này? Sản phẩm đang áp dụng sẽ không còn hướng dẫn sau khi lưu.')) return; const next = groups.filter(group => group.id !== activeId); setGroups(next); setActiveId(next[0]?.id || ''); }}>Xóa bộ</button></>}</div>
      {active && <><div className="admin-field"><label>Tên bộ hướng dẫn (chỉ dùng trong admin)<input value={active.name || ''} maxLength={160} onChange={e => setGroups(all => all.map(group => group.id === activeId ? { ...group, name: e.target.value } : group))} /></label></div>
      <details className="care-assignment" open><summary>Sản phẩm áp dụng · {(active.productIds || []).length} đã chọn</summary><p className="admin-muted">Chọn nhiều sản phẩm để dùng chung nội dung và giao diện. Chuyển một sản phẩm sang bộ này sẽ bỏ áp dụng ở bộ cũ. Không chọn sản phẩm thì bộ này chỉ là bản nháp.</p><div className="admin-field"><label>Tìm sản phẩm<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nhập tên hoặc số thứ tự…" /></label></div><div className="care-product-list">{products.filter(product => `${product.number || ''} ${product.name || ''}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map(product => { const id = String(product.id); const owner = groups.find(group => group.id !== activeId && group.productIds?.includes(id)); return <label className="care-product-choice" key={id}><input type="checkbox" checked={active.productIds?.includes(id) || false} onChange={e => assignProduct(id, e.target.checked)} /><span><strong>#{product.number || '—'} · {product.name}</strong>{owner && <small>Đang dùng: {owner.name}</small>}</span></label>; })}</div>{!products.length && <p className="admin-muted">Chưa có sản phẩm để áp dụng.</p>}</details>
      </>}
    </fieldset>
    {active && <fieldset className="writer-fields" disabled={!ready || busy}>
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
    </fieldset>} {active && <><h3>Xem trước · {active.name}</h3><ProductCareGuide value={{ ...form,enabled:true }} /></>}
  </form>;
}
