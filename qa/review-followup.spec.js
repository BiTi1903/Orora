import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';

test('customer email search keeps focus during a pending request',async({page})=>{
 await mount(page,`import Customers from '/src/admin/OrderCustomers.jsx';${render('R.createElement(Customers)')}`,{
  'admin/order-api.js':'export async function orderRequest(_,params){if(params.customerEmail){window.searchStarted=true;await new Promise(resolve=>window.finishSearch=resolve)}return {orders:[]}}',
 });
 const input=page.getByLabel('Tìm khách hàng theo email hoặc tên');
 await input.fill('khach@example.c');
 await expect.poll(()=>page.evaluate(()=>window.searchStarted)).toBe(true);
 await expect(input).toBeFocused();
 await input.press('End');
 await input.pressSequentially('om');
 await expect(input).toHaveValue('khach@example.com');
});

test('priced checkout preview shows a selected address and a quoted fee',async({page})=>{
 await mount(page,`import Preview from '/src/components/OrderFormPreview.jsx';${render('R.createElement(Preview)')}`,{
  'hooks/useHomeContent.js':'export default ()=>({})',
 });
 await page.getByRole('combobox',{name:'Giao hàng',exact:true}).selectOption('priced');
 await expect(page.getByRole('combobox',{name:'Tỉnh / Thành phố'})).toHaveValue('Hà Nội');
 await expect(page.locator('.order-summary').filter({hasText:'Phí giao hàng'})).toContainText('25.000');
 await expect(page.getByText('Chọn địa chỉ để tính phí giao hàng.',{exact:true})).toHaveCount(0);
});

for(const custom of [false,true]){
 test('policy displays '+(custom?'saved return terms':'existing seven-day terms'),async({page})=>{
  const policies=custom?[{kind:'returns',title:'Đổi trả',content:'Đổi trả trong 14 ngày.'}]:[];
  await mount(page,`import Policy from '/src/components/PolicyPage.jsx';${render('R.createElement(Policy)')}`,{
   'hooks/useHomeContent.js':`export default ()=>({productPolicies:${JSON.stringify(policies)}})`,
  });
  await expect(page.locator('#doi-tra')).toContainText(custom?'14 ngày':'7 ngày');
 });
}
