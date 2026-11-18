import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
import {order,products} from './admin-appearance-data';

async function admin(page){
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/api/**',route=>{
  const url=new URL(route.request().url());let data={};
  if(url.pathname==='/api/analytics')data={updatedAt:1794800000000,recordedSince:null,products:[],series:Array.from({length:Number(url.searchParams.get('days')||7)},(_,i)=>({day:`2026-10-${String(i+1).padStart(2,'0')}`,pageViews:10+i,visitors:5,productClicks:2,paidAmount:250000,paidOrders:1,unpricedPaid:0}))};
  if(url.pathname==='/api/inventory')data=url.searchParams.has('pending')?{pending:{},nextCursor:null}:{items:products.map(p=>({...p,quantity:25})),nextCursor:null};
  if(url.pathname==='/api/addresses')data={items:[{code:'01',name:'Hà Nội'}]};
  if(url.pathname==='/api/admin-orders')data=url.searchParams.has('mailHistory')?{mails:[],scannedOrders:1,nextCursor:null}:url.searchParams.has('id')?{order,mails:[],activities:[]}:{orders:[order],nextCursor:null};
  if(url.pathname==='/api/chat')data={configured:true};
  return route.fulfill({json:data});
 });
 await mount(page,`import Admin from '/src/admin/AdminApp.jsx';${render('R.createElement(Admin)')}`,{
  'lib/firebaseAuth.js':'export const auth={currentUser:{getIdToken:async()=>"fixture-token"}};export function onAuthStateChanged(auth,callback){callback({uid:"appearance-admin",email:"admin@example.test"});return ()=>{}}export function signOut(){}',
  'lib/api.js':`import {home,products} from '/qa/admin-appearance-data.js';export const getProducts=async()=>products;export const getProduct=async()=>products[0];export const getHomeContent=async()=>structuredClone(home);export const explainError=error=>error.message;export const saveHomeContent=async()=>{throw Error('Appearance audit must not save')};export const removeProduct=saveHomeContent,saveProduct=saveHomeContent,saveCategory=saveHomeContent,setProductCategory=saveHomeContent;`,
  'hooks/useHomeContent.js':`import {home} from '/qa/admin-appearance-data.js';export default function content(){return {...home,loading:false}}`,
  'hooks/useProducts.js':`import {products} from '/qa/admin-appearance-data.js';export default function content(){return {products,loading:false}}`,
  'hooks/useCategories.js':'export default function categories(){return {categories:[{id:"care",name:"Chăm sóc"}],loading:false}}',
  'admin/useOrderNotifications.js':'export default function notifications(){return {snapshot:{pendingCount:1},refresh(){},dismiss(){}}}',
  'admin/newsletter-api.js':`export const newsletterRequest=async()=>({contacts:[{id:'contact-1',email:'reader@example.test',status:'active'}],campaigns:[],welcome:{subject:'Chào mừng',text:'Nội dung thư minh họa'},orderTemplate:{subject:'Xác nhận đơn hàng',text:'Nội dung xác nhận minh họa'},templates:[],types:[],nextCursor:null});`,
 });
 await expect(page.locator('.admin-shell')).toBeVisible();
 return errors;
}
async function audit(page){
 const issues=await page.locator('.admin-main').evaluate(root=>[...root.querySelectorAll('input,select,textarea')].flatMap(el=>{
  const box=el.getBoundingClientRect();if(!box.width||!box.height||el.closest('[data-admin-preview],.builder-preview,dialog,details:not([open])'))return [];
  const css=getComputedStyle(el),type=el.type;
  const label=el.getAttribute('aria-label')||el.id||el.outerHTML.slice(0,100);
  if(el.getAttribute('role')==='switch')return box.width===44&&box.height===26?[]:[`Switch stretched: ${label} ${box.width}x${box.height}`];
  if(['checkbox','radio'].includes(type))return box.width<=24&&box.height<=24&&parseFloat(css.paddingLeft)===0?[]:[`Choice stretched: ${label} ${box.width}x${box.height}`];
  if(type==='range')return box.height<=32?[]:[`Range stretched: ${label}`];
  if(['color','hidden','file'].includes(type))return [];
  if(el.tagName==='SELECT'&&!el.multiple&&css.backgroundImage==='none')return [`Missing dropdown arrow: ${label}`];
  return css.borderTopStyle!=='none'&&parseFloat(css.borderRadius)>=7&&box.height>=38?[]:[`Unstyled field: ${label} (${css.borderTopStyle},${css.borderRadius},${box.height})`];
 }));
 expect(issues).toEqual([]);await expect(page.locator('.admin-main .admin-error:visible')).toHaveCount(0);await fit(page);
}
async function shot(page,testInfo,name){if([390,1440].includes(page.viewportSize().width))await page.screenshot({path:testInfo.outputPath(`${name}.png`),fullPage:true});}

test('all ten real admin pages use styled controls and fit the viewport',async({page},testInfo)=>{
 test.setTimeout(90000);const errors=await admin(page);
 await expect(page.getByRole('button',{name:'Đăng xuất'})).toHaveCSS('min-height','44px');
 const nav=page.getByRole('navigation',{name:'Menu quản trị'});
 for(const name of ['Tổng quan','Đơn hàng','Kiểm kho','Phí vận chuyển','Trang chủ','Sản phẩm','Cửa hàng','Email','Chat AI','Xuất danh sách email']){
  await nav.getByRole('button',{name,exact:true}).click();
  await expect(nav.getByRole('button',{name,exact:true})).toHaveAttribute('aria-current','page');
  await audit(page);await shot(page,testInfo,name);
 }
 expect(errors).toEqual([]);
});
test('store checkboxes, checkout inputs, payment choices and lookup are usable',async({page},testInfo)=>{
 test.setTimeout(90000);const errors=await admin(page);
 await page.getByRole('navigation',{name:'Menu quản trị'}).getByRole('button',{name:'Cửa hàng',exact:true}).click();
 const choice=page.getByLabel('Hiện giỏ hàng',{exact:true});await expect(choice).toHaveCSS('appearance','none');await expect(choice).toHaveCSS('background-image',/radial-gradient/);await expect(choice).toBeChecked();await choice.uncheck();await expect(choice).not.toBeChecked();await choice.check();await choice.focus();await page.keyboard.press('Space');await expect(choice).not.toBeChecked();await page.keyboard.press('Space');await expect(choice).toBeChecked();
 await expect(page.locator('.cart-selection-preview input[type=number]')).toHaveCSS('border-top-style','none');
 const input=page.getByLabel('Tên nút giỏ hàng',{exact:true});await input.fill('Túi sản phẩm');await input.focus();await expect(input).toBeFocused();await expect(input).toHaveCSS('outline-style','solid');
 const tabs=page.getByRole('navigation',{name:'Thiết lập cửa hàng'});
 for(const name of ['Giỏ hàng','Form đặt hàng','Kênh mua và thanh toán','Tra cứu đơn']){await tabs.getByRole('button',{name,exact:true}).click();await audit(page);await shot(page,testInfo,`store-${name}`);}
 await tabs.getByRole('button',{name:'Giỏ hàng',exact:true}).click();await expect(input).toHaveValue('Túi sản phẩm');expect(errors).toEqual([]);
});
test('product editor and chat details keep coherent fields and compact choice controls',async({page},testInfo)=>{
 test.setTimeout(90000);const errors=await admin(page);const nav=page.getByRole('navigation',{name:'Menu quản trị'});
 await nav.getByRole('button',{name:'Sản phẩm',exact:true}).click();await page.getByRole('button',{name:'Sửa',exact:true}).click();
 await expect(page.getByLabel('Tên sản phẩm',{exact:true})).toHaveValue('Sản phẩm minh họa');
 const productTabs=page.getByRole('navigation',{name:'Các phần chỉnh sửa sản phẩm'});
 for(const name of ['Thông tin','Giá & dung tích','Hình ảnh','Nội dung','Đánh giá']){await productTabs.getByRole('button',{name,exact:true}).click();await audit(page);await shot(page,testInfo,`product-${name}`);}
 await productTabs.getByRole('button',{name:'Thông tin',exact:true}).click();await shot(page,testInfo,'product-editor');
 await nav.getByRole('button',{name:'Chat AI',exact:true}).click();
 const chatTabs=page.getByRole('navigation',{name:'Các phần thiết lập Chat AI'});
 await expect(chatTabs).toBeVisible();for(const button of await chatTabs.getByRole('button').all()){await button.click();await audit(page);}
 await shot(page,testInfo,'chat');expect(errors).toEqual([]);
});

test('email workflows, order details and radio choices share the theme without writes',async({page},testInfo)=>{
 test.setTimeout(90000);const errors=await admin(page),nav=page.getByRole('navigation',{name:'Menu quản trị'});
 await nav.getByRole('button',{name:'Email',exact:true}).click();const emailTabs=page.getByRole('navigation',{name:'Các mục email marketing'});await expect(emailTabs).toBeVisible();await expect(emailTabs.getByRole('button')).toHaveCount(5);
 for(const button of await emailTabs.getByRole('button').all()){await button.click();await audit(page);}
 await shot(page,testInfo,'email-templates');
 await nav.getByRole('button',{name:'Đơn hàng',exact:true}).click();await page.getByRole('button',{name:'Xem đơn OW_DEMO',exact:true}).click();
 const radio=page.locator('.order-status-options input[type=radio]:checked');await expect(radio).toHaveCSS('appearance','none');await expect(radio).toHaveCSS('border-radius','50%');await audit(page);await shot(page,testInfo,'order-details');await page.getByRole('dialog',{name:'Đơn OW_DEMO',exact:true}).getByRole('button',{name:'Đóng cửa sổ',exact:true}).click();
 const orderTabs=page.getByRole('navigation',{name:'Các mục đơn hàng'});
 for(const button of await orderTabs.getByRole('button').all()){await button.click();await audit(page);}
 expect(errors).toEqual([]);
});
test('shared product settings and image forms fit without unstyled fields',async({page},testInfo)=>{
 test.setTimeout(90000);const errors=await admin(page);
 await page.getByRole('navigation',{name:'Menu quản trị'}).getByRole('button',{name:'Sản phẩm',exact:true}).click();await page.getByRole('button',{name:'Thiết lập dùng chung',exact:true}).click();
 for(const button of await page.getByRole('navigation',{name:'Nhóm thiết lập dùng chung'}).getByRole('button').all()){await button.click();await audit(page);}
 await shot(page,testInfo,'shared-products');expect(errors).toEqual([]);
});
test('login labels, autofill and mobile field sizes stay usable',async({page},testInfo)=>{
 await mount(page,`import Login from '/src/admin/AdminLogin.jsx';${render('R.createElement(Login)')}`,{'lib/firebaseAuth.js':'export const auth={};','lib/firebase.js':'export const firebaseConfigured=true;'});
 const email=page.getByLabel('Email',{exact:true}),password=page.getByLabel('Mật khẩu',{exact:true});await email.fill('admin@example.test');await password.fill('fixture-password');
 await expect(email).toHaveAttribute('autocomplete','username');await expect(password).toHaveAttribute('autocomplete','current-password');
 await email.focus();await expect(email).toHaveCSS('outline-style','solid');await expect(email).toHaveCSS('font-size',page.viewportSize().width<=800?'16px':'14px');await fit(page);await shot(page,testInfo,'login');
});

test('customer checkout and FAQ previews keep website controls instead of admin controls',async({page})=>{
 await mount(page,`import Settings from '/src/admin/builder/CheckoutSettings.jsx';import Preview from '/src/components/OrderFormPreview.jsx';import Discovery from '/src/admin/ProductDiscoverySettings.jsx';${render("R.createElement(R.Fragment,null,R.createElement('div',{'data-baseline':''},R.createElement(Preview)),R.createElement('main',{className:'admin-main'},R.createElement(Settings,{value:{},onChange:()=>{}}),R.createElement(Discovery,{faq:true})))")}`,{'lib/api.js':`export const getHomeContent=async()=>({});export const getProducts=async()=>[];export const saveHomeContent=async()=>{};export const explainError=e=>e.message;`});
 await page.getByText('Xem trước form đặt hàng',{exact:true}).click();
 const baseline=page.locator('[data-baseline] .website-order input[name=name]'),embedded=page.locator('.admin-main [data-admin-preview] .website-order input[name=name]');
 for(const property of ['padding','border-radius','font-size','line-height','opacity','background-color'])await expect(embedded).toHaveCSS(property,await baseline.evaluate((el,key)=>getComputedStyle(el).getPropertyValue(key),property));
 const baselineChoice=page.locator('[data-baseline] .order-consent input'),previewChoice=page.locator('.admin-main [data-admin-preview] .order-consent input');
 await expect(previewChoice).toHaveCSS('appearance',await baselineChoice.evaluate(el=>getComputedStyle(el).appearance));
 const summary=page.locator('[data-admin-preview] .product-faq summary').first();await expect(summary).toBeVisible();await expect(summary).toHaveCSS('display','list-item');await expect(summary).toHaveCSS('padding','0px');await expect(summary).toHaveCSS('border-top-style','none');await summary.click();await expect(summary.locator('..')).toHaveAttribute('open','');
});
