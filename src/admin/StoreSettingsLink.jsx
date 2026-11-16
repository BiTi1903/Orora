import {openStoreSettings} from './store-navigation';
export default function StoreSettingsLink({section='cart',children}){
 return <div className="builder-source-link"><p>{children||'Thiết lập này được quản lý tập trung tại Cửa hàng.'}</p><button type="button" className="admin-btn" onClick={()=>openStoreSettings(section)}>Mở Cửa hàng · {section==='cart'?'Giỏ hàng':section==='tracking'?'Tra cứu đơn':section==='links'?'Kênh mua và thanh toán':'Form đặt hàng'}</button></div>;
}
