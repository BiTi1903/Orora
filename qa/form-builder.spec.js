import { test, expect } from '@playwright/test';
import { builderPane, mount, render, fit } from './fixtures';

const mocks = {
  'hooks/useHomeContent.js': 'export default function home(){return {loading:false}}',
  'hooks/useProducts.js': 'export default function products(){return {products:[],loading:false}}',
  'hooks/useCategories.js': 'export default function categories(){return {categories:[]}}',
};

test('Visual Builder edits and saves Form giỏ hàng, Form đặt hàng, and Form đã đặt hàng with live preview', async ({ page }) => {
  await mount(
    page,
    `import Builder from '/qa/BuilderHarness.jsx';${render("R.createElement('main',{className:'admin-main'},R.createElement(Builder))")}`,
    {
      ...mocks,
      'lib/api.js': `export const getProduct=async()=>null;export const getHomeContent=async()=>({navLogo:'ORORA',navStyles:{cart:{copy:{title:'Giỏ hàng'}}},productDetailStyles:{purchaseOptions:{orderSubmitLabel:'Đặt hàng ngay'}}});export const saveHomeContent=async value=>{window.__saved=value};`,
    },
  );

  // 1. Form giỏ hàng — click directly on specific elements
  await page.locator('.builder-sections').getByRole('button', { name: /Form giỏ hàng/ }).click();
  const frame = page.frameLocator('iframe');
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('heading', { name: 'Giỏ hàng' })).toBeVisible();
  await builderPane(page,'Chỉnh sửa');
  await page.getByLabel('Tiêu đề giỏ hàng', { exact: true }).fill('Túi mua sắm');
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('heading', { name: 'Túi mua sắm' })).toBeVisible();
  await builderPane(page,'Xem trước');
  await frame.locator('[data-builder-key="cartItemName"]').first().click();
  await expect(page.getByText('Nội dung hiển thị tự động theo sản phẩm / đơn hàng. Bộ chỉnh này chỉ thay đổi giao diện hiển thị.')).toBeVisible();
  await expect(page.getByLabel('Tiêu đề giỏ hàng', { exact: true })).toHaveCount(0);
  await builderPane(page,'Xem trước');
  await frame.locator('[data-builder-key="cartBuyNow"]').click();
  await builderPane(page,'Chỉnh sửa');
  await page.getByLabel('Chữ nút Mua ngay', { exact: true }).fill('Đặt toàn bộ');
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('button', { name: 'Đặt toàn bộ' })).toBeVisible();

  // 2. Form đặt hàng — click directly on specific elements
  await page.locator('.builder-sections').getByRole('button', { name: /Form đặt hàng/ }).click();
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('heading', { name: 'Đặt hàng trên website' })).toBeVisible();
  await builderPane(page,'Chỉnh sửa');
  await page.getByLabel('Tiêu đề hộp thoại', { exact: true }).fill('Đặt hàng nhanh');
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('heading', { name: 'Đặt hàng nhanh' })).toBeVisible();
  await builderPane(page,'Xem trước');
  await frame.locator('[data-builder-key="ofPrice"]').click();
  await expect(page.getByText('Nội dung hiển thị tự động theo sản phẩm / đơn hàng. Bộ chỉnh này chỉ thay đổi giao diện hiển thị.')).toBeVisible();
  await builderPane(page,'Xem trước');
  await frame.locator('[data-builder-key="ofSubmit"]').click();
  await builderPane(page,'Chỉnh sửa');
  await page.getByLabel('Chữ nút gửi đơn', { exact: true }).fill('Xác nhận đơn');
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('button', { name: 'Xác nhận đơn' })).toBeVisible();

  // 3. Form đã đặt hàng — click directly on specific elements
  await page.locator('.builder-sections').getByRole('button', { name: /Form đã đặt hàng/ }).click();
  await builderPane(page,'Xem trước');
  await expect(frame.getByRole('heading', { name: 'Đã nhận đơn hàng' })).toBeVisible();
  await builderPane(page,'Chỉnh sửa');
  await page.getByLabel('Nhãn mã đơn hàng', { exact: true }).fill('Mã đơn của bạn');
  await builderPane(page,'Xem trước');
  await expect(frame.getByText('Mã đơn của bạn', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: '💾 Lưu tất cả', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.__saved)).toEqual({
    navStyles: {
      cart: {
        copy: {
          title: 'Túi mua sắm',
          buyNow: 'Đặt toàn bộ',
        },
      },
    },
    productDetailStyles: {
      purchaseOptions: {
        formLabels: {
          title: 'Đặt hàng nhanh',
        },
        orderSubmitLabel: 'Xác nhận đơn',
        receiptCodeLabel: 'Mã đơn của bạn',
      },
    },
  });
  await fit(page);
});
