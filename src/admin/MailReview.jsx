import { useEffect, useState } from "react";
import { orderRequest } from "./order-api";
import { newsletterRequest } from "./newsletter-api";

const labels = {store:"Thông báo cửa hàng", order:"Xác nhận đơn", welcome:"Chào mừng đăng ký", failed:"Gửi lỗi", unknown:"Chưa rõ kết quả", unconfirmed:"Chưa xác nhận", accepted:"Đã chuyển cho Microsoft", delayed:"Giao chậm", bounced:"Bị trả lại", sent_item:"Có trong thư đã gửi", not_found:"Chưa tìm thấy trên Outlook"};
export default function MailReview({onOpenOrder,onOpenNewsletter}) {
  const [domain,setDomain] = useState("orders");
  const [filter,setFilter] = useState("issues");
  return <section><h1>Thư cần xử lý</h1><div className="admin-actions">
    <label>Nguồn thư <select value={domain} onChange={e=>setDomain(e.target.value)}><option value="orders">Đơn hàng</option><option value="newsletter">Đăng ký nhận tin</option></select></label>
    <label>Trạng thái <select value={filter} onChange={e=>setFilter(e.target.value)}><option value="issues">Cần xử lý</option><option value="all">Tất cả</option></select></label>
  </div><ReviewList key={domain+filter} domain={domain} filter={filter} onOpenOrder={onOpenOrder} onOpenNewsletter={onOpenNewsletter}/></section>;
}
function ReviewList({domain,filter,onOpenOrder,onOpenNewsletter}) {
  const request = domain === "orders" ? orderRequest : newsletterRequest;
  const [rows,setRows] = useState([]), [cursor,setCursor] = useState(null);
  const [selected,setSelected] = useState([]), [busy,setBusy] = useState(true);
  const [notice,setNotice] = useState(""), [version,reload] = useState(0);
  const all = filter === "all" ? "1" : "0";
  useEffect(()=>{
    let active=true;
    request(null,{mailReview:"1",all}).then(page=>{
      if(active){setRows(page.rows);setCursor(page.cursor);setSelected([]);}
    }).catch(error=>{if(active)setNotice(error.message);}).finally(()=>{if(active)setBusy(false);});
    return ()=>{active=false;};
  },[request,all,version]);
  const checkable = rows.filter(row=>row.trackable).map(row=>row.id);
  async function more(selectAll) {
    setBusy(true);
    let next=cursor;
    try {
      const added=[];
      do {
        const page=await request(null,{mailReview:"1",all,cursor:next});
        added.push(...page.rows); next=page.cursor;
      } while(selectAll && next);
      const combined=[...new Map([...rows,...added].map(row=>[row.id,row])).values()];
      setRows(combined);setCursor(next);
      if(selectAll)setSelected(combined.filter(row=>row.trackable).map(row=>row.id));
    } catch(error){setNotice(error.message);} finally {setBusy(false);}
  }
  async function check() {
    setBusy(true);let count=0;
    try {
      for(let i=0;i<selected.length;i+=30){
        const result=await request({action:"checkReview",ids:selected.slice(i,i+30)});
        count+=result.checked;
      }
      setNotice("Đã kiểm tra "+count+" thư.");reload(v=>v+1);
    } catch(error){setNotice("Đã kiểm tra "+count+" thư. "+error.message);setBusy(false);}
  }
  return <div aria-busy={busy}><div className="admin-actions">
    <label><input type="checkbox" disabled={busy||!checkable.length} checked={!!checkable.length && selected.length===checkable.length} onChange={e=>setSelected(e.target.checked?checkable:[])}/> Chọn thư có thể kiểm tra trong danh sách</label>
    {cursor && <button className="admin-btn" disabled={busy} onClick={()=>more(true)}>Chọn tất cả thư có thể kiểm tra theo bộ lọc</button>}
    <button className="admin-btn" disabled={busy||!selected.length} onClick={check}>Kiểm tra {selected.length} thư đã chọn</button>
    <button className="admin-btn" disabled={busy} onClick={()=>{setBusy(true);setNotice("");reload(v=>v+1);}}>Làm mới</button>
  </div>{notice && <p role="status">{notice}</p>}
  {rows.map(row=><div className="admin-detail-box" key={row.id}><label><input type="checkbox" disabled={busy||!row.trackable} checked={selected.includes(row.id)} onChange={e=>setSelected(e.target.checked?[...selected,row.id]:selected.filter(id=>id!==row.id))}/> <strong>{labels[row.kind]} {row.code}</strong> · {row.recipient}</label>
    <p>{labels[row.outlook?.state]||labels[row.state]||row.state} {row.outlook?.diagnosticCode} · {row.outlook?.checkedAt ? "Kiểm tra "+new Date(row.outlook.checkedAt).toLocaleString("vi-VN") : row.trackable ? "Chưa đối chiếu Outlook" : "Thiếu mã theo dõi"}</p>
    {row.orderId ? <button className="admin-btn" onClick={()=>onOpenOrder(row.orderId)}>Mở đơn hàng</button> : <button className="admin-btn" onClick={onOpenNewsletter}>Mở quản lý email</button>}</div>)}
  {busy && <p role="status">Đang xử lý…</p>}{!busy&&!rows.length&&!notice && <p>Không có thư trong bộ lọc này.</p>}
  {cursor && <button className="admin-btn" disabled={busy} onClick={()=>more(false)}>Tải thêm</button>}</div>;
}
