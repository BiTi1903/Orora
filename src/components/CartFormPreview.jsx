import {CART_COPY} from '../lib/cart-copy';
import {cartModalStyle,cartActionButtonStyle} from '../lib/cart-presentation';
import {toCss} from '../lib/typography';
import {formatVnd} from '../lib/commerce';
import {cdnSrc,THUMB} from '../lib/image-cdn';
import '../styles/shop-cart.css';

const SAMPLE_CART_ROWS=[
 {id:'sample-1',name:'Combo Tự tin & Quyến rũ',variantLabel:'',price:758000,quantity:2},
 {id:'sample-2',name:'White Gel - Bodyplex',variantLabel:'',price:409000,quantity:1},
 {id:'sample-3',name:'Deodorant Mist - Bodyplex',variantLabel:'220ml',price:600000,quantity:1},
];

export default function CartFormPreview({settings={},products=[],selectedElement,onSelect}){
 const copy={...CART_COPY,...settings.copy};
 if(copy.order==='Đặt sản phẩm này')copy.order='Chi tiết';
 const rows=SAMPLE_CART_ROWS.map((row,idx)=>({...row,image:products[idx]?.image||''}));
 const total=rows.reduce((sum,row)=>sum+row.price*row.quantity,0);
 const pick=(key,event)=>{event?.stopPropagation?.();onSelect?.(key);};
 const mark=key=>({
  'data-builder-key':key,
  className:selectedElement===key?'builder-selected':undefined,
  onClick:event=>pick(key,event),
 });
 const checkoutBtnStyle=cartActionButtonStyle(settings.checkoutButton,{radius:12,height:46});
 const removeBtnStyle=cartActionButtonStyle(settings.removeButton,{radius:10,height:36});
 const detailBtnStyle=cartActionButtonStyle(settings.detailButton,{radius:10,height:36});
 const nameStyle=toCss(settings.itemNameStyle,{responsive:true});
 const variantStyle=toCss(settings.itemVariantStyle,{responsive:true});
 const priceStyle=toCss(settings.itemPriceStyle,{responsive:true});
 const shippingStyle=toCss(settings.shippingNoteStyle,{responsive:true});
 const totalStyle=toCss(settings.totalStyle,{responsive:true});
 const headingStyle=toCss(settings.headingStyle,{responsive:true});
 const modalStyle=cartModalStyle(settings);

 return (
  <section
   aria-label="Xem trước Form giỏ hàng"
   data-builder-key="cartFrame"
   className={`orora-modal shop-cart is-preview${selectedElement==='cartFrame'?' builder-selected':''}`}
   style={modalStyle}
   onClick={event=>pick('cartFrame',event)}
  >
   <div
    className={`orora-modal-heading${selectedElement==='cartHeader'?' builder-selected':''}`}
    data-builder-key="cartHeader"
    onClick={event=>pick('cartHeader',event)}
   >
    <h2 style={headingStyle}>{copy.title}</h2>
    <button type="button" aria-label="Đóng cửa sổ" onClick={event=>{event.preventDefault();pick('cartHeader',event);}}>×</button>
   </div>
   <div className="orora-modal-content">
    <div style={toCss(settings.text,{responsive:true})}>
     {rows.map((row,idx)=>(
      <article
       className={`cart-row${idx===0&&selectedElement==='cartRow'?' builder-selected':''}`}
       key={row.id}
       data-builder-key={idx===0?'cartRow':undefined}
       onClick={event=>pick('cartRow',event)}
      >
       {row.image?<img src={cdnSrc(row.image,THUMB)} alt=""/>:<div className="cart-image-placeholder" aria-hidden="true"/>}
       <div className="cart-row-body">
        <strong style={nameStyle}>{row.name}</strong>
        {row.variantLabel&&<p style={variantStyle}>{row.variantLabel}</p>}
        <p style={priceStyle}>{formatVnd(row.price)}</p>
        <div
         className={`cart-row-actions${idx===0&&selectedElement==='cartActions'?' builder-selected':''}`}
         data-builder-key={idx===0?'cartActions':undefined}
         onClick={event=>pick('cartActions',event)}
        >
         <div className="cart-quantity">
          <button type="button" tabIndex={-1} onClick={event=>{event.preventDefault();pick('cartActions',event);}}>−</button>
          <input type="number" readOnly tabIndex={-1} value={row.quantity} aria-label={copy.quantity}/>
          <button type="button" tabIndex={-1} onClick={event=>{event.preventDefault();pick('cartActions',event);}}>+</button>
         </div>
         <button type="button" style={removeBtnStyle} onClick={event=>{event.preventDefault();pick('cartActions',event);}}>{copy.remove}</button>
         <button type="button" className="cart-row-detail" style={detailBtnStyle} onClick={event=>{event.preventDefault();pick('cartActions',event);}}>{copy.order}</button>
        </div>
       </div>
      </article>
     ))}
     <div className="cart-footer">
      <p
       {...mark('cartFooter')}
       className={`cart-footer-summary${selectedElement==='cartFooter'?' builder-selected':''}`}
      >
       <span style={shippingStyle}>{copy.shipping}</span>
       <br/>
       <span style={totalStyle}>{copy.total}: <strong>{formatVnd(total)}</strong></span>
      </p>
      <button
       type="button"
       data-builder-key="cartBuyNow"
       className={`cart-checkout-btn${selectedElement==='cartBuyNow'?' builder-selected':''}`}
       style={checkoutBtnStyle}
       onClick={event=>{event.preventDefault();pick('cartBuyNow',event);}}
      >
       {copy.buyNow}
      </button>
     </div>
    </div>
   </div>
  </section>
 );
}
