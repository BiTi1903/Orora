import {HERO_FIELD_MAP,COLLECTION_FIELD_MAP,PRODUCT_DETAIL_FIELD_MAP,FEATURES_TEXT_MAP,REVIEWS_TEXT_MAP,FOOTER_FIELD_MAP,NEWSLETTER_FIELD_MAP} from './registry.js';
const entries=map=>Object.entries(map).map(([value,meta])=>({value,label:meta.label}));
const options=rows=>rows.map(([value,label])=>({value,label}));
export function inspectorElements(section,{navbar={},about={},features={},reviews={}}={}){
 const maps={hero:HERO_FIELD_MAP,collection:COLLECTION_FIELD_MAP,productdetail:PRODUCT_DETAIL_FIELD_MAP,footer:FOOTER_FIELD_MAP,newsletter:NEWSLETTER_FIELD_MAP};
 if(maps[section])return entries(maps[section]);
 if(section==='navbar')return [{value:'navLogo',label:'Logo / tên thương hiệu'},...(navbar.navLinks||[]).map((item,index)=>({value:`navLink:${index}`,label:`Liên kết ${index+1} · ${item.label||'Chưa có tên'}`})),{value:'navCart',label:'Giỏ hàng trên navbar'}];
 if(section==='about')return [...options([['section','Khung và bố cục'],['label','Nhãn nhỏ'],['title','Tiêu đề'],['highlight','Chữ nổi bật'],['text','Nội dung'],['image','Hình ảnh'],['stats','Các số liệu']]),...(about.stats||[]).flatMap((item,i)=>options([[`statValue:${i}`,`Số liệu ${i+1} · Giá trị`],[`statLabel:${i}`,`Số liệu ${i+1} · Nhãn`]]))];
 if(section==='features')return [...entries(FEATURES_TEXT_MAP),...(features.features||[]).map((item,i)=>({value:`featCard-${i}`,label:`Ô ${i+1} · ${item.title||'Nội dung'}`}))];
 if(section==='reviews')return [...entries(REVIEWS_TEXT_MAP),...(reviews.reviews||[]).map((item,i)=>({value:`revCard-${i}`,label:`Đánh giá ${i+1} · ${item.name||'Khách hàng'}`}))];
 if(section==='ticker')return options([['text','Nội dung chữ chạy'],['star','Ký hiệu phân cách'],['band','Nền dải chữ']]);
 if(section==='philosophy')return options([['philLabel','Nhãn nhỏ'],['philText','Nội dung câu chữ'],['philAccent','Chữ nổi bật']]);
 return [];
}
