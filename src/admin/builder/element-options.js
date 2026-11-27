import {normalizeSearch} from "../../lib/catalog-filters";
import {HERO_FIELD_MAP,COLLECTION_FIELD_MAP,PRODUCT_DETAIL_FIELD_MAP,FEATURES_TEXT_MAP,REVIEWS_TEXT_MAP,FOOTER_FIELD_MAP,NEWSLETTER_FIELD_MAP} from './registry.js';
const entries=map=>Object.entries(map).map(([value,meta])=>({value,label:meta.label}));
const options=rows=>rows.map(([value,label])=>({value,label}));
function rawInspectorElements(section,{navbar={},about={},features={},reviews={}}={}){
 const maps={hero:HERO_FIELD_MAP,collection:COLLECTION_FIELD_MAP,productdetail:PRODUCT_DETAIL_FIELD_MAP,footer:FOOTER_FIELD_MAP,newsletter:NEWSLETTER_FIELD_MAP};
 if(maps[section])return entries(maps[section]);
 if(section==='navbar')return [{value:'navLogo',label:'Logo / tên thương hiệu'},...(navbar.navLinks||[]).map((item,index)=>({value:`navLink:${index}`,label:`Liên kết ${index+1} · ${item.label||'Chưa có tên'}`})),{value:'navLang',label:'Chuyển ngôn ngữ (VI / EN / JP)'},{value:'navCart',label:'Form giỏ hàng & nút giỏ hàng'}];
 if(section==='about')return [...options([['section','Khung và bố cục'],['label','Nhãn nhỏ'],['title','Tiêu đề'],['highlight','Chữ nổi bật'],['text','Nội dung'],['image','Hình ảnh'],['stats','Các số liệu']]),...(about.stats||[]).flatMap((item,i)=>options([[`statValue:${i}`,`Số liệu ${i+1} · Giá trị`],[`statLabel:${i}`,`Số liệu ${i+1} · Nhãn`]]))];
 if(section==='features')return [...entries(FEATURES_TEXT_MAP),...(features.features||[]).map((item,i)=>({value:`featCard-${i}`,label:`Ô ${i+1} · ${item.title||'Nội dung'}`}))];
 if(section==='reviews')return [...entries(REVIEWS_TEXT_MAP),...(reviews.reviews||[]).map((item,i)=>({value:`revCard-${i}`,label:`Đánh giá ${i+1} · ${item.name||'Khách hàng'}`}))];
 if(section==='ticker')return options([['text','Nội dung chữ chạy'],['star','Ký hiệu phân cách'],['band','Nền dải chữ']]);
 if(section==='philosophy')return options([['philLabel','Nhãn nhỏ'],['philText','Nội dung câu chữ'],['philAccent','Chữ nổi bật']]);
 if(section==='cartform')return options([['cartTitle','Tiêu đề giỏ hàng'],['cartClose','Nút đóng ×'],['cartImage','Ảnh sản phẩm'],['cartItemName','Tên sản phẩm'],['cartItemVariant','Dung tích / phân loại'],['cartItemPrice','Giá sản phẩm'],['cartQty','Khung chọn số lượng'],['cartRemove','Nút Xóa'],['cartDetail','Nút Chi tiết'],['cartShipping','Chú thích phí giao hàng'],['cartTotal','Dòng Tạm tính'],['cartBuyNow','Nút Mua ngay']]);
 if(section==='orderform')return options([['ofTitle','Tiêu đề hộp thoại'],['ofClose','Nút đóng ×'],['ofProductName','Tên sản phẩm'],['ofIntro','Lời hướng dẫn đầu form'],['ofPrice','Nhãn giá sản phẩm'],['ofSelection','Dung tích & số lượng'],['ofRecipientHeading','Tiêu đề Người nhận'],['ofRecipientFields','Ô nhập Họ tên, SĐT, Email'],['ofAddressHeading','Tiêu đề Địa chỉ giao hàng'],['ofAddressFields','Ô nhập Tỉnh, Phường, Số nhà'],['ofPaymentHeading','Tiêu đề Thanh toán'],['ofPaymentFields','Phương thức thanh toán & Ghi chú'],['ofSummary','Phí giao hàng & Tổng thanh toán'],['ofConsent','Ô tích đồng ý'],['ofSubmit','Nút Đặt hàng ngay']]);
 if(section==='ordersuccess')return options([['osTitle','Tiêu đề hộp thoại'],['osCloseIcon','Nút đóng ×'],['osCode','Mã đơn hàng'],['osMessage','Lời cảm ơn / Lời nhắn'],['osContact','Xác nhận nhanh (Zalo / Facebook)'],['osSave','Lưu ảnh đơn hàng'],['osDetails','Chi tiết đơn hàng'],['osRecipient','Thông tin người nhận'],['osBank','Thông tin chuyển khoản'],['osNextSteps','Bước tiếp theo'],['osEmailNote','Ghi chú kiểm tra email'],['osTracking','Link Tra cứu đơn'],['osCloseBtn','Nút Đóng']]);
 return [];
}

export const ELEMENT_SECTIONS={navbar:'Thanh điều hướng',hero:'Hero',about:'Câu chuyện',collection:'Sản phẩm',productdetail:'Chi tiết sản phẩm',features:'Ưu điểm',reviews:'Đánh giá',newsletter:'Nhận tin',footer:'Chân trang',ticker:'Dải chữ chạy',philosophy:'Triết lý',cartform:'Form giỏ hàng',orderform:'Form đặt hàng',ordersuccess:'Form đã đặt hàng'};
export function inspectorElements(section,data){
 const prefix=ELEMENT_SECTIONS[section]||section;
 return rawInspectorElements(section,data).map(option=>({...option,label:option.label.startsWith(prefix+' · ')||option.label.startsWith('Thẻ sản phẩm · ')?option.label:`${prefix} · ${option.label}`}));
}

export const matchesInspectorSearch=(label,query)=>normalizeSearch(query).trim().split(/\s+/).filter(Boolean).every(word=>normalizeSearch(label).includes(word));
