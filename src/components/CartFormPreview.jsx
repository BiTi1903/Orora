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
 const mark=(key,base='')=>({
  'data-builder-key':key,
  className:`${base}${selectedElement===key?' builder-selected':''}`.trim()||undefined,
  onClick:event=>{event.preventDefault();pick(key,event);},
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
   className="orora-modal shop-cart is-preview"
   style={modalStyle}
  >
   <div className="orora-modal-heading">
    <h2 {...mark('cartTitle')} style={headingStyle}>{copy.title}</h2>
    <button type="button" aria-label="Đóng cửa sổ" {...mark('cartClose')}>×</button>
   </div>
   <div className="orora-modal-content">
    <div style={toCss(settings.text,{responsive:true})}>
     {rows.map((row)=>(
      <article className="cart-row" key={row.id}>
       {row.image
        ?<img src={cdnSrc(row.image,THUMB)} alt="" {...mark('cartImage')}/>
        :<div aria-hidden="true" {...mark('cartImage','cart-image-placeholder')}/>}
       <div className="cart-row-body">
        <strong {...mark('cartItemName')} style={nameStyle}>{row.name}</strong>
        {row.variantLabel&&<p {...mark('cartItemVariant')} style={variantStyle}>{row.variantLabel}</p>}
        <p {...mark('cartItemPrice')} style={priceStyle}>{formatVnd(row.price)}</p>
        <div className="cart-row-actions">
         <div {...mark('cartQty','cart-quantity')}>
          <button type="button" tabIndex={-1}>−</button>
          <input type="number" readOnly tabIndex={-1} value={row.quantity} aria-label={copy.quantity}/>
          <button type="button" tabIndex={-1}>+</button>
         </div>
         <button type="button" style={removeBtnStyle} {...mark('cartRemove')}>{copy.remove}</button>
         <button type="button" style={detailBtnStyle} {...mark('cartDetail','cart-row-detail')}>{copy.order}</button>
        </div>
       </div>
      </article>
     ))}
     <div className="cart-footer">
      <p className="cart-footer-summary">
       <span {...mark('cartShipping')} style={shippingStyle}>{copy.shipping}</span>
       <br/>
       <span {...mark('cartTotal')} style={totalStyle}>{copy.total}: <strong>{formatVnd(total)}</strong></span>
      </p>
      <button
       type="button"
       style={checkoutBtnStyle}
       {...mark('cartBuyNow','cart-checkout-btn')}
      >
       {copy.buyNow}
      </button>
     </div>
    </div>
   </div>
  </section>
 );
}
