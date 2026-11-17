import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {mount,render,fit} from './fixtures';
test('receipt downloads a PNG and only uses configured safe contact links',async({page})=>{
 const order={code:'OW_TEST',productName:'Sản phẩm mẫu',quantity:1,subtotal:100000,shippingFee:20000,totalAmount:120000,paymentMethod:'cod',recipient:{name:'Người nhận mẫu',phone:'0900000000',address:'Địa chỉ thử nghiệm '.repeat(20)}};
 await mount(page,`import Actions from '/src/components/OrderReceiptActions.jsx';${render(`R.createElement(Actions,{order:${JSON.stringify(order)},home:{footerPhone:'0900000000',footerFacebook:'https://www.facebook.com/orora'}})`)}`);
 await expect(page.getByRole('link',{name:'Xác nhận qua Zalo'})).toHaveAttribute('href','https://zalo.me/0900000000');
 await expect(page.getByRole('link',{name:'Xác nhận qua Facebook'})).toHaveAttribute('href','https://www.facebook.com/orora');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Lưu ảnh đơn hàng'}).click();const file=await download;expect(file.suggestedFilename()).toBe('ORORA-OW_TEST.png');
 const png=await readFile(await file.path());expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect(png.readUInt32BE(20)).toBeGreaterThan(500);await fit(page);
});
