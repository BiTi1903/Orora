import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';

test('mobile dialog follows the visible viewport when the keyboard opens and pans',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile viewport behavior');
 await page.addInitScript(()=>{
  const viewport=new EventTarget();let forcedHeight;Object.defineProperty(viewport,'height',{get:()=>forcedHeight??innerHeight,set:value=>{forcedHeight=value;}});Object.assign(viewport,{offsetTop:0,scale:1});
  Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});
 });
 await mount(page,`import Dialog from '/src/components/ModalDialog.jsx';${render("R.createElement(Dialog,{title:'Thông tin đặt hàng',onClose:()=>{}},R.createElement('form',null,R.createElement('label',null,'Số điện thoại',R.createElement('input',{type:'tel'})),R.createElement('div',{style:{height:500}},'Thông tin đơn hàng'),R.createElement('button',{type:'button'},'Tiếp tục')))")}`);
 const dialog=page.getByRole('dialog');
 await page.evaluate(()=>{Object.assign(visualViewport,{height:350,offsetTop:120});visualViewport.dispatchEvent(new Event('resize'));});
 await expect.poll(async()=>{const box=await dialog.boundingBox();return box.y+box.height;}).toBeLessThanOrEqual(458);
 const first=await dialog.boundingBox();expect(first.y).toBeGreaterThanOrEqual(132);
 await page.evaluate(()=>{visualViewport.offsetTop=180;visualViewport.dispatchEvent(new Event('scroll'));});
 await expect.poll(async()=>(await dialog.boundingBox()).y).toBeGreaterThanOrEqual(192);
 await dialog.getByRole('button',{name:'Tiếp tục'}).scrollIntoViewIfNeeded();
 const button=await dialog.getByRole('button',{name:'Tiếp tục'}).boundingBox();expect(button.y+button.height).toBeLessThanOrEqual(518);
 await page.evaluate(()=>{Object.assign(visualViewport,{height:innerHeight,offsetTop:0});visualViewport.dispatchEvent(new Event('resize'));});
 await expect.poll(async()=>{const box=await dialog.boundingBox();return Math.abs(box.y+box.height/2-page.viewportSize().height/2);}).toBeLessThan(2);
 await fit(page);
});

test('a settled cart returns to its source after the keyboard moves the viewport',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile keyboard geometry');
 await page.addInitScript(()=>{const viewport=new EventTarget();let forcedHeight;Object.defineProperty(viewport,'height',{get:()=>forcedHeight??innerHeight,set:value=>{forcedHeight=value;}});Object.assign(viewport,{offsetTop:0,scale:1});Object.defineProperty(window,'visualViewport',{value:viewport,configurable:true});});
 await mount(page,`import Cart from '/src/components/ShopCart.jsx';${render("R.createElement(R.Fragment,null,R.createElement('button',{style:{position:'fixed',bottom:20,left:20},onClick:e=>window.dispatchEvent(new CustomEvent('orora-cart-open',{detail:{source:e.currentTarget.getBoundingClientRect().toJSON()}}))},'Mở thử'),R.createElement(Cart))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}','hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}'});
 const source=await page.getByRole('button',{name:'Mở thử'}).boundingBox();await page.getByRole('button',{name:'Mở thử'}).click();
 const dialog=page.getByRole('dialog');await dialog.evaluate(el=>el.getAnimations()[0].finish());
 await page.evaluate(()=>{Object.assign(visualViewport,{height:350,offsetTop:120});visualViewport.dispatchEvent(new Event('resize'));});
 await expect.poll(async()=>{const box=await dialog.boundingBox();return Math.abs(box.y+box.height/2-295);}).toBeLessThan(2);
 await dialog.getByRole('button',{name:'Đóng cửa sổ'}).evaluate(el=>el.click());
 const returned=await dialog.evaluate(el=>{const animation=el.getAnimations()[0];animation.pause();animation.currentTime=0;const box=el.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};});
 expect(Math.abs(returned.x-source.x-source.width/2)).toBeLessThan(1);expect(Math.abs(returned.y-source.y-source.height/2)).toBeLessThan(1);
 await dialog.evaluate(el=>el.getAnimations()[0].finish());await expect(dialog).toHaveCount(0);
});
