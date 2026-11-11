import {toCss} from '../lib/typography';
import '../styles/catalog-feedback.css';
export default function CatalogLoadError({value={},onRetry}){
 const text=(key,fallback)=>typeof value?.[key] === "string" && value?.[key].trim() ? value?.[key].trim() : fallback;
 const css=key=>({...toCss(value?.[key]),textDecoration:value?.[key]?.textDecoration});
 return <div className="catalog-load-error" role="alert"><h3 style={css('titleStyle')}>{text('title','Chưa tải được sản phẩm')}</h3><p style={css('bodyStyle')}>{text('text','Kết nối đang gián đoạn. Vui lòng thử tải lại thông tin sản phẩm.')}</p><button type="button" onClick={onRetry} style={css('buttonStyle')}>{text('retryLabel','Thử tải lại')}</button></div>;
}
