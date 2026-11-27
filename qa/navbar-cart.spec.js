import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('desktop cart belongs to navbar',async({page})=>{
 await mount(page,`import Navbar from '/src/components/Navbar.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:2500}},R.createElement(Navbar)),R.createElement(Cart))")}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navLinks:[{label:'Về Chúng Tôi',href:'/#about'},{label:'Sản phẩm',href:'/#shop'},{label:'Liên Hệ',href:'/#contact'}]}}`,'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}','hooks/useCategories.js':'export default function categories(){return {categories:[]}}'});
 const cart=page.locator('.navbar .desktop-cart');
 if(page.viewportSize().width>768){await expect(cart).toBeVisible();await expect(cart).toHaveCSS('position','static');const a=await cart.boundingBox(),b=await page.locator('.navbar').boundingBox();expect(a.y).toBeGreaterThanOrEqual(b.y);expect(a.y+a.height).toBeLessThanOrEqual(b.y+b.height);await cart.click();await expect(page.getByRole('dialog',{name:'Giỏ hàng',exact:true})).toBeVisible();await page.keyboard.press('Escape');}else await expect(cart).toBeHidden();
 await page.evaluate(()=>scrollTo(0,500));await expect(page.locator('.back-to-top')).toHaveCount(0);await fit(page);if(page.viewportSize().width>768){await page.setViewportSize({width:900,height:1000});await fit(page);}
});

test('public navbar restores Japanese and switches languages in place',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('orora_locale','ja'));
 await mount(page,`import Navbar from '/src/components/Navbar.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:1200}},R.createElement(Navbar)),R.createElement(Cart))")}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navLinks:[{label:'Về Chúng Tôi',href:'/#about'},{label:'Sản phẩm',href:'/#shop'},{label:'Liên Hệ',href:'/#contact'}]}}`,'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}','hooks/useCategories.js':'export default function categories(){return {categories:[]}}'});
 const mobile = page.viewportSize().width <= 768;
 if (mobile) await page.locator('.navbar .menu').click();
 const area = page.locator(mobile ? '.mobile-drawer' : '.navbar');
 const jp = area.getByRole('button',{name:'日本語',exact:true});
 await expect(jp).toHaveText('JP');
 await expect(jp).toHaveAttribute('aria-pressed','true');
 const url = page.url();
 for (const [name,code] of [['English','en'],['Tiếng Việt','vi'],['日本語','ja']]) {
  await area.getByRole('button',{name,exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('lang',code);
  expect(await page.evaluate(()=>localStorage.getItem('orora_locale'))).toBe(code);
  expect(page.url()).toBe(url);
 }
});
