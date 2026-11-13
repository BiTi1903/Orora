import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
const errors=new WeakMap();test.beforeEach(({page})=>{const list=[];errors.set(page,list);page.on('pageerror',e=>list.push(e.message));});test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));
const categories=[{id:'care',name:'Dưỡng da'},{id:'clean',name:'Làm sạch'}];
const categoryMock=`export default function cats(){return {categories:${JSON.stringify(categories)},error:null,retry:()=>{}}}`;
test('mobile bottom navigation links to Story and scrolls home to the top, links to lookup and clears the floating chat button',async({page})=>{
 await mount(page,`import Nav from '/src/components/MobileShopNav.jsx';import Chat from '/src/components/ChatButton.jsx';import Top from '/src/components/BackToTop.jsx';import {useLocation} from '/qa/runtime.js';function Route(){const l=useLocation();return R.createElement('output',{'data-testid':'route'},l.pathname+l.search+l.hash)};${render("R.createElement(R.Fragment,null,R.createElement('main',{style:{height:2400}},R.createElement(Top)),R.createElement(Nav),R.createElement(Chat),R.createElement(Route))")}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false,navStyles:{mobile:{afterTicker:false}},chatSettings:{hintEnabled:false}}}',
  'hooks/useCategories.js':categoryMock,
  'hooks/useChatConversation.js':'export default function chat(){return {metadata:{}}}',
 });
 const nav=page.getByRole('navigation',{name:'Điều hướng mobile',exact:true});
 if(page.viewportSize().width>768){await expect(nav).toHaveCount(0);expect(await page.evaluate(()=>document.documentElement.classList.contains('has-mobile-shop-nav'))).toBe(false);return;}
 await expect(nav).toBeVisible();const n=await nav.boundingBox(),chat=await page.locator('.chat-button').boundingBox();expect(n.y+n.height).toBeCloseTo(1000,0);expect(chat.y+chat.height).toBeLessThan(n.y);
 await nav.getByRole('link',{name:'Story',exact:true}).click();await expect(page.getByTestId('route')).toHaveText('/#about');
 await page.evaluate(()=>window.scrollTo(0,500));await nav.getByRole('link',{name:'Trang chủ',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
 const start=await nav.getByRole('link',{name:'Trang chủ',exact:true}).boundingBox(),end=await nav.getByRole('link',{name:'Sản phẩm',exact:true}).boundingBox();await page.mouse.move(start.x+start.width/2,start.y+20);await page.mouse.down();await page.mouse.move(end.x+end.width/2,end.y+20,{steps:8});await expect(nav).toHaveClass(/is-sliding/);await expect(nav.locator('[data-glass-hover]')).toHaveCount(1);await page.mouse.up();await expect(nav.locator('[data-glass-hover]')).toHaveCount(0);await expect(page.getByTestId('route')).toHaveText('/#shop');await page.waitForTimeout(420);
 await nav.getByRole('link',{name:'Tra cứu',exact:true}).click();await expect(page.getByTestId('route')).toHaveText('/tra-cuu-don-hang');
 await page.getByRole('button',{name:'Chat với ORORA',exact:true}).click();await expect(nav).toBeHidden();await page.getByRole('button',{name:'Đóng lựa chọn tư vấn',exact:true}).click();await expect(nav).toBeVisible();await fit(page);
});
const products=Array.from({length:17},(_,i)=>({id:String(i+1),number:String(i+1).padStart(2,'0'),name:i===2?'Dưỡng sáng':`SP ${i+1}`,price:i===16?'Liên hệ':String((i+1)*20000),categoryId:(i+1)%2?'care':'clean',...(i===1?{volumeOptions:[{id:'a',label:'100 ml',price:'100000'},{id:'b',label:'200ml',price:'500000'}]}:{})}));
test('catalog paginates a larger list and filters categories and sorts actual variant prices',async({page})=>{
 await mount(page,`import Collection from '/src/components/Collection.jsx';${render('R.createElement(Collection)')}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false,collectionTitle:"Sản phẩm",collectionStyles:{filters:{pageSize:12}}}}',
  'hooks/useCategories.js':categoryMock,
  'hooks/useProducts.js':`export default function products(){return {products:${JSON.stringify(products)},loading:false}}`,
 });
 await expect(page.locator('.catalog-product-grid > div')).toHaveCount(12);await page.getByRole('button',{name:'Sau',exact:true}).click();await expect(page.locator('.catalog-product-grid > div')).toHaveCount(5);
 const controls=async()=>{await page.getByRole('button',{name:/^Bộ lọc/}).click();return page.getByRole('form',{name:'Bộ lọc',exact:true});};
 const form=await controls();await expect(form.getByRole('spinbutton')).toHaveCount(0);await form.getByRole('combobox',{name:'Danh mục',exact:true}).selectOption('clean');await form.getByRole('combobox',{name:'Sắp xếp',exact:true}).selectOption('priceDesc');await form.getByRole('button',{name:'Áp dụng',exact:true}).click();await expect(page.locator('.catalog-product-grid > div')).toHaveCount(8);await expect(page.locator('.catalog-product-grid > div').first()).toContainText('SP 16');await controls();await form.getByRole('combobox',{name:'Sắp xếp',exact:true}).selectOption('priceAsc');await form.getByRole('button',{name:'Áp dụng',exact:true}).click();await expect(page.locator('.catalog-product-grid > div').first()).toContainText('SP 4');
 await page.getByRole('button',{name:'Xóa bộ lọc',exact:true}).click();await page.getByRole('button',{name:'Dạng trượt',exact:true}).click();await expect(page.getByRole('group',{name:'Chọn sản phẩm',exact:true})).toBeVisible();await fit(page);
});
test('admin can rename, style and disable the mobile bar with a live preview',async({page})=>{
 await mount(page,`import Settings from '/src/admin/builder/MobileNavSettings.jsx';function Fixture(){const [value,setValue]=R.useState({navStyles:{}});return R.createElement(Settings,{navbar:value,onChange:patch=>setValue(old=>({...old,...patch}))})};${render('R.createElement(Fixture)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}','hooks/useCategories.js':categoryMock});
 await page.getByText('Nội dung và giao diện thanh dưới',{exact:true}).click();await page.getByLabel('Tên hiển thị',{exact:true}).first().fill('Về nhà');await expect(page.locator('.mobile-shop-nav.is-preview').getByRole('link',{name:'Về nhà',exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Đi đến',exact:true}).nth(1).selectOption('email');await page.getByRole('combobox',{name:'Biểu tượng',exact:true}).nth(1).selectOption('heart');await expect(page.locator('.mobile-shop-nav.is-preview a').nth(1)).toBeVisible();
 await page.getByRole('checkbox',{name:'Hiện thanh cố định dưới màn hình điện thoại',exact:true}).uncheck();await expect(page.locator('.mobile-shop-nav.is-preview')).toHaveCount(0);await fit(page);
});
