import {lazy,Suspense,useState} from 'react';
import CartSettings from './CartSettings';
import PurchaseOptionsSettings from './PurchaseOptionsSettings';
const OrderTrackingSettings=lazy(()=>import('../OrderTrackingSettings'));
const ShopLinksSettings=lazy(()=>import('../ShopLinksSettings'));
const STORE_TABS=[['cart','Giỏ hàng'],['checkout','Form đặt hàng'],['links','Kênh mua và thanh toán'],['tracking','Tra cứu đơn']];
export default function StoreWorkspace({tab,onTab,navbar,purchaseOptions,onNavbar,onPurchase}){
 const [visited,setVisited]=useState([tab]);
 if(!visited.includes(tab))setVisited([...visited,tab]);
 return <section className="store-workspace" aria-label="Cài đặt cửa hàng">
  <p className="admin-muted">Giỏ và form đặt hàng dùng chung bản nhập với giao diện, lưu bằng Lưu tất cả. Kênh mua và tra cứu có nút lưu riêng ngay trong mục.</p>
  <nav className="admin-section-tabs" aria-label="Thiết lập cửa hàng">{STORE_TABS.map(([key,label])=><button type="button" aria-current={tab===key?'page':undefined} key={key} onClick={()=>onTab(key)}>{label}</button>)}</nav>
  <div hidden={tab!=='cart'}>{visited.includes('cart')&&<CartSettings navbar={navbar} onChange={onNavbar}/>}</div>
  <div hidden={tab!=='checkout'}>{visited.includes('checkout')&&<PurchaseOptionsSettings initialGroup="checkout" value={purchaseOptions} onChange={onPurchase}/>}</div>
  <div hidden={tab!=='links'}>{visited.includes('links')&&<Suspense fallback={<p>Đang tải kênh mua…</p>}><ShopLinksSettings/></Suspense>}</div>
  <div hidden={tab!=='tracking'}>{visited.includes('tracking')&&<Suspense fallback={<p>Đang tải tra cứu…</p>}><OrderTrackingSettings/></Suspense>}</div>
 </section>;
}
