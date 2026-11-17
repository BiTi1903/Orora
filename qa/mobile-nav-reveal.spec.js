import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
test('mobile nav appears as soon as there is room below the ticker and no desktop cart flashes on mobile',async({page})=>{
 await mount(page,`import Nav from '/src/components/MobileShopNav.jsx';import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',null,R.createElement('section',{className:'hero',style:{height:600}},'Hero'),R.createElement('div',{className:'marquee',style:{height:50}},'Dải chữ'),R.createElement('div',{style:{height:2800}},'Nội dung')),R.createElement(Cart),R.createElement(Nav))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false,navStyles:{mobile:{safariLayout:"bar"}}}}','hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}'});
 const nav=page.locator('.mobile-shop-nav');
 if(page.viewportSize().width>768){await expect(nav).toBeHidden();await expect(page.locator('.desktop-cart')).toBeVisible();return;}
 await expect(page.locator('.desktop-cart')).toBeHidden();await expect(nav).toBeHidden();expect(await page.evaluate(()=>document.documentElement.classList.contains('has-mobile-shop-nav'))).toBe(false);
 const boundary=await page.locator('.marquee').evaluate(el=>el.getBoundingClientRect().bottom+window.scrollY)-page.viewportSize().height+(await nav.evaluate(el=>el.offsetHeight))+12;await page.evaluate(y=>window.scrollTo(0,y-10),boundary);await expect(nav).toBeHidden();await page.evaluate(y=>window.scrollTo(0,y+10),boundary);await expect(nav).toBeVisible();expect((await page.locator('.marquee').boundingBox()).y+50).toBeGreaterThan(0);await expect.poll(()=>page.evaluate(()=>document.documentElement.classList.contains('has-mobile-shop-nav'))).toBe(true);await page.evaluate(()=>window.scrollTo(0,0));await expect(nav).toBeHidden();await expect(page.locator('.desktop-cart')).toBeHidden();
});

test('iPhone Safari nav waits for collapsed browser chrome and hides on upward scroll or keyboard',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile only');
 await page.addInitScript(()=>{
  Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  const viewport=new EventTarget();let forcedHeight;Object.defineProperty(viewport,'height',{get:()=>forcedHeight??(window.innerHeight-100),set:value=>{forcedHeight=value;}});viewport.scale=1;
  Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
 });
 await mount(page,`import Nav from '/src/components/MobileShopNav.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:4000}},R.createElement('input',{'aria-label':'Nhập thử'})),R.createElement(Nav))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false,navStyles:{mobile:{safariLayout:"bar",afterTicker:false}}}}'});
 const nav=page.locator('.mobile-shop-nav');await expect(nav).toBeHidden();
 await page.evaluate(()=>window.scrollTo(0,300));await expect(nav).toBeHidden();
 await page.evaluate(()=>{window.visualViewport.height=window.innerHeight;window.visualViewport.dispatchEvent(new Event('resize'));});await expect(nav).toBeVisible();
 await page.evaluate(()=>window.scrollTo(0,260));await expect(nav).toBeHidden();
 await page.evaluate(()=>window.scrollTo(0,340));await expect(nav).toBeVisible();
 await page.getByLabel('Nhập thử').evaluate(el=>el.focus({preventScroll:true}));await expect(nav).toBeHidden();
});

const visibilityFixture=`import Nav from '/src/components/MobileShopNav.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:4000}},R.createElement('input',{'aria-label':'Nhập thông tin',type:'text'}),R.createElement('input',{'aria-label':'Chọn dung tích',type:'radio'}),R.createElement('input',{'aria-label':'Đồng ý',type:'checkbox'}),R.createElement('input',{'aria-label':'Tùy chỉnh',type:'range'})),R.createElement(Nav))")}`;
const visibilityModules={'hooks/useHomeContent.js':'export default function home(){return {loading:false,navStyles:{mobile:{safariLayout:"bar",afterTicker:false}}}}'};

async function mockViewport(page,{safari=false,standalone=false,unsupportedUnits=false}={}){
 await page.addInitScript(({safari,standalone,unsupportedUnits})=>{
  Object.defineProperty(navigator,'userAgent',{get:()=>safari?'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1':'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0 Mobile Safari/537.36'});
  Object.defineProperty(navigator,'standalone',{get:()=>standalone});
  const viewport=new EventTarget();let forcedHeight;Object.defineProperty(viewport,'height',{get:()=>forcedHeight??window.innerHeight,set:value=>{forcedHeight=value;}});viewport.scale=1;
  Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
  if(unsupportedUnits){const supports=CSS.supports.bind(CSS);CSS.supports=(property,value)=>value==='100lvh'?false:supports(property,value);}
 },{safari,standalone,unsupportedUnits});
}

for(const standalone of [false,true])test(`mobile nav hides for ${standalone?'Safari standalone':'Android'} typing, keyboard geometry and zoom`,async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile only');
 await mockViewport(page,{safari:standalone,standalone});await mount(page,visibilityFixture,visibilityModules);
 const nav=page.locator('.mobile-shop-nav');await expect(nav).toBeVisible();
 await page.getByLabel('Nhập thông tin',{exact:true}).evaluate(el=>el.focus({preventScroll:true}));await expect(nav).toBeHidden();
 await page.evaluate(()=>document.activeElement.blur());await expect(nav).toBeVisible();
 await page.evaluate(()=>{visualViewport.height=innerHeight-300;visualViewport.dispatchEvent(new Event('resize'));});await expect(nav).toBeHidden();
 await page.evaluate(()=>{visualViewport.height=innerHeight;visualViewport.dispatchEvent(new Event('resize'));});await expect(nav).toBeVisible();
 await page.evaluate(()=>{visualViewport.scale=1.5;visualViewport.dispatchEvent(new Event('resize'));});await expect(nav).toBeHidden();
 await page.evaluate(()=>{visualViewport.scale=1;visualViewport.dispatchEvent(new Event('resize'));});await expect(nav).toBeVisible();
});

test('Safari radios keep navigation available and slow upward scrolling still hides it',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile only');
 await mockViewport(page,{safari:true});await mount(page,visibilityFixture,visibilityModules);
 const nav=page.locator('.mobile-shop-nav');await page.evaluate(()=>window.scrollTo(0,300));await expect(nav).toBeVisible();
 for(const label of ['Chọn dung tích','Đồng ý','Tùy chỉnh']){await page.getByLabel(label,{exact:true}).evaluate(el=>el.focus({preventScroll:true}));await expect(nav).toBeVisible();}
 await page.evaluate(()=>document.activeElement.blur());
 await page.evaluate(async()=>{for(let count=0;count<6;count++){window.scrollBy(0,-2);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}});await expect(nav).toBeHidden();
 await page.evaluate(async()=>{for(let count=0;count<6;count++){window.scrollBy(0,2);await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));}});await expect(nav).toBeVisible();
});

test('Safari toolbar fallback still follows scroll direction without large viewport units',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile only');
 await mockViewport(page,{safari:true,unsupportedUnits:true});await mount(page,visibilityFixture,visibilityModules);
 const nav=page.locator('.mobile-shop-nav');await expect(nav).toBeHidden();await page.evaluate(()=>window.scrollTo(0,300));await expect(nav).toBeVisible();await page.evaluate(()=>window.scrollTo(0,280));await expect(nav).toBeHidden();
});
