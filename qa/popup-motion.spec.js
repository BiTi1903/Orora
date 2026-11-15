import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';

const modules={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false,navStyles:{mobile:{afterTicker:false}}}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
};
const fixture=`import Cart from '/src/components/ShopCart.jsx';import Nav from '/src/components/MobileShopNav.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:2400}},'Nội dung'),R.createElement(Cart),R.createElement(Nav))")}`;

async function mountPausedCart(page){
 await page.addInitScript(()=>{
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(...args){
   const animation=animate.apply(this,args);
   if(this.matches('.shop-cart'))animation.pause();
   return animation;
  };
 });
 await mount(page,fixture,modules);
 if(page.viewportSize().width<=768)await page.evaluate(()=>window.scrollTo(0,200));
 const trigger=page.locator('[data-cart-target]:visible').last();
 await expect(trigger).toBeVisible();
 const source=await trigger.boundingBox();
 await trigger.click();
 const cart=page.getByRole('dialog',{name:'Giỏ hàng',exact:true});
 await expect(cart).toHaveCount(1);
 if(page.viewportSize().width<=768)await expect(page.locator('.mobile-shop-nav')).toBeVisible();
 return {cart,source};
}

async function sample(cart,progress){
 return cart.evaluate((dialog,progress)=>{
  const animation=dialog.getAnimations()[0];
  animation.currentTime=Number(animation.effect.getTiming().duration)*progress;
  const style=getComputedStyle(dialog),matrix=new DOMMatrixReadOnly(style.transform),box=dialog.getBoundingClientRect();
  return {scale:matrix.a,x:box.x+box.width/2,y:box.y+box.height/2,cssScale:style.scale,animations:dialog.getAnimations().length};
 },progress);
}

test('cart expands from its trigger in one continuous spring without a second acceleration',async({page})=>{
 const {cart,source}=await mountPausedCart(page);
 const first=await sample(cart,0);
 expect(first.animations).toBe(1);expect(first.cssScale).toBe('none');
 expect(Math.abs(first.x-source.x-source.width/2)).toBeLessThan(1);
 expect(Math.abs(first.y-source.y-source.height/2)).toBeLessThan(1);
 expect(first.scale).toBeLessThan(.2);
 const samples=[];
 for(let index=0;index<=50;index++)samples.push(await sample(cart,index/50));
 const scales=samples.map(frame=>frame.scale),peak=Math.max(...scales),peakIndex=scales.indexOf(peak);
 expect(peak).toBeGreaterThan(1);expect(peak).toBeLessThan(1.035);
 for(let index=1;index<=peakIndex;index++)expect(scales[index]-scales[index-1]).toBeGreaterThanOrEqual(-.00001);
 for(let index=peakIndex+1;index<scales.length;index++)expect(scales[index]-scales[index-1]).toBeLessThanOrEqual(.00001);
 // The old animation nearly stopped at 62%, then abruptly accelerated again.
 const increments=scales.slice(1).map((value,index)=>value-scales[index]);
 const largestIncrement=Math.max(...increments.map(Math.abs));
 const before=scales[31]-scales[30],after=scales[32]-scales[31];
 expect(Math.abs(after-before)/largestIncrement).toBeLessThan(.1);
 const end=samples.at(-1);expect(end.scale).toBeCloseTo(1,4);
 expect(Math.abs(end.x-page.viewportSize().width/2)).toBeLessThan(1);
 expect(Math.abs(end.y-page.viewportSize().height/2)).toBeLessThan(1);
});

for(const progress of [.38,1])test(`cart reverses the same motion back to its trigger when closed at ${progress}`,async({page})=>{
 const {cart,source}=await mountPausedCart(page);
 await sample(cart,progress);
 if(progress===1)await cart.evaluate(dialog=>dialog.getAnimations()[0].finish());
 // Calling the real close control in-page also covers closing mid-animation.
 await cart.getByRole('button',{name:'Đóng cửa sổ',exact:true}).evaluate(button=>button.click());
 await expect.poll(()=>cart.evaluate(dialog=>dialog.getAnimations()[0]?.playbackRate)).toBe(-1);
 // A queued forward finish event must not remove the dialog during its return.
 await cart.evaluate(dialog=>{const animation=dialog.getAnimations()[0];animation.pause();animation.dispatchEvent(new Event('finish'));});
 await expect(cart).toHaveCount(1);
 const returned=await cart.evaluate(dialog=>{
  const animation=dialog.getAnimations()[0];animation.pause();animation.currentTime=0;
  const box=dialog.getBoundingClientRect();
  return {x:box.x+box.width/2,y:box.y+box.height/2,scale:new DOMMatrixReadOnly(getComputedStyle(dialog).transform).a};
 });
 expect(Math.abs(returned.x-source.x-source.width/2)).toBeLessThan(1);
 expect(Math.abs(returned.y-source.y-source.height/2)).toBeLessThan(1);
 expect(returned.scale).toBeLessThan(.2);
 await cart.evaluate(dialog=>dialog.getAnimations()[0].finish());
 await expect(cart).toHaveCount(0);
});

test('reduced motion opens and closes the cart without the spring',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await mount(page,fixture,modules);
 if(page.viewportSize().width<=768)await page.evaluate(()=>window.scrollTo(0,200));
 await page.locator('[data-cart-target]:visible').last().click();
 const cart=page.getByRole('dialog',{name:'Giỏ hàng',exact:true});await expect(cart).toBeVisible();
 expect(await cart.evaluate(dialog=>dialog.getAnimations().length)).toBe(0);
 await cart.getByRole('button',{name:'Đóng cửa sổ',exact:true}).click();await expect(cart).toHaveCount(0);
});
