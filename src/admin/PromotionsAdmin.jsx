import {useEffect,useState} from 'react';
import {orderRequest} from './order-api';

const blank={code:'',type:'percent',value:10,minimum:0,limit:0,perEmail:0,expires:'',active:true};
export default function PromotionsAdmin(){
  const [rows,setRows]=useState([]), [form,setForm]=useState(blank), [editing,setEditing]=useState(false);
  const [notice,setNotice]=useState(''), [busy,setBusy]=useState(false);
  const load=()=>orderRequest(null,{promotions:'1'}).then(data=>setRows(data.promotions));
  useEffect(()=>{load().catch(e=>setNotice(e.message));},[]);
  const patch=(key,value)=>setForm(old=>({...old,[key]:value}));
  async function save(e){
    e.preventDefault(); setBusy(true);
    try {
      await orderRequest({...form,action:'savePromotion',edit:editing});
      await load(); setNotice('Đã lưu mã '+form.code.toUpperCase()); setEditing(false);setForm(blank);
    } catch(error){setNotice(error.message);} finally{setBusy(false);}
  }
  return <section className="admin-card"><h1>Mã ưu đãi</h1>
    <form onSubmit={save}><fieldset disabled={busy}><legend>{editing?'Sửa ưu đãi':'Tạo ưu đãi'}</legend>
      <label className="admin-field">Mã khách nhập<input required pattern="[A-Za-z0-9_\-]{2,40}" value={form.code} disabled={editing} onChange={e=>patch('code',e.target.value.toUpperCase())}/></label>
      <label className="admin-field">Kiểu giảm<select value={form.type} onChange={e=>patch('type',e.target.value)}><option value="percent">Phần trăm</option><option value="fixed">Số tiền cố định</option></select></label>
      {[[ 'value', form.type==='percent'?'Mức giảm (%)':'Mức giảm (đồng)' ],['minimum','Tiền hàng tối thiểu (đồng)'],['limit','Tổng lượt dùng (0 là không giới hạn)'],['perEmail','Lượt dùng mỗi email (0 là không giới hạn)']].map(([key,label])=><label key={key} className="admin-field">{label}<input type="number" required min={key==='value'?1:0} max={key==='value'&&form.type==='percent'?100:undefined} value={form[key]} onChange={e=>patch(key,e.target.value===''?'':Number(e.target.value))}/></label>)}
      <label className="admin-field">Ngày cuối áp dụng (giờ Việt Nam)<input type="date" value={form.expires} onChange={e=>patch('expires',e.target.value)}/></label>
      <label><input type="checkbox" checked={form.active} onChange={e=>patch('active',e.target.checked)}/> Cho phép sử dụng</label>
      <div className="admin-actions"><button className="admin-btn">Lưu mã</button>{editing&&<button type="button" className="admin-btn" onClick={()=>{setForm(blank);setEditing(false);}}>Hủy sửa</button>}</div>
    </fieldset></form><p role="status">{notice}</p>
    <h2>Mã đã tạo</h2>{rows.map(row=><p key={row.code}><button className="admin-btn" disabled={busy} onClick={()=>{setEditing(true);setForm({...blank,...row});}}>{row.code}</button> · {row.value.toLocaleString('vi-VN')}{row.type==='percent'?'%':' đ'} · {row.active?'Đang bật':'Đã tắt'} · {row.used||0} lượt đã dùng</p>)}
  </section>;
}
