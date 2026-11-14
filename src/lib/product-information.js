import {PRODUCT_CONTENT_GROUPS} from './product-content.js';
export function informationTabSettings(value={}) {
 value=value&&typeof value==='object'?value:{};
 const text=(raw,fallback)=>typeof raw==='string'&&raw.trim()?raw.trim():fallback;
 const labels=Object.fromEntries(Object.entries(PRODUCT_CONTENT_GROUPS).map(([key,fallback])=>[key,text(value.labels?.[key],fallback)]));
 return {specColumns:value.specColumns===1?1:2, cardRadius:Math.min(28,Math.max(0,Number(value.cardRadius??16)||0)), labels,defaultTab:Object.hasOwn(PRODUCT_CONTENT_GROUPS,value.defaultTab)?value.defaultTab:'description',emptyText:text(value.emptyText,'Thông tin đang được cập nhật.')};
}

export function isLongSpecification(section) {
 const text=String(section.content||" ");
 return section.legacyKey==="material" || /thành phần|chất liệu/i.test(section.title||"") || text.length>180 || text.split(/\r?\n/).length>3;
}
