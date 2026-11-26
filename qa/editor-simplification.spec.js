import {test,expect} from '@playwright/test';
import {mount,render,fit,reveal} from './fixtures';
const mocks={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':'export const getProducts=async()=>[{id:"p1",name:"Sản phẩm ẩn",active:false}];export const saveCategory=async value=>{window.__category=value};export const explainError=e=>e.message;export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:"ORORA",navStyles:{future:"keep",cart:{copy:{label:"Giỏ cũ"}}},productDetailStyles:{future:"keep",purchaseOptions:{websiteLabel:"Đặt hàng ngay"}},heroTitle:"Tiêu đề ban đầu"});export const saveHomeContent=async value=>{window.__saved=value};',
};
async function editor(page,workspace='home',section='links'){
 await mount(page,`import Editor from '/src/admin/HomeAdmin.jsx';function Fixture(){const [mode,set]=R.useState('${workspace}');const [request,setRequest]=R.useState({section:'${section}',version:0});R.useEffect(()=>{const on=e=>{set('store');setRequest(r=>({section:e.detail.section,version:r.version+1}))};window.addEventListener('orora-admin-store',on);return()=>window.removeEventListener('orora-admin-store',on)},[]);return R.createElement('main',{className:'admin-main'},R.createElement('button',{onClick:()=>set('home')},'Về Trang chủ'),R.createElement(Editor,{workspace:mode,storeSection:request.section,storeVersion:request.version}))};${render('R.createElement(Fixture)')}`,mocks);
 await expect(page.locator('.visual-builder')).toBeVisible();
}
test('contextual search and breadcrumb lead to basic controls with advanced styles retained',async({page},testInfo)=>{
 await editor(page);await expect(page.getByRole('button',{name:/Form cũ/})).toHaveCount(0);
 await page.getByLabel('Tìm mục chỉnh sửa').fill('hero tiêu đề');
 await page.locator('.builder-search-results').getByRole('button',{name:'Hero · Tiêu đề lớn',exact:true}).click();
 await expect(page.getByRole('navigation',{name:'Vị trí đang chỉnh'})).toContainText('Hero');
 await page.screenshot({path:testInfo.outputPath('builder-basic-controls.png'),fullPage:true});
 const font=page.getByLabel('Font',{exact:true});await expect(font).toBeHidden();await reveal(font);await font.selectOption('Georgia');
 await page.getByLabel('Chữ hoa / thường').selectOption('uppercase');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved?.heroStyles?.title?.textTransform)).toBe('uppercase');await fit(page);
});
test('cart and checkout edits live directly in visual builder and preserve unrelated settings',async({page})=>{
 await editor(page);await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();await page.getByLabel('Chữ logo',{exact:true}).fill('Logo mới');
 await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('navCart');
 await page.getByLabel('Tên nút giỏ hàng',{exact:true}).fill('Túi mới');
 await page.locator('.builder-sections').getByRole('button',{name:/Chi tiết SP/}).click();
 await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('pdPurchaseOptions');
 await page.getByText('Nội dung các kênh mua hàng',{exact:true}).click();await page.getByLabel('Nút Mua ngay (kính lỏng)',{exact:true}).fill('Mua tại web');
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();
 await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('navLogo');await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('Logo mới');
 await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('navCart');await expect(page.getByLabel('Tên nút giỏ hàng',{exact:true})).toHaveValue('Túi mới');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navLogo:'Logo mới',navStyles:{cart:{copy:{label:'Túi mới'}}},productDetailStyles:{purchaseOptions:{mobileBuyLabel:'Mua tại web',websiteLabel:'Mua tại web'}}});await fit(page);
});
test('information tabs and purchase channels are separate editable selections',async({page})=>{
 await editor(page);await page.locator('.builder-sections').getByRole('button',{name:/Chi tiết SP/}).click();
 const picker=page.getByLabel('Chọn thành phần cần sửa',{exact:true});await picker.selectOption('pdTabUsage');await page.getByLabel('Tên tab',{exact:true}).fill('Cách dùng mới');
 await picker.selectOption('pdFacebookText');await page.getByLabel('Chữ nút Facebook',{exact:true}).fill('Mua qua Facebook');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({productDetailStyles:{informationTabs:{labels:{usage:'Cách dùng mới'}},purchaseOptions:{facebookLabel:'Mua qua Facebook',customFacebookLabel:true}}});await fit(page);
});

