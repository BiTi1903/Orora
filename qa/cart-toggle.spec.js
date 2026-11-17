import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
for(const motion of [true,false])test(`cart trigger closes once without reopening, motion ${motion}`,async({page})=>{
 await mount(page,`import Cart from '/src/components/ShopCart.jsx';import Nav from '/src/components/MobileShopNav.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:2400}},R.createElement('button',{id:'outside'},'Ngoài giỏ')),R.createElement(Cart),R.createElement(Nav))")}`,{'hooks/useHomeContent.js':`export default function home(){return {loading:false,navStyles:{mobile:{safariLayout:"bar",afterTicker:false},cart:{popupAnimation:${motion}}}}}`,'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}'});
 if(page.viewportSize().width<=768)await page.evaluate(()=>window.scrollTo(0,200));
 const trigger=page.locator('[data-cart-target]:visible').last(),cart=page.getByRole('dialog',{name:'Giỏ hàng',exact:true});
 await trigger.click();await expect(cart).toHaveCount(1);
 if(motion)await cart.evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});
 await page.evaluate(()=>{window.__cartMotions=0;const animate=Element.prototype.animate;Element.prototype.animate=function(...args){if(this.matches('.shop-cart'))window.__cartMotions++;return animate.apply(this,args);};});
 await trigger.click();await expect(cart).toHaveCount(0);expect(await page.evaluate(()=>window.__cartMotions)).toBe(0);
 await trigger.click();await expect(cart).toHaveCount(1);
 if(motion)await cart.evaluate(async el=>{await Promise.all(el.getAnimations().map(a=>a.finished));});
 await page.locator('#outside').click();await expect(cart).toHaveCount(0);
});
