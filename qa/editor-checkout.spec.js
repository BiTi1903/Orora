import {test,expect} from '@playwright/test';
import {builderPane,mount,render,fit} from './fixtures';
const product={id:'gel',slug:'gel',name:'Deodorant Mist - Bodyplex',price:'600000',description:'Xịt khử mùi dịu nhẹ',detailVisibility:{description:true,specifications:true,usage:true},volumeOptions:[{id:'large',label:'220ml',price:'600000'},{id:'small',label:'180ml',price:'450000'}]};
const base={
 'hooks/useHomeContent.js':`export default function home(){return {loading:false,productDetailStyles:{},productPolicies:[]}}`,
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':`export const getProduct=async()=>(${JSON.stringify(product)});`,
 'hooks/useAddressOptions.js':`const provinces=[{code:'01',name:'Đồng Nai'}],wards=[{code:'001',name:'Phường Tân Mai'}];export default function useAddress(){return {provinces,wards,loadingProvinces:false,loadingWards:false}}`,
};
async function detail(page,state,overrides={},withMobileControls=false){
 await mount(page,`import Detail from '/src/components/ProductDetail.jsx';import Chat from '/src/components/ChatButton.jsx';import MobileNav from '/src/components/MobileShopNav.jsx';import {Routes,Route} from '/qa/runtime.js';D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,{initialEntries:[{pathname:'/product/gel',state:${JSON.stringify(state||null)}}]},R.createElement(Routes,null,R.createElement(Route,{path:'/product/:id',element:R.createElement(R.Fragment,null,R.createElement(Detail),${withMobileControls ? "R.createElement(Chat),R.createElement(MobileNav)" : "null"})}))));`,{...base,...overrides});
 await expect(page.locator('.product-detail-info h1')).toHaveText(product.name);
}
test('detail selects the catalog price by default, keeps totals compact and isolates checkout edits',async({page},testInfo)=>{
 await detail(page);
 await expect(page.getByRole('radio',{name:/^180ml(?: ·|$)/})).toBeChecked();await expect(page.locator('.product-detail-price')).toContainText('450.000');
 await expect(page.locator('.product-price-variant')).toHaveCount(0);
 await expect(page.locator('.product-mobile-buy-total')).toContainText('180ml');
 await expect(page.locator('.purchase-subtotal')).toHaveCount(0);
 if (page.viewportSize().width > 768) await expect(page.locator('.purchase-options .product-mobile-buy')).toBeVisible();
 const buyBar=page.locator('.product-mobile-buy');await expect(buyBar).toBeVisible();expect((await buyBar.boundingBox()).height).toBeLessThan(95);
 await page.locator('.product-volume-choice').filter({hasText:'220ml'}).click();await expect(page.getByRole('radio',{name:/^220ml(?: ·|$)/})).toBeChecked();await expect(page.locator('.product-detail-price')).toContainText('600.000');
 const purchase = page.getByRole('button',{name:'Mua ngay',exact:true});
 if (page.viewportSize().width <= 768) await expect(purchase).toBeInViewport();
 await purchase.click();const dialog=page.getByRole('dialog',{name:'Đặt hàng trên website',exact:true});await expect(dialog).toBeVisible();
 await dialog.evaluate((el)=>Promise.all(el.getAnimations().map((a)=>a.finished.catch(()=>{}))));
 if(page.viewportSize().width<=600){const labels=dialog.locator('.order-field-row').first().locator('label');const first=await labels.nth(0).boundingBox(),second=await labels.nth(1).boundingBox();expect(second.y).toBeGreaterThan(first.y+20);expect(first.width).toBeGreaterThan(230);}
 await expect(dialog.getByRole('radio',{name:/^220ml(?: ·|$)/})).toBeChecked();await expect(page.locator('.product-detail dialog')).toHaveCount(0);
 await page.evaluate(()=>{window.__detailMutations=0;new MutationObserver(()=>window.__detailMutations++).observe(document.querySelector('.product-detail'),{childList:true,subtree:true});});
 await dialog.getByLabel('Họ và tên',{exact:true}).fill('Nguyễn Khách Thử');
 await dialog.getByLabel('Số điện thoại',{exact:true}).fill('0901234567');
 await dialog.getByLabel('Email nhận xác nhận đơn',{exact:true}).fill('qa@example.com');
 const province=dialog.getByRole('combobox',{name:'Tỉnh / Thành phố',exact:true});await province.fill('dong nai');await dialog.getByRole('option',{name:'Đồng Nai',exact:true}).click();
 if (page.viewportSize().width <= 768) {
  await dialog.getByLabel('Số nhà, tên đường',{exact:true}).focus();
  await expect(dialog.locator('.checkout-sticky')).toHaveCSS('position','static');
 }
 await dialog.getByRole('combobox',{name:'Phường / Xã',exact:true}).fill('tan mai');await dialog.getByRole('option',{name:'Phường Tân Mai',exact:true}).click();
 expect(await page.evaluate(()=>window.__detailMutations)).toBe(0);
 await expect(dialog.locator('input[name=name]')).toHaveValue('Nguyễn Khách Thử');await fit(page);
 await page.screenshot({path:testInfo.outputPath('checkout.png')});page.once('dialog',async confirmation=>{expect(confirmation.message()).toContain('Bỏ thông tin');await confirmation.accept();});await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);
 await page.screenshot({path:testInfo.outputPath('product-price.png')});
});
test('explicit cart volume and quantity take priority over the default catalog choice',async({page})=>{
 await detail(page,{cartSelection:{productId:'gel',variantId:'large',quantity:3}});await expect(page.getByRole('radio',{name:/^220ml(?: ·|$)/})).toBeChecked();await expect(page.getByRole('spinbutton')).toHaveValue('3');await expect(page.locator('.product-mobile-buy-total strong')).toContainText('1.800.000');
 await page.getByRole('button',{name:'Mua ngay',exact:true}).click();const dialog=page.getByRole('dialog');await expect(dialog.getByRole('spinbutton')).toHaveValue('3');await expect(dialog.getByRole('radio',{name:/^220ml(?: ·|$)/})).toBeChecked();
});
test('inspector separates selected fields and section settings and keeps drafts while switching tabs',async({page},testInfo)=>{
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{...base,'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA',navStyles:{surfaces:{chatPanelWidth:310}}});export const saveHomeContent=async value=>window.__saved=value;`});
 await page.getByLabel('Tìm mục chỉnh sửa',{exact:true}).fill('navbar');await expect(page.locator('.builder-section-row')).toHaveCount(1);await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();
 await page.getByLabel('Chữ logo',{exact:true}).fill('ORORA M');
 await page.getByLabel('Chữ logo',{exact:true}).fill('ORORA MỚI');
 await page.getByRole('button',{name:'Hoàn tác',exact:true}).click();
 await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA');
 await page.getByRole('button',{name:'Làm lại',exact:true}).click();
 await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA MỚI');await expect(page.getByRole('tab',{name:'Đang chọn',exact:true})).toHaveAttribute('aria-selected','true');
 await expect(page.getByLabel('Chiều rộng khung chat AI (px)',{exact:true})).toBeHidden();await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();
 await page.getByText('Hiệu ứng, cánh hoa và icon nút',{exact:true}).click();await page.getByLabel('Chiều rộng khung chat AI (px)',{exact:true}).fill('320');
 await page.getByRole('tab',{name:'Đang chọn',exact:true}).click();await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA MỚI');
 await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();await builderPane(page,'Xem trước');await page.frameLocator('iframe').locator('[data-builder-key="navLogo"]').click();await expect(page.getByRole('tab',{name:'Đang chọn',exact:true})).toHaveAttribute('aria-selected','true');
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
 await expect(page.locator('.product-stock-badge')).toHaveText('Hết hàng');
 await expect(page.locator('.product-mobile-buy .product-mobile-buy-cta')).toBeDisabled();
});

test('product image zooms inline at cursor position without opening a popup', async ({ page }) => {
 await page.route('https://res.cloudinary.com/**', route => route.fulfill({
  contentType: 'image/svg+xml',
  body: '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="pink"/></svg>',
 }));
 await mount(page, `import Detail from '/src/components/ProductDetail.jsx';import {Routes,Route} from '/qa/runtime.js';D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,{initialEntries:['/product/gel']},R.createElement(Routes,null,R.createElement(Route,{path:'/product/:id',element:R.createElement(Detail)}))));`, {
  ...base,
  'lib/api.js': `export const getProduct=async()=>(${JSON.stringify({ ...product, image: 'https://res.cloudinary.com/demo/image/upload/product.svg' })});`,
 });
 const imageBox = page.locator('.product-detail-image.is-interactive');
 await expect(imageBox).toBeVisible();
 const box = await imageBox.boundingBox();
 await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.75);
 await expect(imageBox).toHaveAttribute('data-zooming', 'true');
 await expect(imageBox.locator('img')).toHaveAttribute('src', /w_1600/);
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const origin = await imageBox.evaluate(el => ({ x: parseFloat(el.style.getPropertyValue('--zoom-x')), y: parseFloat(el.style.getPropertyValue('--zoom-y')) }));
 expect(origin.x).toBeGreaterThan(15);
 expect(origin.x).toBeLessThan(35);
 expect(origin.y).toBeGreaterThan(65);
 expect(origin.y).toBeLessThan(85);
 await page.mouse.move(box.x + box.width + 40, box.y);
 await expect(imageBox).toHaveAttribute('data-zooming', 'false');
});

test('mobile buy bar shares purchase settings and leaves room for chat and navigation', async ({ page }) => {
 test.skip(page.viewportSize().width > 768, 'Mobile layout');
 await detail(page, null, {
  'hooks/useHomeContent.js': 'export default function home(){return {loading:false,productDetailStyles:{purchaseOptions:{websiteBackground:"#654321",fontSize:18}},navStyles:{mobile:{afterTicker:false}},chatSettings:{hintEnabled:false}}}',
  'hooks/useChatConversation.js': 'export default function chat(){return {metadata:{}}}',
 }, true);
 const sticky = page.getByRole('button', { name: 'Mua ngay', exact: true });
 await expect(sticky).toHaveCSS('background-color', 'rgb(101, 67, 33)');
 await expect(sticky).toHaveCSS('font-size', '18px');
 await expect(page.locator('.product-mobile-buy')).toHaveCSS('backdrop-filter', /blur/);
 await page.getByRole('button',{name:'Tăng số lượng'}).click();
 await page.getByRole('button',{name:'Tăng số lượng'}).click();
 await expect(page.locator('.product-mobile-buy-total')).toContainText('1.350.000');
 await expect(page.locator('.product-mobile-buy-total')).toContainText('3 sản phẩm');
 await page.evaluate(() => window.scrollTo(0, 440));
 const nav = page.locator('.mobile-shop-nav');
 await expect(nav).toBeVisible();
 await expect.poll(() => page.evaluate(() => {
  const bar = document.querySelector('.product-mobile-buy').getBoundingClientRect();
  const chat = document.querySelector('.orora-chat-launcher').getBoundingClientRect();
  const navbar = document.querySelector('.mobile-shop-nav').getBoundingClientRect();
  return Math.min(bar.top - chat.bottom, navbar.top - bar.bottom);
 })).toBeGreaterThanOrEqual(-1);
 await expect.poll(() => page.evaluate(() => document.querySelector('.product-mobile-buy').getBoundingClientRect().top - document.querySelector('.orora-chat-launcher').getBoundingClientRect().bottom)).toBeGreaterThanOrEqual(8);
 // Recreate a composited product shell with its sticky tabs under the CTA.
 await page.locator('.product-detail-shell').evaluate(node => {
  node.style.transform = 'translateZ(0)';
 });
 await page.locator('.product-information-nav').evaluate(node => {
  const bar = document.querySelector('.product-mobile-buy').getBoundingClientRect();
  window.scrollBy(0, node.getBoundingClientRect().top - bar.top);
 });
 await expect.poll(() => sticky.evaluate(node => {
  const bounds = node.getBoundingClientRect();
  return node.contains(document.elementFromPoint(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2));
 })).toBe(true);
 await sticky.click();
 await expect(page.getByRole('dialog').getByRole('spinbutton')).toHaveValue('3');
});

test('website order buttons stay hidden when payment methods are disabled', async ({ page }) => {
 await detail(page, null, {
  'hooks/useHomeContent.js': 'export default function home(){return {loading:false,shopLinks:{paymentMethods:[]}}}',
 });
 await expect(page.getByRole('button', { name: 'Mua ngay', exact: true })).toHaveCount(0);
 await expect(page.locator('.product-mobile-buy')).toHaveCount(0);
});

test('the compact thumbnail strip shows two square images with borderless previews on both sides', async ({page}) => {
 const image = (number) => `/sample-${number}.png`;
 const withImages = {...product, image:image(0), additionalImages:[image(1),image(2),image(3),image(4)]};
 await detail(page, null, {'lib/api.js':`export const getProduct=async()=>(${JSON.stringify(withImages)});`});
 const thumbs = page.locator('.product-detail-thumbs');
 const tiles = thumbs.getByRole('tab');
 await expect(tiles).toHaveCount(2);
 await expect(tiles.first()).toHaveAccessibleName('Ảnh phụ 1');
 const tile = await tiles.first().boundingBox();
 expect(tile.width).toBeLessThanOrEqual(48);
 expect(tile.height).toBe(tile.width);
 await page.evaluate(async ()=>{
  await import('/src/styles/mobile-glass.css');
  document.documentElement.setAttribute('data-glass-buttons','');
 });
 const previous = page.getByRole('button',{name:'Ảnh phụ trước',exact:true});
 await expect(previous.locator('img')).toHaveAttribute('src', /sample-4/);
 await previous.click();
 await expect(tiles.first()).toHaveAccessibleName('Ảnh phụ 4');
 await expect(previous).toHaveCSS('box-shadow','none');
 await expect(previous).toHaveCSS('border-top-width','0px');
 const next = page.getByRole('button',{name:'Ảnh phụ sau',exact:true});
 await expect(next.locator('img')).toHaveAttribute('src', /sample-2/);
 await next.click();
 await expect(next.locator('img')).toHaveAttribute('src', /sample-3/);
 await next.click();
 await expect(tiles).toHaveCount(2);
 const third = thumbs.getByRole('tab',{name:'Ảnh phụ 3',exact:true});
 await third.click();
 await expect(third).toHaveAttribute('aria-selected','true');
 await fit(page);
});
