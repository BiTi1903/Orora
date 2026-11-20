import useStorefrontStock from '../hooks/useStorefrontStock';
import {subscribeNavbarCartSlot,getNavbarCartSlot} from '../lib/navbar-cart-slot';
import {useNavigate} from 'react-router-dom';
import {createPortal} from 'react-dom';
import CartButton from './CartButton';
import {productPath} from '../lib/product-identity';
import {lazy,Suspense,useCallback,useEffect,useRef,useSyncExternalStore,useState} from 'react';
import useHomeContent from '../hooks/useHomeContent';
import useProducts from '../hooks/useProducts';
import {productVolumeOptions,volumePriceText} from '../lib/product-options';
import {availablePaymentMethods,parseVndPrice,formatVnd} from '../lib/commerce';
import ModalDialog from './ModalDialog';
import CartSelectionDialog from './CartSelectionDialog';
import {toCss} from '../lib/typography';
import {cartModalStyle,cartActionButtonStyle} from '../lib/cart-presentation';
import '../styles/shop-cart.css';
import {cdnSrc,THUMB} from '../lib/image-cdn';
import {CART_COPY,CART_STORAGE_KEY,readCartRows} from '../lib/cart-copy';
const OrderForm=lazy(()=>import('./OrderForm'));
export default function ShopCart(){
 const navigate=useNavigate();
 const [closing,setClosing]=useState(false);
 const [openSource,setOpenSource]=useState(null);
 const [checkoutItems,setCheckoutItems]=useState(null);
 const sourceFor=source=>source||[...document.querySelectorAll('[data-cart-target]')].find(el=>el.getBoundingClientRect().width>0)?.getBoundingClientRect().toJSON()||{x:window.innerWidth/2,y:window.innerHeight,width:0,height:0};

 const cartHost=useSyncExternalStore(subscribeNavbarCartSlot,getNavbarCartSlot,getNavbarCartSlot);
 const home=useHomeContent(),{products,loading:productsLoading}=useProducts(),settings=home.navStyles?.cart||{},copy={...CART_COPY,...settings.copy};
 const acceptsWebsiteOrders=availablePaymentMethods(home).length>0;
 const popupDuration=Math.max(200,Math.min(700,Number(settings.popupDuration)||420));
 const popupMotion=settings.popupAnimation!==false;
 const [rows,setRows]=useState(readCartRows),[qtyDrafts,setQtyDrafts]=useState({}),[open,setOpen]=useState(false),[pending,setPending]=useState(null),[notice,setNotice]=useState(''),[undoEntry,setUndoEntry]=useState(null);
 const rowsRef=useRef(rows);
 useEffect(()=>{rowsRef.current=rows;},[rows]);
 useEffect(()=>{if(!undoEntry)return;const timer=setTimeout(()=>setUndoEntry(null),5000);return()=>clearTimeout(timer);},[undoEntry]);
 const closeCart=useCallback(()=>{if(!popupMotion||window.matchMedia('(prefers-reduced-motion: reduce)').matches){setOpen(false);setClosing(false);}else setClosing(true);},[popupMotion]);
 useEffect(()=>{try{localStorage.setItem(CART_STORAGE_KEY,JSON.stringify(rows));}catch{/* Cart remains usable without storage. */}window.dispatchEvent(new CustomEvent('orora-cart-count',{detail:rows.reduce((n,r)=>n+r.quantity,0)}));},[rows]);
 useEffect(()=>{
  const sync=e=>{if(e.key===CART_STORAGE_KEY)setRows(readCartRows());};
  const remove=e=>{const id=e.detail?.id,variantId=e.detail?.variantId||'',qty=Number(e.detail?.quantity);if(!id)return;setRows(old=>old.flatMap(r=>{if(!(r.id===id&&r.variantId===variantId))return [r];if(!Number.isInteger(qty)||qty<=0)return [];const remaining=r.quantity-qty;return remaining>0?[{...r,quantity:remaining}]:[];}));};
  window.addEventListener('storage',sync);window.addEventListener('orora-cart-remove',remove);
  return()=>{window.removeEventListener('storage',sync);window.removeEventListener('orora-cart-remove',remove);};
 },[]);
 useEffect(()=>{const show=e=>{if(e.detail?.toggle&&open){closeCart();return;}setOpenSource(sourceFor(e.detail?.source));setClosing(false);setOpen(true);},add=e=>{if(settings.enabled===false)return;const product=products.find(p=>p.id===e.detail.id);if(!product)return;const options=productVolumeOptions(product);if(options.length>1){setPending({product,source:e.detail.source});}else addRow(product,options[0]?.id||'',1,e.detail.source);};
 function addRow(product,variantId,amount,source){
  const current=rowsRef.current;
  const existing=current.find(r=>r.id===product.id&&r.variantId===variantId);
  if(existing?existing.quantity>=20:current.length>=100)return;
  setRows(old=>{const found=old.find(r=>r.id===product.id&&r.variantId===variantId);return found?old.map(r=>r===found?{...r,quantity:Math.min(20,r.quantity+amount)}:r):old.length<100?[...old,{id:product.id,variantId,quantity:amount}]:old;});
  setNotice(copy.added);
  if(settings.animation!==false)fly(source,cdnSrc(product.image,THUMB));
 }
 const confirm=e=>addRow(e.detail.product,e.detail.variantId,e.detail.quantity,e.detail.source);
 window.addEventListener('orora-cart-open',show);window.addEventListener('orora-cart-add',add);window.addEventListener('orora-cart-confirm',confirm);return()=>{window.removeEventListener('orora-cart-open',show);window.removeEventListener('orora-cart-add',add);window.removeEventListener('orora-cart-confirm',confirm);};
 },[products,copy.added,settings.enabled,settings.animation,open,closeCart]);
 useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),2200);return()=>clearTimeout(timer);},[notice]);
 const stock=useStorefrontStock(rows.map(row=>row.id),open);
 const resolved=rows.map(r=>({...r,product:products.find(p=>p.id===r.id)}));
 const checkoutableItems=resolved.flatMap(r=>{const p=r.product;const stockKey=r.variantId?`${r.id}__${r.variantId}`:r.id;if(!p||(stock[stockKey]??stock[r.id])==="out")return [];const options=productVolumeOptions(p),option=options.find(v=>v.id===r.variantId);if(options.length&&!option)return [];return [{product:p,variantId:r.variantId,quantity:r.quantity}];});
 const total=resolved.reduce((sum,r)=>{const stockKey=r.variantId?`${r.id}__${r.variantId}`:r.id;if((stock[stockKey]??stock[r.id])==="out")return sum;const p=r.product;if(!p)return null;const options=productVolumeOptions(p),option=options.find(v=>v.id===r.variantId);if(options.length&&!option)return null;const price=parseVndPrice(volumePriceText(p,option));return sum===null||price===null?null:sum+price*r.quantity;},0);
 const clearDraft=rowKey=>setQtyDrafts(prev=>{if(!(rowKey in prev))return prev;const next={...prev};delete next[rowKey];return next;});
 if(settings.enabled===false||home.loading)return null;
 const checkoutBtnStyle=cartActionButtonStyle(settings.checkoutButton,{radius:12,height:46});
 const removeBtnStyle=cartActionButtonStyle(settings.removeButton,{radius:10,height:36});
 const detailBtnStyle=cartActionButtonStyle(settings.detailButton,{radius:10,height:36});
 const nameStyle=toCss(settings.itemNameStyle,{responsive:true});
 const variantStyle=toCss(settings.itemVariantStyle,{responsive:true});
 const priceStyle=toCss(settings.itemPriceStyle,{responsive:true});
 const shippingStyle=toCss(settings.shippingNoteStyle,{responsive:true});
 const totalStyle=toCss(settings.totalStyle,{responsive:true});
 const headingStyle=toCss(settings.headingStyle,{responsive:true});
 const suggestedProducts=!rows.length?products.slice(0,3):[];
 const cartButton=<CartButton settings={settings} count={rows.reduce((n,r)=>n+r.quantity,0)} inNavbar={Boolean(cartHost)} onClick={event=>{if(open){closeCart();return;}setOpenSource(event.currentTarget.getBoundingClientRect().toJSON());setClosing(false);setOpen(true);}}/>;
 return <>{cartHost?createPortal(cartButton,cartHost):cartButton}<div className="cart-announcement" role="status">{notice}</div>
 {pending&&<CartSelectionDialog source={pending.source} settings={settings} options={productVolumeOptions(pending.product)} onClose={()=>setPending(null)} onConfirm={selection=>{window.dispatchEvent(new CustomEvent('orora-cart-confirm',{detail:{...pending,...selection}}));setPending(null);}}/>}
 {checkoutItems&&createPortal(<Suspense fallback={null}><OrderForm key={checkoutItems.items.map(i=>`${i.product.id}:${i.variantId}:${i.quantity}`).join('|')} cartItems={checkoutItems.items} motionSource={checkoutItems.source} home={home} fromCart onClose={()=>setCheckoutItems(null)}/></Suspense>,document.body)}
 {open&&<ModalDialog outsideClickIgnoreSelector="[data-cart-target]" motionClosing={closing} onMotionClosed={()=>{setOpen(false);setClosing(false);}} motionSource={popupMotion?openSource:undefined} motionDuration={popupDuration} allowBackgroundScroll={settings.backgroundScroll!==false} title={copy.title} className={`shop-cart${closing?" is-closing":""}`} style={{'--cart-popup-duration':`${popupDuration}ms`,...cartModalStyle(settings)}} headingStyle={headingStyle} onClose={closeCart}><div style={toCss(settings.text,{responsive:true})}>{undoEntry&&<div className="cart-undo-bar" role="status"><span>Đã xóa {undoEntry.name}</span><button type="button" onClick={()=>{setRows(old=>{const exists=old.some(item=>item.id===undoEntry.row.id&&item.variantId===undoEntry.row.variantId);if(exists)return old;const next=[...old];next.splice(Math.min(undoEntry.index,next.length),0,undoEntry.row);return next;});setUndoEntry(null);}}>Hoàn tác</button></div>}{!rows.length&&<div className="cart-empty-state"><p>{copy.empty}</p><button type="button" className="cart-checkout-btn" style={checkoutBtnStyle} onClick={()=>{setOpen(false);navigate('/#shop');}}>{copy.shopNow}</button>{suggestedProducts.length>0&&<div className="cart-suggestions"><p className="cart-suggestions-title">Gợi ý dành cho bạn</p><div className="cart-suggestions-list">{suggestedProducts.map(item=><button key={item.id} type="button" className="cart-suggestion-card" onClick={()=>{setOpen(false);navigate(productPath(item,products));}}>{item.image?<img src={cdnSrc(item.image,THUMB)} alt="" loading="lazy" decoding="async"/>:<span className="cart-image-placeholder" aria-hidden="true"/>}<span><strong>{item.name}</strong><small>{parseVndPrice(item.price)!==null?formatVnd(parseVndPrice(item.price)):(item.price||'Xem chi tiết')}</small></span></button>)}</div></div>}</div>}{resolved.map((r,index)=>{const p=r.product,options=p?productVolumeOptions(p):[],option=options.find(v=>v.id===r.variantId),valid=p&&(!options.length||option),stockKey=r.variantId?`${r.id}__${r.variantId}`:r.id,out=(stock[stockKey]??stock[r.id])==="out",rowKey=`${r.id}:${r.variantId}`,loadingRow=!p&&productsLoading,unitPrice=valid?parseVndPrice(volumePriceText(p,option)):null;return <article className="cart-row" key={rowKey}>{p?.image?<img src={cdnSrc(p.image,THUMB)} alt=""/>:<div className="cart-image-placeholder" aria-hidden="true"/>}<div className="cart-row-body"><strong style={nameStyle}>{p?.name||(loadingRow?'Đang tải sản phẩm…':'Sản phẩm chưa khả dụng')}</strong>{option&&<p style={variantStyle}>{option.label}</p>}<p className="cart-line-price" style={priceStyle}>{out?'Hết hàng':valid?(unitPrice===null?'Liên hệ':<>{formatVnd(unitPrice*r.quantity)}{r.quantity>1&&<small className="cart-unit-price">{formatVnd(unitPrice)} × {r.quantity}</small>}</>) : loadingRow ? 'Đang cập nhật…' : 'Vui lòng thêm lại sản phẩm'}</p><div className="cart-row-actions"><div className="cart-quantity"><button type="button" aria-label={`${copy.decrease} ${p?.name||r.id}`} disabled={out||r.quantity<=1} onClick={()=>{clearDraft(rowKey);setRows(old=>old.map((row,i)=>i===index?{...row,quantity:Math.max(1,row.quantity-1)}:row));}}>−</button><input aria-label={`${copy.quantity} ${p?.name||r.id}`} type="number" min="1" max="20" disabled={out} value={rowKey in qtyDrafts?qtyDrafts[rowKey]:r.quantity} onChange={e=>{const raw=e.target.value;setQtyDrafts(prev=>({...prev,[rowKey]:raw}));const parsed=Math.trunc(Number(raw));if(raw.trim()!==''&&Number.isFinite(parsed)&&parsed>=1&&parsed<=20)setRows(old=>old.map((row,i)=>i===index?{...row,quantity:parsed}:row));}} onBlur={()=>{const raw=qtyDrafts[rowKey];if(raw!==undefined){const parsed=Math.trunc(Number(raw));const nextQty=Number.isFinite(parsed)&&parsed>=1?Math.min(20,parsed):1;setRows(old=>old.map((row,i)=>i===index?{...row,quantity:nextQty}:row));clearDraft(rowKey);}}}/><button type="button" aria-label={`${copy.increase} ${p?.name||r.id}`} disabled={out||r.quantity>=20} onClick={()=>{clearDraft(rowKey);setRows(old=>old.map((row,i)=>i===index?{...row,quantity:Math.min(20,row.quantity+1)}:row));}}>+</button></div><button type="button" className="cart-row-remove" style={removeBtnStyle} onClick={()=>{clearDraft(rowKey);const removed={id:r.id,variantId:r.variantId,quantity:r.quantity};setUndoEntry({row:removed,index,name:p?.name||'sản phẩm'});setRows(old=>old.filter((_,i)=>i!==index));}}>{copy.remove}</button><button type="button" className="cart-row-detail" style={detailBtnStyle} disabled={!valid} onClick={()=>{setOpen(false);navigate(productPath(p,products),{state:{cartSelection:{productId:p.id,variantId:r.variantId,quantity:r.quantity}}});}}>{copy.order}</button></div></div></article>;})}{rows.length>0&&<div className="cart-footer"><div className="cart-summary-card"><p className="cart-footer-shipping"><span style={shippingStyle}>{copy.shipping}</span></p><div className="cart-footer-total" style={totalStyle}><span>{copy.total}</span><strong>{total===null?(productsLoading?'Đang tính…':'Liên hệ'):formatVnd(total)}</strong></div></div>{acceptsWebsiteOrders&&<button type="button" className="cart-checkout-btn" style={checkoutBtnStyle} disabled={!checkoutableItems.length} onClick={event=>{const source=event.currentTarget.getBoundingClientRect().toJSON();setOpen(false);setCheckoutItems({items:checkoutableItems,source});}}>{copy.buyNow}</button>}</div>}</div></ModalDialog>}
 </>;
}
function fly(source,image){const target=[...document.querySelectorAll('[data-cart-target]')].find(el=>el.getBoundingClientRect().width>0);if(!target)return;if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const end=target.getBoundingClientRect();const start=source||end;const dot=document.createElement('div');dot.className='cart-flying';if(image){const img=document.createElement('img');img.src=image;img.alt='';dot.append(img);}dot.style.left=`${start.x}px`;dot.style.top=`${start.y}px`;document.body.append(dot);const dx=end.x+end.width/2-start.x-22,dy=end.y+end.height/2-start.y-22;dot.animate([{transform:'translate(0,0) scale(1)',opacity:1},{transform:`translate(${dx*.45}px,${Math.min(-60,dy*.3)}px) scale(1.1)`,opacity:1,offset:.4},{transform:`translate(${dx}px,${dy}px) scale(.25)`,opacity:.2}],{duration:650,easing:'cubic-bezier(.3,.1,.6,1)'}).finished.then(()=>{dot.remove();target.animate([{transform:'scale(1)'},{transform:'scale(1.15)'},{transform:'scale(1)'}],{duration:300});}).catch(()=>dot.remove());}
