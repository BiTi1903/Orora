import {test,expect} from '@playwright/test';
import {mount,render,fit,reveal} from './fixtures';
const mocks={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
};
test('volume selection is compact on first load and still adds the selected volume and quantity',async({page},testInfo)=>{
 await mount(page,`import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('button',{onClick:()=>window.dispatchEvent(new CustomEvent('orora-cart-add',{detail:{id:'1'}}))},'Thêm thử'),R.createElement(Cart))")}`,{...mocks,'hooks/useProducts.js':`export default function products(){return {products:[{id:'1',name:'Gel',volumeOptions:[{id:'small',label:'180ml',price:'100000'},{id:'large',label:'220ml',price:'120000'}]}],loading:false}}`});
 await page.getByRole('button',{name:'Thêm thử',exact:true}).click();
 const dialog=page.getByRole('dialog',{name:'Chọn dung tích',exact:true});await expect(dialog).toBeVisible();
 const box=await dialog.boundingBox();expect(box.width).toBeLessThanOrEqual(361);expect(box.height).toBeLessThan(340);
 await expect(dialog.locator('.product-volume-choices')).toHaveCSS('display','flex');
 await expect(dialog.getByRole('button',{name:'Thêm vào giỏ',exact:true})).toBeDisabled();
 await dialog.getByLabel('220ml',{exact:true}).check();await dialog.getByRole('button',{name:'Tăng số lượng',exact:true}).click();
 await page.screenshot({path:testInfo.outputPath('compact-selection.png')});
 await dialog.getByRole('button',{name:'Thêm vào giỏ',exact:true}).click();await expect(dialog).toHaveCount(0);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('orora-cart-v1')))).toEqual([{id:'1',variantId:'large',quantity:2}]);
 await page.evaluate(()=>window.dispatchEvent(new Event('orora-cart-open')));await expect(page.getByRole('dialog',{name:'Giỏ hàng',exact:true})).toContainText('220ml');await fit(page);
});
test('navbar cart settings preview typography and shape independently and keep saved configuration',async({page})=>{
 await mount(page,`import Settings from '/src/admin/builder/CartSettings.jsx';function Fixture(){const [navbar,setNavbar]=R.useState({navStyles:{mobile:{enabled:false},cart:{copy:{label:'Giỏ cũ'},text:{color:'#112233'},navbarButton:{radius:10},selectionPopup:{width:360},futureSetting:'keep'}}});window.__navbar=navbar;return R.createElement('main',{className:'admin-main'},R.createElement(Settings,{navbar,onChange:patch=>setNavbar(old=>({...old,...patch}))}))};${render('R.createElement(Fixture)')}`,mocks);
 await page.getByLabel('Tên nút giỏ hàng',{exact:true}).fill('Túi đồ');
 const preview=page.getByLabel('Xem trước nút giỏ hàng navbar',{exact:true});await expect(preview.getByRole('button')).toHaveText('Túi đồ (2)');
 await page.getByText('Khung và kiểu chữ nút navbar',{exact:true}).click();await page.getByLabel('Bo góc nút (px)',{exact:true}).fill('24');
 await expect(preview.getByRole('button')).toHaveCSS('border-radius','24px');
 await page.getByLabel('Màu nền nút navbar',{exact:true}).fill('#123456');await expect(preview.getByRole('button')).toHaveCSS('background-color','rgb(18, 52, 86)');
 const text=page.locator('.builder-setting-group').filter({has:page.getByRole('heading',{name:'Chữ nút giỏ hàng navbar',exact:true})}).last();
 await reveal(text.getByLabel('Cỡ chữ desktop',{exact:true}));await text.getByLabel('Cỡ chữ desktop',{exact:true}).selectOption('18');await expect(preview.getByRole('button')).toHaveCSS('font-size','18px');
 await page.getByLabel('Hiện số lượng trên nút',{exact:true}).uncheck();await expect(preview.getByRole('button')).toHaveText('Túi đồ');
 await page.getByText('Nội dung và kích thước popup chọn dung tích',{exact:true}).click();await page.getByLabel('Chiều rộng popup desktop (px)',{exact:true}).fill('400');await page.getByLabel('Chiều rộng popup mobile (px)',{exact:true}).fill('280');
 const popup=page.getByLabel('Xem trước popup chọn dung tích',{exact:true});const width=(await popup.boundingBox()).width;expect(width).toBeLessThanOrEqual(page.viewportSize().width<=768?281:401);
 await expect(popup.getByRole('heading')).toHaveText('Chọn dung tích');await popup.getByLabel('220ml',{exact:true}).check();await expect(popup.getByRole('button',{name:'Thêm vào giỏ',exact:true})).toBeEnabled();
 const saved=await page.evaluate(()=>window.__navbar);expect(saved.navStyles.mobile.enabled).toBe(false);expect(saved.navStyles.cart.futureSetting).toBe('keep');expect(saved.navStyles.cart.text.color).toBe('#112233');await fit(page);
});
test('builder saves only the changed cart fields and the live navbar and popup consume them',async({page})=>{
 await mount(page,`import Builder from '/qa/BuilderHarness.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{...mocks,
  'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA',navStyles:{cart:{copy:{label:'Giỏ hàng'},selectionPopup:{width:360},navbarButton:{radius:14},unknown:'keep'},mobile:{enabled:false}}});export const saveHomeContent=async payload=>{window.__saved=payload};`,
 });
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();
 await page.frameLocator('iframe').getByRole('button',{name:'Giỏ hàng',exact:true}).click();
 await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Mở Cửa hàng · Giỏ hàng',exact:true}).click();
 await page.getByText('Khung và kiểu chữ nút navbar',{exact:true}).click();await page.getByLabel('Bo góc nút (px)',{exact:true}).fill('24');await page.getByLabel('Màu nền nút navbar',{exact:true}).fill('#123456');
 await page.getByLabel('Tên nút giỏ hàng',{exact:true}).fill('Túi ORORA');await page.getByText('Nội dung và kích thước popup chọn dung tích',{exact:true}).click();await page.getByLabel('Chiều rộng popup desktop (px)',{exact:true}).fill('400');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navStyles:{cart:{copy:{label:'Túi ORORA'},selectionPopup:{width:400},navbarButton:{radius:24,background:'#123456'}}}});
 const saved=await page.evaluate(()=>window.__saved.navStyles.cart);
 await mount(page,`import Nav from '/src/components/Navbar.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement(Nav),R.createElement(Cart))")}`,{...mocks,'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navStyles:{cart:${JSON.stringify(saved)}}}}`,'hooks/useProducts.js':`export default function products(){return {products:[{id:'1',name:'Gel',volumeOptions:[{id:'a',label:'180ml'},{id:'b',label:'220ml'}]}],loading:false}}`});
 if(page.viewportSize().width>768){const button=page.locator('.navbar').getByRole('button',{name:'Túi ORORA',exact:true});await expect(button).toBeVisible();await expect(button).toHaveCSS('border-radius','24px');await expect(button).toHaveCSS('background-color','rgb(18, 52, 86)');}
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('orora-cart-add',{detail:{id:'1'}})));const selection=page.getByRole('dialog',{name:'Chọn dung tích',exact:true});await expect(selection).toBeVisible();expect((await selection.boundingBox()).width).toBeCloseTo(page.viewportSize().width>768?400:Math.min(360,page.viewportSize().width-24),0);await page.keyboard.press('Escape');
 await page.evaluate(()=>window.dispatchEvent(new Event('orora-cart-open')));await expect(page.getByRole('dialog',{name:'Giỏ hàng',exact:true})).toBeVisible();
});
