import {test,expect} from '@playwright/test';
import {mount,render,fit} from './fixtures';
test('long order details stay padded inside a single glass surface',async({page})=>{
 await mount(page,`import Dialog from '/src/components/ModalDialog.jsx';import Details from '/src/components/OrderTrackingDetails.jsx';import {trackingCopy} from '/src/lib/order-tracking-copy.js';import '/src/styles/product-detail.css';import '/src/styles/mobile-glass.css';${render("R.createElement(Dialog,{title:'Đơn hàng OW_8704B',className:'order-tracking-modal',onClose:()=>{}},R.createElement(Details,{copy:trackingCopy(),order:{code:'OW_8704B',status:'new',productName:'Combo Tự tin & Quyến rũ',quantity:1,paymentMethod:'bank_transfer',subtotal:758000,shippingFee:20000,totalAmount:778000,createdAt:1794746820000,updatedAt:1794746820000}}))")}`);
 await page.evaluate(()=>document.documentElement.setAttribute('data-glass-frames',''));
 const result=page.locator('.order-tracking-result');await expect(result).toHaveCSS('backdrop-filter','none');
 const content=await page.locator('.orora-modal-content').boundingBox();const box=await result.boundingBox();expect(box.x-content.x).toBeGreaterThanOrEqual(15);
 await expect(page.locator('dd').first()).toHaveText('Combo Tự tin & Quyến rũ');
 await expect(page.locator('.is-total dd')).toContainText('778.000');
 const overflow=await result.evaluate(el=>el.scrollWidth>el.clientWidth+1);expect(overflow).toBe(false);
 if(page.viewportSize().width===390)await page.screenshot({path:'/workspace/work/tracking-detail-after.png'});
 await fit(page);
});
