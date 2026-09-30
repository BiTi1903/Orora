import { useEffect, useState } from "react";
import { getProducts } from "../lib/api";

export default function Dashboard(){
 const [count,setCount]=useState(0);
 useEffect(()=>{getProducts().then(p=>setCount(p.length)).catch(()=>{});},[]);
 return <section><h1>Tổng quan</h1><div className="admin-grid">
   <div className="admin-card admin-stat"><span className="admin-muted">Sản phẩm</span><strong>{count}</strong></div>
   <div className="admin-card admin-stat"><span className="admin-muted">Trang quản trị</span><strong>3</strong></div>
   <div className="admin-card admin-stat"><span className="admin-muted">Trạng thái</span><strong style={{fontSize:18}}>Đang hoạt động</strong></div>
 </div></section>;
}
