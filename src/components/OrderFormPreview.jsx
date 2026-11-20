import OrderFormFields from './OrderFormFields';
import {checkoutStyle,CHECKOUT_COPY} from '../lib/checkout-presentation';
import {toCss} from '../lib/typography';

export default function OrderFormPreview({appearance={},canvas=false,selectedElement,onSelect}){
 const pick=(key,event)=>{if(!onSelect)return;event?.stopPropagation?.();onSelect(key);};
 const mark=(key,base='')=>onSelect?{'data-builder-key':key,className:`${base}${selectedElement===key?' builder-selected':''}`.trim()||undefined,onClick:event=>{event.preventDefault();pick(key,event);}}:{className:base||undefined};
 const titleStyle=toCss(appearance.formTitleStyle||appearance.formHeadingStyle,{responsive:true});
 return (
  <section
   className={`orora-modal order-form-modal checkout-preview${canvas?' is-canvas-preview':''}`}
   style={{...checkoutStyle(appearance),background:appearance.formBackground,borderColor:appearance.formBorderColor}}
   aria-label="Xem trước form đặt hàng"
  >
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
     addresses={{provinces:[],wards:[]}}
     provinceCode=""
     wardCode=""
     methods={['cod','bank_transfer']}
     unitPrice={349000}
     shipping={{fee:null}}
     total={null}
     appearance={appearance}
     selectedElement={selectedElement}
     onSelect={onSelect}
    />
   </div>
  </section>
 );
}
