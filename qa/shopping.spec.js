import {test,expect} from '@playwright/test';
const pageErrors=new WeakMap();
test.beforeEach(({page})=>{const errors=[];pageErrors.set(page,errors);page.on('pageerror',error=>errors.push(error.message));});
test.afterEach(({page})=>expect(pageErrors.get(page)).toEqual([]));
async function mount(page,code,modules={}){
 const entry=await(await page.request.get('/src/main.jsx')).text();
 const version=entry.match(/react-router-dom\.js\?v=([a-z0-9]+)/)?.[1];
 if(!version)throw Error('Cannot read Vite dependency version');
 const suffix=`?v=${version}`;
 for(const [path,body] of Object.entries(modules))await page.route(`**/src/${path}*`,route=>route.fulfill({contentType:'application/javascript',body}));
 await page.route('**/qa-ui',route=>route.fulfill({contentType:'text/html',body:`<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><div id="root"></div><script type="module">import R from '/@react-refresh';R.injectIntoGlobalHook(window);window.$RefreshReg$=()=>{};window.$RefreshSig$=()=>t=>t;window.__vite_plugin_react_preamble_installed__=true;</script><script type="module">import R from '/node_modules/.vite/deps/react.js${suffix}';import D from '/node_modules/.vite/deps/react-dom_client.js${suffix}';import {MemoryRouter} from '/node_modules/.vite/deps/react-router-dom.js${suffix}';import '/src/App.css';import '/src/styles/admin.css';${code}</script>`}));
 await page.goto('/qa-ui');
}
const render=element=>`D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,null,${element}));`;
const fit=async page=>expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
test('checkout waits for durable acknowledgment, prevents duplicate submits and keeps fields after a failed request',async({page})=>{
 let release,calls=0;
 await page.route('**/api/orders',async route=>{calls++;await new Promise(resolve=>release=resolve);await route.fulfill(calls===1?{status:503,json:{message:'Máy chủ thử nghiệm tạm bận'}}:{json:{code:'OW_TESTC',subtotal:409000,shippingFee:null,totalAmount:null,paymentMethod:'cod',message:'Đã nhận đơn thử nghiệm'}});});
 await mount(page,`import Order from '/src/components/OrderForm.jsx';${render("R.createElement(Order,{product:{id:'1',name:'Sản phẩm kiểm tra',price:'409000'},home:{},onClose:()=>{}})")}`,{'hooks/useAddressOptions.js':"export default function useAddress(){return {provinces:[{code:'01',name:'Hà Nội'}],wards:[{code:'00001',name:'Phường Hoàn Kiếm'}],loadingProvinces:false,loadingWards:false}}"});
 await page.getByLabel('Họ và tên',{exact:true}).fill('Khách kiểm tra');await page.getByLabel('Số điện thoại',{exact:true}).fill('0901234567');await page.getByLabel('Email nhận xác nhận đơn',{exact:true}).fill('qa@example.com');
 await page.getByRole('combobox',{name:'Tỉnh / Thành phố',exact:true}).click();await page.getByRole('option',{name:'Hà Nội',exact:true}).click();await page.getByRole('combobox',{name:'Phường / Xã',exact:true}).click();await page.getByRole('option',{name:'Phường Hoàn Kiếm',exact:true}).click();await page.getByLabel('Số nhà, tên đường',{exact:true}).fill('Địa chỉ thử nghiệm');await page.getByRole('checkbox').check();
 await page.getByRole('button',{name:'Đặt hàng ngay',exact:true}).click();const busy=page.locator('.website-order-submit');await expect(busy).toHaveAttribute('aria-busy','true');await expect(busy).toBeDisabled();await expect(page.getByRole('dialog',{name:'Đã nhận đơn hàng',exact:true})).toHaveCount(0);
 await page.locator('.website-order').evaluate(form=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));await expect.poll(()=>calls).toBe(1);release();await expect(page.getByRole('alert')).toHaveText('Máy chủ thử nghiệm tạm bận');await expect(busy).toBeEnabled();await expect(page.getByLabel('Họ và tên',{exact:true})).toHaveValue('Khách kiểm tra');await page.getByRole('button',{name:'Đặt hàng ngay',exact:true}).click();await expect.poll(()=>calls).toBe(2);await expect(page.getByRole('dialog',{name:'Đã nhận đơn hàng',exact:true})).toHaveCount(0);release();await expect(page.getByRole('dialog',{name:'Đã nhận đơn hàng',exact:true})).toBeVisible();await fit(page);
});
test('phone-only lookup groups compact results and opens accessible detail',async({page})=>{
 let request;
 await page.route('**/api/order-tracking',route=>{request=route.request().postDataJSON();return route.fulfill({json:{orders:Array.from({length:7},(_,i)=>({code:`OW_${1000+i}C`,status:i<6?'new':'completed',createdAt:1794193200000,productName:'Sản phẩm kiểm tra',quantity:1,totalAmount:409000,paymentMethod:'cod',paymentStatus:'unpaid'})),nextCursor:null}});});
 await mount(page,`import Tracking from '/src/components/OrderTracking.jsx';${render('R.createElement(Tracking)')}`,{'hooks/useHomeContent.js':'export default function useHome(){return {loading:false}}'});
 await page.getByLabel('Số điện thoại đặt hàng',{exact:true}).fill('0901234567');await page.getByRole('button',{name:'Tra cứu đơn hàng',exact:true}).click();await expect(page.locator('.order-tracking-summary')).toHaveCount(5);expect(request.phone).toBe('0901234567');expect(request.code).toBe('');
 await page.getByRole('button',{name:'Trang sau',exact:true}).click();await expect(page.locator('.order-tracking-summary')).toHaveCount(2);await page.getByRole('button',{name:'Xem chi tiết đơn OW_1005C',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await fit(page);
});
test('unsaved warning persists through failed save and clears only after acknowledged success',async({page})=>{
 await mount(page,`import Form from '/src/admin/home/Editcollection.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Form))")}`,{'lib/api.js':'export const getHomeContent=async()=>({collectionLabel:"Ban đầu"});export const explainError=e=>e.message;export const saveHomeContent=()=>new Promise((resolve,reject)=>{window.resolveSave=resolve;window.rejectSave=()=>reject(Error("Lỗi lưu"));});'});
 const dirty=()=>page.evaluate(()=>{const event=new Event('beforeunload',{cancelable:true});window.dispatchEvent(event);return event.defaultPrevented;});
 await expect(page.getByLabel('Nhãn nhỏ',{exact:true})).toHaveValue('Ban đầu');expect(await dirty()).toBe(false);await page.getByLabel('Nhãn nhỏ',{exact:true}).fill('Chưa lưu');expect(await dirty()).toBe(true);await page.getByRole('button',{name:'💾 Lưu',exact:true}).click();await page.waitForFunction(()=>window.rejectSave);await page.evaluate(()=>window.rejectSave());await expect(page.getByRole('alert')).toHaveText('Lỗi lưu');expect(await dirty()).toBe(true);await page.getByRole('button',{name:'💾 Lưu',exact:true}).click();await page.waitForFunction(()=>window.resolveSave);await page.evaluate(()=>window.resolveSave());await expect(page.getByText('Đã lưu phần này.',{exact:true})).toBeVisible();expect(await dirty()).toBe(false);await fit(page);
});
test('navigation and product links remain usable at each viewport',async({page})=>{
 await mount(page,`import Nav from '/src/components/Navbar.jsx';${render('R.createElement(Nav)')}`,{'hooks/useHomeContent.js':'export default function useHome(){return {loading:false,navLogo:"ORORA",navLinks:[{label:"Sản phẩm",href:"/#shop"},{label:"Liên hệ",href:"/#contact"}]}}','hooks/useCategories.js':'export default function useCategories(){return {categories:[]}}'});
 if(page.viewportSize().width<=768){await page.getByRole('button',{name:'Mở menu',exact:true}).click();await expect(page.getByRole('button',{name:'Đóng menu',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Mở menu',exact:true})).toBeFocused();}
 else await expect(page.locator('.nav-links').getByRole('link',{name:'Tra cứu đơn hàng',exact:true})).toBeVisible();await fit(page);
});
