import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('desktop cart belongs to navbar',async({page})=>{
 await mount(page,`import Navbar from '/src/components/Navbar.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:2500}},R.createElement(Navbar)),R.createElement(Cart))")}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navLinks:[{label:'Về Chúng Tôi',href:'/#about'},{label:'Sản phẩm',href:'/#shop'},{label:'Liên Hệ',href:'/#contact'}]}}`,'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}','hooks/useCategories.js':'export default function categories(){return {categories:[]}}'});
 const cart=page.locator('.navbar .desktop-cart');
 if(page.viewportSize().width>768){await expect(cart).toBeVisible();await expect(cart).toHaveCSS('position','static');const a=await cart.boundingBox(),b=await page.locator('.navbar').boundingBox();expect(a.y).toBeGreaterThanOrEqual(b.y);expect(a.y+a.height).toBeLessThanOrEqual(b.y+b.height);await cart.click();await expect(page.getByRole('dialog',{name:'Giỏ hàng',exact:true})).toBeVisible();await page.keyboard.press('Escape');}else await expect(cart).toBeHidden();
 await page.evaluate(()=>scrollTo(0,500));await expect(page.locator('.back-to-top')).toHaveCount(0);await fit(page);if(page.viewportSize().width>768){await page.setViewportSize({width:900,height:1000});await fit(page);}
});

test('public navbar stays in Vietnamese with a previously saved locale',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('orora_locale','ja'));
 await mount(page,`import Navbar from '/src/components/Navbar.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:1200}},R.createElement(Navbar)),R.createElement(Cart))")}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navLinks:[{label:'Về Chúng Tôi',href:'/#about'},{label:'Sản phẩm',href:'/#shop'},{label:'Liên Hệ',href:'/#contact'}]}}`,'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}','hooks/useCategories.js':'export default function categories(){return {categories:[]}}'});
 await expect(page.locator('.navbar-lang-switcher')).toHaveCount(0);
 if(page.viewportSize().width>768) {
  await expect(page.locator('.nav-links')).toContainText('Về Chúng Tôi');
 } else {
  await page.locator('.navbar .menu').click();
  await expect(page.locator('.mobile-drawer-links')).toContainText('Về Chúng Tôi');
 }
});

test('quick search keeps keyboard focus and fits a narrow viewport', async ({ page }) => {
 await mount(page, `import Navbar from '/src/components/Navbar.jsx';${render('R.createElement(Navbar)')}`, {
  'hooks/useHomeContent.js': 'export default function home(){return {navLinks:[]}}',
  'hooks/useProducts.js': 'export default function products(){return {loading:true,products:[]}}',
 });
 const toggle = page.getByRole('button', {name:'Tìm kiếm sản phẩm'});
 await toggle.click();
 const search = page.getByRole('search');
 await expect(search.getByRole('searchbox')).toBeFocused();
 await expect(search.getByRole('status')).toHaveText('Đang tải sản phẩm…');
 const box = await search.boundingBox();
 expect(box.x).toBeGreaterThanOrEqual(0);
 expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width + 1);
 await page.keyboard.press('Escape');
 await expect(search).toBeHidden();
 await expect(toggle).toBeFocused();
});
