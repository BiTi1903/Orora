import {CART_COPY} from '../../lib/cart-copy';
import {CART_BUTTON_FIELDS,CART_SELECTION_FIELDS} from '../../lib/cart-presentation';
import {toCss} from '../../lib/typography';
import CartButton from '../../components/CartButton';
import CartSelectionDialog from '../../components/CartSelectionDialog';
import {SettingGroup,StyleTypographyBlock,ColorField} from './ui';

const previewOptions=[{id:'small',label:'180ml'},{id:'large',label:'220ml'}];
function NumberFields({fields,value,onChange}){
 return fields.map(([key,label,fallback,min,max])=><label className="builder-field" key={key}>{label}<input type="number" min={min} max={max} value={value[key]??fallback} onChange={event=>onChange({[key]:Number(event.target.value)})}/></label>);
}
export default function CartSettings({navbar,onChange}){
 const value=navbar.navStyles?.cart||{},button=value.navbarButton||{},popup=value.selectionPopup||{},checkoutBtn=value.checkoutButton||{};
 const patch=next=>onChange({navStyles:{...navbar.navStyles,cart:{...value,...next}}});
 const patchButton=next=>patch({navbarButton:{...button,...next}}),patchPopup=next=>patch({selectionPopup:{...popup,...next}}),patchCheckoutBtn=next=>patch({checkoutButton:{...checkoutBtn,...next}});
 const copy=(key,label)=> <label className="builder-field" key={key}>{label}<input value={value.copy?.[key]??CART_COPY[key]} onChange={event=>patch({copy:{...value.copy,[key]:event.target.value}})}/></label>;
 const checkoutPreviewStyle={
  ...(checkoutBtn.background?{background:checkoutBtn.background}:{}),
  ...(checkoutBtn.borderColor?{borderColor:checkoutBtn.borderColor}:{}),
  ...(checkoutBtn.radius!=null?{borderRadius:`${Math.max(4,Math.min(28,Number(checkoutBtn.radius)||12))}px`}:{}),
  ...(checkoutBtn.height!=null?{minHeight:`${Math.max(40,Math.min(64,Number(checkoutBtn.height)||46))}px`}:{}),
  ...toCss(checkoutBtn.text,{responsive:true}),
 };
 return <>
  <SettingGroup title="Giỏ hàng trên navbar — desktop">
   <label><input type="checkbox" role="switch" checked={value.enabled!==false} onChange={event=>patch({enabled:event.target.checked})}/>Hiện giỏ hàng</label>
   {copy('label','Tên nút giỏ hàng')}
   <label><input type="checkbox" role="switch" checked={button.showIcon!==false} onChange={event=>patchButton({showIcon:event.target.checked})}/>Hiện icon giỏ hàng</label>
   <label><input type="checkbox" role="switch" checked={button.showCount!==false} onChange={event=>patchButton({showCount:event.target.checked})}/>Hiện số lượng trên nút</label>
   <details><summary>Khung và kiểu chữ nút navbar</summary>
    <NumberFields fields={CART_BUTTON_FIELDS} value={button} onChange={patchButton}/>
    <ColorField label="Màu nền nút navbar" value={button.background||'#fffafc'} onChange={background=>patchButton({background})}/>
    <ColorField label="Màu viền nút navbar" value={button.borderColor||'#efd7e1'} onChange={borderColor=>patchButton({borderColor})}/>
    <StyleTypographyBlock title="Chữ nút giỏ hàng navbar" style={button.text||value.text||{}} onStyleChange={next=>patchButton({text:{...(button.text||value.text),...next}})}/>
   </details>
   <div data-admin-preview className="cart-button-preview" aria-label="Xem trước nút giỏ hàng navbar"><CartButton settings={value} count={2} inNavbar preview onClick={event=>event.preventDefault()}/></div>
  </SettingGroup>
  <SettingGroup title="Nút Mua ngay trong giỏ hàng">
   {copy('buyNow','Chữ nút Mua ngay')}
   <details><summary>Màu, khung và kiểu chữ nút Mua ngay</summary>
    <ColorField label="Màu nền nút Mua ngay" value={checkoutBtn.background||'#b8446d'} onChange={background=>patchCheckoutBtn({background})}/>
    <ColorField label="Màu viền nút Mua ngay" value={checkoutBtn.borderColor||'#b8446d'} onChange={borderColor=>patchCheckoutBtn({borderColor})}/>
    <label className="builder-field">Bo góc nút (px)<input type="number" min={4} max={28} value={checkoutBtn.radius??12} onChange={event=>patchCheckoutBtn({radius:Number(event.target.value)})}/></label>
    <label className="builder-field">Chiều cao nút (px)<input type="number" min={40} max={64} value={checkoutBtn.height??46} onChange={event=>patchCheckoutBtn({height:Number(event.target.value)})}/></label>
    <StyleTypographyBlock title="Kiểu chữ nút Mua ngay" style={checkoutBtn.text||{}} onStyleChange={next=>patchCheckoutBtn({text:{...checkoutBtn.text,...next}})}/>
   </details>
   <div data-admin-preview className="cart-checkout-preview" aria-label="Xem trước chân giỏ hàng và nút Mua ngay">
    <div className="cart-footer" style={toCss(value.text)}>
     <p className="cart-footer-summary">{value.copy?.shipping??CART_COPY.shipping}<br/>{value.copy?.total??CART_COPY.total}: <strong>400.000đ</strong></p>
     <button type="button" className="cart-checkout-btn" style={checkoutPreviewStyle} onClick={event=>event.preventDefault()}>{value.copy?.buyNow??CART_COPY.buyNow}</button>
    </div>
   </div>
  </SettingGroup>
  <SettingGroup title="Popup chọn dung tích — khung gọn">
   <details><summary>Nội dung và kích thước popup chọn dung tích</summary>
    {copy('choose','Tiêu đề chọn dung tích')}{copy('volume','Nhãn dung tích')}{copy('quantity','Nhãn số lượng')}{copy('add','Nút thêm vào giỏ')}
    <label><input type="checkbox" role="switch" checked={popup.showHelp===true} onChange={event=>patchPopup({showHelp:event.target.checked})}/>Hiện hướng dẫn chọn dung tích</label>
    {copy('chooseHelp','Hướng dẫn chọn dung tích')}
    <NumberFields fields={CART_SELECTION_FIELDS} value={popup} onChange={patchPopup}/>
    <ColorField label="Màu nền popup chọn dung tích" value={popup.background||'#fffafb'} onChange={background=>patchPopup({background})}/>
    <ColorField label="Màu viền popup chọn dung tích" value={popup.borderColor||'#efd7e1'} onChange={borderColor=>patchPopup({borderColor})}/>
    <StyleTypographyBlock title="Tiêu đề popup chọn dung tích" style={popup.heading||{}} onStyleChange={next=>patchPopup({heading:{...popup.heading,...next}})}/>
    <StyleTypographyBlock title="Chữ trong popup chọn dung tích" style={popup.text||{}} onStyleChange={next=>patchPopup({text:{...popup.text,...next}})}/>
    <StyleTypographyBlock title="Chữ nút thêm vào giỏ" style={popup.buttonText||{}} onStyleChange={next=>patchPopup({buttonText:{...popup.buttonText,...next}})}/>
   </details>
   <div data-admin-preview className="cart-selection-preview"><CartSelectionDialog preview settings={value} options={previewOptions}/></div>
  </SettingGroup>
  <SettingGroup title="Giỏ hàng — popup và nội dung chung">
   <details><summary>Hiệu ứng, nội dung và kiểu chữ trong giỏ</summary>
    <label><input type="checkbox" role="switch" checked={value.animation!==false} onChange={event=>patch({animation:event.target.checked})}/>Hiệu ứng bay và nảy vào giỏ</label>
    <label><input type="checkbox" role="switch" checked={value.popupAnimation!==false} onChange={event=>patch({popupAnimation:event.target.checked})}/>Popup giỏ hàng phóng lớn, nảy nhẹ</label>
    <label className="builder-field">Thời gian mở giỏ (ms)<input type="number" min={650} max={1200} step={20} value={Math.max(650,value.popupDuration??650)} onChange={event=>patch({popupDuration:Number(event.target.value)})}/></label>
    <label><input type="checkbox" role="switch" checked={value.backgroundScroll!==false} onChange={event=>patch({backgroundScroll:event.target.checked})}/>Cho phép cuộn nền khi mở giỏ</label>
    <ColorField label="Màu nhấn giỏ hàng" value={value.accent||'#b8446d'} onChange={accent=>patch({accent})}/>
    {Object.entries(CART_COPY).filter(([key])=>!['label','buyNow','choose','volume','quantity','add','chooseHelp'].includes(key)).map(([key,fallback])=>copy(key,fallback))}
    <StyleTypographyBlock title="Chữ trong giỏ hàng" style={value.text||{}} onStyleChange={next=>patch({text:{...value.text,...next}})}/>
   </details>
  </SettingGroup>
 </>;
}
