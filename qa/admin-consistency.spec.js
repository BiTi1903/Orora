import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';
const errors=new WeakMap();
test.beforeEach(({page})=>{const list=[];errors.set(page,list);page.on('pageerror',error=>list.push(error.message));});
test.afterEach(({page})=>expect(errors.get(page)).toEqual([]));

test('builder keeps saved navigation settings and saves only the edited leaf',async({page})=>{
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
  'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA',navStyles:{mobile:{enabled:false},cart:{enabled:false},drawer:{widthPercent:45},surfaces:{chatPanelWidth:310,frames:false,rimOpacity:.65}}});export const saveHomeContent=async value=>{window.__saved=value};`,
 });
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();
 await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();
 await page.locator('.inspector-group > summary').filter({hasText:'Thanh điều hướng dưới — mobile'}).click();

 await page.getByText('Hiệu ứng, cánh hoa và icon nút',{exact:true}).click();
 await page.locator('.inspector-group > summary').filter({hasText:'Menu bên — mobile'}).click();
 await expect(page.getByLabel('Hiện điều hướng trên điện thoại')).not.toBeChecked();
 await expect(page.frameLocator('iframe').getByRole('button',{name:'Giỏ hàng',exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Chiều rộng khung chat AI (px)',{exact:true})).toHaveValue('310');
 await expect(page.getByLabel('Chiều rộng menu (% màn hình)',{exact:true})).toHaveValue('45');
 await page.getByLabel('Chiều rộng khung chat AI (px)',{exact:true}).fill('320');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navStyles:{surfaces:{chatPanelWidth:320}}});
});

test('mobile iframe previews use their own viewport and the same glass configuration',async({page})=>{
 await mount(page,`import Frame from '/src/admin/builder/PreviewFrame.jsx';import Collection from '/src/components/Collection.jsx';function Fixture(){const [glass,setGlass]=R.useState(true);return R.createElement(R.Fragment,null,R.createElement('button',{onClick:()=>setGlass(false)},'Tắt kính preview'),R.createElement(Frame,{device:'mobile',surfaces:{buttons:glass,rims:glass,opacity:85}},R.createElement('a',{className:'hero-btn hero-btn-primary'},'Khám phá'),R.createElement(Collection,{preview:true,previewData:{collectionTitle:'Sản phẩm'},sampleProducts:[1,2,3].map(i=>({id:String(i),name:'Sản phẩm '+i,price:'100000'}))})))};${render('R.createElement(Fixture)')}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 });
 const frame=page.frameLocator('iframe');
 await expect(frame.locator('html')).toHaveAttribute('data-glass-buttons','');
 await expect(frame.locator('.hero-btn')).toHaveCSS('background-image',/linear-gradient/);
 await expect(frame.locator('.gallery-slide:not([inert])')).toHaveCount(2);
 expect(await page.locator('html').getAttribute('data-glass-buttons')).toBeNull();
 await page.getByRole('button',{name:'Tắt kính preview'}).click();
 await expect(frame.locator('html')).not.toHaveAttribute('data-glass-buttons','');
 await expect(frame.locator('html')).not.toHaveAttribute('data-glass-rims','');
 if(page.viewportSize().width===1440)await page.screenshot({path:'/tmp/orora-builder-mobile-audit.png',fullPage:true});
});

test('lookup guidance typography respects admin settings',async({page})=>{
 await mount(page,`import Search from '/src/components/OrderTrackingSearch.jsx';import {trackingCopy} from '/src/lib/order-tracking-copy.js';import '/src/styles/product-detail.css';${render("R.createElement(Search,{copy:trackingCopy(),styles:{text:{modeBody:{fontSize:19,lineHeight:1.8,color:'#123456'}}},mode:'phone',code:'',phone:'',preview:true,onMode:()=>{},onCode:()=>{},onPhone:()=>{}})")}`);
 await expect(page.locator('.order-tracking-mode-hint')).toHaveCSS('font-size','19px');
 await expect(page.locator('.order-tracking-mode-hint')).toHaveCSS('color','rgb(18, 52, 86)');
});
