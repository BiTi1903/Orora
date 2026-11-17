import ButtonIcon from "./ButtonIcon";
import {CART_COPY} from '../lib/cart-copy';
import {cartButtonStyle} from '../lib/cart-presentation';
import '../styles/shop-cart.css';
export default function CartButton({settings={},count=0,inNavbar=false,onClick,preview=false,className=""}) {
 if(settings.enabled===false)return null;
 const label=settings.copy?.label||CART_COPY.label;
 return <button type="button" className={`desktop-cart${inNavbar?' is-in-navbar':''} ${className}`} data-cart-target={preview?undefined:''} onClick={onClick} aria-label={label} data-builder-key={preview?'navCart':undefined} style={cartButtonStyle(settings)}>{settings.navbarButton?.showIcon!==false&&<ButtonIcon name="navbarCart" defaultSize={20} allowHidden={false}/>}<span>{label}{settings.navbarButton?.showCount!==false&&` (${count})`}</span></button>;
}
