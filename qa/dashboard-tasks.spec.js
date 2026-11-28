import {test,expect} from '@playwright/test';
import {mount,render} from './fixtures';

test('dashboard separates ten new orders from twenty earlier mail issues and opens the affected order', async ({page}) => {
  await mount(page, `import Tasks from '/src/admin/TodayTasks.jsx';
    ${render("R.createElement(Tasks,{onOpenOrder:id=>window.openedOrder=id})")}`, {
    'admin/order-api.js': `export async function orderRequest(_, params) {
      if (!params.status && !params.mailReview) return {orders:[]};
      if (params.status === 'new') return { orders:Array.from({length:10},(_,i)=>({id:'new'+i,code:'NEW'+i,createdAt:Date.now()})) };
      return {rows:Array.from({length:20},(_,i)=>({id:'event'+i,orderId:'older'+i,code:'OLD'+i,eventId:'status-shipping',state:'failed',issueAt:Date.now()-86400000}))};
    }`,
  });
  await expect(page.getByRole('heading',{name:/Hôm nay .*10 đơn/})).toBeVisible();
  await expect(page.getByRole('heading',{name:/Hôm qua .*20 thư/})).toBeVisible();
  await expect(page.getByText('Thư đang giao · Gửi thất bại')).toHaveCount(20);
  await page.getByRole('button',{name:'OLD19',exact:true}).click();
  expect(await page.evaluate(()=>window.openedOrder)).toBe('older19');
});
