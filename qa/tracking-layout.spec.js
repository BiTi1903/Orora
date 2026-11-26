import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('long order details stay padded inside a single glass surface',async({page},testInfo)=>{
 await mount(page,`import Dialog from '/src/components/ModalDialog.jsx';import Details from '/src/components/OrderTrackingDetails.jsx';import {trackingCopy} from '/src/lib/order-tracking-copy.js';import '/src/styles/product-detail.css';import '/src/styles/mobile-glass.css';${render("R.createElement(Dialog,{title:'Đơn hàng OW_8704B',className:'order-tracking-modal',onClose:()=>{}},R.createElement(Details,{copy:trackingCopy(),order:{code:'OW_8704B',status:'new',productName:'Combo Tự tin & Quyến rũ',quantity:1,paymentMethod:'bank_transfer',subtotal:758000,shippingFee:20000,totalAmount:778000,createdAt:1794746820000,updatedAt:1794746820000}}))")}`);
 await page.evaluate(()=>document.documentElement.setAttribute('data-glass-frames',''));
 const result=page.locator('.order-tracking-result');await expect(result).toHaveCSS('backdrop-filter','none');
 const content=await page.locator('.orora-modal-content').boundingBox();const box=await result.boundingBox();expect(box.x-content.x).toBeGreaterThanOrEqual(15);
 await expect(page.locator('dd').first()).toHaveText('Combo Tự tin & Quyến rũ');
 await expect(page.locator('.is-total dd')).toContainText('778.000');
 const overflow=await result.evaluate(el=>el.scrollWidth>el.clientWidth+1);expect(overflow).toBe(false);
 if(page.viewportSize().width===390)await page.screenshot({path:testInfo.outputPath('tracking-detail.png')});
 await fit(page);
});

test('receipt keeps cancelled and pending orders truthful and honors editable labels',async({page})=>{
 await mount(page,`import Details from '/src/components/OrderTrackingDetails.jsx';import {trackingCopy} from '/src/lib/order-tracking-copy.js';import '/src/styles/product-detail.css';${render("R.createElement('main',{style:{padding:20}},R.createElement(Details,{copy:trackingCopy({productSectionTitle:'Thông tin sản phẩm của bạn',totalLabel:'Cần thanh toán'}),styles:{text:{detailProduct:{color:'#123456'}}},order:{code:'OW_TEST',status:'cancelled',productName:'Sản phẩm thử',paymentMethod:'cod',paymentStatus:'refunded',quantity:2,subtotal:null,shippingFee:null,totalAmount:null}}))")}`);
 await expect(page.getByRole('heading',{name:'Thông tin sản phẩm của bạn'})).toBeVisible();
 await expect(page.locator('.tracking-product-name dd')).toHaveCSS('color','rgb(18, 52, 86)');
 await expect(page.locator('.order-tracking-steps')).toHaveCount(0);
 await expect(page.locator('.tracking-payment-badge')).toHaveText('Đã hoàn tiền');
 await expect(page.locator('.is-total')).toContainText('Cần thanh toán');await expect(page.locator('.is-total dd')).toHaveText('Chờ xác nhận tổng tiền');
 await fit(page);
});

test('admin previews edited receipt labels without looking up a real order',async({page})=>{
 await mount(page,`import {OrderTrackingBuilderPanel,OrderTrackingBuilderPreview} from '/src/admin/builder/SharedBuilderPanels.jsx';function Settings(){const [value,onChange]=R.useState({});return R.createElement(R.Fragment,null,R.createElement(OrderTrackingBuilderPanel,{value,onChange}),R.createElement(OrderTrackingBuilderPreview,{value}))};${render("R.createElement(Settings)")}`);
 await page.getByRole('button',{name:'Kết quả',exact:true}).click();
 await page.getByLabel('Chi tiết — nhóm sản phẩm',{exact:true}).fill('Sản phẩm trong đơn của bạn');
 await expect(page.getByRole('heading',{name:'Sản phẩm trong đơn của bạn',exact:true})).toBeVisible();
 await expect(page.locator('.tracking-order-code')).toHaveText('OW_1024C');
 await expect(page.locator('.is-total dd')).toContainText('280.000');
});
