import {useState} from 'react';
import ModalDialog from './ModalDialog';
import ProductPurchaseSelection from './ProductPurchaseSelection';
import {CART_COPY} from '../lib/cart-copy';
import {cartSelectionStyle} from '../lib/cart-presentation';
import {toCss} from '../lib/typography';
import '../styles/shop-cart.css';

export default function CartSelectionDialog({settings={},options=[],onClose,onConfirm,preview=false}){
 const [variant,setVariant]=useState(''),[quantity,setQuantity]=useState(1);
 const copy={...CART_COPY,...settings.copy},popup=settings.selectionPopup||{};
 const content=<><ProductPurchaseSelection options={options} variantId={variant} quantity={quantity} onVariantChange={setVariant} onQuantityChange={setQuantity} showHelp={popup.showHelp===true} labels={{volume:copy.volume,quantity:copy.quantity,help:copy.chooseHelp}}/><button type="button" className="cart-primary" style={toCss(popup.buttonText)} disabled={!variant||!quantity} onClick={()=>onConfirm?.({variantId:variant,quantity})}>{copy.add}</button></>;
 const style=cartSelectionStyle(settings),headingStyle=toCss(popup.heading);
 if(preview)return <section className="orora-modal cart-selection is-preview" style={style} aria-label="Xem trước popup chọn dung tích"><div className="orora-modal-heading"><h2 style={headingStyle}>{copy.choose}</h2><button type="button" disabled aria-label="Đóng cửa sổ">×</button></div><div className="orora-modal-content">{content}</div></section>;
 return <ModalDialog title={copy.choose} className="cart-selection" style={style} headingStyle={headingStyle} onClose={onClose}>{content}</ModalDialog>;
}
