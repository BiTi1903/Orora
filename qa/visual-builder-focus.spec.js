import {test,expect} from '@playwright/test';
import {mount,render,fit,reveal} from './fixtures';
const mocks={
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
};
async function builder(page,api){
 await mount(page,`import Builder from '/qa/BuilderHarness.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{...mocks,'lib/api.js':api||`export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA',navStyles:{cart:{copy:{label:'Giỏ hàng'},future:'keep'}}});export const saveHomeContent=async value=>window.__saved=value;`});
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();
}
test('direct element picker opens one group and keeps edits when switching elements',async({page},testInfo)=>{
 await builder(page);const picker=page.getByLabel('Chọn thành phần cần sửa',{exact:true});
 await expect(picker).toHaveValue('navLogo');await expect(page.locator('[data-compact-setting][open]')).toHaveCount(1);
 await page.getByLabel('Chữ logo',{exact:true}).fill('ORORA MỚI');
 await picker.selectOption('navCart');await page.getByLabel('Tên nút giỏ hàng',{exact:true}).fill('Túi đồ');
 await expect(page.getByLabel('Bo góc nút (px)',{exact:true})).toBeHidden();await page.getByText('Khung và kiểu chữ nút navbar',{exact:true}).click();await expect(page.getByLabel('Bo góc nút (px)',{exact:true})).toBeVisible();
 await picker.selectOption('navLogo');await expect(page.getByLabel('Chữ logo',{exact:true})).toHaveValue('ORORA MỚI');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navLogo:'ORORA MỚI',navStyles:{cart:{copy:{label:'Túi đồ'}}}});
 await fit(page);await page.screenshot({path:testInfo.outputPath('focused-editor.png'),fullPage:true});
});
test('save state remains dirty after failure and when new edits arrive during acknowledgment',async({page})=>{
 await builder(page,`export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA'});export const saveHomeContent=async value=>{window.__calls=(window.__calls||0)+1;if(window.__calls===1)throw new Error('Lỗi lưu thử');if(window.__calls===2)return new Promise(resolve=>window.__ack=resolve);window.__saved=value;};`);
 const input=page.getByLabel('Chữ logo',{exact:true}),save=page.getByRole('button',{name:'💾 Lưu tất cả',exact:true});
 await input.fill('Bản nhập A');await expect(page.getByRole('status')).toHaveText('Có thay đổi chưa lưu');await save.click();await expect(page.getByText('Lỗi lưu thử',{exact:true})).toBeVisible();await expect(input).toHaveValue('Bản nhập A');await expect(page.getByRole('status')).toHaveText('Có thay đổi chưa lưu');
 await save.click();await page.waitForFunction(()=>window.__ack);await input.fill('Bản nhập B');await page.evaluate(()=>window.__ack());await expect(page.getByRole('status')).toHaveText('Có thay đổi chưa lưu');await save.click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({navLogo:'Bản nhập B'});await expect(page.getByRole('status')).toHaveText('Các thay đổi đã được lưu');
});
test('element picker reaches price styles and full-size preview stays inside its viewport',async({page},testInfo)=>{
 await builder(page);await page.locator('.builder-sections').getByRole('button',{name:/Chi tiết SP/}).click();
 await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('pdPrice');await expect(page.locator('[data-compact-setting][open]')).toHaveCount(1);
 await reveal(page.getByLabel('Cỡ chữ desktop',{exact:true}));await page.getByLabel('Cỡ chữ desktop',{exact:true}).selectOption('18');
 await expect(page.frameLocator('iframe').locator('[data-builder-key="pdPrice"]')).toHaveCSS('font-size','18px');
 await page.getByLabel('Tỉ lệ xem trước',{exact:true}).selectOption('actual');await expect(page.locator('iframe')).toHaveCSS('transform','matrix(1, 0, 0, 1, 0, 0)');await fit(page);
 await page.getByLabel('Tỉ lệ xem trước',{exact:true}).selectOption('fit');await fit(page);await page.screenshot({path:testInfo.outputPath('price-editor.png'),fullPage:true});
});