test('store shortcut opens tracking in the shared builder and saves both sections together',async({page})=>{
 await editor(page,'store','tracking');
 const title=page.getByLabel('Tiêu đề trang',{exact:true});
 await title.fill('Tra cứu mới');
 const modes=page.getByRole('group',{name:'Chế độ làm việc'});
 if(await modes.isVisible()) await modes.getByRole('button',{name:'Xem trước',exact:true}).click();
 await page.frameLocator('.builder-preview-frame').getByRole('button',{name:'Mã đơn',exact:true}).click();
 await expect(page.frameLocator('.builder-preview-frame').locator('#preview-lookup-code')).toBeVisible();
 if(await modes.isVisible()) await modes.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();
 const sections=page.locator('.builder-section-item');
 await sections.filter({hasText:'Kênh mua & thanh toán'}).click();
 const link=page.getByLabel('TikTok Shop',{exact:true});
 await link.fill('https://example.com');
 const save=page.getByRole('button',{name:'💾 Lưu tất cả',exact:true});
 await save.click();
 expect(await page.evaluate(()=>window.__saved)).toBeUndefined();
 await link.fill('https://www.tiktok.com/@orora');
 await sections.filter({hasText:'Tra cứu đơn hàng'}).click();
 await expect(title).toHaveValue('Tra cứu mới');
 await save.click();
 await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({orderTrackingText:{title:'Tra cứu mới'},shopLinks:{tiktokUrl:'https://www.tiktok.com/@orora'}});
});

test('shared sections persist their own fields and categories use the catalog writer',async({page})=>{
 await editor(page);
 const open=name=>page.locator('.builder-section-item').filter({hasText:name}).click();
 await open('Chọn theo nhu cầu');
 await page.getByLabel('Tiêu đề',{exact:true}).fill('Nhu cầu mới');
 await open('FAQ sản phẩm');
 await page.getByLabel('Tiêu đề',{exact:true}).fill('Câu hỏi mới');
 await open('Slogan sản phẩm');
 await page.getByLabel('Nội dung Slogan',{exact:true}).fill('Slogan mới');
 await open('Cam kết & chính sách');
 await page.getByLabel('3. Bảo mật thông tin',{exact:true}).fill('Nội dung bảo mật mới');
 await open('Danh mục sản phẩm');
 await page.getByLabel('Tên danh mục mới').fill('Chăm sóc da');
 await page.getByRole('button',{name:'+ Thêm danh mục',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__category?.name)).toBe('Chăm sóc da');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({
  productNeeds:{title:'Nhu cầu mới'},productFaq:{title:'Câu hỏi mới'},
  productSlogan:{text:'Slogan mới'},policyPageContent:{privacyText:'Nội dung bảo mật mới'}
 });
});

test('tracking dimensions and typography update the real preview and saved settings',async({page})=>{
 await editor(page,'store','tracking');
 await page.getByRole('button',{name:'Kiểu chữ & khung'}).click();
 await page.getByLabel('Bo góc thẻ (px)',{exact:true}).fill('31');
 await page.getByLabel('Chiều cao ô nhập / nút (px)',{exact:true}).fill('52');
 await page.getByLabel('Cỡ chữ máy tính (px)',{exact:true}).fill('35');
 const modes=page.getByRole('group',{name:'Chế độ làm việc'});
 if(await modes.isVisible()) await modes.getByRole('button',{name:'Xem trước',exact:true}).click();
 const preview=page.frameLocator('.builder-preview-frame').locator('.order-tracking-page');
 await expect(preview).toHaveCSS('--tracking-radius','31px');
 await expect(preview).toHaveCSS('--tracking-field-height','52px');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__saved?.orderTrackingText?.styles)).toMatchObject({radius:31,fieldHeight:52,text:{title:{fontSize:35}}});
});

test('compact builder switches between editing and preview without losing the draft', async ({page}) => {
 await page.setViewportSize({width:390,height:720});
 await editor(page,'store','tracking');
 const title=page.getByLabel('Tiêu đề trang',{exact:true});
 await title.fill('Tra cứu trên điện thoại');
 const modes=page.getByRole('group',{name:'Chế độ làm việc'});
 await modes.getByRole('button',{name:'Xem trước',exact:true}).click();
 await expect(title).toBeHidden();
 await expect(page.frameLocator('.builder-preview-frame').getByRole('heading',{name:'Tra cứu trên điện thoại',exact:true})).toBeVisible();
 await modes.getByRole('button',{name:'Chỉnh sửa',exact:true}).click();
 await expect(title).toHaveValue('Tra cứu trên điện thoại');
});
