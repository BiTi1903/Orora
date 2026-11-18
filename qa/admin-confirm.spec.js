import { test, expect } from '@playwright/test';
import { mount, render } from './fixtures';

test('admin confirmation cancels with Escape and returns focus before allowing a new confirmation', async ({ page }) => {
  await mount(page, `
    import ConfirmProvider from '/src/admin/ConfirmDialog.jsx';
    import {useConfirm} from '/src/admin/confirm-context.js';
    function Example() {
      const confirm = useConfirm();
      const [result, setResult] = R.useState('');
      return R.createElement(R.Fragment, null,
        R.createElement('button', { onClick: async () => setResult(await confirm('Xóa mục này?') ? 'Đã xác nhận' : 'Đã hủy') }, 'Mở xác nhận'),
        R.createElement('output', null, result));
    }
    ${render('R.createElement(ConfirmProvider, null, R.createElement(Example))')}`);
  const trigger = page.getByRole('button', { name: 'Mở xác nhận' });
  const dialog = page.getByRole('dialog', { name: 'Xác nhận thao tác' });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Đã hủy');
  await expect(trigger).toBeFocused();
  await trigger.click();
  await dialog.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Đã xác nhận');
});

test('custom chat typography keeps a 16px minimum on mobile and a visible keyboard focus ring', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mount(page, `
    import '/src/styles/chat-button.css';
    ${render("R.createElement('div',{className:'orora-chat-panel is-compact',style:{'--chat-input-font-size':'14px','--chat-input-mobile-size':'12px'}},R.createElement('div',{className:'orora-chat-composer'},R.createElement('textarea',{'aria-label':'Tin nhắn'})))")}`);
  const input = page.getByRole('textbox', { name: 'Tin nhắn' });
  await expect(input).toHaveCSS('font-size', '16px');
  await page.keyboard.press('Tab');
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS('outline-width', '2px');
  await expect(input).toHaveCSS('outline-style', 'solid');
});
