import useDraftGuard from "../hooks/useDraftGuard";
import { useEffect, useState } from 'react';
import { getHomeContent, getProducts, saveHomeContent, explainError } from '../lib/api';
import { DEFAULT_PRODUCT_NEEDS, DEFAULT_PRODUCT_FAQ } from '../lib/product-discovery';
import { ProductNeedsView, ProductFaq } from '../components/ProductDiscovery';
import { SloganTypographyEditor, SloganAppearanceEditor } from './ProductSloganDesign';

export default function ProductDiscoverySettings({ faq = false }) {
  const storageKey = faq ? 'productFaq' : 'productNeeds';
  const defaults = faq ? DEFAULT_PRODUCT_FAQ : DEFAULT_PRODUCT_NEEDS;
  const [form, setForm] = useState(defaults), [products, setProducts] = useState([]);
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const [tab, setTab] = useState('content');
  useEffect(() => {
    let alive = true;
    Promise.all([getHomeContent(), getProducts()]).then(([home, catalog]) => { if (alive) { setForm(home?.[storageKey] ?? defaults); setProducts(catalog); setReady(true); } }).catch(error => { if (alive) setNotice(explainError(error)); });
    return () => { alive = false; };
  }, [storageKey, defaults]);
  const patch = next => { setForm(current => ({ ...current, ...next })); setNotice(''); };
  const items = form.items || [];
  const update = (index, next) => patch({ items: items.map((item, i) => i === index ? { ...item, ...next } : item) });
  const move = (index, offset) => { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; patch({ items: next }); };
  const markSaved=useDraftGuard(form,{enabled:ready,busy});
  return <form aria-busy={busy} className="admin-card admin-form" onInvalidCapture={e => { setTab(e.target.closest('[data-discovery-tab]')?.dataset.discoveryTab || 'content'); requestAnimationFrame(() => e.target.focus()); }} onSubmit={async e => { e.preventDefault(); if (!ready || busy) return; setBusy(true); try { await saveHomeContent({ [storageKey]: form }); markSaved();setNotice('Đã lưu thiết lập.'); } catch (error) { setNotice(explainError(error)); } finally { setBusy(false); } }}>
    <div className="slogan-settings-toolbar"><div><h2>{faq ? 'Câu hỏi thường gặp theo sản phẩm' : 'Chọn sản phẩm theo nhu cầu'}</h2><p className="admin-muted">{faq ? 'Mỗi câu hỏi chọn được nhiều sản phẩm áp dụng. Mẫu chưa gán sản phẩm sẽ chưa hiển thị.' : 'Hiển thị trước bộ sưu tập trên trang chủ. Chọn sản phẩm gợi ý cho từng nhu cầu; không tự suy đoán công dụng sản phẩm.'}</p></div><button className="admin-btn primary" aria-busy={busy} disabled={!ready || busy}>{busy ? 'Đang lưu…' : 'Lưu thiết lập'}</button></div>
    {notice && <p role="status">{notice}</p>}
    <fieldset className="writer-fields" disabled={!ready || busy}>
      <nav className="slogan-settings-tabs">{[['content','Nội dung'],['text','Kiểu chữ'],['card','Khung và nền']].map(([id,label]) => <button type="button" key={id} aria-pressed={tab === id} onClick={() => setTab(id)}>{label}</button>)}</nav>
      <div hidden={tab !== 'content'} data-discovery-tab="content">
        <label className="admin-check"><input type="checkbox" checked={form.enabled !== false} onChange={e => patch({ enabled: e.target.checked })} />Hiển thị phần này trên website</label>
        {[['title','Tiêu đề'],['text','Lời giới thiệu'],...(!faq ? [['emptyText','Thông báo khi chưa có gợi ý'],['linkLabel','Chữ xem tất cả sản phẩm']] : [])].map(([key,label]) => <div className="admin-field" key={key}><label>{label}<input value={form[key] || ''} maxLength={1000} onChange={e => patch({ [key]: e.target.value })} /></label></div>)}
        {items.map((item,index) => <div className="slogan-design-editor" key={item.id}><div className="product-editor-heading"><strong>{faq ? 'Câu hỏi' : 'Nhu cầu'} {index + 1}</strong><div className="admin-actions"><button type="button" className="admin-btn" disabled={index === 0} onClick={() => move(index,-1)}>Lên</button><button type="button" className="admin-btn" disabled={index === items.length - 1} onClick={() => move(index,1)}>Xuống</button><button type="button" className="admin-btn danger" onClick={() => patch({ items: items.filter((_,i) => i !== index) })}>Xóa</button></div></div>
          <label className="admin-check"><input type="checkbox" checked={item.enabled !== false} onChange={e => update(index,{ enabled: e.target.checked })} />Hiển thị mục này</label>
          <div className="admin-field"><label>{faq ? 'Câu hỏi' : 'Tên nhu cầu'}<input value={item.title || ''} maxLength={240} onChange={e => update(index,{ title: e.target.value })} /></label></div>
          <div className="admin-field"><label>{faq ? 'Câu trả lời' : 'Lời gợi ý cho nhu cầu này'}<textarea rows={4} value={item.text || ''} maxLength={4000} onChange={e => update(index,{ text: e.target.value })} /></label></div>
          <details className="care-assignment"><summary>{faq ? 'Sản phẩm áp dụng' : 'Sản phẩm gợi ý'} · {(item.productIds || []).length} đã chọn</summary><div className="care-product-list">{products.map(product => { const id = String(product.id); return <label className="care-product-choice" key={id}><input type="checkbox" checked={item.productIds?.includes(id) || false} onChange={e => update(index,{ productIds: e.target.checked ? [...new Set([...(item.productIds || []), id])] : (item.productIds || []).filter(value => value !== id) })} /><span>#{product.number || '—'} · {product.name}{product.active === false ? ' · đang ẩn' : ''}</span></label>; })}</div>{!products.length && <p>Chưa có sản phẩm để chọn.</p>}</details>
        </div>)}
        <button type="button" className="admin-btn" onClick={() => patch({ items: [...items,{ id: crypto.randomUUID(), title:'',text:'',productIds:[] }] })}>{faq ? 'Thêm câu hỏi' : 'Thêm nhu cầu'}</button>
      </div>
      <div hidden={tab !== 'text'} data-discovery-tab="text">{[['heading','Tiêu đề khối'],['body','Lời giới thiệu'],['itemHeading',faq ? 'Chữ câu hỏi' : 'Tên nhu cầu và sản phẩm'],['itemBody',faq ? 'Chữ trả lời' : 'Lời gợi ý và giá'],...(!faq ? [['linkStyle','Liên kết xem tất cả']] : [])].map(([key,title]) => <SloganTypographyEditor key={key} title={title} body={key !== 'heading'} value={form[key]} onChange={next => patch({ [key]: { ...form[key], ...next } })} />)}</div>
      <div hidden={tab !== 'card'} data-discovery-tab="card"><h3>Khung toàn phần</h3><SloganAppearanceEditor value={form.card} onChange={next => patch({ card:{ ...form.card,...next } })} /><h3>{faq ? 'Khung từng câu hỏi' : 'Khung sản phẩm gợi ý'}</h3><SloganAppearanceEditor allowTitleToggle={!faq} value={form.itemCard} onChange={next => patch({ itemCard:{ ...form.itemCard,...next } })} /></div>
    </fieldset>
    <div className="admin-preview-toolbar"><h3>Xem trước</h3><button type="button" className="admin-btn" role="switch" aria-label={faq ? 'Hiển thị FAQ trên website' : 'Hiển thị chọn theo nhu cầu trên website'} aria-checked={form.enabled !== false} disabled={!ready || busy} onClick={() => patch({ enabled: form.enabled === false })}>{form.enabled === false ? 'Đang tắt · Bật' : 'Đang bật · Tắt'}</button></div>
    <p className="admin-muted">Bấm Lưu thiết lập để áp dụng trên website. Nội dung đã nhập vẫn được giữ khi tắt.</p>
    <div data-admin-preview>{form.enabled === false ? <p className="admin-preview-hidden" role="status">Phần này đang tắt. Bật lại để xem trước và hiển thị trên website sau khi lưu.</p> : faq ? <ProductFaq value={form} preview /> : <ProductNeedsView preview value={form} products={products.filter(product => product.active !== false)} />}</div>
  </form>;
}
