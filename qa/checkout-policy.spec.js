import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {mount,render} from './fixtures';

test('checkout policy opens in its own tab, directly and after reload',async({page})=>{
  const config=JSON.parse(readFileSync('vercel.json','utf8'));
  expect(config.rewrites).toContainEqual({source:'/chinh-sach',destination:'/index.html'});
  await mount(page,`import Order from '/src/components/OrderForm.jsx';${render("R.createElement(Order,{product:{id:'1',name:'SP',price:'100000'},home:{},onClose:()=>{}})")}`);
  const popup=page.waitForEvent('popup');
  await page.getByRole('link',{name:/Chính sách bảo mật/}).click();
  const policy=await popup;
  const heading=policy.getByRole('heading',{name:/Điều khoản, Chính sách/});
  await expect(heading).toBeVisible();
  await policy.goto('/chinh-sach');
  await expect(heading).toBeVisible();
  await policy.reload();
  await expect(heading).toBeVisible();
});

test('shopper applies a code and sees the discount before shipping is known',async({page})=>{
  await page.route('**/api/orders',route=>route.fulfill({json:{code:'THANKS',discount:10000}}));
  await mount(page,`import Order from '/src/components/OrderForm.jsx';${render("R.createElement(Order,{product:{id:'1',name:'SP',price:'100000'},home:{},onClose:()=>{}})")}`);
  await page.getByLabel('Mã quà',{exact:true}).fill('thanks');
  await page.getByRole('button',{name:'Áp dụng'}).click();
  await expect(page.locator('.checkout-gift-saving')).toContainText('−10.000');
  await expect(page.locator('.checkout-total')).toContainText('90.000');
  await page.getByLabel('Mã quà',{exact:true}).fill('');
  await expect(page.locator('.checkout-total')).toContainText('100.000');
});

test('admin creates a fixed-value promotion and can disable it',async({page})=>{
  await mount(page,`import Admin from '/src/admin/PromotionsAdmin.jsx';${render('R.createElement(Admin)')}`,{
    'admin/order-api.js':"const rows=new Map();export async function orderRequest(body){if(body)rows.set(body.code,body); return {promotions:[...rows.values()]};}"
  });
  await page.getByLabel('Mã khách nhập').fill('THANKS');
  await page.getByLabel('Kiểu giảm').selectOption('fixed');
  await page.getByLabel('Mức giảm (đồng)').fill('25000');
  await page.getByRole('button',{name:'Lưu mã'}).click();
  await page.getByRole('button',{name:'THANKS',exact:true}).click();
  await page.getByLabel('Cho phép sử dụng').uncheck();
  await page.getByRole('button',{name:'Lưu mã'}).click();
  await expect(page.locator('.gift-admin-row').filter({hasText:'Đã tắt'})).toBeVisible();
});
