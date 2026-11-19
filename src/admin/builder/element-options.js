import {normalizeSearch} from "../../lib/catalog-filters";
import {HERO_FIELD_MAP,COLLECTION_FIELD_MAP,PRODUCT_DETAIL_FIELD_MAP,FEATURES_TEXT_MAP,REVIEWS_TEXT_MAP,FOOTER_FIELD_MAP,NEWSLETTER_FIELD_MAP} from './registry.js';
const entries=map=>Object.entries(map).map(([value,meta])=>({value,label:meta.label}));
const options=rows=>rows.map(([value,label])=>({value,label}));
function rawInspectorElements(section,{navbar={},about={},features={},reviews={}}={}){
 const maps={hero:HERO_FIELD_MAP,collection:COLLECTION_FIELD_MAP,productdetail:PRODUCT_DETAIL_FIELD_MAP,footer:FOOTER_FIELD_MAP,newsletter:NEWSLETTER_FIELD_MAP};
 if(maps[section])return entries(maps[section]);
 if(section==='navbar')return [{value:'navLogo',label:'Logo / tên thương hiệu'},...(navbar.navLinks||[]).map((item,index)=>({value:`navLink:${index}`,label:`Liên kết ${index+1} · ${item.label||'Chưa có tên'}`})),{value:'navCart',label:'Form giỏ hàng & nút giỏ hàng'}];
 if(section==='about')return [...options([['section','Khung và bố cục'],['label','Nhãn nhỏ'],['title','Tiêu đề'],['highlight','Chữ nổi bật'],['text','Nội dung'],['image','Hình ảnh'],['stats','Các số liệu']]),...(about.stats||[]).flatMap((item,i)=>options([[`statValue:${i}`,`Số liệu ${i+1} · Giá trị`],[`statLabel:${i}`,`Số liệu ${i+1} · Nhãn`]]))];
 if(section==='features')return [...entries(FEATURES_TEXT_MAP),...(features.features||[]).map((item,i)=>({value:`featCard-${i}`,label:`Ô ${i+1} · ${item.title||'Nội dung'}`}))];
 if(section==='reviews')return [...entries(REVIEWS_TEXT_MAP),...(reviews.reviews||[]).map((item,i)=>({value:`revCard-${i}`,label:`Đánh giá ${i+1} · ${item.name||'Khách hàng'}`}))];
 if(section==='ticker')return options([['text','Nội dung chữ chạy'],['star','Ký hiệu phân cách'],['band','Nền dải chữ']]);
 if(section==='philosophy')return options([['philLabel','Nhãn nhỏ'],['philText','Nội dung câu chữ'],['philAccent','Chữ nổi bật']]);
 if(section==='cartform')return options([['cartHeader','Tiêu đề & nút đóng'],['cartFrame','Khung & nền giỏ hàng'],['cartRow','Dòng sản phẩm (tên, dung tích, giá)'],['cartActions','Số lượng, nút Xóa & Chi tiết'],['cartFooter','Dòng phí giao hàng & Tạm tính'],['cartBuyNow','Nút Mua ngay'],['cartExtra','Nút giỏ hàng & popup chọn dung tích']]);
 if(section==='orderform')return options([['ofHeader','Tiêu đề & nút đóng'],['ofFrame','Khung form & các thẻ mục'],['ofProduct','Khối sản phẩm, giá, dung tích & số lượng'],['ofRecipient','Thông tin người nhận'],['ofAddress','Địa chỉ giao hàng'],['ofPayment','Thanh toán & ghi chú'],['ofInputs','Ô nhập liệu & kiểu chữ chung'],['ofSummary','Tóm tắt thanh toán & đồng ý'],['ofSubmit','Nút Đặt hàng ngay']]);
 if(section==='ordersuccess')return options([['osHeader','Tiêu đề hộp thoại'],['osFrame','Khung & nền hộp thoại'],['osBanner','Khung mã đơn & lời cảm ơn'],['osActions','Xác nhận nhanh (Zalo/FB) & Lưu ảnh'],['osDetails','Chi tiết đơn & thông tin người nhận'],['osFooter','Ghi chú email, tra cứu & nút Đóng']]);
 return [];
}

export const ELEMENT_SECTIONS={navbar:'Thanh điều hướng',hero:'Hero',about:'Câu chuyện',collection:'Sản phẩm',productdetail:'Chi tiết sản phẩm',features:'Ưu điểm',reviews:'Đánh giá',newsletter:'Nhận tin',footer:'Chân trang',ticker:'Dải chữ chạy',philosophy:'Triết lý',cartform:'Form giỏ hàng',orderform:'Form đặt hàng',ordersuccess:'Form đã đặt hàng'};
export function inspectorElements(section,data){
 const prefix=ELEMENT_SECTIONS[section]||section;
 return rawInspectorElements(section,data).map(option=>({...option,label:option.label.startsWith(prefix+' · ')||option.label.startsWith('Thẻ sản phẩm · ')?option.label:`${prefix} · ${option.label}`}));
}

export const matchesInspectorSearch=(label,query)=>normalizeSearch(query).trim().split(/\s+/).filter(Boolean).every(word=>normalizeSearch(label).includes(word));
