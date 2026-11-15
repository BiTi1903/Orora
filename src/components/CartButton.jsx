import {CART_COPY} from '../lib/cart-copy';
import {cartButtonStyle} from '../lib/cart-presentation';
import '../styles/shop-cart.css';
export default function CartButton({settings={},count=0,inNavbar=false,onClick,preview=false,className=""}) {
 if(settings.enabled===false)return null;
 const label=settings.copy?.label||CART_COPY.label;
 return <button type="button" className={`desktop-cart${inNavbar?' is-in-navbar':''} ${className}`} data-cart-target={preview?undefined:''} onClick={onClick} aria-label={label} data-builder-key={preview?'navCart':undefined} style={cartButtonStyle(settings)}>{settings.navbarButton?.showIcon!==false&&<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M3 3h2l3 12h10l3-9H6M9 20h.01M18 20h.01"/></svg>}<span>{label}{settings.navbarButton?.showCount!==false&&` (${count})`}</span></button>;
}
