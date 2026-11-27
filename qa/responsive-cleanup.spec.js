import {test,expect} from '@playwright/test';
import {builderPane,mount,render,fit} from './fixtures';

const mocks={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':'export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:"ORORA"});export const saveHomeContent=async()=>{};',
};

test('builder uses one responsive layout at the tablet breakpoint',async({page})=>{
 test.skip(page.viewportSize().width!==1440,'Run the viewport matrix once per browser');
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,mocks);
 const layout=page.locator('.builder-layout'),canvas=page.locator('.builder-canvas'),settings=page.locator('.builder-settings');
 for(const width of [950,1000,1001]){
  await page.setViewportSize({width,height:1000});
  if(width<=1000){
   await expect(layout).toHaveCSS('display','flex');await expect(layout).toHaveCSS('flex-direction','column');
   await builderPane(page,'Chỉnh sửa');await expect(settings).toBeVisible();await expect(canvas).toBeHidden();
   await builderPane(page,'Xem trước');await expect(canvas).toBeVisible();await expect(settings).toBeHidden();
  }else{
   await expect(layout).toHaveCSS('display','grid');
   const a=await canvas.boundingBox(),b=await settings.boundingBox();
   expect(Math.abs(a.y-b.y)).toBeLessThan(2);expect(b.x).toBeGreaterThanOrEqual(a.x+a.width-1);
  }
  await fit(page);
 }
});

test('cart keeps viewport gutters and quantity inputs avoid iOS text zoom',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('orora-cart-v1',JSON.stringify([{id:'1',variantId:'',quantity:1}])));
 await mount(page,`import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(Cart)")}`,{
  ...mocks,
  'hooks/useProducts.js':'export default function products(){return {products:[{id:"1",name:"Sản phẩm kiểm tra có tên dài",price:"150000"}],loading:false}}',
 });
 await page.evaluate(()=>window.dispatchEvent(new Event('orora-cart-open')));
 const cart=page.getByRole('dialog',{name:'Giỏ hàng',exact:true});await expect(cart).toBeVisible();
 await cart.evaluate(async dialog=>{await Promise.all(dialog.getAnimations().map(animation=>animation.finished));});
 const box=await cart.boundingBox(),width=page.viewportSize().width;
 expect(box.x).toBeGreaterThanOrEqual(11);expect(box.x+box.width).toBeLessThanOrEqual(width-11);
 await expect(cart.getByRole('spinbutton')).toHaveCSS('font-size','16px');
 await cart.getByRole('spinbutton').fill('2');await expect(cart).toContainText('300.000');
 const contained=await cart.locator('.cart-row-actions').evaluate(el=>{const box=el.getBoundingClientRect();return [...el.children].every(child=>{const item=child.getBoundingClientRect();return item.left>=box.left-1&&item.right<=box.right+1;});});
 expect(contained).toBe(true);
 await fit(page);
});
