import {test,expect} from '@playwright/test';
import {mount,render,reveal,fit} from './fixtures';
async function builder(page){await mount(page,`import Builder from '/src/admin/builder/VisualBuilder.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,{
 'hooks/useHomeContent.js':'export default function home(){return {loading:false}}',
 'hooks/useProducts.js':'export default function products(){return {products:[],loading:false}}',
 'hooks/useCategories.js':'export default function categories(){return {categories:[]}}',
 'lib/api.js':`export const getProduct=async()=>null;export const getHomeContent=async()=>({heroStyles:{title:{paddingRight:17,marginLeft:7,futureField:true}}});export const saveHomeContent=async value=>window.__saved=value;`,
});await page.locator('.builder-sections').getByRole('button',{name:/Hero/}).click();await page.getByLabel('Chọn thành phần cần sửa',{exact:true}).selectOption('title');}
test('all eight spacing controls retain drafts, render in preview and save only changed leaves',async({page},testInfo)=>{
 await builder(page);const side=page.getByLabel('Padding phải',{exact:true});await reveal(side);await expect(side).toHaveValue('17');await expect(page.getByLabel('Margin trái',{exact:true})).toHaveValue('7');
 const values={'Margin trên':4,'Margin phải':-8,'Margin dưới':8,'Margin trái':16,'Padding trên':12,'Padding phải':24,'Padding dưới':16,'Padding trái':12};
 for(const [name,value] of Object.entries(values))await page.getByLabel(name,{exact:true}).selectOption(String(value));
 const title=page.frameLocator('iframe').locator('[data-builder-key=title]');await expect(title).toHaveCSS('padding-right','24px');await expect(title).toHaveCSS('padding-left','12px');await expect(title).toHaveCSS('margin-right','-8px');await expect(title).toHaveCSS('margin-left','16px');
 await page.locator('.builder-sections').getByRole('button',{name:/Navbar/}).click();await page.locator('.builder-sections').getByRole('button',{name:/Hero/}).click();await expect(side).toHaveValue('24');
 await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({heroStyles:{title:{marginTop:4,marginRight:-8,marginBottom:8,marginLeft:16,paddingTop:12,paddingRight:24,paddingBottom:16,paddingLeft:12}}});await fit(page);
 if(page.viewportSize().width===1440)await page.screenshot({path:testInfo.outputPath('builder-spacing.png'),fullPage:true});
});
test('section visibility has a readable state and saves just the selected section',async({page})=>{
 await builder(page);const toggle=page.getByRole('switch',{name:'Hiển thị Hero trên website',exact:true});await expect(toggle).toHaveText('Đang hiện');await toggle.click();await expect(toggle).toHaveAttribute('aria-checked','false');await expect(toggle).toHaveText('Đang ẩn');await page.getByRole('button',{name:'💾 Lưu tất cả',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__saved)).toEqual({sectionVisibility:{hero:false}});await fit(page);
});
