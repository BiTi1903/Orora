import {useNavigate} from 'react-router-dom';
import {productPath} from '../lib/product-identity';
import {useEffect,useState} from 'react';
import useHomeContent from '../hooks/useHomeContent';
import useProducts from '../hooks/useProducts';
import {productVolumeOptions,volumePriceText} from '../lib/product-options';
import {parseVndPrice,formatVnd} from '../lib/commerce';
import ModalDialog from './ModalDialog';
import ProductPurchaseSelection from './ProductPurchaseSelection';
import {toCss} from '../lib/typography';
import '../styles/shop-cart.css';
import {cdnSrc,THUMB} from '../lib/image-cdn';
const key='orora-cart-v1';
import {CART_COPY} from '../lib/cart-copy';
export default function ShopCart(){
 const navigate=useNavigate();
 const home=useHomeContent(),{products}=useProducts(),settings=home.navStyles?.cart||{},copy={...CART_COPY,...settings.copy};
 if(copy.order==='Đặt sản phẩm này')copy.order='Chi tiết';
 const [rows,setRows]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem(key));return Array.isArray(saved)?saved.filter(r=>r&&typeof r.id==='string'&&typeof r.variantId==='string'&&Number.isInteger(r.quantity)&&r.quantity>0&&r.quantity<=20).slice(0,100):[];}catch{return [];}}),[open,setOpen]=useState(false),[pending,setPending]=useState(null),[variant,setVariant]=useState(''),[quantity,setQuantity]=useState(1),[notice,setNotice]=useState('');
 useEffect(()=>{try{localStorage.setItem(key,JSON.stringify(rows));}catch{/* Cart remains usable without storage. */}window.dispatchEvent(new CustomEvent('orora-cart-count',{detail:rows.reduce((n,r)=>n+r.quantity,0)}));},[rows]);
 useEffect(()=>{const show=()=>setOpen(true),add=e=>{if(settings.enabled===false)return;const product=products.find(p=>p.id===e.detail.id);if(!product)return;const options=productVolumeOptions(product);if(options.length>1){setPending({product,source:e.detail.source});setVariant('');setQuantity(1);}else addRow(product,options[0]?.id||'',1,e.detail.source);};
 function addRow(product,variantId,amount,source){setRows(old=>{const found=old.find(r=>r.id===product.id&&r.variantId===variantId);return found?old.map(r=>r===found?{...r,quantity:Math.min(20,r.quantity+amount)}:r):old.length<100?[...old,{id:product.id,variantId,quantity:amount}]:old;});setNotice(copy.added);if(settings.animation!==false)fly(source,cdnSrc(product.image,THUMB));}
 const confirm=e=>addRow(e.detail.product,e.detail.variantId,e.detail.quantity,e.detail.source);
 window.addEventListener('orora-cart-open',show);window.addEventListener('orora-cart-add',add);window.addEventListener('orora-cart-confirm',confirm);return()=>{window.removeEventListener('orora-cart-open',show);window.removeEventListener('orora-cart-add',add);window.removeEventListener('orora-cart-confirm',confirm);};
 },[products,copy.added,settings.enabled,settings.animation]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2200);return()=>clearTimeout(timer);},[notice]);
 const resolved=rows.map(r=>({...r,product:products.find(p=>p.id===r.id)}));
 const total=resolved.reduce((sum,r)=>{const p=r.product;if(!p)return null;const options=productVolumeOptions(p),option=options.find(v=>v.id===r.variantId);if(options.length&&!option)return null;const price=parseVndPrice(volumePriceText(p,option));return sum===null||price===null?null:sum+price*r.quantity;},0);
 if(settings.enabled===false)return null;
 return <><button className="desktop-cart" data-cart-target onClick={()=>setOpen(true)} aria-label={copy.label}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01"/></svg> {copy.label} ({rows.reduce((n,r)=>n+r.quantity,0)})</button><div className="cart-announcement" role="status">{notice}</div>
 {pending&&<ModalDialog title={copy.choose} onClose={()=>setPending(null)}><ProductPurchaseSelection options={productVolumeOptions(pending.product)} variantId={variant} quantity={quantity} onVariantChange={setVariant} onQuantityChange={setQuantity}/><button className="cart-primary" disabled={!variant||!quantity} onClick={()=>{window.dispatchEvent(new CustomEvent('orora-cart-confirm',{detail:{...pending,variantId:variant,quantity}}));setPending(null);}}>{copy.add}</button></ModalDialog>}
 {open&&<ModalDialog title={copy.title} className="shop-cart" style={{'--cart-accent':settings.accent||'#b8446d',...toCss(settings.text)}} onClose={()=>setOpen(false)}><div style={toCss(settings.text)}>{!rows.length&&<p>{copy.empty}</p>}{resolved.map((r,index)=>{const p=r.product,options=p?productVolumeOptions(p):[],option=options.find(v=>v.id===r.variantId),valid=p&&(!options.length||option);return <article className="cart-row" key={`${r.id}:${r.variantId}`}>{p?.image?<img src={cdnSrc(p.image,THUMB)} alt=""/>:<div className="cart-image-placeholder" aria-hidden="true"/>}<div className="cart-row-body"><strong>{p?.name||'Sản phẩm chưa khả dụng'}</strong>{option&&<p>{option.label}</p>}<p>{valid?(parseVndPrice(volumePriceText(p,option))===null?'Liên hệ':formatVnd(parseVndPrice(volumePriceText(p,option)))):'Vui lòng thêm lại sản phẩm'}</p><div className="cart-row-actions"><input aria-label={`Số lượng ${p?.name||r.id}`} type="number" min="1" max="20" value={r.quantity} onChange={e=>setRows(old=>old.map((row,i)=>i===index?{...row,quantity:Math.min(20,Math.max(1,Math.trunc(Number(e.target.value))||1))}:row))}/><button onClick={()=>setRows(old=>old.filter((_,i)=>i!==index))}>{copy.remove}</button><button disabled={!valid} onClick={()=>{setOpen(false);navigate(productPath(p,products),{state:{cartSelection:{productId:p.id,variantId:r.variantId,quantity:r.quantity}}});}}>{copy.order}</button></div></div></article>;})}{rows.length>0&&<p>{copy.shipping}<br/>{copy.total}: <strong>{total===null?'Liên hệ':formatVnd(total)}</strong></p>}</div></ModalDialog>}
</>;
}
function fly(source,image){const target=[...document.querySelectorAll('[data-cart-target]')].find(el=>el.getBoundingClientRect().width>0);if(!target)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const end=target.getBoundingClientRect();const start=source||end;const dot=document.createElement('div');dot.className='cart-flying';if(image){const img=document.createElement('img');img.src=image;img.alt='';dot.append(img);}dot.style.left=`${start.x}px`;dot.style.top=`${start.y}px`;document.body.append(dot);const dx=end.x+end.width/2-start.x-22,dy=end.y+end.height/2-start.y-22;dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.45}px,${Math.min(-60,dy*.3)}px) scale(1.1)`,opacity:1,offset:.4},{transform:`translate(${dx}px,${dy}px) scale(.25)`,opacity:.2}],{duration:650,easing:'cubic-bezier(.3,.1,.6,1)'}).finished.then(()=>{dot.remove();target.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:300});}).catch(()=>dot.remove());}
