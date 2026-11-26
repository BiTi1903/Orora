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
