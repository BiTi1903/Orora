import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
const product={id:'gel',slug:'gel',name:'Deodorant Mist - Bodyplex',price:'600000',description:'Xịt khử mùi dịu nhẹ',volumeOptions:[{id:'large',label:'220ml',price:'600000'},{id:'small',label:'180ml',price:'450000'}]};
const base={
 'hooks/useHomeContent.js':`export default function home(){return {loading:false,productDetailStyles:{},productPolicies:[]}}`,
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':`export const getProduct=async()=>(${JSON.stringify(product)});`,
 'hooks/useAddressOptions.js':`const provinces=[{code:'01',name:'Đồng Nai'}],wards=[{code:'001',name:'Phường Tân Mai'}];export default function useAddress(){return {provinces,wards,loadingProvinces:false,loadingWards:false}}`,
};
async function detail(page,state){
 await mount(page,`import Detail from '/src/components/ProductDetail.jsx';import {Routes,Route} from '/qa/runtime.js';D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,{initialEntries:[{pathname:'/product/gel',state:${JSON.stringify(state||null)}}]},R.createElement(Routes,null,R.createElement(Route,{path:'/product/:id',element:R.createElement(Detail)}))));`,base);
 await expect(page.locator('.product-detail-info h1')).toHaveText(product.name);
}
test('detail selects the catalog price by default, keeps totals compact and isolates checkout edits',async({page},testInfo)=>{
 await detail(page);
 await expect(page.getByLabel('180ml',{exact:true})).toBeChecked();await expect(page.locator('.product-detail-price')).toContainText('450.000');
 await expect(page.locator('.product-price-variant')).toContainText('180ml');
 const subtotal=page.locator('.purchase-subtotal');await expect(subtotal.locator('div > small')).toHaveCount(0);expect((await subtotal.boundingBox()).height).toBeLessThan(110);
 await page.locator('.product-volume-choice').filter({hasText:'220ml'}).click();await expect(page.getByLabel('220ml',{exact:true})).toBeChecked();await expect(page.locator('.product-detail-price')).toContainText('600.000');
 await page.getByRole('button',{name:'Đặt hàng ngay',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Đặt hàng trên website',exact:true});await expect(dialog).toBeVisible();
 if(page.viewportSize().width<=600){const labels=dialog.locator('.order-field-row').first().locator('label');const first=await labels.nth(0).boundingBox(),second=await labels.nth(1).boundingBox();expect(second.y).toBeGreaterThan(first.y+20);expect(first.width).toBeGreaterThan(230);}
 await expect(dialog.getByLabel('220ml',{exact:true})).toBeChecked();await expect(page.locator('.product-detail dialog')).toHaveCount(0);
 await page.evaluate(()=>{window.__detailMutations=0;new MutationObserver(()=>window.__detailMutations++).observe(document.querySelector('.product-detail'),{childList:true,subtree:true});});
 await dialog.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn Khách Thử');
 await dialog.getByLabel('Số điện thoại',{exact:true}).fill('0901234567');
 await dialog.getByLabel('Email nhận xác nhận đơn',{exact:true}).fill('qa@example.com');
 await dialog.getByRole('button',{name:'Tiếp tục',exact:true}).click();
 const province=dialog.getByRole('combobox',{name:'Tỉnh / Thành phố',exact:true});await province.fill('dong nai');await dialog.getByRole('option',{name:'Đồng Nai',exact:true}).click();
 await dialog.getByRole('combobox',{name:'Phường / Xã',exact:true}).fill('tan mai');await dialog.getByRole('option',{name:'Phường Tân Mai',exact:true}).click();
 expect(await page.evaluate(()=>window.__detailMutations)).toBe(0);
 await expect(dialog.locator('input[name=name]')).toHaveValue('Nguyễn Khách Thử');await fit(page);
 await page.screenshot({path:testInfo.outputPath('checkout.png')});await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('product-price.png')});
});
test('explicit cart volume and quantity take priority over the default catalog choice',async({page})=>{
 await detail(page,{cartSelection:{productId:'gel',variantId:'large',quantity:3}});await expect(page.getByLabel('220ml',{exact:true})).toBeChecked();await expect(page.getByRole('spinbutton')).toHaveValue('3');await expect(page.locator('.purchase-subtotal strong')).toContainText('1.800.000');
 await page.getByRole('button',{name:'Đặt hàng ngay',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog.getByRole('spinbutton')).toHaveValue('3');await expect(dialog.getByLabel('220ml',{exact:true})).toBeChecked();
});
test('inspector separates selected fields and section settings and keeps drafts while switching tabs',async({page},testInfo)=>{
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{...base,'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA',navStyles:{surfaces:{chatPanelWidth:310}}});export const saveHomeContent=async value=>window.__saved=value;`});
 await page.getByLabel('Tìm mục chỉnh sửa',{exact:true}).fill('navbar');await expect(page.locator('.builder-section-row')).toHaveCount(1);await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();
 await page.getByLabel('Chữ logo',{exact:true}).fill('ORORA MỚI');
 await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
 await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA');
 await page.getByRole('button',{name:'Làm lại',exact:true}).click();
 await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA MỚI');await expect(page.getByRole('tab',{name:'Đang chọn',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(page.getByLabel('Chiều rộng khung chat AI (px)',{exact:true})).toBeHidden();await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();
 await page.getByText('Hiệu ứng, cánh hoa và icon nút',{exact:true}).click();await page.getByLabel('Chiều rộng khung chat AI (px)',{exact:true}).fill('320');
 await page.getByRole('tab',{name:'Đang chọn',exact:true}).click();await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA MỚI');
 await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();await page.frameLocator('iframe').locator('[data-builder-key="navLogo"]').click();await expect(page.getByRole('tab',{name:'Đang chọn',exact:true})).toHaveAttribute('aria-selected','true');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navLogo:'ORORA MỚI',navStyles:{surfaces:{chatPanelWidth:320}}});await expect(page.getByRole('button',{name:'💾 Lưu tất cả',exact:true})).toHaveCSS('background-color','rgb(184, 68, 109)');
 await page.getByLabel('Tìm mục chỉnh sửa',{exact:true}).fill('');await fit(page);await page.screenshot({path:testInfo.outputPath('visual-admin.png'),fullPage:true});
});
test('checkout appearance and content preview share the live presentation and preserve other purchase settings',async({page})=>{
 await mount(page,`import Settings from '/src/admin/builder/CheckoutSettings.jsx';function Fixture(){const [value,setValue]=R.useState({websiteLabel:'Giữ nguyên',formLabels:{recipientHeading:'Người nhận cũ'}});window.__appearance=value;return R.createElement('main',{className:'admin-main'},R.createElement(Settings,{value,onChange:patch=>setValue(old=>({...old,...patch}))}))};${render('R.createElement(Fixture)')}`,base);
 await page.getByLabel('Tiêu đề người nhận',{exact:true}).fill('Thông tin giao nhận');await page.getByText('Khung và kiểu chữ form',{exact:true}).click();await page.getByLabel('Đệm trong form (px)',{exact:true}).fill('12');
 await page.getByText('Xem trước form đặt hàng',{exact:true}).click();const preview=page.getByLabel('Xem trước form đặt hàng',{exact:true});await expect(preview.getByRole('heading',{name:'Thông tin giao nhận',exact:true})).toBeVisible();await expect(preview.locator('.orora-modal-content')).toHaveCSS('padding','12px');
 expect(await page.evaluate(()=>window.__appearance.websiteLabel)).toBe('Giữ nguyên');await fit(page);
});

test('known stock blocks orders', async ({ page }) => {
 await page.route('**/api/storefront/stock?**', route => route.fulfill({ json: { availability: { gel: 'out' } } }));
 await detail(page);
 await expect(page.getByText('Hết hàng', { exact: true })).toBeVisible();
 await expect(page.getByRole('button', { name: 'Đặt hàng ngay' })).toBeDisabled();
});

test('product image dialog opens the source and zoom controls enlarge it', async ({ page }) => {
 await mount(page, `import Detail from '/src/components/ProductDetail.jsx';import {Routes,Route} from '/qa/runtime.js';D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,{initialEntries:['/product/gel']},R.createElement(Routes,null,R.createElement(Route,{path:'/product/:id',element:R.createElement(Detail)}))));`, {
  ...base,
  'lib/api.js': `export const getProduct=async()=>(${JSON.stringify({ ...product, image: '/preview/product.svg' })});`,
 });
 await page.getByRole('button', { name: 'Phóng to ảnh' }).click();
 const dialog = page.getByRole('dialog', { name: product.name });
 await dialog.getByRole('button', { name: 'Phóng to', exact: true }).click();
 await expect(dialog.getByRole('img')).toHaveAttribute('style', /width: 150%/);
 await page.keyboard.press('Escape');
 await expect(dialog).toHaveCount(0);
});
