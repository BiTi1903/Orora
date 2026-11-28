import { test, expect } from '@playwright/test';
import { mount, render } from './fixtures';

test('admin confirmation cancels with Escape and returns focus before allowing a new confirmation', async ({ page }) => {
  await mount(page, `
    import '/src/styles/admin.css';
    import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
    import {useConfirm} from '/src/admin/confirm-context.js';
    function Example() {
      const confirm = useConfirm();
      const [result, setResult] = R.useState('');
      return R.createElement(R.Fragment, null,
        R.createElement('button', { onClick: async () => setResult(await confirm('Xóa mục này?', { title: 'Xóa sản phẩm', confirmLabel: 'Xóa', danger: true }) ? 'Đã xác nhận' : 'Đã hủy') }, 'Mở xác nhận'),
        R.createElement('output', null, result));
    }
    ${render('R.createElement(ConfirmProvider, null, R.createElement(Example))')}`);
  const trigger = page.getByRole('button', { name: 'Mở xác nhận' });
  const dialog = page.getByRole('dialog', { name: 'Xóa sản phẩm' });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Hủy' })).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Xóa', exact: true })).toHaveCSS('background-color', 'rgb(154, 51, 88)');
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Đã hủy');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: 'Xóa', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đã xác nhận');
});

test('custom chat typography keeps a 16px minimum on mobile and a visible keyboard focus ring', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mount(page, `
    import '/src/styles/chat-button.css';
    ${render("R.createElement('div',{className:'orora-chat-panel is-compact',style:{'--chat-input-font-size':'14px','--chat-input-mobile-size':'12px','--chat-followups-font-size':'14px','--chat-followups-mobile-size':'18px'}},R.createElement('div',{className:'orora-chat-composer'},R.createElement('textarea',{'aria-label':'Tin nhắn'})),R.createElement('div',{className:'orora-chat-followups'},R.createElement('button',null,'Gợi ý tiếp theo')))")}`);
  const input = page.getByRole('textbox', { name: 'Tin nhắn' });
  await expect(input).toHaveCSS('font-size', '16px');
  await expect(page.getByRole('button', { name: 'Gợi ý tiếp theo' })).toHaveCSS('font-size', '18px');
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  expect(await input.evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth))).toBeGreaterThanOrEqual(2);
  await expect(input).toHaveCSS('outline-style', 'solid');
});

test('confirmation outside a provider warns in development and resolves as cancelled', async ({ page }) => {
  const warning = page.waitForEvent('console', {
    predicate: (message) => message.type() === 'warning' && message.text().includes('missing ConfirmProvider'),
  });
  await mount(page, `
    import {useConfirm} from '/src/admin/confirm-context.js';
    function Example() {
      const confirm = useConfirm();
      const [result, setResult] = R.useState('');
      return R.createElement('button', {
        onClick: async () => setResult(await confirm('Xóa?') ? 'Đã xác nhận' : 'Đã hủy')
      }, result || 'Mở xác nhận');
    }
    ${render('R.createElement(Example)')}`);
  await page.getByRole('button', { name: 'Mở xác nhận' }).click();
  await expect(page.getByRole('button', { name: 'Đã hủy' })).toBeVisible();
  await warning;
});

