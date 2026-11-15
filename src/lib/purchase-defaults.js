import {productVolumeOptions,volumePriceText} from './product-options.js';
import {parseVndPrice} from './commerce.js';

// Presentation only: match the lowest known price shown by the storefront catalog.
// Keep server-side validation and explicit cart selections unchanged.
export function defaultPurchaseVariant(product,options=productVolumeOptions(product)){
 let best=null,lowest=Infinity;
 for(const option of options){const price=parseVndPrice(volumePriceText(product,option));if(price!==null&&price<lowest){best=option;lowest=price;}}
 return best||options[0]||null;
}
