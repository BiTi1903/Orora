import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';

test('mobile save bar stays reachable, section chips scroll, and a save preserves untouched config',async({page},testInfo)=>{
 await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{
  'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
  'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
  'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({footerInfoTitle:'INFORMATION',futureField:'keep'});export const saveHomeContent=async value=>window.__saved=value;`,
 });
 await page.locator('.builder-sections').getByRole('button',{name:/Hero/}).click();
 await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('title');
 await page.locator('.builder-inspector').getByRole('textbox',{name:'Nội dung',exact:true}).fill('Tiêu đề kiểm tra');
 await expect(page.locator('.builder-save-state')).toContainText('chưa lưu');
 const save=page.getByRole('button',{name:'💾 Lưu tất cả',exact:true});await expect(save).toHaveCount(1);
 if(page.viewportSize().width<=800){
  await page.setViewportSize({width:page.viewportSize().width,height:667});
  const chips=page.locator('.builder-section-list');await expect(chips).toHaveCSS('overflow-x','auto');
  await page.locator('.builder-section-item').last().scrollIntoViewIfNeeded();
  await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  const bar=await page.locator('.builder-toolbar-actions').boundingBox(),button=await save.boundingBox();expect(bar.y+bar.height).toBeCloseTo(667,0);expect(button.y).toBeGreaterThanOrEqual(bar.y);expect(button.y+button.height).toBeLessThanOrEqual(667);
  const root=page.locator('.visual-builder');expect(await root.evaluate(el=>parseFloat(getComputedStyle(el).paddingBottom))).toBeGreaterThanOrEqual(bar.height+15);
 }
 await save.click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({heroTitle:'Tiêu đề kiểm tra'});await expect(page.locator('.builder-save-state')).not.toContainText('chưa lưu');await fit(page);
 await page.screenshot({path:testInfo.outputPath('builder-save-bar.png'),fullPage:false});
});

test('footer links remain above the real bottom navigation at the end of the page',async({page},testInfo)=>{
 await mount(page,`import Footer from '/src/components/Footer.jsx';import Nav from '/src/components/MobileShopNav.jsx';${render("R.createElement(R.Fragment,null,R.createElement('main',null,R.createElement('div',{style:{height:1600}}),R.createElement(Footer)),R.createElement(Nav))")}`,{
  'hooks/useHomeContent.js':`export default function home(){return {loading:false,navStyles:{mobile:{afterTicker:false,height:88}},footerInfoTitle:'INFORMATION',footerAboutText:'About us',footerShopText:'Shop',footerTermsText:'Terms & Conditions',footerPrivacyText:'Privacy Policy',footerCompanyNumber:'Liên kết cuối trang',footerCopyright:'Nội dung tùy chỉnh'}}`,
 });
 await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
 await expect(page.getByText('Thông tin',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Điều khoản sử dụng',exact:true})).toBeVisible();await expect(page.getByText('Nội dung tùy chỉnh')).toBeVisible();
 if(page.viewportSize().width<=768){const nav=page.getByRole('navigation',{name:'Điều hướng mobile',exact:true});await expect(nav).toBeVisible();await page.evaluate(()=>window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));const bar=await nav.boundingBox(),footer=await page.locator('footer').boundingBox();expect(footer.y+footer.height).toBeLessThanOrEqual(bar.y+1);expect(bar.height).toBeGreaterThanOrEqual(88);}
 await fit(page);await page.screenshot({path:testInfo.outputPath('footer-bottom-navigation.png')});
});

test('hero secondary styling reaches the live button and warns about a low contrast draft',async({page})=>{
 await mount(page,`import Hero from '/src/components/Hero.jsx';import {HeroSettings} from '/src/admin/builder/HeroPanels.jsx';function Fixture(){const [hero,setHero]=R.useState({shopButtonText:'Xem sản phẩm',heroStyles:{btnSecondary:{color:'#eeeeee',backgroundColor:'#ffffff',borderColor:'#123456',borderRadius:16}}});return R.createElement(R.Fragment,null,R.createElement('section',{className:'visual-builder'},R.createElement(HeroSettings,{hero,selected:'btnSecondary',data:{type:'heroButton',meta:{textKey:'shopButtonText',linkKey:'shopButtonLink',label:'Nút phụ'}},onChange:patch=>setHero(v=>({...v,...patch}))})),R.createElement(Hero,{preview:true,previewData:hero}));};${render('R.createElement(Fixture)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 await expect(page.getByRole('alert')).toContainText('Dưới 4,5:1');await expect(page.locator('.hero-btn-ghost')).toHaveCSS('background-color','rgb(255, 255, 255)');await expect(page.locator('.hero-btn-ghost')).toHaveCSS('border-radius','16px');
});

test('mobile card settings change the same layout and typography used on the website',async({page})=>{
 test.skip(page.viewportSize().width>768,'Mobile layout settings');
 await mount(page,`import Card from '/src/components/ProductCard.jsx';import Settings from '/src/admin/builder/MobileCardSettings.jsx';function Fixture(){const [mobileActions,set]=R.useState({});return R.createElement(R.Fragment,null,R.createElement('section',{className:'visual-builder'},R.createElement(Settings,{value:mobileActions,onChange:patch=>set(v=>({...v,...patch}))})),R.createElement('section',{className:'collection'},R.createElement(Card,{productId:'sample',name:'Sản phẩm mẫu',number:'01',price:'100000',styles:{mobileActions,price:{mobileFontSize:18}}})));};${render('R.createElement(Fixture)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 const price=page.locator('.product-price'),cart=page.locator('.card-cart-button');await expect(price).toHaveCSS('font-size','18px');await page.getByLabel('Cỡ giá trên điện thoại (px)',{exact:true}).fill('20');await expect(price).toHaveCSS('font-size','20px');await page.getByRole('combobox',{name:'Căn giá trên điện thoại',exact:true}).selectOption('right');await expect(price).toHaveCSS('text-align','right');
 await page.getByRole('combobox',{name:'Bố cục giá và giỏ',exact:true}).selectOption('stacked');const p=await price.boundingBox(),c=await cart.boundingBox();expect(c.y).toBeGreaterThanOrEqual(p.y+p.height+7);await fit(page);
});