test('recoverOnly refreshes the selected order when the server returns unchanged', async ({ page }) => {
  const order = { id: 'test-order', code: 'OW_TEST', customer: { name: 'Khách thử', email: 'test@example.test' } };
  let recoveryRequest;
  let detailReads = 0;
  await page.route('**/api/admin-orders**', (route) => {
    if (route.request().method() === 'POST') {
      recoveryRequest = route.request().postDataJSON();
      return route.fulfill({ json: { state: 'unchanged', message: 'Trạng thái đã thay đổi.' } });
    }
    if (new URL(route.request().url()).searchParams.has('id')) {
      detailReads++;
      return route.fulfill({ json: { order: { ...order, confirmationMail: { state: 'accepted' } } } });
    }
    return route.fulfill({ json: { orders: [{ ...order, confirmationMail: { state: 'sending', updatedAt: 1000 } }] } });
  });
  await mount(page, `
    import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
    import MailWriter from '/src/admin/MailWriter.jsx';
    ${render("R.createElement(ConfirmProvider, null, R.createElement(MailWriter, {mode:'order_auto',purpose:'send',value:{subject:'Thử',text:'Nội dung'}}))")}`, {
    'lib/firebaseAuth.js': 'export const auth={currentUser:{getIdToken:async()=>"fixture-token"}};',
  });
  await page.getByLabel('Chọn đơn hàng').selectOption(order.id);
  await expect(page.getByText(/Cần kiểm tra/)).toBeVisible();
  await page.getByRole('button', { name: 'Cập nhật trạng thái gửi' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cập nhật trạng thái', exact: true }).click();
  await expect(page.getByText('Trạng thái đã thay đổi.')).toBeVisible();
  await expect(page.getByText(/test@example\.test · Đã gửi đi/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cập nhật trạng thái gửi' })).toHaveCount(0);
  expect(recoveryRequest).toMatchObject({ id: order.id, recoverOnly: true });
  expect(detailReads).toBe(1);
});

test('mail writer previews frame edits and saves them with the welcome template', async ({ page }) => {
  await mount(page, `
    import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
    import MailWriter from '/src/admin/MailWriter.jsx';
    function Editor() {
      const [value, onChange] = R.useState({subject:'ORORA',text:'Xin chào'});
      return R.createElement(MailWriter, {mode:'welcome_auto',purpose:'automation',allowedModes:['welcome_auto'],
        value,onChange,onApply:async (_mode,message) => { window.savedMail = message; }});
    }
    ${render("R.createElement(ConfirmProvider,null,R.createElement(Editor))")}`, {
    'hooks/useHomeContent.js': 'export default function useHomeContent(){return {}}',
  });
  await page.getByText('Khung và màu email', { exact:true }).click();
  await page.getByLabel('Nền ngoài thư').fill('#123456');
  await page.getByRole('button', { name:'Đầu thư', exact:true }).click();
  await page.getByLabel('Tên thương hiệu', {exact:true}).fill('ORORA Studio');
  await expect(page.frameLocator('.mail-preview-frame').getByText('ORORA Studio', {exact:true})).toBeVisible();
  await page.getByRole('button', { name:'Nội dung', exact:true }).click();
  await page.getByLabel('Căn nội dung').selectOption('center');
  const bodyEditor = page.getByLabel('Chỉnh nội dung hiển thị trong thư');
  await bodyEditor.fill('Gợi ý');
  const tools = bodyEditor.locator('xpath=../..');
  await tools.getByRole('button',{name:'Tiêu đề phụ',exact:true}).click();
  const frame = page.frameLocator('.mail-preview-frame');
  await page.getByLabel('Phông chữ nội dung').selectOption('tahoma');
  await expect(frame.getByRole('heading',{name:'Gợi ý'})).toHaveCSS('font-family', /Tahoma/);
  await tools.getByRole('button',{name:'Đoạn văn',exact:true}).click();
  await expect(bodyEditor).toHaveValue('Gợi ý');
  await page.getByRole('slider',{name:/Cỡ chữ nội dung/}).press('End');
  await expect(frame.getByText('Gợi ý',{exact:true})).toHaveCSS('font-size','24px');
  await page.getByRole('button',{name:'HTML · Điện thoại'}).click();
  await expect(frame.getByText('Gợi ý',{exact:true})).toHaveCSS('font-size','15px');
  await page.getByLabel('Chỉnh nội dung hiển thị trong thư').fill('Đoạn đầu\n\nĐoạn sau');
  await page.getByText('Sắp xếp các đoạn nội dung').click();
  await page.getByRole('button', {name:'Đưa đoạn 2 lên'}).click();
  await expect(page.getByLabel('Nội dung thư', {exact:true})).toHaveValue('Đoạn sau\n\nĐoạn đầu');
  await page.getByText('Sửa mã HTML', {exact:true}).click();
  await page.getByLabel('Dùng HTML cho phần nội dung thư').check();
  const code = '<div><h2>Bộ sưu tập</h2>{{content}}</div>';
  await page.getByLabel('Mã HTML nội dung').fill(code);
  await expect(page.frameLocator('.mail-preview-frame').getByRole('heading', {name:'Bộ sưu tập'})).toBeVisible();
  await page.getByLabel('Dùng HTML cho phần nội dung thư').uncheck();
  await expect(page.frameLocator('.mail-preview-frame').getByRole('heading', {name:'Bộ sưu tập'})).toHaveCount(0);
  await page.getByLabel('Dùng HTML cho phần nội dung thư').check();
  await expect(page.getByLabel('Mã HTML nội dung')).toHaveValue(code);
  await page.getByLabel('Tiêu đề thư', {exact:true}).fill('Chào bạn');
  await expect(page.frameLocator('.mail-preview-frame').locator('body')).toHaveCSS('background-color', 'rgb(18, 52, 86)');
  await page.getByRole('button', {name:'Lưu làm thư đăng ký tự động'}).click();
  await expect.poll(() => page.evaluate(() => window.savedMail?.design.background)).toBe('#123456');
});

test('template library finds and duplicates an order template with a personalized preview', async ({page}) => {
  await mount(page, `
    import Library from '/src/admin/MailTemplateLibrary.jsx';
    import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
    const item = {id:'existing',name:'Đơn mới',kind:'order_auto',subject:'Đơn {{orderCode}}',text:'Chào {{customerName}}'};
    const request = async body => {
      if (body) { window.saved = body; return {message:'Đã lưu'}; }
      return {templates:[item], types:[]};
    };
    ${render('R.createElement(ConfirmProvider,null,R.createElement(Library,{request}))')}`);
  await page.getByRole('button',{name:'Đơn mới',exact:true}).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button',{name:'Văn bản thuần'}).click();
  await expect(dialog).toContainText('Chào Nguyễn Minh Anh');
  await dialog.getByRole('button',{name:'Đóng'}).click();
  const viewport = page.viewportSize();
  if (viewport && viewport.width >= 1024) {
    const mainBox = await page.locator('.mail-studio-card .mail-writer-main').boundingBox();
    const previewBox = await page.locator('.mail-studio-card .mail-editor-preview').boundingBox();
    expect(previewBox.x).toBeGreaterThan(mainBox.x + 200);
  }
  await page.getByRole('button',{name:'Nhân bản'}).click();
  await expect(page.getByLabel('Tên mẫu thư')).toHaveValue('Đơn mới (bản sao)');
  await page.getByRole('button',{name:'Lưu mẫu thư',exact:true}).click();
  await expect.poll(() => page.evaluate(() => window.saved?.id)).toMatch(/^[a-f0-9-]{36}$/);
});
