import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
const errors=new WeakMap();
test.beforeEach(({page})=>{const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
const photos=['/preview/product.svg?one','/preview/product.svg?two','/preview/product.svg?three'];
async function setup(page){
 await mount(page,`import Viewer from '/src/components/ProductImageViewer.jsx';function Fixture(){const [open,setOpen]=R.useState(false);return R.createElement(R.Fragment,null,R.createElement('div',{style:{height:'2400px'}}),R.createElement('button',{id:'open-photo',style:{position:'fixed',top:12,left:12},onClick:()=>setOpen(true)},'Xem ảnh lớn'),open&&R.createElement(R.StrictMode,null,R.createElement(Viewer,{images:${JSON.stringify(photos)},name:'Sản phẩm thử',onClose:()=>setOpen(false)})))};${render('R.createElement(Fixture)')}`);
 await page.evaluate(()=>window.scrollTo(0,500));await page.getByRole('button',{name:'Xem ảnh lớn',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Sản phẩm thử',exact:true})).toBeVisible();
 await expect(page.locator('.image-viewer-stage > img')).toHaveCSS('opacity','1');
 if(page.viewportSize().width===390&&test.info().title.startsWith('viewer supports'))await page.screenshot({path:'/tmp/orora-image-viewer-mobile.png'});
}
test('viewer supports keyboard, zoom, thumbnails, focus restoration and preserved page position',async({page})=>{
 await setup(page);expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await page.getByRole('button',{name:'Phóng to',exact:true}).click();await expect(page.getByRole('button',{name:'Về kích thước ban đầu',exact:true})).toHaveText('150%');
 await page.keyboard.press('ArrowRight');await expect(page.getByRole('status',{name:'2 / 3'})).toBeVisible();await expect(page.getByRole('button',{name:'Về kích thước ban đầu',exact:true})).toHaveText('100%');
 await page.getByRole('button',{name:'Xem ảnh 2',exact:true}).click();await expect(page.locator('.image-viewer-stage > img')).toHaveCSS('opacity','1');
 await page.getByRole('button',{name:'Xem ảnh 3',exact:true}).click();await expect(page.getByRole('status',{name:'3 / 3'})).toBeVisible();await fit(page);
 await page.keyboard.press('Escape');await expect(page.locator('dialog')).toHaveCount(0);await expect(page.locator('#open-photo')).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');expect(await page.evaluate(()=>window.scrollY)).toBe(500);
});
test('touch swipe switches photos and pinch zoom allows panning without scrolling the page',async({page})=>{
 await setup(page);const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});
 const box=await page.locator('.image-viewer-stage').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2;
 const touch=async(type,points)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:points.map(([x,y,id])=>({x,y,id}))});
 await touch('touchStart',[[x+70,y,1]]);await touch('touchMove',[[x-70,y,1]]);await touch('touchEnd',[]);
 await expect(page.getByRole('status',{name:'2 / 3'})).toBeVisible();await expect(page.locator('.image-viewer-stage > img')).toHaveCSS('opacity','1');
 await touch('touchStart',[[x-25,y,1],[x+25,y,2]]);await touch('touchMove',[[x-70,y,1],[x+70,y,2]]);await touch('touchEnd',[]);
 const reset=page.getByRole('button',{name:'Về kích thước ban đầu',exact:true});await expect(reset).not.toHaveText('100%');
 const beforePan=await page.locator('.image-viewer-stage > img').getAttribute('style');
 await touch('touchStart',[[x,y,1]]);await touch('touchMove',[[x+40,y,1]]);await touch('touchEnd',[]);
 expect(await page.locator('.image-viewer-stage > img').getAttribute('style')).not.toBe(beforePan);
 expect(await page.evaluate(()=>window.scrollY)).toBe(500);await reset.click();await expect(reset).toHaveText('100%');
 await touch('touchStart',[[x,y,1]]);await touch('touchEnd',[]);await touch('touchStart',[[x,y,1]]);await touch('touchEnd',[]);await expect(reset).toHaveText('250%');
 await page.getByRole('button',{name:'Đóng ảnh',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('viewer appearance, text and switch are editable with a working admin preview',async({page})=>{
 await mount(page,`import Settings from '/src/admin/builder/ImageViewerSettings.jsx';function Fixture(){const [value,setValue]=R.useState({heading:{color:'#123456'},controls:{color:'#235614',fontSize:18}});return R.createElement(Settings,{value,onChange:patch=>setValue(old=>({...old,...patch}))})};${render('R.createElement(Fixture)')}`);
 await page.getByText('Nội dung và giao diện cửa sổ ảnh',{exact:true}).click();await page.getByLabel('Tiêu đề — dùng {product} để điền tên sản phẩm',{exact:true}).fill('Ảnh của {product}');
 await page.getByRole('button',{name:'Xem trước cửa sổ ảnh',exact:true}).click();await expect(page.getByRole('dialog',{name:'Ảnh của Sản phẩm xem trước',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Ảnh của Sản phẩm xem trước'})).toHaveCSS('color','rgb(18, 52, 86)');await expect(page.getByRole('button',{name:'Phóng to',exact:true})).toHaveCSS('color','rgb(35, 86, 20)');await expect(page.getByRole('button',{name:'Phóng to',exact:true})).toHaveCSS('font-size','18px');await page.keyboard.press('Escape');
 await page.getByRole('checkbox',{name:'Cho phép chạm ảnh để phóng to',exact:true}).uncheck();await expect(page.getByRole('button',{name:'Xem trước cửa sổ ảnh',exact:true})).toBeDisabled();await fit(page);
});
test('product detail opens the selected image and respects the admin off switch',async({page})=>{
 const product={id:'1',name:'Ảnh sản phẩm thật',image:'/preview/product.svg?main',image2:'/preview/product.svg?extra',price:'409000'};
 await mount(page,`import Detail from '/src/components/ProductDetail.jsx';${render('R.createElement(Detail)')}`,{
  'lib/api.js':`export const getProduct=async()=>(${JSON.stringify(product)});export const getPublicProducts=async()=>[];`,
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 });
 await page.locator('.product-detail-thumb').first().click();
 await page.getByRole('button',{name:'Phóng to ảnh',exact:true}).click();await expect(page.getByRole('dialog',{name:product.name,exact:true})).toBeVisible();await expect(page.getByRole('status',{name:'2 / 2'})).toBeVisible();await page.keyboard.press('Escape');
 await mount(page,`import Detail from '/src/components/ProductDetail.jsx';${render('R.createElement(Detail)')}`,{
  'lib/api.js':`export const getProduct=async()=>(${JSON.stringify(product)});export const getPublicProducts=async()=>[];`,
  'hooks/useHomeContent.js':'export default function home(){return {loading:false,productDetailStyles:{imageLayout:{viewer:{enabled:false}}}}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 });
 await expect(page.getByRole('heading',{name:product.name,exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Phóng to ảnh',exact:true})).toHaveCount(0);
});
