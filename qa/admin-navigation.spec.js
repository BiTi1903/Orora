import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('grouped admin keeps drafts and all navigation reachable on short screens',async({page})=>{
 await page.setViewportSize({width:page.viewportSize().width,height:600});
 const modules={
  'lib/firebaseAuth.js':'export const auth={};export function onAuthStateChanged(auth,callback){callback({uid:"test-admin-uid",email:"admin@example.test"});return ()=>{}}export function signOut(){window.__signedOut=true;}',
  'lib/api.js':'export const getProducts=async()=>[];export const explainError=()=>"Lỗi thử";',
  'admin/useOrderNotifications.js':'export default function notifications(){return {snapshot:{pendingCount:7},refresh(){},dismiss(){}}}',
  'admin/newsletter-api.js':'export const newsletterRequest=async()=>({});',
  'admin/order-api.js':'export const orderRequest=async()=>({ok:true,permissions:{orders:true,newsletter:true,full:true}});',
 };
 modules['admin/HomeAdmin.jsx']='import {R} from "/qa/runtime.js";import useDraftGuard from "/src/hooks/useDraftGuard.js";const {createElement,useState}=R;export default function Home(){const [value,set]=useState("");useDraftGuard(value);return createElement("label",null,"Bản nhập thử",createElement("input",{value,onChange:e=>set(e.target.value)}))}';
 for(const name of ['AdminLogin','ProductsAdmin','OrdersAdmin','NewsletterAdmin','InventoryAdmin','ShippingAdmin','ChatSettings','EmailExport','AnalyticsDashboard'])modules[`admin/${name}.jsx`]='export default function Panel(){return null}';
 await mount(page,`import Admin from '/src/admin/AdminApp.jsx';${render('R.createElement(Admin)')}`,modules);
 const nav=page.getByRole('navigation',{name:'Menu quản trị'});await expect(nav.getByRole('button')).toHaveCount(10);
 await expect(page.getByText('Đơn chờ xác nhận',{exact:true})).toBeVisible();
 await expect(page.locator('.admin-stat').filter({hasText:'Đơn chờ xác nhận'}).locator('strong')).toHaveText('7');
 await nav.getByRole('button',{name:'Trang chủ',exact:true}).click();await expect(page.getByLabel('Bản nhập thử')).toBeVisible();
 const draft=page.getByLabel('Bản nhập thử');
 await draft.fill('Nội dung đang soạn');
 await page.evaluate(()=>window.dispatchEvent(new CustomEvent('orora-admin-store',{detail:{section:'links'}})));
 await page.goBack();
 await expect(nav.getByRole('button',{name:'Trang chủ',exact:true})).toHaveAttribute('aria-current','page');
 await expect(draft).toHaveValue('Nội dung đang soạn');
 await page.goForward();
 await expect(nav.getByRole('button',{name:'Trang chủ',exact:true})).toHaveAttribute('aria-current','page');
 await expect(draft).toHaveValue('Nội dung đang soạn');
 await draft.fill('');
 await nav.getByRole('button',{name:'Thống kê',exact:true}).click();await expect(page.getByRole('heading',{name:'Thống kê',exact:true})).toBeVisible();
 await nav.getByRole('button',{name:'Xuất danh sách email',exact:true}).click();await page.getByText('Mã tài khoản (UID)',{exact:true}).click();await expect(page.getByText('test-admin-uid',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).scrollIntoViewIfNeeded();const box=await page.getByRole('button',{name:'Đăng xuất',exact:true}).boundingBox();expect(box.y+box.height).toBeLessThanOrEqual(601);
 await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__signedOut)).toBe(true);
 await fit(page);
});
