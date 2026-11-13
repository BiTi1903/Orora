import {parseVndPrice} from './commerce.js';
import {productVolumeOptions,volumePriceText} from './product-options.js';
export const CATALOG_QUERY_KEYS=['category','q','min','max','volume','price','sort','view','page'];
export const normalizeSearch=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLocaleLowerCase('vi').trim();
export const volumeKey=value=>normalizeSearch(value).replace(/\s+/g,'');
const money=value=>/^\d{1,10}$/.test(String(value))&&Number(value)<=1_000_000_000?String(Number(value)):'';
export function catalogFilters(value={}){
 const contact=value.price==='contact';
 return {category:String(value.category||'').slice(0,150),q:String(value.q||'').slice(0,120),min:contact?'':money(value.min),max:contact?'':money(value.max),volume:String(value.volume||'').slice(0,100),price:['priced','contact'].includes(value.price)?value.price:'all',sort:['priceAsc','priceDesc','name','newest'].includes(value.sort)?value.sort:'default',view:['grid','carousel'].includes(value.view)?value.view:'auto',page:Math.min(100000,Math.max(1,Number.parseInt(value.page,10)||1))};
}
export function readCatalogFilters(search){return catalogFilters(Object.fromEntries(new URLSearchParams(search)));}
export function writeCatalogFilters(search,value){
 const params=new URLSearchParams(search),s=catalogFilters(value);for(const key of CATALOG_QUERY_KEYS)params.delete(key);
 for(const key of CATALOG_QUERY_KEYS){const v=s[key];if(v!==''&&v!=='all'&&v!=='default'&&v!=='auto'&&!(key==='page'&&v===1))params.set(key,String(v));}
 return params.toString();
}
export function productCatalogPrices(product){
 const options=productVolumeOptions(product),values=(options.length?options.map(option=>volumePriceText(product,option)):[product.price]).map(parseVndPrice);
 return {values:values.filter(value=>value!==null),unknown:values.some(value=>value===null)};
}
export function catalogPriceLabel(product,settings={}){
 const {values}=productCatalogPrices(product);if(!values.length)return String(product.price||settings.contactPriceLabel||'Liên hệ');
 return String(Math.min(...values));
}
export function catalogVolumes(products){
 const values=new Map();for(const product of products)for(const option of productVolumeOptions(product)){const key=volumeKey(option.label);if(!values.has(key))values.set(key,option.label);}
 return [...values].map(([value,label])=>({value,label})).sort((a,b)=>a.label.localeCompare(b.label,'vi',{numeric:true}));
}
export function filterCatalog(products,value={}){
 const s=catalogFilters(value),query=normalizeSearch(s.q),min=s.min===''?null:Number(s.min),max=s.max===''?null:Number(s.max);
 const sequence=product=>Number(product.publicId||product.number||product.id)||0;
 const rows=products.map(product=>({product,prices:productCatalogPrices(product).values})).filter(({product,prices})=>{
  if(s.category&&product.categoryId!==s.category)return false;
  if(query&&!normalizeSearch([product.name,product.id,product.number,product.publicId].join(' ')).includes(query))return false;
  if(s.volume&&!productVolumeOptions(product).some(option=>volumeKey(option.label)===s.volume))return false;
  if(s.price==='contact')return prices.length===0;
  if(s.price==='priced'&&!prices.length)return false;
  return (min===null&&max===null)||prices.some(price=>(min===null||price>=min)&&(max===null||price<=max));
 });
 rows.sort((a,b)=>{
  let result=0;
  if(s.sort==='priceAsc'||s.sort==='priceDesc'){
   if(!a.prices.length||!b.prices.length)result=Number(!a.prices.length)-Number(!b.prices.length);
   else result=(Math.min(...a.prices)-Math.min(...b.prices))*(s.sort==='priceDesc'?-1:1);
  }else if(s.sort==='name')result=String(a.product.name||'').localeCompare(String(b.product.name||''),'vi');
  else if(s.sort==='newest')result=sequence(b.product)-sequence(a.product);
  return result||sequence(a.product)-sequence(b.product)||String(a.product.id).localeCompare(String(b.product.id));
 });
 return rows.map(row=>row.product);
}
export function activeCatalogFilters(value){const s=catalogFilters(value);return [s.category,s.q.trim(),s.volume,s.min!==''||s.max!==''?1:0,s.price!=='all'?1:0,s.sort!=='default'?1:0].filter(Boolean).length;}
export const CATALOG_FILTER_TEXT={searchLabel:'Tìm sản phẩm',searchPlaceholder:'Tên hoặc mã sản phẩm…',filterLabel:'Bộ lọc',closeLabel:'Đóng bộ lọc',viewLabel:'Dạng hiển thị',categoryLabel:'Danh mục',allCategory:'Tất cả danh mục',unknownCategory:'Danh mục đã chọn',volumeLabel:'Dung tích',allVolume:'Tất cả dung tích',priceLabel:'Loại giá',allPrice:'Tất cả',pricedLabel:'Có giá niêm yết',contactLabel:'Liên hệ báo giá',minLabel:'Giá từ (đ)',maxLabel:'Giá đến (đ)',sortLabel:'Sắp xếp',defaultSort:'Theo số thứ tự',priceAsc:'Giá thấp đến cao',priceDesc:'Giá cao đến thấp',nameSort:'Tên A–Z',newestSort:'Mới thêm',applyLabel:'Áp dụng',clearLabel:'Xóa bộ lọc',resultLabel:'{count} / {total} sản phẩm',emptyLabel:'Không có sản phẩm phù hợp. Bạn thử đổi hoặc xóa bộ lọc nhé.',invalidPrice:'Nhập giá bằng số nguyên từ 0 đến 1 tỷ đồng.',invalidRange:'Giá đến cần lớn hơn hoặc bằng giá từ.',gridLabel:'Dạng lưới',carouselLabel:'Dạng trượt',previousLabel:'Trước',nextLabel:'Sau',pageLabel:'Trang {page}/{pages}',contactPriceLabel:'Liên hệ'};
export function catalogFilterSettings(value={}){value=value&&typeof value==='object'?value:{};const result={...value};for(const [key,fallback] of Object.entries(CATALOG_FILTER_TEXT))result[key]=typeof value[key]==='string'&&value[key].trim()?value[key]:fallback;return result;}
