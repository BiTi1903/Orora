import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {mount,render,fit} from './fixtures';
test('receipt uses Web Share API with PNG file on Zalo click when supported and respects user cancel without silent download',async({page})=>{
 const order={code:'OW_TEST',productName:'Sản phẩm mẫu',quantity:1,subtotal:100000,shippingFee:20000,totalAmount:120000,paymentMethod:'cod',recipient:{name:'Người nhận mẫu',phone:'0900000000',address:'Địa chỉ thử nghiệm'}};
 await mount(page,`
  window.__shared=[];
  window.__shareMode='ok';
  Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>Boolean(data?.files?.length)});
  Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{
   window.__shared.push({title:data.title,fileName:data.files?.[0]?.name,type:data.files?.[0]?.type,size:data.files?.[0]?.size});
   if(window.__shareMode==='cancel'){const e=new Error('cancelled');e.name='AbortError';throw e;}
  }});
  import '/src/styles/checkout.css';import Actions from '/src/components/OrderReceiptActions.jsx';${render(`R.createElement(Actions,{order:${JSON.stringify(order)},home:{footerPhone:'0900000000'}})`)}
 `);
 let downloaded=false;
 page.on('download',()=>{downloaded=true;});
 const zaloLink=page.getByRole('link',{name:'Xác nhận qua Zalo'});
 await expect(zaloLink).toHaveAttribute('data-receipt-ready','true');
 await zaloLink.click();
 await expect(page.locator('.receipt-download-note')).toContainText('Đã mở chia sẻ kèm ảnh đơn hàng');
 const shared=await page.evaluate(()=>window.__shared);
 expect(shared).toHaveLength(1);
 expect(shared[0].fileName).toBe('ORORA-OW_TEST.png');
 expect(shared[0].type).toBe('image/png');
 expect(shared[0].size).toBeGreaterThan(500);
 expect(downloaded).toBe(false);
 await page.evaluate(()=>{window.__shareMode='cancel';});
 await zaloLink.click();
 await expect(page.locator('.receipt-download-note')).toContainText('Đã hủy chia sẻ');
 expect(downloaded).toBe(false);
});
test('receipt falls back to download on second click when Web Share throws NotAllowedError',async({page})=>{
 const order={code:'OW_TEST',productName:'Sản phẩm mẫu',quantity:1,subtotal:100000,shippingFee:20000,totalAmount:120000,paymentMethod:'cod',recipient:{name:'Người nhận mẫu',phone:'0900000000',address:'Địa chỉ thử nghiệm'}};
 await mount(page,`
  Object.defineProperty(navigator,'canShare',{configurable:true,value:data=>Boolean(data?.files?.length)});
  Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{const e=new Error('not allowed');e.name='NotAllowedError';throw e;}});
  import '/src/styles/checkout.css';import Actions from '/src/components/OrderReceiptActions.jsx';${render(`R.createElement(Actions,{order:${JSON.stringify(order)},home:{footerPhone:'0900000000'}})`)}
 `);
 let downloads=0;
 page.on('download',()=>{downloads++;});
 const zaloLink=page.getByRole('link',{name:'Xác nhận qua Zalo'});
 await expect(zaloLink).toHaveAttribute('data-receipt-ready','true');
 await zaloLink.click();
 await expect(page.locator('.receipt-download-note')).toContainText('Chưa mở được hộp chia sẻ');
 expect(downloads).toBe(0);
 await zaloLink.evaluate(node=>node.addEventListener('click',e=>e.preventDefault(),{once:true}));
 const zaloDownload=page.waitForEvent('download');await zaloLink.click();const zaloFile=await zaloDownload;
 expect(zaloFile.suggestedFilename()).toBe('ORORA-OW_TEST.png');
 expect(downloads).toBe(1);
 await expect(page.locator('.receipt-download-note')).toContainText('Đã lưu ảnh đơn hàng');
});
test('receipt downloads a PNG on save or Zalo fallback when Web Share with files is unsupported',async({page})=>{
 const order={code:'OW_TEST',productName:'Sản phẩm mẫu',quantity:1,subtotal:100000,shippingFee:20000,totalAmount:120000,paymentMethod:'cod',recipient:{name:'Người nhận mẫu',phone:'0900000000',address:'Địa chỉ thử nghiệm '.repeat(20)}};
 await mount(page,`
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
  import '/src/styles/checkout.css';import Actions from '/src/components/OrderReceiptActions.jsx';${render(`R.createElement(Actions,{order:${JSON.stringify(order)},home:{footerPhone:'0900000000',footerFacebook:'https://www.facebook.com/orora'}})`)}
 `);
 const zaloLink=page.getByRole('link',{name:'Xác nhận qua Zalo'});
 await expect(zaloLink).toHaveAttribute('href','https://zalo.me/0900000000');
 await expect(zaloLink).toHaveAttribute('data-receipt-ready','true');
 await expect(page.getByRole('link',{name:'Xác nhận qua Facebook'})).toHaveAttribute('href','https://www.facebook.com/orora');
 await zaloLink.evaluate(node=>node.addEventListener('click',e=>e.preventDefault(),{once:true}));
 const zaloDownload=page.waitForEvent('download');await zaloLink.click();const zaloFile=await zaloDownload;expect(zaloFile.suggestedFilename()).toBe('ORORA-OW_TEST.png');
 await expect(page.locator('.receipt-download-note')).toContainText('Đã lưu ảnh đơn hàng');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Lưu ảnh đơn hàng'}).click();const file=await download;expect(file.suggestedFilename()).toBe('ORORA-OW_TEST.png');
 const png=await readFile(await file.path());expect(png.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect(png.readUInt32BE(20)).toBeGreaterThan(500);expect(await page.getByRole('button',{name:'Lưu ảnh đơn hàng'}).locator('svg').count()).toBe(1);await fit(page);
});
test('receipt Zalo fallback reports an error instead of saved when download fails',async({page})=>{
 const order={code:'OW_FAIL',productName:'Sản phẩm mẫu',quantity:1,subtotal:100000,shippingFee:20000,totalAmount:120000,paymentMethod:'cod',recipient:{name:'Người nhận mẫu',phone:'0900000000',address:'Địa chỉ thử nghiệm'}};
 await mount(page,`
  Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>false});
  import '/src/styles/checkout.css';import Actions from '/src/components/OrderReceiptActions.jsx';${render(`R.createElement(Actions,{order:${JSON.stringify(order)},home:{footerPhone:'0900000000'}})`)}
 `,{'lib/order-receipt.js':'export const renderOrderReceiptBlob=async()=>{throw Error("canvas failed")};export const shareOrderReceiptBlob=()=>null;export const downloadOrderReceipt=async()=>{throw Error("download failed")};'});
 const zaloLink=page.getByRole('link',{name:'Xác nhận qua Zalo'});
 await zaloLink.evaluate(node=>node.addEventListener('click',e=>e.preventDefault(),{once:true}));
 await zaloLink.click();
 await expect(page.getByRole('alert')).toContainText('Chưa lưu được ảnh đơn hàng');
 await expect(page.locator('.receipt-download-note')).not.toContainText('Đã lưu ảnh đơn hàng');
});
