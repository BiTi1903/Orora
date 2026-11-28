import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
const modules={
 'hooks/useHomeContent.js':`export default function home(){return {loading:false,navLogo:'ORORA',navLinks:[{label:'Tra cứu đơn hàng',href:'/tra-cuu-don-hang',kind:'order-tracking'}],navStyles:{mobile:{showBottomBar:true,safariLayout:"bar",afterTicker:false}}}}`,
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
};
async function fixture(page){
 await page.addInitScript(()=>{const scroll=window.scrollTo.bind(window);window.__topCalls=[];window.scrollTo=(...args)=>{if(args[0]?.top===0)window.__topCalls.push(args[0].behavior);return scroll(...args);};});
 await mount(page,`import {Routes,Route,useLocation} from '/qa/runtime.js';import Scroll from '/src/components/ScrollToTop.jsx';import Navbar from '/src/components/Navbar.jsx';import Nav from '/src/components/MobileShopNav.jsx';function Current(){const l=useLocation();return R.createElement('output',{'data-testid':'path'},l.pathname)};${render("R.createElement(R.Fragment,null,R.createElement(Scroll),R.createElement(Navbar),R.createElement(Current),R.createElement(Routes,null,R.createElement(Route,{path:'/',element:R.createElement('main',{style:{height:3600}},'Trang chủ')}),R.createElement(Route,{path:'/tra-cuu-don-hang',element:R.createElement('main',{style:{height:3600}},R.createElement('h1',null,'Tra cứu đơn'))})),R.createElement(Nav))")}`,modules);
 await page.evaluate(()=>{document.documentElement.style.scrollBehavior='smooth';window.scrollTo({top:2200,behavior:'instant'});window.__topCalls=[];});
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(1500);
}
test('tracking from the bottom nav reaches the top immediately and works again on the same route',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile navigation');await fixture(page);
 const link=page.locator('.mobile-shop-nav').getByRole('link',{name:'Tra cứu',exact:true});await link.click();await expect(page.getByTestId('path')).toHaveText('/tra-cuu-don-hang');
 await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);expect(await page.evaluate(()=>window.__topCalls)).toContain('instant');expect(await page.evaluate(()=>history.scrollRestoration)).toBe('manual');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.evaluate(()=>window.scrollTo({top:2200,behavior:'instant'}));await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(1500);await expect(link).toBeVisible();await link.click();await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);
});
test('tracking from the open mobile menu releases the page lock without restoring the old scroll',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile menu');await fixture(page);
 await page.locator('.navbar .menu').evaluate(el=>el.click());await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await page.locator('.mobile-drawer').getByRole('link',{name:'Tra cứu đơn hàng',exact:true}).click();
 await expect(page.getByTestId('path')).toHaveText('/tra-cuu-don-hang');await expect.poll(()=>page.evaluate(()=>scrollY)).toBe(0);await expect.poll(()=>page.evaluate(()=>document.body.style.overflow)).not.toBe('hidden');
 await page.waitForTimeout(150);expect(await page.evaluate(()=>scrollY)).toBe(0);
});
