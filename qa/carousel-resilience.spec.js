import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';

const products=Array.from({length:5},(_,i)=>({id:String(i+1),number:String(i+1),name:`Sản phẩm ${i+1}`,slug:`sp-${i+1}`,price:'100000',image:'',description:i===1?'Nội dung mô tả dài để kiểm tra bố cục thẻ sản phẩm.':''}));
async function catalog(page){
 await page.clock.install();
 await mount(page,`import Collection from '/src/components/Collection.jsx';${render('R.createElement(Collection)')}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false,collectionTitle:"Sản phẩm",collectionStyles:{carousel:{autoPlay:false}}}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
  'hooks/useProducts.js':`export default function useProducts(){return {products:${JSON.stringify(products)},loading:false}}`,
 });
 await expect(page.locator('.gallery-slide:not([inert])')).toHaveCount(page.viewportSize().width<=1000?2:3);
 await page.clock.runFor(100);
}
async function gesture(page,points,end='pointerup'){
 await page.locator('.gallery-viewport').evaluate((el,{points,end})=>{
  el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerId:1,pointerType:'touch',clientX:200,clientY:300}));
  for(const [x,y] of points)window.dispatchEvent(new PointerEvent('pointermove',{pointerId:1,pointerType:'touch',clientX:x,clientY:y,cancelable:true}));
  const [x,y]=points.at(-1);window.dispatchEvent(new PointerEvent(end,{pointerId:1,pointerType:'touch',clientX:x,clientY:y}));
 },{points,end});
}
test('rapid next clicks never advance past the cloned end slides',async({page})=>{
 await catalog(page);
 await page.getByRole('button',{name:'Sản phẩm sau',exact:true}).evaluate(button=>{for(let i=0;i<12;i++)button.click();});
 await expect(page.locator('.gallery-slide:not([inert])')).toHaveCount(page.viewportSize().width<=1000?2:3);
 await page.clock.runFor(900);
 await expect(page.locator('.gallery-slide:not([inert])').first()).toContainText('Sản phẩm 1');
 await page.getByRole('button',{name:'Sản phẩm sau',exact:true}).click();
 await expect(page.locator('.gallery-slide:not([inert])').first()).toContainText('Sản phẩm 2');
 await page.clock.runFor(900);
 await fit(page);
});
test('vertical scroll and cancelled horizontal gestures do not change the selected products',async({page})=>{
 await catalog(page);
 await gesture(page,[[180,330],[120,400]]);
 await expect(page.locator('.gallery-slide:not([inert])').first()).toContainText('Sản phẩm 1');
 await gesture(page,[[120,302]],'pointercancel');
 await expect(page.locator('.gallery-slide:not([inert])').first()).toContainText('Sản phẩm 1');
 await gesture(page,[[120,302]]);
 await expect(page.locator('.gallery-slide:not([inert])').first()).toContainText('Sản phẩm 2');
});
