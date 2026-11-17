import {test,expect} from '@playwright/test';
import {mount,render,reveal,fit} from './fixtures';

test('petal counts adapt by viewport, speed changes smoothly without replacing nodes, and reduced motion hides them',async({page})=>{
 await mount(page,`import Petals from '/src/components/Petals.jsx';function Fixture(){const [speed,set]=R.useState(1);return R.createElement(R.Fragment,null,R.createElement('button',{onClick:()=>set(2)},'Nhanh hơn'),R.createElement(Petals,{settings:{count:8,mobileCount:3,speed}}));};${render('R.createElement(Fixture)')}`);
 const petals=page.locator('.petal');await expect(petals).toHaveCount(8);await expect(page.locator('.petal:visible')).toHaveCount(page.viewportSize().width<=768?3:8);await expect(petals.first()).toHaveCSS('animation-duration','20s');await expect(page.locator('.petals')).toHaveCSS('pointer-events','none');
 await petals.first().evaluate(node=>window.__originalPetal=node);await page.getByRole('button',{name:'Nhanh hơn',exact:true}).click();await expect(petals.first()).toHaveCSS('animation-duration','10s');expect(await petals.first().evaluate(node=>node===window.__originalPetal)).toBe(true);
 await page.emulateMedia({reducedMotion:'reduce'});await expect(page.locator('.petals')).toBeHidden();await fit(page);
});

test('builder previews petals and icon changes and saves only their changed leaves',async({page},testInfo)=>{
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
  'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({navStyles:{surfaces:{blur:18,petals:{color:'#123456',future:'keep'},buttonIcons:{heroPrimary:{kind:'external',future:'keep'}}}}});export const saveHomeContent=async patch=>window.__saved=patch;`,
 });
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();await page.getByRole('tab',{name:'Thiết lập mục',exact:true}).click();await page.getByText('Hiệu ứng, cánh hoa và icon nút',{exact:true}).click();
 const count=page.getByLabel('Số cánh hoa trên desktop',{exact:true});await reveal(count);await count.fill('18');await page.getByLabel('Số cánh hoa trên điện thoại',{exact:true}).fill('6');await page.getByLabel('Tốc độ rơi (1 = mặc định)',{exact:true}).fill('2');
 await expect(page.locator('.petal-settings-preview .petal:visible')).toHaveCount(page.viewportSize().width<=768?6:18);await expect(page.locator('.petal-settings-preview .petal').first()).toHaveCSS('animation-duration','10s');
 if(page.viewportSize().width===390)await page.locator('.petal-settings-preview').locator('xpath=ancestor::*[contains(@class,"builder-setting-group")][1]').screenshot({path:testInfo.outputPath('petal-controls.png')});
 await page.getByRole('switch',{name:'Hiện cánh hoa rơi',exact:true}).uncheck();await expect(page.locator('.petal-settings-preview .petal')).toHaveCount(0);
 const iconType=page.getByRole('combobox',{name:'Kiểu icon',exact:true});await reveal(iconType);await iconType.selectOption('heart');await page.getByLabel('Kích thước icon (px)',{exact:true}).fill('24');await page.getByLabel('Màu icon',{exact:true}).fill('#234567');
 if(page.viewportSize().width===390)await iconType.locator('xpath=ancestor::*[contains(@class,"builder-setting-group")][1]').screenshot({path:testInfo.outputPath('icon-controls.png')});
 await page.locator('.builder-sections').getByRole('button',{name:/Hero/}).click();const icon=page.frameLocator('iframe').locator('[data-button-icon=heroPrimary]');await expect(icon).toHaveCSS('width','24px');await expect(icon).toHaveCSS('color','rgb(35, 69, 103)');await expect(icon.locator('svg')).toHaveCount(1);
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navStyles:{surfaces:{petals:{count:18,mobileCount:6,speed:2,enabled:false},buttonIcons:{heroPrimary:{kind:'heart',size:24,color:'#234567'}}}}});await fit(page);
 if([390,1440].includes(page.viewportSize().width))await page.screenshot({path:testInfo.outputPath('icon-preview.png')});
});

test('custom icons keep real card actions and preserve an icon-only cart when hiding is requested',async({page})=>{
 await mount(page,`import Card from '/src/components/ProductCard.jsx';import {ButtonIconProvider} from '/src/components/ButtonIcon.jsx';${render("R.createElement(ButtonIconProvider,{value:{productView:{kind:'none'},productCart:{kind:'none'}}},R.createElement('section',{className:'collection'},R.createElement(Card,{productId:'sample',name:'Sản phẩm mẫu',price:'100000',slug:'san-pham-mau'})))")}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 await expect(page.locator('[data-button-icon=productView]')).toHaveCount(0);await expect(page.getByRole('link',{name:'Xem',exact:true})).toHaveAttribute('href','/product/san-pham-mau');await expect(page.locator('[data-button-icon=productCart] svg')).toHaveCount(1);
 await page.evaluate(()=>window.addEventListener('orora-cart-add',e=>window.__cartAdded=e.detail));await page.getByRole('button',{name:'Thêm vào giỏ',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__cartAdded?.id)).toBe('sample');await fit(page);
});

test('tracking and purchase icons share custom styles without changing button labels or brand defaults',async({page})=>{
 await mount(page,`import Icon,{ButtonIconProvider} from '/src/components/ButtonIcon.jsx';import Search from '/src/components/OrderTrackingSearch.jsx';import {trackingCopy} from '/src/lib/order-tracking-copy';${render("R.createElement(ButtonIconProvider,{value:{trackingSubmit:{kind:'none'},trackingContact:{kind:'heart',size:28,color:'#123456'}}},R.createElement('main',null,R.createElement('button',null,R.createElement(Icon,{name:'facebook'}),'Facebook'),R.createElement('button',null,R.createElement(Icon,{name:'tiktok'}),'TikTok'),R.createElement(Search,{copy:trackingCopy(),mode:'phone',phone:'',code:'',onMode:()=>{},onPhone:()=>{},onCode:()=>{},preview:true})))")}`);
 await expect(page.locator('[data-button-icon=trackingSubmit]')).toHaveCount(0);await expect(page.locator('.order-tracking-submit')).toHaveText('Tra cứu');await expect(page.locator('.order-tracking-submit > span')).not.toHaveCSS('font-size','20px');await page.locator('.order-tracking-guide > summary').click();const contact=page.locator('[data-button-icon=trackingContact]');await expect(contact).toHaveCSS('color','rgb(18, 52, 86)');await expect(contact.locator('svg')).toHaveCSS('width','28px');
 await expect(page.locator('[data-button-icon=facebook] svg')).toHaveAttribute('fill','currentColor');await expect(page.locator('[data-button-icon=tiktok] svg')).toHaveAttribute('fill','currentColor');await fit(page);
});
