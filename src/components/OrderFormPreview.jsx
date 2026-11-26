import {useState} from "react";
import useHomeContent from "../hooks/useHomeContent";
import {availablePaymentMethods} from "../lib/commerce";
import OrderFormFields from './OrderFormFields';
import {checkoutStyle,CHECKOUT_COPY} from '../lib/checkout-presentation';
import {toCss} from '../lib/typography';

export default function OrderFormPreview({appearance={},canvas=false,selectedElement,onSelect}){
 const home=useHomeContent();
 const [multiple,setMultiple]=useState(false);
 const [zone,setZone]=useState("pending");
 const items=multiple?[{productId:"a",name:"Deodorant Mist",quantity:1,unitPrice:349000},{productId:"b",name:"White Gel",quantity:1,unitPrice:250000}]:null;
 const fee=zone==="priced"?25000:null;
 const pick=(key,event)=>{if(!onSelect)return;event?.stopPropagation?.();onSelect(key);};
 const mark=(key,base='')=>onSelect?{'data-builder-key':key,className:`${base}${selectedElement===key?' builder-selected':''}`.trim()||undefined,onClick:event=>{event.preventDefault();pick(key,event);}}:{className:base||undefined};
 const titleStyle=toCss(appearance.formTitleStyle||appearance.formHeadingStyle,{responsive:true});
 return (
  <section
   className={`orora-modal order-form-modal checkout-preview${canvas?' is-canvas-preview':''}`}
   style={{...checkoutStyle(appearance),background:appearance.formBackground,borderColor:appearance.formBorderColor}}
   aria-label="Xem trước form đặt hàng"
  >
   <fieldset><legend>Tình huống xem trước</legend><label><input type="checkbox" checked={multiple} onChange={e=>setMultiple(e.target.checked)}/>Nhiều sản phẩm</label><label>Giao hàng <select value={zone} onChange={e=>setZone(e.target.value)}><option value="pending">Chưa chọn địa chỉ</option><option value="priced">Có phí giao hàng</option><option value="blocked">Chưa giao khu vực này</option></select></label></fieldset>
   <div className="orora-modal-heading">
    <h2 {...mark('ofTitle')} style={titleStyle}>{appearance.formLabels?.title?.trim()||CHECKOUT_COPY.title}</h2>
    {canvas&&<button type="button" aria-label="Đóng cửa sổ" {...mark('ofClose')}>×</button>}
   </div>
   <div className="orora-modal-content">
    <OrderFormFields
     preview
     product={{name:'Deodorant Mist - Bodyplex'}}
     options={[{id:'180ml',label:'180ml'},{id:'220ml',label:'220ml'}]}
     variantId="180ml"
     quantity={1}
     addresses={{provinces:[{code:"01",name:"Hà Nội"}],wards:[{code:"sample",name:"Phường Ba Đình"}]}}
     provinceCode={zone==="pending"?"":"01"}
     wardCode={zone==="pending"?"":"sample"}
     methods={availablePaymentMethods(home)} items={items} subtotal={multiple?599000:349000}
     unitPrice={349000}
     shipping={{fee,blocked:zone==="blocked",reason:zone==="blocked"?"Chưa có phí giao hàng cho địa chỉ này.":zone==="pending"?"Chọn địa chỉ để tính phí giao hàng.":""}}
     total={fee===null?null:(multiple?599000:349000)+fee}
     appearance={appearance}
     selectedElement={selectedElement}
     onSelect={onSelect}
    />
   </div>
  </section>
 );
}
