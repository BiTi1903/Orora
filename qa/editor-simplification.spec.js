import {test,expect} from '@playwright/test';
import {mount,render,fit,reveal} from './fixtures';
const mocks={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':'export const explainError=e=>e.message;export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:"ORORA",navStyles:{future:"keep",cart:{copy:{label:"Giỏ cũ"}}},productDetailStyles:{future:"keep",purchaseOptions:{websiteLabel:"Đặt hàng ngay"}},heroTitle:"Tiêu đề ban đầu"});export const saveHomeContent=async value=>{window.__saved=value};',
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

test('tracking draft lives in the store and its own save is isolated',async({page})=>{
 await editor(page,'store','tracking');await expect(page.getByRole('button',{name:'💾 Lưu tất cả',exact:true})).toBeHidden();const title=page.getByLabel('Tiêu đề trang',{exact:true});await title.fill('Tra cứu mới');
 const nav=page.getByRole('navigation',{name:'Thiết lập cửa hàng'});await expect(nav.getByRole('button')).toHaveCount(2);await nav.getByRole('button',{name:'Kênh mua và thanh toán',exact:true}).click();await nav.getByRole('button',{name:'Tra cứu đơn',exact:true}).click();await expect(title).toHaveValue('Tra cứu mới');
 await page.getByRole('button',{name:'Lưu tra cứu',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({orderTrackingText:{title:'Tra cứu mới'}});
 await nav.getByRole('button',{name:'Kênh mua và thanh toán',exact:true}).click();await expect(page.getByLabel('TikTok Shop',{exact:true})).toBeVisible();await expect(page.getByLabel('Facebook fanpage / shop',{exact:true})).toBeVisible();await fit(page);
});
