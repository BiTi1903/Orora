import {useCallback,useState} from 'react';
import ModalDialog from './ModalDialog';
import ProductPurchaseSelection from './ProductPurchaseSelection';
import {CART_COPY} from '../lib/cart-copy';
import {cartSelectionStyle} from '../lib/cart-presentation';
import {toCss} from '../lib/typography';
import '../styles/shop-cart.css';

export default function CartSelectionDialog({product,settings={},options=[],onClose,onConfirm,preview=false,source}){
 const [variant,setVariant]=useState(''),[quantity,setQuantity]=useState(1),[closing,setClosing]=useState(false);
 const motionEnabled=Boolean(settings.popupAnimation!==false&&source);
 const requestClose=useCallback(()=>{if(!motionEnabled||window.matchMedia('(prefers-reduced-motion: reduce)').matches){onClose?.();}else setClosing(true);},[motionEnabled,onClose]);
 const copy={...CART_COPY,...settings.copy},popup=settings.selectionPopup||{};
 const content=<><ProductPurchaseSelection product={product} options={options} variantId={variant} quantity={quantity} onVariantChange={setVariant} onQuantityChange={setQuantity} showHelp={popup.showHelp===true} labels={{volume:copy.volume,quantity:copy.quantity,help:copy.chooseHelp}}/><button type="button" className="cart-primary" style={toCss(popup.buttonText)} disabled={!variant||!quantity} onClick={()=>onConfirm?.({variantId:variant,quantity})}>{copy.add}</button></>;
 const style=cartSelectionStyle(settings),headingStyle=toCss(popup.heading);
 if(preview)return <section className="orora-modal cart-selection is-preview" style={style} aria-label="Xem trước popup chọn dung tích"><div className="orora-modal-heading"><h2 style={headingStyle}>{copy.choose}</h2><button type="button" disabled aria-label="Đóng cửa sổ">×</button></div><div className="orora-modal-content">{content}</div></section>;
 return <ModalDialog motionSource={motionEnabled?source:undefined} motionClosing={closing} onMotionClosed={onClose} motionDuration={Math.max(200,Math.min(700,Number(settings.popupDuration)||420))} title={copy.choose} className="cart-selection" style={style} headingStyle={headingStyle} onClose={requestClose}>{content}</ModalDialog>;
}
