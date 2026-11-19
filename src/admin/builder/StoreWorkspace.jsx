import {lazy,Suspense,useState} from 'react';
const OrderTrackingSettings=lazy(()=>import('../OrderTrackingSettings'));
const ShopLinksSettings=lazy(()=>import('../ShopLinksSettings'));
const STORE_TABS=[['links','Kênh mua và thanh toán'],['tracking','Tra cứu đơn']];
export default function StoreWorkspace({tab,onTab}){
 const activeTab=STORE_TABS.some(([key])=>key===tab)?tab:'links';
 const [visited,setVisited]=useState([activeTab]);
 if(!visited.includes(activeTab))setVisited([...visited,activeTab]);
 return <section className="store-workspace" aria-label="Cài đặt cửa hàng">
  <p className="admin-muted">Giỏ hàng, khối Mua ngay và form đặt hàng được chỉnh trực tiếp trong Trang chủ (Visual Builder). Tại đây quản lý kênh mua hàng, thanh toán và trang tra cứu đơn.</p>
  <nav className="admin-section-tabs" aria-label="Thiết lập cửa hàng">{STORE_TABS.map(([key,label])=><button type="button" aria-current={activeTab===key?'page':undefined} key={key} onClick={()=>onTab(key)}>{label}</button>)}</nav>
  <div hidden={activeTab!=='links'}>{visited.includes('links')&&<Suspense fallback={<p>Đang tải kênh mua…</p>}><ShopLinksSettings/></Suspense>}</div>
  <div hidden={activeTab!=='tracking'}>{visited.includes('tracking')&&<Suspense fallback={<p>Đang tải tra cứu…</p>}><OrderTrackingSettings/></Suspense>}</div>
 </section>;
}
