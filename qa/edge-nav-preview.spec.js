import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('compact edge control, vertical menu and full cart share sensible layers and touch space',async({page},testInfo)=>{
 test.skip(page.viewportSize().width>768,'Mobile only');
 await page.addInitScript(()=>{Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});localStorage.setItem('orora-cart-v1',JSON.stringify(Array.from({length:5},(_,i)=>({id:'demo-'+i,variantId:'small',quantity:1}))));});
 const products=['Deodorant Mist - Bodyplex','White Gel - Bodyplex','Whip Care - Bodyplex','Combo Tự tin & Quyến rũ','Dưỡng da dịu nhẹ'].map((name,i)=>({id:'demo-'+i,name,number:String(i+1),slug:'san-pham-mau-'+i,description:'Chăm sóc dịu nhẹ, nuôi dưỡng sự tự tin mỗi ngày.',price:String(349000+i*20000),image:'/preview/product.svg',volumeOptions:[{id:'small',label:'180ml',price:String(349000+i*20000)}]}));
 await mount(page,`import Navbar from '/src/components/Navbar.jsx';import Collection from '/src/components/Collection.jsx';import Nav from '/src/components/MobileShopNav.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',null,R.createElement(Navbar),R.createElement(Collection)),R.createElement(Cart),R.createElement(Nav))")}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navLinks:[{label:'Sản phẩm',href:'/#shop'}],collectionTitle:'Chăm sóc mỗi ngày',collectionHighlight:'BODYPLEX',collectionStyles:{carousel:{autoPlay:false}},navStyles:{mobile:{afterTicker:false}}}}`,
  'hooks/useProducts.js':`export default function products(){return {products:${JSON.stringify(products)},loading:false}}`,
  'hooks/useCategories.js':'export default function categories(){return {categories:[],loading:false}}',
 });
 await page.evaluate(()=>document.fonts.ready);const button=page.locator('.safari-nav-toggle');await expect(button).toBeVisible();await page.screenshot({path:testInfo.outputPath('01-nut-nep-canh.png')});
 await button.click();const nav=page.locator('.mobile-shop-nav.is-side');await expect(nav).toHaveCSS('transform','none');expect((await nav.boundingBox()).width).toBeLessThanOrEqual(149);await page.screenshot({path:testInfo.outputPath('02-menu-doc.png')});
 await nav.getByRole('link',{name:/Giỏ hàng/}).click();const cart=page.locator('.shop-cart[open]');await expect(cart).toBeVisible();await expect(button).toHaveAttribute('aria-expanded','false');await expect(button).toHaveAttribute('aria-label','Đóng giỏ hàng');await cart.evaluate(el=>Promise.all(el.getAnimations().map(a=>a.finished.catch(()=>{}))));await expect.poll(async()=>{const c=await cart.boundingBox(),b=await button.boundingBox();return b.y-c.y-c.height;}).toBeGreaterThanOrEqual(8);await expect(nav).toBeHidden();await page.screenshot({path:testInfo.outputPath('03-gio-hang.png')});
 await button.click();await expect(cart).toHaveCount(0);await expect(button).toHaveAttribute('aria-expanded','false');await fit(page);
});
