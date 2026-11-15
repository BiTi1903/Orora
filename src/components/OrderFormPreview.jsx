import OrderFormFields from './OrderFormFields';
import {checkoutStyle,CHECKOUT_COPY} from '../lib/checkout-presentation';
import {toCss} from '../lib/typography';
export default function OrderFormPreview({appearance={}}){
 return <section className="orora-modal order-form-modal checkout-preview" style={{...checkoutStyle(appearance),background:appearance.formBackground,borderColor:appearance.formBorderColor}} aria-label="Xem trước form đặt hàng"><div className="orora-modal-heading"><h2 style={toCss(appearance.formHeadingStyle)}>{appearance.formLabels?.title?.trim()||CHECKOUT_COPY.title}</h2></div><div className="orora-modal-content"><OrderFormFields preview product={{name:'Sản phẩm mẫu'}} options={[{id:'sample',label:'180ml'}]} variantId="sample" quantity={1} addresses={{provinces:[],wards:[]}} provinceCode="" wardCode="" methods={['cod']} unitPrice={100000} shipping={{fee:20000}} total={120000} appearance={appearance}/></div></section>;
}
