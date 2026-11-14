import {PRODUCT_CONTENT_GROUPS} from './product-content.js';
export function informationTabSettings(value={}) {
 value=value&&typeof value==='object'?value:{};
 const text=(raw,fallback)=>typeof raw==='string'&&raw.trim()?raw.trim():fallback;
 const labels=Object.fromEntries(Object.entries(PRODUCT_CONTENT_GROUPS).map(([key,fallback])=>[key,text(value.labels?.[key],fallback)]));
 return {labels,defaultTab:Object.hasOwn(PRODUCT_CONTENT_GROUPS,value.defaultTab)?value.defaultTab:'description',emptyText:text(value.emptyText,'Thông tin đang được cập nhật.')};
}
