import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
const errors=new WeakMap();test.beforeEach(({page})=>{const list=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
test('failed catalog reads stay distinct from empty results, preserve admin text and can be retried',async({page})=>{
 await mount(page,`import Collection from '/src/components/Collection.jsx';${render('R.createElement(Collection)')}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,collectionTitle:'Sản phẩm',collectionStyles:{loadError:{title:'Danh sách chưa tải được',text:'Bạn thử lại nhé',retryLabel:'Tải danh sách',titleStyle:{color:'#123456'}}}}}`,
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
  'lib/api.js':`export async function getPublicProducts(){if(!window.__allowRead)throw new Error('Private database diagnostic');return [{id:'1',name:'Serum',slug:'serum',price:'100000'}]}`,
 });
 const error=page.getByRole('alert');await expect(error).toContainText('Danh sách chưa tải được');await expect(error.getByRole('heading')).toHaveCSS('color','rgb(18, 52, 86)');await expect(page.getByText('Sản phẩm sẽ sớm được cập nhật.',{exact:true})).toHaveCount(0);
 expect(await page.locator('body').innerText()).not.toContain('Private database diagnostic');await page.evaluate(()=>window.__allowRead=true);await page.getByRole('button',{name:'Tải danh sách',exact:true}).click();await expect(error).toHaveCount(0);await expect(page.getByText('Serum',{exact:true})).toBeVisible();await fit(page);
});
test('temporary product read errors do not mark the product URL as a confirmed missing page',async({page})=>{
 await mount(page,`import Seo from '/src/components/Seo.jsx';D.createRoot(document.getElementById('root')).render(R.createElement(MemoryRouter,{initialEntries:['/product/serum']},R.createElement(Seo)));`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false,error:new Error("offline")}}',
 });
 await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','index, follow');
});
test('nested shared dialogs survive StrictMode, respect busy state and restore focus and scroll',async({page})=>{
 await mount(page,`import Modal from '/src/components/ModalDialog.jsx';function Fixture(){const [outer,setOuter]=R.useState(false),[inner,setInner]=R.useState(false),[busy,setBusy]=R.useState(true);return R.createElement(R.Fragment,null,R.createElement('div',{style:{height:'2400px'}}),R.createElement('button',{id:'open-modal',style:{position:'fixed',top:12},onClick:()=>setOuter(true)},'Mở kiểm tra'),outer&&R.createElement(R.StrictMode,null,R.createElement(Modal,{title:'Cửa sổ ngoài',onClose:()=>setOuter(false)},R.createElement('button',{onClick:()=>setInner(true)},'Mở cửa sổ trong'),inner&&R.createElement(Modal,{title:'Cửa sổ trong',closeDisabled:busy,onClose:()=>setInner(false)},R.createElement('button',{onClick:()=>setBusy(false)},'Kết thúc xử lý')))))};${render('R.createElement(Fixture)')}`);
 await page.evaluate(()=>window.scrollTo(0,500));await page.getByRole('button',{name:'Mở kiểm tra',exact:true}).click();await expect(page.locator('dialog[open]')).toHaveCount(1);
 await page.getByRole('button',{name:'Mở cửa sổ trong',exact:true}).click();await expect(page.locator('dialog[open]')).toHaveCount(2);await page.keyboard.press('Escape');await expect(page.locator('dialog[open]')).toHaveCount(2);
 await page.getByRole('button',{name:'Kết thúc xử lý',exact:true}).click();await page.keyboard.press('Escape');await expect(page.locator('dialog')).toHaveCount(1);expect(await page.evaluate(()=>document.body.style.overflow)).toBe('hidden');
 await page.keyboard.press('Escape');await expect(page.locator('dialog')).toHaveCount(0);await expect(page.locator('#open-modal')).toBeFocused();expect(await page.evaluate(()=>document.body.style.overflow)).toBe('');expect(await page.evaluate(()=>scrollY)).toBe(500);
});
test('inventory drafts survive failed saves and saving one row does not mark other rows as saved',async({page})=>{
 let fail=true;
 await page.route('**/api/inventory*',async route=>{
  const request=route.request();if(request.method()==='POST'){
   const body=request.postDataJSON();return route.fulfill(fail?{status:503,json:{message:'Lỗi thử nghiệm, chưa lưu'}}:{json:{item:{id:body.id,name:body.id==='1'?'SP 1':'SP 2',quantity:body.quantity,version:2}}});
  }
  return route.fulfill({json:new URL(request.url()).searchParams.has('pending')?{pending:{},nextCursor:null}:{items:[{id:'1',name:'SP 1',quantity:10,version:1},{id:'2',name:'SP 2',quantity:20,version:1}],nextCursor:null}});
 });
 await mount(page,`import Inventory from '/src/admin/InventoryAdmin.jsx';import {dirtyRegistry} from '/src/lib/dirty-registry.js';window.__hasDraft=()=>dirtyRegistry.hasChanges();${render('R.createElement(Inventory)')}`,{'lib/firebaseAuth.js':'export const auth={currentUser:{getIdToken:async()=>"test"}};'});
 const first=page.getByRole('spinbutton',{name:'Số lượng tồn của SP 1',exact:true}),second=page.getByRole('spinbutton',{name:'Số lượng tồn của SP 2',exact:true});
 await first.fill('12');await second.fill('25');await expect.poll(()=>page.evaluate(()=>window.__hasDraft())).toBe(true);
 await page.locator('.inventory-stock-form').first().getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('status')).toContainText('chưa lưu');await expect(first).toHaveValue('12');
 fail=false;await page.locator('.inventory-stock-form').first().getByRole('button',{name:'Lưu',exact:true}).click();await expect(first).toHaveValue('');await expect(second).toHaveValue('25');await expect.poll(()=>page.evaluate(()=>window.__hasDraft())).toBe(true);
 const prompt=page.waitForEvent('dialog');const click=page.getByRole('button',{name:'Tải lại tồn kho',exact:true}).click();const dialog=await prompt;await dialog.dismiss();await click;await expect(second).toHaveValue('25');
 await second.fill('');await expect.poll(()=>page.evaluate(()=>window.__hasDraft())).toBe(false);await fit(page);
});
