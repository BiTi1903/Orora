import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
test('mobile nav appears as soon as there is room below the ticker and no desktop cart flashes on mobile',async({page})=>{
 await mount(page,`import Nav from '/src/components/MobileShopNav.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',null,R.createElement('section',{className:'hero',style:{height:600}},'Hero'),R.createElement('div',{className:'marquee',style:{height:50}},'Dải chữ'),R.createElement('div',{style:{height:2800}},'Nội dung')),R.createElement(Cart),R.createElement(Nav))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}','hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}'});
 const nav=page.locator('.mobile-shop-nav');
 if(page.viewportSize().width>768){await expect(nav).toBeHidden();await expect(page.locator('.desktop-cart')).toBeVisible();return;}
 await expect(page.locator('.desktop-cart')).toBeHidden();await expect(nav).toBeHidden();expect(await page.evaluate(()=>document.documentElement.classList.contains('has-mobile-shop-nav'))).toBe(false);
 const boundary=await page.locator('.marquee').evaluate(el=>el.getBoundingClientRect().bottom+window.scrollY)-page.viewportSize().height+(await nav.evaluate(el=>el.offsetHeight))+12;await page.evaluate(y=>window.scrollTo(0,y-10),boundary);await expect(nav).toBeHidden();await page.evaluate(y=>window.scrollTo(0,y+10),boundary);await expect(nav).toBeVisible();expect((await page.locator('.marquee').boundingBox()).y+50).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>document.documentElement.classList.contains('has-mobile-shop-nav'))).toBe(true);await page.evaluate(()=>window.scrollTo(0,0));await expect(nav).toBeHidden();await expect(page.locator('.desktop-cart')).toBeHidden();
});

test('iPhone Safari nav waits for collapsed browser chrome and hides on upward scroll or keyboard',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile only');
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const viewport=new EventTarget();viewport.height=window.innerHeight-100;viewport.scale=1;
  Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
 });
 await mount(page,`import Nav from '/src/components/MobileShopNav.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:4000}},R.createElement('input',{'aria-label':'Nhập thử'})),R.createElement(Nav))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false,navStyles:{mobile:{afterTicker:false}}}}'});
 const nav=page.locator('.mobile-shop-nav');await expect(nav).toBeHidden();
 await page.evaluate(()=>window.scrollTo(0,300));await expect(nav).toBeHidden();
 await page.evaluate(()=>{window.visualViewport.height=window.innerHeight;window.visualViewport.dispatchEvent(new Event('resize'));});await expect(nav).toBeVisible();
 await page.evaluate(()=>window.scrollTo(0,260));await expect(nav).toBeHidden();
 await page.evaluate(()=>window.scrollTo(0,340));await expect(nav).toBeVisible();
 await page.getByLabel('Nhập thử').evaluate(el=>el.focus({preventScroll:true}));await expect(nav).toBeHidden();
});
