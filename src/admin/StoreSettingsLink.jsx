import {openStoreSettings} from './store-navigation';
export default function StoreSettingsLink({section='links',children}){
 return <div className="builder-source-link"><p>{children||'Thiết lập này được quản lý tập trung trong Visual Builder.'}</p><button type="button" className="admin-btn" onClick={()=>openStoreSettings(section)}>Mở Visual Builder · {section==='tracking'?'Tra cứu đơn':'Kênh mua và thanh toán'}</button></div>;
}
