import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('product information shows just the selected tab with keyboard controls and editable admin labels',async({page})=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await mount(page,`import Info from '/src/components/ProductInformation.jsx';import Settings from '/src/admin/builder/InformationTabsSettings.jsx';import Glass from '/src/components/MobileGlass.jsx';import '/src/styles/product-detail.css';function Fixture(){const [settings,setSettings]=R.useState({});return R.createElement(R.Fragment,null,R.createElement(Glass),R.createElement(Settings,{value:settings,onChange:patch=>setSettings(v=>({...v,...patch}))}),R.createElement('main',null,R.createElement(Info,{key:settings.defaultTab||'description',settings,sections:[{id:'d',group:'description',title:'Mô tả',content:'Mô tả sản phẩm đầy đủ.'},{id:'s',group:'specifications',title:'Thành phần',content:'Thông số sản phẩm riêng.'},{id:'u',group:'usage',title:'Hướng dẫn sử dụng',content:'Hướng dẫn dùng sản phẩm.'}],css:()=>({}),select:()=>()=>{},selectedClass:()=>''})))};${render('R.createElement(Fixture)')}`,{'hooks/useHomeContent.js':'export default function home(){return {loading:false}}'});
 const description=page.getByRole('tab',{name:'Mô tả',exact:true}),spec=page.getByRole('tab',{name:'Thông số',exact:true});
 await expect(description).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveCount(1);
 await expect(page.getByText('Thông số sản phẩm riêng.',{exact:true})).toBeHidden();
 await spec.click();await expect(page.getByRole('tabpanel')).toContainText('Thông số sản phẩm riêng.');await expect(page.getByText('Mô tả sản phẩm đầy đủ.',{exact:true})).toBeHidden();
 await spec.press('ArrowRight');await expect(page.getByRole('tab',{name:'Hướng dẫn sử dụng',exact:true})).toBeFocused();await expect(page.getByRole('tabpanel')).toContainText('Hướng dẫn dùng sản phẩm.');
 await page.getByRole('tab',{name:'Hướng dẫn sử dụng',exact:true}).press('Home');await expect(description).toBeFocused();await expect(page.getByRole('tabpanel')).toContainText('Mô tả sản phẩm đầy đủ.');
 await page.getByText('Nhãn tab và mục mở mặc định',{exact:true}).click();await page.getByLabel('Tên tab Mô tả',{exact:true}).fill('Giới thiệu');await expect(page.getByRole('tab',{name:'Giới thiệu',exact:true})).toBeVisible();
 await page.getByLabel('Tab mở mặc định',{exact:true}).selectOption('specifications');await expect(spec).toHaveAttribute('aria-selected','true');await expect(page.getByRole('tabpanel')).toHaveCount(1);
 if(page.viewportSize().width<=768)await expect.poll(()=>page.locator('.product-information-nav').evaluate(el=>parseFloat(el.style.getPropertyValue('--tab-w')))).toBeGreaterThan(0);
 await fit(page);expect(errors).toEqual([]);
});
