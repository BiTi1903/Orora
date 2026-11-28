import {useState} from 'react';
import useProducts from '../hooks/useProducts';
import {productPath} from '../lib/product-identity';
import {formatProductPrice} from '../lib/commerce';

export default function CampaignProducts({cards=[],onChange}) {
  const [open,setOpen]=useState(false), [search,setSearch]=useState('');
  const {products,loading,error,retry}=useProducts({enabled:open,raw:true});
  const edit=(index,patch)=>onChange(cards.map((card,i)=>i===index?{...card,...patch}:card));
  function add(product){
    const source=typeof product.image==='string' && product.image.trim();
    const image=source && URL.canParse(source,'https://ororavn.com') ? new URL(source,'https://ororavn.com').href : '';
    onChange([...cards,{id:product.id,name:product.name,image,url:'https://ororavn.com'+productPath(product,products),price:formatProductPrice(product.price)||'',description:'',button:'Xem sản phẩm',showPrice:true}]);
    setOpen(false);setSearch('');
  }
  function move(index,step){
    const next=[...cards];
    [next[index],next[index+step]]=[next[index+step],next[index]];
    onChange(next);
  }
  return <section className="admin-card"><h3>Sản phẩm trong thư</h3>
    {cards.map((card,i)=><details key={card.id}><summary>{i+1}. {card.name}</summary>
      {Object.entries({name:'Tên sản phẩm',image:'Ảnh trong thư (HTTPS)',url:'Link sản phẩm (HTTPS)',description:'Mô tả ngắn',price:'Giá hiển thị',button:'Chữ trên nút'}).map(([key,label])=><label className="admin-field" key={key}>{label}<input value={card[key]} maxLength={{name:150,description:400,image:1500,url:1000,price:60,button:60}[key]} onChange={e=>edit(i,{[key]:e.target.value})}/></label>)}
      <label><input type="checkbox" checked={card.showPrice} onChange={e=>edit(i,{showPrice:e.target.checked})}/> Hiện giá</label>
      <div className="admin-actions"><button type="button" className="admin-btn" disabled={!i} onClick={()=>move(i,-1)}>Lên</button><button type="button" className="admin-btn" disabled={i===cards.length-1} onClick={()=>move(i,1)}>Xuống</button><button type="button" className="admin-btn" onClick={()=>onChange(cards.filter((_,j)=>j!==i))}>Bỏ khỏi thư</button></div>
    </details>)}
    <button type="button" className="admin-btn" disabled={cards.length>=8} onClick={()=>setOpen(!open)}>{open?'Đóng danh mục':'Chèn sản phẩm'}</button>
    {open&&<div><label className="admin-field">Tìm sản phẩm<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label>{loading?'Đang tải…':error?<button type="button" onClick={retry}>Tải lại danh mục</button>:products.filter(p=>p.name.toLowerCase().includes(search.trim().toLowerCase())).map(p=><button type="button" className="admin-btn" key={p.id} disabled={cards.some(c=>c.id===p.id)} onClick={()=>add(p)}>{p.name}</button>)}</div>}
  </section>;
}
