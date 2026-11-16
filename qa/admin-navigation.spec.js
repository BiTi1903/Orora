import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('grouped admin keeps drafts and all navigation reachable on short screens',async({page})=>{
 await page.setViewportSize({width:page.viewportSize().width,height:600});
 const modules={
  'lib/firebaseAuth.js':'export const auth={};export function onAuthStateChanged(auth,callback){callback({uid:"test-admin-uid",email:"admin@example.test"});return ()=>{}}export function signOut(){window.__signedOut=true;}',
  'lib/api.js':'export const getProducts=async()=>[];export const explainError=()=>"Lỗi thử";',
  'admin/useOrderNotifications.js':'export default function notifications(){return {snapshot:{pendingCount:7},refresh(){},dismiss(){}}}',
  'admin/newsletter-api.js':'export const newsletterRequest=async()=>({});',
 };
 modules['admin/HomeAdmin.jsx']='import {R} from "/qa/runtime.js";const {createElement,useState}=R;export default function Home(){const [value,set]=useState("");return createElement("label",null,"Bản nhập thử",createElement("input",{value,onChange:e=>set(e.target.value)}))}';
 for(const name of ['AdminLogin','ProductsAdmin','OrdersAdmin','NewsletterAdmin','InventoryAdmin','ShippingAdmin','ChatSettings','EmailExport','AnalyticsDashboard'])modules[`admin/${name}.jsx`]='export default function Panel(){return null}';
 await mount(page,`import Admin from '/src/admin/AdminApp.jsx';${render('R.createElement(Admin)')}`,modules);
 const nav=page.getByRole('navigation',{name:'Menu quản trị'});await expect(nav.getByRole('button')).toHaveCount(9);
 await expect(page.getByText('Đơn chờ xác nhận',{exact:true})).toBeVisible();
 await expect(page.locator('.admin-stat').filter({hasText:'Đơn chờ xác nhận'}).locator('strong')).toHaveText('7');
 await nav.getByRole('button',{name:'Trang chủ',exact:true}).click();await page.getByLabel('Bản nhập thử').fill('Giữ bản nhập');
 await nav.getByRole('button',{name:'Sản phẩm',exact:true}).click();await nav.getByRole('button',{name:'Trang chủ',exact:true}).click();await expect(page.getByLabel('Bản nhập thử')).toHaveValue('Giữ bản nhập');
 await nav.getByRole('button',{name:'Xuất danh sách email',exact:true}).click();await page.getByText('Mã tài khoản (UID)',{exact:true}).click();await expect(page.getByText('test-admin-uid',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).scrollIntoViewIfNeeded();const box=await page.getByRole('button',{name:'Đăng xuất',exact:true}).boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(601);
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__signedOut)).toBe(true);
 await fit(page);
});
