import {productVolumeOptions,selectedVolumeOption,volumePriceText,MAX_ORDER_QUANTITY} from '../lib/product-options';
import {parseVndPrice,formatVnd} from '../lib/commerce';
import {toCss} from '../lib/typography';
import '../styles/purchase-subtotal.css';
export default function PurchaseSubtotal({product={},variantId,quantity,settings={},preview=false,onClick}){
 if(settings.subtotalEnabled===false)return null;
 const options=productVolumeOptions(product),variant=selectedVolumeOption(options,variantId),amount=parseVndPrice(volumePriceText(product,variant)),count=Number(quantity);
 const missing=options.length>0&&!variant,valid=Number.isInteger(count)&&count>=1&&count<=MAX_ORDER_QUANTITY,known=!missing&&valid&&amount!==null;
 if(missing)return null;
 const message=!valid?settings.subtotalQuantityLabel||'Chọn số lượng hợp lệ':settings.subtotalContactLabel||'Liên hệ để báo giá';
 return <div className={`purchase-subtotal${known?'':' is-pending'}`} role="status" data-builder-key={preview?'pdPurchaseOptions':undefined} onClick={onClick} style={{background:settings.subtotalBackground||undefined,borderColor:settings.subtotalBorderColor||undefined}}><div><span style={toCss(settings.subtotalLabelStyle)}>{settings.subtotalLabel||'Tạm tính'}</span><small aria-hidden={!known} style={{...toCss(settings.subtotalLabelStyle),visibility:known?'visible':'hidden'}}>{formatVnd(amount??0)} × {valid?count:1}</small></div><strong style={toCss(settings.subtotalValueStyle)}>{known?formatVnd(amount*count):message}</strong>{(settings.subtotalNote??'Chưa gồm phí giao hàng')&&<small className="purchase-subtotal-note" aria-hidden={!known} style={{...toCss(settings.subtotalLabelStyle),visibility:known?'visible':'hidden'}}>{settings.subtotalNote??'Chưa gồm phí giao hàng'}</small>}</div>;
}
